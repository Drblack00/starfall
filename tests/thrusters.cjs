// Pixel/geometry coverage of the shared plume, including WebGL1 and reduced motion.
const assert=require('assert');
module.exports=async function verifyThrusters(browser){
 for(const mode of ['webgl2','webgl1','reduced']){
  const p=await browser.newPage({viewport:{width:390,height:844},reducedMotion:mode==='reduced'?'reduce':'no-preference'}),errors=[];p.on('pageerror',e=>errors.push(e.message));
  if(mode==='webgl1')await p.addInitScript(()=>{const old=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(type,...args){return type==='webgl2'?null:old.call(this,type,...args)}});
  await p.goto('http://127.0.0.1:8765');await p.waitForFunction(()=>document.getElementById('graphics-panel').dataset.state==='ready');
  console.log(await p.evaluate(mode=>{
   const w=SF3D,check=(v,msg)=>{if(!v)throw Error(msg)},mesh=w.getGeometry('exhaust');check(mesh.count===18,'Bounded six-triangle plume');check(mesh.vertices.every(Number.isFinite),'Finite plume vertices');
   for(let n=0;n<mesh.vertices.length;n+=12)check(mesh.vertices[n+10]>=0&&mesh.vertices[n+10]<=1&&mesh.vertices[n+11]>=0&&mesh.vertices[n+11]<=1,'Normalized plume UVs');
   w.thumbnail('vanguard','#ddf6ff','#77ddff',1,0);const gpu=w.preview,gl=gpu.gl,pixels=new Uint8Array(256*256*4);
   function draw(time,pitch=0){gpu.isPreview=true;gpu.cropWidth=gpu.cropHeight=gpu.offsetX=gpu.offsetY=0;gpu.zoom=1;gpu.begin(256,256,false,1,time);gpu.add('exhaust',210,370,0,52,200,52,0,pitch,0,'#62dfff','#62dfff',1,false);gpu.flush(time,false);gl.readPixels(0,0,256,256,gl.RGBA,gl.UNSIGNED_BYTE,pixels);let hash=2166136261,visible=0,soft=0,head=0,tail=0,colors=new Set();for(let n=0;n<pixels.length;n+=4){const a=pixels[n+3],y=Math.floor(n/4/256);if(a>12){visible++;colors.add(pixels[n]+','+pixels[n+1]+','+pixels[n+2]);}if(a>0&&a<250)soft++;if(y>100&&y<120)head+=a;if(y>10&&y<30)tail+=a;hash=Math.imul(hash^pixels[n]^a,16777619);}return{hash,visible,soft,head,tail,colors:colors.size};}
   const first=draw(1),storage=gpu.batches.exhaust.records;check(first.visible>150&&first.soft>150&&first.colors>20,'Visible plume has soft edges and a thermal gradient');check(first.tail<first.head*.5,'Exhaust tapers and fades toward its tip');
   check(draw(1).hash===first.hash,'Frozen clock preserves the plume');const moved=draw(1.3);check(mode==='reduced'?moved.hash===first.hash:moved.hash!==first.hash,'Reduced motion freezes animated flow');check(draw(1,.9).visible>100,'Plume remains visible during tilt');check(gpu.batches.exhaust.records===storage,'Instance storage reused');check(gl.getError()===gl.NO_ERROR,'No plume GPU errors');
   w.thumbnail('vanguard','#ddf6ff','#77ddff',1,0,256);check(w.preview.batches.exhaust.source===mesh,'Home ship uses shared plume geometry');gl.readPixels(0,0,256,1,gl.RGBA,gl.UNSIGNED_BYTE,pixels.subarray(0,256*4));check(pixels.subarray(0,256*4).every((v,n)=>n%4!==3||v<16),'Default ship preview does not cut off bright exhaust at the bottom');w.thumbnail('drone:guardian','#8ae7ff','#8ae7ff',1,0);check(w.preview.batches.exhaust.source===mesh,'Drone uses shared plume geometry');return 'Thrusters '+mode+': thermal gradient, soft taper, animation/freeze, tilt and pooled geometry passed';
  },mode));assert.deepStrictEqual(errors,[]);await p.close();
 }
};
if(require.main===module){const{chromium}=require('playwright');(async()=>{const b=await chromium.launch({executablePath:process.env.CHROMIUM_PATH,args:['--no-sandbox']});try{await module.exports(b)}finally{await b.close()}})().catch(e=>{console.error(e);process.exitCode=1});}
