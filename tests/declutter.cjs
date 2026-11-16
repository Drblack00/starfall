// Real page: essential controls stay visible; advanced tools remain reachable.
const {chromium}=require('playwright'),assert=require('assert');
(async()=>{const b=await chromium.launch({executablePath:process.env.CHROMIUM_PATH,args:['--no-sandbox']});try{
 const p=await b.newPage({viewport:{width:375,height:812}}),errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.goto('http://127.0.0.1:8765');await p.waitForFunction(()=>document.getElementById('graphics-panel').dataset.state==='ready');
 assert(await p.locator('#graphics-panel').isHidden());assert(await p.locator('#deck-preview-d').count()===0);
 await p.locator('#btn-play').click();assert(await p.locator('#launch-details').getAttribute('open')===null);assert(await p.locator('#btn-lc-go').isVisible());
 await p.locator('#launch-details summary').click();assert(await p.locator('#brief-intel-d').isVisible());await p.locator('#btn-lc-cancel').click();
 await p.waitForTimeout(300);await p.locator('#scr-start [data-nav="campaign"]').click();assert(await p.locator('#optional-modes').getAttribute('open')===null);await p.locator('#optional-modes summary').click();assert(await p.locator('#batch-c-modes button').first().isVisible());assert(await p.locator('#ng-panel-d').isVisible());await p.keyboard.press('Escape');await p.waitForTimeout(300);await p.locator('#scr-start [data-nav="hangar"]').click();assert(await p.locator('#ship-system-details').getAttribute('open')===null);
 await p.locator('#ship-system-details summary').click();assert(await p.getByRole('button',{name:'CANOPY OPEN / CLOSE'}).isVisible());
 for(const width of [320,375,430]){await p.setViewportSize({width,height:812});await p.waitForTimeout(100);assert(await p.evaluate(()=>{const cards=[...document.querySelectorAll('.opt-card[data-group="ship"]')].slice(0,6);return cards.every(card=>card.getBoundingClientRect().width>=80)&&cards[3].getBoundingClientRect().top>cards[0].getBoundingClientRect().top&&document.getElementById('scr-loadout').scrollWidth<=document.getElementById('scr-loadout').clientWidth+1}),'Added hulls wrap into readable rows without overflow');}await p.setViewportSize({width:375,height:812});

 await p.locator('#btn-loadout-back').click();await p.waitForTimeout(300);await p.locator('#btn-play').click();await p.locator('#btn-lc-go').click();await p.waitForFunction(()=>G.mode==='playing');
 if(await p.locator('#coach-skip').isVisible())await p.locator('#coach-skip').click();
 assert(await p.locator('#deck-flight-d').count()===0);assert(await p.locator('#batch-flight-controls').isVisible());
 await p.locator('#btn-pause').click();await p.waitForTimeout(300);await p.locator('#pause-view-tools summary').click();await p.locator('#cockpit-d').click();assert(await p.locator('#cockpit-d').getAttribute('aria-pressed')==='true');await p.locator('#cockpit-d').click();
 await p.locator('#pause-photo-d').click();assert(await p.locator('#photo-panel-d').isVisible());await p.locator('#photo-exit-d').click();await p.waitForTimeout(300);
 await p.locator('#btn-pause-settings').click();await p.waitForTimeout(300);await p.locator('#settings-graphics-status').click();assert(await p.locator('#scr-settings #graphics-diagnostics').isVisible());assert(await p.evaluate(()=>G.mode==='paused'));await p.locator('#graphics-close').click();
 await p.keyboard.press('Escape');await p.waitForTimeout(300);await p.locator('#btn-resume').click();await p.waitForFunction(()=>G.mode==='playing');assert.deepStrictEqual(errors,[]);
 console.log('Declutter: quiet Home, expandable briefing/systems, retained combat controls, pause camera tools and diagnostics without losing a paused run passed');
 }finally{await b.close()}})().catch(e=>{console.error(e);process.exitCode=1});
