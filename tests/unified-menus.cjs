// Menu consistency, retained controls, sticky navigation and shared GPU previews.
const fs=require('fs');
module.exports=async function verifyUnifiedMenus(browser){
 const page=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:2}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(()=>{const get=HTMLCanvasElement.prototype.getContext,seen=new WeakSet();window.menuGPUContexts=0;HTMLCanvasElement.prototype.getContext=function(type,...args){const value=get.call(this,type,...args);if(value&&(type==='webgl'||type==='webgl2')&&!seen.has(value)){seen.add(value);window.menuGPUContexts++;}return value;};});
 await page.goto('http://127.0.0.1:8765');await page.waitForFunction(()=>document.getElementById('graphics-panel').dataset.state==='ready');
 await page.evaluate(()=>{
  const check=(v,m)=>{if(!v)throw Error(m)},settings=document.getElementById('scr-settings');
  const ids=[...document.querySelectorAll('[id]')].map(e=>e.id);check(new Set(ids).size===ids.length,'Duplicate IDs after menu organization');
  for(const [group,data] of Object.entries({ship:SHIPS,gun:GUNS,drone:DRONEWINGS,pilot:PILOTS}))check(document.querySelectorAll('.opt-card[data-group="'+group+'"]').length===Object.keys(data).length,'Catalogue option removed '+group);
  const group=id=>document.getElementById(id).closest('[data-menu-group]')?.dataset.menuGroup;
  check(group('set-sound')==='audio'&&settings.querySelector('.music-btn').closest('[data-menu-group]').dataset.menuGroup==='audio','Audio controls are not grouped');
  check(group('btn-gyro')==='controls','Steering is not in Controls');
  check(settings.querySelector('[data-graphics]').closest('[data-menu-group]').dataset.menuGroup==='graphics','Graphics is not its own section');
  check(settings.querySelector('[data-set="text"]').closest('[data-menu-group]').dataset.menuGroup==='accessibility','Accessibility controls are scattered');
  check(settings.querySelector('[data-theme]').closest('[data-menu-group]').dataset.menuGroup==='interface','Theme controls are scattered');
  check(document.getElementById('ship-systems').dataset.sec==='livery'&&document.getElementById('batch-inspect').closest('.ship-inspector'),'Livery organization lost ship inspection callouts');
  check(settings.querySelector('#about-game .asset-credit a'),'Model attribution removed');
  check(!document.getElementById('stage').getAttribute('style')?.includes('data:image'),'Large backdrop URI is on the frequently updated stage style');
  check([...document.getElementById('unified-menu-system').sheet.cssRules].filter(r=>r.style?.getPropertyValue('--menu-scene')).length===1,'Shared menu backdrop was not cached once in the stylesheet');
 });
 const routes=['hangar','arsenal','drones','livery','engineering','pilots','settings','campaign','quests'];
 const artifacts=process.env.STARFALL_MENU_ARTIFACTS;if(artifacts)fs.mkdirSync(artifacts,{recursive:true});
 for(const width of [320,375,430]){
  await page.setViewportSize({width,height:width===320?640:844});
  for(const route of routes){
   await page.evaluate(route=>showScreen(route),route);await page.waitForTimeout(300);
   await page.evaluate(route=>{
    const root=document.querySelector('.screen.on'),stage=document.getElementById('stage').getBoundingClientRect(),head=root.querySelector('.menu-head'),box=head.getBoundingClientRect();
    if(root.scrollWidth>root.clientWidth+1)throw Error('Horizontal menu overflow '+route);
    if(route==='campaign')for(const node of root.querySelectorAll('.camp-node')){const meta=node.querySelector('.camp-meta').getBoundingClientRect(),reward=node.querySelector('.camp-right').getBoundingClientRect();if(meta.bottom>reward.top+1)throw Error('Mission rewards overlap descriptions');}
    if(box.left<stage.left-1||box.right>stage.right+1)throw Error('Header escapes viewport '+route);
    if(!head.contains(root.querySelector('h2'))||head.querySelectorAll('.meta-key').length!==5)throw Error('Inconsistent menu header '+route);
    for(const button of head.querySelectorAll('button')){const b=button.getBoundingClientRect();if(b.width<43||b.height<43||b.left<stage.left-1||b.right>stage.right+1)throw Error('Small/clipped header target '+route+' '+button.textContent);}
    const active=head.querySelector('[data-nav="'+route+'"]');if(active&&active.getAttribute('aria-current')!=='page')throw Error('Active route is missing accessible state '+route);
    root.scrollTop=Math.min(300,root.scrollHeight-root.clientHeight);const sticky=head.getBoundingClientRect();
    if(Math.abs(sticky.top-stage.top)>1)throw Error('Sticky menu navigation is clipped '+route+' '+(sticky.top-stage.top));
    root.scrollTop=0;
   },route);
   if(artifacts&&width===375)await page.locator('#stage').screenshot({path:artifacts+'/'+route+'.png'});
  }
 }
 await page.setViewportSize({width:390,height:844});await page.evaluate(()=>showScreen('hangar'));await page.waitForTimeout(350);
 await page.evaluate(()=>window.sharedMenuGPU=document.getElementById('ship-preview3d'));
 await page.locator('#scr-loadout .menu-head [data-nav="arsenal"]').click();await page.waitForTimeout(350);
 await page.locator('.opt-card[data-group="gun"][data-value="scatter"]').click();await page.waitForTimeout(150);
 await page.evaluate(()=>{if(LOADOUT.gun!=='scatter'||document.getElementById('ship-preview3d')!==window.sharedMenuGPU)throw Error('Weapon selection lost shared renderer');});
 await page.locator('#scr-loadout .menu-head [data-nav="drones"]').click();await page.waitForTimeout(350);
 await page.locator('.opt-card[data-group="drone"][data-value="guardian"]').click();await page.waitForTimeout(150);
 await page.evaluate(()=>{if(LOADOUT.drone!=='guardian'||document.getElementById('ship-preview3d')!==window.sharedMenuGPU||window.menuGPUContexts>2)throw Error('Drone selection created/replaced GPU contexts');});
 await page.locator('#scr-loadout .menu-head [data-nav="settings"]').click();await page.waitForTimeout(350);
 await page.locator('#scr-settings [data-set="text"]').click();
 await page.evaluate(()=>showScreen('arsenal'));await page.waitForTimeout(350);
 await page.evaluate(()=>{if(parseFloat(getComputedStyle(document.querySelector('.opt-card[data-group="gun"] .opt-stat')).fontSize)<14)throw Error('Large text did not reach equipment descriptions');});
 await page.evaluate(()=>{showScreen('settings');document.querySelector('#scr-settings [data-set="text"]').click();showScreen('campaign');});await page.waitForTimeout(350);
 await page.locator('#scr-campaign .menu-section-links [data-nav="quests"]').click();await page.waitForTimeout(350);
 await page.evaluate(()=>{if(!document.getElementById('scr-quests').classList.contains('on'))throw Error('Mission-to-contract route is broken');});
 // A visible live preview must continue without new buffers, textures or contexts.
 await page.evaluate(()=>showScreen('hangar'));await page.waitForTimeout(400);
 await page.evaluate(async()=>{const gl=SF3D.preview.gl,methods=['createBuffer','createTexture','createProgram'],originals=methods.map(k=>gl[k]);let allocated=0;
  methods.forEach((k,i)=>gl[k]=function(){allocated++;return originals[i].apply(this,arguments)});
  try{await new Promise(resolve=>{let n=0;function frame(){if(++n===30)resolve();else requestAnimationFrame(frame)}requestAnimationFrame(frame)});}finally{methods.forEach((k,i)=>gl[k]=originals[i]);}
  if(allocated)throw Error('Steady menu rendering allocates GPU resources');
  const cv=document.getElementById('ship-preview3d');if(!cv?._starfallGL||SF3D.metrics.nativePlayer)throw Error('Menu lost native preview or keeps rendering hidden gameplay');
 });
 for(const screen of ['pause','over','win']){
  await page.evaluate(screen=>showScreen(screen),screen);await page.waitForTimeout(350);
  await page.evaluate(()=>{const root=document.querySelector('.screen.on');if(root.scrollWidth>root.clientWidth+1)throw Error('Modal overflow '+root.id);for(const b of root.querySelectorAll('button')){const r=b.getBoundingClientRect();if(r.width&&r.height&&r.height<43)throw Error('Modal target too small '+b.id);}});
  if(artifacts)await page.locator('#stage').screenshot({path:artifacts+'/'+screen+'.png'});
 }
 if(errors.length)throw Error(errors.join('\n'));await page.close();
 const reduced=await browser.newPage({viewport:{width:320,height:640},reducedMotion:'reduce'});await reduced.goto('http://127.0.0.1:8765');await reduced.waitForFunction(()=>document.getElementById('graphics-panel').dataset.state==='ready');
 await reduced.evaluate(()=>{showScreen('settings');if(document.getElementById('scr-settings').getAnimations().length)throw Error('Reduced-motion menu animates');});await reduced.close();
 console.log('Unified menus: all catalogues retained, organized settings, nine phone layouts, sticky 44px navigation, shared GPU selection, resource reuse, modal layouts and reduced motion passed');
};
