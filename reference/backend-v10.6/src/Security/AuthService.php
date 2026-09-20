<?php
declare(strict_types=1);
namespace CoalUp\CRM\Security;

use CoalUp\CRM\Http\ApiException;
use CoalUp\CRM\Http\Request;
use CoalUp\CRM\Storage\JsonStore;

final class AuthService {
    public function __construct(private readonly JsonStore $store, private readonly array $config) {}

    public function login(string $login,string $password,?string $ip,?string $userAgent): array {
        $login=trim($login); if ($login==='' || $password==='') throw new ApiException(422,'validation_error','Informe usuário e senha.');
        $ipHash=$this->ipHash($ip);
        $result=$this->store->transaction(function(array &$s) use($login,$password,$ipHash,$userAgent): array {
            $this->assertRateLimit($s,$login,$ipHash);
            $user=null; foreach ($s['users'] as $u) if (hash_equals((string)$u['login'],$login)) { $user=$u; break; }
            if (!$user || ($user['status']??'')!=='active' || !password_verify($password,(string)$user['password_hash'])) {
                $this->registerFailure($s,$login,$ipHash);
                return ['error'=>'invalid_credentials'];
            }
            if (!empty($user['mfa_enabled'])) return ['error'=>'mfa_required_not_implemented'];
            $this->clearRateLimit($s,$login,$ipHash);
            $token=bin2hex(random_bytes(32)); $csrf=bin2hex(random_bytes(32)); $sid=\coalup_uuid();
            $session=[
                'id'=>$sid,'user_id'=>$user['id'],'token_hash'=>hash('sha256',$token),'csrf_token_hash'=>hash('sha256',$csrf),
                'ip_hash'=>$ipHash,'user_agent'=>substr((string)$userAgent,0,500),'created_at'=>\coalup_now(),'last_seen_at'=>\coalup_now(),
                'expires_at'=>\coalup_plus_seconds((int)$this->config['session_ttl_seconds']),'revoked_at'=>null,'revoke_reason'=>null,'auth_version'=>(int)$user['auth_version']
            ];
            $s['sessions'][$sid]=$session;
            return ['user'=>$this->publicUser($user),'session'=>$session,'raw_token'=>$token,'csrf_token'=>$csrf];
        });
        if (($result['error']??null)==='invalid_credentials') throw new ApiException(401,'invalid_credentials','Usuário ou senha inválidos.');
        if (($result['error']??null)==='mfa_required_not_implemented') throw new ApiException(422,'mfa_required_not_implemented','Esta fatia local ainda não implementa o desafio MFA.');
        return $result;
    }

    public function authenticate(Request $request): array {
        $raw=$request->cookies[$this->config['cookie_name']] ?? null;
        if (!is_string($raw) || $raw==='') throw new ApiException(401,'session_required','Sessão necessária.');
        $hash=hash('sha256',$raw); $s=$this->store->read(); $session=null;
        foreach ($s['sessions'] as $row) if (hash_equals((string)$row['token_hash'],$hash)) { $session=$row; break; }
        if (!$session || $session['revoked_at']!==null || \coalup_ts($session['expires_at'])<=time()) throw new ApiException(401,'session_expired','Sessão ausente ou expirada.');
        $user=$s['users'][$session['user_id']] ?? null;
        if (!$user || ($user['status']??'')!=='active' || (int)$user['auth_version']!==(int)$session['auth_version']) throw new ApiException(401,'session_revoked','A sessão não é mais válida.');
        return ['user'=>$user,'session'=>$session];
    }

    public function assertCsrf(Request $request,array $session): void {
        $token=$request->header('x-csrf-token');
        if (!is_string($token) || $token==='' || !hash_equals((string)$session['csrf_token_hash'],hash('sha256',$token))) throw new ApiException(403,'csrf_failed','Token CSRF inválido ou ausente.');
    }

    public function logout(array $session): void {
        $this->store->transaction(function(array &$s) use($session): void {
            if (isset($s['sessions'][$session['id']])) { $s['sessions'][$session['id']]['revoked_at']=\coalup_now(); $s['sessions'][$session['id']]['revoke_reason']='logout'; }
        });
    }

    public function cookie(string $token): array { return ['name'=>$this->config['cookie_name'],'value'=>$token,'options'=>['expires'=>time()+(int)$this->config['session_ttl_seconds'],'path'=>'/crm','secure'=>(bool)$this->config['cookie_secure'],'httponly'=>true,'samesite'=>'Strict']]; }
    public function expiredCookie(): array { return ['name'=>$this->config['cookie_name'],'value'=>'','options'=>['expires'=>time()-3600,'path'=>'/crm','secure'=>(bool)$this->config['cookie_secure'],'httponly'=>true,'samesite'=>'Strict']]; }
    public function publicUser(array $u): array { return ['id'=>$u['id'],'name'=>$u['name'],'login'=>$u['login'],'role'=>$u['role']]; }

    private function ipHash(?string $ip): ?string { return $ip?hash_hmac('sha256',$ip,(string)$this->config['hash_key']):null; }
    private function rateKey(string $login,?string $ipHash): string { return hash('sha256',strtolower($login).'|'.($ipHash??'no-ip')); }
    private function assertRateLimit(array &$s,string $login,?string $ipHash): void {
        $k=$this->rateKey($login,$ipHash); $row=$s['rate_limits'][$k]??null; if (!$row) return;
        $window=(int)$this->config['login_rate_limit']['window_seconds'];
        if (time()-(int)$row['window_started_at']>$window) { unset($s['rate_limits'][$k]); return; }
        if ((int)$row['attempts'] >= (int)$this->config['login_rate_limit']['max_attempts']) throw new ApiException(429,'login_rate_limited','Muitas tentativas. Aguarde antes de tentar novamente.');
    }
    private function registerFailure(array &$s,string $login,?string $ipHash): void {
        $k=$this->rateKey($login,$ipHash); $row=$s['rate_limits'][$k]??['attempts'=>0,'window_started_at'=>time()]; $row['attempts']=(int)$row['attempts']+1; $s['rate_limits'][$k]=$row;
    }
    private function clearRateLimit(array &$s,string $login,?string $ipHash): void { unset($s['rate_limits'][$this->rateKey($login,$ipHash)]); }
}
