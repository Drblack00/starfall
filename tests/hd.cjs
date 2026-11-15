// Served-page checks for cosmetic weapon choices, native combat and reusable audio stems.
module.exports=async function verifyHD(browser){
  const page=await browser.newPage({viewport:{width:390,height:844}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:8765/index.html');
  await page.waitForFunction(()=>document.getElementById('graphics-panel').dataset.state==='ready');
  await page.locator('#scr-start [data-nav="settings"]').click();await page.locator('[data-graphics="hd"]').click();await page.keyboard.press('Escape');await page.waitForTimeout(250);
  await page.locator('#scr-start [data-nav="arsenal"]').click();
  for(const gun of ['pulse','scatter','lance']){
    await page.locator(`.opt-card[data-group="gun"][data-value="${gun}"]`).click();
    const frames=await page.evaluate(()=>CANNON_FRAMES[LOADOUT.gun]);
    for(const frame of frames){
      await page.locator(`[data-frame="${frame}"]`).click();await page.waitForTimeout(80);
      await page.evaluate(({gun,frame})=>{
        const key=frame==='standard'?'equipment:'+gun:'frame:'+frame,mesh=SF3D.getGeometry(key);
        if(PROFILE.cannonFrames[gun]!==frame||document.getElementById('weapon-viewer')._previewModel!==key)throw Error('Weapon chassis selection is not reflected in inspection');
        if(document.querySelector(`[data-frame="${frame}"]`).getAttribute('aria-pressed')!=='true')throw Error('Weapon chassis lacks accessible selection');
        const rig=SF3D.getRig(LOADOUT.ship,gun);if(rig.weapon!==mesh||SF3D.getRig(LOADOUT.ship,gun)!==rig)throw Error('Mounted weapon differs or rebuilds every frame');
        if(SF3D.preview.batches[key].source!==mesh)throw Error('Live chassis viewer uses a substitute model');
      },{gun,frame});
    }
  }
  await page.reload();await page.waitForFunction(()=>document.getElementById('graphics-panel').dataset.state==='ready');
  await page.evaluate(()=>{
    if(PROFILE.graphics!=='hd')throw Error('Graphics preference did not persist');
    if(PROFILE.cannonFrames.pulse!=='ar4'||PROFILE.cannonFrames.scatter!=='ar6'||PROFILE.cannonFrames.lance!=='sniper3')throw Error('Cosmetic weapon choices did not persist');
    const drones=SF3D.combat.models.filter(m=>m.key.startsWith('drone:'));
    if(drones.some(m=>!m.sourceObjects?.length||m.sourceObjects.some(n=>m.excludedObjects.includes(n))))throw Error('Hidden authoring helpers contaminated drone export');
    if(drones.length!==6||new Set(drones.map(m=>m.sha256)).size!==6||drones.some(m=>m.creator!=='Quaternius'))throw Error('Downloaded drone bodies are missing or repeated');
    const ctx=new OfflineAudioContext(1,44100,44100),buffers=Music.createScore(ctx);
    if(Music.bpm!==128||buffers.length!==3||buffers.some(b=>Math.abs(b.duration-7.5)>.001))throw Error('Action score stems are not synchronized to four bars');
    for(const buffer of buffers){const v=buffer.getChannelData(0);let energy=0,peak=0;for(const sample of v){if(!Number.isFinite(sample))throw Error('Invalid audio sample');energy+=sample*sample;peak=Math.max(peak,Math.abs(sample));}if(peak>.8||Math.sqrt(energy/v.length)<.01||v[0]!==0||v.at(-1)!==0)throw Error('Score headroom, audible signal or loop seam is invalid');}
  });
  await page.locator('#btn-play').click();await page.locator('#btn-lc-go').click();await page.waitForFunction(()=>G.mode==='playing');
  await page.waitForTimeout(350);
  await page.evaluate(()=>{
    const rig=SF3D.foreground.batches['ship:'+G.player.ship];if(rig.source.weapon!==SF3D.getGeometry('frame:sniper3'))throw Error('Selected chassis is missing in gameplay');
    if(SF3D.metrics.combatWidth!==document.getElementById('game').width||SF3D.foreground.canvas.width!==document.getElementById('game').width)throw Error('Combat is rendered on a coarse background raster');
    if(!Music.started||Music.stems.length!==3||Music.stems.some(s=>!s.source.loop))throw Error('Action music is not playing as reusable loop stems');
    window.scoreSources=Music.stems.map(s=>s.source);if(Music.stems[1].level<=.2)throw Error('Combat percussion did not rise');
  });
  await page.evaluate(()=>{PROFILE.graphics='auto';const clock=performance.now.bind(performance);let fake=clock();performance.now=()=>fake+=40;for(let n=0;n<150;n++)SF3D.draw();performance.now=clock;
    const native=document.getElementById('game'),sharp=SF3D.foreground;
    if(SF3D.metrics.nativeCombat||!SF3D.metrics.nativeEffects||SF3D.metrics.combatWidth>=native.width)throw Error('Auto did not adapt the distant combat raster');
    if(sharp.canvas.width<192*native.width/420-.5||sharp.canvas.height<200*native.height/740-.5)throw Error('Auto reduced the player/escort pixel density');
    if(sharp.batches['drone:'+G.player.droneType].source!==SF3D.getDroneRig(G.player.droneType))throw Error('Auto lost the native 3D drone rig');
  });
  await page.locator('#btn-pause').click();await page.waitForTimeout(350);
  await page.evaluate(()=>{if(Music.stems[1].level>=.2)throw Error('Pause did not soften percussion');for(let n=0;n<3;n++)if(Music.stems[n].source!==window.scoreSources[n])throw Error('Music recreates sources while playing');});
  await page.locator('#scr-pause .music-btn').click();await page.waitForTimeout(350);
  await page.evaluate(()=>{if(Music.on||Music.gain.gain.value>.03)throw Error('Music mute did not fade down')});
  await page.locator('#scr-pause .music-btn').click();await page.waitForTimeout(200);
  await page.evaluate(()=>{if(!Music.on||Music.stems.some((s,n)=>s.source!==window.scoreSources[n]))throw Error('Music toggle restarted the score instead of preserving phase')});
  if(errors.length)throw Error(errors.join('\n'));await page.close();
  console.log('HD: six new drone bodies, nine persistent cosmetic blaster chassis, exact mounted/viewed models, HD combat, sharp Auto escorts and phase-aligned action audio passed');
};
