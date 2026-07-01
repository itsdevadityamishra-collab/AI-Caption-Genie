// ─── DOM ────────────────────────────────────────────────────────────────────
const inputPage         = document.getElementById('inputPage');
const resultsPage       = document.getElementById('resultsPage');
const topicInput        = document.getElementById('topicInput');
const generateBtn       = document.getElementById('generateBtn');
const generateNewBtn    = document.getElementById('generateNewBtn');
const btnText           = document.getElementById('btnText');
const btnSpinner        = document.getElementById('btnSpinner');
const backBtn           = document.getElementById('backBtn');
const toneSelect        = document.getElementById('toneSelect');
const platformSelect    = document.getElementById('platformSelect');
const lengthSelect      = document.getElementById('lengthSelect');
const emojiToggle       = document.getElementById('emojiToggle');
const emojiThumb        = document.getElementById('emojiThumb');
const emojiLabel        = document.getElementById('emojiLabel');
const captionCount      = document.getElementById('captionCount');
const captionCountVal   = document.getElementById('captionCountVal');
const hashtagCount      = document.getElementById('hashtagCount');
const hashtagCountVal   = document.getElementById('hashtagCountVal');
const captionsContainer = document.getElementById('captionsContainer');
const hashtagsContainer = document.getElementById('hashtagsContainer');
const resultsContent    = document.getElementById('resultsContent');
const resultsSkeleton   = document.getElementById('resultsSkeleton');
const resultsMeta       = document.getElementById('resultsMeta');
const resultsCaptionCount = document.getElementById('resultsCaptionCount');
const resultsHashtagCount = document.getElementById('resultsHashtagCount');
const copyAllBtn        = document.getElementById('copyAllBtn');
const toast             = document.getElementById('toast');

let emojisEnabled = true;
let lastResult = null;

// ─── Toast ───────────────────────────────────────────────────────────────────
let toastTimer;
function showToast(msg = 'Copied!') {
  toast.textContent = msg;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2200);
}

// ─── Clipboard ──────────────────────────────────────────────────────────────
async function copyText(text) {
  try { await navigator.clipboard.writeText(text); showToast(); }
  catch {
    const ta = document.createElement('textarea');
    ta.value = text; ta.style.cssText = 'position:fixed;left:-9999px';
    document.body.appendChild(ta); ta.select();
    document.execCommand('copy'); document.body.removeChild(ta);
    showToast();
  }
}

function escapeHtml(str) {
  const d = document.createElement('div');
  d.appendChild(document.createTextNode(str));
  return d.innerHTML;
}

function debounce(fn, ms) {
  let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); };
}

// ─── Custom Select Dropdown ─────────────────────────────────────────────────
function closeAllDropdowns() {
  document.querySelectorAll('.custom-select-dropdown.show').forEach(d => {
    d.classList.remove('show');
    d.previousElementSibling.classList.remove('active');
  });
}
document.addEventListener('click', closeAllDropdowns);

function initCustomSelect(id) {
  const select = document.getElementById(id);
  const wrapper = document.createElement('div');
  wrapper.className = 'custom-select-wrapper';
  select.parentNode.insertBefore(wrapper, select);
  wrapper.appendChild(select);
  select.style.cssText = 'position:absolute;opacity:0;pointer-events:none;width:100%;height:100%;top:0;left:0;';

  const trigger = document.createElement('button');
  trigger.className = 'custom-select-trigger';
  trigger.type = 'button';

  const textSpan = document.createElement('span');
  textSpan.textContent = select.options[select.selectedIndex].text;

  trigger.appendChild(textSpan);
  trigger.insertAdjacentHTML('beforeend',
    '<svg class="custom-select-arrow" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>'
  );
  wrapper.appendChild(trigger);

  const dropdown = document.createElement('div');
  dropdown.className = 'custom-select-dropdown';

  [...select.options].forEach((opt, i) => {
    const item = document.createElement('div');
    item.className = 'custom-select-option' + (opt.selected ? ' selected' : '');
    item.dataset.index = i;
    item.textContent = opt.text;
    item.addEventListener('click', e => {
      e.stopPropagation();
      select.selectedIndex = i;
      select.dispatchEvent(new Event('change', { bubbles: true }));
      textSpan.textContent = opt.text;
      dropdown.querySelector('.selected')?.classList.remove('selected');
      item.classList.add('selected');
      closeAllDropdowns();
    });
    dropdown.appendChild(item);
  });

  wrapper.appendChild(dropdown);

  trigger.addEventListener('click', e => {
    e.stopPropagation();
    const isOpen = dropdown.classList.contains('show');
    closeAllDropdowns();
    if (!isOpen) {
      dropdown.classList.add('show');
      trigger.classList.add('active');
    }
  });

  select.addEventListener('change', () => {
    const idx = select.selectedIndex;
    textSpan.textContent = select.options[idx].text;
    dropdown.querySelectorAll('.custom-select-option').forEach(el => {
      el.classList.toggle('selected', Number(el.dataset.index) === idx);
    });
  });
}

initCustomSelect('platformSelect');
initCustomSelect('toneSelect');
initCustomSelect('lengthSelect');

// ─── Sliders ────────────────────────────────────────────────────────────────
captionCount.addEventListener('input', () => {
  captionCountVal.textContent = captionCount.value;
});

hashtagCount.addEventListener('input', () => {
  hashtagCountVal.textContent = hashtagCount.value;
});

// ─── Emoji Toggle ──────────────────────────────────────────────────────────
emojiToggle.addEventListener('click', () => {
  emojisEnabled = !emojisEnabled;
  emojiThumb.style.transform = emojisEnabled ? 'translateX(1.375rem)' : 'translateX(0.1875rem)';
  emojiToggle.classList.toggle('bg-brand-600', emojisEnabled);
  emojiToggle.classList.toggle('bg-surface-300', !emojisEnabled);
  emojiLabel.textContent = emojisEnabled ? 'ON' : 'OFF';
});

// ─── Page Switching ─────────────────────────────────────────────────────────
function showInputPage() {
  resultsPage.classList.add('hidden');
  inputPage.classList.remove('hidden');
  document.body.style.overflow = '';
}

function showResultsPage() {
  inputPage.classList.add('hidden');
  resultsPage.classList.remove('hidden');
  resultsPage.classList.remove('results-enter');
  void resultsPage.offsetWidth;
  resultsPage.classList.add('results-enter');
  document.body.style.overflow = 'hidden';
  resultsPage.scrollTop = 0;
}

backBtn.addEventListener('click', showInputPage);
generateNewBtn.addEventListener('click', () => { showInputPage(); topicInput.focus(); });

// ─── Loading ────────────────────────────────────────────────────────────────
function setLoading(v) {
  generateBtn.disabled = v;
  btnText.textContent = v ? 'Generating...' : 'Magic Generate';
  btnSpinner.classList.toggle('hidden', !v);
}

function setResultsLoading(v) {
  if (v) {
    resultsContent.classList.add('hidden');
    resultsSkeleton.classList.remove('hidden');
  } else {
    resultsSkeleton.classList.add('hidden');
    resultsContent.classList.remove('hidden');
  }
}

// ─── Render Captions ────────────────────────────────────────────────────────
function renderCaptions(captions) {
  captionsContainer.innerHTML = captions.map(c => `
    <div class="caption-card relative bg-white rounded-xl p-3.5 sm:p-4 pr-12 sm:pr-14 animate-slide-up">
      <p class="text-sm sm:text-base text-surface-800 leading-relaxed">${escapeHtml(c.text)}</p>
      <button class="copy-caption-btn absolute top-2.5 right-2.5 sm:top-3 sm:right-3 p-1.5 rounded-lg text-surface-400 hover:text-brand-600 hover:bg-brand-50 transition-all duration-200"
        data-text="${escapeHtml(c.text)}" title="Copy caption">
        <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
      </button>
    </div>
  `).join('');
  captionsContainer.querySelectorAll('.copy-caption-btn').forEach(btn => {
    btn.addEventListener('click', () => copyText(btn.dataset.text));
  });
}

// ─── Render Hashtags ────────────────────────────────────────────────────────
function renderHashtags(tags) {
  const groups = [
    { key: 'highTraffic', label: 'High Traffic', color: 'bg-brand-50 text-brand-700 border-brand-200 hover:bg-brand-100' },
    { key: 'niche', label: 'Niche', color: 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100' },
    { key: 'location', label: 'Location', color: 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100' },
  ];

  let html = '';
  for (const g of groups) {
    const list = tags[g.key] || [];
    if (list.length === 0) continue;
    html += `
      <div class="mb-3 last:mb-0">
        <p class="text-[10px] font-semibold text-surface-600 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
          <span class="w-1 h-1 rounded-full ${g.color.split(' ')[0]}"></span>
          ${g.label} <span class="text-[10px] font-normal text-surface-400">(${list.length})</span>
        </p>
        <div class="flex flex-wrap gap-1.5">
          ${list.map(tag => `
            <span class="group inline-flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-medium border ${g.color} transition-all duration-200 cursor-pointer"
                  data-tag="${escapeHtml(tag)}" title="Copy ${escapeHtml(tag)}">
              ${escapeHtml(tag)}
              <svg class="w-2.5 h-2.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
            </span>
          `).join('')}
        </div>
      </div>`;
  }
  hashtagsContainer.innerHTML = html;
  hashtagsContainer.querySelectorAll('[data-tag]').forEach(el => {
    el.addEventListener('click', () => copyText(el.dataset.tag));
  });
}

// ─── API ─────────────────────────────────────────────────────────────────────
async function generateContent(topic, tone, platform, emojis, captionLength, captionCount, hashtagCount) {
  const res = await fetch('/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ topic, tone, platform, emojis, captionLength, captionCount, hashtagCount }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Request failed (${res.status})`);
  }
  return res.json();
}

// ─── Copy All ───────────────────────────────────────────────────────────────
function handleCopyAll() {
  const captions = [...captionsContainer.querySelectorAll('.caption-card p')].map(p => p.textContent.trim());
  const parts = ['── Captions ──', ...captions, '', '── Hashtags ──'];
  hashtagsContainer.querySelectorAll('.mb-4').forEach(groupEl => {
    const label = groupEl.querySelector('p')?.textContent?.trim() || '';
    const tags = [...groupEl.querySelectorAll('[data-tag]')].map(el => el.dataset.tag);
    if (tags.length) { parts.push(label); parts.push(tags.join(' ')); }
  });
  copyText(parts.join('\n'));
}

copyAllBtn.addEventListener('click', handleCopyAll);

// ─── Main Generate ──────────────────────────────────────────────────────────
async function handleGenerate() {
  const topic = topicInput.value.trim();
  if (!topic) { showToast('Please describe your content topic first.'); topicInput.focus(); return; }

  const tone = toneSelect.value.toLowerCase();
  const platform = platformSelect.value;
  const captionLength = lengthSelect.value.toLowerCase();
  const cc = Number(captionCount.value);
  const hc = Number(hashtagCount.value);

  setLoading(true);

  // Show results page immediately with skeleton
  resultsContent.classList.add('hidden');
  resultsSkeleton.classList.remove('hidden');
  showResultsPage();

  try {
    const data = await generateContent(topic, tone, platform, emojisEnabled, captionLength, cc, hc);
    lastResult = data;

    renderCaptions(data.captions);
    renderHashtags(data.hashtags);
    resultsCaptionCount.textContent = `${data.captions.length} captions`;
    const totalTags = (data.hashtags.highTraffic?.length || 0) + (data.hashtags.niche?.length || 0) + (data.hashtags.location?.length || 0);
    resultsHashtagCount.textContent = `${totalTags} tags`;

    const toneLabel = toneSelect.options[toneSelect.selectedIndex].text;
    const lengthLabel = lengthSelect.options[lengthSelect.selectedIndex].text;
    resultsMeta.textContent = `${toneLabel} · ${lengthLabel} · ${platform} · ${cc} captions · ${hc} tags`;

    // Hide skeleton, show content
    resultsSkeleton.classList.add('hidden');
    resultsContent.classList.remove('hidden');
  } catch (err) {
    resultsSkeleton.classList.add('hidden');
    resultsContent.classList.add('hidden');
    showToast(err.message || 'Something went wrong. Please try again.');
  } finally {
    setLoading(false);
  }
}

generateBtn.addEventListener('click', handleGenerate);

topicInput.addEventListener('keydown', e => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); handleGenerate(); }
});

topicInput.addEventListener('input', debounce(() => {
  topicInput.style.height = 'auto';
  topicInput.style.height = topicInput.scrollHeight + 'px';
}, 100));

topicInput.style.height = 'auto';
topicInput.style.height = topicInput.scrollHeight + 'px';
