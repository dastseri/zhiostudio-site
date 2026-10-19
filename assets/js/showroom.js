/* ZhioStudio — 3D showroom (Three.js).
   A dark, warm-gold gallery ring of framed screens around a central
   stage. Drag to orbit, tap a frame to focus + play it, select from
   the glass panel (site.js) to build an order. Falls back to the
   poster grid (window.ZS.enableFallback) when WebGL is unavailable. */
(function () {
  "use strict";

  var state = {
    ready: false, focused: -1, videos: {}, textures: {},
    targetRot: 0, velocity: 0, lastInteract: 0, dragging: false,
  };
  var api = (window.ZSShowroom = {
    unfocus: function () { unfocus(); },
    toggleSound: function () {
      if (state.focused < 0) return false;
      var v = state.videos[state.focused];
      if (!v) return false;
      v.muted = !v.muted;
      return !v.muted;
    },
  });

  function start(data) {
    if (!window.THREE || !window.ZS) { if (window.ZS) ZS.enableFallback(); return; }
    var canvas = document.getElementById("gl");
    var renderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, powerPreference: "high-performance" });
    } catch (e) { ZS.enableFallback(); return; }
    if (!renderer || !renderer.getContext()) { ZS.enableFallback(); return; }

    var GOLD = new THREE.Color((data.settings.colors && data.settings.colors.accent) || "#c6a15b");
    var wrap = document.getElementById("gl-wrap");
    var scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0a0d);
    scene.fog = new THREE.Fog(0x0a0a0d, 16, 30);

    var camera = new THREE.PerspectiveCamera(55, 1, 0.1, 100);
    function placeCamera() {
      var a = wrap.clientWidth / Math.max(1, wrap.clientHeight);
      camera.aspect = a;
      camera.position.set(0, 2.1, a < 0.8 ? 14.2 : a < 1.2 ? 12.4 : 11.2);
      camera.lookAt(0, 1.9, 0);
      camera.updateProjectionMatrix();
      renderer.setSize(wrap.clientWidth, wrap.clientHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    }

    /* ----- lights ----- */
    scene.add(new THREE.AmbientLight(0x35302a, 1.4));
    var spot = new THREE.SpotLight(0xffe3b0, 260, 40, 0.55, 1, 1.6);
    spot.position.set(0, 10, 3);
    spot.target.position.set(0, 1, 0);
    scene.add(spot, spot.target);
    var glow = new THREE.PointLight(0xffbe78, 60, 26, 1.8);
    glow.position.set(0, 3.2, 0);
    scene.add(glow);
    var rim = new THREE.PointLight(0xc6a15b, 26, 30, 2);
    rim.position.set(0, 4, -9);
    scene.add(rim);

    /* ----- floor & walls ----- */
    function radialTexture(inner, outer) {
      var cv = document.createElement("canvas"); cv.width = cv.height = 512;
      var g = cv.getContext("2d"), grad = g.createRadialGradient(256, 256, 30, 256, 256, 256);
      grad.addColorStop(0, inner); grad.addColorStop(1, outer);
      g.fillStyle = grad; g.fillRect(0, 0, 512, 512);
      var t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; return t;
    }
    var floor = new THREE.Mesh(
      new THREE.CircleGeometry(17, 48),
      new THREE.MeshStandardMaterial({ map: radialTexture("#262019", "#0a0a0c"), roughness: 0.55, metalness: 0.35 })
    );
    floor.rotation.x = -Math.PI / 2; scene.add(floor);
    var ring = new THREE.Mesh(
      new THREE.RingGeometry(2.35, 2.45, 64),
      new THREE.MeshBasicMaterial({ color: GOLD, transparent: true, opacity: 0.55, side: THREE.DoubleSide })
    );
    ring.rotation.x = -Math.PI / 2; ring.position.y = 0.02; scene.add(ring);
    var wall = new THREE.Mesh(
      new THREE.CylinderGeometry(17.5, 17.5, 16, 48, 1, true),
      new THREE.MeshBasicMaterial({ color: 0x0d0d11, side: THREE.BackSide })
    );
    wall.position.y = 6; scene.add(wall);

    /* ----- central stage ----- */
    var stage = new THREE.Group();
    var pedestal = new THREE.Mesh(
      new THREE.CylinderGeometry(1.55, 1.75, 0.32, 48),
      new THREE.MeshStandardMaterial({ color: 0x1b1b21, roughness: 0.35, metalness: 0.6 })
    );
    pedestal.position.y = 0.16; stage.add(pedestal);
    var trim = new THREE.Mesh(
      new THREE.TorusGeometry(1.55, 0.035, 12, 64),
      new THREE.MeshStandardMaterial({ color: GOLD, roughness: 0.3, metalness: 0.9 })
    );
    trim.rotation.x = Math.PI / 2; trim.position.y = 0.32; stage.add(trim);
    var logoTex = new THREE.TextureLoader().load(data.settings.logo);
    logoTex.colorSpace = THREE.SRGBColorSpace;
    var logoPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(1.7, 1.7),
      new THREE.MeshBasicMaterial({ map: logoTex, transparent: true })
    );
    logoPlane.position.y = 2.45; stage.add(logoPlane);
    var cone = new THREE.Mesh(
      new THREE.ConeGeometry(2.5, 7.5, 32, 1, true),
      new THREE.MeshBasicMaterial({ color: 0xffd9a0, transparent: true, opacity: 0.05, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending })
    );
    cone.position.y = 5.6; stage.add(cone);
    scene.add(stage);

    /* ----- gallery frames ----- */
    var R = 7.4, frames = [], texLoader = new THREE.TextureLoader();
    var gallery = new THREE.Group(); scene.add(gallery);
    var goldMat = new THREE.MeshStandardMaterial({ color: 0x9a7a3c, roughness: 0.32, metalness: 0.9 });
    var backMat = new THREE.MeshStandardMaterial({ color: 0x141419, roughness: 0.6, metalness: 0.3 });

    function labelTexture(text) {
      var cv = document.createElement("canvas"); cv.width = 512; cv.height = 92;
      var g = cv.getContext("2d");
      g.font = "600 40px Georgia, 'Times New Roman', serif";
      g.textAlign = "center"; g.textBaseline = "middle";
      g.fillStyle = "#e8cf9a";
      g.fillText(text, 256, 48);
      var t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; return t;
    }

    data.samples.forEach(function (sm, i) {
      var theta = (i / data.samples.length) * Math.PI * 2;
      var grp = new THREE.Group();
      grp.position.set(Math.sin(theta) * R, 2.35, Math.cos(theta) * R);
      grp.lookAt(0, 2.35, 0);

      var box = new THREE.Mesh(new THREE.BoxGeometry(2.1, 3.75, 0.1), goldMat);
      box.userData.sampleIndex = i; grp.add(box);
      var back = new THREE.Mesh(new THREE.PlaneGeometry(1.98, 3.63), backMat);
      back.position.z = 0.055; grp.add(back);
      var posterTex = texLoader.load(sm.poster);
      posterTex.colorSpace = THREE.SRGBColorSpace;
      state.textures[i] = posterTex;
      var screenMat = new THREE.MeshBasicMaterial({ map: posterTex });
      var screen = new THREE.Mesh(new THREE.PlaneGeometry(1.86, 3.42), screenMat);
      screen.position.z = 0.065; screen.userData.sampleIndex = i; grp.add(screen);
      var label = new THREE.Mesh(
        new THREE.PlaneGeometry(1.95, 0.35),
        new THREE.MeshBasicMaterial({ map: labelTexture(sm.title), transparent: true })
      );
      label.position.set(0, -2.12, 0.03); grp.add(label);

      gallery.add(grp);
      frames.push({ grp: grp, screen: screen, mat: screenMat, theta: theta });
    });

    /* ----- focus / video ----- */
    function ensureVideo(i) {
      if (state.videos[i]) return state.videos[i];
      var sm = data.samples[i];
      var v = document.createElement("video");
      v.src = sm.video; v.loop = true; v.muted = true; v.playsInline = true;
      v.setAttribute("playsinline", ""); v.preload = "auto"; v.crossOrigin = "anonymous";
      var tex = new THREE.VideoTexture(v);
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.minFilter = THREE.LinearFilter; tex.generateMipmaps = false;
      state.videos[i] = v; state.videos[i + "_tex"] = tex;
      return v;
    }
    function unfocus() {
      if (state.focused < 0) return;
      var i = state.focused, f = frames[i];
      if (state.videos[i]) state.videos[i].pause();
      f.mat.map = state.textures[i]; f.mat.needsUpdate = true;
      f.grp.scale.setScalar(1);
      frames.forEach(function (fr) { fr.mat.opacity = 1; fr.mat.transparent = false; fr.mat.needsUpdate = true; });
      state.focused = -1;
    }
    state._unfocus = unfocus;

    function focus(i) {
      if (state.focused === i) return;
      unfocus();
      state.focused = i;
      var f = frames[i];
      /* rotate the ring (shortest path) so this frame faces the camera */
      var twoPi = Math.PI * 2;
      var delta = (((-f.theta - state.targetRot) % twoPi) + Math.PI * 3) % twoPi - Math.PI;
      state.targetRot += delta;
      f.grp.scale.setScalar(1.14);
      frames.forEach(function (fr, j) {
        if (j !== i) { fr.mat.transparent = true; fr.mat.opacity = 0.5; fr.mat.needsUpdate = true; }
      });
      var v = ensureVideo(i);
      f.mat.map = state.videos[i + "_tex"]; f.mat.opacity = 1; f.mat.transparent = false; f.mat.needsUpdate = true;
      var p = v.play(); if (p && p.catch) p.catch(function () {});
      ZS.openSample(data.samples[i]);
      state.lastInteract = performance.now();
    }

    /* ----- interaction ----- */
    var ray = new THREE.Raycaster(), ptr = new THREE.Vector2();
    var downX = 0, downY = 0, downT = 0, lastX = 0;
    function setPtr(e) {
      var r = canvas.getBoundingClientRect();
      ptr.x = ((e.clientX - r.left) / r.width) * 2 - 1;
      ptr.y = -((e.clientY - r.top) / r.height) * 2 + 1;
    }
    canvas.addEventListener("pointerdown", function (e) {
      state.dragging = true; downX = lastX = e.clientX; downY = e.clientY; downT = performance.now();
      state.velocity = 0; state.lastInteract = performance.now();
      canvas.setPointerCapture(e.pointerId);
    });
    canvas.addEventListener("pointermove", function (e) {
      if (!state.dragging) return;
      var dx = e.clientX - lastX; lastX = e.clientX;
      state.targetRot += dx * 0.0052;
      state.velocity = dx * 0.0052;
      state.lastInteract = performance.now();
    });
    canvas.addEventListener("pointerup", function (e) {
      state.dragging = false;
      state.lastInteract = performance.now();
      var moved = Math.hypot(e.clientX - downX, e.clientY - downY);
      if (moved < 7 && performance.now() - downT < 450) {
        setPtr(e);
        ray.setFromCamera(ptr, camera);
        var hits = ray.intersectObjects(frames.map(function (f) { return f.screen; }));
        if (hits.length) focus(hits[0].object.userData.sampleIndex);
        else if (state.focused >= 0) ZS.closeSample();
      }
    });
    canvas.addEventListener("pointercancel", function () { state.dragging = false; });

    /* ----- loop ----- */
    var reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var clock = new THREE.Clock();
    function tick() {
      requestAnimationFrame(tick);
      var t = clock.getElapsedTime();
      if (!state.dragging) {
        state.targetRot += state.velocity; state.velocity *= 0.94;
        if (!reduced && state.focused < 0 && performance.now() - state.lastInteract > 4000) {
          state.targetRot += 0.0011; /* gentle auto-rotate when idle */
        }
      }
      gallery.rotation.y += (state.targetRot - gallery.rotation.y) * 0.065;
      logoPlane.position.y = 2.45 + Math.sin(t * 0.8) * 0.09;
      logoPlane.rotation.y = Math.sin(t * 0.35) * 0.35;
      logoPlane.lookAt(camera.position.x, logoPlane.position.y, camera.position.z);
      glow.intensity = 55 + Math.sin(t * 1.7) * 7;
      renderer.render(scene, camera);
    }
    placeCamera();
    window.addEventListener("resize", placeCamera);
    state.ready = true;
    state.lastInteract = performance.now();
    tick();
  }

  function unfocus() { if (state._unfocus) state._unfocus(); }

  if (window.ZS && window.ZS.data) start(window.ZS.data);
  else document.addEventListener("zs-ready", function (e) { start(e.detail); });
})();
