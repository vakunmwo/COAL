<?php
declare(strict_types=1);

require dirname(__DIR__).'/src/bootstrap.php';

use CoalUp\CRM\Domain\FunnelService;
use CoalUp\CRM\Http\ApiException;
use CoalUp\CRM\Http\Request;
use CoalUp\CRM\Http\Response;
use CoalUp\CRM\Http\Router;
use CoalUp\CRM\Security\AuthService;
use CoalUp\CRM\Storage\JsonStore;

$config=require dirname(__DIR__).'/config/app.php';
$store=new JsonStore($config['data_file']);
$auth=new AuthService($store,$config);
$funnel=new FunnelService($store);
$router=new Router();

$router->add('POST','/crm/api/v1/auth/login',function(Request $r) use($auth): Response {
    $res=$auth->login((string)($r->json['login']??''),(string)($r->json['password']??''),$r->ip,$r->userAgent);
    return Response::json(['data'=>['user'=>$res['user'],'csrf_token'=>$res['csrf_token']],'meta'=>['server_time'=>\coalup_now()]],200,[],[$auth->cookie($res['raw_token'])]);
},false,false);
$router->add('GET','/crm/api/v1/auth/me',fn(Request $r,array $p,array $a)=>Response::json(['data'=>['user'=>$auth->publicUser($a['user'])],'meta'=>['server_time'=>\coalup_now()]]),true,false);
$router->add('POST','/crm/api/v1/auth/logout',function(Request $r,array $p,array $a) use($auth): Response { $auth->logout($a['session']); return Response::json(['data'=>['logged_out'=>true],'meta'=>['server_time'=>\coalup_now()]],200,[],[$auth->expiredCookie()]); },true,true);
$router->add('GET','/crm/api/v1/funnel/board',fn(Request $r)=>Response::json(['data'=>$funnel->board($r->query),'meta'=>['server_time'=>\coalup_now()]]),true,false);
$router->add('GET','/crm/api/v1/funnel/followups',fn(Request $r)=>Response::json(['data'=>$funnel->followups(),'meta'=>['server_time'=>\coalup_now()]]),true,false);
$router->add('GET','/crm/api/v1/proposals',fn(Request $r)=>Response::json(['data'=>$funnel->proposals($r->query),'meta'=>['server_time'=>\coalup_now()]]),true,false);
$router->add('GET','/crm/api/v1/commercial-cases/{caseId}',fn(Request $r,array $p)=>Response::json(['data'=>$funnel->caseDetail($p['caseId']),'meta'=>['server_time'=>\coalup_now()]]),true,false);
$router->add('POST','/crm/api/v1/commercial-cases/{caseId}/activities',function(Request $r,array $p,array $a) use($funnel): Response { $x=$funnel->registerActivity($p['caseId'],$r->json,$a['user'],ctx($r)); return mutationResponse($x); },true,true);
$router->add('PUT','/crm/api/v1/commercial-cases/{caseId}/next-action',function(Request $r,array $p,array $a) use($funnel): Response { $x=$funnel->setNextAction($p['caseId'],$r->json,$a['user'],ctx($r)); return mutationResponse($x); },true,true);
$router->add('POST','/crm/api/v1/commercial-cases/{caseId}/transition',function(Request $r,array $p,array $a) use($funnel): Response { $x=$funnel->transition($p['caseId'],$r->json,$a['user'],ctx($r)); return mutationResponse($x); },true,true);
$router->add('POST','/crm/api/v1/tasks/{taskId}/complete',function(Request $r,array $p,array $a) use($funnel): Response { $x=$funnel->completeTask($p['taskId'],$r->json,$a['user'],ctx($r)); return mutationResponse($x); },true,true);

try {
    $request=Request::fromGlobals(); [$route,$params]=$router->match($request); $actor=[];
    if ($route['auth']) { $actor=$auth->authenticate($request); if ($route['csrf']) $auth->assertCsrf($request,$actor['session']); }
    $handler=$route['handler']; $response=$handler($request,$params,$actor); if (!$response instanceof Response) throw new \RuntimeException('Handler não retornou Response.'); $response->send();
} catch (ApiException $e) {
    $requestId=$_SERVER['HTTP_X_REQUEST_ID']??\coalup_uuid();
    Response::json(['error'=>['code'=>$e->apiCode,'message'=>$e->getMessage(),'fields'=>$e->fields ?: (object)[],'current_version'=>$e->currentVersion,'request_id'=>$requestId]],$e->status)->send();
} catch (\Throwable $e) {
    error_log('[COALUP V10.6] '.$e::class.': '.$e->getMessage()); $requestId=$_SERVER['HTTP_X_REQUEST_ID']??\coalup_uuid();
    Response::json(['error'=>['code'=>'internal_error','message'=>'O CRM encontrou uma falha inesperada. Nenhuma confirmação de sucesso foi emitida.','fields'=>(object)[],'current_version'=>null,'request_id'=>$requestId]],500)->send();
}

function ctx(Request $r): array { $request=$r->header('x-request-id') ?: \coalup_uuid(); return ['request_id'=>$request,'correlation_id'=>$r->header('x-correlation-id') ?: $request,'idempotency_key'=>$r->header('idempotency-key') ?: '']; }
function mutationResponse(array $x): Response { return Response::json(['data'=>$x['result'],'meta'=>['idempotent_replay'=>$x['replayed'],'server_time'=>\coalup_now()]]); }
