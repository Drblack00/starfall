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
  const fallback=await browser.newPage();
  await fallback.addInitScript(()=>{const old=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(type,...args){return type==='webgl2'?null:old.call(this,type,...args)}});
  await fallback.route('**/test.html',r=>r.fulfill({body:source,contentType:'text/html'}));
  await fallback.goto('http://127.0.0.1:8765/test.html');
  await fallback.evaluate(async()=>{await t.SF3D.ready;t.startRun(1);t.render();if(t.SF3D.metrics.mode!=='fallback'||!document.getElementById('graphics-status'))throw Error('Missing compatibility fallback')});
  await fallback.close();console.log('WebGL unavailable: playable compatibility fallback passed');
};
