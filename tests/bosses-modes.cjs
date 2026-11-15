// Serve on :8765. This exposes systems for tests without changing shipping source.
const { chromium } = require("playwright"),
  fs = require("fs"),
  assert = require("assert");
(async () => {
  const browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH,
    args: ["--no-sandbox"],
  });
  try {
    for (const reduced of [false, true]) {
      const page = await browser.newPage({
          viewport: { width: 375, height: 812 },
          reducedMotion: reduced ? "reduce" : "no-preference",
        }),
        errors = [];
      page.on("pageerror", (e) => errors.push(e.message));
      let src = fs
        .readFileSync("index.html", "utf8")
        .replaceAll("requestAnimationFrame(loop);", "");
      const end = src.lastIndexOf("})();");
      src =
        src.slice(0, end) +
        "window.c={BatchC,LAUNCH,LOADOUT,BOSS_HPS,BOSS_BOUNTY,BOSS_KINDS,SF3D,finishOnboarding,startRun,startSector,spawnBoss,skipBossIntro,shieldCarrierC,saveCheckpoint,bossHitC,checkBossEnrage,updateBoss,update,render,finishWave,killBoss,damagePlayer,fireUltimate,fireCharged,detonateBomb,playerShoot,emitBullets,createEnemy,startEventC,tickEventC,dailyMutator,victory,get g(){return G}};" +
        src.slice(end);
      await page.route("**/modes.html", (r) =>
        r.fulfill({ body: src, contentType: "text/html" }),
      );
      await page.goto("http://127.0.0.1:8765/modes.html");
      console.log(
        await page.evaluate(async (reduced) => {
          await c.SF3D.ready;
          c.finishOnboarding();
          const checks = [];
          function ok(v, m) {
            if (!v) throw Error(m);
            checks.push(m);
          }
          function reset() {
            c.LAUNCH.rush = false;
            c.BatchC.daily = c.BatchC.events = false;
            c.startRun(1);
            let g = c.g;
            g.waveState = "idle";
            g.spawnQueue.length = g.enemies.length = g.bullets.length = 0;
            g.player.fireT = 999;
            return g;
          }
          let g = reset();
          ok(
            !g.mutator && !g.eventMode,
            "standard campaign excludes rules and events",
          );
          const hp = g.player.hp;
          c.LOADOUT.drone="repair";c.BatchC.daily=true;c.startRun(1);let daily=c.g;
          ok(daily.dailyMode&&daily.eventMode&&!!daily.mutator,"daily launch applies exactly one rule and opts into events");
          if(daily.mutator==="drones")ok(daily.player.droneType==="scout"&&daily.player.droneRate===.24,"support loadout receives a working offensive escort");
          c.LOADOUT.drone="scout";g=reset();
          for (let n = 1; n <= 5; n++) {
            c.startSector(n);
            c.spawnBoss();
            let b = g.boss;
            ok(b.introC === 3 && b.state === "intro", "intro starts " + b.kind);
            let health = g.player.hp;
            c.damagePlayer(b.x, b.y);
            ok(g.player.hp === health, "intro blocks damage");
            c.updateBoss(1);
            ok(b.introC === 2, "intro ticks");
            c.skipBossIntro();
            ok(b.state === "fight" && !b.introC, "skip enters fight");
            b.y=160;c.skipBossIntro();ok(b.y===160,"skip leaves a fighting boss in place");
            b.hp = b.maxHp / 2;
            c.checkBossEnrage();
            ok(
              b.phaseC && b.enraged,
              "half HP changes shape and pattern " + b.kind,
            );
            let mul = b.atkMul;
            c.checkBossEnrage();
            ok(mul === b.atkMul, "phase runs once");
            for (let i = 0; i < 11; i++) c.bossHitC(b, 1, true, 0.12);
            ok(b.staggerC === 2, "sustained core fire staggers");
            ok(c.bossHitC(b, 4, true, 0.12) === 6, "stagger bonus applies");
            c.render();
            c.updateBoss(2.1);
            ok(!b.staggerC, "stagger expires");
          }
          g = reset();
          c.spawnBoss();
          c.skipBossIntro();
          let b = g.boss;
          c.bossHitC(b, 1, true, 0.12);
          c.updateBoss(1);
          ok(b.focusC === 0, "interrupted focus decays");
          c.LAUNCH.rush = true;
          c.startRun(1);
          g = c.g;
          ok(
            g.sector === 1 && g.player.hp === 1 && g.player.maxHp === 1,
            "rush starts at first boss with one hull",
          );
          const checkpoint=localStorage.getItem("starfall-checkpoint-v1");c.saveCheckpoint(3);ok(localStorage.getItem("starfall-checkpoint-v1")===checkpoint,"rush cannot resume into campaign checkpoint");
          const kinds = [];
          for (let n = 1; n <= 5; n++) {
            c.spawnBoss();
            kinds.push(g.boss.kind);
            c.skipBossIntro();
            c.killBoss();
            if (n < 5) {
              c.finishWave();
              ok(
                g.sector === n + 1 &&
                  g.player.hp === 1 &&
                  g.spawnQueue.length === 0,
                "rush advances without repair " + n,
              );
            } else {
              g.runTime = 179;
              c.finishWave();
            }
          }
          ok(
            new Set(kinds).size === 5 && g.mode === "win",
            "five unique bosses finish rush",
          );
          ok(
            JSON.parse(localStorage.getItem("starfall-rush-c")).stars === 3,
            "independent timed rush stars",
          );
          g = reset();
          g.mutator = "drones";
          g.player.fireT = 0;
          let bombs = g.bombs;
          c.playerShoot(0.2);
          c.fireCharged(1);
          c.detonateBomb();
          ok(
            !c.fireUltimate() && !g.bullets.length && g.bombs === bombs,
            "drone mission blocks player weapons bomb and ultimate",
          );
          g = reset();
          g.mutator = "glass";
          c.emitBullets(100, 200, 0, -200, 3);
          ok(g.bullets[0].dmg === 6, "glass cannon doubles outgoing shots");
          g.player.invuln = 0;
          g.player.shield = false;
          c.damagePlayer(100, 200);
          ok(!g.player.alive, "glass cannon hull hit is fatal");
          g = reset();
          g.mutator = "gravity";
          let y = g.player.ty;
          c.update(0.016);
          ok(g.player.ty < y, "low gravity lifts target");
          ok(c.dailyMutator() === c.dailyMutator(), "daily rule deterministic");
          g = reset();
          g.player.invuln = 999;
          g.eventMode = true;
          g.waveState = "active";
          g.spawnQueue.push({ t: 999, x: 50, type: "diver" });
          c.update(0);
          c.BatchC.eventT = 17.99;
          c.update(0.02);
          ok(c.BatchC.eventKind === 1, "opt-in event schedules mid wave");
          for (let kind = 1; kind <= 3; kind++) {
            c.startEventC(kind);
            for (let i = 0; i < 60; i++) {
              c.tickEventC(0.016);
              c.render();
            }
            ok(Number.isFinite(c.BatchC.transportX), "finite event " + kind);
            c.tickEventC(8);
            ok(!c.BatchC.eventKind, "event ends " + kind);
          }
          ok(c.BatchC.rescued, "transport survives when protected");
          g = reset();
          let carrier = c.createEnemy("bulwark", 180),
            escort = c.createEnemy("weaver", 60);
          carrier.y = 100;
          escort.y = 140;
          g.enemies.push(carrier, escort);
          let x = escort.x;
          c.update(0.1);
          ok(escort.x > x, "escort moves into carrier screen");
          escort.x=carrier.x;escort.y=carrier.y+42;let carrierHP=carrier.hp,escortHP=escort.hp;
          ok(c.shieldCarrierC(carrier,{dmg:1}),"escort intercepts carrier-bound bolt");
          ok(carrier.hp===carrierHP&&escort.hp===escortHP-(g.dmgMul||1),"interception spends escort hull without changing damage");
          g.enemies.splice(g.enemies.indexOf(escort),1);
          ok(!c.shieldCarrierC(carrier,{dmg:1}),"unescorted carrier takes normal fire");
          ok(JSON.stringify(c.BOSS_HPS)==='{"mothership":720,"dreadnought":860,"leviathan":980,"cryowarden":1120,"eclipse":1320}',"boss HP constants frozen");
          c.render();
          const stores = Object.values(c.SF3D.combatGPU.batches).map(
            (b) => b.records,
          );
          for (let i = 0; i < 60; i++) {
            c.update(0.016);
            c.render();
          }
          ok(
            Object.values(c.SF3D.combatGPU.batches).every(
              (b, i) => b.records === stores[i],
            ),
            "render reuses GPU storage",
          );
          return { reduced, checks };
        }, reduced),
      );
      assert.deepStrictEqual(errors, []);
      await page.close();
    }
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
