// ─── DOM ────────────────────────────────────────────────────────────────────
const toast           = document.getElementById('toast');
const loginOverlay    = document.getElementById('loginOverlay');
const loginNameInput   = document.getElementById('loginNameInput');
const loginBtn         = document.getElementById('loginBtn');
const headerUserName  = document.getElementById('headerUserName');
const tabContainer    = document.getElementById('tabContainer');
const navItems        = document.querySelectorAll('.bottom-nav-item');
const adminOverlay    = document.getElementById('adminOverlay');
const adminLoginView  = document.getElementById('adminLoginView');
const adminDataView   = document.getElementById('adminDataView');
const adminNameInput   = document.getElementById('adminNameInput');
const adminPassInput   = document.getElementById('adminPassInput');
const adminLoginBtn    = document.getElementById('adminLoginBtn');
const adminLogoutBtn   = document.getElementById('adminLogoutBtn');
const adminCloseBtn    = document.getElementById('adminCloseBtn');
const adminError       = document.getElementById('adminError');
const adminUniqueUsers = document.getElementById('adminUniqueUsers');
const adminVisitorsTable = document.getElementById('adminVisitorsTable');
const previewOverlay  = document.getElementById('previewOverlay');
const previewUsername = document.getElementById('previewUsername');
const previewCaption  = document.getElementById('previewCaption');
const previewHashtags = document.getElementById('previewHashtags');
const previewAvatar   = document.getElementById('previewAvatar');

let userName = '';
let emojisEnabled = true;
let lastCapResult = null;
let lastTagResult = null;

// ─── Tab Switching ──────────────────────────────────────────────────────────
function switchTab(tabName) {
  document.querySelectorAll('.tab-panel').forEach(t => t.classList.remove('active'));
  const target = document.getElementById(tabName + 'Tab');
  if (target) target.classList.add('active');

  navItems.forEach(n => {
    n.classList.toggle('active', n.dataset.tab === tabName);
  });
}

navItems.forEach(item => {
  item.addEventListener('click', () => switchTab(item.dataset.tab));
});

// ─── Toast ──────────────────────────────────────────────────────────────────
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

// ─── Login ──────────────────────────────────────────────────────────────────
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

// ─── Custom Select ──────────────────────────────────────────────────────────
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

  select.addEventListener('change', () => {
    const idx = select.selectedIndex;
    textSpan.textContent = select.options[idx].text;
    dropdown.querySelectorAll('.custom-select-option').forEach(el => {
      el.classList.toggle('selected', Number(el.dataset.index) === idx);
    });
  });
}

initCustomSelect('capPlatform');
initCustomSelect('capTone');
initCustomSelect('capLength');
initCustomSelect('capLanguage');
initCustomSelect('tagPlatform');
initCustomSelect('tagLanguage');

// ─── Emoji Toggle (Captions tab) ────────────────────────────────────────────
const capEmojiToggle = document.getElementById('capEmojiToggle');
const capEmojiLabel = document.getElementById('capEmojiLabel');

capEmojiToggle.addEventListener('click', () => {
  emojisEnabled = !emojisEnabled;
  capEmojiToggle.querySelector('.switch-thumb').style.transform = emojisEnabled ? 'translateX(20px)' : 'translateX(0)';
  capEmojiToggle.classList.toggle('active', emojisEnabled);
  capEmojiLabel.textContent = emojisEnabled ? 'ON' : 'OFF';
});

// ─── Sliders ────────────────────────────────────────────────────────────────
const capCount = document.getElementById('capCount');
const capCountVal = document.getElementById('capCountVal');
capCount.addEventListener('input', () => { capCountVal.textContent = capCount.value; });

const tagCount = document.getElementById('tagCount');
const tagCountVal = document.getElementById('tagCountVal');
tagCount.addEventListener('input', () => { tagCountVal.textContent = tagCount.value; });

// ─── Render Captions ────────────────────────────────────────────────────────
function renderCaptions(container, captions) {
  container.innerHTML = captions.map((c, idx) => {
    const id = c.id || idx;
    return `
    <div class="caption-card" data-caption-id="${id}">
      <div class="caption-text" style="font-size:14px;color:#1e293b;line-height:1.6;margin-bottom:8px;">${escapeHtml(c.text)}</div>
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
        <button class="act-like" data-idx="${idx}" style="padding:6px 10px;border-radius:8px;border:1px solid #e2e8f0;background:#fff;color:#475569;font-size:11px;cursor:pointer;font-family:inherit;display:flex;align-items:center;gap:4px;">
          👍
        </button>
        <button class="act-variation" data-idx="${idx}" style="padding:6px 10px;border-radius:8px;border:1px solid #e2e8f0;background:#fff;color:#475569;font-size:11px;cursor:pointer;font-family:inherit;display:flex;align-items:center;gap:4px;">
          🔄 Variation
        </button>
      </div>
    </div>`;
  }).join('');

  // Copy
  container.querySelectorAll('.act-copy').forEach(btn => {
    btn.addEventListener('click', () => copyText(btn.dataset.text));
  });

  // Edit toggle
  container.querySelectorAll('.act-edit').forEach(btn => {
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
  container.querySelectorAll('.edit-save').forEach(btn => {
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

  // Edit cancel
  container.querySelectorAll('.edit-cancel').forEach(btn => {
    btn.addEventListener('click', () => {
      const card = btn.closest('.caption-card');
      card.querySelector('.caption-text').classList.remove('hidden');
      card.querySelector('.caption-edit').classList.add('hidden');
    });
  });

  // Like
  container.querySelectorAll('.act-like').forEach(btn => {
    btn.addEventListener('click', () => {
      btn.style.borderColor = '#22c55e';
      btn.style.color = '#22c55e';
      btn.style.background = '#f0fdf4';
      showToast('Thanks! 👍');
    });
  });

  // Variation
  container.querySelectorAll('.act-variation').forEach(btn => {
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
function renderHashtags(container, tags) {
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
  container.innerHTML = html;
  container.querySelectorAll('[data-tag]').forEach(el => {
    el.addEventListener('click', () => copyText(el.dataset.tag));
  });
}

// ─── API ────────────────────────────────────────────────────────────────────
async function generateAPI(params) {
  const res = await fetch('/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Request failed (${res.status})`);
  }
  return res.json();
}

// ─── CAPTIONS TAB ───────────────────────────────────────────────────────────
const capTopic = document.getElementById('capTopic');
const capPlatform = document.getElementById('capPlatform');
const capTone = document.getElementById('capTone');
const capLength = document.getElementById('capLength');
const capLanguage = document.getElementById('capLanguage');
const capKeywords = document.getElementById('capKeywords');
const capBrandVoice = document.getElementById('capBrandVoice');
const capGenerateBtn = document.getElementById('capGenerateBtn');
const capSpinner = document.getElementById('capSpinner');
const capBtnText = document.querySelector('.capBtnText');
const capResults = document.getElementById('capResults');
const capSkeleton = document.getElementById('capSkeleton');
const capContent = document.getElementById('capContent');
const capCaptionsContainer = document.getElementById('capCaptionsContainer');
const capCopyAll = document.getElementById('capCopyAll');
const capExportBtn = document.getElementById('capExportBtn');
const capExportDropdown = document.getElementById('capExportDropdown');
const capShareBtn = document.getElementById('capShareBtn');
const capPreviewBtn = document.getElementById('capPreviewBtn');
const capGenerateNew = document.getElementById('capGenerateNew');
const capCountDisplay = document.getElementById('capCountDisplay');

function capLoading(v) {
  capGenerateBtn.disabled = v;
  capBtnText.textContent = v ? 'Generating...' : '✨ Generate Captions';
  capSpinner.classList.toggle('hidden', !v);
}

function capShowResults(v) {
  if (v) {
    capResults.classList.remove('hidden');
    capSkeleton.classList.add('hidden');
    capContent.classList.remove('hidden');
  } else {
    capResults.classList.add('hidden');
  }
}

async function handleCapGenerate() {
  if (!userName) { loginOverlay.classList.remove('hidden'); return; }
  const topic = capTopic.value.trim();
  if (!topic) { showToast('Please describe your content topic first.'); capTopic.focus(); return; }

  const cc = Number(capCount.value);
  capLoading(true);
  capResults.classList.remove('hidden');
  capSkeleton.classList.remove('hidden');
  capContent.classList.add('hidden');

  try {
    const data = await generateAPI({
      mode: 'captions',
      topic,
      tone: capTone.value.toLowerCase(),
      platform: capPlatform.value,
      emojis: emojisEnabled,
      captionLength: capLength.value.toLowerCase(),
      captionCount: cc,
      hashtagCount: 0,
      language: capLanguage.value,
      keywords: capKeywords.value.trim(),
      brandVoice: capBrandVoice.value.trim(),
    });
    lastCapResult = data;
    renderCaptions(capCaptionsContainer, data.captions);
    capCountDisplay.textContent = `${data.captions.length} captions`;
    capSkeleton.classList.add('hidden');
    capContent.classList.remove('hidden');
    setTimeout(() => {
      document.getElementById('captionsTabScroll').scrollTo({ top: capResults.offsetTop - 120, behavior: 'smooth' });
    }, 100);
  } catch (err) {
    capSkeleton.classList.add('hidden');
    capContent.classList.add('hidden');
    showToast(err.message || 'Something went wrong.');
  } finally {
    capLoading(false);
  }
}

capGenerateBtn.addEventListener('click', handleCapGenerate);
capGenerateNew.addEventListener('click', () => {
  capResults.classList.add('hidden');
  document.getElementById('captionsTabScroll').scrollTo({ top: 0, behavior: 'smooth' });
  capTopic.focus();
});

capTopic.addEventListener('keydown', e => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); handleCapGenerate(); }
});

capTopic.addEventListener('input', debounce(function() {
  this.style.height = 'auto';
  this.style.height = this.scrollHeight + 'px';
}, 100));
capTopic.style.height = 'auto';
capTopic.style.height = capTopic.scrollHeight + 'px';

// Cap Copy All
capCopyAll.addEventListener('click', () => {
  const texts = [...capCaptionsContainer.querySelectorAll('.caption-text')].map(p => p.textContent.trim());
  if (texts.length === 0) { showToast('No captions.'); return; }
  copyText(texts.join('\n\n'));
});

// Cap Export
capExportBtn.addEventListener('click', e => {
  e.stopPropagation();
  capExportDropdown.classList.toggle('hidden');
});
document.addEventListener('click', () => capExportDropdown.classList.add('hidden'));
capExportDropdown.querySelectorAll('.capExportOption').forEach(btn => {
  btn.addEventListener('click', () => {
    const format = btn.dataset.format;
    const captions = [...capCaptionsContainer.querySelectorAll('.caption-text')].map(p => p.textContent.trim());
    if (format === 'txt') {
      downloadFile(['AI Caption Genie - Captions', '', ...captions].join('\n'), 'captions.txt', 'text/plain');
    } else {
      const rows = [['Type', 'Content'], ...captions.map(c => ['Caption', c])];
      const csv = rows.map(r => r.map(v => `"${v.replace(/"/g, '""')}"`).join(',')).join('\n');
      downloadFile(csv, 'captions.csv', 'text/csv');
    }
    capExportDropdown.classList.add('hidden');
    showToast(`Exported as ${format.toUpperCase()}!`);
  });
});

// Cap Share
capShareBtn.addEventListener('click', () => {
  const captions = [...capCaptionsContainer.querySelectorAll('.caption-text')].map(p => p.textContent.trim());
  if (captions.length === 0) { showToast('No captions.'); return; }
  const text = captions.slice(0, 3).join('\n\n');
  if (navigator.share) navigator.share({ title: 'AI Caption Genie', text }).catch(() => {});
  else { copyText(text); showToast('Copied to clipboard!'); }
});

// Cap Preview
capPreviewBtn.addEventListener('click', () => {
  const captions = [...capCaptionsContainer.querySelectorAll('.caption-text')];
  if (captions.length === 0) { showToast('No captions.'); return; }
  previewUsername.textContent = userName || 'User';
  previewAvatar.textContent = (userName || 'U')[0].toUpperCase();
  previewCaption.textContent = captions[0].textContent.trim();
  previewHashtags.innerHTML = '';
  previewOverlay.classList.remove('hidden');
});

function closePreview() {
  previewOverlay.classList.add('hidden');
}

// ─── TAGS TAB ───────────────────────────────────────────────────────────────
const tagTopic = document.getElementById('tagTopic');
const tagPlatform = document.getElementById('tagPlatform');
const tagLanguage = document.getElementById('tagLanguage');
const tagKeywords = document.getElementById('tagKeywords');
const tagGenerateBtn = document.getElementById('tagGenerateBtn');
const tagSpinner = document.getElementById('tagSpinner');
const tagBtnText = document.querySelector('.tagBtnText');
const tagResults = document.getElementById('tagResults');
const tagSkeleton = document.getElementById('tagSkeleton');
const tagContent = document.getElementById('tagContent');
const tagHashtagsContainer = document.getElementById('tagHashtagsContainer');
const tagCopyAll = document.getElementById('tagCopyAll');
const tagShareBtn = document.getElementById('tagShareBtn');
const tagGenerateNew = document.getElementById('tagGenerateNew');
const tagCountDisplay = document.getElementById('tagCountDisplay');

function tagLoading(v) {
  tagGenerateBtn.disabled = v;
  tagBtnText.textContent = v ? 'Generating...' : '#️⃣ Generate Hashtags';
  tagSpinner.classList.toggle('hidden', !v);
}

async function handleTagGenerate() {
  if (!userName) { loginOverlay.classList.remove('hidden'); return; }
  const topic = tagTopic.value.trim();
  if (!topic) { showToast('Please enter a topic for hashtags.'); tagTopic.focus(); return; }

  const hc = Number(tagCount.value);
  tagLoading(true);
  tagResults.classList.remove('hidden');
  tagSkeleton.classList.remove('hidden');
  tagContent.classList.add('hidden');

  try {
    const data = await generateAPI({
      mode: 'hashtags',
      topic,
      tone: 'professional',
      platform: tagPlatform.value,
      emojis: false,
      captionLength: 'medium',
      captionCount: 0,
      hashtagCount: hc,
      language: tagLanguage.value,
      keywords: tagKeywords.value.trim(),
      brandVoice: '',
    });
    lastTagResult = data;
    renderHashtags(tagHashtagsContainer, data.hashtags);
    const total = (data.hashtags.highTraffic?.length || 0) + (data.hashtags.niche?.length || 0) + (data.hashtags.location?.length || 0);
    tagCountDisplay.textContent = `${total} tags`;
    tagSkeleton.classList.add('hidden');
    tagContent.classList.remove('hidden');
    setTimeout(() => {
      document.getElementById('tagsTabScroll').scrollTo({ top: tagResults.offsetTop - 120, behavior: 'smooth' });
    }, 100);
  } catch (err) {
    tagSkeleton.classList.add('hidden');
    tagContent.classList.add('hidden');
    showToast(err.message || 'Something went wrong.');
  } finally {
    tagLoading(false);
  }
}

tagGenerateBtn.addEventListener('click', handleTagGenerate);
tagGenerateNew.addEventListener('click', () => {
  tagResults.classList.add('hidden');
  document.getElementById('tagsTabScroll').scrollTo({ top: 0, behavior: 'smooth' });
  tagTopic.focus();
});

tagTopic.addEventListener('keydown', e => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); handleTagGenerate(); }
});

tagTopic.addEventListener('input', debounce(function() {
  this.style.height = 'auto';
  this.style.height = this.scrollHeight + 'px';
}, 100));
tagTopic.style.height = 'auto';
tagTopic.style.height = tagTopic.scrollHeight + 'px';

tagCopyAll.addEventListener('click', () => {
  const tags = [];
  tagHashtagsContainer.querySelectorAll('[data-tag]').forEach(el => tags.push(el.dataset.tag));
  if (tags.length === 0) { showToast('No tags.'); return; }
  copyText(tags.join(' '));
});

tagShareBtn.addEventListener('click', () => {
  const tags = [];
  tagHashtagsContainer.querySelectorAll('[data-tag]').forEach(el => tags.push(el.dataset.tag));
  if (tags.length === 0) { showToast('No tags.'); return; }
  const text = '#️⃣ Hashtags\n' + tags.join(' ');
  if (navigator.share) navigator.share({ title: 'AI Caption Genie - Hashtags', text }).catch(() => {});
  else { copyText(text); showToast('Copied to clipboard!'); }
});

// ─── HISTORY TAB ────────────────────────────────────────────────────────────
const historyList = document.getElementById('historyList');
const historyEmpty = document.getElementById('historyEmpty');
const clearHistoryBtn = document.getElementById('clearHistoryBtn');

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
  if (!confirm('Clear all saved history?')) return;
  localStorage.removeItem('acg_history');
  renderHistory();
}

clearHistoryBtn.addEventListener('click', clearHistory);

function loadHistoryItem(entry) {
  switchTab('captions');
  capTopic.value = entry.topic || '';
  capTopic.style.height = 'auto';
  capTopic.style.height = capTopic.scrollHeight + 'px';
  capPlatform.value = entry.platform || 'Instagram';
  capPlatform.dispatchEvent(new Event('change', { bubbles: true }));
  capTone.value = entry.tone || 'professional';
  capTone.dispatchEvent(new Event('change', { bubbles: true }));
  capLength.value = entry.length || 'medium';
  capLength.dispatchEvent(new Event('change', { bubbles: true }));
  capLanguage.value = entry.language || 'English';
  capLanguage.dispatchEvent(new Event('change', { bubbles: true }));
  capKeywords.value = entry.keywords || '';
  capBrandVoice.value = entry.brandVoice || '';
  capCount.value = entry.captionCount || 4;
  capCountVal.textContent = capCount.value;
  showToast('History loaded!');
}

function renderHistory() {
  const h = getHistory();
  if (h.length === 0) {
    historyList.innerHTML = '';
    historyEmpty.classList.remove('hidden');
    return;
  }
  historyEmpty.classList.add('hidden');
  historyList.innerHTML = h.map(e => `
    <div class="history-item" onclick="loadHistoryItem(getHistory().find(x=>x.id===${e.id}))">
      <div style="display:flex;align-items:center;justify-content:space-between;">
        <div style="flex:1;min-width:0;">
          <p style="font-size:13px;font-weight:600;color:#1e293b;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${escapeHtml((e.topic || '').substring(0, 40))}</p>
          <p style="font-size:10px;color:#94a3b8;margin-top:2px;">${escapeHtml(e.tone || '')} · ${escapeHtml(e.platform || '')} · ${new Date(e.savedAt).toLocaleDateString()}</p>
        </div>
        <div style="display:flex;align-items:center;gap:8px;">
          <span style="font-size:9px;color:#94a3b8;background:#f1f5f9;padding:2px 8px;border-radius:10px;">${e.captionCount || 0} caps</span>
          <span style="font-size:14px;color:#ef4444;cursor:pointer;" onclick="event.stopPropagation();deleteHistoryItem(${e.id})">✕</span>
        </div>
      </div>
    </div>
  `).join('');
}

renderHistory();

// ─── SAVE CURRENT TO HISTORY ────────────────────────────────────────────────
document.querySelector('.app-bar-title')?.addEventListener('dblclick', () => {
  if (!lastCapResult) { showToast('No captions to save.'); return; }
  const captions = [...capCaptionsContainer.querySelectorAll('.caption-text')].map(p => p.textContent.trim());
  const entry = {
    topic: capTopic.value.trim(),
    tone: capTone.value.toLowerCase(),
    platform: capPlatform.value,
    length: capLength.value.toLowerCase(),
    language: capLanguage.value,
    keywords: capKeywords.value.trim(),
    brandVoice: capBrandVoice.value.trim(),
    emojis: emojisEnabled,
    captionCount: Number(capCount.value),
    hashtagCount: 0,
    result: { captions: captions.map((t, i) => ({ id: i, text: t })), hashtags: { highTraffic: [], niche: [], location: [] } },
  };
  saveToHistory(entry);
});

// ─── MORE TAB ───────────────────────────────────────────────────────────────
document.getElementById('moreAdminBtn').addEventListener('click', () => {
  openAdminPanel();
});

document.getElementById('moreExportBtn').addEventListener('click', () => {
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
});

// ─── ADMIN PANEL ────────────────────────────────────────────────────────────
function openAdminPanel() {
  adminOverlay.classList.remove('hidden');
  adminLoginView.classList.remove('hidden');
  adminDataView.classList.add('hidden');
  adminError.classList.add('hidden');
  adminNameInput.value = '';
  adminPassInput.value = '';
  adminNameInput.focus();
}

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
      <div style="display:flex;align-items:center;justify-content:space-between;background:#f8fafc;border-radius:12px;padding:10px 14px;">
        <div>
          <p style="font-size:13px;font-weight:500;color:#1e293b;">${escapeHtml(v.name)}</p>
          <p style="font-size:10px;color:#94a3b8;">${new Date(v.timestamp).toLocaleString()}</p>
        </div>
        <span style="font-size:10px;color:#94a3b8;">${escapeHtml(v.ip)}</span>
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

// ─── Download helper ────────────────────────────────────────────────────────
function downloadFile(content, filename, mime) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

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
