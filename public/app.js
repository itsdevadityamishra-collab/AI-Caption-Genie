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
const languageSelect    = document.getElementById('languageSelect');
const keywordsInput     = document.getElementById('keywordsInput');
const brandVoiceInput   = document.getElementById('brandVoiceInput');
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
const loginOverlay      = document.getElementById('loginOverlay');
const loginNameInput     = document.getElementById('loginNameInput');
const loginBtn           = document.getElementById('loginBtn');
const headerUserName    = document.getElementById('headerUserName');
const historyBar        = document.getElementById('historyBar');
const historyList       = document.getElementById('historyList');
const clearHistoryBtn   = document.getElementById('clearHistoryBtn');
const saveToHistoryBtn  = document.getElementById('saveToHistoryBtn');
const exportBtn         = document.getElementById('exportBtn');
const exportDropdown    = document.getElementById('exportDropdown');
const shareBtn          = document.getElementById('shareBtn');
const previewBtn        = document.getElementById('previewBtn');
const previewOverlay    = document.getElementById('previewOverlay');
const previewUsername   = document.getElementById('previewUsername');
const previewCaption    = document.getElementById('previewCaption');
const previewHashtags   = document.getElementById('previewHashtags');
const previewAvatar     = document.getElementById('previewAvatar');

let emojisEnabled = true;
let lastResult = null;
let userName = '';

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

// ─── Login ───────────────────────────────────────────────────────────────────
function checkLogin() {
  const stored = localStorage.getItem('acg_user');
  if (stored) {
    userName = stored;
    headerUserName.textContent = userName;
    loginOverlay.classList.add('hidden');
    fetch('/api/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: stored }),
    }).catch(() => {});
  }
}

loginBtn.addEventListener('click', () => {
  const name = loginNameInput.value.trim();
  if (!name) { showToast('Please enter your name.'); return; }
  userName = name;
  localStorage.setItem('acg_user', name);
  headerUserName.textContent = name;
  loginOverlay.classList.add('hidden');
  renderHistory();
  showToast('Welcome, ' + name + '!');
  fetch('/api/track', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  }).catch(() => {});
});

loginNameInput.addEventListener('keydown', e => {
  if (e.key === 'Enter') loginBtn.click();
});

checkLogin();

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
  if (!select) return;
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

// ─── PWA / Service Worker ────────────────────────────────────────────────────
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js').catch(() => {});
}

// ─── Install Prompt ──────────────────────────────────────────────────────────
let deferredPrompt;
window.addEventListener('beforeinstallprompt', e => {
  e.preventDefault();
  deferredPrompt = e;
  const btn = document.createElement('button');
  btn.id = 'installAppBtn';
  btn.className = 'fixed bottom-4 right-4 z-[999] inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 text-white font-semibold text-xs shadow-lg shadow-brand-600/30 hover:shadow-brand-500/40 active:scale-[0.98] transition-all duration-200 animate-bounce-in';
  btn.innerHTML = '<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg> Install App';
  btn.addEventListener('click', async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const result = await deferredPrompt.userChoice;
      if (result.outcome === 'accepted') btn.remove();
      deferredPrompt = null;
    }
  });
  document.body.appendChild(btn);
});

window.addEventListener('appinstalled', () => {
  document.getElementById('installAppBtn')?.remove();
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
initCustomSelect('languageSelect');

// ─── Sliders ────────────────────────────────────────────────────────────────
captionCount.addEventListener('input', () => { captionCountVal.textContent = captionCount.value; });
hashtagCount.addEventListener('input', () => { hashtagCountVal.textContent = hashtagCount.value; });

// ─── Emoji Toggle ──────────────────────────────────────────────────────────
emojiToggle.addEventListener('click', () => {
  emojisEnabled = !emojisEnabled;
  emojiThumb.style.transform = emojisEnabled ? 'translateX(1.375rem)' : 'translateX(0.1875rem)';
  emojiToggle.classList.toggle('bg-brand-600', emojisEnabled);
  emojiToggle.classList.toggle('bg-surface-300', !emojisEnabled);
  emojiLabel.textContent = emojisEnabled ? 'ON' : 'OFF';
});

// ─── History (localStorage) ─────────────────────────────────────────────────
function getHistory() {
  try { return JSON.parse(localStorage.getItem('acg_history')) || []; }
  catch { return []; }
}

function saveToHistory(entry) {
  const h = getHistory();
  entry.id = Date.now();
  entry.savedAt = new Date().toISOString();
  h.unshift(entry);
  if (h.length > 20) h.length = 20;
  localStorage.setItem('acg_history', JSON.stringify(h));
  renderHistory();
  showToast('Saved to history!');
}

function deleteHistoryItem(id) {
  let h = getHistory();
  h = h.filter(e => e.id !== id);
  localStorage.setItem('acg_history', JSON.stringify(h));
  renderHistory();
}

function clearHistory() {
  localStorage.removeItem('acg_history');
  renderHistory();
}

function syncCustomSelect(id) {
  const sel = document.getElementById(id);
  if (sel) sel.dispatchEvent(new Event('change', { bubbles: true }));
}

function loadHistoryItem(entry) {
  topicInput.value = entry.topic;
  platformSelect.value = entry.platform;
  syncCustomSelect('platformSelect');
  toneSelect.value = entry.tone;
  syncCustomSelect('toneSelect');
  lengthSelect.value = entry.length;
  syncCustomSelect('lengthSelect');
  languageSelect.value = entry.language || 'English';
  syncCustomSelect('languageSelect');
  keywordsInput.value = entry.keywords || '';
  brandVoiceInput.value = entry.brandVoice || '';
  captionCount.value = entry.captionCount || 4;
  captionCountVal.textContent = captionCount.value;
  hashtagCount.value = entry.hashtagCount || 20;
  hashtagCountVal.textContent = hashtagCount.value;
  emojisEnabled = entry.emojis !== false;
  emojiThumb.style.transform = emojisEnabled ? 'translateX(1.375rem)' : 'translateX(0.1875rem)';
  emojiToggle.classList.toggle('bg-brand-600', emojisEnabled);
  emojiToggle.classList.toggle('bg-surface-300', !emojisEnabled);
  emojiLabel.textContent = emojisEnabled ? 'ON' : 'OFF';
  showToast('History restored!');
}

function renderHistory() {
  const h = getHistory();
  if (h.length === 0) { historyBar.classList.add('hidden'); return; }
  historyBar.classList.remove('hidden');
  historyList.innerHTML = h.map(e => `
    <div class="history-item flex-shrink-0 glass-card rounded-xl p-3 min-w-[160px] max-w-[200px]" onclick="loadHistoryItem(getHistory().find(x=>x.id===${e.id}))">
      <p class="text-xs font-medium text-surface-800 truncate">${escapeHtml(e.topic.substring(0, 40))}</p>
      <p class="text-[10px] text-surface-400 mt-0.5">${escapeHtml(e.tone)} · ${escapeHtml(e.platform)}</p>
      <p class="text-[10px] text-surface-400">${new Date(e.savedAt).toLocaleDateString()}</p>
      <button class="text-[10px] text-red-400 hover:text-red-600 mt-1" onclick="event.stopPropagation();deleteHistoryItem(${e.id})">Delete</button>
    </div>
  `).join('');
}

clearHistoryBtn.addEventListener('click', () => {
  if (confirm('Clear all history?')) clearHistory();
});

// ─── Page Switching ─────────────────────────────────────────────────────────
function showInputPage() {
  resultsPage.classList.add('hidden');
  inputPage.classList.remove('hidden');
  document.body.style.overflow = '';
  generationCount = 0;
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
  captionsContainer.innerHTML = captions.map((c, idx) => {
    const id = c.id || idx;
    return `
    <div class="caption-card relative bg-white rounded-xl p-3.5 sm:p-4 animate-slide-up" data-caption-id="${id}">
      <div class="caption-text text-sm sm:text-base text-surface-800 leading-relaxed mb-2">${escapeHtml(c.text)}</div>

      <!-- Inline Edit Area (hidden by default) -->
      <div class="caption-edit hidden mb-2">
        <textarea class="w-full rounded-lg border border-surface-200 bg-surface-50 px-3 py-2 text-sm text-surface-800 resize-none focus:outline-none focus:ring-2 focus:ring-brand-500/30" rows="3">${escapeHtml(c.text)}</textarea>
        <div class="flex gap-2 mt-1.5">
          <button class="edit-save-btn text-xs px-3 py-1.5 rounded-lg bg-brand-600 text-white hover:bg-brand-500 transition-colors" data-idx="${idx}">Save</button>
          <button class="edit-cancel-btn text-xs px-3 py-1.5 rounded-lg border border-surface-200 text-surface-600 hover:bg-surface-50 transition-colors">Cancel</button>
        </div>
      </div>

      <div class="flex items-center gap-1.5 flex-wrap">
        <!-- Copy -->
        <button class="copy-caption-btn p-1.5 rounded-lg text-surface-400 hover:text-brand-600 hover:bg-brand-50 transition-all duration-200" data-text="${escapeHtml(c.text)}" title="Copy caption">
          <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>
        </button>

        <!-- Edit -->
        <button class="edit-toggle-btn p-1.5 rounded-lg text-surface-400 hover:text-brand-600 hover:bg-brand-50 transition-all duration-200" data-idx="${idx}" title="Edit caption">
          <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
        </button>

        <!-- Variations -->
        <div class="relative group">
          <button class="variation-trigger p-1.5 rounded-lg text-surface-400 hover:text-brand-600 hover:bg-brand-50 transition-all duration-200" title="Generate variation">
            <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
          </button>
          <div class="variation-menu hidden absolute bottom-full left-0 mb-1 bg-white border border-surface-200 rounded-xl shadow-lg overflow-hidden z-20 min-w-[140px]">
            <button class="variation-btn block w-full text-left px-3 py-2 text-xs text-surface-700 hover:bg-surface-50 transition-colors" data-idx="${idx}" data-direction="longer">Make Longer</button>
            <button class="variation-btn block w-full text-left px-3 py-2 text-xs text-surface-700 hover:bg-surface-50 transition-colors" data-idx="${idx}" data-direction="shorter">Make Shorter</button>
            <button class="variation-btn block w-full text-left px-3 py-2 text-xs text-surface-700 hover:bg-surface-50 transition-colors" data-idx="${idx}" data-direction="funnier">Make Funnier</button>
          </div>
        </div>

        <!-- Feedback -->
        <button class="feedback-btn like-btn p-1.5 rounded-lg text-surface-400 hover:text-green-600 hover:bg-green-50 transition-all duration-200" title="Good caption" data-idx="${idx}">
          <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5"/></svg>
        </button>
        <button class="feedback-btn dislike-btn p-1.5 rounded-lg text-surface-400 hover:text-red-600 hover:bg-red-50 transition-all duration-200" title="Needs improvement" data-idx="${idx}">
          <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018a2 2 0 01.485.06l3.76.94m-7 10v5a2 2 0 002 2h.096c.5 0 .905-.405.905-.904 0-.715.211-1.413.608-2.008L17 13V4m-7 10h2m5-10h2a2 2 0 012 2v6a2 2 0 01-2 2h-2.5"/></svg>
        </button>
      </div>
    </div>`;
  }).join('');

  // Copy buttons
  captionsContainer.querySelectorAll('.copy-caption-btn').forEach(btn => {
    btn.addEventListener('click', () => copyText(btn.dataset.text));
  });

  // Edit toggle
  captionsContainer.querySelectorAll('.edit-toggle-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const card = btn.closest('.caption-card');
      const textDiv = card.querySelector('.caption-text');
      const editArea = card.querySelector('.caption-edit');
      const isEditing = !editArea.classList.contains('hidden');
      textDiv.classList.toggle('hidden', !isEditing);
      editArea.classList.toggle('hidden', isEditing);
    });
  });

  // Edit save
  captionsContainer.querySelectorAll('.edit-save-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const card = btn.closest('.caption-card');
      const textarea = card.querySelector('.caption-edit textarea');
      const textDiv = card.querySelector('.caption-text');
      const newText = textarea.value.trim();
      if (!newText) { showToast('Caption cannot be empty.'); return; }
      textDiv.textContent = newText;
      textDiv.classList.remove('hidden');
      card.querySelector('.caption-edit').classList.add('hidden');
      card.querySelector('.copy-caption-btn').dataset.text = newText;
      showToast('Caption updated!');
    });
  });

  // Edit cancel
  captionsContainer.querySelectorAll('.edit-cancel-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const card = btn.closest('.caption-card');
      card.querySelector('.caption-text').classList.remove('hidden');
      card.querySelector('.caption-edit').classList.add('hidden');
    });
  });

  // Variation menu toggle
  captionsContainer.querySelectorAll('.variation-trigger').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      const menu = btn.nextElementSibling;
      const isOpen = !menu.classList.contains('hidden');
      document.querySelectorAll('.variation-menu').forEach(m => m.classList.add('hidden'));
      if (!isOpen) menu.classList.remove('hidden');
    });
  });

  document.addEventListener('click', () => {
    document.querySelectorAll('.variation-menu').forEach(m => m.classList.add('hidden'));
  });

  // Variation buttons
  captionsContainer.querySelectorAll('.variation-btn').forEach(btn => {
    btn.addEventListener('click', async e => {
      e.stopPropagation();
      const idx = Number(btn.dataset.idx);
      const direction = btn.dataset.direction;
      const card = btn.closest('.caption-card');
      const textDiv = card.querySelector('.caption-text');
      const originalText = textDiv.textContent;

      btn.textContent = '...';
      btn.disabled = true;

      try {
        const res = await fetch('/api/variation', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: originalText, direction }),
        });
        if (!res.ok) throw new Error('Failed');
        const data = await res.json();
        if (data.text && data.text !== originalText) {
          textDiv.textContent = data.text;
          card.querySelector('.copy-caption-btn').dataset.text = data.text;
          showToast(`${direction} version ready!`);
        } else {
          showToast('Could not generate variation.');
        }
      } catch {
        showToast('Failed to generate variation.');
      } finally {
        btn.textContent = direction.charAt(0).toUpperCase() + direction.slice(1);
        btn.disabled = false;
        btn.closest('.variation-menu')?.classList.add('hidden');
      }
    });
  });

  // Feedback buttons
  captionsContainer.querySelectorAll('.feedback-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      btn.classList.toggle('active');
      const isLike = btn.classList.contains('like-btn');
      const otherBtn = btn.closest('.caption-card').querySelector(isLike ? '.dislike-btn' : '.like-btn');
      otherBtn?.classList.remove('active');
      showToast(isLike ? 'Glad you liked it! 👍' : 'Thanks for the feedback!');
    });
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
async function generateContent(topic, tone, platform, emojis, captionLength, captionCount, hashtagCount, language, keywords, brandVoice) {
  const res = await fetch('/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ topic, tone, platform, emojis, captionLength, captionCount, hashtagCount, language, keywords, brandVoice }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Request failed (${res.status})`);
  }
  return res.json();
}

// ─── Copy All ───────────────────────────────────────────────────────────────
function handleCopyAll() {
  const captions = [...captionsContainer.querySelectorAll('.caption-text')].map(p => p.textContent.trim());
  const parts = ['── Captions ──', ...captions, '', '── Hashtags ──'];
  hashtagsContainer.querySelectorAll('.mb-3').forEach(groupEl => {
    const label = groupEl.querySelector('p')?.textContent?.trim() || '';
    const tags = [...groupEl.querySelectorAll('[data-tag]')].map(el => el.dataset.tag);
    if (tags.length) { parts.push(label); parts.push(tags.join(' ')); }
  });
  copyText(parts.join('\n'));
}

copyAllBtn.addEventListener('click', handleCopyAll);

// ─── Export ─────────────────────────────────────────────────────────────────
exportBtn.addEventListener('click', e => {
  e.stopPropagation();
  exportDropdown.classList.toggle('hidden');
});

document.addEventListener('click', () => exportDropdown.classList.add('hidden'));

document.querySelectorAll('.export-option').forEach(btn => {
  btn.addEventListener('click', () => {
    const format = btn.dataset.format;
    const captions = [...captionsContainer.querySelectorAll('.caption-text')].map(p => p.textContent.trim());
    let allTags = [];
    hashtagsContainer.querySelectorAll('[data-tag]').forEach(el => allTags.push(el.dataset.tag));

    if (format === 'txt') {
      const txt = ['AI Caption Genie - Export', '', '--- Captions ---', ...captions, '', '--- Hashtags ---', allTags.join(' ')].join('\n');
      downloadFile(txt, 'captions.txt', 'text/plain');
    } else if (format === 'csv') {
      const rows = [['Type', 'Content']];
      captions.forEach(c => rows.push(['Caption', c]));
      allTags.forEach(t => rows.push(['Hashtag', t]));
      const csv = rows.map(r => r.map(v => `"${v.replace(/"/g, '""')}"`).join(',')).join('\n');
      downloadFile(csv, 'captions.csv', 'text/csv');
    }
    exportDropdown.classList.add('hidden');
    showToast(`Exported as ${format.toUpperCase()}!`);
  });
});

function downloadFile(content, filename, mime) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ─── Share ───────────────────────────────────────────────────────────────────
shareBtn.addEventListener('click', () => {
  const captions = [...captionsContainer.querySelectorAll('.caption-text')].map(p => p.textContent.trim());
  const allTags = [];
  hashtagsContainer.querySelectorAll('[data-tag]').forEach(el => allTags.push(el.dataset.tag));

  const shareData = {
    title: 'AI Caption Genie',
    text: captions.slice(0, 2).join('\n') + '\n\nHashtags: ' + allTags.slice(0, 5).join(' '),
    url: window.location.href,
  };

  if (navigator.share) {
    navigator.share(shareData).catch(() => {});
  } else {
    const shareText = ['✨ AI Caption Genie', '', ...captions, '', '--- Hashtags ---', allTags.join(' ')].join('\n');
    copyText(shareText);
    showToast('Share content copied to clipboard!');
  }
});

// ─── Preview ─────────────────────────────────────────────────────────────────
function openPreview(captionText, tags) {
  previewUsername.textContent = userName || 'User';
  previewAvatar.textContent = (userName || 'U')[0].toUpperCase();
  previewCaption.textContent = captionText;
  previewHashtags.innerHTML = tags.slice(0, 10).map(t => `<span class="text-[11px] text-brand-600">${escapeHtml(t)}</span>`).join(' ');
  previewOverlay.classList.remove('hidden');
}

function closePreview() {
  previewOverlay.classList.add('hidden');
}

previewBtn.addEventListener('click', () => {
  const captions = [...captionsContainer.querySelectorAll('.caption-text')];
  if (captions.length === 0) { showToast('No captions to preview.'); return; }
  const allTags = [];
  hashtagsContainer.querySelectorAll('[data-tag]').forEach(el => allTags.push(el.dataset.tag));
  openPreview(captions[0].textContent.trim(), allTags);
});

// ─── Save to History ─────────────────────────────────────────────────────────
saveToHistoryBtn.addEventListener('click', () => {
  if (!lastResult) { showToast('No results to save.'); return; }
  const allTags = [];
  hashtagsContainer.querySelectorAll('[data-tag]').forEach(el => allTags.push(el.dataset.tag));
  const entry = {
    topic: topicInput.value.trim(),
    tone: toneSelect.value.toLowerCase(),
    platform: platformSelect.value,
    length: lengthSelect.value.toLowerCase(),
    language: languageSelect.value,
    keywords: keywordsInput.value.trim(),
    brandVoice: brandVoiceInput.value.trim(),
    emojis: emojisEnabled,
    captionCount: Number(captionCount.value),
    hashtagCount: Number(hashtagCount.value),
    result: lastResult,
  };
  saveToHistory(entry);
});

// ─── Main Generate ──────────────────────────────────────────────────────────
let generationCount = 0;

async function handleGenerate() {
  if (!userName) { loginOverlay.classList.remove('hidden'); return; }

  const topic = topicInput.value.trim();
  if (!topic) { showToast('Please describe your content topic first.'); topicInput.focus(); return; }

  const tone = toneSelect.value.toLowerCase();
  const platform = platformSelect.value;
  const captionLength = lengthSelect.value.toLowerCase();
  const language = languageSelect.value;
  const keywords = keywordsInput.value.trim();
  const brandVoice = brandVoiceInput.value.trim();
  const cc = Number(captionCount.value);
  const hc = Number(hashtagCount.value);

  setLoading(true);
  resultsContent.classList.add('hidden');
  resultsSkeleton.classList.remove('hidden');
  showResultsPage();

  try {
    const data = await generateContent(topic, tone, platform, emojisEnabled, captionLength, cc, hc, language, keywords, brandVoice);
    lastResult = data;

    renderCaptions(data.captions);
    renderHashtags(data.hashtags);
    resultsCaptionCount.textContent = `${data.captions.length} captions`;
    const totalTags = (data.hashtags.highTraffic?.length || 0) + (data.hashtags.niche?.length || 0) + (data.hashtags.location?.length || 0);
    resultsHashtagCount.textContent = `${totalTags} tags`;

    const toneLabel = toneSelect.options[toneSelect.selectedIndex].text;
    const lengthLabel = lengthSelect.options[lengthSelect.selectedIndex].text;
    resultsMeta.textContent = `${toneLabel} · ${lengthLabel} · ${platform} · ${cc} captions · ${hc} tags · ${language}`;

    resultsSkeleton.classList.add('hidden');
    resultsContent.classList.remove('hidden');
    generationCount++;
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

// ─── Init History ───────────────────────────────────────────────────────────
renderHistory();

// ─── Admin Panel ─────────────────────────────────────────────────────────────
const adminOverlay      = document.getElementById('adminOverlay');
const adminModal        = document.getElementById('adminModal');
const adminLoginView    = document.getElementById('adminLoginView');
const adminDataView     = document.getElementById('adminDataView');
const adminNameInput    = document.getElementById('adminNameInput');
const adminPassInput    = document.getElementById('adminPassInput');
const adminLoginBtn     = document.getElementById('adminLoginBtn');
const adminLogoutBtn    = document.getElementById('adminLogoutBtn');
const adminCloseBtn     = document.getElementById('adminCloseBtn');
const adminError        = document.getElementById('adminError');
const adminTotalVisits  = document.getElementById('adminTotalVisits');
const adminUniqueUsers  = document.getElementById('adminUniqueUsers');
const adminVisitorsTable = document.getElementById('adminVisitorsTable');
const adminPanelBtn     = document.getElementById('adminPanelBtn');

adminPanelBtn.addEventListener('click', () => {
  adminOverlay.classList.remove('hidden');
  adminLoginView.classList.remove('hidden');
  adminDataView.classList.add('hidden');
  adminError.classList.add('hidden');
  adminNameInput.value = '';
  adminPassInput.value = '';
  adminNameInput.focus();
});

adminCloseBtn.addEventListener('click', () => adminOverlay.classList.add('hidden'));
adminLogoutBtn.addEventListener('click', () => {
  adminLoginView.classList.remove('hidden');
  adminDataView.classList.add('hidden');
  adminError.classList.add('hidden');
});

adminOverlay.addEventListener('click', e => {
  if (e.target === adminOverlay) adminOverlay.classList.add('hidden');
});

adminPassInput.addEventListener('keydown', e => {
  if (e.key === 'Enter') adminLoginBtn.click();
});

adminLoginBtn.addEventListener('click', async () => {
  const name = adminNameInput.value.trim() || 'Admin';
  const pass = adminPassInput.value.trim();
  if (!pass) {
    adminError.textContent = 'Please enter the admin password.';
    adminError.classList.remove('hidden');
    return;
  }

  adminLoginBtn.textContent = 'Checking...';
  adminLoginBtn.disabled = true;
  adminError.classList.add('hidden');

  try {
    const res = await fetch('/api/admin/visitors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, password: pass }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Invalid credentials');
    }

    const data = await res.json();
    adminUniqueUsers.textContent = data.unique;

    adminVisitorsTable.innerHTML = data.visitors.slice().reverse().map(v => `
      <div class="flex items-center justify-between bg-surface-50 rounded-xl px-4 py-2.5">
        <div>
          <p class="text-sm font-medium text-surface-800">${escapeHtml(v.name)}</p>
          <p class="text-[10px] text-surface-400">${new Date(v.timestamp).toLocaleString()}</p>
        </div>
        <span class="text-[10px] text-surface-400">${escapeHtml(v.ip)}</span>
      </div>
    `).join('');

    adminLoginView.classList.add('hidden');
    adminDataView.classList.remove('hidden');
  } catch (err) {
    adminError.textContent = err.message || 'Login failed. Try again.';
    adminError.classList.remove('hidden');
  } finally {
    adminLoginBtn.textContent = 'Login';
    adminLoginBtn.disabled = false;
  }
});
