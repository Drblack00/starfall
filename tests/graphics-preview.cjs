// Builds an untracked browser QA page. Open /graphics-qa.html via the supported
// preview, use PLAY > LAUNCH normally, then Run transition checks.
// This is deterministic fixture testing, not a physical device/performance test.
const fs=require('fs'),vm=require('vm'),assert=require('assert'),crypto=require('crypto');
let source=fs.readFileSync('index.html','utf8');
for(const m of source.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g))if(m[1].includes('(function'))new vm.Script(m[1]);
const lock=JSON.parse(fs.readFileSync('tests/balance-lock.json','utf8'));
for(const [kind,entries] of Object.entries({function:lock.functions,var:lock.declarations}))for(const [name,hash] of Object.entries(entries)){
 const start=source.indexOf('      '+(kind==='function'?'function '+name+'(':'var '+name+' ='));
 const end=kind==='function'?source.indexOf('\n      }',start)+8:source.indexOf(';\n',start)+1;
 assert.equal(crypto.createHash('sha256').update(source.slice(start,end)).digest('hex'),hash,name);
}
console.log('PASS: JS parsing and frozen combat/economy hashes');
const injected=`
(function(){
 var panel=document.createElement('div');panel.style='position:fixed;left:0;top:0;z-index:100000;background:#fff;color:#000;width:340px;padding:8px;font:12px monospace';
 var button=document.createElement('button');button.textContent='Run transition checks';panel.appendChild(button);
 var output=document.createElement('pre');output.style='white-space:pre-wrap';panel.appendChild(output);document.body.appendChild(panel);
 var entered=false;document.getElementById('btn-lc-go').addEventListener('click',function(){entered=true;});
 button.onclick=function(){try{
  if(!entered)throw Error('Use PLAY > LAUNCH before checks');
  var results=[],oldReduced=REDUCED,oldFlash=SETTINGS.flash;
  function check(v,m){if(!v)throw Error(m);}
  for(var reduced of [false,true])for(var skip of [false,true]){
   REDUCED=reduced;SETTINGS.flash=!skip;startRun(1);startSector(1);G.player.invuln=999;
   // A completed-wave fixture enters the shipping result/repair/warp path.
   G.player.hp=1;G.bombs=0;finishWave();
   check(G.waveState==='warp','Result did not enter warp');
   var hp=G.player.hp,bombs=G.bombs,previous=0,peak=0,frames=0;
   if(skip)canvas.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true}));
   while(G.waveState==='warp'&&frames++<240){update(1/60);render();check(VisualFX.travel()>=previous,'Star travel reversed');previous=VisualFX.travel();peak=Math.max(peak,G.warpW);check(!G.player.beamOn,'Weapon active in warp');}
   check(G.sector===2,'Wrong destination');check(G.player.hp===hp&&G.bombs===bombs,'Duplicate resupply');
   check(reduced?peak===0:skip||peak>.9,'Motion envelope');
   for(var i=0;i<60;i++){update(1/60);render();}
   check(G.warpW===0&&G.warpShake===0,'Stale transition after arrival');
   results.push({reduced:reduced,skip:skip,flash:SETTINGS.flash,frames:frames,sector:G.sector,travel:previous,peak:peak});
  }
  REDUCED=oldReduced;SETTINGS.flash=oldFlash;output.textContent='PASS\\n'+JSON.stringify({renderer:SF3D.metrics.mode,scenarios:results},null,2);
 }catch(e){output.textContent='FAIL '+e.stack;}};
})();
`;
const end=source.lastIndexOf('})();');source=source.slice(0,end)+injected+source.slice(end);
fs.mkdirSync('dist',{recursive:true});fs.writeFileSync('dist/graphics-qa.html',source);
fs.copyFileSync('index.html','dist/index.html');
console.log('QA fixture written to dist/graphics-qa.html (not a shipping entry point)');
