// Simple deck renderer
const state = { slides: [], index: 0 };

function el(tag, attrs = {}, children = []){
  const node = document.createElement(tag);
  Object.entries(attrs).forEach(([k,v])=>{
    if(k === 'class') node.className = v;
    else if(k === 'html') node.innerHTML = v;
    else node.setAttribute(k, v);
  });
  (Array.isArray(children)?children:[children]).forEach(c=>{ if(!c) return; node.appendChild(typeof c === 'string'?document.createTextNode(c):c); });
  return node;
}

function renderSlide(slide, idx, total){
  const slideEl = el('section', {class: 'slide', 'data-idx': idx});
  if(idx === state.index) slideEl.classList.add('active');

  const header = el('div', {class: 'heading'});
  const title = el('div', {}, [el('h1', {}, slide.title || '')]);
  header.appendChild(title);
  if(slide.subtitle) header.appendChild(el('div', {class: 'cover-sub'}, slide.subtitle));
  slideEl.appendChild(header);

  if(slide.bullets && slide.bullets.length){
    const bullets = el('div', {class: 'bullets'});
    slide.bullets.forEach(b=> bullets.appendChild(el('p', {}, b)));
    slideEl.appendChild(bullets);
  }

  if(slide.timing){
    slideEl.appendChild(el('div', {class: 'small'}, slide.timing));
  }

  // small footer within slide for optional short note
  if(slide.note) slideEl.appendChild(el('div', {class: 'small'}, slide.note));

  return slideEl;
}

function updateUI(){
  const deck = document.getElementById('deck');
  [...deck.children].forEach((c, i)=>{
    c.classList.toggle('active', i === state.index);
  });
  const progress = document.getElementById('progress');
  progress.textContent = `${state.index + 1} / ${state.slides.length}`;
  const speaker = document.getElementById('speaker');
  const current = state.slides[state.index];
  speaker.textContent = current && current.speaker_line ? current.speaker_line : '';
  // progress bar (optional small visual)
  let bar = document.querySelector('.progressbar');
  if(!bar){
    bar = el('div', {class: 'progressbar'});
    bar.appendChild(el('i'));
    document.querySelector('.footer').appendChild(bar);
  }
  const pct = Math.round(((state.index + 1) / state.slides.length) * 100);
  bar.firstChild.style.width = pct + '%';
}

function go(offset){
  const n = clamp(state.index + offset, 0, state.slides.length - 1);
  state.index = n;
  updateUI();
}
function clamp(v, a, b){ return Math.max(a, Math.min(b, v)); }

function attachNav(){
  document.getElementById('prevBtn').addEventListener('click', ()=>go(-1));
  document.getElementById('nextBtn').addEventListener('click', ()=>go(1));
  document.addEventListener('keydown', (e)=>{
    if(e.key === 'ArrowRight') go(1);
    if(e.key === 'ArrowLeft') go(-1);
    if(e.key === 'Home') { state.index = 0; updateUI(); }
    if(e.key === 'End') { state.index = state.slides.length - 1; updateUI(); }
  });
  // touch swipe
  let startX = null;
  document.getElementById('deck').addEventListener('touchstart', e=>{ startX = e.changedTouches[0].clientX; });
  document.getElementById('deck').addEventListener('touchend', e=>{
    if(startX == null) return;
    const dx = e.changedTouches[0].clientX - startX;
    if(dx > 50) go(-1);
    else if(dx < -50) go(1);
    startX = null;
  });
  // toggle speaker visibility
  document.getElementById('speaker').addEventListener('click', function(){
    this.style.display = this.style.display === 'none' ? 'block' : 'none';
  });
}

function build(slidesData){
  state.slides = slidesData;
  const deck = document.getElementById('deck');
  deck.innerHTML = '';
  slidesData.forEach((s,i)=>deck.appendChild(renderSlide(s,i,slidesData.length)));
  updateUI();
  attachNav();
}

// load content.json
fetch('content.json').then(r=>r.json()).then(data=>{
  // data.slides expected
  if(!data || !Array.isArray(data.slides)){
    document.getElementById('deck').innerHTML = '<div class="slide active"><h1>Error</h1><p class="small">content.json not found or invalid.</p></div>';
    return;
  }
  build(data.slides);
}).catch(err=>{
  console.error(err);
  document.getElementById('deck').innerHTML = '<div class="slide active"><h1>Error loading deck</h1><p class="small">Check that content.json is present.</p></div>';
});
