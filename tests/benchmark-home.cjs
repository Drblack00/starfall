// Serve on 8765. Measures the real animated page, including all of its schedulers.
const fs=require('fs'),{chromium}=require('playwright');
(async()=>{for(const file of process.argv.slice(2)){
 const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']});
 const page=await browser.newPage({viewport:{width:390,height:844}});
 await page.route('**/home-bench.html',r=>r.fulfill({body:fs.readFileSync(file,'utf8'),contentType:'text/html'}));
 await page.goto('http://127.0.0.1:8765/home-bench.html');await page.waitForFunction(()=>document.getElementById('graphics-panel').dataset.state==='ready');
 const result=await page.evaluate(async()=>{let copies=0;const original=CanvasRenderingContext2D.prototype.drawImage;
 CanvasRenderingContext2D.prototype.drawImage=function(...args){if(['hero-canvas','hangar-canvas','pv-canvas'].includes(this.canvas.id)&&args[0]?._starfallGL)copies++;return original.apply(this,args)};
 let samples=[],n=0,last;await new Promise(done=>{function frame(now){if(n===120)copies=0;if(n>=120&&last)samples.push(now-last);last=now;if(++n<720)requestAnimationFrame(frame);else done()}requestAnimationFrame(frame)});
 CanvasRenderingContext2D.prototype.drawImage=original;samples.sort((a,b)=>a-b);return{samples:samples.length,median:+samples[samples.length>>1].toFixed(1),p95:+samples[Math.floor(samples.length*.95)].toFixed(1),max:+samples.at(-1).toFixed(1),previewCopies:copies};});
 console.log(file,result);await browser.close();
}})();
