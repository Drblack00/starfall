// Rendering checks used by verify.cjs; the original simulation checks stay intact.
module.exports = async function verifyWebGL(browser, page, source) {
  console.log(await page.evaluate(async () => {
    const w=t.SF3D, check=(v,msg)=>{if(!v)throw Error(msg)};
    check(await w.ready,'Embedded Nitro asset decodes');
    const high=w.getGeometry('ship:vanguard'), low=w.getGeometry('ship:vanguard:lod');
    check(high.assetId==='nitro-blade'&&low.assetId===high.assetId,'Preview and flight use supplied Nitro mesh');
    check(high.count===45639&&low.count<high.count,'Real model and mobile LOD loaded');
    for(const mesh of [high,low]) {
      let lo=Infinity,hi=-Infinity;
      for(let i=0;i<mesh.vertices.length;i++){check(Number.isFinite(mesh.vertices[i]),'Finite mesh data');if(i%12===2){lo=Math.min(lo,mesh.vertices[i]);hi=Math.max(hi,mesh.vertices[i]);}}
      check(hi-lo>1,'Model has actual depth');
    }
    t.startRun(1);t.g.player.invuln=10000;t.render();
    check(w.metrics.mode==='webgl2','3D flight renderer active');
    check(document.getElementById('graphics-panel').dataset.state==='ready','Visible status confirms both real 3D and Nitro readiness');
    for(const name of Object.keys(t.SHIP_ART))check(w.thumbnail(name,'#aaffff','#88ddff',1,0),'Shared ship preview '+name);
    t.g.boss=null;t.g.enemies=[];t.g.player.muzzle=0;
    const charger=t.createEnemy('charger',200);charger.y=250;charger.state='aim';charger.flash=0;t.g.enemies=[charger];
    t.g.time=0;t.render();const bright=w.renderer.batches.glow.count;
    t.g.time=.1;t.render();check(w.renderer.batches.glow.count===bright-1,'Charger aim cue blinks at legacy phase');
    charger.state='rush';charger.vx=160;charger.vy=200;t.render();
    check(Math.abs(w.renderer.batches['enemy:charger'].records[1])>.1,'Charger hull rotates during rush');
    charger.state='aim';charger.elite=true;t.render();
    check(Math.abs(Math.abs(w.renderer.batches['enemy:charger'].records[0])-1.28)<.001,'Elite charger keeps enlarged hull');
    check(w.renderer.batches.cube.count>0,'Elite charger armour band rendered');
    t.g.enemies=[];
    const kinds=['mothership','dreadnought','leviathan','cryowarden','eclipse'];
    const counts=new Set();
    for(let i=0;i<5;i++) {
      t.startSector(i+1);t.spawnBoss();t.g.boss.state='fight';t.g.boss.y=150;t.render();
      const key='boss:'+kinds[i],mesh=w.getGeometry(key);counts.add(mesh.count);
      check(w.renderer.batches[key].source===mesh,'Boss flight uses shared geometry');
      let front=-Infinity;for(let n=2;n<mesh.vertices.length;n+=12)front=Math.max(front,mesh.vertices[n]*1.22);
      check(w.renderer.batches.core.records[14]>front,'Boss weak-point marker sits above its hull');
      check(w.thumbnail(key,'#aaffff','#aaffff',1,0),'Boss preview '+key);
    }
    check(counts.size>=4,'Boss meshes remain distinct');
    t.g.warpW=1;t.g.warpP=.75;t.render();
    for(const batch of Object.values(w.renderer.batches))for(let n=0;n<batch.count*24;n++)check(Number.isFinite(batch.records[n]),'Warp and combat instance transforms stay finite');
    t.g.warpW=0;t.g.warpP=0;t.render();
    const gpu=w.renderer, shape=Object.keys(gpu.batches).join(), stores=Object.values(gpu.batches).map(b=>b.records);
    for(let i=0;i<30;i++)t.render();
    check(shape===Object.keys(gpu.batches).join(),'No new steady-state GPU batches');
    Object.values(gpu.batches).forEach((b,i)=>check(b.records===stores[i],'Fixed instance storage reused'));
    check(gpu.gl.getError()===gpu.gl.NO_ERROR,'No WebGL errors');
    return 'WebGL: embedded mesh, LOD, shared previews, five bosses, stable instance buffers passed';
  }));
  const contextLoss=await page.evaluate(()=>{
    const ext=t.SF3D.renderer.gl.getExtension('WEBGL_lose_context');
    if(!ext)return false;window.testContextExt=ext;ext.loseContext();return true;
  });
  if(contextLoss){
    await page.waitForFunction(()=>t.SF3D.metrics.mode==='recovery');
    await page.evaluate(()=>{t.render();window.testContextExt.restoreContext()});
    await page.waitForFunction(()=>t.SF3D.metrics.mode==='webgl2');
    await page.evaluate(()=>{t.render();if(t.SF3D.renderer.gl.getError())throw Error('Context recovery GL error')});
    console.log('WebGL context loss and recovery passed');
  }
  const legacy=await browser.newPage({viewport:{width:375,height:812}});
  await legacy.addInitScript(()=>{window.DecompressionStream=undefined;const old=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(type,...args){return type==='webgl2'?null:old.call(this,type,...args)}});
  await legacy.route('**/test.html',r=>r.fulfill({body:source,contentType:'text/html'}));
  await legacy.goto('http://127.0.0.1:8765/test.html');
  await legacy.evaluate(async()=>{
    await t.SF3D.ready;t.startRun(1);t.render();
    if(t.SF3D.metrics.mode!=='webgl1')throw Error('WebGL2-disabled device did not get real-time WebGL1 3D');
    if(t.SF3D.renderer.batches['ship:vanguard:lod'].source.assetId!=='nitro-blade')throw Error('WebGL1 lost supplied mesh');
    if(!t.SF3D.thumbnail('vanguard','#ffffff','#88ddff',1,0)||!t.SF3D.preview.legacy)throw Error('WebGL1 preview did not share backend');
    for(let wave=1;wave<=5;wave++){t.startSector(wave);t.spawnBoss();t.g.boss.state='fight';t.g.boss.y=150;t.render();}
    const gpu=t.SF3D.renderer,storage=Object.values(gpu.batches).map(b=>[b.records,b.uploadRanges]);
    for(let n=0;n<20;n++)t.render();
    Object.values(gpu.batches).forEach((b,n)=>{if(b.records!==storage[n][0]||b.uploadRanges!==storage[n][1])throw Error('WebGL1 upload storage churn')});
    if(gpu.gl.getError()!==gpu.gl.NO_ERROR)throw Error('WebGL1 GL error');
  });
  await legacy.close();console.log('WebGL2 and stream decompression disabled: native WebGL1 Nitro flight, preview, five bosses and allocation-free uploads passed');
  const shaderFailure=await browser.newPage();
  await shaderFailure.addInitScript(()=>{
    const proto=WebGL2RenderingContext.prototype,old=proto.getShaderParameter;
    proto.getShaderParameter=function(shader,flag){return flag===this.COMPILE_STATUS?false:old.call(this,shader,flag)};
    proto.getShaderInfoLog=()=>"Simulated WebGL2 shader initialization failure";
  });
  await shaderFailure.route('**/test.html',r=>r.fulfill({body:source,contentType:'text/html'}));
  await shaderFailure.goto('http://127.0.0.1:8765/test.html');
  await shaderFailure.evaluate(async()=>{
    await t.SF3D.ready;t.render();
    if(t.SF3D.metrics.mode!=='webgl1'||document.querySelectorAll('#world3d').length!==1)throw Error('Shader failure did not recover to one real 3D surface');
    if(!t.SF3D.thumbnail('vanguard','#ffffff','#88ddff',0,0))throw Error('Shader fallback lost the actual ship preview');
    if(t.SF3D.renderer.gl.getError())throw Error('Shader fallback GL error');
  });
  await shaderFailure.close();console.log('WebGL2 shader startup failure recovers to native WebGL1 3D');
  const fallback=await browser.newPage({viewport:{width:375,height:812}});
  await fallback.addInitScript(()=>{window.block3D=true;const old=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(type,...args){return /^(webgl2?|experimental-webgl)$/.test(type)&&window.block3D?null:old.call(this,type,...args)}});
  await fallback.route('**/test.html',r=>r.fulfill({body:source,contentType:'text/html'}));
  await fallback.goto('http://127.0.0.1:8765/test.html');
  await fallback.evaluate(async()=>{
    await t.SF3D.ready;t.render();
    if(t.SF3D.metrics.mode!=='fallback'||!document.getElementById('graphics-status').textContent.includes('2D COMPATIBILITY'))throw Error('Missing explicit compatibility state');
    if(!document.getElementById('graphics-error').textContent.includes('WebGL unavailable'))throw Error('Startup error is hidden');
    if(document.querySelectorAll('#world3d').length!==1)throw Error('Leaked scene canvas');
  });
  if(!await fallback.locator('#graphics-retry').isVisible())throw Error('Retry action is hidden on phone');
  await fallback.evaluate(()=>{window.block3D=false});
  await fallback.locator('#graphics-retry').click();
  await fallback.waitForFunction(()=>document.getElementById('graphics-panel').dataset.state==='ready');
  await fallback.evaluate(()=>{
    t.startRun(1);t.render();
    if(t.SF3D.metrics.mode!=='webgl2'||t.SF3D.renderer.batches['ship:vanguard:lod'].source.assetId!=='nitro-blade')throw Error('Retry did not restore actual Nitro flight');
    if(document.querySelectorAll('#world3d').length!==1)throw Error('Retry leaked scene canvases');
  });
  await fallback.close();console.log('Explicit phone fallback reason and retry into real Nitro 3D passed');
  const previewFailure=await browser.newPage();
  await previewFailure.addInitScript(()=>{
    window.previewAttempts=0;window.blockPreview=true;
    const old=HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext=function(type,...args){if(/^(webgl2?|experimental-webgl)$/.test(type)&&!this.id){window.previewAttempts++;if(window.blockPreview)return null;}return old.call(this,type,...args)};
  });
  await previewFailure.route('**/test.html',r=>r.fulfill({body:source,contentType:'text/html'}));
  await previewFailure.goto('http://127.0.0.1:8765/test.html');
  await previewFailure.evaluate(async()=>{
    await t.SF3D.ready;t.render();t.SF3D.thumbnail('vanguard','#ffffff','#ffffff',0,0);
    const before=window.previewAttempts;
    for(let n=0;n<100;n++)t.SF3D.thumbnail('vanguard','#ffffff','#ffffff',n,0);
    if(before!==window.previewAttempts)throw Error('Failed preview allocates another context every frame');
    if(document.getElementById('graphics-panel').dataset.state!=='preview-error')throw Error('Preview failure is hidden');
    window.blockPreview=false;
  });
  await previewFailure.locator('#graphics-retry').click();
  await previewFailure.evaluate(()=>{if(!t.SF3D.thumbnail('vanguard','#ffffff','#ffffff',0,0))throw Error('Preview did not recover after retry')});
  await previewFailure.close();console.log('Preview failure is bounded, visible, and recoverable');
};
