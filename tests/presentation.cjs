// Running-page checks: menu composition, live GPU previews, input/focus and menu navigation.
module.exports=async function verifyPresentation(browser){
  const page=await browser.newPage({viewport:{width:390,height:844}});
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  await page.addInitScript(()=>{window.gpuContexts=0;const seen=new WeakSet(),original=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(type,...args){const result=original.call(this,type,...args);if(result&&(type==='webgl'||type==='webgl2')&&!seen.has(result)){seen.add(result);window.gpuContexts++;}return result;};});
  await page.goto('http://127.0.0.1:8765/index.html');
  await page.waitForFunction(()=>document.getElementById('graphics-panel').dataset.state==='ready');
  await page.waitForFunction(()=>document.getElementById('ship-preview3d')?.parentElement.id==='hero-ship');
  for(const width of [320,375,430]){
    await page.setViewportSize({width,height:width===320?640:844});
    await page.waitForTimeout(150);
    await page.evaluate(()=>{
      const root=document.querySelector('#scr-start .ck-scroll'),flow=[...root.children].filter(e=>{const style=getComputedStyle(e);return e.getBoundingClientRect().height>0&&!['absolute','fixed'].includes(style.position)&&style.display!=='none';});
      if(!flow.at(-1).classList.contains('ck-launchwrap'))throw Error('Home does not end at Play');
      if(root.querySelector('.ck-keygrid,.ck-howto,.asset-credit,#pilot-dock'))throw Error('Removed footer modules remain on home');
      const play=document.getElementById('btn-play'),stage=document.getElementById('stage');root.scrollTop=root.scrollHeight;
      if(play.getBoundingClientRect().bottom>stage.getBoundingClientRect().bottom+1)throw Error('Play is not reachable at phone size');
      if(Math.abs(stage.getBoundingClientRect().width/stage.getBoundingClientRect().height-420/740)>.002)throw Error('UI content distorted the gameplay aspect ratio');
      if(document.documentElement.scrollWidth>innerWidth)throw Error('Phone horizontal overflow');
    });
  }
  await page.setViewportSize({width:390,height:844});
  await page.evaluate(async()=>{
    const host=document.getElementById('hero-canvas'),gpu=document.getElementById('ship-preview3d');window.sharedPreview=gpu;
    if(host.style.visibility!=='hidden'||!gpu._starfallGL)throw Error('Home is not using the actual GPU surface');
    let copies=0;const draw=CanvasRenderingContext2D.prototype.drawImage;
    CanvasRenderingContext2D.prototype.drawImage=function(...args){if(this.canvas===host&&args[0]?._starfallGL)copies++;return draw.apply(this,args)};
    await new Promise(resolve=>{let frames=0;function frame(){if(++frames>=30)resolve();else requestAnimationFrame(frame)}requestAnimationFrame(frame)});
    CanvasRenderingContext2D.prototype.drawImage=draw;
    if(copies)throw Error('Steady home animation copies GPU frames into a 2D canvas');
  });
  await page.locator('#scr-start [data-nav="hangar"]').click();
  await page.waitForFunction(()=>document.getElementById('ship-preview3d')?.parentElement===document.getElementById('hangar-canvas').parentElement);
  await page.locator('.opt-card[data-group="ship"][data-value="aegis"]').click();
  if(await page.locator('.opt-card[data-group="ship"][data-value="aegis"]').getAttribute('aria-pressed')!=='true')throw Error('Selected ship has no accessible state');
  await page.keyboard.press('Enter');
  await page.evaluate(()=>{if(G.mode!=='start'||!document.getElementById('scr-loadout').classList.contains('on'))throw Error('Enter in loadout bypassed launch confirmation')});
  await page.keyboard.press('Escape');await page.waitForTimeout(250);
  await page.locator('#scr-start [data-nav="arsenal"]').click();await page.waitForTimeout(250);
  await page.evaluate(()=>{if(!document.querySelector('.ordnance-preview')||!document.querySelector('.gun-preview'))throw Error('Arsenal lacks imported weapon/bomb previews')});
  await page.keyboard.press('Escape');await page.waitForTimeout(250);
  await page.locator('#scr-start [data-nav="drones"]').click();await page.waitForTimeout(250);
  await page.keyboard.press('Escape');await page.waitForTimeout(250);
  await page.locator('#scr-start [data-nav="settings"]').click();await page.waitForTimeout(250);
  await page.evaluate(()=>{if(!document.querySelector('#about-game .asset-credit'))throw Error('Model attribution no longer accessible')});
  await page.keyboard.press('Escape');await page.waitForTimeout(250);
  await page.locator('#btn-play').click();await page.locator('#btn-lc-go').click();
  await page.waitForFunction(()=>G.mode==='playing');
  await page.evaluate(()=>{if(document.getElementById('ship3d')!==window.sharedPreview)throw Error('Gameplay allocated a different ship surface');if(window.gpuContexts>2)throw Error('Added extra GPU contexts')});
  await page.keyboard.press('Escape');await page.waitForTimeout(300);
  await page.locator('#btn-pause-settings').click();await page.waitForTimeout(350);
  await page.waitForFunction(()=>document.getElementById('ship-preview3d')?.parentElement===document.getElementById('pv-canvas').parentElement);
  await page.evaluate(async()=>{const canvas=document.getElementById('ship-preview3d'),parent=canvas.parentElement;let resized=0;const observer=new MutationObserver(changes=>resized+=changes.length);observer.observe(canvas,{attributes:true,attributeFilter:['width','height']});
    await new Promise(resolve=>{let n=0;function frame(){if(++n===30)resolve();else requestAnimationFrame(frame)}requestAnimationFrame(frame)});observer.disconnect();
    if(resized||canvas.parentElement!==parent)throw Error('Paused settings reparents/resizes the GPU canvas every frame');
    if(!SF3D.metrics.menuActive||SF3D.metrics.nativePlayer)throw Error('Opaque menu is still rendering the paused flight player');});
  await page.keyboard.press('Escape');await page.waitForTimeout(250);
  await page.locator('#btn-resume').click();await page.waitForFunction(()=>G.mode==='playing');
  if(errors.length)throw Error(errors.join('\n'));await page.close();
  console.log('Presentation: home ends at Play, native GPU menu/flight identity, zero steady preview copies, accessible selection, Enter/Escape, all system routes and pause/resume passed');
};
