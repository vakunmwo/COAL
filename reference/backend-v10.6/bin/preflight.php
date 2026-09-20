<?php
declare(strict_types=1);
require dirname(__DIR__).'/src/bootstrap.php';
$config=require dirname(__DIR__).'/config/app.php';
$algos=password_algos();
$result=[
    'php_version'=>PHP_VERSION,
    'php_8_2_plus'=>version_compare(PHP_VERSION,'8.2.0','>='),
    'argon2id'=>in_array('argon2id',$algos,true),
    'json_extension'=>extension_loaded('json'),
    'pdo'=>extension_loaded('PDO'),
    'pdo_mysql'=>extension_loaded('pdo_mysql'),
    'mysqli'=>extension_loaded('mysqli'),
    'openssl'=>extension_loaded('openssl'),
    'sodium'=>extension_loaded('sodium'),
    'app_env'=>$config['env'],
    'cookie_secure'=>$config['cookie_secure'],
    'data_dir'=>dirname($config['data_file']),
    'data_dir_writable'=>is_dir(dirname($config['data_file'])) ? is_writable(dirname($config['data_file'])) : is_writable(dirname(dirname($config['data_file']))),
];
echo json_encode($result,JSON_PRETTY_PRINT|JSON_UNESCAPED_SLASHES|JSON_THROW_ON_ERROR).PHP_EOL;
$localOk=$result['php_8_2_plus']&&$result['argon2id']&&$result['json_extension']&&$result['openssl'];
exit($localOk?0:1);
