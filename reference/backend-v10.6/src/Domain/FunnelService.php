<?php
declare(strict_types=1);
namespace CoalUp\CRM\Domain;

use CoalUp\CRM\Http\ApiException;
use CoalUp\CRM\Storage\JsonStore;

final class FunnelService {
    private ?string $activeCorrelationId = null;
    public function __construct(private readonly JsonStore $store) {}

    public function board(array $filters=[]): array {
        $s=$this->store->read(); [$funnel,$version]=$this->activeFunnel($s);
        $stages=$this->stagesForVersion($s,$version['id']);
        $cases=array_values(array_filter($s['cases'],fn($c)=>$c['funnel_version_id']===$version['id'] && $c['status']==='open' && empty($c['archived_at'])));
        $cases=array_values(array_filter($cases,fn($c)=>$this->caseMatches($s,$c,$filters)));
        $caseIds=array_flip(array_column($cases,'id'));
        $openProposals=count(array_filter($s['proposals'],fn($p)=>isset($caseIds[$p['commercial_case_id']]) && in_array($p['status'],['draft','sent'],true) && empty($p['archived_at'])));
        $cards=array_map(fn($c)=>$this->caseCard($s,$c),$cases);
        $summary=['open_cases'=>count($cases),'potential_amount_cents'=>array_sum(array_map(fn($x)=>(int)($x['opportunity']['amount_cents']??0),$cards)),'open_proposals'=>$openProposals,'attention_cases'=>count(array_filter($cards,fn($x)=>$x['attention']['needs_attention']))];
        $out=[];
        foreach ($stages as $stage) {
            $stageCases=array_values(array_filter($cards,fn($x)=>$x['stage']['id']===$stage['id']));
            $out[]=['id'=>$stage['id'],'key'=>$stage['stage_key'],'name'=>$stage['name'],'position'=>$stage['position'],'current_count'=>count($stageCases),'current_potential_cents'=>array_sum(array_map(fn($x)=>(int)($x['opportunity']['amount_cents']??0),$stageCases)),'observed_average_seconds'=>$this->observedAverageSeconds($s,$stage['id']),'sla_days'=>$stage['sla_days'],'attention_count'=>count(array_filter($stageCases,fn($x)=>$x['attention']['needs_attention'])),'cases'=>$stageCases];
        }
        return ['funnel'=>['id'=>$funnel['id'],'name'=>$funnel['name'],'version_id'=>$version['id'],'version_number'=>$version['version_number']],'summary'=>$summary,'stages'=>$out];
    }

    public function followups(): array {
        $s=$this->store->read(); $groups=['overdue'=>[],'today'=>[],'upcoming'=>[],'missing_next_action'=>[]]; $today=gmdate('Y-m-d');
        foreach ($s['cases'] as $c) {
            if ($c['status']!=='open' || !empty($c['archived_at'])) continue;
            $card=$this->caseCard($s,$c); $task=$card['next_action'];
            if (!$task) { $groups['missing_next_action'][]=$card; continue; }
            $date=substr((string)($task['due_at']??''),0,10);
            if ($date!=='' && $date<$today) $groups['overdue'][]=$card;
            elseif ($date===$today) $groups['today'][]=$card;
            else $groups['upcoming'][]=$card;
        }
        return $groups;
    }

    public function proposals(array $filters=[]): array {
        $s=$this->store->read(); $rows=[];
        foreach ($s['proposals'] as $p) {
            if (!empty($p['archived_at'])) continue;
            if (isset($filters['status']) && $filters['status']!=='' && $p['status']!==$filters['status']) continue;
            $c=$s['cases'][$p['commercial_case_id']]??null; if (!$c) continue;
            if (isset($filters['commercial_case_id']) && $filters['commercial_case_id']!=='' && $c['id']!==$filters['commercial_case_id']) continue;
            if (isset($filters['owner_id']) && $filters['owner_id']!=='' && $c['owner_id']!==$filters['owner_id']) continue;
            $org=$s['organizations'][$p['organization_id']]??null; $stage=$s['stages'][$c['current_stage_id']]??null; $owner=$c['owner_id']?($s['users'][$c['owner_id']]??null):null;
            $rows[]=['id'=>$p['id'],'version'=>$p['version'],'commercial_case_id'=>$c['id'],'organization_name'=>$org['name']??'','amount_cents'=>$p['amount_cents'],'currency'=>$p['currency'],'status'=>$p['status'],'created_at'=>$p['created_at'],'sent_at'=>$p['sent_at'],'followup_due_at'=>$p['followup_due_at'],'stage_name'=>$stage['name']??'','owner_name'=>$owner['name']??null];
        }
        return $rows;
    }

    public function caseDetail(string $caseId): array {
        $s=$this->store->read(); $c=$s['cases'][$caseId]??null; if (!$c) throw new ApiException(404,'case_not_found','Venda não encontrada.');
        $org=$s['organizations'][$c['organization_id']]??null; $contact=$c['primary_contact_id']?($s['contacts'][$c['primary_contact_id']]??null):null; $lead=$c['lead_id']?($s['leads'][$c['lead_id']]??null):null; $opp=$c['opportunity_id']?($s['opportunities'][$c['opportunity_id']]??null):null; $stage=$s['stages'][$c['current_stage_id']]??null; $owner=$c['owner_id']?($s['users'][$c['owner_id']]??null):null; $task=$this->nextTask($s,$c); $gate=$this->evaluateGate($s,$c);
        $activities=array_values(array_filter($s['activities'],fn($a)=>$a['commercial_case_id']===$caseId && empty($a['archived_at']))); usort($activities,fn($a,$b)=>strcmp($b['occurred_at'],$a['occurred_at']));
        $stageEvents=array_values(array_filter($s['stage_events'],fn($e)=>$e['commercial_case_id']===$caseId)); usort($stageEvents,fn($a,$b)=>strcmp($b['occurred_at'],$a['occurred_at']));
        $props=array_values(array_filter($s['proposals'],fn($p)=>$p['commercial_case_id']===$caseId && empty($p['archived_at'])));
        $notes=array_values(array_filter($s['notes'],fn($n)=>$n['commercial_case_id']===$caseId && empty($n['archived_at'])));
        $dossier=array_values(array_filter($s['dossier_entries'],fn($d)=>$d['commercial_case_id']===$caseId));
        return [
            'id'=>$c['id'],'version'=>$c['version'],'status'=>$c['status'],'organization'=>$org,'primary_contact'=>$contact,'lead'=>$lead,'opportunity'=>$opp,
            'stage'=>['id'=>$stage['id'],'key'=>$stage['stage_key'],'name'=>$stage['name'],'entity_mode'=>$stage['entity_mode'],'entered_at'=>$c['current_stage_entered_at'],'seconds_in_stage'=>max(0,time()-(\coalup_ts($c['current_stage_entered_at'])??time()))],
            'owner'=>$owner?['id'=>$owner['id'],'name'=>$owner['name']]:null,'next_action'=>$task,'gate'=>$gate,'dossier'=>$dossier,'activities'=>$activities,'stage_events'=>$stageEvents,'proposals'=>$props,'notes'=>$notes,'files'=>[]
        ];
    }

    public function registerActivity(string $caseId,array $body,array $actor,array $ctx): array {
        return $this->mutateIdempotent('case.activity.'.$caseId,$ctx,$body,$actor['id'],function(array &$s) use($caseId,$body,$actor,$ctx): array {
            $c=&$this->caseRef($s,$caseId); $this->assertVersion($c,(int)($body['expected_version']??0));
            $kind=trim((string)($body['kind']??'')); $summary=trim((string)($body['summary']??'')); $occurred=(string)($body['occurred_at']??\coalup_now());
            if ($kind==='' || $summary==='') throw new ApiException(422,'validation_error','Tipo e resumo da atividade são obrigatórios.');
            $id=\coalup_uuid();
            $a=['id'=>$id,'organization_id'=>$c['organization_id'],'commercial_case_id'=>$c['id'],'opportunity_id'=>$c['opportunity_id'],'contact_id'=>$c['primary_contact_id'],'kind'=>$kind,'channel'=>$body['channel']??null,'occurred_at'=>$occurred,'summary'=>$summary,'agreement_note'=>$body['agreement_note']??null,'created_by'=>$actor['id'],'created_at'=>\coalup_now(),'updated_at'=>\coalup_now(),'archived_at'=>null,'version'=>1];
            $s['activities'][$id]=$a;
            $next=null;
            if (is_array($body['next_action']??null)) {
                $na=$body['next_action']; $title=trim((string)($na['title']??'')); $due=$na['due_at']??null;
                if ($title==='' || !$due) throw new ApiException(422,'validation_error','O próximo passo da atividade precisa de título e prazo.');
                $assigned=$na['assigned_to']??null; if ($assigned!==null && !isset($s['users'][$assigned])) throw new ApiException(422,'invalid_assignee','Responsável da ação não existe.');
                $old=$this->nextTask($s,$c);
                if ($old && $old['status']==='open') {
                    $rep=$na['replace_open_task']??null;
                    if (!is_array($rep) || ($rep['task_id']??null)!==$old['id'] || !in_array($rep['resolution']??'', ['complete','cancel','keep'],true)) throw new ApiException(422,'replacement_resolution_required','Existe um próximo passo aberto. Escolha concluir, cancelar ou manter a Task anterior.',['current_task_id'=>$old['id']]);
                    if ($rep['resolution']==='complete') { $s['tasks'][$old['id']]['status']='completed'; $s['tasks'][$old['id']]['completed_at']=\coalup_now(); $s['tasks'][$old['id']]['completion_note']='Substituída ao registrar atividade.'; $s['tasks'][$old['id']]['version']++; }
                    if ($rep['resolution']==='cancel') { $s['tasks'][$old['id']]['status']='cancelled'; $s['tasks'][$old['id']]['version']++; }
                }
                $next=$this->createTask($s,$c,$title,(string)$due,$assigned,$actor['id'],$id);
                $c['next_action_task_id']=$next['id'];
                $this->domain($s,'commercial_case.next_action_changed','commercial_case',$c['id'],$c,$actor['id'],['task_id'=>$next['id'],'source_activity_id'=>$id]);
            }
            $c['version']++;
            $this->domain($s,'commercial_case.activity_recorded','activity',$id,$c,$actor['id'],['kind'=>$kind]);
            $this->audit($s,$actor['id'],'commercial_case.activity_recorded','commercial_case',$c['id'],'Atividade registrada.',$ctx);
            return ['activity'=>$a,'next_action'=>$next,'case_version'=>$c['version']];
        });
    }

    public function setNextAction(string $caseId,array $body,array $actor,array $ctx): array {
        return $this->mutateIdempotent('case.next_action.'.$caseId,$ctx,$body,$actor['id'],function(array &$s) use($caseId,$body,$actor,$ctx): array {
            $c=&$this->caseRef($s,$caseId); $this->assertVersion($c,(int)($body['expected_version']??0));
            $title=trim((string)($body['title']??'')); $due=$body['due_at']??null; if ($title==='' || !$due) throw new ApiException(422,'validation_error','Título e prazo do próximo passo são obrigatórios.');
            $assigned=$body['assigned_to']??null; if ($assigned!==null && !isset($s['users'][$assigned])) throw new ApiException(422,'invalid_assignee','Responsável da ação não existe.');
            $old=$this->nextTask($s,$c);
            if ($old && $old['status']==='open') {
                $rep=$body['replace_open_task']??null;
                if (!is_array($rep) || ($rep['task_id']??null)!==$old['id'] || !in_array($rep['resolution']??'', ['complete','cancel','keep'],true)) throw new ApiException(422,'replacement_resolution_required','Existe um próximo passo aberto. Escolha concluir, cancelar ou manter a Task anterior.',['current_task_id'=>$old['id']]);
                if ($rep['resolution']==='complete') { $s['tasks'][$old['id']]['status']='completed'; $s['tasks'][$old['id']]['completed_at']=\coalup_now(); $s['tasks'][$old['id']]['completion_note']='Substituída ao definir novo próximo passo.'; $s['tasks'][$old['id']]['version']++; }
                if ($rep['resolution']==='cancel') { $s['tasks'][$old['id']]['status']='cancelled'; $s['tasks'][$old['id']]['version']++; }
            }
            $task=$this->createTask($s,$c,$title,(string)$due,$assigned,$actor['id'],null);
            $c['next_action_task_id']=$task['id']; $c['version']++;
            $this->domain($s,'commercial_case.next_action_changed','commercial_case',$c['id'],$c,$actor['id'],['task_id'=>$task['id']]);
            $this->audit($s,$actor['id'],'commercial_case.next_action_changed','commercial_case',$c['id'],'Próximo passo definido.',$ctx);
            return ['case_id'=>$c['id'],'version'=>$c['version'],'next_action'=>$task];
        });
    }

    public function transition(string $caseId,array $body,array $actor,array $ctx): array {
        return $this->mutateIdempotent('case.transition.'.$caseId,$ctx,$body,$actor['id'],function(array &$s) use($caseId,$body,$actor,$ctx): array {
            $c=&$this->caseRef($s,$caseId); $this->assertVersion($c,(int)($body['expected_version']??0));
            $targetId=(string)($body['target_stage_id']??''); $target=$s['stages'][$targetId]??null; $current=$s['stages'][$c['current_stage_id']]??null;
            if (!$target || !$current || $target['funnel_version_id']!==$c['funnel_version_id']) throw new ApiException(422,'invalid_target_stage','Etapa de destino inválida para este Funil.');
            $delta=(int)$target['position']-(int)$current['position']; if (!in_array($delta,[-1,1],true)) throw new ApiException(422,'invalid_transition','Nesta primeira fatia, a transição deve ocorrer entre etapas adjacentes.');
            $gate=$this->evaluateGate($s,$c); $missing=array_values(array_filter($gate['requirements'],fn($r)=>$r['status']==='missing'));
            $hard=array_values(array_filter($missing,fn($r)=>!$r['override_allowed'])); if ($hard) throw new ApiException(422,'gate_blocked','Existem requisitos obrigatórios que não podem ser ignorados.',['requirements'=>$hard]);
            if ($missing && trim((string)($body['override_reason']??''))==='') throw new ApiException(422,'gate_override_required','Existem requisitos pendentes. Informe o motivo para avançar.',['requirements'=>$missing]);
            if ($target['entity_mode']==='opportunity' && !$c['opportunity_id']) {
                if (!$c['owner_id']) throw new ApiException(422,'owner_required_for_opportunity','Defina um responsável antes de criar a Opportunity.');
                $oid=\coalup_uuid(); $org=$s['organizations'][$c['organization_id']];
                $opp=['id'=>$oid,'organization_id'=>$c['organization_id'],'primary_contact_id'=>$c['primary_contact_id'],'title'=>$org['name'],'amount_cents'=>null,'currency'=>'BRL','service_label'=>null,'owner_id'=>$c['owner_id'],'lifecycle_status'=>'open','loss_reason'=>null,'later_until'=>null,'later_condition'=>null,'won_at'=>null,'lost_at'=>null,'created_by'=>$actor['id'],'created_at'=>\coalup_now(),'updated_at'=>\coalup_now(),'archived_at'=>null,'version'=>1];
                $s['opportunities'][$oid]=$opp; $c['opportunity_id']=$oid;
                if ($c['lead_id'] && isset($s['leads'][$c['lead_id']])) { $s['leads'][$c['lead_id']]['qualification_state']='qualified'; $s['leads'][$c['lead_id']]['qualified_at']=\coalup_now(); $s['leads'][$c['lead_id']]['converted_at']=\coalup_now(); $s['leads'][$c['lead_id']]['version']++; }
                $this->domain($s,'opportunity.created','opportunity',$oid,$c,$actor['id'],[]);
            }
            $transitionId=\coalup_uuid(); $now=\coalup_now(); $snapshot=['requirements'=>array_map(fn($r)=>['requirement_id'=>$r['requirement_id'],'checker_key'=>$r['checker_key'],'status'=>$r['status'],'overridden'=>$r['status']==='missing' && trim((string)($body['override_reason']??''))!==''],$gate['requirements'])];
            $exit=['id'=>\coalup_uuid(),'commercial_case_id'=>$c['id'],'funnel_version_id'=>$c['funnel_version_id'],'stage_id'=>$current['id'],'event_type'=>'exit','counterpart_stage_id'=>$target['id'],'transition_id'=>$transitionId,'transition_reason'=>$body['transition_reason']??null,'override_reason'=>$body['override_reason']??null,'gate_snapshot'=>$snapshot,'actor_user_id'=>$actor['id'],'occurred_at'=>$now];
            $enter=['id'=>\coalup_uuid(),'commercial_case_id'=>$c['id'],'funnel_version_id'=>$c['funnel_version_id'],'stage_id'=>$target['id'],'event_type'=>'enter','counterpart_stage_id'=>$current['id'],'transition_id'=>$transitionId,'transition_reason'=>$body['transition_reason']??null,'override_reason'=>$body['override_reason']??null,'gate_snapshot'=>null,'actor_user_id'=>$actor['id'],'occurred_at'=>$now];
            $s['stage_events'][$exit['id']]=$exit; $s['stage_events'][$enter['id']]=$enter;
            $c['current_stage_id']=$target['id']; $c['current_stage_entered_at']=$now; $c['version']++;
            $next=null;
            if (is_array($body['next_action']??null)) {
                $na=$body['next_action']; $title=trim((string)($na['title']??'')); $due=$na['due_at']??null; if ($title===''||!$due) throw new ApiException(422,'validation_error','Próximo passo da transição precisa de título e prazo.');
                $assigned=$na['assigned_to']??null; if ($assigned!==null && !isset($s['users'][$assigned])) throw new ApiException(422,'invalid_assignee','Responsável da ação não existe.');
                $next=$this->createTask($s,$c,$title,(string)$due,$assigned,$actor['id'],null); $c['next_action_task_id']=$next['id'];
            } else {
                $c['next_action_task_id']=null; $this->domain($s,'commercial_case.no_next_action','commercial_case',$c['id'],$c,$actor['id'],[]);
            }
            $this->domain($s,'commercial_case.stage_exited','commercial_case',$c['id'],$c,$actor['id'],['stage_id'=>$current['id'],'transition_id'=>$transitionId]);
            $this->domain($s,'commercial_case.stage_entered','commercial_case',$c['id'],$c,$actor['id'],['stage_id'=>$target['id'],'transition_id'=>$transitionId]);
            $this->audit($s,$actor['id'],'commercial_case.transition','commercial_case',$c['id'],'Etapa alterada de '.$current['name'].' para '.$target['name'].'.',$ctx);
            return ['case_id'=>$c['id'],'version'=>$c['version'],'transition_id'=>$transitionId,'current_stage_id'=>$target['id'],'current_stage_entered_at'=>$now,'next_action'=>$next,'gate_snapshot'=>$snapshot];
        });
    }

    public function completeTask(string $taskId,array $body,array $actor,array $ctx): array {
        return $this->mutateIdempotent('task.complete.'.$taskId,$ctx,$body,$actor['id'],function(array &$s) use($taskId,$body,$actor,$ctx): array {
            $t=&$this->taskRef($s,$taskId); $this->assertVersion($t,(int)($body['expected_version']??0)); if ($t['status']!=='open') throw new ApiException(422,'task_not_open','A ação não está aberta.');
            $t['status']='completed'; $t['completed_at']=\coalup_now(); $t['completion_note']=$body['completion_note']??null; $t['version']++;
            $caseVersion=null;
            if ($t['commercial_case_id'] && isset($s['cases'][$t['commercial_case_id']])) { $c=&$s['cases'][$t['commercial_case_id']]; if (($c['next_action_task_id']??null)===$taskId) { $c['next_action_task_id']=null; $c['version']++; $caseVersion=$c['version']; $this->domain($s,'commercial_case.no_next_action','commercial_case',$c['id'],$c,$actor['id'],['completed_task_id'=>$taskId]); } }
            $this->domain($s,'task.completed','task',$taskId,null,$actor['id'],[]); $this->audit($s,$actor['id'],'task.complete','task',$taskId,'Ação concluída.',$ctx);
            return ['task'=>$t,'case_version'=>$caseVersion];
        });
    }

    private function activeFunnel(array $s): array {
        $funnel=null; foreach ($s['funnels'] as $f) if (($f['funnel_key']??'')==='prospeccao_coalup' && ($f['status']??'')==='active') { $funnel=$f; break; }
        if (!$funnel || !$funnel['active_version_id'] || !isset($s['funnel_versions'][$funnel['active_version_id']])) throw new ApiException(503,'funnel_not_seeded','O Funil local ainda não foi preparado.');
        return [$funnel,$s['funnel_versions'][$funnel['active_version_id']]];
    }
    private function stagesForVersion(array $s,string $versionId): array { $rows=array_values(array_filter($s['stages'],fn($x)=>$x['funnel_version_id']===$versionId)); usort($rows,fn($a,$b)=>(int)$a['position']<=>(int)$b['position']); return $rows; }
    private function caseMatches(array $s,array $c,array $f): bool {
        $card=$this->caseCard($s,$c); if (!empty($f['owner_id']) && $c['owner_id']!==$f['owner_id']) return false; if (!empty($f['stage_id']) && $c['current_stage_id']!==$f['stage_id']) return false;
        if (isset($f['attention']) && $f['attention']!=='') { $want=in_array((string)$f['attention'],['1','true','yes'],true); if ($card['attention']['needs_attention']!==$want) return false; }
        if (!empty($f['service']) && ($card['opportunity']['service_label']??null)!==$f['service']) return false;
        if (!empty($f['next_action'])) { $t=$card['next_action']; $today=gmdate('Y-m-d'); $date=$t?substr((string)$t['due_at'],0,10):null; if ($f['next_action']==='missing' && $t) return false; if ($f['next_action']==='today' && $date!==$today) return false; if ($f['next_action']==='overdue' && (!$date || $date>=$today)) return false; }
        return true;
    }
    private function caseCard(array $s,array $c): array {
        $org=$s['organizations'][$c['organization_id']]??null; $contact=$c['primary_contact_id']?($s['contacts'][$c['primary_contact_id']]??null):null; $opp=$c['opportunity_id']?($s['opportunities'][$c['opportunity_id']]??null):null; $stage=$s['stages'][$c['current_stage_id']]??null; $owner=$c['owner_id']?($s['users'][$c['owner_id']]??null):null; $task=$this->nextTask($s,$c); $reasons=[]; if (!$task) $reasons[]='missing_next_action'; elseif (\coalup_ts($task['due_at'])!==null && \coalup_ts($task['due_at'])<=time()) $reasons[]='next_action_due';
        return ['id'=>$c['id'],'version'=>$c['version'],'organization'=>$org?['id'=>$org['id'],'name'=>$org['name']]:null,'primary_contact'=>$contact?['id'=>$contact['id'],'name'=>$contact['name']]:null,'opportunity'=>$opp?['id'=>$opp['id'],'amount_cents'=>$opp['amount_cents'],'currency'=>$opp['currency'],'service_label'=>$opp['service_label']]:null,'stage'=>['id'=>$stage['id'],'name'=>$stage['name'],'entered_at'=>$c['current_stage_entered_at']],'owner'=>$owner?['id'=>$owner['id'],'name'=>$owner['name']]:null,'next_action'=>$task,'attention'=>['needs_attention'=>(bool)$reasons,'reasons'=>$reasons]];
    }
    private function nextTask(array $s,array $c): ?array { $id=$c['next_action_task_id']??null; if (!$id) return null; $t=$s['tasks'][$id]??null; return $t && $t['status']==='open' ? $t : null; }
    private function observedAverageSeconds(array $s,string $stageId): ?int { $enters=[];$dur=[];$ev=array_values($s['stage_events']); usort($ev,fn($a,$b)=>strcmp($a['occurred_at'],$b['occurred_at'])); foreach($ev as $e){$key=$e['commercial_case_id'].'|'.$e['stage_id']; if($e['stage_id']!==$stageId)continue; if($e['event_type']==='enter')$enters[$key]=\coalup_ts($e['occurred_at']); elseif($e['event_type']==='exit' && isset($enters[$key])){$x=\coalup_ts($e['occurred_at']); if($x!==null&&$enters[$key]!==null&&$x>=$enters[$key])$dur[]=$x-$enters[$key]; unset($enters[$key]);}} return $dur? (int)round(array_sum($dur)/count($dur)):null; }
    private function evaluateGate(array $s,array $c): array { $reqs=array_values(array_filter($s['requirements'],fn($r)=>$r['stage_id']===$c['current_stage_id'] && !empty($r['active']))); usort($reqs,fn($a,$b)=>(int)$a['position']<=>(int)$b['position']); $out=[]; foreach($reqs as $r){$met=$this->checkRequirement($s,$c,$r);$out[]=['requirement_id'=>$r['id'],'checker_key'=>$r['checker_key'],'label'=>$r['label'],'status'=>$met?'met':'missing','override_allowed'=>(bool)$r['override_allowed'],'severity'=>$r['severity']];} return ['stage_id'=>$c['current_stage_id'],'requirements'=>$out,'can_transition_without_override'=>!array_filter($out,fn($r)=>$r['status']==='missing')]; }
    private function checkRequirement(array $s,array $c,array $r): bool { $key=$r['checker_key']; $cfg=$r['config']??[]; if($key==='field_present'){ $field=$cfg['field_key']??''; if($field==='organization_id')return !empty($c['organization_id']); if($field==='source'){ $lead=$c['lead_id']?($s['leads'][$c['lead_id']]??null):null; return !empty($lead['source']); } if($field==='service_context'){ $opp=$c['opportunity_id']?($s['opportunities'][$c['opportunity_id']]??null):null; return !empty($opp['service_label']); } return !empty($c[$field]); }
        if($key==='next_action_present')return $this->nextTask($s,$c)!==null; if($key==='primary_contact_present')return !empty($c['primary_contact_id']); if($key==='activity_present')return (bool)array_filter($s['activities'],fn($a)=>$a['commercial_case_id']===$c['id'] && empty($a['archived_at'])); if($key==='diagnosis_present')return (bool)array_filter($s['activities'],fn($a)=>$a['commercial_case_id']===$c['id'] && $a['kind']==='diagnosis' && empty($a['archived_at'])) || (bool)array_filter($s['dossier_entries'],fn($d)=>$d['commercial_case_id']===$c['id'] && $d['category']==='diagnosis'); if($key==='evidence_present')return (bool)array_filter($s['dossier_entries'],fn($d)=>$d['commercial_case_id']===$c['id'] && $d['category']==='evidence'); if($key==='note_present')return (bool)array_filter($s['notes'],fn($n)=>$n['commercial_case_id']===$c['id'] && empty($n['archived_at'])); if($key==='offer_present')return (bool)array_filter($s['dossier_entries'],fn($d)=>$d['commercial_case_id']===$c['id'] && $d['category']==='offer'); if($key==='amount_present'){ $o=$c['opportunity_id']?($s['opportunities'][$c['opportunity_id']]??null):null; return isset($o['amount_cents']) && (int)$o['amount_cents']>0; } if($key==='proposal_present')return (bool)array_filter($s['proposals'],fn($p)=>$p['commercial_case_id']===$c['id'] && empty($p['archived_at'])); return false; }
    private function createTask(array &$s,array $c,string $title,string $dueAt,?string $assignedTo,string $createdBy,?string $sourceActivity): array { $id=\coalup_uuid(); $t=['id'=>$id,'organization_id'=>$c['organization_id'],'commercial_case_id'=>$c['id'],'opportunity_id'=>$c['opportunity_id'],'project_id'=>null,'source_activity_id'=>$sourceActivity,'assigned_to'=>$assignedTo,'created_by'=>$createdBy,'title'=>$title,'description'=>null,'priority'=>'normal','due_at'=>$dueAt,'status'=>'open','completed_at'=>null,'completion_note'=>null,'created_at'=>\coalup_now(),'updated_at'=>\coalup_now(),'archived_at'=>null,'version'=>1]; $s['tasks'][$id]=$t; return $t; }
    private function &caseRef(array &$s,string $id): array { if(!isset($s['cases'][$id]))throw new ApiException(404,'case_not_found','Venda não encontrada.'); return $s['cases'][$id]; }
    private function &taskRef(array &$s,string $id): array { if(!isset($s['tasks'][$id]))throw new ApiException(404,'task_not_found','Ação não encontrada.'); return $s['tasks'][$id]; }
    private function assertVersion(array $row,int $expected): void { if($expected<=0)throw new ApiException(422,'expected_version_required','expected_version é obrigatório.'); if((int)$row['version']!==$expected)throw new ApiException(409,'stale_version','A entidade mudou desde que você abriu.',[],(int)$row['version']); }
    private function mutateIdempotent(string $scope,array $ctx,array $payload,string $actorId,callable $fn): array {
        $key=trim((string)($ctx['idempotency_key']??''));
        if($key==='')throw new ApiException(400,'idempotency_required','Idempotency-Key é obrigatório.');
        $hash=hash('sha256',\coalup_json_canonical($payload));
        $this->activeCorrelationId=(string)($ctx['correlation_id']??\coalup_uuid());
        try {
            return $this->store->transaction(function(array &$s) use($scope,$key,$hash,$actorId,$fn): array {
                $mk=$scope.'|'.$key;
                if(isset($s['mutation_keys'][$mk])){
                    $old=$s['mutation_keys'][$mk];
                    if(($old['actor_user_id']??null)!==$actorId)throw new ApiException(409,'idempotency_conflict','A chave de idempotência pertence a outro operador.');
                    if(!hash_equals($old['payload_hash'],$hash))throw new ApiException(409,'idempotency_conflict','A mesma chave de idempotência foi usada com payload diferente.');
                    return ['replayed'=>true,'result'=>$old['result']];
                }
                $result=$fn($s);
                $s['mutation_keys'][$mk]=['scope'=>$scope,'idempotency_key'=>$key,'actor_user_id'=>$actorId,'payload_hash'=>$hash,'result'=>$result,'created_at'=>\coalup_now(),'expires_at'=>\coalup_plus_seconds(86400)];
                return ['replayed'=>false,'result'=>$result];
            });
        } finally { $this->activeCorrelationId=null; }
    }
    private function domain(array &$s,string $type,string $entityType,?string $entityId,?array $case,?string $actor,array $payload): void { $id=\coalup_uuid(); $s['domain_events'][$id]=['id'=>$id,'event_type'=>$type,'entity_type'=>$entityType,'entity_id'=>$entityId,'organization_id'=>$case['organization_id']??null,'commercial_case_id'=>$case['id']??null,'actor_user_id'=>$actor,'source'=>'crm','correlation_id'=>$this->activeCorrelationId??\coalup_uuid(),'occurred_at'=>\coalup_now(),'payload'=>$payload,'created_at'=>\coalup_now()]; }
    private function audit(array &$s,?string $actor,string $action,string $entityType,?string $entityId,string $summary,array $ctx): void { $id=\coalup_uuid(); $s['audit_events'][$id]=['id'=>$id,'actor_id'=>$actor,'action'=>$action,'entity_type'=>$entityType,'entity_id'=>$entityId,'summary'=>$summary,'result'=>'success','request_id'=>$ctx['request_id']??\coalup_uuid(),'correlation_id'=>$ctx['correlation_id']??null,'created_at'=>\coalup_now()]; }
}
