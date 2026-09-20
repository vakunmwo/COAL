<?php
declare(strict_types=1);
require dirname(__DIR__).'/src/bootstrap.php';
use CoalUp\CRM\Storage\JsonStore;
$config=require dirname(__DIR__).'/config/app.php'; $store=new JsonStore($config['data_file']);
$name=trim((string)getenv('COALUP_BOOTSTRAP_NAME')); $login=trim((string)getenv('COALUP_BOOTSTRAP_LOGIN')); $password=(string)getenv('COALUP_BOOTSTRAP_PASSWORD');
if ($name===''||$login===''||strlen($password)<12) { fwrite(STDERR,"Defina COALUP_BOOTSTRAP_NAME, COALUP_BOOTSTRAP_LOGIN e senha >= 12 caracteres.\n"); exit(2); }
$id=$store->transaction(function(array &$s) use($name,$login,$password): string { foreach($s['users'] as $u) if($u['login']===$login) throw new RuntimeException('Login já existe.'); $id=coalup_uuid(); $s['users'][$id]=['id'=>$id,'name'=>$name,'login'=>$login,'password_hash'=>password_hash($password,PASSWORD_ARGON2ID),'role'=>'operator','status'=>'active','auth_version'=>1,'mfa_enabled'=>false,'created_at'=>coalup_now(),'updated_at'=>coalup_now(),'version'=>1]; return $id; });
echo "Usuário local criado: {$id}\n";
