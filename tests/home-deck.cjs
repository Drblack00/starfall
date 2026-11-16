// Serve at :8765. Test-only exposure; balance hashing remains against shipped bytes.
const { chromium } = require("playwright"),
  fs = require("fs"),
  assert = require("assert");
(async () => {
  const b = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH,
    args: ["--no-sandbox"],
  });
  try {
    for (const reduced of [false, true]) {
      const p = await b.newPage({
          viewport: { width: 375, height: 812 },
          reducedMotion: reduced ? "reduce" : "no-preference",
        }),
        errors = [];
      p.on("pageerror", (e) => errors.push(e.message));
      const shipped = fs.readFileSync("index.html", "utf8");
      let src = shipped.replaceAll("requestAnimationFrame(loop);", "");
      const end = src.lastIndexOf("})();");
      src =
        src.slice(0, end) +
        "window.d={DeckD,SF3D,CAREER,LAUNCH,BatchC,LOADOUT,BatchB,PROFILE,fillResults,paintDeckResults,startRun,update,render,tickDeckD,enterPhotoD,leavePhotoD,photoCanvasD,capturePhotoD,sharePhotoD,openLaunchConfirm,hideLaunchConfirm,showScreen,tickMenuArt,saveCheckpoint,loadCheckpoint,resumeRun,victory,setLivery,shipColorHex,get g(){return G}};" +
        src.slice(end);
      await p.route("**/deck.html", (r) =>
        r.fulfill({ body: src, contentType: "text/html" }),
      );
      await p.goto("http://127.0.0.1:8765/deck.html");
      await p.evaluate(() => d.SF3D.ready);
      console.log(
        await p.evaluate(async (reduced) => {
          const checks = [];
          function ok(v, n) {
            if (!v) throw Error(n);
            checks.push(n);
          }
          d.startRun(1);
          let g = d.g;
          g.waveState = "idle";
          g.player.invuln = 999;
          const hp = g.player.hp;
          d.tickDeckD(4);
          ok(
            g.ebullets.length === 0 && hp === g.player.hp,
            "Campaign has no NG+ pattern or hull changes",
          );
          d.DeckD.ngArmed = true;
          d.CAREER.victories = 0;
          d.startRun(1);
          ok(!d.DeckD.ng, "NG+ locked before campaign clear");
          d.CAREER.victories = 1;
          d.DeckD.ngArmed = true;
          d.startRun(1);
          g = d.g;
          g.waveState = "active";
          d.tickDeckD(3);
          ok(
            d.DeckD.ng && g.ebullets.length === 2 && g.run === 1,
            "NG+ adds cross-fire without campaign difficulty multipliers",
          );
          d.saveCheckpoint(1);
          ok(d.loadCheckpoint().ng, "Checkpoint preserves NG+");
          d.resumeRun();
          ok(d.DeckD.ng, "Resume restores NG+");
          d.startRun(1);
          g = d.g;
          g.waveState = "idle";
          ok(!d.DeckD.ng, "New campaign clears additive mode");
          d.DeckD.lastDrones = 3;
          g.player.drones = 1;
          g.combo = 12;
          d.tickDeckD(0.016);
          g.shots = 10;
          g.hits = 7;
          g.runTime = 100;
          const score = g.score;
          d.fillResults("win", true);
          d.paintDeckResults(1);
          ok(
            document.getElementById("win-d-0").textContent === "70%" &&
              document.getElementById("win-d-1").textContent === "12" &&
              document.getElementById("win-d-2").textContent === "2" &&
              document.getElementById("win-d-3").textContent === "200",
            "Results use real accuracy, peak combo, drone losses and time",
          );
          ok(g.score === score, "Result time counter changes no score/economy");
          d.openLaunchConfirm();
          ok(
            document
              .getElementById("brief-intel-d")
              .textContent.includes("ION STORM"),
            "Briefing includes sector intel",
          );
          d.hideLaunchConfirm();
          localStorage.removeItem("starfall-ng-livery");
          ok(!d.setLivery("aurora"), "Prestige livery locked before NG+ clear");
          d.DeckD.ng = true;
          d.victory();
          ok(
            d.setLivery("aurora") &&
              d.shipColorHex() === "#61ffc4" &&
              d.BatchB.liveries[d.LOADOUT.ship] === "aurora",
            "NG+ victory persists exclusive selected livery",
          );
          d.startRun(1);
          g = d.g;
          g.waveState = "idle";
          d.render();
          d.enterPhotoD();
          const time = g.time,
            x = g.player.x;
          for (let i = 0; i < 10; i++) d.update(0.033);
          ok(
            g.mode === "paused" && g.time === time && g.player.x === x,
            "Photo freezes simulation",
          );
          d.render();
          const gpu = d.SF3D.renderer,
            body = gpu.batches["ship:" + g.player.ship],
            a = body.records,
            idx = (body.count - 1) * 24;
          const first = a[idx];
          d.DeckD.yaw = 0.7;
          d.DeckD.pitch = 0.3;
          d.render();
          ok(a[idx] !== first, "Orbit changes frozen world matrices");
          const arrays = Object.values(gpu.batches).map((v) => v.records);
          for (let i = 0; i < 20; i++) d.render();
          ok(
            Object.values(gpu.batches).every((v, i) => v.records === arrays[i]),
            "Photo rendering reuses fixed instance buffers",
          );
          const shot = d.photoCanvasD();
          const pixels = shot
            .getContext("2d")
            .getImageData(0, 0, shot.width, shot.height).data;
          let light = 0;
          for (let i = 0; i < pixels.length; i += 16) light += pixels[i];
          ok(light > 1000, "Photo capture contains rendered scene pixels");
          let shares = 0;
          Object.defineProperty(navigator, "canShare", {
            configurable: true,
            value: () => true,
          });
          Object.defineProperty(navigator, "share", {
            configurable: true,
            value: async () => {
              shares++;
            },
          });
          await new Promise((resolve) => {
            d.capturePhotoD();
            setTimeout(resolve, 150);
          });
          ok(shares === 0, "Local capture never invokes sharing");
          await d.sharePhotoD();
          ok(shares === 1, "Explicit share invokes system sheet only");
          d.leavePhotoD();
          ok(
            g.mode === "playing" && !d.DeckD.photo,
            "Photo restores original playing state",
          );
          g.mode = "paused";
          d.enterPhotoD();
          d.leavePhotoD();
          ok(g.mode === "paused", "Photo opened from pause returns to pause");
          d.showScreen(null);
          g.mode = "playing";
          d.DeckD.cockpit = true;
          d.render();
          d.DeckD.cockpit = false;
          ok(
            !gpu.batches["ship:" + g.player.ship].count,
            "Cockpit hides external player model",
          );
          d.PROFILE.graphics = "auto";
          d.render();
          const smooth = gpu.batches.fog.count;
          ok(
            smooth === 0 &&
              !gpu.batches.planet.count &&
              !gpu.batches["planet:hd"].count &&
              !gpu.cinematic &&
              gpu.mist === null &&
              gpu.toonMist === null,
            "Smooth submits no cinematic draws and compiles out mist uniforms",
          );
          const smoothProgram = gpu.program,
            smoothEffects = gpu.effects;
          g.mode = "start";
          d.render();
          g.mode = "playing";
          d.PROFILE.graphics = "hd";
          g.perf = false;
          d.render();
          ok(
            gpu.batches.fog.count > smooth &&
              gpu.cinematic &&
              gpu.mist !== null &&
              (reduced
                ? gpu.batches.planet.count === 1
                : gpu.batches["planet:hd"].count === 1),
            "Cinematic detail respects quality budget",
          );
          const cinematicProgram = gpu.program,
            cinematicEffects = gpu.effects;
          const realNow = performance.now.bind(performance);
          let clock = realNow(),
            presented = 1000;
          Object.defineProperty(performance, "now", {
            configurable: true,
            value: () => clock,
          });
          for (let n = 0; n < 120; n++) {
            clock += 0.1;
            presented += 40;
            d.SF3D.presentFrame(presented);
            d.render();
          }
          Object.defineProperty(performance, "now", {
            configurable: true,
            value: realNow,
          });
          ok(
            d.SF3D.metrics.backgroundDetail <= 0.5 &&
              gpu.batches.fog.count === 0 &&
              gpu.batches["planet:hd"].count === 0 &&
              d.SF3D.metrics.presentedFrameMs === 40 &&
              !gpu.cinematic &&
              gpu.program === smoothProgram &&
              gpu.effects === smoothEffects,
            "Slow presented frames with cheap JS restore cached Smooth shaders and remove cinematic draws",
          );
          g.mode = "start";
          d.render();
          g.mode = "playing";
          d.render();
          ok(
            gpu.program === cinematicProgram &&
              gpu.effects === cinematicEffects,
            "Cinematic re-enable reuses previously compiled shader programs",
          );
          d.PROFILE.graphics = "auto";
          d.render();
          ok(
            gpu.program === smoothProgram &&
              gpu.effects === smoothEffects &&
              gpu.batches.fog.count === 0 &&
              gpu.batches.planet.count === 0 &&
              gpu.batches["planet:hd"].count === 0,
            "Manual return to Smooth reuses original shaders and removes cinematic geometry",
          );
          const fingerprints = new Set();
          for (let n = 1; n <= 5; n++) {
            g.sector = n;
            g.time = 10;
            d.render();
            fingerprints.add(d.photoCanvasD().toDataURL());
          }
          ok(fingerprints.size === 5, "Five distinct sector skies");
          if (reduced) {
            const fog = gpu.batches.fog.records.slice();
            g.time += 2;
            d.render();
            ok(
              gpu.batches.fog.records.every((v, i) => v === fog[i]),
              "Reduced motion keeps fog fixed",
            );
          }
          return checks;
        }, reduced),
      );
      for (const width of [320, 375, 430]) {
        await p.setViewportSize({ width, height: 812 });
        await p.evaluate(() => {
          d.g.mode = "start";
          d.showScreen("start");
          d.openLaunchConfirm();
        });
        const bounds = await p.locator("#btn-lc-go").boundingBox();
        assert(
          bounds &&
            bounds.x >= 0 &&
            bounds.x + bounds.width <= width &&
            bounds.y + bounds.height <= 812,
          "Phone briefing launch fits",
        );
        await p.evaluate(() => d.hideLaunchConfirm());
      }
      assert.deepStrictEqual(errors, []);
      await p.close();
    }
  } finally {
    await b.close();
  }
})();
