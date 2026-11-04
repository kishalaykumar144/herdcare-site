/* HerdCare Care Cases: alert-to-resolution coordination for the browser prototype. */
(()=>{
  const APP_KEY='herdcare-working-prototype-v1';
  const CASE_KEY='herdcare-care-cases-v1';
  const VET_KEY='herdcare-vet-profiles-v1';
  const LANGUAGE_KEY='herdcare-language-v1';
  const STATUS={
    'new':'New concern',
    'monitoring':'Monitoring',
    'vet-review':'Veterinary review',
    'treatment':'Care plan underway',
    'follow-up':'Follow-up due',
    'closed':'Resolved'
  };
  const SPECIES_ICON={Dog:'🐕',Cat:'🐈',Cow:'🐄',Buffalo:'🐃',Goat:'🐐',Sheep:'🐑',Other:'🐾'};
  const safe=value=>String(value??'').replace(/[&<>'"]/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[char]));
  const readJson=(key,fallback)=>{try{return JSON.parse(localStorage.getItem(key))||fallback}catch{return fallback}};
  const appState=()=>readJson(APP_KEY,{cattle:[],vets:[]});
  const animalFor=id=>appState().cattle?.find(animal=>animal.id===id)||appState().cattle?.[0]||{id:'unknown',name:'Animal',species:'Other'};
  const currentAnimal=()=>{const state=appState();return state.cattle?.find(animal=>animal.id===state.selected)||state.cattle?.[0]};
  const dateLabel=value=>{const date=new Date(value);return Number.isNaN(date.valueOf())?String(value||'Not recorded'):date.toLocaleString([], {month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'})};
  const nowIso=()=>new Date().toISOString();
  const language=()=>localStorage.getItem(LANGUAGE_KEY)||'en';
  const NAV_LABEL={en:'Care cases',hi:'देखभाल मामले',bn:'পরিচর্যা কেস',mr:'काळजी प्रकरणे'};
  let selectedCaseId=null;
  let caseSearch='';
  let caseFilter='active';
  let rendering=false;

  const seedCases=()=>{
    const existing=readJson(CASE_KEY,null);
    if(existing&&Array.isArray(existing.cases))return existing;
    const state=appState(),bella=state.cattle?.find(animal=>animal.id==='GV-042')||state.cattle?.[0];
    const created=new Date(Date.now()-95*60*1000).toISOString();
    const data={schemaVersion:1,cases:bella?[{
      id:'HC-0001',animalId:bella.id,title:'Irregular temperature and appetite',source:'Temperature alert',priority:'high',status:'vet-review',
      summary:'A sustained temperature deviation was recorded and appetite appears lower than usual. Veterinary review is requested; this is not a diagnosis.',
      symptoms:['Temperature change','Reduced appetite'],temperature:Number(bella.temp)||null,baseline:Number(bella.usual)||null,assignedVet:'Dr. Ananya Sharma',
      createdAt:created,updatedAt:new Date(Date.now()-50*60*1000).toISOString(),followUpAt:'',outcome:'',alertHelpful:null,
      timeline:[
        {id:'event-1',type:'created',title:'Care case opened',note:'Created from an irregular temperature alert. Raw readings remain available in Temperature & sensors.',by:'HerdCare owner',at:created},
        {id:'event-2',type:'review',title:'Veterinary review requested',note:'Dr. Ananya Sharma was selected for review. No diagnosis or medication has been entered.',by:'HerdCare owner',at:new Date(Date.now()-50*60*1000).toISOString()}
      ]
    }]:[]};
    localStorage.setItem(CASE_KEY,JSON.stringify(data));return data;
  };
  const readCases=()=>seedCases();
  const writeCases=data=>{data.schemaVersion=1;localStorage.setItem(CASE_KEY,JSON.stringify(data));window.dispatchEvent(new CustomEvent('herdcare:cases-updated'))};
  const allCases=()=>readCases().cases||[];
  const caseById=id=>allCases().find(item=>item.id===id);
  const nextCaseId=()=>{const number=allCases().reduce((max,item)=>Math.max(max,Number(String(item.id).replace(/\D/g,''))||0),0)+1;return `HC-${String(number).padStart(4,'0')}`};
  const activeCases=()=>allCases().filter(item=>item.status!=='closed');
  const touch=(item,title,note,by='HerdCare owner',type='update')=>{const at=nowIso();item.updatedAt=at;item.timeline=item.timeline||[];item.timeline.push({id:`event-${Date.now()}`,type,title,note,by,at})};
  const toast=message=>{const box=document.getElementById('toast');if(!box)return;box.textContent=message;box.classList.add('show');clearTimeout(window.herdcareCaseToast);window.herdcareCaseToast=setTimeout(()=>box.classList.remove('show'),3200)};
  const vets=()=>{
    const state=appState(),saved=readJson(VET_KEY,[]),base=(state.vets||[]).map(vet=>({name:vet.name,clinic:vet.clinic||'',registration:'Saved directory contact'}));
    const unique=new Map([...base,...saved].map(vet=>[vet.name,vet]));return [...unique.values()];
  };
  const statusLabel=value=>STATUS[value]||value;
  const statusClass=value=>safe(value);
  const animalIcon=animal=>SPECIES_ICON[animal.species]||SPECIES_ICON.Other;

  function modal(title,copy,fields,onSubmit,submitLabel='Save'){
    const root=document.getElementById('modal'),form=document.getElementById('modal-form');
    if(!root||!form)return;
    document.getElementById('modal-title').textContent=title;
    document.getElementById('modal-copy').textContent=copy;
    form.innerHTML=`${fields}<div class="modal-actions"><button class="button ghost" type="button" data-case-cancel>Cancel</button><button class="button primary" type="submit">${safe(submitLabel)}</button></div>`;
    root.classList.add('open');
    const close=()=>root.classList.remove('open');
    form.querySelector('[data-case-cancel]').onclick=close;
    form.onsubmit=event=>{event.preventDefault();const result=onSubmit(new FormData(form),form);if(result!==false)close()};
  }

  function newCase({animalId,source='Manual observation',priority='medium',summary='',symptoms=[]}={}){
    const state=appState(),animals=state.cattle||[],selected=animalId||state.selected||animals[0]?.id;
    modal('Start a care case','Organize a concern for monitoring and veterinary review. HerdCare does not diagnose or prescribe.',`
      <label>Animal<select name="animalId" required>${animals.map(animal=>`<option value="${safe(animal.id)}" ${animal.id===selected?'selected':''}>${safe(animal.name)} · ${safe(animal.species||animal.type||'Animal')} · ${safe(animal.id)}</option>`).join('')}</select></label>
      <label>Concern source<select name="source"><option ${source==='Temperature alert'?'selected':''}>Temperature alert</option><option ${source==='Photo observation'?'selected':''}>Photo observation</option><option ${source==='Manual observation'?'selected':''}>Manual observation</option><option>Activity or movement change</option><option>Medication or vaccination follow-up</option><option>Veterinary recommendation</option></select></label>
      <label>What changed?<textarea name="summary" required placeholder="Describe what changed, when it started, and whether other animals are affected.">${safe(summary)}</textarea></label>
      <label>Observed signs<div class="case-form-symptoms">${['Temperature change','Reduced appetite','Reduced activity','Cough or discharge','Digestive change','Swelling or injury','Milk production change','Movement concern'].map(value=>`<label><input type="checkbox" name="symptoms" value="${value}" ${symptoms.includes(value)?'checked':''}>${value}</label>`).join('')}</div></label>
      <label>Urgency<select name="priority"><option value="low" ${priority==='low'?'selected':''}>Routine monitoring</option><option value="medium" ${priority==='medium'?'selected':''}>Review soon</option><option value="high" ${priority==='high'?'selected':''}>Veterinary review recommended</option><option value="urgent" ${priority==='urgent'?'selected':''}>Urgent — contact a veterinarian now</option></select></label>
      <label>Temperature, if available (°C)<input name="temperature" type="number" min="35" max="45" step="0.1" placeholder="e.g. 39.6"></label>
      <div class="case-callout warning"><strong>Safety</strong>For breathing difficulty, collapse, severe bleeding, poisoning, difficult birth, or inability to stand, contact a qualified veterinarian immediately.</div>`,data=>{
        const animal=animals.find(item=>item.id===data.get('animalId'))||animalFor(data.get('animalId'));
        const id=nextCaseId(),at=nowIso(),caseItem={id,animalId:animal.id,title:String(data.get('summary')).trim().split(/[.!?]/)[0].slice(0,70)||'Animal-care concern',source:data.get('source'),priority:data.get('priority'),status:'new',summary:String(data.get('summary')).trim(),symptoms:data.getAll('symptoms'),temperature:data.get('temperature')?Number(data.get('temperature')):null,baseline:Number(animal.usual)||null,assignedVet:'',createdAt:at,updatedAt:at,followUpAt:'',outcome:'',alertHelpful:null,timeline:[{id:`event-${Date.now()}`,type:'created',title:'Care case opened',note:`Created from ${String(data.get('source')).toLowerCase()}.`,by:'HerdCare owner',at}]};
        const store=readCases();store.cases.unshift(caseItem);writeCases(store);selectedCaseId=id;showCases();toast(`${id} created for ${animal.name}.`)
      },'Create care case');
  }

  function requestVet(item){
    const directory=vets();
    modal('Request veterinary review','Assign the case to a saved veterinary professional. This prototype records the request locally.',`
      <label>Veterinarian<select name="vet" required><option value="">Select a veterinarian</option>${directory.map(vet=>`<option value="${safe(vet.name)}" ${item.assignedVet===vet.name?'selected':''}>${safe(vet.name)} · ${safe(vet.clinic)}</option>`).join('')}</select></label>
      <label>Message<textarea name="note" required>Please review the animal history, recent observations, and available sensor readings.</textarea></label>`,data=>{
        item.assignedVet=data.get('vet');item.status='vet-review';touch(item,'Veterinary review requested',`${data.get('vet')} · ${String(data.get('note')).trim()}`);persistItem(item);toast('Veterinary review request saved to this device.')
      },'Request review');
  }

  function recordAssessment(item){
    modal('Record veterinary assessment','Only a qualified veterinary professional should enter examination findings or a treatment plan.',`
      <label>Examined by<input name="vet" required value="${safe(item.assignedVet||'')}" placeholder="Veterinarian name"></label>
      <label>Assessment findings<textarea name="findings" required placeholder="Record examination findings and confirmed concerns. Do not copy an AI suggestion as a diagnosis."></textarea></label>
      <label>Veterinarian-approved care plan<textarea name="plan" required placeholder="Monitoring, tests, treatment instructions, and any applicable withdrawal period."></textarea></label>
      <label>Next follow-up<input name="followUp" type="datetime-local"></label>
      <div class="case-callout warning"><strong>Prototype record</strong>HerdCare does not verify professional credentials in this browser demo.</div>`,data=>{
        item.assignedVet=String(data.get('vet')).trim();item.status=data.get('followUp')?'follow-up':'treatment';item.followUpAt=data.get('followUp')?new Date(data.get('followUp')).toISOString():'';
        touch(item,'Veterinary assessment recorded',`${String(data.get('findings')).trim()} Care plan: ${String(data.get('plan')).trim()}`,item.assignedVet,'assessment');persistItem(item);toast('Veterinary assessment added to the case.')
      },'Save assessment');
  }

  function addFollowUp(item){
    modal('Add follow-up','Record what changed after monitoring or veterinary care.',`
      <label>Current progress<select name="progress"><option>Improving</option><option>No meaningful change</option><option>Worsening — veterinary review needed</option><option>Recovered</option></select></label>
      <label>Observation<textarea name="note" required placeholder="Appetite, activity, temperature, treatment response, or another relevant change."></textarea></label>
      <label>Next review<input name="followUp" type="datetime-local"></label>`,data=>{
        const progress=data.get('progress');item.status=progress==='Recovered'?'follow-up':progress.startsWith('Worsening')?'vet-review':'follow-up';if(progress.startsWith('Worsening'))item.priority='high';item.followUpAt=data.get('followUp')?new Date(data.get('followUp')).toISOString():item.followUpAt;
        touch(item,`Follow-up: ${progress}`,String(data.get('note')).trim(),'HerdCare owner','follow-up');persistItem(item);toast('Follow-up saved.')
      },'Save follow-up');
  }

  function closeCase(item){
    modal('Close care case','Record the outcome and whether the original warning helped prioritize care.',`
      <label>Outcome<select name="outcome"><option>Recovered</option><option>Stable — routine monitoring continues</option><option>Referred for further examination</option><option>Case closed for another reason</option></select></label>
      <label>Was the original warning useful?<select name="helpful"><option value="yes">Yes</option><option value="partly">Partly</option><option value="no">No / false alert</option><option value="unknown">Not known</option></select></label>
      <label>Closing note<textarea name="note" required placeholder="Summarize the outcome without adding an unconfirmed diagnosis."></textarea></label>`,data=>{
        item.status='closed';item.outcome=data.get('outcome');item.alertHelpful=data.get('helpful');item.closedAt=nowIso();touch(item,'Case closed',`${data.get('outcome')}. ${String(data.get('note')).trim()} Original warning: ${data.get('helpful')}.`,'HerdCare owner','closed');persistItem(item);toast(`${item.id} closed.`)
      },'Close case');
  }

  function reopenCase(item){item.status='monitoring';item.closedAt='';touch(item,'Case reopened','Monitoring resumed after a new or continuing concern.');persistItem(item);toast(`${item.id} reopened.`)}
  function persistItem(updated){const store=readCases(),index=store.cases.findIndex(item=>item.id===updated.id);if(index>=0)store.cases[index]=updated;writeCases(store);showCases()}

  function summaryMarkup(cases){
    const open=cases.filter(item=>item.status!=='closed').length,urgent=cases.filter(item=>item.status!=='closed'&&['high','urgent'].includes(item.priority)).length,follow=cases.filter(item=>item.status==='follow-up').length,closed=cases.filter(item=>item.status==='closed').length;
    return `<div class="case-summary"><article class="card case-summary-card"><small>Open cases</small><b>${open}</b><span>Across this care space</span></article><article class="card case-summary-card urgent"><small>Needs priority review</small><b>${urgent}</b><span>High or urgent concern</span></article><article class="card case-summary-card followup"><small>Follow-ups</small><b>${follow}</b><span>Recovery checks in progress</span></article><article class="card case-summary-card"><small>Resolved</small><b>${closed}</b><span>Outcome and feedback saved</span></article></div>`;
  }

  function filteredCases(cases){return cases.filter(item=>{const animal=animalFor(item.animalId),text=`${item.id} ${item.title} ${item.summary} ${animal.name}`.toLowerCase(),matchesSearch=!caseSearch||text.includes(caseSearch.toLowerCase()),matchesFilter=caseFilter==='all'||(caseFilter==='active'&&item.status!=='closed')||item.status===caseFilter;return matchesSearch&&matchesFilter})}
  function caseListMarkup(cases){
    const list=filteredCases(cases);if(!list.length)return '<div class="case-empty"><span>✓</span>No care cases match this view.</div>';
    return list.map(item=>{const animal=animalFor(item.animalId);return `<button class="case-list-item ${item.id===selectedCaseId?'active':''}" type="button" data-case-id="${safe(item.id)}"><span class="case-animal">${animalIcon(animal)}</span><span><strong>${safe(animal.name)} · ${safe(item.title)}</strong><p>${safe(statusLabel(item.status))} · ${safe(item.assignedVet||'Not assigned')}</p><time>${safe(item.id)} · updated ${safe(dateLabel(item.updatedAt))}</time></span><span class="case-priority ${safe(item.priority)}">${safe(item.priority)}</span></button>`}).join('')
  }

  function detailMarkup(item){
    if(!item)return '<div class="case-select-prompt"><div><span>▤</span><strong>Select a care case</strong><p>Review its observations, veterinary steps, follow-ups and outcome.</p></div></div>';
    const animal=animalFor(item.animalId),delta=Number.isFinite(item.temperature)&&Number.isFinite(item.baseline)?item.temperature-item.baseline:null,priorityText=item.priority==='urgent'?'Urgent veterinary attention is recommended.':item.priority==='high'?'Veterinary review is recommended.':item.priority==='medium'?'Review the concern soon and monitor for change.':'Continue routine monitoring and record meaningful changes.';
    const actions=item.status==='closed'?`<button class="button ghost" type="button" data-case-action="reopen">Reopen case</button>`:`${item.status==='new'||item.status==='monitoring'?'<button class="button primary" type="button" data-case-action="request-vet">Request veterinary review</button>':''}<button class="button ghost" type="button" data-case-action="assessment">Record veterinary assessment</button><button class="button ghost" type="button" data-case-action="follow-up">Add follow-up</button><button class="button ghost" type="button" data-case-action="close">Close case</button>`;
    return `<div class="case-detail-head"><div><div class="eyebrow">${safe(item.id)} · ${safe(item.source)}</div><h2>${animalIcon(animal)} ${safe(animal.name)} — ${safe(item.title)}</h2><p>${safe(animal.species||animal.type||'Animal')} · ${safe(animal.id)} · opened ${safe(dateLabel(item.createdAt))}</p></div><span class="case-status ${statusClass(item.status)}">${safe(statusLabel(item.status))}</span></div>
      <div class="case-context"><div><small>Priority</small><b>${safe(item.priority)}</b></div><div><small>Assigned veterinarian</small><b>${safe(item.assignedVet||'Not assigned')}</b></div><div><small>Recorded temperature</small><b>${Number.isFinite(item.temperature)?`${item.temperature.toFixed(1)}°C`:'Not recorded'}</b></div><div><small>Baseline deviation</small><b>${delta===null?'Not available':`${delta>=0?'+':''}${delta.toFixed(1)}°C`}</b></div></div>
      <div class="case-callout ${item.priority==='urgent'?'urgent':['high','medium'].includes(item.priority)?'warning':''}"><strong>Current guidance</strong>${safe(priorityText)} This care case organizes observations and professional follow-up; it is not a diagnosis or prescription.</div>
      <div class="case-section"><h3>Recorded concern</h3><p style="margin:0;color:var(--muted);font-size:11px">${safe(item.summary)}</p><div class="case-symptoms">${item.symptoms?.length?item.symptoms.map(value=>`<span>${safe(value)}</span>`).join(''):'<span>No structured signs selected</span>'}</div></div>
      <div class="case-section"><h3>Next actions</h3><div class="case-actions">${actions}</div></div>
      <div class="case-section"><h3>Case timeline</h3><div class="case-timeline">${[...(item.timeline||[])].sort((a,b)=>new Date(b.at)-new Date(a.at)).map(event=>`<article class="case-event"><h4>${safe(event.title)}</h4><p>${safe(event.note)}</p><time>${safe(event.by)} · ${safe(dateLabel(event.at))}</time></article>`).join('')}</div></div>
      ${item.outcome?`<div class="case-section"><div class="case-callout"><strong>Recorded outcome</strong>${safe(item.outcome)}${item.alertHelpful?` · Warning feedback: ${safe(item.alertHelpful)}`:''}</div></div>`:''}
      <div class="case-disclaimer">Prototype data is stored only in this browser. A production care workflow requires authenticated users, verified veterinary credentials, consent controls, secure storage and an audit trail.</div>`;
  }

  function showCases(){
    if(rendering)return;rendering=true;
    const main=document.querySelector('#app main');if(!main){rendering=false;return}
    const cases=allCases();if(!selectedCaseId||!caseById(selectedCaseId))selectedCaseId=(cases.find(item=>item.status!=='closed')||cases[0])?.id||null;
    document.querySelectorAll('.nav button').forEach(button=>button.classList.toggle('active',!!button.dataset.careCases));
    main.innerHTML=`<header class="top"><div><div class="eyebrow">Coordinated animal care</div><h1>Care cases</h1><p>Move from an observation or alert to veterinary review, follow-up and a recorded outcome.</p></div><div class="tools"><button class="button primary" type="button" data-new-case>+ Start care case</button></div></header>
      <div class="case-prototype-note"><span>◎</span><div><b>Decision support, not diagnosis.</b> Care cases organize observations and professional follow-up. Urgent symptoms require direct contact with a qualified veterinarian.</div></div>
      ${summaryMarkup(cases)}
      <div class="case-layout"><section class="card case-queue"><div class="head"><h2>Case queue</h2><span class="mini">${cases.length} total</span></div><div class="case-queue-tools"><input type="search" data-case-search value="${safe(caseSearch)}" placeholder="Search animal or case"><select data-case-filter><option value="active" ${caseFilter==='active'?'selected':''}>Open cases</option><option value="all" ${caseFilter==='all'?'selected':''}>All cases</option><option value="new" ${caseFilter==='new'?'selected':''}>New concerns</option><option value="vet-review" ${caseFilter==='vet-review'?'selected':''}>Veterinary review</option><option value="follow-up" ${caseFilter==='follow-up'?'selected':''}>Follow-up</option><option value="closed" ${caseFilter==='closed'?'selected':''}>Resolved</option></select></div><div class="case-list">${caseListMarkup(cases)}</div></section><section class="card case-detail">${detailMarkup(caseById(selectedCaseId))}</section></div>
      <p class="footer">HerdCare supports animal monitoring, recordkeeping and coordinated follow-up. It does not replace examination by a qualified veterinarian.</p>`;
    window.history.replaceState(null,'','#cases');
    main.querySelector('[data-new-case]').onclick=()=>newCase();
    main.querySelector('[data-case-search]').oninput=event=>{caseSearch=event.target.value;refreshQueue()};
    main.querySelector('[data-case-filter]').onchange=event=>{caseFilter=event.target.value;refreshQueue()};
    bindCaseControls(main);rendering=false;mountNav();
  }

  function refreshQueue(){const main=document.querySelector('#app main'),list=main?.querySelector('.case-list');if(!list)return;list.innerHTML=caseListMarkup(allCases());bindCaseControls(main)}
  function bindCaseControls(root){
    root.querySelectorAll('[data-case-id]').forEach(button=>button.onclick=()=>{selectedCaseId=button.dataset.caseId;showCases()});
    root.querySelectorAll('[data-case-action]').forEach(button=>button.onclick=()=>{const item=caseById(selectedCaseId);if(!item)return;({
      'request-vet':requestVet,'assessment':recordAssessment,'follow-up':addFollowUp,'close':closeCase,'reopen':reopenCase
    }[button.dataset.caseAction]||(()=>{}))(item)});
  }

  function mountNav(){
    const nav=document.querySelector('.nav');if(!nav)return;
    let button=nav.querySelector('[data-care-cases]');
    if(!button){button=document.createElement('button');button.type='button';button.dataset.careCases='true';const history=nav.querySelector('[data-page="history"]');if(history)history.after(button);else nav.append(button);button.onclick=showCases}
    const count=activeCases().length,markup=`<span>▤</span>${safe(NAV_LABEL[language()]||NAV_LABEL.en)}${count?`<span class="care-case-count">${count}</span>`:''}`;if(button.innerHTML!==markup)button.innerHTML=markup;button.classList.toggle('active',location.hash==='#cases');
  }

  function decorateAlertButtons(){
    const state=appState(),animal=state.cattle?.find(item=>item.id===state.selected)||state.cattle?.[0];if(!animal)return;
    document.querySelectorAll('.alerts .alert,.notice,.thermal-status.monitor,.thermal-status.urgent').forEach(block=>{
      if(block.querySelector('.case-alert-button'))return;const button=document.createElement('button');button.type='button';button.className='case-alert-button';button.textContent='Start care case';button.onclick=event=>{event.preventDefault();event.stopPropagation();newCase({animalId:animal.id,source:'Temperature alert',priority:block.classList.contains('urgent')?'urgent':'high',summary:`${animal.name} has an irregular temperature pattern that needs structured monitoring and possible veterinary review.`,symptoms:['Temperature change']})};block.append(button)
    });
    document.querySelectorAll('.ai-photo-result').forEach(result=>{const actions=result.parentElement?.querySelector('.modal-actions');if(!actions||actions.querySelector('[data-photo-case]'))return;const button=document.createElement('button');button.type='button';button.className='button ghost';button.dataset.photoCase='true';button.textContent='Start care case';button.onclick=()=>newCase({animalId:animal.id,source:'Photo observation',priority:animal.lastPhotoReview?.urgency==='urgent'?'urgent':'high',summary:`A photo observation for ${animal.name} needs veterinary review. Image findings are preliminary and are not a diagnosis.`});actions.prepend(button)})
  }

  let queued=false;const schedule=()=>{if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;mountNav();decorateAlertButtons();if(location.hash==='#cases'&&!document.querySelector('.case-layout'))showCases()})};
  window.HerdCareCases={open:newCase,list:()=>allCases().map(item=>({...item})),show:showCases};
  window.addEventListener('hashchange',()=>{if(location.hash==='#cases')showCases();else mountNav()});
  window.addEventListener('herdcare:cases-updated',schedule);
  window.addEventListener('storage',schedule);
  document.addEventListener('change',event=>{if(event.target.matches?.('[data-language-select],#language'))schedule()});
  const root=document.getElementById('app');if(root)new MutationObserver(schedule).observe(root,{childList:true});
  seedCases();schedule();
})();
