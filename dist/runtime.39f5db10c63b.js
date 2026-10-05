/* partner-road.js */
/* The market stays fixed. Scroll only advances the friends along one winding road. */
(() => {
  'use strict';
  const road = document.querySelector('#partner-road');
  if (!road) return;
  const world = road.querySelector('.road-world');
  const friends = road.querySelector('.road-friends');
  const points = [[5,23],[92,23],[95,26],[95,45],[92,48],[8,48],[5,51],[5,70],[8,73],[92,73],[95,76],[95,95],[92,98],[5,98]];
  const dialog = document.querySelector('#partner-dialog');
  const dialogLogo = dialog.querySelector('img');
  const shops = [...road.querySelectorAll('.partner-shop')];
  const autoCard = road.querySelector('.partner-auto-card');
  let nearbyShop = null;
  let lastProgress = 0;
  let opener;
  const ease = value => { const t = Math.max(0, Math.min(1, value)); return t * t * (3 - 2 * t); };
  function matchCard(shop, card) {
    card.classList.toggle("featured-partner", shop.classList.contains("featured-partner"));
    card.dataset.brand = shop.querySelector(".shop-logo")?.getAttribute("src").includes("ethereum.webp") ? "ethereum" : "partner";
    const colours = getComputedStyle(shop);
    for (const property of ['--card-bg', '--card-accent'])
      card.style.setProperty(property, colours.getPropertyValue(property));
    const monogram = card.querySelector('.partner-monogram');
    const source = shop.querySelector('.partner-monogram');
    monogram.hidden = !source;
    monogram.textContent = source?.textContent || '';
  }
  function closeAutoCard() {
    autoCard.hidden = true;
    delete road.dataset.nearbyShop;
    nearbyShop = null;
  }
  function updateAutoCard(x, y, worldBounds, facing) {
    if (!document.documentElement.classList.contains('cinematic') ||
        !road.classList.contains('is-active') || dialog.open || document.hidden) {
      closeAutoCard();
      return;
    }
    const footX = worldBounds.left + x * worldBounds.width / 100;
    const footY = worldBounds.top + y * worldBounds.height / 100;
    const nearby = shops.find(shop => {
      const bounds = shop.getBoundingClientRect();
      // Only the shop frontage counts; gaps and turns have no open card.
      return bounds.width > 0 && footX >= bounds.left + bounds.width * .15 &&
        footX <= bounds.right - bounds.width * .15 && footY >= bounds.bottom - 2 &&
        footY <= bounds.bottom + worldBounds.height * .09;
    });
    if (!nearby) { closeAutoCard(); return; }
    const bounds = nearby.getBoundingClientRect();
    const across = (footX - bounds.left - bounds.width * .15) / (bounds.width * .7);
    const passed = facing < 0 ? 1 - across : across;
    const enter = ease(passed / .2);
    const leave = ease((passed - .65) / .35);
    autoCard.style.setProperty('--partner-card-y', `${((1 - enter) * 34 + leave * Math.min(innerHeight * .38, 320)).toFixed(2)}px`);
    autoCard.style.setProperty('--partner-card-opacity', (enter * (1 - leave)).toFixed(4));
    if (nearby === nearbyShop) return;
    nearbyShop = nearby;
    matchCard(nearby, autoCard);
    autoCard.querySelector('.partner-auto-name').textContent = nearby.querySelector('.shop-name').textContent;
    autoCard.querySelector('.partner-auto-role').textContent = nearby.querySelector('.shop-role').textContent;
    const logo = nearby.querySelector('.shop-logo');
    const cardLogo = autoCard.querySelector('img');
    cardLogo.hidden = !logo;
    if (logo) cardLogo.src = logo.getAttribute('src');
    else cardLogo.removeAttribute('src');
    road.dataset.nearbyShop = String(shops.indexOf(nearby));
    autoCard.hidden = false;
  }
  road.querySelectorAll('.shop-open').forEach(button => {
    button.disabled = false;
    button.addEventListener('click', () => {
      const shop = button.closest('.partner-shop');
      closeAutoCard();
      opener = button;
      dialog.classList.remove('brand-details');
      delete dialog.dataset.brand;
      matchCard(shop, dialog);
      dialog.querySelector('#partner-dialog-name').textContent = shop.querySelector('.shop-name').textContent;
      dialog.querySelector('#partner-dialog-role').textContent = shop.querySelector('.shop-role').textContent;
      const logo = shop.querySelector('.shop-logo');
      dialogLogo.hidden = !logo;
      if (logo) dialogLogo.src = logo.getAttribute('src');
      else dialogLogo.removeAttribute('src');
      dialog.showModal();
    });
  });
  document.querySelectorAll('[data-brand-name]').forEach(button => {
    button.addEventListener('click', event => {
      event.preventDefault();
      closeAutoCard();
      opener = button;
      dialog.classList.remove('featured-partner');
      dialog.classList.add('brand-details');
      dialog.dataset.brand = button.classList.contains('brand-ethereum') ? 'ethereum' :
        button.classList.contains('brand-tge') ? 'tge' : 'partner';
      dialog.style.removeProperty('--card-bg');
      dialog.style.removeProperty('--card-accent');
      dialog.querySelector('.partner-monogram').hidden = true;
      dialog.querySelector('#partner-dialog-name').textContent = button.dataset.brandName;
      dialog.querySelector('#partner-dialog-role').textContent = button.dataset.brandRole;
      dialogLogo.src = button.querySelector('img').getAttribute('src');
      dialogLogo.hidden = false;
      dialog.showModal();
    });
  });
  dialog.addEventListener('close', () => {
    if (opener && !opener.closest('[inert]')) opener.focus({ preventScroll:true });
  });
  dialog.addEventListener('keydown', event => {
    // Escape belongs to the open board, even while the story music is playing.
    if (event.key === 'Escape') event.stopPropagation();
  });
  function render(progress) {
    lastProgress = progress;
    const width = world.clientWidth || innerWidth;
    const height = world.clientHeight || innerHeight;
    const lengths = points.slice(1).map((point,index) => Math.hypot((point[0]-points[index][0])*width,(point[1]-points[index][1])*height));
    const total = lengths.reduce((sum,length) => sum+length,0);
    let remaining = Math.max(0,Math.min(1,(progress-.02)/.96))*total;
    let segment = 0;
    while (segment < lengths.length-1 && remaining > lengths[segment]) remaining -= lengths[segment++];
    const fraction = remaining/lengths[segment];
    const from = points[segment], to = points[segment+1];
    const x = from[0]+(to[0]-from[0])*fraction;
    const y = from[1]+(to[1]-from[1])*fraction;
    friends.style.left = `${x}%`;
    friends.style.top = `${y}%`;
    friends.style.setProperty('--walk-facing', to[0] < from[0] ? -1 : to[0] > from[0] ? 1 : segment < 5 ? 1 : segment < 8 ? -1 : 1);
    friends.style.setProperty('--walk-bob', `${Math.sin(progress*240)*1.6}px`);
    friends.style.setProperty('--walk-sway', `${Math.sin(progress*120)*1.1}deg`);
    updateAutoCard(x, y, world.getBoundingClientRect(), to[0] - from[0]);
  }
  road.addEventListener('story-progress', event => render(event.detail));
  const resetInactive = () => {
    if (!document.documentElement.classList.contains('cinematic')) friends.removeAttribute('style');
    if (!document.documentElement.classList.contains('cinematic') || !road.classList.contains('is-active')) closeAutoCard();
  };
  const stateObserver = new MutationObserver(resetInactive);
  stateObserver.observe(document.documentElement,{attributes:true,attributeFilter:['class']});
  stateObserver.observe(road,{attributes:true,attributeFilter:['class']});
  addEventListener('pagehide', closeAutoCard);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) closeAutoCard();
    else if (road.classList.contains('is-active') && document.documentElement.classList.contains('cinematic')) render(lastProgress);
  });
})();

;
/* invitation-handoff.js */
/* A reversible hand-off: the pass follows her palm, then belongs to his. */
(() => {
  "use strict";
  const scene = document.querySelector("#the-invitation");
  const rig = scene?.querySelector(".handoff-rig");
  if (!rig) return;
  const clamp = (x) => Math.max(0, Math.min(1, x));
  const ease = (x) => { x = clamp(x); return x * x * (3 - 2 * x); };
  const palm = (x, y, dx, dy, degrees) => {
    const a = degrees * Math.PI / 180;
    return [x + dx * Math.cos(a) - dy * Math.sin(a),
      y + dx * Math.sin(a) + dy * Math.cos(a)];
  };
  function draw(progress) {
    const reveal = ease((progress - 0.06) / 0.28);
    const reach = ease((progress - 0.24) / 0.18);
    const receive = ease((progress - 0.43) / 0.17);
    const front = ease((progress - 0.17) / 0.11);
    const herAngle = -80 * (1 - reveal) - 68 * receive;
    const hisAngle = 48 * (1 - reach) - 8 * receive;
    const herPalm = palm(734, 331, -147.5, 56, -80 * (1 - reveal));
    const hisPalm = palm(306, 316, 152.5, 57.5, hisAngle);
    // Her right-hand grip supports the right edge; his palm takes the centre.
    const x = (herPalm[0] - 195) * (1 - receive) + (hisPalm[0] - 135) * receive;
    const y = (herPalm[1] - 188) * (1 - receive) + (hisPalm[1] - 203) * receive;
    rig.style.setProperty("--her-arm", `${herAngle.toFixed(3)}deg`);
    rig.style.setProperty("--his-arm", `${hisAngle.toFixed(3)}deg`);
    // Percentages are relative to the pass itself so transforms scale on phones.
    rig.style.setProperty("--pass-x", `${(x / 270 * 100).toFixed(4)}%`);
    rig.style.setProperty("--pass-y", `${(y / (375 * 270 / 485) * 100).toFixed(4)}%`);
    rig.style.setProperty("--pass-turn", `${(18 * (1 - reveal) - 4 * receive).toFixed(3)}deg`);
    rig.style.setProperty("--front", front.toFixed(4));
    rig.style.setProperty("--rear", (1 - front).toFixed(4));
    rig.style.setProperty("--pass-visible", ease((progress - 0.07) / 0.07).toFixed(4));
    rig.dataset.handoff = progress < 0.07 ? "concealed"
      : progress < 0.34 ? "revealing" : progress < 0.6 ? "offering" : "received";
  }
  scene.addEventListener("story-progress", (event) => draw(event.detail));
  draw(0);
})();

;
/* aarti-flowers.js */
/* A quiet shower of marigold, rose and jasmine petals, only during aarti. */
(() => {
  const shower = document.querySelector("#devotion .flower-shower");
  if (!shower) return;
  const fragment = document.createDocumentFragment();
  for (let i = 0; i < 36; i++) {
    const petal = document.createElement("i");
    petal.className = `flower-petal petal-${i % 3}`;
    petal.style.setProperty("--petal-left", `${(i * 37 + 11) % 100}%`);
    petal.style.setProperty("--petal-size", `${8 + i % 7}px`);
    petal.style.setProperty("--petal-drift", `${(i % 2 ? 1 : -1) * (22 + i % 5 * 11)}px`);
    petal.style.setProperty("--petal-duration", `${7 + i % 6 * 0.7}s`);
    petal.style.setProperty("--petal-delay", `${-i * 0.73}s`);
    petal.style.setProperty("--petal-turn", `${180 + i % 5 * 90}deg`);
    fragment.append(petal);
  }
  shower.append(fragment);
  const pauseWhenHidden = () => {
    shower.dataset.paused = String(document.hidden);
  };
  document.addEventListener("visibilitychange", pauseWhenHidden);
  pauseWhenHidden();
})();

;
/* garba-circle.js */
/* Only the dancers orbit. The floor, shrine and lotus decor stay fixed. */
(() => {
  "use strict";
  const scene = document.querySelector("#celebration");
  if (!scene) return;
  const root = document.documentElement;
  const rings = [...scene.querySelectorAll(".garba-ring")];
  let frame = 0, previous = 0, elapsed = 0, progress = 0;
  const canDance = () => root.classList.contains("cinematic") &&
    scene.classList.contains("is-visible") && !document.hidden;

  function paint() {
    rings.forEach((ring, i) => {
      const angle = elapsed * (i ? 5 : 7) + progress * (i ? 24 : 32);
      ring.style.transform = `rotate(${angle.toFixed(3)}deg)`;
    });
  }
  function stop() {
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
    previous = 0;
    delete scene.dataset.dancing;
  }
  function dance(now) {
    frame = 0;
    if (!canDance()) { stop(); return; }
    if (previous) elapsed += Math.min((now - previous) / 1000, 0.05);
    previous = now;
    paint();
    frame = requestAnimationFrame(dance);
  }
  function sync() {
    if (!root.classList.contains("cinematic")) {
      stop();
      elapsed = 0;
      progress = 0;
      rings.forEach((ring) => ring.removeAttribute("style"));
      return;
    }
    if (!canDance()) { stop(); return; }
    scene.dataset.dancing = "true";
    if (!frame) frame = requestAnimationFrame(dance);
  }
  scene.addEventListener("story-progress", (event) => {
    progress = Math.max(0, Math.min(1, Number(event.detail) || 0));
    paint();
    sync();
  });
  const observer = new MutationObserver(sync);
  observer.observe(root, { attributes: true, attributeFilter: ["class"] });
  observer.observe(scene, { attributes: true, attributeFilter: ["class"] });
  document.addEventListener("visibilitychange", sync);
  addEventListener("pagehide", stop);
  addEventListener("pageshow", sync);
  sync();
})();

;
/* event-crowds.js */
/* Align each guest layer to its painted scene, and animate only visible scenes. */
(() => {
  "use strict";
  const root = document.documentElement;
  const layers = [...document.querySelectorAll(".event-crowd")];
  const scenes = [...new Set(layers.map(layer => layer.closest(".scene")))];
  let pageVisible = true;
  function measure() {
    layers.forEach(layer => {
      const scene = layer.closest(".scene");
      const source = layer.dataset.art ? scene.querySelector(layer.dataset.art) : null;
      const width = layer.clientWidth, height = layer.clientHeight;
      const ratio = source ? (source.naturalWidth / source.naturalHeight || 1.5) : width / height;
      const contain = source && getComputedStyle(source).objectFit === "contain";
      const planeWidth = source ? (contain ? Math.min(width, height * ratio) : Math.max(width, height * ratio)) : width;
      const planeHeight = source ? planeWidth / ratio : height;
      layer.style.setProperty("--plane-width", `${planeWidth}px`);
      layer.style.setProperty("--plane-height", `${planeHeight}px`);
      layer.style.setProperty("--unit-x", `${planeWidth / 100}px`);
      layer.style.setProperty("--unit-y", `${planeHeight / 100}px`);
    });
  }
  function sync() {
    for (const scene of scenes) {
      const running = root.classList.contains("cinematic") &&
        scene.classList.contains("is-visible") && !document.hidden && pageVisible;
      if (running) scene.dataset.crowdRunning = "true";
      else delete scene.dataset.crowdRunning;
    }
  }
  const observer = new MutationObserver(sync);
  observer.observe(root, { attributes: true, attributeFilter: ["class"] });
  scenes.forEach(scene => observer.observe(scene, { attributes: true, attributeFilter: ["class"] }));
  if (typeof ResizeObserver !== "undefined") {
    const resize = new ResizeObserver(measure);
    layers.forEach(layer => resize.observe(layer));
  }
  document.addEventListener("load", event => {
    if (event.target instanceof HTMLImageElement) measure();
  }, true);
  addEventListener("resize", measure, { passive: true });
  document.addEventListener("visibilitychange", sync);
  addEventListener("pagehide", () => { pageVisible = false; sync(); });
  addEventListener("pageshow", () => { pageVisible = true; measure(); sync(); });
  measure();
  sync();
})();

;
/* elephant-walk.js */
/* A continuous textured mesh keeps the supplied artwork joined throughout each step. */
(() => {
  'use strict';
  const ride = document.querySelector('.journey-elephant');
  if (!ride) return;
  const canvas = ride.querySelector('.elephant-mesh');
  const root = document.documentElement;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const hips = [[1520,820],[1025,824],[1348,824],[916,824]];
  const feet = [[1580,1190],[1040,1190],[1320,1184],[785,1180]];
  const offsets = [0,.25,.5,.75];
  let gl, program, movesLocation, texture, ready = false;
  let frame = 0, last = 0, phase = 0, weight = 0, pageVisible = true;
  const permitted = () => ready && root.classList.contains('cinematic') && !ride.hidden &&
    !document.hidden && pageVisible && !reduced.matches;
  const smooth = (a,b,v) => { const t=Math.max(0,Math.min(1,(v-a)/(b-a))); return t*t*(3-2*t); };
  function stop() {
    if (frame) cancelAnimationFrame(frame);
    frame = 0; last = 0;
  }
  function fallback() {
    ready = false; stop(); ride.classList.remove('mesh-ready');
  }
  function shader(type, source) {
    const result = gl.createShader(type);
    gl.shaderSource(result, source); gl.compileShader(result);
    if (!gl.getShaderParameter(result, gl.COMPILE_STATUS)) throw Error('Elephant shader unavailable');
    return result;
  }
  function initialize() {
    try {
      gl = canvas.getContext('webgl', {alpha:true, antialias:true, premultipliedAlpha:true});
      if (!gl) return;
      const vertex = shader(gl.VERTEX_SHADER, `
        attribute vec2 a_point;
        attribute vec4 a_weights;
        uniform vec3 u_moves[4];
        varying vec2 v_uv;
        vec2 moveLeg(vec2 point, vec2 hip, vec3 motion) {
          vec2 p = point - hip;
          float c = cos(motion.x), s = sin(motion.x);
          return hip + vec2(c*p.x-s*p.y, s*p.x+c*p.y+motion.y);
        }
        void main() {
          vec2 p = a_point;
          p += (moveLeg(a_point,vec2(1520.,820.),u_moves[0])-a_point)*a_weights.x;
          p += (moveLeg(a_point,vec2(1025.,824.),u_moves[1])-a_point)*a_weights.y;
          p += (moveLeg(a_point,vec2(1348.,824.),u_moves[2])-a_point)*a_weights.z;
          p += (moveLeg(a_point,vec2(916.,824.),u_moves[3])-a_point)*a_weights.w;
          gl_Position = vec4((p.x-315.)/1390.*2.-1.,1.-(p.y-170.)/1040.*2.,0.,1.);
          v_uv = a_point / vec2(2048.,1536.);
        }`);
      const fragment = shader(gl.FRAGMENT_SHADER, `
        precision mediump float;
        varying vec2 v_uv;
        uniform sampler2D u_art;
        void main() { gl_FragColor = texture2D(u_art,v_uv); }`);
      program = gl.createProgram(); gl.attachShader(program,vertex); gl.attachShader(program,fragment); gl.linkProgram(program);
      if (!gl.getProgramParameter(program,gl.LINK_STATUS)) throw Error('Elephant mesh unavailable');
      gl.useProgram(program);
      // Vertices are shared by adjacent triangles: no clipped pieces or open seams.
      const columns=104, rows=78, vertices=[], indices=[];
      for(let row=0;row<=rows;row++) for(let col=0;col<=columns;col++) {
        const x=col*2048/columns, y=row*1536/rows;
        const depth=smooth(850,1040,y);
        const t=Math.max(0,Math.min(1,(y-824)/366));
        const centers=[916+(785-916)*t,1025+(1040-1025)*t,1348+(1320-1348)*t,1520+(1580-1520)*t];
        const boundaries=[(centers[0]+centers[1])/2,(centers[1]+centers[2])/2,(centers[2]+centers[3])/2];
        const cuts=boundaries.map(b=>smooth(b-18,b+18,x));
        const trunkMask=smooth(700,710,x);
        const tailMask=1-smooth(1585,1605,x)*(1-smooth(980,1040,y));
        const amount=depth*trunkMask*tailMask;
        vertices.push(x,y,cuts[2]*amount,(cuts[0]-cuts[1])*amount,(cuts[1]-cuts[2])*amount,(1-cuts[0])*amount);
      }
      for(let row=0;row<rows;row++) for(let col=0;col<columns;col++) {
        const a=row*(columns+1)+col,b=a+1,c=a+columns+1,d=c+1;
        indices.push(a,c,b,b,c,d);
      }
      gl.bindBuffer(gl.ARRAY_BUFFER,gl.createBuffer());gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(vertices),gl.STATIC_DRAW);
      const point=gl.getAttribLocation(program,'a_point'), weights=gl.getAttribLocation(program,'a_weights');
      gl.enableVertexAttribArray(point);gl.vertexAttribPointer(point,2,gl.FLOAT,false,24,0);
      gl.enableVertexAttribArray(weights);gl.vertexAttribPointer(weights,4,gl.FLOAT,false,24,8);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,gl.createBuffer());gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,new Uint16Array(indices),gl.STATIC_DRAW);
      canvas.dataset.triangles=String(indices.length/3);
      movesLocation=gl.getUniformLocation(program,'u_moves[0]');
      texture=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,texture);
      gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL,true);
      gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
      gl.clearColor(0,0,0,0);
      const image=new Image();
      image.onload=()=>{
        if(gl.isContextLost()) return;
        gl.bindTexture(gl.TEXTURE_2D,texture);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,image);
        ready=true;resize();paint();ride.classList.add('mesh-ready');sync();
      };
      image.onerror=fallback;
      image.src='assets/story/elephant-ride/hathi-original.webp';
    } catch { fallback(); }
  }
  function resize() {
    if (!ready) return;
    const dpr=Math.min(devicePixelRatio||1,root.classList.contains('safety-light-effects')?1:2);
    const width=Math.max(1,Math.round(canvas.clientWidth*dpr)),height=Math.max(1,Math.round(canvas.clientHeight*dpr));
    if(canvas.width!==width||canvas.height!==height){canvas.width=width;canvas.height=height;}
    gl.viewport(0,0,width,height);paint();
  }
  function paint() {
    if (!ready) return;
    const moves=[];
    for(let leg=0;leg<4;leg++) {
      const t=(phase+offsets[leg])%1,stance=.64;
      const swing=Math.max(0,(t-stance)/(1-stance)),eased=swing*swing*(3-2*swing);
      const angle=(t<stance?7-14*t/stance:-7+14*eased)*weight*Math.PI/180;
      const lift=t<stance?0:Math.sin(swing*Math.PI)*25*weight;
      const [x,y]=hips[leg],[footX,footY]=feet[leg];
      const ground=(footY-y)*(1-Math.cos(angle))-(footX-x)*Math.sin(angle);
      moves.push(angle,ground-lift,0);
    }
    gl.uniform3fv(movesLocation,moves);gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawElements(gl.TRIANGLES,104*78*6,gl.UNSIGNED_SHORT,0);
    // The upper artwork and saddle remain stable; only a tiny seat response is added.
    ride.style.setProperty('--saddle-rise',`${(Math.sin(phase*Math.PI*8)*.3*weight).toFixed(3)}px`);
    canvas.dataset.stride=phase.toFixed(4);
    canvas.dataset.walkWeight=weight.toFixed(4);
  }
  function tick(now) {
    frame=0;if(!permitted()){stop();return;}
    const dt=last?Math.min((now-last)/1000,.2):0;last=now;
    const target=ride.dataset.walking==='true'?1:0;
    weight+=(target-weight)*(1-Math.exp(-dt*12));
    if(!target&&weight<.001)weight=0;
    phase=(phase+dt*weight/2.3)%1;paint();
    if(target||weight)frame=requestAnimationFrame(tick);else last=0;
  }
  function sync() {
    if(!permitted()){
      stop();if(!root.classList.contains('cinematic')||reduced.matches){weight=0;paint();}return;
    }
    resize();
    if(!frame&&(ride.dataset.walking==='true'||weight))frame=requestAnimationFrame(tick);
  }
  const observer=new MutationObserver(sync);
  observer.observe(root,{attributes:true,attributeFilter:['class']});
  observer.observe(ride,{attributes:true,attributeFilter:['hidden','data-walking']});
  if(typeof ResizeObserver!=='undefined')new ResizeObserver(resize).observe(canvas);
  addEventListener('resize',resize,{passive:true});
  document.addEventListener('visibilitychange',sync);
  addEventListener('pagehide',()=>{pageVisible=false;stop();});
  addEventListener('pageshow',()=>{pageVisible=true;sync();});
  reduced.addEventListener('change',sync);
  canvas.addEventListener('webglcontextlost',event=>{event.preventDefault();fallback();});
  canvas.addEventListener('webglcontextrestored',initialize);
  initialize();
})();

;
/* site-soundtrack.js */
/* One audible track: doors, silk descent, then continuous background music. */
(() => {
  "use strict";
  const button = document.querySelector("#soundtrack-toggle");
  const introButton = document.querySelector("#opening-sound");
  const tracks = Object.fromEntries([
    ["door", "door-sound"], ["descent", "descent-sound"], ["music", "site-soundtrack"],
  ].map(([name, id]) => [name, { audio: document.getElementById(id), gain: null, blocked: false, ended: false, request: 0, pending: false }]));
  let context, started = false, muted = false, introEnabled = true;
  let pageActive = true, introSuppressed = false;
  let phase = "door", musicStarted = false, session = 0;
  const current = () => tracks[phase];
  const permitted = () => started && !muted && pageActive && !document.hidden
    && (phase === "music" || (introEnabled && !introSuppressed));
  const audible = track => track === current() && permitted() && !track.blocked && !track.ended;
  const rewind = track => { try { track.audio.currentTime = 0; } catch {} };

  function updateControl() {
    button.hidden = !started;
    const retry = current().blocked && permitted();
    button.dataset.state = retry ? "retry" : muted ? "muted"
      : !permitted() ? "paused" : phase === "music" ? "playing" : "opening";
    button.setAttribute("aria-pressed", String(!muted && !retry));
    const label = retry ? "Play website sound" : muted ? "Unmute website sound" : "Mute website sound";
    button.setAttribute("aria-label", label);
    button.title = label;
    introButton.setAttribute("aria-pressed", String(introEnabled));
    button.querySelector(".control-label").textContent = retry ? "Play sound" : muted ? "Unmute" : "Mute";
    introButton.querySelector(".control-label").textContent = introEnabled ? "Intro sound on" : "Intro sound off";
  }
  function setVolume(track, level) {
    if (track.gain) {
      track.audio.muted = false;
      // Immediate silence prevents the previous effect bleeding into the next.
      track.gain.gain.cancelScheduledValues(context.currentTime);
      track.gain.gain.setValueAtTime(level, context.currentTime);
    } else {
      track.audio.volume = .55;
      track.audio.muted = level === 0;
    }
  }
  function unlock() {
    const Audio = window.AudioContext || window.webkitAudioContext;
    if (!context && Audio) {
      try { context = new Audio(); } catch { /* HTML media fallback. */ }
    }
    if (context) {
      for (const track of Object.values(tracks)) {
        if (track.gain) continue;
        try {
          const gain = context.createGain();
          gain.gain.value = 0;
          const source = context.createMediaElementSource(track.audio);
          source.connect(gain);
          gain.connect(context.destination);
          track.gain = gain;
        } catch { /* Keep this media element on the HTML fallback. */ }
      }
      if (context.state === "suspended") {
        const token = session;
        context.resume().catch(() => {
          if (token !== session || !started) return;
          current().blocked = true;
          sync();
        });
      }
    }
  }
  function play(track, prime = false) {
    const token = session, request = ++track.request;
    track.pending = true;
    const failed = error => {
      if (token !== session || request !== track.request) return;
      track.pending = false;
      if (error.name === "AbortError") { if (audible(track)) sync(); return; }
      track.blocked = true;
      setVolume(track, 0);
      updateControl();
    };
    try {
      const result = track.audio.play();
      result?.then(() => {
        if (token !== session || request !== track.request) return;
        track.pending = false;
        // Noncurrent tracks are unlocked silently in the logo click, then parked.
        if (prime && !audible(track)) {
          track.audio.pause();
          rewind(track);
        }
        if (audible(track) && track.audio.paused) sync();
      }, failed);
      if (!result) track.pending = false;
    } catch (error) { failed(error); }
  }
  function sync() {
    // Stop every noncurrent source before making another source audible.
    for (const track of Object.values(tracks)) {
      if (audible(track)) continue;
      setVolume(track, 0);
      track.audio.pause();
    }
    const track = current();
    if (audible(track)) {
      if (track.audio.paused && !track.pending) play(track);
      setVolume(track, track.blocked ? 0 : .55);
    }
    updateControl();
  }
  function select(next) {
    if (!started || next === phase) return;
    phase = next;
    introSuppressed = false;
    const track = current();
    if (phase !== "music" || !musicStarted) {
      rewind(track);
      track.ended = false;
    }
    if (phase === "music") musicStarted = true;
    sync();
  }
  function begin(animated = true) {
    ++session;
    started = true;
    introSuppressed = musicStarted = false;
    phase = animated ? "door" : "music";
    for (const track of Object.values(tracks)) {
      track.audio.pause();
      track.blocked = track.ended = track.pending = false;
      rewind(track);
      setVolume(track, 0);
    }
    // Prime all three media elements during the actual activation gesture.
    unlock();
    for (const track of Object.values(tracks)) {
      if (track.audio.error) track.audio.load();
      play(track, true);
    }
    musicStarted = !animated;
    sync();
  }
  function reset() {
    ++session;
    started = introSuppressed = musicStarted = false;
    for (const track of Object.values(tracks)) {
      track.audio.pause();
      rewind(track);
      track.blocked = track.ended = track.pending = false;
    }
    sync();
  }
  window.garbaSoundtrack = {
    begin,
    setScene(cursor) { select(cursor < 1 ? "door" : cursor < 1.42 - 1e-6 ? "descent" : "music"); },
    cancelIntro() { if (phase !== "music") { introSuppressed = true; sync(); } },
    reset,
  };
  button.addEventListener("click", () => {
    const track = current();
    if (track.blocked) {
      track.blocked = false;
      muted = false;
      if (track.audio.error) track.audio.load();
    } else muted = !muted;
    if (!muted) unlock();
    sync();
  });
  introButton.addEventListener("click", () => {
    introEnabled = !introEnabled;
    if (introEnabled && started) unlock();
    sync();
  });
  for (const track of Object.values(tracks)) {
    track.audio.addEventListener("ended", () => { track.ended = true; sync(); });
    track.audio.addEventListener("error", () => {
      if (!started) return;
      track.blocked = true;
      sync();
    });
  }
  document.addEventListener("visibilitychange", sync);
  addEventListener("pagehide", () => { pageActive = false; sync(); });
  addEventListener("pageshow", () => { pageActive = true; sync(); });
  updateControl();
})();

;
/* autoscroll-timeline.js */
/* Seconds from opt-in to the document end. Cursor 14 ends the story; 15 ends the page. */
(() => {
  "use strict";
  const segments = [
    ["opening", 3.5], ["beginning", 5], ["the-invitation", 11],
    ["the-plan", 2.5], ["the-drive", 1.5], ["arrival", 8],
    ["a-memory", 4.5], ["devotion", 1.5], ["the-stage", 3.5],
    ["celebration", 1.5], ["partner-road", 20], ["finale", 1.5],
  ];
  // Door and descent each gain one second. The extra boarding second is
  // spent on the actual climb (cursor 3.25–3.47), not the approach or exit.
  // Keep moving through the clear gate and a full extra second of the interior.
  const points = [
    [0, 0], [1 + 1.5 * 1.9 / 4.7, 1], [3.5, 1.42],
    [6, 1.60], [8.2, 1.70], [8.5, 2],
    [10, 2.18], [13.5, 2.38], [15, 2.56], [18.5, 2.70], [19.5, 3],
    [19.875, 3.25], [21.205, 3.47], [22, 4], [23.5, 5],
    [25.1, 5.38], [26.2, 5.60], [27.9, 5.74], [29.7, 5.90], [30.7, 5.96], [31.5, 6],
    [33.2, 6.24], [35.1, 6.54], [36, 7], [37.5, 8],
    [40.3, 8.70], [41, 9], [42.5, 10], [62.5, 14], [64, 15],
  ];
  function cursorAt(seconds) {
    if (seconds <= 0) return 0;
    for (let i = 1; i < points.length; i++) {
      const [end, to] = points[i], [start, from] = points[i - 1];
      if (seconds <= end) return from + (to - from) * (seconds - start) / (end - start);
    }
    return 15;
  }
  // Manual seeking maps back to time. Pausing saves the exact elapsed position.
  function timeAt(cursor) {
    if (cursor <= 0) return 0;
    for (let i = 1; i < points.length; i++) {
      const [end, to] = points[i], [start, from] = points[i - 1];
      if (cursor <= to) return to === from ? start : start + (end - start) * (cursor - from) / (to - from);
    }
    return 64;
  }
  window.garbaTimeline = Object.freeze({
    duration: 64, openingDuration: 3.5,
    segments: Object.freeze(segments.map(Object.freeze)), cursorAt, timeAt,
  });
})();

;
/* experience.js */
/* A scroll-driven film with continuous manual dialogue slowdowns. Every scene remains readable without JavaScript. */
(() => {
  "use strict";
  const isReload =
    performance.getEntriesByType?.("navigation")?.[0]?.type === "reload";
  if (isReload && location.hash)
    history.replaceState(
      history.state,
      "",
      location.pathname + location.search,
    );
  const root = document.documentElement;
  // iPadOS can identify as a Mac; touch capability distinguishes it from Macs.
  const nativeTouch = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  root.classList.toggle("ios-native-scroll", nativeTouch);
  const journey = document.querySelector(".journey");
  const stage = document.querySelector(".journey-stage");
  const elephantRide = document.querySelector(".journey-elephant");
  const scenes = [...document.querySelectorAll(".scene")];
  // The final walking chapter needs time for every shop, within the same film.
  const sceneSpans = scenes.map((scene) => Number(scene.dataset.scrollSpan) || 1);
  const sceneStarts = [];
  const storySpan = sceneSpans.reduce((total, span) => {
    sceneStarts.push(total);
    return total + span;
  }, 0);
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  const clamp = (v, lo = 0, hi = 1) => Math.max(lo, Math.min(hi, v));
  const ease = (v) => {
    const x = clamp(v);
    return x * x * (3 - 2 * x);
  };
  const toast = document.querySelector(".toast");
  let toastTimer;
  function notify(message) {
    toast.textContent = message;
    toast.classList.add("visible");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("visible"), 4400);
  }

  let frame = 0;
  let cinematic = false;
  let activeIndex = 0;
  let journeyTop = 0;
  let travel = 1;
  let stageHeight = 1;
  let arrivalFloor = { baseFeet: 0, planeHeight: 1 };
  let lastWidth = innerWidth;
  let lastHeight = innerHeight;
  const opening = document.querySelector(".opening-scene");
  const openingButtons = [
    ...document.querySelectorAll("[data-open-invitation]"),
  ];
  const sealButton = document.querySelector("#invitation-seal");
  let readingBoxOpen = false;
  let entryUnlocked = false;
  let entryHasAdvanced = false;
  let focusStoryOnArrival = false;
  // One user gesture runs the doors and camera move on a deliberate timeline.
  const openingSoundButton = document.querySelector("#opening-sound");
  const soundtrack = window.garbaSoundtrack;
  let entryFrame = 0;
  const autoScrollButton = document.querySelector("#autoscroll-toggle");
  const timeline = window.garbaTimeline;
  let autoScrolling = false, autoScrollFrame = 0;
  let autoStarted = 0, autoOffset = 0, autoElapsed = 0, autoLastPosition = -1;
  function autoPosition(cursor) {
    const end = Math.max(0, root.scrollHeight - innerHeight);
    const storyEnd = cinematic ? journeyTop + travel
      : document.querySelector(".finale").getBoundingClientRect().top + scrollY;
    if (cursor >= storySpan)
      return Math.min(end, storyEnd + (end - storyEnd) * (cursor - storySpan));
    if (cinematic) return journeyTop + cursor / storySpan * travel;
    let index = scenes.length - 1;
    while (index > 0 && cursor < sceneStarts[index]) index--;
    const from = scenes[index].getBoundingClientRect().top + scrollY;
    const to = index + 1 < scenes.length
      ? scenes[index + 1].getBoundingClientRect().top + scrollY : storyEnd;
    return Math.min(end, from + (to - from) * (cursor - sceneStarts[index]) / sceneSpans[index]);
  }
  function autoTimeAtPosition(position) {
    // Monotonic mapping also supports normal-flow / reduced-motion layouts.
    let low = 0, high = storySpan + 1;
    for (let i = 0; i < 40; i++) {
      const middle = (low + high) / 2;
      if (autoPosition(middle) < position) low = middle; else high = middle;
    }
    return timeline.timeAt((low + high) / 2);
  }
  function updateAutoScrollButton() {
    autoScrollButton.setAttribute("aria-pressed", String(autoScrolling));
    autoScrollButton.setAttribute("aria-label", autoScrolling ? "Pause automatic scrolling" : "Start automatic scrolling");
    autoScrollButton.querySelector(".control-label").textContent = autoScrolling ? "Pause" : "Autoscroll";
    autoScrollButton.querySelector("use").setAttribute("href", `assets/ui-icons.svg#${autoScrolling ? "pause" : "play"}`);
  }
  function stopAutoScroll() {
    if (autoScrolling) delete opening.dataset.entering;
    autoScrolling = false;
    cancelAnimationFrame(autoScrollFrame);
    autoScrollFrame = 0;
    updateAutoScrollButton();
  }
  function advanceAutoScroll(now) {
    if (!autoScrolling) return;
    if (document.hidden || document.querySelector("dialog[open]")) { stopAutoScroll(); return; }
    // Absolute elapsed time: a dropped rendering frame cannot lengthen the journey.
    autoElapsed = Math.min(timeline.duration, autoOffset + Math.max(0, now - autoStarted) / 1000);
    if (autoElapsed < timeline.openingDuration && cinematic) opening.dataset.entering = "true";
    else delete opening.dataset.entering;
    window.scrollTo({ top: autoPosition(timeline.cursorAt(autoElapsed)), behavior: "instant" });
    autoLastPosition = scrollY;
    if (autoElapsed >= timeline.duration) { stopAutoScroll(); return; }
    autoScrollFrame = requestAnimationFrame(advanceAutoScroll);
  }
  autoScrollButton.hidden = false;
  autoScrollButton.addEventListener("click", () => {
    cancelManualScroll();
    if (autoScrolling) { stopAutoScroll(); return; }
    if (document.querySelector("dialog[open]")) return;
    const fresh = !entryUnlocked || scrollY <= journeyTop;
    if (entryFrame) { cancelAnimationFrame(entryFrame); entryFrame = 0; }
    if (fresh) {
      entryUnlocked = true;
      readingBoxOpen = true;
      root.classList.remove("invitation-locked");
      soundtrack?.begin(cinematic);
      if (!cinematic) updateOpening(1);
      focusStoryOnArrival = cinematic;
    }
    if (scrollY >= root.scrollHeight - innerHeight - 1) return;
    autoOffset = fresh ? 0 : Math.abs(scrollY - autoLastPosition) <= 2
      ? autoElapsed : autoTimeAtPosition(scrollY);
    autoScrolling = true;
    autoStarted = performance.now();
    if (autoOffset < timeline.openingDuration && cinematic) opening.dataset.entering = "true";
    updateAutoScrollButton();
    autoScrollFrame = requestAnimationFrame(advanceAutoScroll);
  });
  const scrollControl = target => target?.closest?.("#autoscroll-toggle, #soundtrack-toggle, #opening-sound");
  addEventListener("wheel", stopAutoScroll, { passive:true });
  addEventListener("touchstart", event => { if (!scrollControl(event.target)) stopAutoScroll(); }, { passive:true });
  document.addEventListener("pointerdown", event => { if (!scrollControl(event.target)) stopAutoScroll(); }, { passive:true });
  document.addEventListener("keydown", event => {
    const activatesControl = event.key === " " && scrollControl(event.target);
    if (event.key === "Escape" || (!activatesControl && ["ArrowUp","ArrowDown","PageUp","PageDown","Home","End"," "].includes(event.key))) stopAutoScroll();
  });
  document.addEventListener("click", event => {
    if (event.target.closest?.("a,button,input,select,textarea") && !scrollControl(event.target)) stopAutoScroll();
  });
  document.addEventListener("visibilitychange", () => { if (document.hidden) stopAutoScroll(); });
  addEventListener("pagehide", stopAutoScroll);
  // Manual input stays continuous, with eased reading zones around each dialogue.
  // Autoscroll has its own timeline and never uses this speed profile.
  let manualFrame = 0, manualTarget = 0, manualPosition = 0, manualLast = 0;
  let touchY = null;
  const dialogueBeats = scenes.flatMap((scene, index) =>
    [...scene.querySelectorAll(".dialogue-beat")].map(line => {
      const beat = Number(line.dataset.at) || 0;
      const local = scene.id === "beginning" && beat === 0 ? .42 : Math.max(.06, beat + .015);
      return { line, cursor: sceneStarts[index] + local * sceneSpans[index] };
    }));
  function stopManualMotion() {
    cancelAnimationFrame(manualFrame);
    manualFrame = 0;
  }
  function cancelManualScroll() {
    stopManualMotion();
  }
  function dialogueCenters() {
    return dialogueBeats.map(({ line, cursor }) => cinematic
      ? journeyTop + cursor / storySpan * travel
      : Math.max(0, line.getBoundingClientRect().top + scrollY - innerHeight * .35));
  }
  function dialogueSpeed(position, centers) {
    const radius = clamp(innerHeight * .26, 160, 260);
    const distance = Math.min(...centers.map(center => Math.abs(position - center)));
    // Smoothstep joins the ordinary speed without a sudden brake or a full stop.
    return .22 + .78 * ease(distance / radius);
  }
  function advanceManualScroll(now) {
    manualFrame = 0;
    if (autoScrolling || entryFrame || document.hidden || document.querySelector("dialog[open]")) {
      cancelManualScroll(); return;
    }
    const direction = Math.sign(manualTarget - manualPosition);
    const factor = dialogueSpeed(manualPosition, dialogueCenters());
    const speed = clamp(innerHeight * 1.6, 800, 1600) * factor;
    // Keep the remaining coast short even when a fast gesture enters a slow zone.
    const remaining = Math.min(Math.abs(manualTarget - manualPosition), Math.min(700, innerHeight * .85) * factor);
    manualTarget = manualPosition + direction * remaining;
    // A same-frame input can arrive after the RAF timestamp; never step backwards.
    const step = Math.min(64, Math.max(0, now - manualLast)) / 1000 * speed;
    manualLast = now;
    manualPosition += direction * Math.min(remaining, step);
    window.scrollTo({ top: manualPosition, behavior: "instant" });
    if (Math.abs(manualTarget - manualPosition) > .5) manualFrame = requestAnimationFrame(advanceManualScroll);
  }
  function manualScroll(delta) {
    if (!delta || (cinematic && !entryUnlocked)) return;
    const now = performance.now();
    if (!manualFrame) { manualPosition = scrollY; manualTarget = scrollY; }
    const budget = Math.min(700, innerHeight * .85);
    const amount = clamp(delta * 1.5, -budget, budget);
    if (Math.sign(amount) !== Math.sign(manualTarget - manualPosition)) manualTarget = manualPosition;
    manualTarget = clamp(manualTarget + amount, Math.max(0, manualPosition - budget),
      Math.min(root.scrollHeight - innerHeight, manualPosition + budget));
    if (reduced.matches) {
      // Immediate, spatially weighted steps: no animated coast and no dialogue lock.
      // Sampling along the path prevents a large key/wheel event jumping a slow zone.
      const centers = dialogueCenters(), direction = Math.sign(manualTarget - manualPosition);
      let input = Math.abs(manualTarget - manualPosition);
      while (input > 0) {
        const step = Math.min(input, 16);
        manualPosition += direction * step * dialogueSpeed(manualPosition, centers);
        input -= step;
      }
      window.scrollTo({ top: manualPosition, behavior: "instant" });
    } else if (!manualFrame) {
      manualLast = now;
      manualFrame = requestAnimationFrame(advanceManualScroll);
    }
  }
  const localScrollTarget = target => target?.closest?.("dialog, input, textarea, select, [contenteditable=true], iframe");
  addEventListener("wheel", event => {
    if (event.ctrlKey || event.metaKey || localScrollTarget(event.target) || document.querySelector("dialog[open]") || Math.abs(event.deltaX) > Math.abs(event.deltaY)) return;
    event.preventDefault();
    manualScroll(event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? innerHeight : 1));
  }, { passive:false });
  if (!nativeTouch) {
    addEventListener("touchstart", event => {
      stopManualMotion();
      touchY = event.touches?.length === 1 && !localScrollTarget(event.target) && !scrollControl(event.target) ? event.touches[0].clientY : null;
    }, { passive:true });
    addEventListener("touchmove", event => {
      if (event.touches.length !== 1) { touchY = null; stopManualMotion(); return; }
      if (touchY === null || document.querySelector("dialog[open]")) return;
      const y = event.touches[0].clientY, delta = touchY - y;
      touchY = y;
      // The cinematic stage owns vertical swipes through touch-action. WebKit may
      // mark those moves non-cancelable; they still carry the finger's movement.
      if (event.cancelable) event.preventDefault();
      else if (!cinematic || !stage.contains(event.target)) return;
      manualScroll(delta * 2);
    }, { passive:false });
    for (const name of ["touchend", "touchcancel"]) addEventListener(name, () => { touchY = null; }, { passive:true });
  }
  document.addEventListener("keydown", event => {
    if (event.key === "Escape") { cancelManualScroll(); return; }
    if (event.ctrlKey || event.metaKey || event.altKey || localScrollTarget(event.target) || document.querySelector("dialog[open]")) return;
    if ([" ", "Enter"].includes(event.key) && event.target.closest?.("button,a,summary")) return;
    const direction = { ArrowDown:1, PageDown:1, End:1, ArrowUp:-1, PageUp:-1, Home:-1, " ":event.shiftKey ? -1 : 1 }[event.key];
    if (!direction) return;
    event.preventDefault();
    manualScroll(direction * (event.key.startsWith("Arrow") ? 48 : 640));
  });
  document.addEventListener("pointerdown", () => stopManualMotion(), { passive:true });
  document.addEventListener("visibilitychange", () => { if (document.hidden) cancelManualScroll(); });
  addEventListener("pagehide", cancelManualScroll);
  function cancelEntry() {
    if (entryFrame) cancelAnimationFrame(entryFrame);
    entryFrame = 0;
    delete opening.dataset.entering;
    focusStoryOnArrival = false;
    soundtrack?.cancelIntro();
  }
  function beginEntry() {
    cancelManualScroll();
    if (entryFrame) return;
    entryUnlocked = true;
    root.classList.remove("invitation-locked");
    soundtrack?.begin(cinematic);
    if (!cinematic) {
      readingBoxOpen = true;
      updateOpening(1);
      scrollToScene(document.querySelector("#beginning"), "instant");
      document.querySelector("#beginning-title").focus({ preventScroll: true });
      return;
    }
    const from = scrollY;
    const to = journeyTop + (1.42 / storySpan) * travel;
    const doorDuration = 2900, descentDuration = 3800;
    let lastEntryTime = performance.now(), elapsed = 0;
    opening.dataset.entering = "true";
    focusStoryOnArrival = true;
    const advance = (now) => {
      // The logo-only entry also adds a second to each opening phase.
      elapsed += now - lastEntryTime;
      lastEntryTime = now;
      const doorTime = clamp(elapsed / doorDuration);
      // Finish the original door/camera move, then lower the friends on silk.
      const progress = elapsed <= doorDuration
        ? doorTime < 0.66
          ? 0.48 * ease(doorTime / 0.66)
          : 0.48 + 0.52 * ease((doorTime - 0.66) / 0.34)
        : 1 + 0.42 * clamp((elapsed - doorDuration) / descentDuration);
      window.scrollTo({ top: from + (to - from) * progress / 1.42, behavior: "instant" });
      if (elapsed < doorDuration + descentDuration) entryFrame = requestAnimationFrame(advance);
      else {
        entryFrame = 0;
        delete opening.dataset.entering;
      }
    };
    entryFrame = requestAnimationFrame(advance);
  }
  openingSoundButton.hidden = false;
  for (const event of ["wheel", "touchstart"])
    addEventListener(event, (input) => {
      if (input.type === "touchstart" && scrollControl(input.target)) return;
      if (entryFrame) cancelEntry();
    }, { passive: true });
  addEventListener("pagehide", cancelEntry);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden && entryFrame) cancelEntry();
    opening.querySelector(".seal-prompt").style.animationPlayState = document.hidden ? "paused" : "running";
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === " " && scrollControl(event.target)) return;
    if (entryFrame && ["Escape", "ArrowUp", "ArrowDown", "PageUp", "PageDown", "Home", "End", " "].includes(event.key)) cancelEntry();
  });
  document.addEventListener("pointerdown", (event) => {
    if (entryFrame && !event.target.closest?.("#invitation-seal, #opening-sound, #soundtrack-toggle, #autoscroll-toggle")) cancelEntry();
  }, { passive: true });
  function updateOpening(open, enter = 0) {
    opening.style.setProperty("--enter", enter.toFixed(4));
    // Counter-scale the courtyard to keep it sharp as the box aperture expands.
    opening.style.setProperty(
      "--portal-inverse",
      (1.08 / (1 + enter * 3.5)).toFixed(4),
    );
    opening.style.setProperty("--entry-copy", (1 - clamp(open * 2)).toFixed(4));
    opening.style.setProperty("--open", open.toFixed(4));
    opening.style.setProperty("--seal", (1 - clamp(open * 4)).toFixed(4));
    const revealed = open >= 0.95;
    opening.dataset.open = String(revealed);
    openingButtons.forEach((button) => {
      button.hidden = button === sealButton && open >= 0.25;
      button.setAttribute("aria-expanded", String(revealed));
      button.setAttribute(
        "aria-label",
        revealed ? "Follow their story" : "Open your invitation",
      );
    });
  }

  // Dialogue beats and the original illustrated cast advance with native scroll.
  function animateStory(scene, progress) {
    const beats = [...scene.querySelectorAll(".dialogue-beat")];
    let spoken = 0;
    beats.forEach((line, i) => {
      if (progress >= Number(line.dataset.at)) spoken = i;
    });
    beats.forEach((line, i) => {
      line.classList.toggle("is-speaking", i === spoken);
      line.setAttribute("aria-hidden", String(i !== spoken));
    });
    scene.dataset.speaker = beats[spoken]?.dataset.speaker || "him";
    const w = innerWidth,
      h = stageHeight;
    const person = (
      who,
      x = 0,
      y = 0,
      opacity = 1,
      scale = 1,
      pose = "think",
      tilt = 0,
    ) => {
      const el = scene.querySelector(`.story-person.${who}`);
      if (!el) return;
      el.style.setProperty("--person-x", `${x.toFixed(2)}px`);
      el.style.setProperty("--person-y", `${y.toFixed(2)}px`);
      el.style.setProperty("--person-opacity", opacity.toFixed(3));
      el.style.setProperty("--person-scale", scale.toFixed(3));
      el.style.setProperty("--person-tilt", `${tilt.toFixed(2)}deg`);
      el.dataset.pose = pose;
    };
    const together = (opacity, scale, y) => {
      scene.style.setProperty("--together-opacity", opacity.toFixed(3));
      scene.style.setProperty("--together-scale", scale.toFixed(3));
      scene.style.setProperty("--together-y", `${y.toFixed(2)}px`);
    };
    if (scene.id === "beginning") {
      for (const [who, delay, direction] of [["man", 0, 1], ["woman", 0.025, -1]]) {
        const lower = ease((progress - delay) / 0.28);
        const land = ease((progress - 0.29 - delay) / 0.065);
        const el = scene.querySelector(`.story-person.${who}`);
        person(who);
        el.style.setProperty("--descent-y", `${(-(1 - lower) * h * 1.25).toFixed(2)}px`);
        el.style.setProperty("--descent-turn", `${(Math.sin(lower * Math.PI * 2) * 4 * direction * (1 - land)).toFixed(2)}deg`);
        el.style.setProperty("--landed", land.toFixed(4));
      }
      // Finish before the automatic endpoint; scroll positions round to pixels.
      const arrived = ease((progress - 0.385) / 0.025);
      scene.style.setProperty("--arrival-copy", arrived.toFixed(4));
      beats.forEach((line, i) => line.setAttribute("aria-hidden", String(arrived < 1 || i !== spoken)));
    }
    if (scene.id === "the-plan") {
      const board = ease((progress - 0.25) / 0.22);
      const fade = 1 - ease((progress - 0.36) / 0.11);
      person(
        "man",
        board * w * 0.10,
        -board * h * 0.31,
        fade,
        0.7 - board * 0.25,
        board > 0 ? "walk" : "think",
      );
      person(
        "woman",
        -board * w * 0.12,
        -board * h * 0.3,
        fade,
        0.7 - board * 0.25,
        board > 0 ? "walk" : "think",
      );
    }
    if (scene.id === "the-drive")
      scene.style.setProperty("--road-zoom", (1 + progress * 0.16).toFixed(3));
    if (scene.id === "arrival") {
      const step = ease((progress - 0.17) / 0.18);
      const joined = ease((progress - 0.34) / 0.07),
        // Continue into the passage until the scene dissolves.
        walk = clamp((progress - 0.41) / 0.59);
      const passage = ease((progress - 0.74) / 0.16);
      scene.style.setProperty("--passage-opacity", passage.toFixed(4));
      person("man", -(1 - step) * w * .1, -(1 - step) * h * .24, step * (1 - joined), .65, "walk");
      person("woman", -(1 - step) * w * .22, -(1 - step) * h * .24, step * (1 - joined), .65, "walk");
      // Follow the center carpet in image space, accounting for cover cropping.
      // The far floor sits below the doorway; a viewport-only path lifted the
      // friends into the backdrop. Keep moving until the dissolve completes.
      const floorY = h / 2 + arrivalFloor.planeHeight * .19 * (1.035 + progress * .045);
      together(joined, 0.8 - walk * 0.49, walk * (floorY - arrivalFloor.baseFeet));
    }
    if (scene.id === "a-memory") {
      const gather = ease(progress / 0.22);
      const showPhoto = scene.dataset.photo
        ? scene.dataset.photo === "true"
        : progress > 0.54;
      const photo = showPhoto ? 1 : 0;
      scene.style.setProperty("--photo-opacity", photo);
      scene.style.setProperty("--photo-scale", showPhoto ? 1 : 0.85);
      scene.style.setProperty("--dialogue-opacity", 1 - photo);
      person(
        "man",
        (1 - gather) * -w * 0.1,
        0,
        1 - photo,
        1,
        gather < 1 ? "walk" : "think",
      );
      person(
        "woman",
        (1 - gather) * w * 0.1,
        0,
        1 - photo,
        1,
        gather < 1 ? "walk" : "think",
      );
      const button = scene.querySelector("#take-story-photo");
      button.setAttribute("aria-pressed", String(showPhoto));
      button.querySelector(".control-label").textContent = showPhoto
        ? "Back to the moment"
        : "Take their photo";
    }
    if (scene.id === "the-stage")
      together(1, 1 - progress * 0.12, -progress * h * 0.025);
    if (scene.id === "celebration") {
      const approach = ease((progress - 0.08) / 0.78);
      scene.style.setProperty("--garba-zoom", (1 + approach * 1.15).toFixed(4));
    }
    if (scene.id === "devotion")
      scene.style.setProperty(
        "--prayer-tilt",
        `${Math.sin(progress * Math.PI * 3) * 1.4}deg`,
      );
  }

  // One shared elephant survives the scene dissolves; only its surroundings change.
  function animateElephant(cursor) {
    const visible = cursor >= 3 && cursor < 5.58;
    elephantRide.hidden = !visible;
    elephantRide.setAttribute("aria-hidden", String(!visible));
    elephantRide.dataset.walking = String(visible && (
      cursor < 3.22 || (cursor > 3.5 && cursor < 5.08) || cursor > 5.38));
    if (!visible) return;
    const enter = ease((cursor - 3.02) / .20);
    const travel = ease((cursor - 3.52) / 1.55);
    const leave = ease((cursor - 5.38) / .18);
    const board = ease((cursor - 3.36) / .11);
    const dismount = ease((cursor - 5.17) / .18);
    elephantRide.style.setProperty("--ride-x", `${((1 - enter) * -innerWidth * 1.2 + travel * innerWidth * .05 + leave * innerWidth * 1.2).toFixed(2)}px`);
    elephantRide.style.setProperty("--ride-opacity", (1 - ease((cursor - 5.54) / .04)).toFixed(4));
    elephantRide.style.setProperty("--riders-opacity", (board * (1 - dismount)).toFixed(4));
    elephantRide.style.setProperty("--riders-y", `${(dismount * stageHeight * .13).toFixed(2)}px`);
  }

  function positionDialogue(scene) {
    const line = scene.querySelector(".dialogue-beat.is-speaking");
    if (!line) return;
    const her = line.dataset.speaker === "her";
    let target, xPart = 0.5, yPart = 0.08;
    if (scene.id === "the-invitation") {
      target = scene.querySelector(her ? ".handoff-woman" : ".handoff-man");
    } else if (scene.id === "arrival" && !elephantRide.hidden &&
      Number(elephantRide.style.getPropertyValue("--riders-opacity")) > .4) {
      target = elephantRide.querySelector(".elephant-riders");
      xPart = her ? .32 : .72;
      yPart = .12;
    } else {
      const together = scene.querySelector(".together-art");
      if (together && Number(getComputedStyle(together).opacity) > 0.5) {
        target = together;
        xPart = her ? 0.72 : 0.28;
      } else target = scene.querySelector(her ? ".story-person.woman" : ".story-person.man");
    }
    if (!target) return;
    const bounds = target.getBoundingClientRect();
    const box = scene.getBoundingClientRect();
    const headX = bounds.left - box.left + bounds.width * xPart;
    const headY = bounds.top - box.top + bounds.height * yPart;
    const width = line.offsetWidth;
    const centre = clamp(headX, width / 2 + 12, box.width - width / 2 - 12);
    let bubbleY = headY - 12;
    // The shared elephant is above the scene's stacking context. Keep the
    // arrival bubble and its tail physically clear while the elephant exits.
    if (scene.id === "arrival" && !elephantRide.hidden) {
      const ride = elephantRide.getBoundingClientRect();
      const left = box.left + centre - width / 2;
      if (ride.right > left && ride.left < left + width)
        bubbleY = Math.min(bubbleY, ride.top - box.top - 16);
    }
    line.style.setProperty("--bubble-x", `${centre.toFixed(2)}px`);
    line.style.setProperty("--bubble-y", `${bubbleY.toFixed(2)}px`);
    line.style.setProperty("--bubble-tip", `${clamp(headX - centre + width / 2, 14, width - 14).toFixed(2)}px`);
    line.style.setProperty("--speaker-visible", getComputedStyle(target).opacity);
    if (scene.id === "the-invitation") fitInvitationLogo(scene);
  }
  function fitInvitationLogo(scene) {
    const mobile = innerWidth <= 650;
    const svg = scene.querySelector(mobile ? ".wall-brand-mobile" : ".wall-brand-desktop");
    const logo = svg.querySelector("image");
    const matrix = svg.getScreenCTM?.();
    if (!matrix) return;
    const upper = scene.querySelector(".story-title").getBoundingClientRect().bottom + (!mobile && innerHeight <= 800 ? 22 : 30);
    const lower = Math.min(...[...scene.querySelectorAll(".dialogue-beat")].map(beat => {
      const person = scene.querySelector(beat.dataset.speaker === "her" ? ".handoff-woman" : ".handoff-man");
      const head = person.getBoundingClientRect();
      return head.top + head.height * .08 - 12 - beat.offsetHeight;
    })) - 12;
    const preferred = new DOMPoint(mobile ? 512 : 768, mobile ? 465 : 370).matrixTransform(matrix);
    const ratio = mobile ? 230 / 157 : 152 / 104;
    const height = Math.max(0, Math.min((mobile ? 157 : 104) * matrix.d, lower - upper));
    const top = clamp(preferred.y, upper, Math.max(upper, lower - height));
    const point = new DOMPoint(preferred.x, top).matrixTransform(matrix.inverse());
    const artHeight = height / matrix.d;
    logo.style.setProperty("x", `${point.x - artHeight * ratio / 2}px`);
    logo.style.setProperty("y", `${point.y}px`);
    logo.style.setProperty("width", `${artHeight * ratio}px`);
    logo.style.setProperty("height", `${artHeight}px`);
  }
  function clearSceneState() {
    document.querySelectorAll(".invitation-wall-branding image").forEach(logo => logo.removeAttribute("style"));
    elephantRide.hidden = true;
    elephantRide.setAttribute("aria-hidden", "true");
    for (const scene of scenes) {
      scene.classList.remove("is-visible", "is-active");
      scene.inert = false;
      scene.removeAttribute("aria-hidden");
      scene
        .querySelectorAll(".dialogue-beat")
        .forEach((line) => { line.removeAttribute("aria-hidden"); line.removeAttribute("style"); });
      scene
        .querySelectorAll(".story-person")
        .forEach((person) => person.removeAttribute("style"));
      [
        "--together-opacity",
        "--together-scale",
        "--together-y",
        "--road-zoom",
        "--prayer-tilt",
        "--dialogue-opacity",
        "--arrival-copy",
        "--passage-opacity",
        "--garba-zoom",
      ].forEach((prop) => scene.style.removeProperty(prop));
    }
  }
  function measure() {
    stageHeight = stage.clientHeight || innerHeight;
    journeyTop = journey.getBoundingClientRect().top + scrollY;
    travel = Math.max(1, journey.offsetHeight - stageHeight);
    const arrival = document.querySelector("#arrival");
    const friends = arrival.querySelector(".together-art");
    const art = arrival.querySelector(".entry-passage-art img");
    // Read geometry only on layout changes, never on each animation frame.
    arrivalFloor = {
      baseFeet: friends.offsetTop + friends.offsetHeight * .95,
      planeHeight: Math.max(stageHeight, arrival.clientWidth * Number(art.getAttribute("height")) / Number(art.getAttribute("width"))),
    };
  }
  function setMotion(preservePlace = false) {
    cancelManualScroll();
    stopAutoScroll();
    cancelEntry();
    const previous = activeIndex;
    const wasCinematic = cinematic;
    const wasWithin = scrollY < journeyTop + journey.offsetHeight;
    const finaleOffset = scrollY - (journeyTop + journey.offsetHeight);
    cinematic = !reduced.matches && innerHeight >= 640;
    root.classList.toggle("cinematic", cinematic);
    root.classList.toggle("read-mode", !cinematic);
    // Use a stable viewport height; mobile address-bar changes do not reshape the story.
    journey.style.setProperty(
      "--journey-height",
      `${storySpan * innerHeight * 1.32}px`,
    );
    clearSceneState();
    if (!cinematic) updateOpening(readingBoxOpen ? 1 : 0);
    if (nativeTouch) {
      // Capture the same small-viewport stage once per real layout change.
      // Safari toolbar/keyboard resizes must not rebuild or seek the story.
      root.style.removeProperty("--ios-stage-height");
      root.style.setProperty("--ios-stage-height", `${stage.clientHeight || innerHeight}px`);
    }
    measure();
    if (
      cinematic &&
      scenes.some(
        (s) => (s.querySelector(".scene-copy")?.scrollHeight || 0) > stageHeight - 180,
      )
    ) {
      cinematic = false; // Enlarged text is more important than pinned animation.
      root.classList.remove("cinematic");
      root.classList.add("read-mode");
      updateOpening(readingBoxOpen ? 1 : 0);
      measure();
    }
    root.classList.toggle("invitation-locked", cinematic && !entryUnlocked);
    openingSoundButton.hidden = !cinematic;
    if (preservePlace && wasCinematic !== cinematic) {
      const top = !wasWithin
        ? journeyTop + journey.offsetHeight + finaleOffset
        : cinematic
          ? journeyTop + (sceneStarts[previous] / storySpan) * travel
          : scenes[previous].getBoundingClientRect().top + scrollY;
      window.scrollTo({ top, behavior: "instant" });
    }
    renderScroll();
  }
  function renderScroll() {
    frame = 0;
    // Wheel, touch, keyboard and restored scroll positions cannot open a sealed box.
    if (cinematic) {
      if (entryUnlocked && entryHasAdvanced && !entryFrame && !autoScrolling && scrollY <= journeyTop) {
        entryUnlocked = false;
        entryHasAdvanced = false;
        soundtrack?.reset();
      }
      root.classList.toggle("invitation-locked", !entryUnlocked);
      if (!entryUnlocked && scrollY !== journeyTop)
        window.scrollTo({ top: journeyTop, behavior: "instant" });
    }
    root.style.setProperty(
      "--progress",
      clamp(scrollY / Math.max(1, root.scrollHeight - innerHeight)).toFixed(5),
    );
    if (!cinematic) {
      soundtrack?.setScene(1.42);
      let nearest = 0,
        distance = Infinity;
      scenes.forEach((s, i) => {
        const r = Math.abs(s.getBoundingClientRect().top);
        if (r < distance) {
          distance = r;
          nearest = i;
        }
      });
      activeIndex = nearest;
      return;
    }
    const cursor = clamp((scrollY - journeyTop) / travel) * storySpan;
    if (entryUnlocked) soundtrack?.setScene(cursor);
    if (entryUnlocked && cursor > .05) entryHasAdvanced = true;
    animateElephant(cursor);
    let base = scenes.length - 1;
    while (base > 0 && cursor < sceneStarts[base]) base--;
    const local = clamp((cursor - sceneStarts[base]) / sceneSpans[base]);
    const fadeAt = scenes[base].id === "arrival" ? .96 : scenes[base].id === "a-memory" ? .90 : .70;
    const blend = base < scenes.length - 1 ? ease((local - fadeAt) / (1 - fadeAt)) : 0;
    const selected = blend > 0.5 ? base + 1 : base;
    scenes.forEach((scene, i) => {
      const isBase = i === base;
      const isNext = i === base + 1 && blend > 0;
      const visible = isBase || isNext;
      const active = i === selected;
      scene.classList.toggle("is-visible", visible);
      scene.classList.toggle("is-active", active);
      scene.inert = !active;
      scene.setAttribute("aria-hidden", String(!active));
      if (i <= selected + 1)
        scene.querySelectorAll("img[loading=lazy]").forEach((img) => {
          img.loading = "eager";
        });
      if (!visible) return;
      const progress = isBase ? local : 0;
      animateStory(scene, progress);
      if (["partner-road", "the-invitation", "celebration"].includes(scene.id))
        scene.dispatchEvent(new CustomEvent("story-progress", { detail: progress }));
      scene.style.setProperty("--scene-opacity", isBase ? 1 : blend.toFixed(4));
      scene.style.setProperty(
        "--copy-opacity",
        isBase
          ? (1 - ease(blend * 2)).toFixed(4)
          : ease((blend - 0.45) / 0.55).toFixed(4),
      );
      scene.style.setProperty(
        "--copy-y",
        `${(isBase ? -blend * 18 : (1 - blend) * 18).toFixed(2)}px`,
      );
      scene.style.setProperty("--zoom", (1.035 + progress * 0.045).toFixed(4));
      scene.style.setProperty("--pan", `${(progress * -10).toFixed(2)}px`);
      if (scene === opening)
        updateOpening(
          ease((progress - 0.05) / 0.4),
          ease((progress - 0.24) / 0.6),
        );
    });
    scenes.filter((scene) => scene.classList.contains("is-visible")).forEach(positionDialogue);
    const photoButton = document.querySelector("#take-story-photo");
    if (photoButton) photoButton.disabled = false;
    if (focusStoryOnArrival && scenes[selected].id === "beginning") {
      focusStoryOnArrival = false;
      document.querySelector("#beginning-title").focus({ preventScroll: true });
    }
    activeIndex = selected;
    document.querySelector("#current-chapter").textContent =
      scenes[selected].dataset.label;
    stage.style.setProperty("--dust-y", `${(cursor * -9).toFixed(2)}px`);
  }
  function schedule() {
    if (!frame) frame = requestAnimationFrame(renderScroll);
  }
  // Re-anchor after responsive art and Gujarati fonts finish decoding/layout.
  document.addEventListener("load", (event) => {
    if (event.target instanceof HTMLImageElement) schedule();
  }, true);
  document.fonts?.ready.then(schedule);
  function scrollToScene(scene, behavior = "smooth") {
    cancelManualScroll();
    stopAutoScroll();
    cancelEntry();
    const index = scenes.indexOf(scene);
    const top = cinematic
      ? journeyTop + ((sceneStarts[index] + 0.06) / storySpan) * travel
      : scene.getBoundingClientRect().top + scrollY;
    window.scrollTo({ top, behavior: reduced.matches ? "instant" : behavior });
  }
  document.querySelectorAll('a[href^="#"]').forEach((link) =>
    link.addEventListener("click", (event) => {
      const scene = scenes.find(
        (s) => `#${s.id}` === link.getAttribute("href"),
      );
      if (!scene) return;
      event.preventDefault();
      scrollToScene(scene);
    }),
  );
  openingButtons.forEach((button) => button.addEventListener("click", beginEntry));
  addEventListener("scroll", schedule, { passive: true });
  addEventListener(
    "resize",
    () => {
      if (nativeTouch && (window.visualViewport?.scale > 1 || innerWidth === lastWidth)) {
        schedule();
        return;
      }
      if (
        innerWidth !== lastWidth ||
        (innerHeight >= 640) !== (lastHeight >= 640) ||
        Math.abs(innerHeight - lastHeight) > 180
      ) {
        lastWidth = innerWidth;
        lastHeight = innerHeight;
        setMotion(true);
      } else {
        measure();
        schedule();
      }
    },
    { passive: true },
  );
  reduced.addEventListener("change", () => setMotion(true));
  setMotion();
  document.fonts?.ready.then(() => {
    setMotion(true);
  });
  const hashScene = scenes.find((s) => `#${s.id}` === location.hash);
  if (hashScene)
    requestAnimationFrame(() => scrollToScene(hashScene, "instant"));
  addEventListener("hashchange", () => {
    const target = scenes.find((s) => `#${s.id}` === location.hash);
    if (target) scrollToScene(target, "instant");
  });
  document
    .querySelector("#take-story-photo")
    .addEventListener("click", (event) => {
      const button = event.currentTarget;
      const photoScene = document.querySelector("#a-memory");
      const show = button.getAttribute("aria-pressed") !== "true";
      photoScene.dataset.photo = String(show);
      button.setAttribute("aria-pressed", String(show));
      button.querySelector(".control-label").textContent = show ? "Back to the moment" : "Take their photo";
      schedule();
    });
  const invitationViewer = document.querySelector("#original-invitation-dialog");
  let invitationOpener, invitationScroll = 0;
  document.querySelectorAll("[data-view-original]").forEach((link) => {
    link.addEventListener("click", (event) => {
      if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      cancelEntry();
      invitationOpener = link;
      invitationScroll = scrollY;
      invitationViewer.showModal();
    });
  });
  invitationViewer.addEventListener("close", () => {
    window.scrollTo({ top: invitationScroll, behavior: "instant" });
    invitationOpener?.focus({ preventScroll: true });
  });

  document.querySelectorAll("dialog").forEach((dialog) => {
    dialog
      .querySelector("[data-close]")
      .addEventListener("click", () => dialog.close());
    dialog.addEventListener("click", (event) => {
      if (event.target !== dialog) return;
      const r = dialog.getBoundingClientRect();
      if (
        event.clientX < r.left ||
        event.clientX > r.right ||
        event.clientY < r.top ||
        event.clientY > r.bottom
      )
        dialog.close();
    });
  });

  document
    .querySelector("#share-invitation")
    .addEventListener("click", async () => {
      const url = location.origin + location.pathname;
      const data = {
        title: "The Garba Experience",
        text: "Join me for an evening with Kinjal Dave. 9 October 2026 · 7:30 pm onwards · Ahmedabad.",
        url,
      };
      try {
        if (navigator.share) await navigator.share(data);
        else if (navigator.clipboard?.writeText) {
          await navigator.clipboard.writeText(url);
          notify("Invitation link copied. See you in the circle.");
        } else {
          window.prompt("Copy the invitation link:", url);
        }
      } catch (error) {
        if (error.name !== "AbortError")
          notify(
            "Sharing is unavailable. You can copy the address from your browser.",
          );
      }
    });

  // Local-only photo keepsake: no upload, camera access, account or storage service.
  const memory = document.querySelector("#memory-dialog");
  const canvas = document.querySelector("#memory-canvas");
  const context = canvas.getContext("2d");
  const download = document.querySelector("#download-memory");
  const status = document.querySelector("#memory-status");
  const initialMemoryStatus = status.textContent;
  let photoVersion = 0;
  let downloadUrl;
  document
    .querySelector("#make-memory")
    .addEventListener("click", () => memory.showModal());
  document
    .querySelector("#memory-photo")
    .addEventListener("change", async (event) => {
      const file = event.target.files[0];
      if (!file) return;
      const version = ++photoVersion;
      download.hidden = true;
      canvas.classList.remove("has-photo");
      if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
        status.textContent = "Please choose a JPG, PNG or WebP photo.";
        return;
      }
      if (file.size > 20 * 1024 * 1024) {
        status.textContent = "Please choose a photo smaller than 20 MB.";
        return;
      }
      status.textContent = "Creating your keepsake…";
      let photo;
      try {
        photo = await createImageBitmap(file);
        await document.fonts.ready;
        if (version !== photoVersion) return;
        const w = 1080,
          h = 1350;
        context.fillStyle = "#183b31";
        context.fillRect(0, 0, w, h);
        context.strokeStyle = "#c7a66b";
        context.lineWidth = 2;
        context.strokeRect(28, 28, w - 56, h - 56);
        context.strokeRect(39, 39, w - 78, h - 78);
        context.fillStyle = "#eadbb6";
        context.textAlign = "center";
        context.font = "22px Manrope, Arial";
        context.fillText("THE GARBA EXPERIENCE", w / 2, 105);
        const x = 80,
          y = 150,
          pw = 920,
          ph = 900;
        const scale = Math.max(pw / photo.width, ph / photo.height);
        context.save();
        context.beginPath();
        context.rect(x, y, pw, ph);
        context.clip();
        context.drawImage(
          photo,
          x + (pw - photo.width * scale) / 2,
          y + (ph - photo.height * scale) / 2,
          photo.width * scale,
          photo.height * scale,
        );
        context.restore();
        context.font = 'italic 68px "Cormorant Garamond", Georgia';
        context.fillText("Our night to remember.", w / 2, 1160);
        context.font = "20px Manrope, Arial";
        context.fillText("AHMEDABAD  ·  09 OCTOBER 2026", w / 2, 1224);
        context.font = "17px Manrope, Arial";
        context.fillText("Devotion. Rhythm. Togetherness.", w / 2, 1270);
        const blob = await new Promise((resolve) =>
          canvas.toBlob(resolve, "image/png"),
        );
        if (version !== photoVersion) return;
        if (!blob) throw new Error("Canvas export failed");
        if (downloadUrl) URL.revokeObjectURL(downloadUrl);
        downloadUrl = URL.createObjectURL(blob);
        download.href = downloadUrl;
        download.hidden = false;
        canvas.classList.add("has-photo");
        status.textContent =
          "Your keepsake is ready. Save it to share with your friends.";
      } catch {
        if (version === photoVersion)
          status.textContent =
            "That photo could not be opened. Please try another JPG, PNG or WebP.";
      } finally {
        photo?.close();
      }
    });
  function resetReloadState() {
    cancelManualScroll();
    stopAutoScroll();
    soundtrack?.reset();
    cancelEntry();
    document
      .querySelectorAll("dialog[open]")
      .forEach((dialog) => dialog.close());
    document.querySelectorAll("details[open]").forEach((details) => {
      details.open = false;
    });
    document.activeElement?.blur();
    clearTimeout(toastTimer);
    toast.classList.remove("visible");
    autoElapsed = autoOffset = 0;
    autoLastPosition = -1;
    readingBoxOpen = false;
    entryUnlocked = false;
    entryHasAdvanced = false;
    focusStoryOnArrival = false;
    const photoScene = document.querySelector("#a-memory");
    delete photoScene.dataset.photo;
    photoScene.style.setProperty("--photo-opacity", "0");
    photoScene.style.setProperty("--photo-scale", "0.85");
    photoScene.style.setProperty("--dialogue-opacity", "1");
    const photoButton = document.querySelector("#take-story-photo");
    photoButton.setAttribute("aria-pressed", "false");
    photoButton.querySelector(".control-label").textContent = "Take their photo";
    ++photoVersion; // Ignore any photo processing that was still pending.
    if (downloadUrl) URL.revokeObjectURL(downloadUrl);
    downloadUrl = undefined;
    download.removeAttribute("href");
    download.hidden = true;
    document.querySelector("#memory-photo").value = "";
    canvas.classList.remove("has-photo");
    canvas.width = canvas.width;
    status.textContent = initialMemoryStatus;
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    setMotion();
    updateOpening(0);
  }
  // Reset immediately, then again after the browser restores form/page state.
  if (isReload) resetReloadState();
  addEventListener("pageshow", (event) => {
    if (isReload && !event.persisted) resetReloadState();
  });

  // Retire older cache-first versions without caching personal photos.
  if ("serviceWorker" in navigator)
    navigator.serviceWorker.register("sw.js").catch(() => {});
})();

;
/* button-motion.js */
/* Motion stays on controls; native clicks, links and story scrolling are untouched. */
(() => {
  "use strict";
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  const controls = document.querySelectorAll(
    "button:not(.box-hit-area):not(.shop-open), a.outline-button, a.book-button, a.header-link, a.text-button, .event-links a, .photo-input",
  );
  const timers = new WeakMap();
  controls.forEach((control) => control.classList.add("button-motion"));

  function pulse(control, x = 50, y = 50) {
    if (
      !control ||
      reduced.matches ||
      document.documentElement.classList.contains("read-mode") ||
      control.matches(":disabled, [aria-disabled='true']") ||
      control.closest("[inert]")
    )
      return;
    control.style.setProperty("--press-x", `${Math.max(0, Math.min(100, x))}%`);
    control.style.setProperty("--press-y", `${Math.max(0, Math.min(100, y))}%`);
    clearTimeout(timers.get(control));
    control.classList.remove("button-pressed");
    // Restart the short pulse even when the visitor taps twice quickly.
    void control.offsetWidth;
    control.classList.add("button-pressed");
    timers.set(
      control,
      setTimeout(() => {
        control.classList.remove("button-pressed");
        timers.delete(control);
      }, 560),
    );
  }
  document.addEventListener(
    "pointerdown",
    (event) => {
      if (event.button !== 0 || !event.isPrimary) return;
      const control = event.target.closest?.(".button-motion");
      if (!control) return;
      const rect = control.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      pulse(
        control,
        ((event.clientX - rect.left) / rect.width) * 100,
        ((event.clientY - rect.top) / rect.height) * 100,
      );
    },
    { passive: true },
  );
  document.addEventListener("keydown", (event) => {
    if (event.repeat) return;
    const control = event.target.closest?.(".button-motion");
    if (
      event.key === "Enter" ||
      (event.key === " " && control?.tagName === "BUTTON")
    )
      pulse(control);
  });
})();

;
/* browser-safety.js */
/* A bounded, iOS-only rendering safety net. No timeline or asset changes. */
(() => {
  'use strict';
  const root = document.documentElement;
  if (!root.classList.contains('ios-native-scroll')) return;
  let frame = 0, last = 0, windowStart = 0, samples = 0, slow = 0, badWindows = 0;
  let scrollingUntil = 0, pageVisible = true;
  const canSample = () => pageVisible && !document.hidden &&
    root.classList.contains('cinematic') &&
    !root.classList.contains('safety-light-effects') && !document.querySelector('dialog[open]');
  function stop() {
    cancelAnimationFrame(frame);
    frame = last = windowStart = samples = slow = badWindows = 0;
  }
  function sample(now) {
    frame = 0;
    if (!canSample() || now > scrollingUntil) { stop(); return; }
    if (!windowStart) windowStart = now;
    const delta = last ? now - last : 0;
    last = now;
    // Ignore isolated long stalls and suspension; observe sustained low cadence.
    if (delta > 0 && delta < 250) { samples++; if (delta > 40) slow++; }
    if (now - windowStart >= 2500) {
      badWindows = samples >= 30 && slow / samples > .45 ? badWindows + 1 : 0;
      windowStart = now; samples = slow = 0;
      if (badWindows >= 2) {
        root.classList.add('safety-light-effects');
        stop();
        return;
      }
    }
    frame = requestAnimationFrame(sample);
  }
  addEventListener('scroll', () => {
    if (!canSample()) return;
    scrollingUntil = performance.now() + 300;
    if (!frame) frame = requestAnimationFrame(sample);
  }, {passive:true});
  function visibility() {
    root.classList.toggle('safety-page-hidden', !pageVisible || document.hidden);
    if (!pageVisible || document.hidden) stop();
  }
  document.addEventListener('visibilitychange', visibility);
  addEventListener('pagehide', () => { pageVisible = false; visibility(); });
  addEventListener('pageshow', () => { pageVisible = true; visibility(); });
  visibility();
})();
