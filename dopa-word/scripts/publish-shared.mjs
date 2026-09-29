// Runs only in a trusted default-branch workflow. No issue text is executed.
import {readFile} from 'node:fs/promises';
import {applyIssue,ISSUE_PREFIX,CATALOG_PATH,PUBLIC_REPO,PUBLIC_SITE} from '../shared-model.mjs';
const marker='<!-- dopa-word-shared-result -->';
async function main(){
  const event=JSON.parse(await readFile(process.env.GITHUB_EVENT_PATH,'utf8'));
  if(process.env.GITHUB_REPOSITORY!==PUBLIC_REPO||event.repository?.full_name!==PUBLIC_REPO)throw new Error('Unexpected repository');
  const owner=event.repository.owner,actor=event.sender;
  // Ignore non-owner events before granting them any publication effects.
  if(actor?.id!==owner?.id){console.log('Ignored: only repository owner can publish');return;}
  const num=Number(event.issue?.number||event.inputs?.issue_number);
  if(!Number.isSafeInteger(num)||num<1)throw new Error('An existing issue number is required');
  const token=process.env.GITHUB_TOKEN;if(!token)throw new Error('Workflow token not available');
  async function api(path,method='GET',body){
    const response=await fetch('https://api.github.com/repos/'+PUBLIC_REPO+'/'+path,{method,headers:{Authorization:'Bearer '+token,Accept:'application/vnd.github+json','Content-Type':'application/json','X-GitHub-Api-Version':'2022-11-28'},body:body?JSON.stringify(body):undefined,signal:AbortSignal.timeout(25000)});
    if(!response.ok){const e=new Error('GitHub API request failed ('+response.status+')');e.status=response.status;throw e;}return response.status===204?null:response.json();
  }
  let issue=await api('issues/'+num);
  if(issue.pull_request||issue.user?.id!==owner.id||!issue.title.startsWith(ISSUE_PREFIX)){console.log('Ignored: not an owner publication issue');return;}
  async function comment(message){
    const existing=await api('issues/'+num+'/comments?per_page=100');
    const mine=existing.find(c=>c.user?.login==='github-actions[bot]'&&c.body.startsWith(marker));
    const body=marker+'\n'+message;
    if(mine){if(mine.body!==body)await api('issues/comments/'+mine.id,'PATCH',{body});}
    else await api('issues/'+num+'/comments','POST',{body});
  }
  let committed=false;
  try{
    let result;
    for(let attempt=0;attempt<5;attempt++){
      // Re-fetch current issue and current registry on every attempt to avoid stale
      // edits or racing publications overwriting an unrelated shared wordbook.
      issue=await api('issues/'+num);
      let current;try{current=await api('contents/'+CATALOG_PATH+'?ref=main');}catch(e){if(e.status!==404)throw e;}
      const registry=current?JSON.parse(Buffer.from(current.content.replace(/\s/g,''),'base64').toString('utf8')):{schema:1,updatedAt:'',packs:[]};
      result=applyIssue(registry,issue,{actorID:actor.id,ownerID:owner.id,ownerLogin:owner.login});
      if(!result.changed)break;
      try{
        const response=await api('contents/'+CATALOG_PATH,'PUT',{message:'data(word): '+(result.withdrawn?'withdraw':'publish')+' shared wordbook #'+num,content:Buffer.from(JSON.stringify(result.catalog,null,2)+'\n').toString('base64'),...(current?{sha:current.sha}:{}),branch:'main'});
        committed=true;console.log(JSON.stringify({issue:num,id:result.id,commit:response.commit.sha,withdrawn:result.withdrawn}));break;
      }catch(e){if(![409,422].includes(e.status)||attempt===4)throw e;await new Promise(r=>setTimeout(r,500*(attempt+1)));}
    }
    const link=PUBLIC_SITE+'?pack='+result.id;
    await comment(result.withdrawn?'공개 목록에서 내렸어요. 이전 공유 링크·복사본과 GitHub 이력에는 내용이 남을 수 있어요. 다시 공개하려면 이 이슈를 열어 주세요.':
      `공개 단어장 등록을 완료했어요.\n\n**[단어장 보기·학습하기](${link})**\n\n다른 사람은 로그인 없이 이 링크로 학습할 수 있어요. 목록에 바로 보이지 않으면 ‘공개 목록 새로고침’을 눌러 주세요.\n\n이 이슈 본문의 단어 블록을 수정하면 업데이트되고, 이 이슈를 닫으면 공개 목록에서 내려갑니다. GitHub 이력·이미 전달한 링크나 복사본은 지워지지 않습니다. 개인 점수와 오답 기록은 게시하지 않았습니다.`);
    const {appendFile}=await import('node:fs/promises');await appendFile(process.env.GITHUB_STEP_SUMMARY,`## Shared vocabulary\n\nIssue #${num}: ${result.withdrawn?'withdrawn':'published'}\n\n${link}\n`);
  }catch(e){
    await comment((committed?'데이터 저장은 완료했지만 상태 안내 중 오류가 발생했어요. 공개 목록을 새로고침하고 Actions 결과를 확인해 주세요.':'공개 등록을 완료하지 못했어요. 기존 공개 데이터를 덮어쓰지 않았습니다.')+'\n\n'+e.message).catch(()=>{});
    throw e;
  }
}
main().catch(e=>{console.error(e.message);process.exitCode=1;});
