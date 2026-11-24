// Non-shipping phone-size comparison fixtures. Use the real PLAY/LAUNCH handlers
// before selecting deterministic scenes. Captures are not physical iPhone tests.
const fs=require('fs'),cp=require('child_process'),assert=require('assert'),crypto=require('crypto');
const before=cp.execFileSync('git',['show','4d97b885ef061321061b7513c8bddd42c6bc8219:index.html'],{encoding:'utf8',maxBuffer:10e6}),after=fs.readFileSync('index.html','utf8');
for(const id of ['fleet-assets','combat-assets','nitro-asset']){
 const re=new RegExp('<script[^>]*id="'+id+'"[^>]*>([\\s\\S]*?)</script>');const a=before.match(re),b=after.match(re);assert(a && b,id+' model data missing');assert.equal(a[1],b[1],id+' model data changed');
}
console.log('PASS: embedded fleet/combat model data unchanged');
const hook=`
var qaEntered=false;
document.getElementById('btn-lc-go').addEventListener('click',function(){qaEntered=true;});
window.addEventListener('message',async function(ev){if(ev.origin!==location.origin||!ev.data.qa)return;
try{var scene=ev.data.qa;if(scene==='home'){showScreen('start');render();return;}
if(!qaEntered)throw Error('Use PLAY and LAUNCH in each frame first');
REDUCED=scene==='reduced';SETTINGS.flash=scene!=='no-flash';startRun(1);startSector(scene==='sector2'?2:1);G.player.invuln=999;G.time=20;G.spawnQueue=[];G.portals=[];G.enemies=[];G.bullets=[];G.ebullets=[];finishOnboarding();
if(scene==='boss'){spawnBoss();G.boss.state='fight';G.boss.introC=0;G.boss.y=150;}
else if(!['warp','skip','reduced','no-flash'].includes(scene)){for(var i=0;i<3;i++){var e=createEnemy(['diver','lancer','bulwark'][i],100+i*105);e.y=200+i*55;e.spawnT=0;G.enemies.push(e);}emitBullets(G.player.x,450,0,-600,2,'player','#62d5ff',2.4);emitEbullets(200,260,0,150,4,false);G.portals=[{x:130,y:42,t:.24,dur:.5}];}
if(['warp','skip','reduced','no-flash'].includes(scene)){finishWave();if(scene==='skip')canvas.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true}));for(var i=0;i<85;i++){update(1/60);render();} }
render();syncHud();var gpu=SF3D.renderer,info={scene:scene,renderer:SF3D.metrics.mode,sector:G.sector};
if(gpu)info.gpuError=gpu.gl.getError();
var status=document.getElementById('qa-status');if(!status){status=document.createElement('div');status.id='qa-status';status.style='position:fixed;bottom:0;left:0;z-index:99999;background:#fff;color:#000;font:10px monospace';document.body.appendChild(status);}status.textContent=JSON.stringify(info);
}catch(e){document.body.insertAdjacentHTML('beforeend','<pre>'+e.stack+'</pre>');}});
`;
for(const [name,source] of [['before',before],['after',after]]){
 let s=source.replaceAll('requestAnimationFrame(loop);','');const end=s.lastIndexOf('})();');s=s.slice(0,end)+hook+s.slice(end);fs.writeFileSync('dist/round2-'+name+'.html',s);
}
fs.writeFileSync('dist/round2-compare.html',`<!doctype html><meta charset="utf-8"><title>Starfall phone-size regression comparison</title><style>body{background:#101722;color:white;font:14px sans-serif;margin:8px}button{margin:3px;padding:8px}iframe{width:390px;height:844px;border:1px solid #63778c}main{display:flex;gap:12px}</style><p>390 × 844 CSS pixels · deterministic fixtures · use PLAY → LAUNCH in each frame first</p><div>${['home','sector1','sector2','boss','warp','skip','reduced','no-flash'].map(x=>'<button>'+x+'</button>').join('')}</div><main><section>BEFORE — PR18 first pass<br><iframe title="Before" src="round2-before.html"></iframe></section><section>AFTER — second pass<br><iframe title="After" src="round2-after.html"></iframe></section></main><script>document.querySelectorAll('button').forEach(b=>b.onclick=()=>document.querySelectorAll('iframe').forEach(f=>f.contentWindow.postMessage({qa:b.textContent},location.origin)))</script>`);
