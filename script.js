const year = document.querySelector('#year');
if (year) year.textContent = new Date().getFullYear();

// Decorative achievement symbols; text labels remain the accessible meaning.
const achievementPaths = {
  medal: '<path d="m8 3 4 7 4-7M4 3h4l4 7 4-7h4l-5 9H9Z"/><circle cx="12" cy="16" r="5"/><path d="m12 13 .9 1.8 2 .3-1.45 1.4.35 2-1.8-.95-1.8.95.35-2-1.45-1.4 2-.3Z"/>',
  trophy: '<path d="M8 3h8v5a4 4 0 0 1-8 0V3ZM8 5H4v2a4 4 0 0 0 4 4m8-6h4v2a4 4 0 0 1-4 4M12 12v5m-4 4h8m-7-4h6v4H9Z"/>',
  badge: '<path d="m12 2 2.5 1.7 3 .3.8 2.9 1.7 2.5-1.2 2.8-.3 3-2.9.8L12 18l-2.6-2-2.9-.8-.3-3L5 9.4l1.7-2.5.8-2.9 3-.3L12 2Z"/><path d="m9 9 2 2 4-4M8 16l-1 6 5-3 5 3-1-6"/>'
};
document.querySelectorAll('.highlight.prize, .timeline-label.award, .highlight.selection, .timeline-label.selection').forEach(label => {
  const type = label.classList.contains('selection') ? 'badge' : /second prize/i.test(label.textContent) ? 'medal' : 'trophy';
  const svg = document.createElementNS('http://www.w3.org/2000/svg','svg');
  svg.setAttribute('viewBox','0 0 24 24');
  svg.setAttribute('width','16');
  svg.setAttribute('height','16');
  svg.setAttribute('aria-hidden','true');
  svg.setAttribute('focusable','false');
  svg.innerHTML = achievementPaths[type];
  label.prepend(svg);
});

// Paginate the existing experience entries without duplicating their content.
(() => {
  const list = document.querySelector('.timeline');
  if (!list) return;
  const cards = [...list.querySelectorAll('article')];
  if (!cards.length) return;
  list.id = 'journey-cards';
  list.classList.add('journey-cards');
  const controls = document.createElement('div');
  controls.className = 'journey-pagination';
  const summary = document.createElement('p');
  summary.className = 'journey-summary';
  summary.setAttribute('aria-live', 'polite');
  summary.setAttribute('aria-atomic', 'true');
  const navigation = document.createElement('nav');
  navigation.setAttribute('aria-label', 'Experience pages');
  controls.append(summary, navigation);
  list.after(controls);
  let page = 0;
  const mobile = window.matchMedia('(max-width: 680px)');
  const tablet = window.matchMedia('(max-width: 1050px)');
  const size = () => mobile.matches ? 1 : tablet.matches ? 2 : 3;
  function render(focusLabel) {
    const count = size();
    const pages = Math.ceil(cards.length/count);
    page = Math.min(page, pages-1);
    cards.forEach((card, index) => { card.hidden = index < page*count || index >= (page+1)*count; });
    summary.textContent = `${page*count+1}–${Math.min((page+1)*count,cards.length)} of ${cards.length} experiences`;
    navigation.replaceChildren();
    function button(text, label, target, disabled = false, current = false) {
      const b = document.createElement('button');
      b.type = 'button';
      b.textContent = text;
      b.setAttribute('aria-label',label);
      b.setAttribute('aria-controls',list.id);
      b.disabled = disabled;
      if (current) b.setAttribute('aria-current','page');
      b.addEventListener('click', () => { page=target; render(label); });
      navigation.append(b);
      if (label === focusLabel) {
        // At the boundary, move focus to the current page instead of a disabled control.
        queueMicrotask(() => (b.disabled ? navigation.querySelector('[aria-current]') : b)?.focus({preventScroll:true}));
      }
    }
    button('Previous','Previous experience page',page-1,page===0);
    for (let i=0;i<pages;i++) button(String(i+1),`Experience page ${i+1}`,i,false,i===page);
    button('Next','Next experience page',page+1,page===pages-1);
  }
  function resizePages() {
    const first = cards.findIndex(card => !card.hidden);
    page = Math.floor(Math.max(0,first)/size());
    render();
  }
  mobile.addEventListener('change',resizePages);
  tablet.addEventListener('change',resizePages);
  render();
})();

// Construction annotations report the actual rendered width in CSS pixels.
const measuredElements = document.querySelectorAll('.hero-layout, .project-art, .portrait');
function annotateDimensions(element) {
  element.dataset.measure = `${Math.round(element.getBoundingClientRect().width)} px`;
}
measuredElements.forEach(annotateDimensions);
if ('ResizeObserver' in window) {
  const measurements = new ResizeObserver(entries => {
    entries.forEach(entry => annotateDimensions(entry.target));
  });
  measuredElements.forEach(element => measurements.observe(element));
} else {
  window.addEventListener('resize', () => measuredElements.forEach(annotateDimensions));
}

if ('IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    }
  }, { threshold: 0.08 });
  document.querySelectorAll('.reveal').forEach(element => observer.observe(element));
  document.documentElement.classList.add('js-motion');
}

// Photo-derived point portrait: shallow depth and restrained pointer parallax.
(() => {
  const canvas = document.querySelector('#portrait-particles');
  const points = window.PORTRAIT_POINTS;
  const context = canvas?.getContext('2d');
  if (!context || !points?.length) return;
  const stage = canvas.closest('.particle-stage');
  const button = document.querySelector('#portrait-motion');
  const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
  let paused = preference.matches;
  let visible = true;
  let frame = 0;
  let width = 0, height = 0;
  let targetX = 0, targetY = 0, turnX = 0, turnY = 0;
  let lastTime = 0;

  function draw(time = 0) {
    context.clearRect(0, 0, width, height);
    const scale = Math.min(width * 1.1, height * .98);
    const angle = turnX + (paused ? 0 : Math.sin(time * .0003) * .025);
    const tilt = turnY;
    const cos = Math.cos(angle), sin = Math.sin(angle);
    for (const [x,y,z,r,opacity] of points) {
      const px = x*cos + z*sin;
      const pz = z*cos-x*sin;
      const py = y*Math.cos(tilt)-pz*Math.sin(tilt);
      context.globalAlpha = opacity;
      context.beginPath();
      context.arc(width*.5+px*scale, height*.5+py*scale, Math.max(.45,r*scale/501),0,Math.PI*2);
      context.fill();
    }
    context.globalAlpha = 1;
  }
  function animate(time) {
    frame = 0;
    if (paused || !visible || document.hidden) return;
    if (time-lastTime > 32) {
      turnX += (targetX-turnX)*.08;
      turnY += (targetY-turnY)*.08;
      draw(time);
      lastTime = time;
    }
    frame = requestAnimationFrame(animate);
  }
  function sync() {
    cancelAnimationFrame(frame);
    frame = 0;
    button.textContent = paused ? 'Play motion' : 'Pause motion';
    button.setAttribute('aria-pressed', String(paused));
    if (!paused && visible && !document.hidden) frame = requestAnimationFrame(animate);
    else draw();
  }
  function resize() {
    const bounds = stage.getBoundingClientRect();
    width = bounds.width;
    height = bounds.height;
    const dpr = Math.min(window.devicePixelRatio || 1,2);
    canvas.width = Math.round(width*dpr);
    canvas.height = Math.round(height*dpr);
    context.setTransform(dpr,0,0,dpr,0,0);
    context.fillStyle = '#29292d';
    draw();
  }
  stage.addEventListener('pointermove', event => {
    if (paused || event.pointerType === 'touch') return;
    const bounds = stage.getBoundingClientRect();
    targetX = ((event.clientX-bounds.left)/bounds.width-.5)*.38;
    targetY = ((event.clientY-bounds.top)/bounds.height-.5)*.13;
  });
  stage.addEventListener('pointerleave', () => { targetX=0; targetY=0; });
  button.addEventListener('click', () => { paused=!paused; sync(); });
  preference.addEventListener('change', event => { paused=event.matches; sync(); });
  document.addEventListener('visibilitychange', sync);
  if ('ResizeObserver' in window) new ResizeObserver(resize).observe(stage);
  else window.addEventListener('resize', resize);
  if ('IntersectionObserver' in window) new IntersectionObserver(entries => {
    visible=entries[0].isIntersecting;
    sync();
  }).observe(stage);
  resize();
  stage.classList.add('ready');
  button.hidden=false;
  sync();
})();

// Full-screen "Hamriley.dev" intro -> decompose into particles -> morph into "Htoo Myat Min Eain." + navbar drop.
(() => {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const h1 = document.querySelector('.hero-copy > h1');
  if (!h1) return;
  const mutedSpan = h1.querySelector('.muted');
  if (!mutedSpan || !h1.firstChild || !mutedSpan.firstChild) return;

  const header = document.querySelector('.header');
  if (header) header.classList.add('nav-hidden');

  const introScreen = document.createElement('div');
  introScreen.className = 'intro-screen';
  introScreen.setAttribute('aria-hidden', 'true');

  const introCanvas = document.createElement('canvas');
  introCanvas.className = 'intro-canvas';
  introCanvas.setAttribute('aria-hidden', 'true');

  document.body.appendChild(introScreen);
  document.body.appendChild(introCanvas);

  const h1Canvas = document.createElement('canvas');
  h1Canvas.className = 'name-particles';
  h1Canvas.setAttribute('aria-hidden', 'true');

  const introCtx = introCanvas.getContext('2d');
  const h1Ctx = h1Canvas.getContext('2d');
  if (!introCtx || !h1Ctx) {
    introScreen.remove();
    introCanvas.remove();
    if (header) header.classList.remove('nav-hidden');
    return;
  }

  let particles = [];
  let h1Width = 0;
  let h1Height = 0;
  let frame = 0;
  let visible = true;
  let introDone = false;
  let navTriggered = false;
  let fadeTriggered = false;
  let startTime = 0;

  const measureSegment = (node) => {
    const range = document.createRange();
    range.selectNodeContents(node);
    return range.getBoundingClientRect();
  };

  function sampleIntroText(vw, vh, fontFamily) {
    const off = document.createElement('canvas');
    off.width = vw;
    off.height = vh;
    const octx = off.getContext('2d');
    if (!octx) return [];

    const size = Math.round(Math.max(34, Math.min(76, vw * 0.07)));
    octx.font = `600 ${size}px ${fontFamily}`;
    if ('letterSpacing' in octx) octx.letterSpacing = `${-0.055 * size}px`;
    octx.textBaseline = 'middle';

    const part1 = 'Hamriley';
    const part2 = '.dev';
    const w1 = octx.measureText(part1).width;
    const w2 = octx.measureText(part2).width;
    const startX = (vw - (w1 + w2)) / 2;
    const centerY = vh / 2;

    octx.fillStyle = 'rgb(255, 0, 0)';
    octx.fillText(part1, startX, centerY);
    octx.fillStyle = 'rgb(0, 0, 255)';
    octx.fillText(part2, startX + w1, centerY);

    const xMin = Math.max(0, Math.floor(startX - 8));
    const xMax = Math.min(vw, Math.ceil(startX + w1 + w2 + 8));
    const yMin = Math.max(0, Math.floor(centerY - size));
    const yMax = Math.min(vh, Math.ceil(centerY + size));
    const data = octx.getImageData(0, 0, vw, vh).data;
    const step = vw > 640 ? 3 : 2;
    const pts = [];

    for (let y = yMin; y < yMax; y += step) {
      for (let x = xMin; x < xMax; x += step) {
        const idx = (y * vw + x) * 4;
        const alpha = data[idx + 3];
        if (alpha > 85) {
          pts.push({ x, y, alpha: alpha / 255, isMuted: data[idx + 2] > data[idx] });
        }
      }
    }
    return pts;
  }

  function sampleTargetH1() {
    const h1Rect = h1.getBoundingClientRect();
    if (!h1Rect.width || !h1Rect.height) return { pts: [], rect: h1Rect };

    const style = getComputedStyle(h1);
    const font = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
    const letterSpacing = style.letterSpacing;
    const firstRect = measureSegment(h1.firstChild);
    const secondRect = measureSegment(mutedSpan.firstChild);

    h1Width = Math.ceil(h1Rect.width);
    h1Height = Math.ceil(h1Rect.height);
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const off = document.createElement('canvas');
    off.width = h1Width;
    off.height = h1Height;
    const octx = off.getContext('2d');
    if (!octx) return { pts: [], rect: h1Rect };

    octx.font = font;
    if ('letterSpacing' in octx) octx.letterSpacing = letterSpacing;
    octx.textBaseline = 'middle';

    const baselineY = h1Height / 2;
    octx.fillStyle = 'rgb(255, 0, 0)';
    octx.fillText(h1.firstChild.textContent, firstRect.left - h1Rect.left, baselineY);
    octx.fillStyle = 'rgb(0, 0, 255)';
    octx.fillText(mutedSpan.firstChild.textContent, secondRect.left - h1Rect.left, baselineY);

    const data = octx.getImageData(0, 0, h1Width, h1Height).data;
    const step = h1Width > 520 ? 3 : 2;
    const pts = [];

    for (let y = 0; y < h1Height; y += step) {
      for (let x = 0; x < h1Width; x += step) {
        const idx = (y * h1Width + x) * 4;
        const alpha = data[idx + 3];
        if (alpha > 85) {
          pts.push({
            tx: x,
            ty: y,
            size: step * 0.72,
            isMuted: data[idx + 2] > data[idx],
            alpha: alpha / 255
          });
        }
      }
    }

    h1Canvas.style.width = `${h1Width}px`;
    h1Canvas.style.height = `${h1Height}px`;
    h1Canvas.width = Math.round(h1Width * dpr);
    h1Canvas.height = Math.round(h1Height * dpr);
    h1Ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    if (!h1Canvas.parentNode) {
      h1.classList.add('particles-active');
      h1.appendChild(h1Canvas);
    }

    return { pts, rect: h1Rect };
  }

  function setupIntroAndTargets() {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    introCanvas.width = Math.round(vw * dpr);
    introCanvas.height = Math.round(vh * dpr);
    introCtx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const fontFamily = getComputedStyle(h1).fontFamily;
    const introPts = sampleIntroText(vw, vh, fontFamily);
    const { pts: targetPts, rect: h1Rect } = sampleTargetH1();

    if (!targetPts.length || !introPts.length) {
      introDone = true;
      introScreen.remove();
      introCanvas.remove();
      if (header) header.classList.remove('nav-hidden');
      particles = targetPts;
      return;
    }

    // Sort both sets left-to-right so decomposition flows cleanly into the hero name
    introPts.sort((a, b) => a.x - b.x || a.y - b.y);
    targetPts.sort((a, b) => a.tx - b.tx || a.ty - b.ty);

    const total = targetPts.length;
    particles = targetPts.map((tp, i) => {
      const src = introPts[Math.floor((i / total) * introPts.length)];
      const vx = h1Rect.left + tp.tx;
      const vy = h1Rect.top + tp.ty;
      const arcAngle = Math.random() * Math.PI * 2;
      const arcMag = 18 + Math.random() * 58;
      return {
        ...tp,
        ix: src.x,
        iy: src.y,
        iMuted: src.isMuted,
        // Entry scatter for "Hamriley.dev" reveal
        entryX: src.x + (Math.random() - 0.5) * 28,
        entryY: src.y + 22 + Math.random() * 34,
        entryDelay: (src.x / vw) * 0.25,
        // Target in viewport coords during morph
        vx,
        vy,
        // Midpoint curve for organic decomposition & flight
        cx: (src.x + vx) * 0.5 + Math.cos(arcAngle) * arcMag,
        cy: (src.y + vy) * 0.5 + Math.sin(arcAngle) * arcMag - 24,
        morphDelay: Math.random() * 0.22
      };
    });
  }

  function renderSteadyWave(ctx, elapsed, useViewportCoords) {
    for (const p of particles) {
      const px = useViewportCoords ? p.vx : p.tx;
      const py = useViewportCoords ? p.vy : p.ty;

      const w1 = Math.sin(p.tx * 0.034 - elapsed * 2.2 + p.ty * 0.026);
      const w2 = Math.cos(p.tx * 0.02 + p.ty * 0.048 + elapsed * 1.6);
      const w3 = Math.sin((p.tx - p.ty) * 0.028 + elapsed * 1.35);
      const wave = (w1 + w2 * 0.85 + w3 * 0.65) / 2.5;
      const contrast = Math.pow(Math.max(0, Math.min(1, 0.5 + 0.5 * wave)), 1.35);

      const lum = p.isMuted
        ? Math.round(12 + contrast * 165)
        : Math.round(0 + contrast * 135);

      ctx.globalAlpha = p.alpha * (0.62 + 0.38 * (1 - contrast));
      ctx.fillStyle = `rgb(${lum},${lum},${lum})`;
      ctx.fillRect(px, py, p.size, p.size);
    }
    ctx.globalAlpha = 1;
  }

  function tick(now) {
    frame = 0;
    if ((!introDone && document.hidden) || (introDone && (!visible || document.hidden)) || !particles.length) return;
    if (!startTime) startTime = now;
    const elapsed = (now - startTime) / 1000;

    if (!introDone) {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      introCtx.clearRect(0, 0, vw, vh);

      // Phase 1: 0.0s - 0.55s ("Hamriley.dev" assembles), hold to 0.95s
      // Phase 2: 0.95s - 2.15s (decompose into particles -> morph into "Htoo Myat Min Eain.")
      const morphStart = 0.95;
      const morphDur = 1.05;

      if (elapsed > morphStart + 0.2 && !fadeTriggered) {
        fadeTriggered = true;
        introScreen.classList.add('fade-out');
      }
      if (elapsed > morphStart + morphDur * 0.72 && !navTriggered) {
        navTriggered = true;
        if (header) {
          header.classList.remove('nav-hidden');
          header.classList.add('nav-drop');
        }
      }

      if (elapsed < morphStart) {
        for (const p of particles) {
          const t = Math.max(0, Math.min(1, (elapsed - p.entryDelay) / 0.45));
          const ease = 1 - Math.pow(1 - t, 3);
          const x = p.entryX + (p.ix - p.entryX) * ease;
          const y = p.entryY + (p.iy - p.entryY) * ease;
          const shimmer = Math.sin(p.ix * 0.03 - elapsed * 4.5) * 0.5 + 0.5;
          const lum = p.iMuted ? Math.round(70 + shimmer * 60) : Math.round(10 + shimmer * 35);
          introCtx.globalAlpha = p.alpha * Math.min(1, t * 2.5);
          introCtx.fillStyle = `rgb(${lum},${lum},${lum})`;
          introCtx.fillRect(x, y, p.size, p.size);
        }
        introCtx.globalAlpha = 1;
      } else if (elapsed < morphStart + morphDur + 0.25) {
        for (const p of particles) {
          const t = Math.max(0, Math.min(1, (elapsed - morphStart - p.morphDelay) / morphDur));
          const ease = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
          const inv = 1 - ease;
          // Quadratic Bezier flight from Hamriley.dev -> Htoo Myat Min Eain.
          const x = inv * inv * p.ix + 2 * inv * ease * p.cx + ease * ease * p.vx;
          const y = inv * inv * p.iy + 2 * inv * ease * p.cy + ease * ease * p.vy;
          const lum = p.isMuted ? Math.round(20 + (1 - ease) * 30) : 12;
          introCtx.globalAlpha = p.alpha;
          introCtx.fillStyle = `rgb(${lum},${lum},${lum})`;
          introCtx.fillRect(x, y, p.size, p.size);
        }
        introCtx.globalAlpha = 1;
      } else {
        introDone = true;
        introScreen.remove();
        introCanvas.remove();
        h1Ctx.clearRect(0, 0, h1Width, h1Height);
        renderSteadyWave(h1Ctx, elapsed, false);
      }
    } else {
      h1Ctx.clearRect(0, 0, h1Width, h1Height);
      renderSteadyWave(h1Ctx, elapsed, false);
    }

    frame = requestAnimationFrame(tick);
  }

  function sync() {
    cancelAnimationFrame(frame);
    frame = 0;
    if ((!introDone || visible) && !document.hidden && particles.length) {
      frame = requestAnimationFrame(tick);
    }
  }

  function init() {
    setupIntroAndTargets();
    sync();
    if ('ResizeObserver' in window) {
      let lastW = h1Width;
      new ResizeObserver(() => {
        const nextW = Math.ceil(h1.getBoundingClientRect().width);
        if (Math.abs(nextW - lastW) > 2) {
          lastW = nextW;
          const { pts } = sampleTargetH1();
          if (pts.length) particles = pts;
        }
      }).observe(h1);
    }
    if ('IntersectionObserver' in window) {
      new IntersectionObserver((entries) => {
        visible = entries[0].isIntersecting;
        sync();
      }).observe(h1);
    }
    document.addEventListener('visibilitychange', sync);
  }

  if (document.fonts?.ready) {
    document.fonts.ready.then(() => requestAnimationFrame(init));
  } else {
    window.addEventListener('load', () => requestAnimationFrame(init), { once: true });
  }
})();
