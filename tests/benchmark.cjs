// Seeded 600-frame sample after 120 warm-up frames; serve the repo on port 8765.
const { chromium } = require("playwright");
const fs = require("fs");
(async () => {
  for (const file of process.argv.length > 2
    ? process.argv.slice(2)
    : ["index.html"]) {
    let b = await chromium.launch({
      headless: true,
      ...(process.env.CHROMIUM_PATH
        ? { executablePath: process.env.CHROMIUM_PATH }
        : {}),
      args: ["--no-sandbox"],
    });
    let p = await b.newPage({ viewport: { width: 900, height: 900 } });
    if(process.env.STARFALL_WEBGL1==="1")await p.addInitScript(()=>{
      const old=HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext=function(type,...args){return type==="webgl2"?null:old.call(this,type,...args)};
    });
    await p.addInitScript(() => {
      let seed = 123456;
      Math.random = () =>
        (seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296;
    });
    let src = fs
      .readFileSync(file, "utf8")
      .replaceAll("requestAnimationFrame(loop);", "");
    let end = src.lastIndexOf("})();");
    src =
      src.slice(0, end) +
      `window.t={get g(){return G},startRun,startSector,spawnBoss,update,render,explode,createEnemy};` +
      src.slice(end);
    await p.route("**/test.html", (r) =>
      r.fulfill({ body: src, contentType: "text/html" }),
    );
    await p.goto("http://127.0.0.1:8765/test.html");
    console.log(
      file,
      await p.evaluate(async ({visualShip,crowd}) => {
        if(typeof SF3D!=="undefined")await SF3D.ready;
        t.startRun(1);
        t.startSector(5);
        t.spawnBoss();
        let g = t.g;
        if(visualShip)g.player.ship=visualShip;
        g.spawnQueue = [];
        g.waveState = "boss";
        g.boss.state = "fight";
        g.boss.y = 138;
        g.boss.hp = g.boss.maxHp = 100000;
        g.player.invuln = 100000;
        g.player.weapon = 5;
        g.player.drones = 3;
        if(crowd){for(let i=0;i<12;i++){const enemy=t.createEnemy(['diver','weaver','charger','sentinel','lancer','bulwark'][i%6],40+i%4*100);enemy.y=140+Math.floor(i/4)*70;enemy.hp=100000;enemy.spawnT=0;g.enemies.push(enemy)}}
        let work = [],
          raf = [],
          last;
        await new Promise((done) => {
          let n = 0;
          function step(now) {
            let begin = performance.now();
            if (n % 60 === 0) t.explode(200, 300, "#ffb02e", 80, true);
            t.update(1 / 60);
            if(crowd)for(let i=0;i<g.enemies.length;i++){g.enemies[i].x=40+i%4*100;g.enemies[i].y=140+Math.floor(i/4)*70;}
            t.render();
            if (n >= 120) {
              work.push(performance.now() - begin);
              raf.push(now - last);
            }
            last = now;
            if (++n < 720) requestAnimationFrame(step);
            else done();
          }
          requestAnimationFrame(step);
        });
        function stats(a) {
          a.sort((a, b) => a - b);
          return {
            median: +a[a.length >> 1].toFixed(2),
            p95: +a[Math.floor(a.length * 0.95)].toFixed(2),
            max: +a.at(-1).toFixed(2),
          };
        }
        return {
          workMs: stats(work),
          rafMs: stats(raf),
          samples: work.length,
          freeParts: g.partsPool?.length,
          graphics: typeof SF3D !== "undefined" ? {mode:SF3D.metrics.mode,resolution:SF3D.metrics.resolution,draws:SF3D.metrics.draws,instances:SF3D.metrics.instances,backgroundWidth:SF3D.metrics.backgroundWidth,combatWidth:SF3D.metrics.combatWidth,playerWidth:SF3D.metrics.playerWidth,nativePlayer:SF3D.metrics.nativePlayer,ship:g.player.ship} : {mode:"canvas2d"},
        };
      },{visualShip:process.env.STARFALL_SHIP||null,crowd:process.env.STARFALL_CROWD==="1"}),
    );
    await b.close();
  }
})();
