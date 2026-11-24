// Source-fidelity, actual physical shading, full-size textures and bounded GPU storage.
const fs=require('fs');
module.exports=async function verifyPBR(browser){
 const page=await browser.newPage({viewport:{width:390,height:844}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:8765/index.html');
 await page.waitForFunction(()=>document.getElementById('graphics-panel').dataset.state==='ready');
 const lock=JSON.parse(fs.readFileSync('tests/graphics-source-lock.json','utf8'));
 console.log(await page.evaluate(async lock=>{
  const w=SF3D,check=(v,msg)=>{if(!v)throw Error(msg);};await w.ready;
  check(w.fleet.sourceRevision===lock.sourceRevision,'Source revision changed');
  for(const asset of w.fleet.models){const expected=lock.fleet[asset.ship];
   for(const key of ['sha256','triangles','vertices'])check(asset[key]===expected[key],'Source fleet fidelity: '+asset.ship+' '+key);
   const mesh=w.getGeometry('ship:'+asset.ship);check(mesh.image.naturalWidth===expected.textureSize[0]&&mesh.image.naturalHeight===expected.textureSize[1],'Original texture resolution '+asset.ship);
  }
  for(const key in lock.drones){const asset=w.combat.models.find(m=>m.key===key),expected=lock.drones[key];
   for(const field in expected)check(asset[field]===expected[field],'Source drone fidelity '+key+' '+field);
  }
  for(const key in lock.faction){const mesh=w.getGeometry(key),expected=lock.faction[key];check(mesh.count===expected.indices&&mesh.uniqueVertices===expected.vertices&&mesh.pbr,'Detailed faction geometry '+key);}
  const maps=JSON.parse(document.getElementById('pbr-assets').textContent);check(maps.resolution===1024&&maps.environmentLevels===8,'PBR material atlas resolution');
  for(const name of ['normal','orm','environment']){
   const image=new Image();image.src=maps[name];await image.decode();const cv=document.createElement('canvas');cv.width=image.naturalWidth;cv.height=image.naturalHeight;const ctx=cv.getContext('2d');ctx.drawImage(image,0,0);const pixels=ctx.getImageData(0,0,cv.width,cv.height).data;
   const channels=[new Set(),new Set(),new Set(),new Set()];for(let n=0;n<pixels.length;n+=148)for(let c=0;c<4;c++)channels[c].add(pixels[n+c]);
   check(channels[0].size>8&&channels[1].size>8,'Nonconstant real material data '+name);
   if(name==='environment')check(image.naturalWidth===256&&image.naturalHeight===1024&&channels[3].size>8,'Eight real RGBM radiance levels');
   cv.width=cv.height=1;
  }
  const gpu=w.preview,gl=gpu.gl;
  check(gl.getUniform(gpu.program,gl.getUniformLocation(gpu.program,'uHullNormal'))===2&&gl.getUniform(gpu.program,gl.getUniformLocation(gpu.program,'uSurfaceORM'))===3&&gl.getUniform(gpu.program,gl.getUniformLocation(gpu.program,'uEnvironment'))===4,'PBR samplers are bound independently');
  // A material parameter must actually alter rendered pixels, not just metadata.
  w.thumbnail('drone:scout','#8ae7ff','#8ae7ff',0,0,320);
  const batch=gpu.batches['drone:scout'],rough=batch.surface[1],pixels=new Uint8Array(320*320*4);
  function signature(value){batch.surface[1]=value;gpu.flush(0,false);gl.readPixels(0,0,320,320,gl.RGBA,gl.UNSIGNED_BYTE,pixels);let hash=2166136261;for(let n=0;n<pixels.length;n+=4)hash=Math.imul(hash^pixels[n]^pixels[n+1]^pixels[n+2],16777619);return hash;}
  check(signature(.18)!==signature(.8),'Roughness changes actual reflection highlights');batch.surface[1]=rough;
  for(const asset of w.fleet.models)w.thumbnail(asset.ship,'#d5bf8c','#8ae7ff',0,0,160);
  check(gpu.textureBytes<=80*1024*1024,'2K texture browsing exceeds the bounded GPU working set');
  w.thumbnail('vanguard','#d5bf8c','#8ae7ff',0,0,160);
  const before=gpu.batches['ship:vanguard'],texture=before.texture,normal=gpu.hullNormal,orm=gpu.surfaceORM,env=gpu.environmentTexture,records=before.records;
  let buffers=0,textures=0;const createBuffer=gl.createBuffer,createTexture=gl.createTexture;
  gl.createBuffer=function(){buffers++;return createBuffer.apply(this,arguments)};gl.createTexture=function(){textures++;return createTexture.apply(this,arguments)};
  try{for(let n=0;n<20;n++)w.thumbnail('vanguard','#d5bf8c','#8ae7ff',n*.016,0,160);}finally{gl.createBuffer=createBuffer;gl.createTexture=createTexture;}
  check(!buffers&&!textures&&before.records===records&&before.texture===texture&&gpu.hullNormal===normal&&gpu.surfaceORM===orm&&gpu.environmentTexture===env,'Steady PBR rendering reallocates GPU resources');
  // Gameplay detail switches use prewarmed VAOs and the exact same instance pool.
  startRun(1);G.spawnQueue=[];G.enemies=[];G.player.invuln=10000;
  const enemy=createEnemy('weaver',210);enemy.y=200;enemy.spawnT=0;G.enemies.push(enemy);
  PROFILE.graphics='ultra';render();const combat=w.renderer,enemyBatch=combat.batches['enemy:weaver'],storage=enemyBatch.records;
  check(!enemyBatch.source.lod&&enemyBatch.source===w.getGeometry('enemy:weaver'),'Ultra retains the full authored enemy mesh');
  PROFILE.graphics='auto';render();
  check(enemyBatch.source.lod&&enemyBatch.source.assetId===w.getGeometry('enemy:weaver').assetId&&enemyBatch.source.count<w.getGeometry('enemy:weaver').count,'Smooth derives detail from the same faction model');
  const cg=combat.gl,cb=cg.createBuffer,ct=cg.createTexture;let switches=0;
  cg.createBuffer=function(){switches++;return cb.apply(this,arguments)};cg.createTexture=function(){switches++;return ct.apply(this,arguments)};
  try{for(let n=0;n<12;n++){PROFILE.graphics=n%2?'auto':'ultra';render();}}finally{cg.createBuffer=cb;cg.createTexture=ct;}
  check(!switches&&enemyBatch.records===storage,'Gameplay LOD switching reallocates GPU buffers or textures');
  PROFILE.graphics='ultra';render();
  check(cg.getError()===cg.NO_ERROR,'Adaptive material/geometry GL errors');
  check(gl.getError()===gl.NO_ERROR,'PBR GL errors');
  return 'PBR: exact source meshes, original 2K textures, real normal/ORM/RGBM maps, visible roughness response, bounded GPU texture cache, prewarmed gameplay LODs and zero steady GPU allocations passed';
 },lock));
 if(errors.length)throw Error(errors.join('\n'));await page.close();
};
