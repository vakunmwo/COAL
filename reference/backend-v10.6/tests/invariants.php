<?php
declare(strict_types=1);
$path=$argv[1]??'';
if($path===''||!is_file($path)){fwrite(STDERR,"Informe o local-store.json.\n");exit(2);} 
$s=json_decode(file_get_contents($path),true,512,JSON_THROW_ON_ERROR);
$errors=[];
foreach($s['cases'] as $c){
    $tid=$c['next_action_task_id']??null;
    if($tid!==null){
        if(!isset($s['tasks'][$tid]))$errors[]="case {$c['id']} aponta para task inexistente";
        elseif(($s['tasks'][$tid]['commercial_case_id']??null)!==$c['id'])$errors[]="case {$c['id']} aponta para task de outro case";
        elseif(($s['tasks'][$tid]['status']??null)!=='open')$errors[]="case {$c['id']} aponta para task não aberta";
    }
}
$byTransition=[];
foreach($s['stage_events'] as $e){$byTransition[$e['transition_id']][]=$e;}
foreach($byTransition as $tr=>$events){
    $exits=array_values(array_filter($events,fn($e)=>$e['event_type']==='exit'));
    if($exits){
        $enters=array_values(array_filter($events,fn($e)=>$e['event_type']==='enter'));
        if(count($exits)!==1||count($enters)!==1)$errors[]="transition $tr não tem exatamente 1 exit + 1 enter";
        elseif(($exits[0]['commercial_case_id']??null)!==($enters[0]['commercial_case_id']??null))$errors[]="transition $tr mistura cases";
    }
}
foreach($s['opportunities'] as $o){if(array_key_exists('stage',$o)||array_key_exists('next_action_at',$o))$errors[]="opportunity {$o['id']} contém verdade proibida de stage/next-action";}
foreach($s['sessions'] as $sess){if(strlen((string)($sess['token_hash']??''))!==64)$errors[]="session sem token hash sha256";if(strlen((string)($sess['csrf_token_hash']??''))!==64)$errors[]="session sem csrf hash sha256";}
if($errors){foreach($errors as $e)fwrite(STDERR,"FAIL: $e\n");exit(1);} 
echo "INVARIANTS PASS: next-action pointers, stage transitions, opportunity truth, session hashes\n";
