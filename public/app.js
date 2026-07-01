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
const navHome           = document.getElementById('navHome');
const navHistory        = document.getElementById('navHistory');
const navMore           = document.getElementById('navMore');

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

// ─── Sliders ────────────────────────────────────────────────────────────────
captionCount.addEventListener('input', () => { captionCountVal.textContent = captionCount.value; });
hashtagCount.addEventListener('input', () => { hashtagCountVal.textContent = hashtagCount.value; });

// ─── Emoji Toggle ──────────────────────────────────────────────────────────
emojiToggle.addEventListener('click', () => {
  emojisEnabled = !emojisEnabled;
  emojiThumb.style.transform = emojisEnabled ? 'translateX(20px)' : 'translateX(0)';
  emojiToggle.classList.toggle('active', emojisEnabled);
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
  if (!confirm('Clear all history?')) return;
  localStorage.removeItem('acg_history');
  renderHistory();
}

function loadHistoryItem(entry) {
  topicInput.value = entry.topic;
  platformSelect.value = entry.platform;
  toneSelect.value = entry.tone;
  lengthSelect.value = entry.length;
  languageSelect.value = entry.language || 'English';
  keywordsInput.value = entry.keywords || '';
  brandVoiceInput.value = entry.brandVoice || '';
  captionCount.value = entry.captionCount || 4;
  captionCountVal.textContent = captionCount.value;
  hashtagCount.value = entry.hashtagCount || 20;
  hashtagCountVal.textContent = hashtagCount.value;
  emojisEnabled = entry.emojis !== false;
  emojiThumb.style.transform = emojisEnabled ? 'translateX(20px)' : 'translateX(0)';
  emojiToggle.classList.toggle('active', emojisEnabled);
  emojiLabel.textContent = emojisEnabled ? 'ON' : 'OFF';
  showToast('History restored!');
}

function renderHistory() {
  const h = getHistory();
  if (h.length === 0) { historyBar.classList.add('hidden'); return; }
  historyBar.classList.remove('hidden');
  historyList.innerHTML = h.map(e => `
    <div class="history-chip" onclick="loadHistoryItem(getHistory().find(x=>x.id===${e.id}))">
      <p style="font-size:12px;font-weight:600;color:#1e293b;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:140px;">${escapeHtml(e.topic.substring(0, 30))}</p>
      <p style="font-size:10px;color:#94a3b8;margin-top:2px;">${escapeHtml(e.tone)} · ${escapeHtml(e.platform)}</p>
      <div style="display:flex;align-items:center;justify-content:space-between;margin-top:4px;">
        <span style="font-size:9px;color:#cbd5e1;">${new Date(e.savedAt).toLocaleDateString()}</span>
        <span style="font-size:10px;color:#ef4444;cursor:pointer;" onclick="event.stopPropagation();deleteHistoryItem(${e.id})">✕</span>
      </div>
    </div>
  `).join('');
}

clearHistoryBtn.addEventListener('click', clearHistory);

// ─── Page Switching ─────────────────────────────────────────────────────────
function showInputPage() {
  resultsPage.classList.add('hidden');
  inputPage.classList.remove('hidden');
  document.body.style.overflow = '';
  setActiveNav(navHome);
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

// ─── Bottom Nav ─────────────────────────────────────────────────────────────
function setActiveNav(active) {
  [navHome, navHistory, navMore].forEach(b => b.classList.remove('active'));
  if (active) active.classList.add('active');
}

navHome.addEventListener('click', () => {
  setActiveNav(navHome);
  showInputPage();
});

navHistory.addEventListener('click', () => {
  setActiveNav(navHistory);
  showInputPage();
  historyBar.classList.remove('hidden');
  renderHistory();
  historyBar.scrollIntoView({ behavior: 'smooth', block: 'center' });
});

navMore.addEventListener('click', () => {
  setActiveNav(navMore);
  showExportHistory();
});

// ─── Export History (More tab action) ─────────────────────────────────────
function showExportHistory() {
  const h = getHistory();
  if (h.length === 0) { showToast('No history to export.'); return; }
  const lines = ['AI Caption Genie - Saved History', ''];
  h.forEach(e => {
    lines.push(`Topic: ${e.topic}`);
    lines.push(`Platform: ${e.platform} | Tone: ${e.tone} | Date: ${new Date(e.savedAt).toLocaleString()}`);
    if (e.result?.captions) {
      e.result.captions.forEach(c => lines.push(`  - ${c.text}`));
    }
    lines.push('');
  });
  downloadFile(lines.join('\n'), 'caption_history.txt', 'text/plain');
  showToast('History exported!');
}

// ─── Loading ────────────────────────────────────────────────────────────────
function setLoading(v) {
  generateBtn.disabled = v;
  btnText.textContent = v ? 'Generating...' : '✨ Generate Captions';
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
    <div class="caption-card" data-caption-id="${id}">
      <div class="caption-text">${escapeHtml(c.text)}</div>
      <div class="caption-edit hidden" style="margin-bottom:8px;">
        <textarea style="width:100%;padding:10px;border:1.5px solid #e2e8f0;border-radius:10px;font-size:13px;resize:none;outline:none;font-family:inherit;background:#f8fafc;" rows="3">${escapeHtml(c.text)}</textarea>
        <div style="display:flex;gap:8px;margin-top:6px;">
          <button class="edit-save" data-idx="${idx}" style="padding:6px 14px;background:#2563eb;color:#fff;border:none;border-radius:8px;font-size:12px;cursor:pointer;font-family:inherit;">Save</button>
          <button class="edit-cancel" style="padding:6px 14px;background:#f1f5f9;color:#475569;border:none;border-radius:8px;font-size:12px;cursor:pointer;font-family:inherit;">Cancel</button>
        </div>
      </div>
      <div style="display:flex;gap:6px;flex-wrap:wrap;">
        <button class="act-copy" data-text="${escapeHtml(c.text)}" style="padding:6px 10px;border-radius:8px;border:1px solid #e2e8f0;background:#fff;color:#475569;font-size:11px;cursor:pointer;font-family:inherit;display:flex;align-items:center;gap:4px;">
          <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>
          Copy
        </button>
        <button class="act-edit" data-idx="${idx}" style="padding:6px 10px;border-radius:8px;border:1px solid #e2e8f0;background:#fff;color:#475569;font-size:11px;cursor:pointer;font-family:inherit;display:flex;align-items:center;gap:4px;">
          <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
          Edit
        </button>
        <button class="act-like" data-idx="${idx}" style="padding:6px 10px;border-radius:8px;border:1px solid #e2e8f0;background:#fff;color:#475569;font-size:11px;cursor:pointer;font-family:inherit;display:flex;align-items:center;gap:4px;">👍</button>
        <button class="act-variation" data-idx="${idx}" style="padding:6px 10px;border-radius:8px;border:1px solid #e2e8f0;background:#fff;color:#475569;font-size:11px;cursor:pointer;font-family:inherit;display:flex;align-items:center;gap:4px;">🔄 Variation</button>
      </div>
    </div>`;
  }).join('');

  captionsContainer.querySelectorAll('.act-copy').forEach(btn => {
    btn.addEventListener('click', () => copyText(btn.dataset.text));
  });

  captionsContainer.querySelectorAll('.act-edit').forEach(btn => {
    btn.addEventListener('click', () => {
      const card = btn.closest('.caption-card');
      const textDiv = card.querySelector('.caption-text');
      const editArea = card.querySelector('.caption-edit');
      const isEditing = !editArea.classList.contains('hidden');
      textDiv.classList.toggle('hidden', !isEditing);
      editArea.classList.toggle('hidden', isEditing);
    });
  });

  captionsContainer.querySelectorAll('.edit-save').forEach(btn => {
    btn.addEventListener('click', () => {
      const card = btn.closest('.caption-card');
      const textarea = card.querySelector('.caption-edit textarea');
      const textDiv = card.querySelector('.caption-text');
      const newText = textarea.value.trim();
      if (!newText) { showToast('Caption cannot be empty.'); return; }
      textDiv.textContent = newText;
      textDiv.classList.remove('hidden');
      card.querySelector('.caption-edit').classList.add('hidden');
      card.querySelector('.act-copy').dataset.text = newText;
      showToast('Caption updated!');
    });
  });

  captionsContainer.querySelectorAll('.edit-cancel').forEach(btn => {
    btn.addEventListener('click', () => {
      const card = btn.closest('.caption-card');
      card.querySelector('.caption-text').classList.remove('hidden');
      card.querySelector('.caption-edit').classList.add('hidden');
    });
  });

  captionsContainer.querySelectorAll('.act-like').forEach(btn => {
    btn.addEventListener('click', () => {
      btn.style.borderColor = '#22c55e';
      btn.style.color = '#22c55e';
      btn.style.background = '#f0fdf4';
      showToast('Thanks! 👍');
    });
  });

  captionsContainer.querySelectorAll('.act-variation').forEach(btn => {
    btn.addEventListener('click', async () => {
      const card = btn.closest('.caption-card');
      const textDiv = card.querySelector('.caption-text');
      const original = textDiv.textContent;
      btn.textContent = '...';
      btn.disabled = true;
      try {
        const res = await fetch('/api/variation', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: original, direction: 'longer' }),
        });
        if (!res.ok) throw new Error();
        const data = await res.json();
        if (data.text && data.text !== original) {
          textDiv.textContent = data.text;
          card.querySelector('.act-copy').dataset.text = data.text;
          showToast('Variation ready!');
        } else showToast('Could not generate variation.');
      } catch { showToast('Failed.'); }
      finally {
        btn.textContent = '🔄 Variation';
        btn.disabled = false;
      }
    });
  });
}

// ─── Render Hashtags ────────────────────────────────────────────────────────
function renderHashtags(tags) {
  const groups = [
    { key: 'highTraffic', label: 'High Traffic', color: 'background:#eff6ff;color:#2563eb;border-color:#bfdbfe' },
    { key: 'niche', label: 'Niche', color: 'background:#ecfdf5;color:#059669;border-color:#a7f3d0' },
    { key: 'location', label: 'Location', color: 'background:#fffbeb;color:#d97706;border-color:#fde68a' },
  ];

  let html = '';
  for (const g of groups) {
    const list = tags[g.key] || [];
    if (list.length === 0) continue;
    html += `
      <div style="margin-bottom:10px;">
        <p style="font-size:10px;font-weight:600;color:#64748b;text-transform:uppercase;letter-spacing:.6px;margin-bottom:6px;">${g.label} (${list.length})</p>
        <div style="display:flex;flex-wrap:wrap;gap:6px;">
          ${list.map(tag => `
            <span class="tag-badge" style="${g.color}" data-tag="${escapeHtml(tag)}">${escapeHtml(tag)}</span>
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
  hashtagsContainer.querySelectorAll('[style*="margin-bottom:10px"]').forEach(groupEl => {
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
    const allTags = [];
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

  const text = captions.slice(0, 2).join('\n') + '\n\nHashtags: ' + allTags.slice(0, 5).join(' ');

  if (navigator.share) {
    navigator.share({ title: 'AI Caption Genie', text, url: window.location.href }).catch(() => {});
  } else {
    copyText(['✨ AI Caption Genie', '', ...captions, '', '--- Hashtags ---', allTags.join(' ')].join('\n'));
    showToast('Share content copied to clipboard!');
  }
});

// ─── Preview ─────────────────────────────────────────────────────────────────
function openPreview(captionText, tags) {
  previewUsername.textContent = 'User';
  previewAvatar.textContent = 'U';
  previewCaption.textContent = captionText;
  previewHashtags.innerHTML = tags.slice(0, 10).map(t => `<span style="font-size:11px;color:#2563eb;">${escapeHtml(t)}</span>`).join(' ');
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
  const captions = [...captionsContainer.querySelectorAll('.caption-text')].map(p => p.textContent.trim());
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
async function handleGenerate() {
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

// ─── PWA ────────────────────────────────────────────────────────────────────
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js').catch(() => {});
}

let deferredPrompt;
window.addEventListener('beforeinstallprompt', e => {
  e.preventDefault();
  deferredPrompt = e;
  const btn = document.createElement('button');
  btn.id = 'installAppBtn';
  btn.style.cssText = 'position:fixed;bottom:80px;right:16px;z-index:999;display:inline-flex;align-items:center;gap:8px;padding:10px 16px;border-radius:12px;background:linear-gradient(135deg,#2563eb,#1d4ed8);color:#fff;border:none;font-size:12px;font-weight:600;cursor:pointer;box-shadow:0 4px 16px rgba(37,99,235,.3);font-family:inherit;animation:bounceIn .4s ease-out;';
  btn.innerHTML = '<svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg> Install App';
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
