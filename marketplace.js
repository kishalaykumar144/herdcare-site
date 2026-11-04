/* HerdCare Marketplace: fast local-to-regional commerce prototype. */
(()=>{
  const LISTING_KEY='herdcare-marketplace-listings-v1';
  const CART_KEY='herdcare-marketplace-cart-v1';
  const ENQUIRY_KEY='herdcare-marketplace-enquiries-v1';
  const LANGUAGE_KEY='herdcare-language-v1';
  const seedOffers=[
    {id:'milk-gv',key:'cow-milk',icon:'🥛',product:'Fresh cow milk',category:'Milk & dairy',seller:'Green Valley Dairy',sellerType:'Dairy',price:58,unit:'1 litre',stock:120,minQty:2,distance:4,location:'Green Valley',deliveryRange:25,delivery:['Local delivery','Farm pickup'],rating:4.8,orders:284,trusted:true,licensed:true,freshness:'Collected today · 5:30 AM',description:'Chilled farm milk offered in returnable food-grade bottles.'},
    {id:'milk-sunrise',key:'cow-milk',icon:'🥛',product:'Fresh cow milk',category:'Milk & dairy',seller:'Sunrise Women Dairy',sellerType:'Producer group',price:61,unit:'1 litre',stock:80,minQty:1,distance:9,location:'North Village',deliveryRange:18,delivery:['Local delivery','Collection point'],rating:4.9,orders:197,trusted:true,licensed:true,freshness:'Collected today · 6:15 AM',description:'Morning milk from a small women-led dairy collective.'},
    {id:'milk-nandini',key:'cow-milk',icon:'🥛',product:'Fresh cow milk',category:'Milk & dairy',seller:'Nandini Family Farm',sellerType:'Small farm',price:56,unit:'1 litre',stock:180,minQty:5,distance:22,location:'Riverside Block',deliveryRange:55,delivery:['Scheduled delivery','Farm pickup'],rating:4.6,orders:143,trusted:true,licensed:false,freshness:'Collected today · 5:00 AM',description:'Bulk-friendly fresh milk for homes, cafés and local processors.'},
    {id:'buffalo-milk',key:'buffalo-milk',icon:'🥛',product:'Rich buffalo milk',category:'Milk & dairy',seller:'Murrah Milk House',sellerType:'Dairy',price:78,unit:'1 litre',stock:95,minQty:2,distance:7,location:'Market Road',deliveryRange:25,delivery:['Cold-chain delivery','Farm pickup'],rating:4.8,orders:236,trusted:true,licensed:true,freshness:'Collected today · 5:45 AM',description:'High-fat buffalo milk chilled after collection.'},
    {id:'paneer-heritage',key:'fresh-paneer',icon:'🧀',product:'Fresh farm paneer',category:'Milk & dairy',seller:'Heritage Dairy Kitchen',sellerType:'Dairy processor',price:210,unit:'500 g',stock:46,minQty:1,distance:12,location:'Town Centre',deliveryRange:35,delivery:['Cold-chain delivery','Store pickup'],rating:4.9,orders:318,trusted:true,licensed:true,freshness:'Made this morning',description:'Fresh paneer prepared in small batches and packed chilled.'},
    {id:'paneer-village',key:'fresh-paneer',icon:'🧀',product:'Fresh farm paneer',category:'Milk & dairy',seller:'Village Milk Collective',sellerType:'Producer group',price:198,unit:'500 g',stock:30,minQty:2,distance:19,location:'East Cluster',deliveryRange:45,delivery:['Scheduled delivery','Collection point'],rating:4.7,orders:121,trusted:true,licensed:true,freshness:'Made today',description:'Collective-made paneer for household and restaurant orders.'},
    {id:'ghee-gv',key:'cow-ghee',icon:'🫙',product:'Cultured cow ghee',category:'Milk & dairy',seller:'Green Valley Dairy',sellerType:'Dairy',price:690,unit:'1 kg',stock:28,minQty:1,distance:4,location:'Green Valley',deliveryRange:200,delivery:['Regional delivery','Farm pickup'],rating:4.8,orders:165,trusted:true,licensed:true,freshness:'Batch packed this week',description:'Small-batch clarified butter with batch and packing details.'},
    {id:'eggs-meadow',key:'table-eggs',icon:'🥚',product:'Farm table eggs',category:'Eggs',seller:'Meadow Poultry Farm',sellerType:'Poultry farm',price:195,unit:'tray of 30',stock:70,minQty:1,distance:6,location:'Meadow Lane',deliveryRange:30,delivery:['Local delivery','Farm pickup'],rating:4.7,orders:442,trusted:true,licensed:true,freshness:'Collected today',description:'Graded table eggs packed in reusable trays.'},
    {id:'eggs-happy',key:'table-eggs',icon:'🥚',product:'Farm table eggs',category:'Eggs',seller:'Happy Hen Collective',sellerType:'Producer group',price:205,unit:'tray of 30',stock:54,minQty:1,distance:15,location:'South Block',deliveryRange:40,delivery:['Collection point','Scheduled delivery'],rating:4.9,orders:178,trusted:true,licensed:false,freshness:'Collected within 24 hours',description:'Sorted eggs supplied by a network of small poultry keepers.'},
    {id:'honey-hill',key:'raw-honey',icon:'🍯',product:'Apiary honey',category:'Honey',seller:'Hill Bloom Apiary',sellerType:'Apiary',price:260,unit:'500 g',stock:42,minQty:1,distance:35,location:'Hill Block',deliveryRange:500,delivery:['Regional delivery'],rating:4.9,orders:214,trusted:false,licensed:true,freshness:'Current seasonal harvest',description:'Seasonal honey with harvest area and batch information.'},
    {id:'vermi-green',key:'vermicompost',icon:'🪱',product:'Screened vermicompost',category:'Farm inputs',seller:'Green Loop Farm',sellerType:'Mixed farm',price:320,unit:'25 kg bag',stock:160,minQty:2,distance:14,location:'Green Valley',deliveryRange:90,delivery:['Farm delivery','Farm pickup'],rating:4.7,orders:96,trusted:true,licensed:false,freshness:'Matured batch',description:'Screened soil input made from pre-composted farm organics.'},
    {id:'compost-circular',key:'farm-compost',icon:'🌱',product:'Mature farm compost',category:'Farm inputs',seller:'Circular Fields Cooperative',sellerType:'Farm cooperative',price:180,unit:'25 kg bag',stock:280,minQty:5,distance:40,location:'District West',deliveryRange:120,delivery:['Bulk delivery','Collection point'],rating:4.6,orders:88,trusted:true,licensed:false,freshness:'Matured and screened',description:'Bulk compost for farms, nurseries and community gardens.'},
    {id:'digestate-energy',key:'digestate',icon:'♨',product:'Processed digestate',category:'Farm inputs',seller:'BioFarm Energy Unit',sellerType:'Biogas unit',price:120,unit:'20 litre can',stock:90,minQty:5,distance:16,location:'Industrial Farm Cluster',deliveryRange:80,delivery:['Bulk delivery','Unit pickup'],rating:4.5,orders:52,trusted:true,licensed:true,freshness:'Current production batch',description:'Managed digestate offered with handling and application information.'},
    {id:'wool-pasture',key:'raw-wool',icon:'🧶',product:'Sorted sheep wool',category:'Fibre & materials',seller:'Open Pasture Sheep Farm',sellerType:'Sheep farm',price:540,unit:'1 kg',stock:65,minQty:3,distance:85,location:'Regional Pasture Belt',deliveryRange:1200,delivery:['Regional delivery'],rating:4.8,orders:74,trusted:true,licensed:false,freshness:'Current shearing season',description:'Dry, sorted fleece for craft and specialist processing buyers.'}
  ];
  const categoryIcons={'All':'▦','Milk & dairy':'🥛','Eggs':'🥚','Honey':'🍯','Farm inputs':'🌱','Fibre & materials':'🧶'};
  const visual={'Milk & dairy':['#e4f2ee','#f8fbf7'],Eggs:['#fff1d6','#fffaf1'],Honey:['#ffe9ae','#fff7dc'],'Farm inputs':['#dff0d8','#f6fbf3'],'Fibre & materials':['#eee6f2','#faf7fb']};
  const safe=value=>String(value??'').replace(/[&<>'"]/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[char]));
  const readJson=(key,fallback)=>{try{return JSON.parse(localStorage.getItem(key))??fallback}catch{return fallback}};
  const money=value=>new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR',maximumFractionDigits:0}).format(Number(value)||0);
  const clamp=(value,min,max)=>Math.min(max,Math.max(min,value));
  const customOffers=()=>readJson(LISTING_KEY,[]);
  const allOffers=()=>[...customOffers(),...seedOffers];
  let state={category:'All',search:'',scope:50,sort:'value',managedOnly:false};
  let cart=readJson(CART_KEY,{});
  let toastTimer;

  const median=values=>{const sorted=[...values].sort((a,b)=>a-b),middle=Math.floor(sorted.length/2);return sorted.length%2?sorted[middle]:(sorted[middle-1]+sorted[middle])/2};
  const groupFor=offer=>allOffers().filter(item=>item.key===offer.key);
  const pricePosition=offer=>{const group=groupFor(offer),prices=group.map(item=>item.price),middle=median(prices),minimum=Math.min(...prices),delta=Math.round(middle-offer.price);if(group.length===1)return{label:'Single offer',best:false,neutral:true};if(offer.price===minimum)return{label:'Best price',best:true,neutral:false};if(delta>0)return{label:`${money(delta)} below median`,best:false,neutral:false};if(delta<0)return{label:`${money(Math.abs(delta))} above median`,best:false,neutral:true};return{label:'At marketplace median',best:false,neutral:true}};
  const toast=message=>{const box=document.getElementById('market-toast');box.textContent=message;box.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>box.classList.remove('show'),3000)};
  const saveCart=()=>{localStorage.setItem(CART_KEY,JSON.stringify(cart));renderCart();updateCartCount()};
  const cartLines=()=>Object.entries(cart).map(([id,quantity])=>{const offer=allOffers().find(item=>item.id===id);return offer?{offer,quantity}:null}).filter(Boolean);
  const cartTotal=()=>cartLines().reduce((sum,line)=>sum+line.offer.price*line.quantity,0);
  const cartCount=()=>cartLines().reduce((sum,line)=>sum+line.quantity,0);

  function filteredOffers(){
    const query=state.search.toLowerCase().trim();
    const offers=allOffers().filter(offer=>(state.category==='All'||offer.category===state.category)&&offer.distance<=state.scope&&(!state.managedOnly||offer.trusted)&&(!query||`${offer.product} ${offer.category} ${offer.seller} ${offer.location} ${offer.description}`.toLowerCase().includes(query)));
    const sorters={price:(a,b)=>a.price-b.price,nearest:(a,b)=>a.distance-b.distance,rating:(a,b)=>(b.rating||0)-(a.rating||0),value:(a,b)=>{const best=Number(pricePosition(b).best)-Number(pricePosition(a).best);return best||b.rating-a.rating||a.distance-b.distance}};
    return offers.sort(sorters[state.sort]||sorters.value);
  }
  function renderCategories(){
    const root=document.getElementById('market-categories');
    root.innerHTML=Object.keys(categoryIcons).map(category=>`<button class="market-category ${state.category===category?'active':''}" type="button" data-category="${safe(category)}">${categoryIcons[category]} ${safe(category)}</button>`).join('');
  }
  function offerCard(offer){
    const position=pricePosition(offer),same=groupFor(offer).length,[a,b]=visual[offer.category]||visual['Farm inputs'];
    const tags=`${position.best?'<span class="market-card-tag best">Best price</span>':''}${offer.trusted?'<span class="market-card-tag">Care records shared</span>':''}${offer.licensed?'<span class="market-card-tag">Compliance info</span>':''}`;
    return `<article class="market-card" data-offer-card="${safe(offer.id)}"><div class="market-card-visual" style="--visual-a:${a};--visual-b:${b}"><i>${offer.icon}</i><div class="market-card-tags">${tags}</div></div><div class="market-card-body"><span class="market-card-kicker">${safe(offer.category)} · ${safe(offer.sellerType)}</span><h3>${safe(offer.product)}</h3><span class="market-seller">${safe(offer.seller)} · ${safe(offer.location)}</span><div class="market-price-row"><div class="market-price"><b>${money(offer.price)}</b><span> / ${safe(offer.unit)}</span></div><span class="market-value ${position.neutral?'neutral':''}">${safe(position.label)}</span></div><p class="market-card-copy">${safe(offer.description)}</p><div class="market-card-meta"><span><b>${offer.distance} km away</b>${safe(offer.delivery[0])}</span><span><b>${offer.stock} available</b>Minimum ${offer.minQty}</span><span><b>${offer.rating?`${offer.rating.toFixed(1)} ★`:'New seller'}</b>${offer.orders||0} completed orders</span><span><b>${safe(offer.freshness)}</b>Seller-declared listing</span></div><div class="market-card-actions"><button type="button" data-compare="${safe(offer.key)}">${same>1?`Compare ${same} offers`:'View details'}</button><button class="primary" type="button" data-add-cart="${safe(offer.id)}">Add to cart</button></div></div></article>`;
  }
  function renderListings(){
    const offers=filteredOffers(),root=document.getElementById('market-grid');
    root.innerHTML=offers.length?offers.map(offerCard).join(''):`<div class="market-empty"><span>⌕</span><b>No matching offers in this area</b>Try a wider delivery area, another category, or clear the search.</div>`;
    document.getElementById('market-results-count').textContent=`${offers.length} offer${offers.length===1?'':'s'} · ${state.scope>=5000?'India-wide':`within ${state.scope} km`}`;
    document.getElementById('marketplace-toolbar-search').value=state.search;
  }
  function renderAll(){renderCategories();renderListings();updateCartCount()}

  function addToCart(id){
    const offer=allOffers().find(item=>item.id===id);if(!offer)return;
    cart[id]=clamp((cart[id]||0)+1,1,offer.stock);saveCart();toast(`${offer.product} added to cart.`);
  }
  function updateCartCount(){document.querySelectorAll('[data-cart-count]').forEach(node=>node.textContent=cartCount())}
  function renderCart(){
    const drawer=document.getElementById('market-cart-drawer'),lines=cartLines();
    drawer.innerHTML=`<div class="market-cart-head"><div><div class="market-eyebrow">Buyer cart</div><h2>Your order enquiry</h2></div><button class="market-close" type="button" data-close-cart aria-label="Close cart">×</button></div><div class="market-cart-list">${lines.length?lines.map(({offer,quantity})=>`<article class="market-cart-item"><i>${offer.icon}</i><div><strong>${safe(offer.product)}</strong><small>${safe(offer.seller)} · ${money(offer.price)} / ${safe(offer.unit)}</small><div class="market-qty"><button type="button" data-cart-dec="${safe(offer.id)}">−</button><span>${quantity}</span><button type="button" data-cart-inc="${safe(offer.id)}">+</button></div></div><div class="market-cart-price">${money(offer.price*quantity)}<button class="market-remove" type="button" data-cart-remove="${safe(offer.id)}">Remove</button></div></article>`).join(''):`<div class="market-cart-empty"><span>🧺</span><b>Your cart is empty</b>Add farm-direct offers to prepare an order enquiry.</div>`}</div><div class="market-cart-foot"><div class="market-cart-total"><span>Estimated product total</span><b>${money(cartTotal())}</b></div><button class="market-button primary" type="button" data-checkout ${lines.length?'':'disabled'}>Review enquiry</button><small>Delivery, taxes and payment are not calculated in this prototype.</small></div>`;
  }
  function syncOverlay(){const open=document.getElementById('market-modal').classList.contains('open')||document.getElementById('market-cart-drawer').classList.contains('open');document.getElementById('market-overlay').classList.toggle('open',open)}
  function openCart(){
    const drawer=document.getElementById('market-cart-drawer');
    renderCart();drawer.removeAttribute('inert');drawer.setAttribute('aria-hidden','false');drawer.classList.add('open');syncOverlay()
  }
  function closeCart(){
    const drawer=document.getElementById('market-cart-drawer');
    drawer.classList.remove('open');drawer.setAttribute('aria-hidden','true');drawer.setAttribute('inert','');syncOverlay()
  }
  function openModal(title,copy,body){
    const modal=document.getElementById('market-modal');
    modal.innerHTML=`<div class="market-modal-head"><div><div class="market-eyebrow">HerdCare Marketplace</div><h2>${safe(title)}</h2><p>${safe(copy)}</p></div><button class="market-close" type="button" data-close-modal aria-label="Close dialog">×</button></div>${body}`;
    modal.removeAttribute('inert');modal.setAttribute('aria-hidden','false');modal.classList.add('open');syncOverlay();
  }
  function closeModal(){
    const modal=document.getElementById('market-modal');
    modal.classList.remove('open');modal.setAttribute('aria-hidden','true');modal.setAttribute('inert','');syncOverlay()
  }
  function compareOffers(key){
    const offers=groupFor({key}).sort((a,b)=>a.price-b.price),product=offers[0]?.product||'Product offers';
    openModal(`Compare ${product}`,`${offers.length} seller offer${offers.length===1?'':'s'} with clear price, distance and fulfilment information.`,`<div class="compare-list">${offers.map(offer=>`<article class="compare-row"><i>${offer.icon}</i><div><strong>${safe(offer.seller)}</strong><span>${offer.distance} km · ${safe(offer.delivery.join(' · '))}${offer.trusted?' · care records shared':''}</span></div><div class="compare-price"><b>${money(offer.price)}</b><span>per ${safe(offer.unit)}</span></div><button type="button" data-modal-add="${safe(offer.id)}">Add</button></article>`).join('')}</div><div class="market-prototype-note"><strong>Competitive view:</strong> prices are compared only among current HerdCare prototype listings for the same product. Final quality, availability, delivery charges, licences and seller identity must be verified before a real purchase.</div>`);
  }
  function sellerForm(){
    const categories=Object.keys(categoryIcons).filter(value=>value!=='All');
    openModal('Create a seller listing','For farms, dairies, producer groups and livestock-product enterprises.',`<form class="market-form" id="market-seller-form"><label>Farm, dairy or seller name<input name="seller" required placeholder="e.g. Shakti Women Dairy"></label><label>Seller type<select name="sellerType"><option>Small farm</option><option>Dairy</option><option>Producer group</option><option>Farm cooperative</option><option>Poultry farm</option><option>Apiary</option><option>Processor</option></select></label><label>Product name<input name="product" required placeholder="e.g. Fresh cow milk"></label><label>Category<select name="category">${categories.map(category=>`<option>${safe(category)}</option>`).join('')}</select></label><label>Price (₹)<input name="price" type="number" min="1" step="1" required placeholder="60"></label><label>Selling unit<input name="unit" required placeholder="e.g. 1 litre, 500 g, tray of 30"></label><label>Available stock<input name="stock" type="number" min="1" required value="25"></label><label>Minimum order<input name="minQty" type="number" min="1" required value="1"></label><label>Farm or market area<input name="location" required placeholder="Village, block or district"></label><label>Distance from buyer market (km)<input name="distance" type="number" min="0" max="5000" required value="8"></label><label>Delivery/service radius (km)<input name="deliveryRange" type="number" min="1" max="5000" required value="25"></label><label>Freshness or batch note<input name="freshness" placeholder="e.g. Collected this morning"></label><label class="full">Product description<textarea name="description" required placeholder="Describe quality, packaging, handling and who this offer suits."></textarea></label><div class="full market-form-checks"><label><input type="checkbox" name="delivery" value="Local delivery" checked>Local delivery</label><label><input type="checkbox" name="delivery" value="Farm pickup" checked>Farm pickup</label><label><input type="checkbox" name="delivery" value="Regional delivery">Regional delivery</label></div><div class="full market-form-checks"><label><input type="checkbox" name="trusted">Animal-care records can be shared</label><label><input type="checkbox" name="licensed">Licence/compliance information available</label></div><div class="full market-prototype-note">This prototype stores the listing only in this browser. Production publishing requires identity checks, product-category compliance, moderation, secure storage and a seller agreement.</div><div class="full market-modal-actions"><button class="market-button" type="button" data-close-modal>Cancel</button><button class="market-button primary" type="submit">Publish prototype listing</button></div></form>`);
    document.getElementById('market-seller-form').onsubmit=event=>{event.preventDefault();const data=new FormData(event.currentTarget),category=data.get('category'),name=String(data.get('product')).trim(),list=customOffers(),id=`seller-${Date.now()}`;list.unshift({id,key:name.toLowerCase().replace(/[^a-z0-9]+/g,'-'),icon:categoryIcons[category]||'📦',product:name,category,seller:String(data.get('seller')).trim(),sellerType:data.get('sellerType'),price:Number(data.get('price')),unit:String(data.get('unit')).trim(),stock:Number(data.get('stock')),minQty:Number(data.get('minQty')),distance:Number(data.get('distance')),location:String(data.get('location')).trim(),deliveryRange:Number(data.get('deliveryRange')),delivery:data.getAll('delivery').length?data.getAll('delivery'):['Farm pickup'],rating:0,orders:0,trusted:data.has('trusted'),licensed:data.has('licensed'),freshness:String(data.get('freshness')).trim()||'New listing',description:String(data.get('description')).trim()});localStorage.setItem(LISTING_KEY,JSON.stringify(list));state={...state,category:'All',search:'',scope:5000};document.getElementById('marketplace-search').value='';closeModal();renderAll();toast('Prototype seller listing published in this browser.')};
  }
  function checkout(){
    const lines=cartLines();if(!lines.length)return;
    closeCart();
    openModal('Review order enquiry','Prepare a non-binding request for the selected farms and dairies.',`<form class="market-form" id="market-checkout-form"><div class="full order-summary">${lines.map(({offer,quantity})=>`<div><span>${safe(offer.product)} × ${quantity}<br><small>${safe(offer.seller)}</small></span><b>${money(offer.price*quantity)}</b></div>`).join('')}<div><strong>Estimated product total</strong><b>${money(cartTotal())}</b></div></div><label>Fulfilment preference<select name="fulfilment"><option>Local delivery</option><option>Farm pickup</option><option>Collection point</option><option>Discuss with each seller</option></select></label><label>Preferred timing<select name="timing"><option>Earliest available</option><option>Morning</option><option>Afternoon</option><option>Weekend</option></select></label><label class="full">Buyer note<textarea name="note" placeholder="Quantity flexibility, packaging request or delivery-area note."></textarea></label><div class="full market-prototype-note"><strong>No payment or message will be sent.</strong> This demonstration saves an enquiry reference only in your browser. A production marketplace needs authenticated buyers and sellers, payments, fulfilment, refunds, dispute handling and category-specific compliance.</div><div class="full market-modal-actions"><button class="market-button" type="button" data-close-modal>Back</button><button class="market-button primary" type="submit">Create local enquiry</button></div></form>`);
    document.getElementById('market-checkout-form').onsubmit=event=>{event.preventDefault();const data=new FormData(event.currentTarget),orders=readJson(ENQUIRY_KEY,[]),reference=`HC-MKT-${String(Date.now()).slice(-6)}`;orders.unshift({reference,createdAt:new Date().toISOString(),items:lines.map(({offer,quantity})=>({id:offer.id,product:offer.product,seller:offer.seller,quantity,price:offer.price})),total:cartTotal(),fulfilment:data.get('fulfilment'),timing:data.get('timing'),note:String(data.get('note')).trim(),status:'local prototype'});localStorage.setItem(ENQUIRY_KEY,JSON.stringify(orders));cart={};saveCart();closeModal();closeCart();toast(`${reference} created locally — no order was sent.`)};
  }
  function changeCart(id,delta){const offer=allOffers().find(item=>item.id===id);if(!offer)return;const next=(cart[id]||0)+delta;if(next<=0)delete cart[id];else cart[id]=clamp(next,1,offer.stock);saveCart()}
  function removeCart(id){delete cart[id];saveCart()}
  function applySearch(value){state.search=String(value||'').trim();document.getElementById('marketplace-search').value=state.search;renderListings();document.getElementById('market-listings').scrollIntoView({behavior:'smooth',block:'start'})}

  document.addEventListener('click',event=>{
    const target=event.target.closest?.('button,[data-category]');if(!target)return;
    if(target.matches('[data-category]')){state.category=target.dataset.category;renderAll();return}
    if(target.matches('[data-add-cart]')){addToCart(target.dataset.addCart);return}
    if(target.matches('[data-compare]')){compareOffers(target.dataset.compare);return}
    if(target.matches('[data-modal-add]')){addToCart(target.dataset.modalAdd);closeModal();openCart();return}
    if(target.matches('[data-open-cart]')){openCart();return}
    if(target.matches('[data-close-cart]')){closeCart();return}
    if(target.matches('[data-close-modal]')){closeModal();return}
    if(target.matches('[data-open-seller]')){sellerForm();return}
    if(target.matches('[data-cart-inc]')){changeCart(target.dataset.cartInc,1);return}
    if(target.matches('[data-cart-dec]')){changeCart(target.dataset.cartDec,-1);return}
    if(target.matches('[data-cart-remove]')){removeCart(target.dataset.cartRemove);return}
    if(target.matches('[data-checkout]')&&!target.disabled){checkout();return}
    if(target.id==='market-search-button'){applySearch(document.getElementById('marketplace-search').value)}
  });
  document.getElementById('marketplace-search').addEventListener('keydown',event=>{if(event.key==='Enter')applySearch(event.currentTarget.value)});
  document.getElementById('marketplace-toolbar-search').oninput=event=>{state.search=event.target.value;document.getElementById('marketplace-search').value=state.search;renderListings()};
  document.getElementById('market-scope').onchange=event=>{state.scope=Number(event.target.value);renderListings()};
  document.getElementById('market-sort').onchange=event=>{state.sort=event.target.value;renderListings()};
  document.getElementById('market-managed-only').onchange=event=>{state.managedOnly=event.target.checked;renderListings()};
  document.getElementById('market-overlay').onclick=()=>{if(document.getElementById('market-modal').classList.contains('open'))closeModal();else closeCart()};
  document.addEventListener('keydown',event=>{if(event.key==='Escape'){closeModal();closeCart()}});
  const language=document.getElementById('market-language');language.value=localStorage.getItem(LANGUAGE_KEY)||'en';language.onchange=()=>{localStorage.setItem(LANGUAGE_KEY,language.value);location.reload()};
  renderCart();renderAll();
})();
