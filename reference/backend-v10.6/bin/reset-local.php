<?php
declare(strict_types=1);
require dirname(__DIR__).'/src/bootstrap.php'; use CoalUp\CRM\Storage\JsonStore; $config=require dirname(__DIR__).'/config/app.php';
if (($argv[1]??'')!=='--yes') { fwrite(STDERR,"Use --yes para confirmar o reset do storage LOCAL.\n"); exit(2); }
(new JsonStore($config['data_file']))->reset(); echo "Storage local reiniciado.\n";
