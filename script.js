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

const printResumeBtn = document.querySelector('#print-resume');
if (printResumeBtn) {
  printResumeBtn.addEventListener('click', () => window.print());
}

// Full-screen "Hamriley.dev" typewriter intro -> hold -> decompose into particles -> smooth morph into "Htoo Myat Min Eain." + navbar drop.
(() => {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const h1 = document.querySelector('.hero-copy > h1');
  if (!h1) return;
  const mutedSpan = h1.querySelector('.muted');
  if (!mutedSpan || !h1.firstChild || !mutedSpan.firstChild) return;

  const header = document.querySelector('.header');
  if (header) header.classList.add('nav-hidden');

  h1.classList.add('particles-managed', 'particles-active');

  const introScreen = document.createElement('div');
  introScreen.className = 'intro-screen';
  introScreen.setAttribute('aria-hidden', 'true');

  const introWord = document.createElement('div');
  introWord.className = 'intro-word';

  const partMain = document.createElement('span');
  const partExt = document.createElement('span');
  partExt.className = 'muted';
  const cursor = document.createElement('span');
  cursor.className = 'intro-cursor';

  introWord.append(partMain, partExt, cursor);
  introScreen.appendChild(introWord);

  const introCanvas = document.createElement('canvas');
  introCanvas.className = 'intro-canvas';
  introCanvas.setAttribute('aria-hidden', 'true');

  document.body.appendChild(introScreen);
  document.body.appendChild(introCanvas);

  const introCtx = introCanvas.getContext('2d');
  if (!introCtx) {
    h1.classList.remove('particles-managed', 'particles-active');
    introScreen.remove();
    introCanvas.remove();
    if (header) header.classList.remove('nav-hidden');
    return;
  }

  const measureSegment = (node) => {
    const range = document.createRange();
    range.selectNodeContents(node);
    return range.getBoundingClientRect();
  };

  function sampleDOMText(node, isMutedFlag, vw, vh) {
    if (!node.firstChild) return [];
    const rect = measureSegment(node.firstChild);
    const style = getComputedStyle(node);
    const font = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
    const off = document.createElement('canvas');
    off.width = vw;
    off.height = vh;
    const octx = off.getContext('2d');
    if (!octx) return [];

    octx.font = font;
    if ('letterSpacing' in octx) octx.letterSpacing = style.letterSpacing;
    octx.textBaseline = 'alphabetic';

    const text = node.firstChild.textContent;
    const metrics = octx.measureText(text);
    const ascent = metrics.fontBoundingBoxAscent ?? parseFloat(style.fontSize) * 0.85;
    const descent = metrics.fontBoundingBoxDescent ?? parseFloat(style.fontSize) * 0.22;
    const baselineY = rect.top + (rect.height + ascent - descent) / 2;

    octx.fillStyle = '#000';
    octx.fillText(text, rect.left, baselineY);

    const xMin = Math.max(0, Math.floor(rect.left - 4));
    const xMax = Math.min(vw, Math.ceil(rect.right + 4));
    const yMin = Math.max(0, Math.floor(rect.top - 4));
    const yMax = Math.min(vh, Math.ceil(rect.bottom + 4));
    const data = octx.getImageData(0, 0, vw, vh).data;
    const step = 2;
    const pts = [];

    for (let y = yMin; y < yMax; y += step) {
      for (let x = xMin; x < xMax; x += step) {
        const alpha = data[(y * vw + x) * 4 + 3];
        if (alpha > 80) {
          pts.push({ x, y, alpha: alpha / 255, isMuted: isMutedFlag });
        }
      }
    }
    return pts;
  }

  function sampleTargetH1() {
    const h1Rect = h1.getBoundingClientRect();
    if (!h1Rect.width || !h1Rect.height) return [];

    const style = getComputedStyle(h1);
    const font = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
    const letterSpacing = style.letterSpacing;
    const firstRect = measureSegment(h1.firstChild);
    const secondRect = measureSegment(mutedSpan.firstChild);

    const w = Math.ceil(h1Rect.width);
    const h = Math.ceil(h1Rect.height);

    const off = document.createElement('canvas');
    off.width = w;
    off.height = h;
    const octx = off.getContext('2d');
    if (!octx) return [];

    octx.font = font;
    if ('letterSpacing' in octx) octx.letterSpacing = letterSpacing;
    octx.textBaseline = 'alphabetic';

    const metrics = octx.measureText(h1.firstChild.textContent);
    const fontAscent = metrics.fontBoundingBoxAscent ?? parseFloat(style.fontSize) * 0.85;
    const fontDescent = metrics.fontBoundingBoxDescent ?? parseFloat(style.fontSize) * 0.22;
    const baselineY = (firstRect.top - h1Rect.top) + (firstRect.height + fontAscent - fontDescent) / 2;

    octx.fillStyle = 'rgb(255, 0, 0)';
    octx.fillText(h1.firstChild.textContent, firstRect.left - h1Rect.left, baselineY);
    octx.fillStyle = 'rgb(0, 0, 255)';
    octx.fillText(mutedSpan.firstChild.textContent, secondRect.left - h1Rect.left, baselineY);

    const data = octx.getImageData(0, 0, w, h).data;
    const step = 2;
    const pts = [];

    for (let y = 0; y < h; y += step) {
      for (let x = 0; x < w; x += step) {
        const idx = (y * w + x) * 4;
        const alpha = data[idx + 3];
        if (alpha > 80) {
          pts.push({
            tx: x,
            ty: y,
            size: step * 0.9,
            isMuted: data[idx + 2] > data[idx],
            alpha: alpha / 255
          });
        }
      }
    }
    return pts;
  }

  function startMorph() {
    const vw = introCanvas.clientWidth || window.innerWidth;
    const vh = introCanvas.clientHeight || window.innerHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    introCanvas.width = Math.round(vw * dpr);
    introCanvas.height = Math.round(vh * dpr);
    introCtx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const introPts = [
      ...sampleDOMText(partMain, false, vw, vh),
      ...sampleDOMText(partExt, true, vw, vh)
    ];
    const targetPts = sampleTargetH1();
    const h1Rect = h1.getBoundingClientRect();

    if (!introPts.length || !targetPts.length) {
      h1.classList.remove('particles-managed', 'particles-active');
      introScreen.remove();
      introCanvas.remove();
      if (header) header.classList.remove('nav-hidden');
      return;
    }

    introPts.sort((a, b) => a.x - b.x || a.y - b.y);
    targetPts.sort((a, b) => a.tx - b.tx || a.ty - b.ty);

    const total = targetPts.length;
    const isMobile = vw < 640;
    const particles = targetPts.map((tp, i) => {
      const src = introPts[Math.floor((i / total) * introPts.length)];
      const vx = h1Rect.left + tp.tx;
      const vy = h1Rect.top + tp.ty;
      const arcAngle = Math.random() * Math.PI * 2;
      const arcMag = isMobile ? 6 + Math.random() * 18 : 14 + Math.random() * 42;
      return {
        ...tp,
        ix: src.x,
        iy: src.y,
        iMuted: src.isMuted,
        cx: (src.x + vx) * 0.5 + Math.cos(arcAngle) * arcMag,
        cy: (src.y + vy) * 0.5 + Math.sin(arcAngle) * arcMag - 18,
        morphDelay: (i / total) * 0.14 + Math.random() * 0.12
      };
    });

    for (const p of particles) {
      const lum = p.iMuted ? 114 : 29;
      introCtx.globalAlpha = p.alpha;
      introCtx.fillStyle = `rgb(${lum},${lum},${lum})`;
      introCtx.fillRect(p.ix, p.iy, p.size, p.size);
    }
    introCtx.globalAlpha = 1;
    introWord.classList.add('hidden');

    const morphDur = 1.15;
    let startTime = 0;
    let fadeTriggered = false;
    let navTriggered = false;
    let handoffStarted = false;

    function tick(now) {
      if (document.hidden) {
        requestAnimationFrame(tick);
        return;
      }
      if (!startTime) startTime = now;
      const elapsed = (now - startTime) / 1000;

      introCtx.clearRect(0, 0, vw, vh);
      const liveRect = h1.getBoundingClientRect();

      if (elapsed > 0.14 && !fadeTriggered) {
        fadeTriggered = true;
        introScreen.classList.add('fade-out');
      }
      if (elapsed > morphDur * 0.68 && !navTriggered) {
        navTriggered = true;
        if (header) {
          header.classList.remove('nav-hidden');
          header.classList.add('nav-drop');
        }
      }
      if (elapsed > morphDur * 0.92 && !handoffStarted) {
        handoffStarted = true;
        h1.classList.remove('particles-active');
        introCanvas.style.opacity = '0';
        setTimeout(() => {
          introScreen.remove();
          introCanvas.remove();
        }, 600);
      }

      let allDone = true;
      for (const p of particles) {
        const t = Math.max(0, Math.min(1, (elapsed - p.morphDelay) / morphDur));
        if (t < 1) allDone = false;
        const ease = t < 0.5
          ? 16 * t * t * t * t * t
          : 1 - Math.pow(-2 * t + 2, 5) / 2;
        const inv = 1 - ease;
        const vx = liveRect.left + p.tx;
        const vy = liveRect.top + p.ty;
        const x = inv * inv * p.ix + 2 * inv * ease * p.cx + ease * ease * vx;
        const y = inv * inv * p.iy + 2 * inv * ease * p.cy + ease * ease * vy;
        const lum = Math.round((p.iMuted ? 114 : 29) + ((p.isMuted ? 114 : 29) - (p.iMuted ? 114 : 29)) * ease);
        introCtx.globalAlpha = p.alpha;
        introCtx.fillStyle = `rgb(${lum},${lum},${lum})`;
        introCtx.fillRect(x, y, p.size, p.size);
      }
      introCtx.globalAlpha = 1;

      if (!allDone || !handoffStarted) {
        requestAnimationFrame(tick);
      }
    }

    requestAnimationFrame(tick);
  }

  function runTypewriter() {
    const fullMain = 'Hamriley';
    const fullExt = '.dev';
    const totalChars = fullMain.length + fullExt.length;
    let count = 0;

    function typeNext() {
      count += 1;
      partMain.textContent = fullMain.slice(0, Math.min(count, fullMain.length));
      partExt.textContent = count > fullMain.length
        ? fullExt.slice(0, count - fullMain.length)
        : '';

      if (count < totalChars) {
        const ch = (partMain.textContent + partExt.textContent).slice(-1);
        const delay = ch === '.' ? 130 : 58 + Math.random() * 28;
        setTimeout(typeNext, delay);
      } else {
        setTimeout(() => requestAnimationFrame(startMorph), 900);
      }
    }

    setTimeout(typeNext, 220);
  }

  if (document.fonts?.ready) {
    document.fonts.ready.then(runTypewriter);
  } else {
    window.addEventListener('load', runTypewriter, { once: true });
  }
})();
