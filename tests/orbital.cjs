// Original meshes, baked contact shading, native index paths and uncluttered phone UI.
const fs=require('fs'),crypto=require('crypto');
module.exports=async function verifyOrbital(browser,source){
 const meta=JSON.parse(source.match(/<script type="application\/json" id="orbital-meshes">(.*?)<\/script>/s)[1]);
 const lock=JSON.parse(fs.readFileSync('tests/orbital-mesh-lock.json','utf8'));
 const check=(ok,message)=>{if(!ok)throw Error(message)};
 check(crypto.createHash('sha256').update(fs.readFileSync('tools/author-orbital-fleet.py')).digest('hex')===lock.authoringSha256&&meta.authoringSha256===lock.authoringSha256,'Authored source revision');
 check(meta.models.length===24,'Twelve original hulls and twelve matching LODs');
 for(const asset of meta.models){
  const expected=lock.models[asset.key],v=Buffer.from(asset.data,'base64'),i=Buffer.from(asset.indices,'base64');
  check(expected&&crypto.createHash('sha256').update(v).update(i).digest('hex')===expected.sha256,'Actual packed mesh checksum '+asset.key);
  for(const field of ['triangles','vertices','indexBytes','assetId','lod'])check(asset[field]===expected[field],'Authored topology '+asset.key+' '+field);
  check(v.length===asset.vertices*24&&i.length===asset.triangles*3*asset.indexBytes,'Packed buffer lengths '+asset.key);
  for(let n=0;n<i.length;n+=asset.indexBytes)check((asset.indexBytes===4?i.readUInt32LE(n):i.readUInt16LE(n))<asset.vertices,'Mesh index bounds '+asset.key);
  check(asset.bounds.every(row=>row.every(Number.isFinite))&&asset.bounds[1][2]>5,'Actual volumetric hull '+asset.key);
  let shadow=false,open=false;for(let n=0;n<asset.vertices;n++){const ao=asset.offsets[10]+v.readUInt16LE(n*24+20)*asset.steps[10];shadow||=ao<.75;open||=ao>.95;}
  check(shadow&&open,'Nonconstant baked contact occlusion '+asset.key);
  if(!asset.lod){const lod=meta.models.find(m=>m.key===asset.key+':lod');check(lod.assetId===asset.assetId&&lod.triangles<asset.triangles&&lod.indexBytes===2,'Same-design 16-bit LOD '+asset.key);}
 }
 const page=await browser.newPage({viewport:{width:390,height:844}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/orbital-test.html',r=>r.fulfill({body:source.replaceAll('requestAnimationFrame(loop);',''),contentType:'text/html'}));
 await page.goto('http://127.0.0.1:8765/orbital-test.html');
 await page.evaluate(async()=>{await SF3D.ready;render();});
 await page.waitForFunction(()=>document.getElementById('graphics-panel').dataset.state==='ready');
 console.log(await page.evaluate(async()=>{
  const check=(v,m)=>{if(!v)throw Error(m)},w=SF3D;await w.ready;
  check(w.renderer.materialVariants[0]&&w.renderer.materialVariants[1],'Both flight shader bundles are warmed before launch');
  check(OrbitalScenes.complete&&w.renderer.orbitalSky,'Gameplay sky replaced after asynchronous decode');
  const hashes=new Set();for(let sector=1;sector<=5;sector++){
   const sky=spaceBackdrop(sector,false),ctx=sky.getContext('2d'),pixels=ctx.getImageData(0,0,sky.width,sky.height).data;
   let hash=2166136261;for(let n=0;n<pixels.length;n+=132)hash=Math.imul(hash^pixels[n]^pixels[n+1],16777619);hashes.add(hash);
   check(w.renderer.skyTextures[sector]&&spaceBackdrop(sector,false)===sky&&spaceBackdrop(sector,true)===sky,'Shared prewarmed photographic plate across quality modes '+sector);
  }check(hashes.size===5,'Five distinct rendered environment plates');
  // AO must change the actual rendered metal, not merely exist in the payload.
  w.thumbnail('enemy:charger','#ffbb55','#ffbb55',0,0,256);
  const gpu=w.preview,gl=gpu.gl,batch=gpu.batches['enemy:charger'],mesh=batch.source,copy=mesh.vertices.slice(),pixels=new Uint8Array(256*256*4);
  function signature(){gpu.flush(0,false);gl.readPixels(0,0,256,256,gl.RGBA,gl.UNSIGNED_BYTE,pixels);let h=2166136261;for(let n=0;n<pixels.length;n+=4)h=Math.imul(h^pixels[n]^pixels[n+1],16777619);return h;}
  const original=signature();gl.bindBuffer(gl.ARRAY_BUFFER,batch.vertex);for(let n=10;n<copy.length;n+=12)copy[n]=.28;gl.bufferSubData(gl.ARRAY_BUFFER,0,copy);
  check(signature()!==original,'Contact shadow changes rendered pixels');gl.bindBuffer(gl.ARRAY_BUFFER,batch.vertex);gl.bufferSubData(gl.ARRAY_BUFFER,0,mesh.vertices);
  PROFILE.graphics='ultra';startRun(1);G.spawnQueue=[];G.enemies=[];G.player.invuln=10000;
  let uintDraws=0;const g=w.combatGPU,draw=g.drawInstances;g.drawInstances=function(...args){if(args[2]===this.gl.UNSIGNED_INT)uintDraws++;return draw.apply(this,args)};
  try{for(let sector=1;sector<=5;sector++){
   startSector(sector);spawnBoss();G.boss.y=145;G.boss.state='intro';G.boss.introC=3;render();
   const b=g.batches['boss:'+G.boss.kind],small=Math.hypot(b.records[0],b.records[1],b.records[2]);
   G.boss.introC=1.5;render();const middle=Math.hypot(b.records[0],b.records[1],b.records[2]);
   G.boss.introC=0;render();const large=Math.hypot(b.records[0],b.records[1],b.records[2]);
   check(small<middle&&middle<large,'Eased boss approach '+G.boss.kind);G.boss.state='fight';render();
   check(Math.abs(Math.hypot(b.records[0],b.records[1],b.records[2])-large)<.001,'No boss entrance jump '+G.boss.kind);
  }}finally{g.drawInstances=draw;}
  check(uintDraws>0&&g.gl.getError()===0,'Full 32-bit boss geometry renders without GL errors');
  const before=g.batches['boss:eclipse'].records,cb=g.gl.createBuffer,ct=g.gl.createTexture,cp=g.gl.createProgram;let allocations=0;
  g.gl.createProgram=function(){allocations++;return cp.apply(this,arguments)};g.gl.createBuffer=function(){allocations++;return cb.apply(this,arguments)};g.gl.createTexture=function(){allocations++;return ct.apply(this,arguments)};
  try{for(let n=0;n<20;n++){G.time=n/60;G.boss.state='intro';G.boss.introC=3-n/60;render();}}finally{g.gl.createBuffer=cb;g.gl.createTexture=ct;g.gl.createProgram=cp;}
  check(!allocations&&g.batches['boss:eclipse'].records===before,'Entrance reuses GPU buffers, textures and instance pools');
  G.time=0;render();const drift0=g.gl.getUniform(g.skyProgram,g.skyDrift);G.time=12;render();const drift1=g.gl.getUniform(g.skyProgram,g.skyDrift);check(drift0.some((v,i)=>v!==drift1[i]),'Cached sky drifts without repainting');
  startSector(3);spawnBoss();G.boss.state='fight';PROFILE.graphics='auto';render();check(g.batches.arm.source.lod,'Rotating boss arms use prewarmed same-design LODs');
  check(!g.batches['station:5'].count,'Old foreground station does not obscure the approved environment');
  G.boss=null;const enemy=createEnemy('bulwark',210);enemy.y=220;enemy.spawnT=0;G.enemies=[enemy];const normalStrength=[],originalDraw=g.drawInstances;g.drawInstances=function(...args){if(this.gl.getParameter(this.gl.CURRENT_PROGRAM)===this.program&&args[1]===this.batches['enemy:bulwark'].source.count)normalStrength.push(this.gl.getUniform(this.program,this.surface)[2]);return originalDraw.apply(this,args)};PROFILE.graphics='auto';render();const smallPlume=Math.abs(g.batches.exhaust.records[0]);PROFILE.graphics='ultra';render();check(smallPlume>0&&smallPlume<Math.abs(g.batches.exhaust.records[0]),'Adaptive distant engine glow keeps the native flame with less overdraw');g.drawInstances=originalDraw;check(normalStrength[0]===0&&normalStrength.at(-1)>.1,'Adaptive faction material removes subpixel normal noise while Ultra retains full surface detail');
  return 'Orbital: exact authored meshes, contact-shadow pixel response, five cached skies, eased boss groups, 32-bit rendering and stable GPU pools passed';
 }));
 await page.evaluate(()=>{const coach=document.getElementById('coach');coach.classList.add('on');for(const animation of coach.getAnimations())for(const key of animation.effect.getKeyframes()){const matrix=key.transform&&key.transform!=='none'?new DOMMatrix(key.transform):new DOMMatrix();if(Math.abs(matrix.m41)>.01)throw Error('Bottom tutorial uses the old centred animation');}});
 // Phone controls stay large enough to tap without covering the combat centre.
 for(const width of [320,375,430]){
  await page.setViewportSize({width,height:width===320?640:844});
  await page.evaluate(()=>{finishOnboarding();render();const stage=document.getElementById('stage').getBoundingClientRect(),buttons=['btn-pause','btn-ultimate','btn-formation','btn-bomb'].map(id=>document.getElementById(id)).filter(Boolean);
   for(const button of buttons){const r=button.getBoundingClientRect();if(r.width<43||r.height<43||r.left<stage.left-1||r.right>stage.right+1)throw Error('Compact HUD touch target '+button.id);}
   const bar=document.getElementById('bossbar').getBoundingClientRect();if(bar.left<stage.left||bar.right>stage.right||bar.width<stage.width*.8)throw Error('Boss HUD is clipped at phone size');
   if(getComputedStyle(document.getElementById('coach')).display!=='none')throw Error('Dismissed tutorial is visible');
  });
 }
 check(!errors.length,errors.join('\n'));await page.close();
 const legacy=await browser.newPage({reducedMotion:'reduce'});
 await legacy.addInitScript(()=>{const get=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(type,...args){if(type==='webgl2')return null;const gl=get.call(this,type,...args);if(gl&&type==='webgl'){const ext=gl.getExtension.bind(gl);gl.getExtension=name=>name==='OES_element_index_uint'?null:ext(name);}return gl;};});
 await legacy.route('**/orbital-test.html',r=>r.fulfill({body:source.replaceAll('requestAnimationFrame(loop);',''),contentType:'text/html'}));
 await legacy.goto('http://127.0.0.1:8765/orbital-test.html');await legacy.evaluate(async()=>{await SF3D.ready;render();});await legacy.waitForFunction(()=>document.getElementById('graphics-panel').dataset.state==='ready');
 await legacy.evaluate(()=>{PROFILE.graphics='ultra';startRun(1);for(const sector of [1,2,4]){startSector(sector);spawnBoss();G.boss.state='fight';G.boss.y=145;render();const g=SF3D.combatGPU,b=g.batches['boss:'+G.boss.kind];if(!g.legacy||g.uintIndices||!b.source.lod||b.source.index32||g.gl.getError())throw Error('WebGL1 without uint indices did not use the same-design 16-bit boss LOD');}if(!SF3D.metrics.nativePlayer)throw Error('16-bit fallback lost native player');const g=SF3D.combatGPU;if(g.gl.getUniform(g.skyProgram,g.skyDrift).some(v=>v!==0))throw Error('Reduced-motion sky drifts');const coach=document.getElementById('coach');coach.classList.add('on');if(coach.getAnimations().length)throw Error('Reduced-motion tutorial animates');});
 await legacy.close();console.log('Orbital: WebGL1 without 32-bit index extension retains native 3D with prewarmed same-design LODs');
};
