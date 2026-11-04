/* HerdCare Community Signals: privacy-preserving, village-level demonstration data. */
(()=>{
  const APP_KEY='herdcare-working-prototype-v1';
  const CASE_KEY='herdcare-care-cases-v1';
  const MODEL_KEY='herdcare-technical-model-v1';
  const LANGUAGE_KEY='herdcare-language-v1';
  const MIN_CLUSTER_REPORTS=3;
  const NAV_LABEL={en:'Community signals',hi:'सामुदायिक संकेत',bn:'কমিউনিটি সংকেত',mr:'समुदाय संकेत'};
  const AREA_META=[
    {code:'village-north',name:'North village zone',short:'N-1',x:8,y:10,w:28,h:31},
    {code:'village-east',name:'East village zone',short:'E-2',x:38,y:8,w:25,h:34},
    {code:'village-hills',name:'Hill-side village zone',short:'H-3',x:66,y:11,w:27,h:27},
    {code:'village-riverside',name:'Riverside village zone',short:'R-4',x:7,y:47,w:31,h:38},
    {code:'village-market',name:'Market-belt village zone',short:'M-5',x:41,y:46,w:28,h:38},
    {code:'village-south',name:'South fields village zone',short:'S-6',x:72,y:44,w:21,h:41}
  ];
  const SYNDROMES={
    'fever-respiratory':'Fever / respiratory signs',
    'digestive':'Digestive signs',
    'udder-milk':'Udder / milk changes',
    'skin-movement':'Skin / movement changes',
    'none':'No similar reports'
  };
  const STATUS={
    normal:{label:'Normal area',copy:'No similar report pattern is visible in this demonstration area.',icon:'✓'},
    monitoring:{label:'Increased monitoring',copy:'Some similar reports exist, but the minimum cluster display threshold has not been reached.',icon:'◎'},
    'similar-reports':{label:'Multiple similar reports',copy:'At least three similar village-level reports are grouped for monitoring. This is not a diagnosis or outbreak declaration.',icon:'≋'},
    'vet-confirmed':{label:'Veterinarian-confirmed cluster',copy:'The minimum report threshold is met and a veterinarian has reviewed the demonstration grouping.',icon:'✚'}
  };
  const safe=value=>String(value??'').replace(/[&<>'"]/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[char]));
  const readJson=(key,fallback)=>{try{const value=JSON.parse(localStorage.getItem(key));return value??fallback}catch{return fallback}};
  const clone=value=>JSON.parse(JSON.stringify(value));
  const nowIso=()=>new Date().toISOString();
  const sourceCode=value=>{
    const text=String(value||'manual-observation').toLowerCase();
    if(text.includes('temperature'))return 'temperature-alert';
    if(text.includes('photo'))return 'photo-observation';
    if(text.includes('movement')||text.includes('activity'))return 'activity-alert';
    if(text.includes('vaccination')||text.includes('medication'))return 'care-follow-up';
    if(text.includes('veterinary'))return 'veterinary-recommendation';
    return text.replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')||'manual-observation';
  };

  function normalizedCases(){
    const store=readJson(CASE_KEY,{cases:[]}),items=Array.isArray(store?.cases)?store.cases:[];
    if(!items.length)return [{id:'HC-0001',animalId:'GV-042',status:'vet-review',source:'temperature-alert',symptoms:[],observations:[],vetNotes:[],followUps:[],openedAt:nowIso(),closedAt:null}];
    return items.map(item=>{
      const timeline=Array.isArray(item.timeline)?item.timeline:[];
      const notesFor=types=>timeline.filter(event=>types.includes(event.type)).map(event=>({at:event.at||item.updatedAt||item.createdAt||nowIso(),note:event.note||event.title||'',by:event.by||'HerdCare'}));
      return {
        id:item.id,
        animalId:item.animalId,
        status:item.status||'new',
        source:sourceCode(item.source),
        symptoms:Array.isArray(item.symptoms)?item.symptoms:[],
        observations:Array.isArray(item.observations)?item.observations:notesFor(['created','update']),
        vetNotes:Array.isArray(item.vetNotes)?item.vetNotes:notesFor(['review','assessment']),
        followUps:Array.isArray(item.followUps)?item.followUps:notesFor(['follow-up']),
        openedAt:item.openedAt||item.createdAt||nowIso(),
        closedAt:item.closedAt||null
      };
    });
  }

  function seedModel(){
    const current=readJson(MODEL_KEY,null),firstAnimal=normalizedCases()[0]?.animalId||'GV-042';
    const model=current&&typeof current==='object'?current:{};
    model.schemaVersion=1;
    model.cases=normalizedCases();
    if(!Array.isArray(model.passportEvents)||!model.passportEvents.length)model.passportEvents=[
      {animalId:firstAnimal,type:'vaccination',date:'2026-10-02',verifiedBy:'vet-demo-102'},
      {animalId:firstAnimal,type:'health-check',date:'2026-10-21',verifiedBy:'vet-demo-102'}
    ];
    if(!Array.isArray(model.communitySignals)||!model.communitySignals.length)model.communitySignals=[
      {area:'village-north',syndrome:'none',confidence:'normal',reportCount:0},
      {area:'village-east',syndrome:'fever-respiratory',confidence:'monitoring',reportCount:2},
      {area:'village-hills',syndrome:'none',confidence:'normal',reportCount:0},
      {area:'village-riverside',syndrome:'fever-respiratory',confidence:'similar-reports',reportCount:4},
      {area:'village-market',syndrome:'digestive',confidence:'vet-confirmed',reportCount:6,veterinarianConfirmed:true},
      {area:'village-south',syndrome:'skin-movement',confidence:'monitoring',reportCount:1}
    ];
    localStorage.setItem(MODEL_KEY,JSON.stringify(model));return model;
  }
  const readModel=()=>readJson(MODEL_KEY,null)||seedModel();
  const writeModel=model=>{model.schemaVersion=1;localStorage.setItem(MODEL_KEY,JSON.stringify(model));window.dispatchEvent(new CustomEvent('herdcare:model-updated'))};
  const derivedStatus=signal=>{
    const count=Math.max(0,Number(signal?.reportCount)||0);
    if(count<1)return 'normal';
    if(count<MIN_CLUSTER_REPORTS)return 'monitoring';
    return signal?.veterinarianConfirmed||signal?.confidence==='vet-confirmed'?'vet-confirmed':'similar-reports';
  };
  const signalRank=value=>({normal:0,monitoring:1,'similar-reports':2,'vet-confirmed':3}[value]||0);
  const areaName=code=>AREA_META.find(area=>area.code===code)?.name||code;
  const syndromeName=value=>SYNDROMES[value]||String(value||'Not specified');
  const language=()=>localStorage.getItem(LANGUAGE_KEY)||'en';
  let syndromeFilter='all';
  let selectedArea='village-market';
  let queued=false;

  function syncCases(){
    const model=readJson(MODEL_KEY,null)||seedModel();
    model.cases=normalizedCases();
    localStorage.setItem(MODEL_KEY,JSON.stringify(model));
  }
  function visibleSignals(model){return (model.communitySignals||[]).filter(signal=>syndromeFilter==='all'||signal.syndrome===syndromeFilter)}
  function representativeSignal(areaCode,model){
    const candidates=visibleSignals(model).filter(signal=>signal.area===areaCode);
    if(!candidates.length)return {area:areaCode,syndrome:syndromeFilter==='all'?'none':syndromeFilter,confidence:'normal',reportCount:0};
    return [...candidates].sort((a,b)=>signalRank(derivedStatus(b))-signalRank(derivedStatus(a))||Number(b.reportCount)-Number(a.reportCount))[0];
  }
  function reportLabel(signal){
    const status=derivedStatus(signal),count=Number(signal.reportCount)||0;
    if(status==='normal')return 'No visible pattern';
    if(status==='monitoring')return `Below ${MIN_CLUSTER_REPORTS}-report threshold`;
    return `${count} similar reports`;
  }
  function summaryMarkup(model){
    const statuses=AREA_META.map(area=>{
      const candidates=(model.communitySignals||[]).filter(signal=>signal.area===area.code);
      return candidates.map(derivedStatus).sort((a,b)=>signalRank(b)-signalRank(a))[0]||'normal';
    });
    return `<div class="community-summary">
      <article class="card community-summary-card"><small>Village zones</small><b>${AREA_META.length}</b><span>Approximate areas only</span></article>
      <article class="card community-summary-card monitoring"><small>Increased monitoring</small><b>${statuses.filter(status=>status==='monitoring').length}</b><span>Below cluster threshold</span></article>
      <article class="card community-summary-card reports"><small>Similar-report groups</small><b>${statuses.filter(status=>status==='similar-reports').length}</b><span>${MIN_CLUSTER_REPORTS}+ reports required</span></article>
      <article class="card community-summary-card confirmed"><small>Vet-confirmed clusters</small><b>${statuses.filter(status=>status==='vet-confirmed').length}</b><span>Reviewed demonstration group</span></article>
    </div>`;
  }
  function mapMarkup(model){
    return `<section class="card community-map-card"><div class="community-map-head"><div><h2>Approximate village-level view</h2><p>No farm, household or animal location is displayed.</p></div><label>Syndrome view<select data-community-filter><option value="all" ${syndromeFilter==='all'?'selected':''}>All monitored syndromes</option>${Object.entries(SYNDROMES).filter(([value])=>value!=='none').map(([value,label])=>`<option value="${safe(value)}" ${syndromeFilter===value?'selected':''}>${safe(label)}</option>`).join('')}</select></label></div>
      <div class="community-map" aria-label="Anonymized village-level community signal map">
        <span class="community-road road-one"></span><span class="community-road road-two"></span><span class="community-water"></span>
        ${AREA_META.map(area=>{const signal=representativeSignal(area.code,model),status=derivedStatus(signal),meta=STATUS[status];return `<button class="community-area ${status} ${selectedArea===area.code?'selected':''}" style="--x:${area.x}%;--y:${area.y}%;--w:${area.w}%;--h:${area.h}%" type="button" data-community-area="${safe(area.code)}" aria-label="${safe(area.name)}: ${safe(meta.label)}"><span class="community-area-icon">${meta.icon}</span><strong>${safe(area.short)}</strong><small>${safe(meta.label)}</small></button>`}).join('')}
        <div class="community-map-privacy">Village zones are illustrative and deliberately imprecise</div>
      </div>
      <div class="community-legend">${Object.entries(STATUS).map(([value,item])=>`<span><i class="${value}"></i>${safe(item.label)}</span>`).join('')}</div></section>`;
  }
  function detailMarkup(model){
    const signal=representativeSignal(selectedArea,model),status=derivedStatus(signal),meta=STATUS[status];
    return `<section class="card community-detail"><div class="community-detail-status ${status}"><span>${meta.icon}</span><div><small>${safe(areaName(selectedArea))}</small><h2>${safe(meta.label)}</h2></div></div>
      <p>${safe(meta.copy)}</p>
      <dl><div><dt>Syndrome group</dt><dd>${safe(syndromeName(signal.syndrome))}</dd></div><div><dt>Report visibility</dt><dd>${safe(reportLabel(signal))}</dd></div><div><dt>Aggregation</dt><dd>Approximate village zone</dd></div><div><dt>Minimum threshold</dt><dd>${MIN_CLUSTER_REPORTS} similar reports</dd></div></dl>
      ${status==='vet-confirmed'?'<div class="community-vet-note"><b>Veterinary review recorded</b>This label means a veterinarian reviewed the demonstration grouping. It is still not an official outbreak declaration.</div>':''}
      <div class="community-detail-foot">Counts are synthetic demonstration data. They are not disease prevalence, a diagnosis or a substitute for reporting through official animal-health channels.</div></section>`;
  }
  function privacyMarkup(){return `<section class="card community-privacy"><div class="head"><h2>Privacy and display rules</h2><span class="mini">Built into prototype</span></div><div class="community-rule"><b>1</b><span><strong>Village-level aggregation</strong>Only an approximate area code is stored for community display.</span></div><div class="community-rule"><b>2</b><span><strong>Minimum group size</strong>A cluster label is blocked until ${MIN_CLUSTER_REPORTS} similar reports exist.</span></div><div class="community-rule"><b>3</b><span><strong>No precise locations</strong>Farm coordinates, household addresses and tracker positions are never placed on this map.</span></div><div class="community-rule"><b>4</b><span><strong>Confirmation is explicit</strong>Similar reports and veterinarian-confirmed clusters use different labels.</span></div></section>`}
  function reportFormMarkup(){
    return `<section class="card community-report"><div class="head"><div><h2>Add an anonymous demo report</h2><p>Changes only the browser-local demonstration data.</p></div></div><form data-community-form><label>Approximate village zone<select name="area">${AREA_META.map(area=>`<option value="${safe(area.code)}">${safe(area.name)} · ${safe(area.short)}</option>`).join('')}</select></label><label>Syndrome group<select name="syndrome">${Object.entries(SYNDROMES).filter(([value])=>value!=='none').map(([value,label])=>`<option value="${safe(value)}">${safe(label)}</option>`).join('')}</select></label><div class="community-form-note">Do not enter a farm name, owner name, animal ID, address or GPS location. A report remains “Increased monitoring” until the ${MIN_CLUSTER_REPORTS}-report threshold is met.</div><button class="button primary" type="submit">Add demonstration report</button></form></section>`;
  }
  function modelMarkup(model){
    const preview={cases:(model.cases||[]).slice(0,1),passportEvents:(model.passportEvents||[]).slice(0,1),communitySignals:(model.communitySignals||[]).slice(0,2)};
    return `<section class="card community-model"><div class="community-model-head"><div><div class="eyebrow">Browser prototype model</div><h2>Three local collections</h2><p>Normalized care workflow, animal passport events and anonymized community aggregates.</p></div><div class="community-collection-counts"><span><b>${(model.cases||[]).length}</b> cases</span><span><b>${(model.passportEvents||[]).length}</b> passport events</span><span><b>${(model.communitySignals||[]).length}</b> community signals</span></div></div><details><summary>View example stored objects</summary><pre>${safe(JSON.stringify(preview,null,2))}</pre></details><div class="community-production-note"><strong>Prototype storage only.</strong> Production deployment requires authentication, a secure backend, role-based permissions, consent controls, encryption, retention rules and tamper-evident audit logs.</div></section>`;
  }
  function showSignals(){
    const main=document.querySelector('#app main');if(!main)return;
    syncCases();const model=readModel();
    document.querySelectorAll('.nav button').forEach(button=>button.classList.toggle('active',!!button.dataset.communitySignals));
    main.innerHTML=`<header class="top"><div><div class="eyebrow">Privacy-preserving shared awareness</div><h1>Community signals</h1><p>Explore anonymized, village-level patterns without exposing precise farm locations.</p></div><div class="tools"><button class="button ghost" type="button" data-community-rules>Privacy rules</button></div></header>
      <div class="community-declaration"><span>!</span><div><strong>Demonstration data—not an official outbreak declaration.</strong><p>Use qualified veterinary advice and official animal-health reporting channels for real concerns.</p></div></div>
      ${summaryMarkup(model)}
      <div class="community-layout"><div>${mapMarkup(model)}</div><div class="community-side">${detailMarkup(model)}${privacyMarkup()}</div></div>
      <div class="community-lower">${reportFormMarkup()}${modelMarkup(model)}</div>
      <p class="footer">Community Signals demonstrates privacy-preserving aggregation. It does not diagnose disease, identify farms or replace official surveillance.</p>`;
    window.history.replaceState(null,'','#community');
    bind(main);mountNav();
  }
  function bind(root){
    root.querySelector('[data-community-filter]').onchange=event=>{syndromeFilter=event.target.value;selectedArea=AREA_META[0].code;showSignals()};
    root.querySelectorAll('[data-community-area]').forEach(button=>button.onclick=()=>{selectedArea=button.dataset.communityArea;showSignals()});
    root.querySelector('[data-community-rules]').onclick=()=>root.querySelector('.community-privacy')?.scrollIntoView({behavior:'smooth',block:'center'});
    root.querySelector('[data-community-form]').onsubmit=event=>{
      event.preventDefault();const data=new FormData(event.currentTarget),area=String(data.get('area')),syndrome=String(data.get('syndrome')),model=readModel();
      let signal=(model.communitySignals||[]).find(item=>item.area===area&&item.syndrome===syndrome);
      if(!signal){signal={area,syndrome,confidence:'monitoring',reportCount:0};model.communitySignals.push(signal)}
      signal.reportCount=Math.max(0,Number(signal.reportCount)||0)+1;signal.confidence=derivedStatus(signal);writeModel(model);selectedArea=area;syndromeFilter='all';showSignals();
      const toast=document.getElementById('toast');if(toast){toast.textContent=signal.reportCount>=MIN_CLUSTER_REPORTS?'Minimum grouping threshold reached in demonstration data.':'Anonymous demo report saved below the cluster threshold.';toast.classList.add('show');setTimeout(()=>toast.classList.remove('show'),3200)}
    };
  }
  function mountNav(){
    const nav=document.querySelector('.nav');if(!nav)return;
    let button=nav.querySelector('[data-community-signals]');
    if(!button){button=document.createElement('button');button.type='button';button.dataset.communitySignals='true';button.onclick=showSignals;const cases=nav.querySelector('[data-care-cases]');if(cases)cases.after(button);else nav.append(button)}
    button.innerHTML=`<span>◉</span>${safe(NAV_LABEL[language()]||NAV_LABEL.en)}`;button.classList.toggle('active',location.hash==='#community');
  }
  const schedule=()=>{if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;mountNav();if(location.hash==='#community'&&!document.querySelector('.community-layout'))showSignals()})};
  window.HerdCareDataModel={storageKey:MODEL_KEY,minimumClusterReports:MIN_CLUSTER_REPORTS,snapshot:()=>clone(readModel()),showCommunitySignals:showSignals};
  window.addEventListener('herdcare:cases-updated',()=>{syncCases();schedule()});
  window.addEventListener('herdcare:model-updated',schedule);
  window.addEventListener('hashchange',()=>{if(location.hash==='#community')showSignals();else mountNav()});
  window.addEventListener('storage',schedule);
  document.addEventListener('change',event=>{if(event.target.matches?.('[data-language-select],#language'))schedule()});
  const app=document.getElementById('app');if(app)new MutationObserver(schedule).observe(app,{childList:true});
  seedModel();schedule();
})();
