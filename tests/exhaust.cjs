// Actual plume pixels, shared Home/flight effect, motion preferences and pooling.
module.exports = async function verifyExhaust(browser) {
  for (const legacyReduced of [false, true]) {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 }, reducedMotion: legacyReduced ? 'reduce' : 'no-preference' });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    if (legacyReduced) await page.addInitScript(() => {
      const get = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function(type, ...args) {
        return type === 'webgl2' ? null : get.call(this, type, ...args);
      };
    });
    await page.goto('http://127.0.0.1:8765');
    await page.waitForFunction(() => document.getElementById('graphics-panel').dataset.state === 'ready');
    console.log(await page.evaluate(async legacyReduced => {
      await SF3D.ready;
      const w = SF3D, check = (value, message) => { if (!value) throw Error(message); };
      w.thumbnail('vanguard', '#c9d7e3', '#ff8a3d', 0, 0, 256);
      const gpu = w.preview, gl = gpu.gl, mesh = w.getGeometry('exhaust');
      check(mesh.count === 18, 'Feathered plume exceeds its six-triangle budget');
      check(mesh.vertices.every(Number.isFinite) && mesh.indices.every(i => i < mesh.uniqueVertices), 'Invalid plume geometry');
      check(gpu.legacy === legacyReduced, 'Expected WebGL version');
      const pixels = new Uint8Array(256 * 256 * 4);
      function plume(time, color) {
        gpu.begin(256, 256, false, 1, time);
        gpu.zoom = 1; gpu.offsetX = gpu.offsetY = 0;
        gpu.add('exhaust', W / 2, H / 2 - 95, 0, 70, 190, 70, 0, 0, 0, color, color, 1, false);
        gpu.flush(time, false);
        gl.readPixels(0, 0, 256, 256, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
        let hash = 2166136261, soft = 0, hot = 0, colored = 0;
        for (let i = 0; i < pixels.length; i += 4) {
          hash = Math.imul(hash ^ pixels[i] ^ pixels[i + 1] ^ pixels[i + 3], 16777619);
          if (pixels[i + 3] > 1 && pixels[i + 3] < 60) soft++;
          if (pixels[i + 3] > 80 && Math.min(pixels[i], pixels[i + 1], pixels[i + 2]) > 180) hot++;
          if (pixels[i + 3] > 30 && Math.max(pixels[i], pixels[i + 1], pixels[i + 2]) - Math.min(pixels[i], pixels[i + 1], pixels[i + 2]) > 50) colored++;
        }
        check(soft > 100 && hot > 5 && colored > 100, 'Missing soft sheath, white-hot core or livery color');
        const alpha = (x, y) => pixels[((255 - y) * 256 + x) * 4 + 3];
        check(alpha(128, 90) > alpha(128, 175) + 30, 'Plume does not fade toward its tail');
        check(alpha(90, 100) < 5 && alpha(166, 100) < 5, 'Plume has hard rectangular edges');
        return hash;
      }
      const first = plume(0, '#ff8a3d'), next = plume(.25, '#ff8a3d');
      check(legacyReduced ? first === next : first !== next, 'Exhaust animation ignores its clock or reduced-motion preference');
      const signatures = new Set(['#3fd6ff', '#ff8a3d', '#ff5da2', '#2ef2c0'].map(color => plume(0, color)));
      check(signatures.size === 4, 'Thruster liveries lost their colors');
      w.thumbnail('vanguard', '#c9d7e3', '#ff8a3d', 0, 0, 256);
      const records = gpu.batches.exhaust.records;
      let allocations = 0;
      const buffer = gl.createBuffer, texture = gl.createTexture;
      gl.createBuffer = function() { allocations++; return buffer.apply(this, arguments); };
      gl.createTexture = function() { allocations++; return texture.apply(this, arguments); };
      try { for (let frame = 0; frame < 30; frame++) w.thumbnail('vanguard', '#c9d7e3', '#ff8a3d', frame / 60, 0, 256); }
      finally { gl.createBuffer = buffer; gl.createTexture = texture; }
      check(!allocations && gpu.batches.exhaust.records === records, 'Steady exhaust creates GPU resources or replaces the instance pool');
      w.thumbnail('drone:scout', '#8ae7ff', '#8ae7ff', 1, 0, 256);
      check(gpu.batches.exhaust.count === 2 && gpu.batches.exhaust.source === mesh, 'Drone inspection does not share the plume mesh');
      startRun(1); G.spawnQueue = []; G.enemies = []; G.boss = null; G.warpW = 0; G.player.drones = 3; G.player.invuln = 10000;
      render();
      const flight = w.combatGPU, jets = flight.batches.exhaust;
      check(jets.source === mesh && jets.count >= 8, 'Ship and escort gameplay exhaust differs from inspection');
      const length = Math.hypot(jets.records[4], jets.records[5], jets.records[6]);
      G.waveState = 'warp'; G.warpT = G.warpDur * .5; render();
      const warpLength = Math.hypot(jets.records[4], jets.records[5], jets.records[6]);
      check(legacyReduced ? Math.abs(warpLength - length) < .01 : warpLength > length * 2, 'Warp plume ignores intensity or reduced-motion preference');
      G.waveState = 'idle'; G.warpW = 0; G.time = 3.25; render();
      const clock = flight.gl.getUniform(flight.effects, flight.effectTime); render();
      check(flight.gl.getUniform(flight.effects, flight.effectTime) === clock, 'Unchanged simulation time advances exhaust');
      const fallback = flameSprite('#ff8a3d'), spritePixels = fallback.getContext('2d').getImageData(0, 0, fallback.width, fallback.height).data;
      check(flameSprite('#ff8a3d') === fallback && fallback.width === 96 && spritePixels[3] === 0 && spritePixels[(48 * 4) + 3] > 240, 'Canvas fallback loses its cached feathered flame');
      let warmPixels = 0;
      for (let i = 0; i < spritePixels.length; i += 4) if (spritePixels[i + 3] > 10 && spritePixels[i] > spritePixels[i + 1] + 40 && spritePixels[i + 1] > spritePixels[i + 2] + 40) warmPixels++;
      check(warmPixels > 100, 'Canvas fallback loses the selected Solar livery');
      check(gl.getError() === gl.NO_ERROR && flight.gl.getError() === flight.gl.NO_ERROR, 'Exhaust GL errors');
      return 'Exhaust: ' + (legacyReduced ? 'WebGL1/reduced-motion' : 'WebGL2/animated') + ' soft core/sheath/tail, four liveries, shared ship/drone geometry, warp response and pooled storage passed';
    }, legacyReduced));
    if (errors.length) throw Error(errors.join('\n'));
    await page.close();
  }
};
