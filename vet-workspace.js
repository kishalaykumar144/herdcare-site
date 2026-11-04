/* HerdCare veterinary workspace: professional case coordination for the browser prototype. */
(()=>{
  const APP_KEY='herdcare-working-prototype-v1';
  const CASE_KEY='herdcare-care-cases-v1';
  const VET_KEY='herdcare-vet-profiles-v1';
  const PROFILE_KEY='herdcare-vet-workspace-profile-v1';
  const STATUS={new:'New concern',monitoring:'Monitoring','vet-review':'Veterinary review',treatment:'Care plan underway','follow-up':'Follow-up due',closed:'Resolved'};
  const ICON={Dog:'🐕',Cat:'🐈',Cow:'🐄',Buffalo:'🐃',Goat:'🐐',Sheep:'🐑',Other:'🐾'};
  const safe=value=>String(value??'').replace(/[&<>'"]/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[char]));
  const readJson=(key,fallback)=>{try{return JSON.parse(localStorage.getItem(key))??fallback}catch{return fallback}};
  const nowIso=()=>new Date().toISOString();
  const dateLabel=value=>{const date=new Date(value);return Number.isNaN(date.valueOf())?'Not scheduled':date.toLocaleString([], {month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'})};
  const appState=()=>readJson(APP_KEY,{cattle:[],vets:[]});
  const caseStore=()=>readJson(CASE_KEY,{schemaVersion:1,cases:[]});
  const animals=()=>appState().cattle||[];
  const animalFor=id=>animals().find(animal=>animal.id===id)||{id:id||'unknown',name:'Animal',species:'Other'};
  const iconFor=animal=>ICON[animal.species]||ICON.Other;
  const toast=message=>{const box=document.getElementById('toast');if(!box)return;box.textContent=message;box.classList.add('show');clearTimeout(window.herdcareVetWorkspaceToast);window.herdcareVetWorkspaceToast=setTimeout(()=>box.classList.remove('show'),3500)};
  let queueView='urgent';
  let queueSearch='';
  let selectedCaseId=null;
  let rendering=false;

  function profiles(){
    const state=appState();
    const base=(state.vets||[]).map(vet=>({name:vet.name,clinic:vet.clinic||'Veterinary practice',registration:'Directory listing',specialty:'Livestock & general veterinary care',verified:true,phone:vet.phone||'',address:vet.address||''}));
    const saved=readJson(VET_KEY,[]);
    const unique=new Map([...base,...saved].map(profile=>[profile.name,profile]));
    return [...unique.values()];
  }
  function activeVet(){
    const list=profiles();
    const selected=localStorage.getItem(PROFILE_KEY);
    return list.find(profile=>profile.name===selected)||list[0]||{name:'Veterinary professional',clinic:'HerdCare workspace',verified:false};
  }
  const casesForVet=()=>{const vet=activeVet();return (caseStore().cases||[]).filter(item=>!item.assignedVet||item.assignedVet===vet.name)};
  const isOpen=item=>item.status!=='closed';
  const futureVisits=item=>(item.visits||[]).filter(visit=>visit.status!=='cancelled'&&visit.status!=='completed'&&new Date(visit.at)>new Date()).sort((a,b)=>new Date(a.at)-new Date(b.at));
  const followUpDue=item=>{if(!isOpen(item))return false;if(item.status==='follow-up')return true;if(!item.followUpAt)return false;const follow=new Date(item.followUpAt);return !Number.isNaN(follow.valueOf())&&follow<=new Date(Date.now()+7*86400000)};
  function groups(){
    const cases=casesForVet();
    return {
      new:cases.filter(item=>item.status==='new'),
      urgent:cases.filter(item=>isOpen(item)&&['high','urgent'].includes(item.priority)),
      visits:cases.filter(item=>futureVisits(item).length),
      followups:cases.filter(followUpDue),
      resolved:cases.filter(item=>item.status==='closed').sort((a,b)=>new Date(b.closedAt||b.updatedAt)-new Date(a.closedAt||a.updatedAt))
    };
  }
  function queueItems(){
    const sets=groups();
    const source=queueView==='all'?casesForVet():sets[queueView]||[];
    const query=queueSearch.toLowerCase().trim();
    return source.filter(item=>{const animal=animalFor(item.animalId);return !query||`${item.id} ${item.title} ${item.summary} ${animal.name} ${item.assignedVet}`.toLowerCase().includes(query)}).sort((a,b)=>{
      const weight={urgent:0,high:1,medium:2,low:3};
      return (weight[a.priority]??4)-(weight[b.priority]??4)||new Date(b.updatedAt)-new Date(a.updatedAt);
    });
  }
  function saveCase(updated){
    const store=caseStore();
    const index=(store.cases||[]).findIndex(item=>item.id===updated.id);
    if(index<0)return;
    updated.updatedAt=nowIso();
    store.cases[index]=updated;
    localStorage.setItem(CASE_KEY,JSON.stringify(store));
    window.dispatchEvent(new CustomEvent('herdcare:cases-updated'));
    selectedCaseId=updated.id;
    showWorkspace();
  }
  function addTimeline(item,title,note,type='vet-update'){
    const at=nowIso();
    item.timeline=item.timeline||[];
    item.timeline.push({id:`vet-event-${Date.now()}`,type,title,note,by:activeVet().name,at});
    return at;
  }
  function modal(title,copy,fields,onSubmit,submitLabel='Save'){
    const root=document.getElementById('modal'),form=document.getElementById('modal-form');
    if(!root||!form)return;
    document.getElementById('modal-title').textContent=title;
    document.getElementById('modal-copy').textContent=copy;
    form.innerHTML=`${fields}<div class="modal-actions"><button class="button ghost" type="button" data-vet-cancel>Cancel</button><button class="button primary" type="submit">${safe(submitLabel)}</button></div>`;
    root.classList.add('open');
    const close=()=>root.classList.remove('open');
    form.querySelector('[data-vet-cancel]').onclick=close;
    form.onsubmit=event=>{event.preventDefault();const result=onSubmit(new FormData(form));if(result!==false)close()};
  }
  function confirmAlert(item){
    const vet=activeVet();
    if(!item.assignedVet)item.assignedVet=vet.name;
    item.alertConfirmed=true;item.alertConfirmedAt=nowIso();item.alertConfirmedBy=vet.name;
    if(item.status==='new')item.status='vet-review';
    addTimeline(item,'Alert confirmed by veterinarian','The source alert and available animal history were reviewed. Confirmation records triage acknowledgement; it is not a diagnosis.','alert-confirmed');
    saveCase(item);toast(`${item.id} alert confirmed.`);
  }
  function addCaseNote(item){
    modal('Add case note','Record a professional observation without replacing an in-person examination.',`
      <label>Note type<select name="category"><option>Triage note</option><option>Clinical observation</option><option>Visit note</option><option>Care-plan clarification</option><option>Follow-up note</option></select></label>
      <label>Case note<textarea name="note" required placeholder="Record relevant findings, reasoning, or instructions. Avoid unconfirmed diagnosis or prescription claims."></textarea></label>
      <div class="vet-workspace-modal-note">This browser prototype does not verify the author’s credentials. Production records require authenticated professionals and an audit trail.</div>`,data=>{
        const at=nowIso(),category=data.get('category'),note=String(data.get('note')).trim();
        item.caseNotes=item.caseNotes||[];item.caseNotes.push({id:`note-${Date.now()}`,category,note,by:activeVet().name,at});
        addTimeline(item,category,note,'case-note');saveCase(item);toast('Case note saved.');
      },'Save case note');
  }
  function communicate(item){
    modal('Farmer communication','Log a message or conversation associated with this case.',`
      <label>Channel<select name="channel"><option>In-app message</option><option>Phone call</option><option>SMS</option><option>Clinic conversation</option></select></label>
      <label>Communication<textarea name="message" required placeholder="Summarize the advice, questions, or update shared with the animal owner."></textarea></label>
      <div class="vet-workspace-modal-note"><strong>Prototype:</strong> this records the communication locally; it does not send a real message or place a call.</div>`,data=>{
        const at=nowIso(),channel=data.get('channel'),message=String(data.get('message')).trim();
        item.messages=item.messages||[];item.messages.push({id:`message-${Date.now()}`,direction:'outbound',channel,message,by:activeVet().name,at});
        addTimeline(item,'Farmer communication recorded',`${channel}: ${message}`,'communication');saveCase(item);toast('Farmer communication logged locally.');
      },'Log communication');
  }
  function scheduleVisit(item){
    const suggested=new Date(Date.now()+86400000);suggested.setMinutes(0,0,0);
    const localValue=new Date(suggested.getTime()-suggested.getTimezoneOffset()*60000).toISOString().slice(0,16);
    modal('Schedule a visit','Add an upcoming appointment to the case workspace.',`
      <label>Visit date and time<input name="at" type="datetime-local" min="${new Date().toISOString().slice(0,16)}" value="${localValue}" required></label>
      <label>Visit type<select name="type"><option>Clinic visit</option><option>Farm visit</option><option>Video review</option><option>Phone follow-up</option></select></label>
      <label>Location or connection detail<input name="location" required placeholder="Clinic, farm address, or video link note"></label>
      <label>Preparation note<textarea name="note" placeholder="Records, samples, photos, or monitoring data to prepare."></textarea></label>`,data=>{
        const at=new Date(data.get('at')).toISOString(),type=data.get('type'),location=String(data.get('location')).trim(),note=String(data.get('note')).trim();
        item.visits=item.visits||[];item.visits.push({id:`visit-${Date.now()}`,at,type,location,note,status:'scheduled',createdBy:activeVet().name});
        item.nextVisitAt=at;if(item.status==='new')item.status='vet-review';
        addTimeline(item,'Visit scheduled',`${type} · ${dateLabel(at)} · ${location}${note?` · ${note}`:''}`,'visit');saveCase(item);toast('Upcoming visit added.');
      },'Schedule visit');
  }
  function recordFollowUp(item){
    modal('Record follow-up','Update recovery progress and the next review date.',`
      <label>Current progress<select name="progress"><option>Improving</option><option>No meaningful change</option><option>Worsening — urgent review</option><option>Recovered</option></select></label>
      <label>Follow-up note<textarea name="note" required placeholder="Record current signs, response, owner report, or measurements."></textarea></label>
      <label>Next review<input name="next" type="datetime-local"></label>`,data=>{
        const progress=data.get('progress'),note=String(data.get('note')).trim();
        item.status=progress==='Recovered'?'follow-up':progress.startsWith('Worsening')?'vet-review':'follow-up';
        if(progress.startsWith('Worsening'))item.priority='urgent';
        item.followUpAt=data.get('next')?new Date(data.get('next')).toISOString():'';
        addTimeline(item,`Veterinary follow-up: ${progress}`,note,'follow-up');saveCase(item);toast('Follow-up recorded.');
      },'Save follow-up');
  }
  function resolveCase(item){
    modal('Resolve case','Record the outcome and the usefulness of the original warning.',`
      <label>Outcome<select name="outcome"><option>Recovered</option><option>Stable — routine monitoring continues</option><option>Referred for further examination</option><option>Case closed for another reason</option></select></label>
      <label>Original alert usefulness<select name="helpful"><option value="yes">Useful</option><option value="partly">Partly useful</option><option value="no">False or unhelpful alert</option><option value="unknown">Not known</option></select></label>
      <label>Resolution note<textarea name="note" required placeholder="Summarize the documented outcome and any continuing monitoring."></textarea></label>`,data=>{
        item.status='closed';item.outcome=data.get('outcome');item.alertHelpful=data.get('helpful');item.closedAt=nowIso();
        addTimeline(item,'Case resolved',`${data.get('outcome')}. ${String(data.get('note')).trim()} Alert usefulness: ${data.get('helpful')}.`,'closed');queueView='resolved';saveCase(item);toast(`${item.id} moved to recently resolved.`);
      },'Resolve case');
  }
  function reopenCase(item){item.status='monitoring';item.closedAt='';addTimeline(item,'Case reopened','Monitoring resumed after a continuing or new concern.','reopened');saveCase(item);toast(`${item.id} reopened.`)}
  function manageProfile(){
    const vet=activeVet();
    modal('Professional workspace profile','Add or update the profile used for case assignment and audit labels in this prototype.',`
      <label>Full name<input name="name" required value="${safe(vet.name==='Veterinary professional'?'':vet.name)}" placeholder="e.g. Dr. Priya Shah"></label>
      <label>Clinic or practice<input name="clinic" required value="${safe(vet.clinic||'')}" placeholder="Practice name"></label>
      <label>Registration number<input name="registration" required value="${safe(vet.registration||'')}" placeholder="VCI / state registration number"></label>
      <label>Specialty<input name="specialty" required value="${safe(vet.specialty||'')}" placeholder="e.g. Cattle medicine"></label>
      <label>Phone<input name="phone" type="tel" value="${safe(vet.phone||'')}" placeholder="Contact number"></label>
      <div class="vet-workspace-modal-note">New or edited profiles remain pending verification until a production credential-validation process is connected.</div>`,data=>{
        const name=String(data.get('name')).trim(),saved=readJson(VET_KEY,[]),record={id:vet.id||`vet-${Date.now()}`,name,clinic:String(data.get('clinic')).trim(),registration:String(data.get('registration')).trim(),specialty:String(data.get('specialty')).trim(),phone:String(data.get('phone')).trim(),address:vet.address||'',availability:vet.availability||'By appointment',verified:false};
        const index=saved.findIndex(profile=>profile.name===vet.name||profile.name===name);if(index>=0)saved[index]=record;else saved.unshift(record);
        localStorage.setItem(VET_KEY,JSON.stringify(saved));localStorage.setItem(PROFILE_KEY,name);showWorkspace();toast('Professional workspace profile saved locally.');
      },'Save profile');
  }
  function queueMarkup(items){
    if(!items.length)return '<div class="vet-queue-empty"><span>✓</span>No cases in this workspace view.</div>';
    return items.map(item=>{const animal=animalFor(item.animalId),visit=futureVisits(item)[0];return `<button class="vet-case-row ${item.id===selectedCaseId?'active':''}" type="button" data-vet-case="${safe(item.id)}"><span class="animal">${iconFor(animal)}</span><span><strong>${safe(animal.name)} · ${safe(item.title)}</strong><p>${safe(STATUS[item.status]||item.status)}${visit?` · visit ${safe(dateLabel(visit.at))}`:''}</p><time>${safe(item.id)} · ${safe(dateLabel(item.updatedAt))}</time></span><span class="vet-priority ${safe(item.priority)}">${safe(item.priority)}</span></button>`}).join('');
  }
  const notesMarkup=item=>{const notes=[...(item.caseNotes||[])].sort((a,b)=>new Date(b.at)-new Date(a.at));return notes.length?notes.map(note=>`<article class="vet-note"><strong>${safe(note.category)}</strong><p>${safe(note.note)}</p><time>${safe(note.by)} · ${safe(dateLabel(note.at))}</time></article>`).join(''):'<div class="vet-panel-empty">No professional notes recorded yet.</div>'};
  const messagesMarkup=item=>{const messages=[...(item.messages||[])].sort((a,b)=>new Date(b.at)-new Date(a.at));return messages.length?messages.map(message=>`<article class="vet-message ${safe(message.direction||'outbound')}"><strong>${safe(message.channel)} · ${message.direction==='incoming'?'Farmer update':'Veterinary update'}</strong><p>${safe(message.message)}</p><time>${safe(message.by)} · ${safe(dateLabel(message.at))}</time></article>`).join(''):'<div class="vet-panel-empty">No farmer communication logged for this case.</div>'};
  const visitsMarkup=item=>{const visits=[...(item.visits||[])].sort((a,b)=>new Date(a.at)-new Date(b.at));return visits.length?visits.map(visit=>`<article class="vet-visit"><div><strong>${safe(visit.type)} · ${safe(dateLabel(visit.at))}</strong><p>${safe(visit.location)}${visit.note?` · ${safe(visit.note)}`:''}</p><time>Created by ${safe(visit.createdBy||'Veterinary workspace')}</time></div><span class="vet-visit-status">${safe(visit.status||'scheduled')}</span></article>`).join(''):'<div class="vet-panel-empty">No visits scheduled for this case.</div>'};
  function detailMarkup(item){
    if(!item)return '<div class="vet-case-select"><div><span>⚕</span><strong>Select a case</strong><p>Review alerts, notes, visits, follow-ups and communication.</p></div></div>';
    const animal=animalFor(item.animalId),delta=Number.isFinite(item.temperature)&&Number.isFinite(item.baseline)?item.temperature-item.baseline:null,confirmed=item.alertConfirmed;
    const timeline=[...(item.timeline||[])].sort((a,b)=>new Date(b.at)-new Date(a.at));
    return `<div class="vet-detail-head"><div><div class="eyebrow">${safe(item.id)} · ${safe(item.source)}</div><h2>${iconFor(animal)} ${safe(animal.name)} — ${safe(item.title)}</h2><p>${safe(animal.species||'Animal')} · ${safe(animal.id)} · assigned to ${safe(item.assignedVet||'unassigned queue')}</p><span class="vet-alert-confirmed ${confirmed?'':'pending'}">${confirmed?'✓ Alert confirmed by '+safe(item.alertConfirmedBy||'veterinarian'):'○ Alert awaiting veterinary confirmation'}</span></div><span class="vet-status ${item.status==='closed'?'closed':''}">${safe(STATUS[item.status]||item.status)}</span></div>
      <div class="vet-detail-metrics"><div><small>Priority</small><b>${safe(item.priority)}</b></div><div><small>Temperature</small><b>${Number.isFinite(item.temperature)?`${item.temperature.toFixed(1)}°C`:'Not recorded'}</b></div><div><small>Baseline difference</small><b>${delta===null?'Not available':`${delta>=0?'+':''}${delta.toFixed(1)}°C`}</b></div><div><small>Follow-up</small><b>${item.followUpAt?safe(dateLabel(item.followUpAt)):'Not scheduled'}</b></div></div>
      <div class="vet-alert-panel ${item.priority==='urgent'?'urgent':''}"><div><strong>${confirmed?'Alert acknowledged':'Alert confirmation required'}</strong><span>${safe(item.summary)} Confirmation documents professional review; it does not confirm a diagnosis.</span></div>${!confirmed&&item.status!=='closed'?'<button class="button primary" type="button" data-vet-action="confirm-alert">Confirm alert</button>':''}</div>
      <div class="vet-detail-actions">${item.status==='closed'?'<button class="button ghost" type="button" data-vet-action="reopen">Reopen case</button>':'<button class="button primary" type="button" data-vet-action="note">+ Case note</button><button class="button ghost" type="button" data-vet-action="communicate">Farmer communication</button><button class="button ghost" type="button" data-vet-action="visit">Schedule visit</button><button class="button ghost" type="button" data-vet-action="follow-up">Record follow-up</button><button class="button ghost" type="button" data-vet-action="resolve">Resolve case</button>'}</div>
      <div class="vet-detail-grid"><section class="vet-panel"><div class="vet-panel-head"><h3>Case notes</h3><span>${(item.caseNotes||[]).length}</span></div>${notesMarkup(item)}</section><section class="vet-panel"><div class="vet-panel-head"><h3>Farmer communication</h3><span>${(item.messages||[]).length}</span></div>${messagesMarkup(item)}</section><section class="vet-panel full"><div class="vet-panel-head"><h3>Visits & follow-ups</h3><span>${(item.visits||[]).length} scheduled records</span></div>${visitsMarkup(item)}</section><section class="vet-panel full"><div class="vet-panel-head"><h3>Case timeline</h3><span>${timeline.length} events</span></div>${timeline.length?timeline.map(event=>`<article class="vet-timeline-event"><strong>${safe(event.title)}</strong><p>${safe(event.note)}</p><time>${safe(event.by)} · ${safe(dateLabel(event.at))}</time></article>`).join(''):'<div class="vet-panel-empty">No timeline events yet.</div>'}</section></div>
      ${item.outcome?`<div class="vet-prototype-note"><strong>Recorded outcome:</strong> ${safe(item.outcome)} · Alert feedback: ${safe(item.alertHelpful||'not recorded')}</div>`:''}
      <div class="vet-prototype-note"><strong>Professional workspace prototype:</strong> records remain in this browser. Production use requires authenticated veterinarians, owner consent, secure messaging, protected health records, audit logs, and emergency escalation outside this interface.</div>`;
  }
  function bind(root){
    root.querySelectorAll('[data-vet-view]').forEach(button=>button.onclick=()=>{queueView=button.dataset.vetView;selectedCaseId=null;showWorkspace()});
    root.querySelector('[data-vet-search]').oninput=event=>{queueSearch=event.target.value;refreshQueue()};
    root.querySelector('[data-vet-filter]').onchange=event=>{queueView=event.target.value;selectedCaseId=null;showWorkspace()};
    root.querySelector('[data-vet-profile]').onchange=event=>{localStorage.setItem(PROFILE_KEY,event.target.value);selectedCaseId=null;showWorkspace()};
    root.querySelector('[data-manage-vet-profile]').onclick=manageProfile;
    bindCaseControls(root);
  }
  function bindCaseControls(root){
    root.querySelectorAll('[data-vet-case]').forEach(button=>button.onclick=()=>{selectedCaseId=button.dataset.vetCase;showWorkspace()});
    root.querySelectorAll('[data-vet-action]').forEach(button=>button.onclick=()=>{const item=(caseStore().cases||[]).find(entry=>entry.id===selectedCaseId);if(!item)return;({
      'confirm-alert':confirmAlert,note:addCaseNote,communicate,scheduleVisit,visit:scheduleVisit,'follow-up':recordFollowUp,resolve:resolveCase,reopen:reopenCase
    }[button.dataset.vetAction]||(()=>{}))(item)});
  }
  function refreshQueue(){const list=document.querySelector('.vet-case-list');if(!list)return;const items=queueItems();list.innerHTML=queueMarkup(items);document.querySelector('.vet-queue-head span').textContent=`${items.length} cases`;bindCaseControls(document.querySelector('#app main'))}
  function showWorkspace(){
    if(rendering)return;rendering=true;
    const main=document.querySelector('#app main');if(!main){rendering=false;return}
    const sets=groups(),items=queueItems();
    if(!selectedCaseId||!items.some(item=>item.id===selectedCaseId))selectedCaseId=items[0]?.id||null;
    const selected=(caseStore().cases||[]).find(item=>item.id===selectedCaseId);
    const vet=activeVet(),list=profiles();
    document.querySelectorAll('.nav button').forEach(button=>button.classList.toggle('active',!!button.dataset.vetPortal));
    main.innerHTML=`<header class="top"><div><div class="eyebrow">Veterinary case coordination</div><h1>Vet Portal</h1><p>Triage incoming alerts, coordinate visits, document follow-ups and close the care loop.</p></div><div class="tools"><span class="mini">${vet.verified?'Verified directory profile':'Prototype profile'}</span></div></header>
      <div class="vet-workspace-intro"><div><span class="vet-intro-icon">⚕</span><div><b>Professional workspace</b>Use Care Case observations as decision support, confirm urgent alerts, and keep farmers informed. Emergency care still requires direct clinical contact.</div></div><div class="vet-workspace-profile"><label>Working as<select data-vet-profile>${list.map(profile=>`<option ${profile.name===vet.name?'selected':''}>${safe(profile.name)}</option>`).join('')}</select></label><button class="button ghost" type="button" data-manage-vet-profile>Manage profile</button></div></div>
      <div class="vet-workspace-summary"><button class="vet-summary-card ${queueView==='new'?'active':''}" type="button" data-vet-view="new"><small>New cases</small><b>${sets.new.length}</b><span>Awaiting first review</span></button><button class="vet-summary-card urgent ${queueView==='urgent'?'active':''}" type="button" data-vet-view="urgent"><small>Urgent cases</small><b>${sets.urgent.length}</b><span>High-priority open cases</span></button><button class="vet-summary-card ${queueView==='visits'?'active':''}" type="button" data-vet-view="visits"><small>Upcoming visits</small><b>${sets.visits.length}</b><span>Scheduled case visits</span></button><button class="vet-summary-card followup ${queueView==='followups'?'active':''}" type="button" data-vet-view="followups"><small>Follow-ups due</small><b>${sets.followups.length}</b><span>Review now or within 7 days</span></button><button class="vet-summary-card ${queueView==='resolved'?'active':''}" type="button" data-vet-view="resolved"><small>Recently resolved</small><b>${sets.resolved.length}</b><span>Documented outcomes</span></button></div>
      <div class="vet-workspace-layout"><section class="card vet-case-queue"><div class="vet-queue-head"><h2>${safe({new:'New cases',urgent:'Urgent cases',visits:'Upcoming visits',followups:'Follow-ups due',resolved:'Recently resolved',all:'All assigned cases'}[queueView]||'Cases')}</h2><span>${items.length} cases</span></div><div class="vet-queue-tools"><input type="search" data-vet-search value="${safe(queueSearch)}" placeholder="Search animal or case"><select data-vet-filter><option value="new" ${queueView==='new'?'selected':''}>New cases</option><option value="urgent" ${queueView==='urgent'?'selected':''}>Urgent cases</option><option value="visits" ${queueView==='visits'?'selected':''}>Upcoming visits</option><option value="followups" ${queueView==='followups'?'selected':''}>Follow-ups due</option><option value="resolved" ${queueView==='resolved'?'selected':''}>Recently resolved</option><option value="all" ${queueView==='all'?'selected':''}>All assigned cases</option></select></div><div class="vet-case-list">${queueMarkup(items)}</div></section><section class="card vet-case-detail">${detailMarkup(selected)}</section></div>
      <p class="footer">HerdCare supports coordinated animal care and recordkeeping. It does not replace examination, diagnosis, or emergency response by a qualified veterinarian.</p>`;
    window.history.replaceState(null,'','#vet-workspace');
    bind(main);rendering=false;mountNav();
  }
  function mountNav(){
    const nav=document.querySelector('.nav');if(!nav)return;
    const button=nav.querySelector('[data-vet-portal]');if(!button)return;
    if(button.innerHTML!=='<span>⚕</span>Vet Portal')button.innerHTML='<span>⚕</span>Vet Portal';
    if(!button.__herdcareWorkspace){button.onclick=showWorkspace;button.__herdcareWorkspace=true}
    button.classList.toggle('active',location.hash==='#vet-workspace');
  }
  let queued=false;const schedule=()=>{if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;mountNav();if(location.hash==='#vet-workspace'&&!document.querySelector('.vet-workspace-layout'))showWorkspace()})};
  window.HerdCareVetWorkspace={show:showWorkspace,profile:()=>({...activeVet()})};
  window.addEventListener('hashchange',()=>{if(location.hash==='#vet-workspace')showWorkspace();else mountNav()});
  window.addEventListener('herdcare:cases-updated',schedule);
  window.addEventListener('storage',schedule);
  const root=document.getElementById('app');if(root)new MutationObserver(schedule).observe(root,{childList:true});
  schedule();
})();
