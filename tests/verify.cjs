// Run with the repository served at http://127.0.0.1:8765. Requires Playwright.
const { chromium } = require("playwright");
const fs = require("fs");
(async () => {
  const b = await chromium.launch({
    headless: true,
    ...(process.env.CHROMIUM_PATH
      ? { executablePath: process.env.CHROMIUM_PATH }
      : {}),
    args: ["--no-sandbox"],
  });
  const p = await b.newPage();
  let errors = [];
  p.on("pageerror", (e) => errors.push(e.message));
  let src = fs
    .readFileSync("index.html", "utf8")
    .replaceAll("requestAnimationFrame(loop);", "");
  const end = src.lastIndexOf("})();");
  src =
    src.slice(0, end) +
    `window.t={get g(){return G},startRun,startSector,spawnBoss,update,render,emitBullets,emitParts,emitEbullets,resolveBombHit,updateBoss,createEnemy,killEnemy,showScreen,drawShipModel};` +
    src.slice(end);
  await p.route("**/test.html", (r) =>
    r.fulfill({ body: src, contentType: "text/html" }),
  );
  await p.goto("http://127.0.0.1:8765/test.html");
  console.log(
    await p.evaluate(() => {
      let checks = [];
      function ok(v, n) {
        if (!v) throw Error(n);
        checks.push(n);
      }
      function reset() {
        t.startRun(1);
        let g = t.g;
        g.waveState = "idle";
        g.spawnQueue = [];
        g.enemies = [];
        g.bullets = [];
        g.ebullets = [];
        g.player.fireT = 999;
        g.player.drones = 0;
        g.player.invuln = 0;
        g.player.shield = false;
        return g;
      }
      let g = reset();
      let e = t.createEnemy("diver", 200);
      Object.assign(e, { x: 200, y: 300, hp: 100, vy: 0, amp: 0 });
      g.enemies = [e];
      t.emitBullets(200, 340, 0, -3000, 1);
      t.update(0.033);
      ok(e.hp === 99, "fast projectile sweeps through enemy");
      g = reset();
      e = t.createEnemy("diver", 200);
      Object.assign(e, { x: 200, y: 300, hp: 100, vy: 0, amp: 0 });
      g.enemies = [e];
      t.emitBullets(
        200,
        300,
        0,
        0,
        1,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        1,
        true,
        true,
        false,
      );
      t.emitBullets(
        200,
        300,
        0,
        0,
        1,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        2,
        true,
        true,
        false,
      );
      t.update(0.016);
      t.update(0.016);
      ok(e.hp === 98, "overlapping piercing bolts each hit once");
      g = reset();
      t.emitEbullets(g.player.x, g.player.y + 50, 0, -4000, 5);
      let hp = g.player.hp;
      t.update(0.025);
      ok(g.player.hp === hp - 1, "enemy projectile swept player collision");
      g = reset();
      t.emitEbullets(50, -10, 0, -1000, 5, 1);
      let old = g.ebullets[0],
        gen = old.generation;
      t.update(0.033);
      t.update(0.016);
      t.emitEbullets(100, 100, 0, 0, 5);
      ok(g.ebullets[0] === old && !old.cryo, "pool resets cryo flag");
      t.resolveBombHit({ kind: "eb", ref: old, generation: gen });
      ok(
        g.ebullets.length === 1,
        "stale bomb reference cannot hit recycled bullet",
      );
      for (let n = 1; n <= 5; n++) {
        g = reset();
        t.startSector(n);
        t.spawnBoss();
        let boss = g.boss;
        boss.state = "fight";
        boss.y = 130;
        boss.telegraph = 1;
        g.player.x = g.player.tx = boss.x;
        g.player.y = g.player.ty = boss.y;
        hp = g.player.hp;
        t.updateBoss(0.016);
        ok(g.player.hp === hp - 1, boss.kind + " wind-up contact");
      }
      g = reset();
      t.emitParts(1, 2, 0, 0, 0.001, 0, "red", 1, 0, true, 4, 2, true);
      t.update(0.016);
      t.update(0.016);
      t.emitParts(1, 2, 0, 0, 1, 0, "blue", 1, 0);
      ok(
        !g.parts.at(-1).ring && !g.parts.at(-1).spark,
        "pool resets particle flags",
      );
      g = reset();
      e = t.createEnemy("lancer", 200);
      Object.assign(e, {
        x: 200,
        y: 42,
        cx: 200,
        phase: Math.PI / 2,
        amp: 100,
        t: 0,
      });
      g.enemies = [e];
      t.update(0.016);
      ok(Math.abs(e.x - 200) < 20, "Lancer eases out of its spawn portal");
      let kinds = [];
      for (let n = 1; n <= 5; n++) {
        g = reset();
        t.startSector(n);
        t.spawnBoss();
        kinds.push(g.boss.kind);
        g.boss.hp = g.boss.maxHp = 100000;
        g.player.invuln = 10000;
        for (let i = 0; i < 1200; i++) t.update(1 / 60);
        ok(
          Number.isFinite(g.boss.x) && Number.isFinite(g.boss.y),
          g.boss.kind + " 20-second simulation",
        );
        t.render();
      }
      ok(new Set(kinds).size === 5, "five distinct boss kinds");
      return checks;
    }),
  );
  console.log(await p.evaluate(async () => {
    t.startRun(1);
    t.g.waveState = "idle";
    const counter = document.getElementById("hud-combo");
    function kill() {
      const enemy = t.createEnemy("diver", 200);
      t.g.enemies.push(enemy);
      t.killEnemy(enemy, t.g.enemies.length - 1);
    }
    kill();
    const animation = counter.getAnimations()[0];
    if (!animation) throw Error("First kill did not animate combo");
    await new Promise(resolve => setTimeout(resolve, 90));
    if (animation.currentTime < 30) throw Error("Combo animation did not advance");
    kill();
    if (counter.getAnimations()[0] !== animation || animation.currentTime > 20)
      throw Error("Rapid kill did not restart the existing combo animation");
    await animation.finished;
    kill();
    if (animation.playState !== "running" || animation.currentTime > 20)
      throw Error("Kill after completion did not restart combo");
    return "Combo pop restarts during and after animation without allocating another animation";
  }));
  if (errors.length) throw Error(errors.join("\n"));
  console.log("No browser runtime errors");
  await b.close();
})();
