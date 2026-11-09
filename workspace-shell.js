/* Shared shell: grouped navigation, responsive ordering, and the HerdCare value proposition. */
(()=>{
  const GROUPS={
    en:{care:'ANIMAL CARE',coordination:'COORDINATED CARE',market:'FARM MARKET',reference:'REFERENCE'},
    hi:{care:'पशु देखभाल',coordination:'समन्वित देखभाल',market:'कृषि बाज़ार',reference:'संदर्भ'},
    bn:{care:'পশুর যত্ন',coordination:'সমন্বিত যত্ন',market:'খামার বাজার',reference:'তথ্যসূত্র'},
    mr:{care:'प्राणी काळजी',coordination:'समन्वित काळजी',market:'शेत बाजार',reference:'संदर्भ'}
  };
  const STEPS={
    en:['Notice','Organize','Act together','Learn'],
    hi:['पहचानें','दर्ज करें','मिलकर कार्रवाई','सीखें'],
    bn:['লক্ষ করুন','নথিভুক্ত করুন','একসাথে কাজ','শিখুন'],
    mr:['ओळखा','नोंदवा','एकत्र कृती','शिका']
  };
  const VALUE={
    en:{eyebrow:'WHAT MAKES HERDCARE DIFFERENT',title:'One connected care loop for animals, people and farms',copy:'HerdCare brings animal records, early signals, veterinary cases and farm to customer sales into one workspace, from a single pet to a producer group.'},
    hi:{eyebrow:'HERDCARE को क्या अलग बनाता है',title:'पशुओं, लोगों और खेतों के लिए एक जुड़ी हुई देखभाल प्रक्रिया',copy:'HerdCare पशु रिकॉर्ड, शुरुआती संकेत, पशुचिकित्सा मामले और खेत से ग्राहक तक बिक्री को एक जगह जोड़ता है—एक पालतू पशु से लेकर उत्पादक समूह तक।'},
    bn:{eyebrow:'HERDCARE কেন আলাদা',title:'পশু, মানুষ ও খামারের জন্য সংযুক্ত যত্নের ধারা',copy:'HerdCare পশুর রেকর্ড, আগাম সংকেত, ভেটেরিনারি কেস এবং খামার থেকে ক্রেতার বিক্রি এক কর্মস্থলে যুক্ত করে—একটি পোষা প্রাণী থেকে উৎপাদক গোষ্ঠী পর্যন্ত।'},
    mr:{eyebrow:'HERDCARE कशामुळे वेगळे आहे',title:'प्राणी, लोक आणि शेतांसाठी जोडलेली काळजी प्रक्रिया',copy:'HerdCare प्राण्यांच्या नोंदी, लवकर मिळणारे संकेत, पशुवैद्यकीय प्रकरणे आणि शेतातून ग्राहकांपर्यंत विक्री एका कार्यस्थळात जोडते—एका पाळीव प्राण्यापासून उत्पादक गटापर्यंत.'}
  };
  const navOrder=['overview','cattle','history','sensor','diet','gpsPage','vets','careCases','communitySignals','vetPortal','livestockPage','libraryPage','manualPage'];
  const groupFor=button=>{
    if(button.matches('[data-page="overview"],[data-page="cattle"],[data-page="history"],[data-page="sensor"],[data-page="diet"],[data-gps-page]'))return 'care';
    if(button.matches('[data-page="vets"],[data-care-cases],[data-community-signals],[data-vet-portal]'))return 'coordination';
    if(button.matches('[data-livestock-page]'))return 'market';return 'reference';
  };
  const groupLabel=button=>button.dataset.page||(['gpsPage','careCases','communitySignals','vetPortal','livestockPage','libraryPage','manualPage'].find(key=>button.dataset[key]!==undefined)||'');
  const isTranslated=()=>localStorage.getItem('herdcare-language-v1')||'en';
  function arrange(nav){
    if(!nav)return;
    const buttons=[...nav.querySelectorAll(':scope > button')];if(!buttons.length)return;
    const ordered=buttons.sort((a,b)=>navOrder.indexOf(groupLabel(a))-navOrder.indexOf(groupLabel(b)));
    const signature=ordered.map(groupLabel).join('|');if(nav.dataset.shellSignature===signature)return;
    nav.dataset.shellSignature=signature;
    nav.replaceChildren();let previous='';
    ordered.forEach(button=>{const group=groupFor(button);if(group!==previous){const heading=document.createElement('div');heading.className='nav-group-label';heading.dataset.navGroup=group;nav.append(heading);previous=group}nav.append(button)});
    localizeGroups(nav);
  }
  function localizeGroups(nav=document.querySelector('.nav')){if(!nav)return;const lang=isTranslated(),copy=GROUPS[lang]||GROUPS.en;nav.querySelectorAll('[data-nav-group]').forEach(label=>label.textContent=copy[label.dataset.navGroup]||copy.reference)}
  function addValueProp(){const main=document.querySelector('#app main');if(!main)return;const existing=main.querySelector('.workspace-usp'),lang=isTranslated();if(location.hash&&location.hash!=='#overview'){existing?.remove();return}if(existing?.dataset.language===lang)return;existing?.remove();const pageHeading=main.querySelector(':scope > .top');if(!pageHeading)return;const copy=VALUE[lang]||VALUE.en,steps=STEPS[lang]||STEPS.en,box=document.createElement('section');box.className='workspace-usp';box.dataset.language=lang;box.setAttribute('aria-label',copy.eyebrow);box.innerHTML=`<div class="workspace-usp-copy"><small>${copy.eyebrow}</small><strong>${copy.title}</strong><p>${copy.copy}</p></div><div class="workspace-usp-flow" aria-label="${steps.join(' → ')}">${steps.map((step,index)=>`<span>${index?'<b>→</b>':''}${step}</span>`).join('')}</div>`;pageHeading.after(box)}
  let queued=false;function update(){if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;arrange(document.querySelector('.nav'));localizeGroups();addValueProp()})}
  const app=document.getElementById('app');if(app)new MutationObserver(update).observe(app,{childList:true,subtree:true});
  window.addEventListener('storage',update);window.addEventListener('herdcare:language-updated',update);document.addEventListener('change',event=>{if(event.target.matches?.('[data-language-select],#language'))setTimeout(update,0)});update();
})();
