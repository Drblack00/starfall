// Independent faction geometry, live material selection, blend correctness and cache reuse.
module.exports=async function verifyFactions(page){
 console.log(await page.evaluate(async()=>{
  const w=t.SF3D,check=(v,msg)=>{if(!v)throw Error(msg)};await w.ready;t.startRun(1);t.g.spawnQueue=[];t.g.waveState='idle';t.g.boss=null;t.g.player.invuln=10000;
  const fleet=new Set(Object.keys(t.SHIP_ART).map(k=>w.getGeometry('ship:'+k).assetId)),hashes=new Set(),types=['diver','charger','weaver','sentinel','lancer','bulwark'];
  for(const type of types){
   const mesh=w.getGeometry('enemy:'+type);check(mesh.family==='rift'&&!mesh.image&&!fleet.has(mesh.assetId)&&mesh.count<=3000,'Enemy is an original bounded faction mesh '+type);
   const enemy=t.createEnemy(type,210);enemy.y=210;enemy.spawnT=0;enemy.elite=false;t.g.enemies=[enemy];t.render();
   const gpu=w.combatGPU,draw=gpu.drawInstances,seen=[];gpu.drawInstances=function(...args){if(args[1]===mesh.count)seen.push({toon:this.gl.getParameter(this.gl.CURRENT_PROGRAM)===this.toonProgram,blend:this.gl.isEnabled(this.gl.BLEND)});return draw(...args)};
   t.render();gpu.drawInstances=draw;check(seen.some(v=>v.toon&&!v.blend),'Faction uses the lean toon path without unnecessary opaque blending '+type);
   enemy.spawnT=.14;t.render();check(gpu.batches['enemy:'+type].blended,'Spawn fade retains blending '+type);
   const buffer=gpu.batches['enemy:'+type].records;enemy.spawnT=0;t.render();check(gpu.batches['enemy:'+type].records===buffer,'Faction instance storage is reused');
   const image=w.thumbnail('enemy:'+type,'#ff697e','#ff697e',1,0),gl=w.preview.gl,pixels=new Uint8Array(image.width*image.height*4);gl.readPixels(0,0,image.width,image.height,gl.RGBA,gl.UNSIGNED_BYTE,pixels);let hash=2166136261,count=0;for(let n=0;n<pixels.length;n+=4){if(pixels[n+3]>100)count++;hash=Math.imul(hash^pixels[n]^pixels[n+3],16777619);}check(count>100,'Visible faction silhouette '+type);hashes.add(hash);
  }
  check(hashes.size===6,'All six enemies have distinct rendered silhouettes');
  const bossHashes=new Set();for(let i=0;i<5;i++){t.startSector(i+1);t.spawnBoss();t.g.boss.state='fight';t.g.boss.y=145;t.render();const kind=t.g.boss.kind,mesh=w.getGeometry('boss:'+kind);check(mesh.family==='rift'&&!fleet.has(mesh.assetId)&&mesh.count<=9000,'Boss stays outside the player fleet '+kind);
   const frame=w.thumbnail('boss:'+kind,'#a7dfff','#a7dfff',1,0),gl=w.preview.gl,p=new Uint8Array(frame.width*frame.height*4);gl.readPixels(0,0,frame.width,frame.height,gl.RGBA,gl.UNSIGNED_BYTE,p);let h=2166136261;for(let n=0;n<p.length;n+=4)h=Math.imul(h^p[n]^p[n+3],16777619);bossHashes.add(h);}
  check(bossHashes.size===5,'Five bosses have distinct rendered signatures');
  const sky=SPACE_BACKDROP_CACHE[5],texture=w.renderer.skyTextures[5];t.render();t.render();check(SPACE_BACKDROP_CACHE[5]===sky&&w.renderer.skyTextures[5]===texture,'Illustrated scenery is cached and GPU textures are reused');
  check(w.metrics.combatWidth>=document.getElementById('game').width&&w.renderer.gl.getError()===0,'Battle stays native without GL errors');return 'Factions: six unique non-arsenal enemies, five distinct bosses, lean toon/blend paths, native battle and cached scenery passed';
 }));
};
