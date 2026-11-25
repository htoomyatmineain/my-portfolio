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

// Hero name particle formation: particles rise from below and assemble into the heading.
(() => {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const h1 = document.querySelector('.hero-copy > h1');
  if (!h1) return;
  const mutedSpan = h1.querySelector('.muted');
  if (!mutedSpan || !h1.firstChild || !mutedSpan.firstChild) return;

  const startParticles = () => {
    const h1Rect = h1.getBoundingClientRect();
    if (!h1Rect.width || !h1Rect.height) return;

    const style = getComputedStyle(h1);
    const mutedStyle = getComputedStyle(mutedSpan);
    const font = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
    const letterSpacing = style.letterSpacing;

    const measureSegment = (node) => {
      const range = document.createRange();
      range.selectNodeContents(node);
      return range.getBoundingClientRect();
    };
    const firstRect = measureSegment(h1.firstChild);
    const secondRect = measureSegment(mutedSpan.firstChild);

    const padBottom = 150;
    const width = Math.ceil(h1Rect.width);
    const height = Math.ceil(h1Rect.height);
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const offscreen = document.createElement('canvas');
    offscreen.width = width;
    offscreen.height = height;
    const octx = offscreen.getContext('2d');
    if (!octx) return;

    octx.font = font;
    if ('letterSpacing' in octx) octx.letterSpacing = letterSpacing;
    octx.textBaseline = 'middle';

    const baselineY = height / 2;
    octx.fillStyle = style.color || '#1d1d1f';
    octx.fillText(h1.firstChild.textContent, firstRect.left - h1Rect.left, baselineY);
    octx.fillStyle = mutedStyle.color || '#727277';
    octx.fillText(mutedSpan.firstChild.textContent, secondRect.left - h1Rect.left, baselineY);

    const imgData = octx.getImageData(0, 0, width, height).data;
    const step = width > 520 ? 3 : 2;
    const particles = [];
    for (let y = 0; y < height; y += step) {
      for (let x = 0; x < width; x += step) {
        const idx = (y * width + x) * 4;
        const alpha = imgData[idx + 3];
        if (alpha > 85) {
          const r = imgData[idx];
          const g = imgData[idx + 1];
          const b = imgData[idx + 2];
          const delay = (x / width) * 0.28 + Math.random() * 0.18;
          particles.push({
            tx: x,
            ty: y,
            sx: x + (Math.random() - 0.5) * 34,
            sy: height + 20 + Math.random() * (padBottom - 30),
            size: step * 0.68,
            color: `rgb(${r},${g},${b})`,
            alpha: alpha / 255,
            delay
          });
        }
      }
    }
    if (!particles.length) return;

    const canvas = document.createElement('canvas');
    canvas.className = 'name-particles';
    canvas.setAttribute('aria-hidden', 'true');
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height + padBottom}px`;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round((height + padBottom) * dpr);

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    h1.classList.add('particles-active');
    h1.appendChild(canvas);

    const duration = 1.15;
    let startTime = 0;

    function tick(now) {
      if (!startTime) startTime = now;
      const elapsed = (now - startTime) / 1000;
      ctx.clearRect(0, 0, width, height + padBottom);

      let allDone = true;
      for (const p of particles) {
        const t = Math.max(0, Math.min(1, (elapsed - p.delay) / duration));
        if (t < 1) allDone = false;
        const ease = 1 - Math.pow(1 - t, 3);
        const x = p.sx + (p.tx - p.sx) * ease;
        const y = p.sy + (p.ty - p.sy) * ease;
        ctx.globalAlpha = p.alpha * Math.min(1, t * 2.2);
        ctx.fillStyle = p.color;
        ctx.fillRect(x, y, p.size, p.size);
      }
      ctx.globalAlpha = 1;

      if (!allDone) {
        requestAnimationFrame(tick);
      } else {
        h1.classList.remove('particles-active');
        canvas.style.opacity = '0';
        setTimeout(() => canvas.remove(), 380);
      }
    }

    requestAnimationFrame(tick);
  };

  if (document.fonts?.ready) {
    document.fonts.ready.then(() => requestAnimationFrame(startParticles));
  } else {
    window.addEventListener('load', () => requestAnimationFrame(startParticles), { once: true });
  }
})();
