// Run with the repository served at http://127.0.0.1:8765. Requires Playwright.
const { chromium } = require("playwright");
const fs = require("fs");
const crypto = require("crypto");
const balanceLock = JSON.parse(
  fs.readFileSync("tests/balance-lock.json", "utf8"),
);
const shippingSource = fs.readFileSync("index.html", "utf8");
for (const [kind, entries] of Object.entries({
  function: balanceLock.functions,
  var: balanceLock.declarations,
})) {
  for (const [name, expected] of Object.entries(entries)) {
    const prefix =
      "      " +
      (kind === "function" ? "function " + name + "(" : "var " + name + " =");
    const begin = shippingSource.indexOf(prefix);
    if (begin < 0) throw Error("Missing frozen balance block: " + name);
    const end =
      kind === "function"
        ? shippingSource.indexOf("\n      }", begin) + 8
        : shippingSource.indexOf(";\n", begin) + 1;
    const actual = crypto
      .createHash("sha256")
      .update(shippingSource.slice(begin, end))
      .digest("hex");
    if (actual !== expected)
      throw Error("Frozen gameplay block changed: " + name);
  }
}
console.log(
  "Frozen balance: 34 combat/economy functions and 8 data blocks match main.",
);
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
    `window.t={get g(){return G},startRun,startSector,spawnBoss,update,render,renderLegacy2D,emitBullets,emitParts,emitEbullets,resolveBombHit,updateBoss,createEnemy,killEnemy,showScreen,drawShipModel,drawShip,paintShipCanvas,SF3D,LOADOUT,SHIP_ART,Input,explode,openLaunchConfirm,hideLaunchConfirm,stationSprite,enemyMaterial,bossArmorSprite,equipmentSprite,getDroneSprite,MATERIAL_CACHE,playerBoltSprite};` +
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
      g = reset();
      t.explode(200, 250, "#ffb02e", 16, true);
      ok(
        g.parts.some((p) => p.bloom && p.t < 0),
        "Explosion afterglow is a delayed pooled particle",
      );
      for (let i = 0; i < 120; i++) t.update(1 / 60);
      t.emitParts(1, 2, 0, 0, 1, 0, "blue", 1, 0);
      ok(!g.parts.at(-1).bloom, "Recycled particles clear the new bloom flag");

      // Verify the actual home and flight call paths share the same cached hull.
      const originalThumbnail = t.SF3D.thumbnail;
      t.SF3D.thumbnail = () => null;
      const originalSprite = getShipSprite,
        usedSprites = [];
      getShipSprite = function (...args) {
        const sprite = originalSprite(...args);
        usedSprites.push(sprite);
        return sprite;
      };
      const previewCanvas = document.createElement("canvas");
      previewCanvas.style.cssText = "position:absolute;width:80px;height:86px";
      document.body.append(previewCanvas);
      const selectedShip = t.LOADOUT.ship;
      for (const ship of Object.keys(t.SHIP_ART)) {
        t.LOADOUT.ship = ship;
        g.player.ship = ship;
        g.time = 1;
        usedSprites.length = 0;
        t.paintShipCanvas(previewCanvas, 1, 0.5);
        t.drawShip(200, 400, g.player);
        ok(
          usedSprites.length === 2 && usedSprites[0] === usedSprites[1],
          ship + " home and flight share the exact cached hull",
        );
      }
      t.LOADOUT.ship = selectedShip;
      previewCanvas.remove();
      getShipSprite = originalSprite;
      t.SF3D.thumbnail = originalThumbnail;
      // Every new render path is cached, stable after warm-up, and visually distinct.
      const fingerprints = new Set();
      for (let sector = 1; sector <= 5; sector++) {
        const station = t.stationSprite(sector);
        ok(
          station === t.stationSprite(sector),
          "Station " + sector + " reuses its texture",
        );
        fingerprints.add(station.toDataURL());
      }
      ok(fingerprints.size === 5, "Five different orbital environments");
      for (const kind of [
        "diver",
        "charger",
        "weaver",
        "sentinel",
        "lancer",
        "bulwark",
      ])
        ok(
          t.enemyMaterial(kind) === t.enemyMaterial(kind),
          kind + " uses a cached material",
        );
      const bossPrints = new Set();
      for (const kind of [
        "mothership",
        "dreadnought",
        "leviathan",
        "cryowarden",
        "eclipse",
      ]) {
        const armor = t.bossArmorSprite(kind);
        bossPrints.add(armor.toDataURL());
        ok(
          armor === t.bossArmorSprite(kind),
          kind + " armor texture is cached",
        );
      }
      ok(bossPrints.size === 5, "Boss armor geometry stays distinct");
      for (const kind of ["power", "cannon"])
        ok(
          t.equipmentSprite(kind) === t.equipmentSprite(kind),
          kind + " engineering preview is cached",
        );
      const gunPrints = new Set();
      for (const kind of ["gun:pulse", "gun:scatter", "gun:lance"]) {
        const module = t.equipmentSprite(kind);
        gunPrints.add(module.toDataURL());
        ok(
          module === t.equipmentSprite(kind),
          kind + " equipment texture is reused",
        );
      }
      ok(
        gunPrints.size === 3,
        "Cannon previews retain distinct barrel arrangements",
      );
      const bolt = t.playerBoltSprite("#3fd6ff", 2.4, false, false);
      ok(
        bolt === t.playerBoltSprite("#3fd6ff", 2.4, false, false),
        "Laser texture is reused",
      );
      g = reset();
      t.emitBullets(200, -19, 0, -500, 1);
      t.renderLegacy2D();
      const retiredBolt = g.bullets[0];
      ok(
        !!retiredBolt.material,
        "Projectile resolves its texture on first draw",
      );
      t.update(0.033);
      t.update(0.016);
      t.emitBullets(200, 200, 0, 0, 1);
      ok(
        g.bullets[0] === retiredBolt && g.bullets[0].material === null,
        "Pooled projectile clears cached visual state",
      );
      t.render();
      const cacheShape = JSON.stringify(
        Object.keys(t.MATERIAL_CACHE).map(
          (key) => Object.keys(t.MATERIAL_CACHE[key]).length,
        ),
      );
      for (let frame = 0; frame < 60; frame++) t.render();
      ok(
        cacheShape ===
          JSON.stringify(
            Object.keys(t.MATERIAL_CACHE).map(
              (key) => Object.keys(t.MATERIAL_CACHE[key]).length,
            ),
          ),
        "Steady rendering creates no new material-cache entries",
      );
      let kinds = [];
      for (let n = 1; n <= 5; n++) {
        g = reset();
        t.startSector(n);
        t.spawnBoss();
        kinds.push(g.boss.kind);
        ok(
          document.getElementById("bossbar").dataset.kind === g.boss.kind,
          g.boss.kind + " has its own HUD signature",
        );
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
  console.log(
    await p.evaluate(async () => {
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
      await new Promise((resolve, reject) => {
        const deadline = performance.now() + 3000;
        function check() {
          if (animation.currentTime >= 30) return resolve();
          if (performance.now() > deadline)
            return reject(Error("Combo animation did not advance"));
          requestAnimationFrame(check);
        }
        requestAnimationFrame(check);
      });
      kill();
      if (
        counter.getAnimations()[0] !== animation ||
        animation.currentTime > 20
      )
        throw Error("Rapid kill did not restart the existing combo animation");
      await animation.finished;
      kill();
      if (animation.playState !== "running" || animation.currentTime > 20)
        throw Error("Kill after completion did not restart combo");
      return "Combo pop restarts during and after animation without allocating another animation";
    }),
  );
  console.log(
    await p.evaluate(async () => {
      t.showScreen("start");
      t.openLaunchConfirm();
      t.hideLaunchConfirm();
      t.openLaunchConfirm();
      await new Promise((resolve) => setTimeout(resolve, 260));
      if (document.getElementById("launch-confirm").hidden)
        throw Error("Stale close timer hid reopened confirmation");
      t.hideLaunchConfirm();
      await new Promise((resolve) => setTimeout(resolve, 260));
      if (!document.getElementById("launch-confirm").hidden)
        throw Error("Confirmation did not finish fading out");
      t.showScreen("loadout");
      t.showScreen("start");
      await new Promise((resolve) => setTimeout(resolve, 260));
      if (
        !document.getElementById("scr-start").classList.contains("on") ||
        document.querySelector(".screen.leaving")
      )
        throw Error("Rapid screen navigation left a stale exit transition");
      return "Confirmation and screen transitions survive rapid navigation";
    }),
  );
  // Browser layout checks at phone widths, including touch-sized controls and safe HUD lanes.
  for (const width of [320, 375, 430]) {
    await p.setViewportSize({ width, height: 812 });
    await p.evaluate(() => t.showScreen("start"));
    await p.waitForTimeout(420);
    await p.evaluate(() => {
      const play = document.getElementById("btn-play").getBoundingClientRect();
      const stage = document.getElementById("stage").getBoundingClientRect();
      if (play.bottom > stage.bottom || play.top < stage.top)
        throw Error("Home Play button requires scrolling");
      for (const selector of [".ref-ship", ".ref-mission", ".ref-shortcuts"]) {
        const rect = document.querySelector(selector).getBoundingClientRect();
        if (
          rect.width < 100 ||
          rect.left < stage.left ||
          rect.right > stage.right
        )
          throw Error("Reference card is clipped");
      }
    });
    await p.evaluate(() => {
      t.showScreen(null);
      const stage = document.getElementById("stage");
      for (const large of [false, true]) {
        stage.classList.toggle("large-text", large);
        const score = document.querySelector(".me-top").getBoundingClientRect();
        const boss = document.getElementById("bossbar").getBoundingClientRect();
        if (score.bottom > boss.top)
          throw Error("Boss bar overlaps score/pause lane");
      }
      stage.classList.remove("large-text");
      for (const id of ["btn-pause", "btn-bomb"]) {
        const rect = document.getElementById(id).getBoundingClientRect();
        if (rect.width < 44 || rect.height < 44)
          throw Error(id + " is too small for touch");
      }
      const name = document.getElementById("bossname"),
        bar = document.getElementById("bossbar");
      if (
        name.scrollWidth > name.clientWidth ||
        bar.getBoundingClientRect().right > innerWidth
      )
        throw Error("Boss HUD clipped at phone width");
    });
    const touch = await p.context().newCDPSession(p);
    const bounds = await p.locator("#game").boundingBox();
    const points = [
      {
        x: bounds.x + bounds.width / 2,
        y: bounds.y + bounds.height * 0.8,
        id: 71,
      },
    ];
    const bombs = await p.evaluate(() => t.g.bombs);
    await touch.send("Input.dispatchTouchEvent", {
      type: "touchStart",
      touchPoints: points,
    });
    if (!(await p.evaluate(() => t.Input.dragging)))
      throw Error("Touch steering did not engage");
    points.push({ x: points[0].x + 20, y: points[0].y, id: 72 });
    await touch.send("Input.dispatchTouchEvent", {
      type: "touchStart",
      touchPoints: points,
    });
    if (bombs > 0 && (await p.evaluate(() => t.g.bombs)) !== bombs - 1)
      throw Error("Two-finger special did not fire");
    await touch.send("Input.dispatchTouchEvent", {
      type: "touchEnd",
      touchPoints: [],
    });
    if (await p.evaluate(() => t.Input.dragging))
      throw Error("Touch steering did not release");
    await touch.detach();
    console.log("Phone HUD and touch checks passed at " + width + "px");
  }
  await require("./webgl.cjs")(b, p, src);
  const reduced = await b.newPage({ viewport: { width: 375, height: 812 } });
  reduced.on("pageerror", (e) => errors.push(e.message));
  await reduced.emulateMedia({ reducedMotion: "reduce" });
  await reduced.route("**/test.html", (r) =>
    r.fulfill({ body: src, contentType: "text/html" }),
  );
  await reduced.goto("http://127.0.0.1:8765/test.html");
  await reduced.evaluate(() => {
    t.startRun(1);
    const enemy = t.createEnemy("diver", 200);
    t.g.enemies.push(enemy);
    t.killEnemy(enemy, t.g.enemies.length - 1);
    if (document.getElementById("hud-combo").getAnimations().length)
      throw Error("Reduced-motion combo animated");
    if (t.g.parts.some((p) => p.bloom))
      throw Error("Reduced-motion explosion added bloom");
    t.openLaunchConfirm();
    t.hideLaunchConfirm();
    if (!document.getElementById("launch-confirm").hidden)
      throw Error("Reduced-motion confirm did not close immediately");
  });
  await reduced.close();
  console.log("Reduced-motion presentation checks passed");
  if (errors.length) throw Error(errors.join("\n"));
  console.log("No browser runtime errors");
  await b.close();
})();
