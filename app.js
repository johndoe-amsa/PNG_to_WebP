/* ============================================
   WebP Converter — Application Logic
   100% client-side, zero backend
   ============================================ */

(function () {
  'use strict';

  // ---- State ----
  const state = {
    files: [], // { id, file, originalUrl, convertedBlob, convertedUrl, originalSize, convertedSize, status }
    quality: 80,
    alphaQuality: 80,
    resizeEnabled: false,
    maxWidth: 1920,
    maxHeight: 1080,
  };

  let idCounter = 0;

  // ---- DOM References ----
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);

  const dropZone = $('#dropZone');
  const fileInput = $('#fileInput');
  const browseBtn = $('#browseBtn');
  const mainLayout = $('#mainLayout');

  const qualitySlider = $('#qualitySlider');
  const qualityValue = $('#qualityValue');
  const alphaSlider = $('#alphaSlider');
  const alphaValue = $('#alphaValue');

  const resizeToggle = $('#resizeToggle');
  const resizeFields = $('#resizeFields');
  const maxWidthInput = $('#maxWidth');
  const maxHeightInput = $('#maxHeight');

  const fileList = $('#fileList');
  const convertAllBtn = $('#convertAllBtn');
  const clearAllBtn = $('#clearAllBtn');
  const downloadAllBtn = $('#downloadAllBtn');

  const statCount = $('#statCount');
  const statOriginal = $('#statOriginal');
  const statConverted = $('#statConverted');
  const statSaved = $('#statSaved');

  const previewModal = $('#previewModal');
  const modalTitle = $('#modalTitle');
  const modalClose = $('#modalClose');
  const previewOriginal = $('#previewOriginal');
  const previewConverted = $('#previewConverted');
  const previewOriginalSize = $('#previewOriginalSize');
  const previewConvertedSize = $('#previewConvertedSize');

  const tooltipEl = $('#tooltip');
  const themeToggle = $('#themeToggle');

  // ---- Theme ----
  function initTheme() {
    const saved = localStorage.getItem('webp-theme');
    if (saved) {
      document.documentElement.setAttribute('data-theme', saved);
    } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      document.documentElement.setAttribute('data-theme', 'dark');
    }
  }

  themeToggle.addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('webp-theme', next);
  });

  initTheme();

  // ---- Tooltip ----
  let tooltipTimeout;

  function showTooltip(anchor, text) {
    clearTimeout(tooltipTimeout);
    tooltipEl.textContent = text;
    tooltipEl.classList.remove('hidden');

    const rect = anchor.getBoundingClientRect();
    const tipRect = tooltipEl.getBoundingClientRect();

    let left = rect.left + rect.width / 2 - tipRect.width / 2;
    let top = rect.bottom + 8;

    if (left < 8) left = 8;
    if (left + tipRect.width > window.innerWidth - 8) left = window.innerWidth - tipRect.width - 8;
    if (top + tipRect.height > window.innerHeight - 8) {
      top = rect.top - tipRect.height - 8;
    }

    tooltipEl.style.left = left + 'px';
    tooltipEl.style.top = top + 'px';

    requestAnimationFrame(() => tooltipEl.classList.add('visible'));
  }

  function hideTooltip() {
    tooltipEl.classList.remove('visible');
    tooltipTimeout = setTimeout(() => tooltipEl.classList.add('hidden'), 150);
  }

  document.addEventListener('pointerover', (e) => {
    const btn = e.target.closest('.info-btn');
    if (btn) showTooltip(btn, btn.dataset.tooltip);
  });

  document.addEventListener('pointerout', (e) => {
    if (e.target.closest('.info-btn')) hideTooltip();
  });

  // ---- Presets ----
  $$('.preset-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      $$('.preset-btn').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      const q = parseInt(btn.dataset.quality, 10);
      const a = parseInt(btn.dataset.alpha, 10);
      state.quality = q;
      state.alphaQuality = a;
      qualitySlider.value = q;
      qualityValue.textContent = q;
      alphaSlider.value = a;
      alphaValue.textContent = a;
    });
  });

  // ---- Sliders ----
  qualitySlider.addEventListener('input', () => {
    state.quality = parseInt(qualitySlider.value, 10);
    qualityValue.textContent = state.quality;
    clearActivePreset();
  });

  alphaSlider.addEventListener('input', () => {
    state.alphaQuality = parseInt(alphaSlider.value, 10);
    alphaValue.textContent = state.alphaQuality;
    clearActivePreset();
  });

  function clearActivePreset() {
    $$('.preset-btn').forEach((b) => b.classList.remove('active'));
  }

  // ---- Resize Toggle ----
  resizeToggle.addEventListener('click', () => {
    const on = resizeToggle.getAttribute('aria-checked') === 'true';
    const next = !on;
    resizeToggle.setAttribute('aria-checked', String(next));
    resizeToggle.querySelector('.toggle-knob');
    resizeFields.classList.toggle('hidden', !next);
    resizeToggle.nextElementSibling.textContent = next ? 'Activé' : 'Désactivé';
    state.resizeEnabled = next;
  });

  maxWidthInput.addEventListener('change', () => {
    state.maxWidth = parseInt(maxWidthInput.value, 10) || 1920;
  });

  maxHeightInput.addEventListener('change', () => {
    state.maxHeight = parseInt(maxHeightInput.value, 10) || 1080;
  });

  // ---- Drop Zone ----
  browseBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    fileInput.click();
  });

  dropZone.addEventListener('click', () => fileInput.click());

  dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('drag-over');
  });

  dropZone.addEventListener('dragleave', () => {
    dropZone.classList.remove('drag-over');
  });

  dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('drag-over');
    handleFiles(e.dataTransfer.files);
  });

  fileInput.addEventListener('change', () => {
    handleFiles(fileInput.files);
    fileInput.value = '';
  });

  function handleFiles(fileListInput) {
    const validTypes = ['image/png', 'image/jpeg', 'image/gif', 'image/bmp', 'image/tiff', 'image/svg+xml'];
    for (const file of fileListInput) {
      if (!validTypes.includes(file.type)) continue;
      const id = ++idCounter;
      const url = URL.createObjectURL(file);
      state.files.push({
        id,
        file,
        originalUrl: url,
        convertedBlob: null,
        convertedUrl: null,
        originalSize: file.size,
        convertedSize: null,
        status: 'pending', // pending | converting | done | error
      });
    }
    if (state.files.length > 0) {
      mainLayout.classList.remove('hidden');
    }
    renderFileList();
    updateStats();
  }

  // ---- Render File List ----
  function renderFileList() {
    fileList.innerHTML = '';
    state.files.forEach((f) => {
      const el = document.createElement('div');
      el.className = 'file-item' + (f.status === 'converting' ? ' converting' : '');
      el.dataset.id = f.id;

      const convertedInfo = f.status === 'done'
        ? buildConvertedMeta(f)
        : f.status === 'converting'
          ? '<span style="color:var(--text-secondary);font-size:13px">Conversion…</span>'
          : '<span style="color:var(--text-secondary);font-size:13px">En attente</span>';

      el.innerHTML = `
        <img class="file-thumb" src="${f.originalUrl}" alt="" loading="lazy">
        <div class="file-info">
          <div class="file-name" title="${escapeHTML(f.file.name)}">${escapeHTML(f.file.name)}</div>
          <div class="file-meta">
            <span>${formatSize(f.originalSize)}</span>
            ${f.status === 'done' ? '<span class="file-arrow">→</span>' : ''}
            ${convertedInfo}
          </div>
          ${f.status === 'converting' ? '<div class="file-progress"><div class="file-progress-bar" style="width:100%"></div></div>' : ''}
        </div>
        <div class="file-actions">
          <button class="icon-btn action-preview" title="Aperçu" ${f.status !== 'done' ? 'disabled' : ''}>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
          </button>
          <button class="icon-btn action-download" title="Télécharger" ${f.status !== 'done' ? 'disabled' : ''}>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          </button>
          <button class="icon-btn action-remove" title="Supprimer">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
      `;

      fileList.appendChild(el);
    });

    // Show/hide download all
    const hasConverted = state.files.some((f) => f.status === 'done');
    downloadAllBtn.classList.toggle('hidden', !hasConverted);
  }

  function buildConvertedMeta(f) {
    const reduction = ((1 - f.convertedSize / f.originalSize) * 100).toFixed(1);
    const isSmaller = f.convertedSize <= f.originalSize;
    const badgeClass = isSmaller ? 'green' : 'red';
    const sign = isSmaller ? '−' : '+';
    const absReduction = Math.abs(reduction);
    return `<span>${formatSize(f.convertedSize)}</span>
            <span class="file-badge ${badgeClass}">${sign}${absReduction}%</span>`;
  }

  // ---- File Actions (event delegation) ----
  fileList.addEventListener('click', (e) => {
    const btn = e.target.closest('.icon-btn');
    if (!btn) return;
    const item = btn.closest('.file-item');
    const id = parseInt(item.dataset.id, 10);
    const f = state.files.find((x) => x.id === id);
    if (!f) return;

    if (btn.classList.contains('action-preview')) {
      openPreview(f);
    } else if (btn.classList.contains('action-download')) {
      downloadFile(f);
    } else if (btn.classList.contains('action-remove')) {
      removeFile(f);
    }
  });

  function removeFile(f) {
    if (f.originalUrl) URL.revokeObjectURL(f.originalUrl);
    if (f.convertedUrl) URL.revokeObjectURL(f.convertedUrl);
    state.files = state.files.filter((x) => x.id !== f.id);
    if (state.files.length === 0) mainLayout.classList.add('hidden');
    renderFileList();
    updateStats();
  }

  clearAllBtn.addEventListener('click', () => {
    state.files.forEach((f) => {
      if (f.originalUrl) URL.revokeObjectURL(f.originalUrl);
      if (f.convertedUrl) URL.revokeObjectURL(f.convertedUrl);
    });
    state.files = [];
    mainLayout.classList.add('hidden');
    renderFileList();
    updateStats();
  });

  // ---- Download ----
  function downloadFile(f) {
    if (!f.convertedBlob) return;
    const a = document.createElement('a');
    a.href = f.convertedUrl;
    const baseName = f.file.name.replace(/\.[^.]+$/, '');
    a.download = baseName + '.webp';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  downloadAllBtn.addEventListener('click', () => {
    state.files.forEach((f) => {
      if (f.status === 'done') downloadFile(f);
    });
  });

  // ---- Preview Modal ----
  function openPreview(f) {
    modalTitle.textContent = f.file.name;
    previewOriginal.src = f.originalUrl;
    previewConverted.src = f.convertedUrl || '';
    previewOriginalSize.textContent = formatSize(f.originalSize);
    previewConvertedSize.textContent = f.convertedSize != null ? formatSize(f.convertedSize) : '—';
    previewModal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  }

  function closePreview() {
    previewModal.classList.add('hidden');
    document.body.style.overflow = '';
  }

  modalClose.addEventListener('click', closePreview);
  previewModal.querySelector('.modal-backdrop').addEventListener('click', closePreview);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !previewModal.classList.contains('hidden')) closePreview();
  });

  // ---- Conversion Engine ----
  convertAllBtn.addEventListener('click', convertAll);

  async function convertAll() {
    const pending = state.files.filter((f) => f.status !== 'done');
    if (pending.length === 0) return;

    convertAllBtn.disabled = true;

    for (const f of pending) {
      f.status = 'converting';
      renderFileList();
      try {
        await convertFile(f);
        f.status = 'done';
      } catch (err) {
        console.error('Conversion error:', err);
        f.status = 'error';
      }
      renderFileList();
      updateStats();
    }

    convertAllBtn.disabled = false;
  }

  function convertFile(f) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        try {
          let w = img.naturalWidth;
          let h = img.naturalHeight;

          // Resize if enabled
          if (state.resizeEnabled) {
            const mw = state.maxWidth;
            const mh = state.maxHeight;
            if (w > mw || h > mh) {
              const ratio = Math.min(mw / w, mh / h);
              w = Math.round(w * ratio);
              h = Math.round(h * ratio);
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, w, h);

          const quality = state.quality / 100;

          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error('toBlob returned null'));
                return;
              }
              if (f.convertedUrl) URL.revokeObjectURL(f.convertedUrl);
              f.convertedBlob = blob;
              f.convertedUrl = URL.createObjectURL(blob);
              f.convertedSize = blob.size;
              resolve();
            },
            'image/webp',
            quality,
          );
        } catch (err) {
          reject(err);
        }
      };
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = f.originalUrl;
    });
  }

  // ---- Stats ----
  function updateStats() {
    const total = state.files.length;
    const totalOriginal = state.files.reduce((s, f) => s + f.originalSize, 0);
    const converted = state.files.filter((f) => f.status === 'done');
    const totalConverted = converted.reduce((s, f) => s + f.convertedSize, 0);
    const saved = totalOriginal - totalConverted;

    statCount.textContent = total;
    statOriginal.textContent = total > 0 ? formatSize(totalOriginal) : '—';
    statConverted.textContent = converted.length > 0 ? formatSize(totalConverted) : '—';

    if (converted.length > 0 && totalOriginal > 0) {
      const pct = ((saved / totalOriginal) * 100).toFixed(1);
      statSaved.textContent = (saved >= 0 ? '−' : '+') + formatSize(Math.abs(saved)) + ' (' + Math.abs(pct) + '%)';
    } else {
      statSaved.textContent = '—';
    }
  }

  // ---- Utilities ----
  function formatSize(bytes) {
    if (bytes === 0) return '0 o';
    const units = ['o', 'Ko', 'Mo', 'Go'];
    const k = 1024;
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    const val = bytes / Math.pow(k, i);
    return val.toFixed(i > 0 ? 1 : 0) + ' ' + units[i];
  }

  function escapeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }
})();
