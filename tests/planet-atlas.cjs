const fs=require('fs'),vm=require('vm'),assert=require('assert');
const source=fs.readFileSync('tools/planet-atlas-source.js','utf8');
let data;const ctx={createImageData:(w,h)=>({data:new Uint8ClampedArray(w*h*4)}),putImageData:im=>{data=im.data;}};
const box={document:{createElement:()=>({getContext:()=>ctx})},Math,Uint8ClampedArray};vm.createContext(box);vm.runInContext(source,box);
const start=performance.now(),atlas=box.planetAtlas(),ms=performance.now()-start;
assert.strictEqual(atlas,box.planetAtlas(),'Atlas should be cached');
let min=255,max=0,seam=0;
for(let y=0;y<256;y++)for(let c=0;c<3;c++)seam=Math.max(seam,Math.abs(data[(y*512)*4+c]-data[(y*512+511)*4+c]));
for(let i=0;i<data.length;i+=4){min=Math.min(min,data[i]);max=Math.max(max,data[i]);}
assert(seam<=1,'Longitude seam');assert(max-min>100,'Terrain lacks contrast');
console.log(JSON.stringify({cached:true,width:atlas.width,height:atlas.height,maxSeamDelta:seam,terrainRange:[min,max],buildMilliseconds:ms.toFixed(1),note:'Node CPU generation only; not mobile performance'}));

if(process.argv.includes("--write-rgba"))fs.writeFileSync("planet-atlas.rgba",data);
