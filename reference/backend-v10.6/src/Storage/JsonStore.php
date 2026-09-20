<?php
declare(strict_types=1);
namespace CoalUp\CRM\Storage;

final class JsonStore {
    private string $lockFile;
    public function __construct(private readonly string $file) {
        $dir=dirname($file); if (!is_dir($dir) && !mkdir($dir,0700,true) && !is_dir($dir)) throw new \RuntimeException('Não foi possível criar diretório de dados.');
        $this->lockFile=$file.'.lock';
    }
    public static function emptyState(): array { return [
        '_meta'=>['format'=>1,'updated_at'=>null],
        'users'=>[], 'sessions'=>[], 'rate_limits'=>[],
        'funnels'=>[], 'funnel_versions'=>[], 'stages'=>[], 'requirements'=>[],
        'organizations'=>[], 'contacts'=>[], 'leads'=>[], 'opportunities'=>[], 'cases'=>[],
        'tasks'=>[], 'activities'=>[], 'proposals'=>[], 'dossier_entries'=>[], 'notes'=>[],
        'stage_events'=>[], 'domain_events'=>[], 'audit_events'=>[], 'mutation_keys'=>[]
    ]; }
    public function read(): array {
        $lock=fopen($this->lockFile,'c+'); if (!$lock) throw new \RuntimeException('Falha ao abrir lock do storage.');
        try { if (!flock($lock,LOCK_SH)) throw new \RuntimeException('Falha ao obter lock de leitura.'); $s=$this->loadUnlocked(); flock($lock,LOCK_UN); return $s; }
        finally { fclose($lock); }
    }
    public function transaction(callable $fn): mixed {
        $lock=fopen($this->lockFile,'c+'); if (!$lock) throw new \RuntimeException('Falha ao abrir lock do storage.');
        try {
            if (!flock($lock,LOCK_EX)) throw new \RuntimeException('Falha ao obter lock de escrita.');
            $state=$this->loadUnlocked();
            $result=$fn($state);
            $state['_meta']['updated_at']=gmdate('Y-m-d\\TH:i:s\\Z');
            $this->writeUnlocked($state);
            flock($lock,LOCK_UN);
            return $result;
        } finally { fclose($lock); }
    }
    public function reset(): void {
        $this->transaction(function(array &$s): void { $s=self::emptyState(); });
    }
    private function loadUnlocked(): array {
        if (!is_file($this->file)) return self::emptyState();
        $raw=file_get_contents($this->file); if ($raw===false || trim($raw)==='') return self::emptyState();
        try { $s=json_decode($raw,true,512,JSON_THROW_ON_ERROR); }
        catch (\JsonException $e) { throw new \RuntimeException('Storage local corrompido: '.$e->getMessage()); }
        return array_replace_recursive(self::emptyState(), is_array($s)?$s:[]);
    }
    private function writeUnlocked(array $state): void {
        $json=json_encode($state,JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES|JSON_PRETTY_PRINT|JSON_THROW_ON_ERROR);
        $tmp=$this->file.'.tmp';
        if (file_put_contents($tmp,$json,LOCK_EX)===false) throw new \RuntimeException('Falha ao gravar storage temporário.');
        @chmod($tmp,0600);
        if (!rename($tmp,$this->file)) { @unlink($tmp); throw new \RuntimeException('Falha ao confirmar storage local.'); }
        @chmod($this->file,0600);
    }
}
