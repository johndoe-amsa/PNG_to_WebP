/* ============================================
   WebP Converter — Application Logic v2
   100% client-side, zero backend
   ============================================ */

(function () {
  'use strict';

  // ============================================
  // STATE
  // ============================================

  const state = {
    files: [],
    // Format & Mode
    outputFormat: 'webp',
    compressionMode: 'lossy',
    // Quality
    quality: 85,
    alphaQuality: 100,
    // Target size
    targetSizeEnabled: false,
    targetSizeKb: 200,
    // Resize
    resizeEnabled: false,
    maxWidth: 1920,
    maxHeight: 1080,
    resizeMode: 'fit',
    interpolation: 'high',
    // Post-processing
    sharpening: 0,
    brightness: 0,
    contrast: 0,
    grayscale: false,
    fillTransparency: false,
    fillColor: '#ffffff',
    exifCorrection: true,
    stripExif: true,
  };

  let idCounter = 0;

  // ============================================
  // DOM REFERENCES
  // ============================================

  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);

  const dropZone = $('#dropZone');
  const fileInput = $('#fileInput');
  const browseBtn = $('#browseBtn');
  const mainLayout = $('#mainLayout');

  const formatSelector = $('#formatSelector');
  const avifBtn = $('#avifBtn');
  const avifUnsupported = $('#avifUnsupported');
  const compressionModeSelector = $('#compressionModeSelector');
  const presetsGroup = $('#presetsGroup');
  const qualityGroup = $('#qualityGroup');
  const alphaGroup = $('#alphaGroup');
  const targetSizeGroup = $('#targetSizeGroup');

  const qualitySlider = $('#qualitySlider');
  const qualityValue = $('#qualityValue');
  const alphaSlider = $('#alphaSlider');
  const alphaValue = $('#alphaValue');
  const sizeEstimate = $('#sizeEstimate');

  const targetSizeToggle = $('#targetSizeToggle');
  const targetSizeLabel = $('#targetSizeLabel');
  const targetSizeField = $('#targetSizeField');
  const targetSizeInput = $('#targetSizeInput');

  const resizeToggle = $('#resizeToggle');
  const resizeToggleLabel = $('#resizeToggleLabel');
  const resizeFields = $('#resizeFields');
  const maxWidthInput = $('#maxWidth');
  const maxHeightInput = $('#maxHeight');
  const resizeModeSelector = $('#resizeModeSelector');
  const interpolationSelector = $('#interpolationSelector');

  const sharpeningSlider = $('#sharpeningSlider');
  const sharpeningValue = $('#sharpeningValue');
  const brightnessSlider = $('#brightnessSlider');
  const brightnessValue = $('#brightnessValue');
  const contrastSlider = $('#contrastSlider');
  const contrastValue = $('#contrastValue');
  const grayscaleToggle = $('#grayscaleToggle');
  const grayscaleLabel = $('#grayscaleLabel');
  const fillToggle = $('#fillToggle');
  const fillToggleLabel = $('#fillToggleLabel');
  const fillColor = $('#fillColor');
  const stripExifToggle = $('#stripExifToggle');
  const stripExifLabel = $('#stripExifLabel');
  const exifToggle = $('#exifToggle');
  const exifToggleLabel = $('#exifToggleLabel');
  const exifOrientRow = $('#exifOrientRow');
  const exifOrientToggleRow = $('#exifOrientToggleRow');

  const fileList = $('#fileList');
  const convertAllBtn = $('#convertAllBtn');
  const clearAllBtn = $('#clearAllBtn');
  const downloadZipBtn = $('#downloadZipBtn');

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
  const previewConvertedLabel = $('#previewConvertedLabel');

  const tooltipEl = $('#tooltip');
  const themeToggle = $('#themeToggle');

  // ============================================
  // THEME
  // ============================================

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

  // ============================================
  // AVIF SUPPORT DETECTION
  // ============================================

  async function checkAvifSupport() {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(img.width > 0);
      img.onerror = () => resolve(false);
      img.src =
        'data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADybWV0YQAAAAAAAAAoaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAGxpYmF2aWYAAAAADnBpdG0AAAAAAAEAAAAeaWxvYwAAAABEAABAAQAAAAEAAAC8AAAAGwAAACNpaW5mAAAAAAABAAAAFWluZmUCAAAAAAEAAGF2MDEAAAAASmlwcnAAAABLaXBjbwAAABRpc3BlAAAAAAAAAAIAAAACAAAAEHBpeGkAAAAAAwgICAAAAAxhdjFDgQ0MAAAAABNjb2xybmNseAACAAIAAYAAAAAXaXBtYQAAAAAAAAABAAEEAQKDBAAAACVtZGF0EgAKCBgABogQEAwgMg8f8D///8WfhwB8+ErK42A=';
    });
  }

  checkAvifSupport().then((supported) => {
    if (!supported) {
      avifBtn.disabled = true;
      avifUnsupported.classList.remove('hidden');
    }
  });

  // ============================================
  // TOOLTIP
  // ============================================

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
    if (top + tipRect.height > window.innerHeight - 8) top = rect.top - tipRect.height - 8;

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
    if (btn && btn.dataset.tooltip) showTooltip(btn, btn.dataset.tooltip);
  });

  document.addEventListener('pointerout', (e) => {
    if (e.target.closest('.info-btn')) hideTooltip();
  });

  // ============================================
  // FORMAT & COMPRESSION MODE
  // ============================================

  function initSegmented(container, onChange) {
    container.addEventListener('click', (e) => {
      const btn = e.target.closest('.seg-btn');
      if (!btn || btn.disabled) return;
      container.querySelectorAll('.seg-btn').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      onChange(btn.dataset.value);
    });
  }

  initSegmented(formatSelector, (val) => {
    state.outputFormat = val;
    previewConvertedLabel.textContent = val.toUpperCase();
  });

  initSegmented(compressionModeSelector, (val) => {
    state.compressionMode = val;
    const isLossy = val === 'lossy';
    presetsGroup.classList.toggle('hidden', !isLossy);
    qualityGroup.classList.toggle('hidden', !isLossy);
    alphaGroup.classList.toggle('hidden', !isLossy);
    targetSizeGroup.classList.toggle('hidden', !isLossy);
  });

  initSegmented(resizeModeSelector, (val) => { state.resizeMode = val; });
  initSegmented(interpolationSelector, (val) => { state.interpolation = val; });

  // ============================================
  // PRESETS
  // ============================================

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
      updateSizeEstimate();
    });
  });

  // ============================================
  // QUALITY SLIDERS
  // ============================================

  qualitySlider.addEventListener('input', () => {
    state.quality = parseInt(qualitySlider.value, 10);
    qualityValue.textContent = state.quality;
    clearActivePreset();
    updateSizeEstimate();
  });

  alphaSlider.addEventListener('input', () => {
    state.alphaQuality = parseInt(alphaSlider.value, 10);
    alphaValue.textContent = state.alphaQuality;
    clearActivePreset();
  });

  function clearActivePreset() {
    $$('.preset-btn').forEach((b) => b.classList.remove('active'));
  }

  function updateSizeEstimate() {
    const files = state.files;
    if (files.length === 0 || state.targetSizeEnabled) {
      sizeEstimate.textContent = '';
      return;
    }
    const totalOrig = files.reduce((s, f) => s + f.originalSize, 0);
    if (totalOrig === 0) return;
    const q = state.quality / 100;
    // Heuristic: WebP is ~65% of JPEG at same quality, scales ~q^1.4
    const est = Math.round(totalOrig * Math.pow(q, 1.4) * 0.65);
    sizeEstimate.textContent = 'Estimation : ~' + formatSize(est);
  }

  // ============================================
  // TARGET SIZE
  // ============================================

  targetSizeToggle.addEventListener('click', () => {
    const on = targetSizeToggle.getAttribute('aria-checked') === 'true';
    const next = !on;
    targetSizeToggle.setAttribute('aria-checked', String(next));
    targetSizeLabel.textContent = next ? 'Activé' : 'Désactivé';
    targetSizeField.classList.toggle('hidden', !next);
    state.targetSizeEnabled = next;
    qualitySlider.disabled = next;
    sizeEstimate.textContent = '';
  });

  targetSizeInput.addEventListener('change', () => {
    state.targetSizeKb = Math.max(10, parseInt(targetSizeInput.value, 10) || 200);
    targetSizeInput.value = state.targetSizeKb;
  });

  // ============================================
  // RESIZE
  // ============================================

  resizeToggle.addEventListener('click', () => {
    const on = resizeToggle.getAttribute('aria-checked') === 'true';
    const next = !on;
    resizeToggle.setAttribute('aria-checked', String(next));
    resizeToggleLabel.textContent = next ? 'Activé' : 'Désactivé';
    resizeFields.classList.toggle('hidden', !next);
    state.resizeEnabled = next;
  });

  maxWidthInput.addEventListener('change', () => {
    state.maxWidth = parseInt(maxWidthInput.value, 10) || 1920;
  });

  maxHeightInput.addEventListener('change', () => {
    state.maxHeight = parseInt(maxHeightInput.value, 10) || 1080;
  });

  // Resolution presets
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.res-btn');
    if (!btn) return;
    const w = parseInt(btn.dataset.w, 10);
    const h = parseInt(btn.dataset.h, 10);
    maxWidthInput.value = w;
    maxHeightInput.value = h;
    state.maxWidth = w;
    state.maxHeight = h;
  });

  // ============================================
  // POST-PROCESSING
  // ============================================

  sharpeningSlider.addEventListener('input', () => {
    state.sharpening = parseInt(sharpeningSlider.value, 10);
    sharpeningValue.textContent = state.sharpening;
  });

  brightnessSlider.addEventListener('input', () => {
    state.brightness = parseInt(brightnessSlider.value, 10);
    brightnessValue.textContent = (state.brightness > 0 ? '+' : '') + state.brightness;
  });

  contrastSlider.addEventListener('input', () => {
    state.contrast = parseInt(contrastSlider.value, 10);
    contrastValue.textContent = (state.contrast > 0 ? '+' : '') + state.contrast;
  });

  grayscaleToggle.addEventListener('click', () => {
    const on = grayscaleToggle.getAttribute('aria-checked') === 'true';
    const next = !on;
    grayscaleToggle.setAttribute('aria-checked', String(next));
    grayscaleLabel.textContent = next ? 'Activé' : 'Désactivé';
    state.grayscale = next;
  });

  fillToggle.addEventListener('click', () => {
    const on = fillToggle.getAttribute('aria-checked') === 'true';
    const next = !on;
    fillToggle.setAttribute('aria-checked', String(next));
    fillToggleLabel.textContent = next ? 'Activé' : 'Désactivé';
    fillColor.classList.toggle('hidden', !next);
    state.fillTransparency = next;
  });

  fillColor.addEventListener('input', () => {
    state.fillColor = fillColor.value;
  });

  stripExifToggle.addEventListener('click', () => {
    const on = stripExifToggle.getAttribute('aria-checked') === 'true';
    const next = !on;
    stripExifToggle.setAttribute('aria-checked', String(next));
    stripExifLabel.textContent = next ? 'Activé' : 'Désactivé';
    state.stripExif = next;
    // Hide/show orientation toggle: only relevant when EXIF is preserved (strip = OFF)
    // But orientation correction always applies regardless, so keep visible
    exifOrientRow.classList.toggle('hidden', false);
    exifOrientToggleRow.classList.toggle('hidden', false);
  });

  exifToggle.addEventListener('click', () => {
    const on = exifToggle.getAttribute('aria-checked') === 'true';
    const next = !on;
    exifToggle.setAttribute('aria-checked', String(next));
    exifToggleLabel.textContent = next ? 'Activé' : 'Désactivé';
    state.exifCorrection = next;
  });

  // ============================================
  // DROP ZONE
  // ============================================

  browseBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    fileInput.click();
  });

  dropZone.addEventListener('click', () => fileInput.click());

  dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('drag-over');
  });

  dropZone.addEventListener('dragleave', () => dropZone.classList.remove('drag-over'));

  dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('drag-over');
    handleFiles(e.dataTransfer.files);
  });

  fileInput.addEventListener('change', () => {
    handleFiles(fileInput.files);
    fileInput.value = '';
  });

  async function handleFiles(fileListInput) {
    const validTypes = [
      'image/png', 'image/jpeg', 'image/gif',
      'image/bmp', 'image/tiff', 'image/svg+xml',
    ];
    const newEntries = [];

    for (const file of fileListInput) {
      if (!validTypes.includes(file.type)) continue;

      let exifOrientation = 1;
      let exifBytes = null;
      let exifSize = 0;
      if (file.type === 'image/jpeg') {
        try {
          const buf = await file.arrayBuffer();
          const exifData = readExifData(buf);
          exifOrientation = exifData.orientation;
          exifBytes = exifData.rawBytes;
          exifSize = exifData.size;
        } catch (_) { /* ignore */ }
      }

      const id = ++idCounter;
      const url = URL.createObjectURL(file);
      newEntries.push({
        id,
        file,
        originalUrl: url,
        convertedBlob: null,
        convertedUrl: null,
        originalSize: file.size,
        convertedSize: null,
        status: 'pending',
        exifOrientation,
        exifBytes,
        exifSize,
        overrides: null,
        overrideOpen: false,
      });
    }

    if (newEntries.length === 0) return;
    state.files.push(...newEntries);
    mainLayout.classList.remove('hidden');
    updateSidebarMaxHeight();
    renderFileList();
    updateStats();
    updateSizeEstimate();
  }

  // ============================================
  // RENDER FILE LIST
  // ============================================

  function renderFileList() {
    // Preserve scroll position
    const scrollTop = fileList.scrollTop;
    fileList.innerHTML = '';

    state.files.forEach((f) => {
      // File item row
      const item = document.createElement('div');
      item.className = 'file-item' + (f.status === 'converting' ? ' converting' : '') + (f.status === 'error' ? ' error-state' : '');
      item.dataset.id = f.id;

      const convertedMeta = buildConvertedMeta(f);
      const thumbAnim = f.status === 'converting' ? ' converting-anim' : '';

      item.innerHTML = `
        <img class="file-thumb${thumbAnim}" src="${f.originalUrl}" alt="" loading="lazy">
        <div class="file-info">
          <div class="file-name" title="${escapeHTML(f.file.name)}">${escapeHTML(f.file.name)}</div>
          <div class="file-meta">
            <span>${formatSize(f.originalSize)}</span>
            ${convertedMeta}
          </div>
          ${f.status === 'converting' ? '<div class="file-progress"><div class="file-progress-bar"></div></div>' : ''}
        </div>
        <div class="file-actions">
          <button class="icon-btn action-override ${f.overrides ? 'active-override' : ''}" title="Paramètres individuels">
            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
          </button>
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

      fileList.appendChild(item);

      // Per-file override panel
      if (f.overrideOpen) {
        const panel = buildOverridePanel(f);
        fileList.appendChild(panel);
      }
    });

    fileList.scrollTop = scrollTop;

    // Show/hide action buttons
    const hasConverted = state.files.some((x) => x.status === 'done');
    downloadZipBtn.classList.toggle('hidden', !hasConverted);
  }

  function buildConvertedMeta(f) {
    if (f.status === 'done') {
      const reduction = ((1 - f.convertedSize / f.originalSize) * 100).toFixed(1);
      const isSmaller = f.convertedSize <= f.originalSize;
      const badgeClass = isSmaller ? 'green' : 'red';
      const sign = isSmaller ? '−' : '+';
      const ext = f.overrides?.outputFormat || state.outputFormat;
      const exifBadge = (state.stripExif && f.exifSize > 0)
        ? `<span class="file-badge green" title="Données EXIF supprimées">−EXIF ${formatSize(f.exifSize)}</span>`
        : '';
      return `<span class="file-arrow">→</span>
              <span>${formatSize(f.convertedSize)} ${ext.toUpperCase()}</span>
              <span class="file-badge ${badgeClass}">${sign}${Math.abs(reduction)}%</span>
              ${exifBadge}`;
    }
    if (f.status === 'converting') {
      return '<span class="file-badge orange">Conversion…</span>';
    }
    if (f.status === 'error') {
      return '<span class="file-badge red">Erreur</span>';
    }
    return '<span style="color:var(--text-secondary);font-size:13px">En attente</span>';
  }

  function buildOverridePanel(f) {
    const panel = document.createElement('div');
    panel.className = 'file-override-panel';
    panel.dataset.overId = f.id;

    const ov = f.overrides || {};
    const curMode = ov.compressionMode || 'global';
    const curQuality = ov.quality != null ? ov.quality : state.quality;

    panel.innerHTML = `
      <div class="override-panel-inner">
        <div class="override-header">
          <span class="label-tag">PARAMÈTRES INDIVIDUELS</span>
          <button class="override-reset">Réinitialiser</button>
        </div>
        <div class="segmented override-mode-sel" style="margin-top:4px">
          <button class="seg-btn ${curMode === 'global' ? 'active' : ''}" data-value="global">Hérite global</button>
          <button class="seg-btn ${curMode === 'lossy' ? 'active' : ''}" data-value="lossy">Lossy</button>
          <button class="seg-btn ${curMode === 'lossless' ? 'active' : ''}" data-value="lossless">Lossless</button>
        </div>
        <div class="override-quality-row ${curMode === 'lossless' ? 'hidden' : ''}">
          <label>Qualité</label>
          <input type="range" class="slider override-q-slider" min="1" max="100" value="${curQuality}" style="flex:1">
          <span class="slider-value override-q-val">${curQuality}</span>
        </div>
      </div>
    `;

    // Mode selector
    const modeSel = panel.querySelector('.override-mode-sel');
    initSegmented(modeSel, (val) => {
      f.overrides = f.overrides || {};
      if (val === 'global') {
        delete f.overrides.compressionMode;
        if (Object.keys(f.overrides).length === 0) f.overrides = null;
      } else {
        f.overrides.compressionMode = val;
      }
      const qualityRow = panel.querySelector('.override-quality-row');
      qualityRow.classList.toggle('hidden', val === 'lossless');
    });

    // Quality slider
    const qSlider = panel.querySelector('.override-q-slider');
    const qVal = panel.querySelector('.override-q-val');
    qSlider.addEventListener('input', () => {
      f.overrides = f.overrides || {};
      f.overrides.quality = parseInt(qSlider.value, 10);
      qVal.textContent = f.overrides.quality;
    });

    // Reset
    panel.querySelector('.override-reset').addEventListener('click', () => {
      f.overrides = null;
      renderFileList();
    });

    return panel;
  }

  // ============================================
  // FILE ACTIONS (event delegation)
  // ============================================

  fileList.addEventListener('click', (e) => {
    const btn = e.target.closest('.icon-btn');
    if (!btn) return;
    const item = btn.closest('.file-item');
    if (!item) return;
    const id = parseInt(item.dataset.id, 10);
    const f = state.files.find((x) => x.id === id);
    if (!f) return;

    if (btn.classList.contains('action-preview')) {
      openPreview(f);
    } else if (btn.classList.contains('action-download')) {
      downloadFile(f);
    } else if (btn.classList.contains('action-remove')) {
      removeFile(f);
    } else if (btn.classList.contains('action-override')) {
      f.overrideOpen = !f.overrideOpen;
      renderFileList();
    }
  });

  function removeFile(f) {
    if (f.originalUrl) URL.revokeObjectURL(f.originalUrl);
    if (f.convertedUrl) URL.revokeObjectURL(f.convertedUrl);
    state.files = state.files.filter((x) => x.id !== f.id);
    if (state.files.length === 0) mainLayout.classList.add('hidden');
    renderFileList();
    updateStats();
    updateSizeEstimate();
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
    updateSizeEstimate();
  });

  // ============================================
  // DOWNLOAD
  // ============================================

  function downloadFile(f) {
    if (!f.convertedBlob) return;
    const ext = (f.overrides?.outputFormat || state.outputFormat);
    const a = document.createElement('a');
    a.href = f.convertedUrl;
    a.download = f.file.name.replace(/\.[^.]+$/, '') + '.' + ext;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  downloadZipBtn.addEventListener('click', async () => {
    const done = state.files.filter((f) => f.status === 'done');
    if (done.length === 0) return;

    downloadZipBtn.disabled = true;
    downloadZipBtn.textContent = 'Création ZIP…';

    try {
      const zip = new ZipWriter();
      for (const f of done) {
        const ext = (f.overrides?.outputFormat || state.outputFormat);
        const name = f.file.name.replace(/\.[^.]+$/, '') + '.' + ext;
        zip.addFile(name, f.convertedBlob);
      }
      const blob = await zip.generate();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'images-webp.zip';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 5000);
    } finally {
      downloadZipBtn.disabled = false;
      downloadZipBtn.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
        ZIP`;
    }
  });

  // ============================================
  // PREVIEW MODAL
  // ============================================

  function openPreview(f) {
    modalTitle.textContent = f.file.name;
    previewOriginal.src = f.originalUrl;
    previewConverted.src = f.convertedUrl || '';
    previewOriginalSize.textContent = formatSize(f.originalSize);
    previewConvertedSize.textContent = f.convertedSize != null ? formatSize(f.convertedSize) : '—';
    const ext = (f.overrides?.outputFormat || state.outputFormat).toUpperCase();
    previewConvertedLabel.textContent = ext;
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

  // ============================================
  // CONVERSION — MAIN ENTRY
  // ============================================

  convertAllBtn.addEventListener('click', convertAll);

  async function convertAll() {
    if (state.files.length === 0) return;

    // Reset already-converted files so clicking the button again re-converts everything
    state.files.forEach((f) => {
      if (f.status === 'done' || f.status === 'error') {
        if (f.convertedUrl) URL.revokeObjectURL(f.convertedUrl);
        f.convertedBlob = null;
        f.convertedUrl = null;
        f.convertedSize = null;
        f.status = 'pending';
      }
    });

    convertAllBtn.disabled = true;

    for (const f of state.files) {
      f.status = 'converting';
      renderFileList();
      try {
        await convertFile(f);
        f.status = 'done';
      } catch (err) {
        console.error('Conversion error for', f.file.name, err);
        f.status = 'error';
      }
      renderFileList();
      updateStats();
    }

    convertAllBtn.disabled = false;
  }

  // ============================================
  // CONVERSION — PER FILE
  // ============================================

  function mergeSettings(overrides) {
    const ov = overrides || {};
    const compressionMode = ov.compressionMode === 'global' || !ov.compressionMode
      ? state.compressionMode
      : ov.compressionMode;
    return {
      outputFormat: state.outputFormat,
      compressionMode,
      quality: ov.quality != null ? ov.quality : state.quality,
      alphaQuality: state.alphaQuality,
      targetSizeEnabled: compressionMode === 'lossy' ? state.targetSizeEnabled : false,
      targetSizeKb: state.targetSizeKb,
      resizeEnabled: state.resizeEnabled,
      maxWidth: state.maxWidth,
      maxHeight: state.maxHeight,
      resizeMode: state.resizeMode,
      interpolation: state.interpolation,
      sharpening: state.sharpening,
      brightness: state.brightness,
      contrast: state.contrast,
      grayscale: state.grayscale,
      fillTransparency: state.fillTransparency,
      fillColor: state.fillColor,
      exifCorrection: state.exifCorrection,
      stripExif: state.stripExif,
    };
  }

  function convertFile(f) {
    return new Promise((resolve, reject) => {
      const settings = mergeSettings(f.overrides);
      const img = new Image();

      img.onload = async () => {
        try {
          const orientation = (settings.exifCorrection && f.exifOrientation) ? f.exifOrientation : 1;
          const rotated = [5, 6, 7, 8].includes(orientation);

          // --- Pass 1: EXIF orientation correction ---
          let source = img;
          let srcW = img.naturalWidth;
          let srcH = img.naturalHeight;

          if (orientation !== 1) {
            const orientW = rotated ? img.naturalHeight : img.naturalWidth;
            const orientH = rotated ? img.naturalWidth : img.naturalHeight;
            const tmpCanvas = document.createElement('canvas');
            tmpCanvas.width = orientW;
            tmpCanvas.height = orientH;
            const tmpCtx = tmpCanvas.getContext('2d', { colorSpace: 'srgb' });
            applyExifTransform(tmpCtx, orientation, img.naturalWidth, img.naturalHeight);
            tmpCtx.drawImage(img, 0, 0);
            source = tmpCanvas;
            srcW = orientW;
            srcH = orientH;
          }

          // --- Calculate output dimensions & crop ---
          let dstW = srcW;
          let dstH = srcH;
          let cropX = 0, cropY = 0, cropW = srcW, cropH = srcH;

          if (settings.resizeEnabled) {
            const mw = settings.maxWidth;
            const mh = settings.maxHeight;

            if (settings.resizeMode === 'fit') {
              if (srcW > mw || srcH > mh) {
                const ratio = Math.min(mw / srcW, mh / srcH);
                dstW = Math.round(srcW * ratio);
                dstH = Math.round(srcH * ratio);
              }
            } else if (settings.resizeMode === 'cover') {
              dstW = mw;
              dstH = mh;
              const targetAspect = mw / mh;
              const srcAspect = srcW / srcH;
              if (srcAspect > targetAspect) {
                cropW = Math.round(srcH * targetAspect);
                cropX = Math.round((srcW - cropW) / 2);
              } else {
                cropH = Math.round(srcW / targetAspect);
                cropY = Math.round((srcH - cropH) / 2);
              }
            } else if (settings.resizeMode === 'stretch') {
              dstW = mw;
              dstH = mh;
            }
          }

          // --- Pass 2: Multi-step downscale for better quality ---
          // Apply crop first if needed, then downscale in halving steps
          let resizeSrc = source;
          let curW = cropW;
          let curH = cropH;

          // If cropping is needed, draw cropped region to intermediate canvas
          if (cropX !== 0 || cropY !== 0 || cropW !== srcW || cropH !== srcH) {
            const cropCanvas = document.createElement('canvas');
            cropCanvas.width = cropW;
            cropCanvas.height = cropH;
            const cropCtx = cropCanvas.getContext('2d', { colorSpace: 'srgb' });
            cropCtx.drawImage(source, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);
            resizeSrc = cropCanvas;
          }

          // Multi-step halving: reduce by 50% per step until within 2× of target
          let didHalve = false;
          while (curW > dstW * 2 || curH > dstH * 2) {
            const stepW = Math.round(curW / 2);
            const stepH = Math.round(curH / 2);
            const stepCanvas = document.createElement('canvas');
            stepCanvas.width = stepW;
            stepCanvas.height = stepH;
            const stepCtx = stepCanvas.getContext('2d', {
              colorSpace: 'srgb',
              willReadFrequently: settings.sharpening > 0,
            });
            stepCtx.imageSmoothingEnabled = true;
            stepCtx.imageSmoothingQuality = 'high';
            stepCtx.drawImage(resizeSrc, 0, 0, curW, curH, 0, 0, stepW, stepH);
            resizeSrc = stepCanvas;
            curW = stepW;
            curH = stepH;
            didHalve = true;
          }

          // Sharpening at intermediate resolution (~2× target) — details are sharpened
          // before the final downscale so they survive the last reduction naturally
          if (settings.sharpening > 0 && didHalve) {
            applySharpening(resizeSrc.getContext('2d'), curW, curH, settings.sharpening);
          }

          // --- Final canvas ---
          const canvas = document.createElement('canvas');
          canvas.width = dstW;
          canvas.height = dstH;
          const ctx = canvas.getContext('2d', {
            willReadFrequently: settings.sharpening > 0 && !didHalve,
            colorSpace: 'srgb',
          });

          // Fill transparency background
          if (settings.fillTransparency) {
            ctx.fillStyle = settings.fillColor;
            ctx.fillRect(0, 0, dstW, dstH);
          }

          // Interpolation quality
          ctx.imageSmoothingEnabled = settings.interpolation !== 'low';
          if (settings.interpolation !== 'low') {
            ctx.imageSmoothingQuality = settings.interpolation;
          }

          // Apply visual filters (brightness, contrast, grayscale)
          const cssFilters = [];
          if (settings.brightness !== 0) cssFilters.push(`brightness(${1 + settings.brightness / 100})`);
          if (settings.contrast !== 0) cssFilters.push(`contrast(${1 + settings.contrast / 100})`);
          if (settings.grayscale) cssFilters.push('grayscale(1)');
          if (cssFilters.length) ctx.filter = cssFilters.join(' ');

          ctx.drawImage(resizeSrc, 0, 0, curW, curH, 0, 0, dstW, dstH);
          if (cssFilters.length) ctx.filter = 'none';

          // Sharpening on final canvas only when no halving occurred (no resize, or image
          // already within 2× of target — intermediate sharpening wasn't possible)
          if (settings.sharpening > 0 && !didHalve) {
            applySharpening(ctx, dstW, dstH, settings.sharpening);
          }

          // --- Encode ---
          const mimeType = 'image/' + settings.outputFormat;
          let blob;

          if (settings.compressionMode === 'lossless') {
            blob = await canvasToBlob(canvas, mimeType, 1.0);
          } else if (settings.targetSizeEnabled) {
            const targetBytes = settings.targetSizeKb * 1024;
            blob = await findQualityForTargetSize(canvas, mimeType, targetBytes);
          } else {
            // Alpha quality: if file has potential alpha (PNG), blend quality values
            let effectiveQuality = settings.quality / 100;
            if (f.file.type === 'image/png' && settings.alphaQuality !== settings.quality) {
              effectiveQuality = (settings.quality * 0.7 + settings.alphaQuality * 0.3) / 100;
            }
            blob = await canvasToBlob(canvas, mimeType, effectiveQuality);
          }

          if (!blob) throw new Error('La conversion a retourné null');

          // Inject EXIF back into WebP container if strip is disabled and source had EXIF
          if (!settings.stripExif && f.exifBytes && f.exifBytes.length > 0) {
            blob = await injectExifIntoWebP(blob, f.exifBytes);
          }

          if (f.convertedUrl) URL.revokeObjectURL(f.convertedUrl);
          f.convertedBlob = blob;
          f.convertedUrl = URL.createObjectURL(blob);
          f.convertedSize = blob.size;

          resolve();
        } catch (err) {
          reject(err);
        }
      };

      img.onerror = () => reject(new Error('Impossible de charger l\'image : ' + f.file.name));
      img.src = f.originalUrl;
    });
  }

  // ============================================
  // CONVERSION UTILITIES
  // ============================================

  function canvasToBlob(canvas, mimeType, quality) {
    return new Promise((resolve) => {
      canvas.toBlob(resolve, mimeType, quality);
    });
  }

  async function findQualityForTargetSize(canvas, mimeType, targetBytes) {
    let lo = 0.01;
    let hi = 0.99;
    let best = null;
    const MAX_ITER = 12;

    // First check if even maximum quality is below target
    const maxBlob = await canvasToBlob(canvas, mimeType, 0.99);
    if (maxBlob && maxBlob.size <= targetBytes) return maxBlob;

    for (let i = 0; i < MAX_ITER; i++) {
      const mid = (lo + hi) / 2;
      const blob = await canvasToBlob(canvas, mimeType, mid);
      if (!blob) break;

      if (blob.size <= targetBytes) {
        lo = mid;
        best = blob;
      } else {
        hi = mid;
      }

      if (hi - lo < 0.005) break;
    }

    // If best is still null, even the minimum quality exceeds target — return minimum
    if (!best) {
      best = await canvasToBlob(canvas, mimeType, 0.01);
    }

    return best;
  }

  // ============================================
  // EXIF PARSING — reads orientation + raw EXIF bytes
  // ============================================

  function readExifData(buffer) {
    const result = { orientation: 1, rawBytes: null, size: 0 };
    try {
      const view = new DataView(buffer);
      if (view.getUint16(0, false) !== 0xFFD8) return result;

      let offset = 2;
      while (offset < view.byteLength - 4) {
        const marker = view.getUint16(offset, false);
        offset += 2;

        if (marker === 0xFFE1) {
          const segLen = view.getUint16(offset, false); // includes the 2-byte length field itself
          // Check for "Exif\0\0" header
          if (view.getUint32(offset + 2, false) === 0x45786966) {
            // Store raw APP1 payload (after the 2-byte length field)
            const payloadStart = offset + 2;
            const payloadLen = segLen - 2;
            result.rawBytes = new Uint8Array(buffer, payloadStart, payloadLen);
            result.size = segLen + 2; // marker (2) + length (2) + data (segLen-2)

            const tiffBase = offset + 8;
            const littleEndian = view.getUint16(tiffBase, false) === 0x4949;
            const firstIFD = view.getUint32(tiffBase + 4, littleEndian);
            const entries = view.getUint16(tiffBase + firstIFD, littleEndian);

            for (let i = 0; i < entries; i++) {
              const entryOffset = tiffBase + firstIFD + 2 + i * 12;
              if (view.getUint16(entryOffset, littleEndian) === 0x0112) {
                result.orientation = view.getUint16(entryOffset + 8, littleEndian);
                break;
              }
            }
          }
          return result;
        }

        if (marker === 0xFFDA) break;
        const segLen = view.getUint16(offset, false);
        offset += segLen;
      }
    } catch (_) { /* ignore */ }
    return result;
  }

  // ============================================
  // WEBP EXIF INJECTION
  // Inserts EXIF chunk into WebP Extended (VP8X) container
  // ============================================

  async function injectExifIntoWebP(webpBlob, exifBytes) {
    try {
      const buf = await webpBlob.arrayBuffer();
      const view = new DataView(buf);

      // Validate RIFF/WEBP header
      if (view.getUint32(0, false) !== 0x52494646) return webpBlob; // 'RIFF'
      if (view.getUint32(8, false) !== 0x57454250) return webpBlob; // 'WEBP'

      const chunkFourCC = view.getUint32(12, false);
      const isLossy    = chunkFourCC === 0x56503820; // 'VP8 '
      const isLossless = chunkFourCC === 0x5650384C; // 'VP8L'
      const isExtended = chunkFourCC === 0x56503858; // 'VP8X'

      if (!isLossy && !isLossless && !isExtended) return webpBlob;

      // Pad exifBytes to even length (RIFF chunks must be word-aligned)
      const exifPadded = (exifBytes.length % 2 !== 0)
        ? new Uint8Array([...exifBytes, 0])
        : exifBytes;

      // Build EXIF chunk: 'EXIF' + size (LE uint32) + data
      const exifChunk = new Uint8Array(8 + exifPadded.length);
      const ecv = new DataView(exifChunk.buffer);
      ecv.setUint32(0, 0x45584946, false); // 'EXIF'
      ecv.setUint32(4, exifBytes.length, true);
      exifChunk.set(exifPadded, 8);

      let vp8Data, vp8FourCC, canvasW, canvasH;

      if (isExtended) {
        // Already VP8X — check if EXIF flag already set; just append if not
        const vp8xFlags = view.getUint8(20);
        // We'll rebuild anyway to ensure correct ordering
        const vp8xData = new Uint8Array(buf, 20, 10);
        vp8Data = new Uint8Array(buf, 12); // from VP8X chunk onward, we'll rebuild below

        // Find the VP8 or VP8L chunk within the extended container
        let chunkOffset = 12;
        while (chunkOffset + 8 <= buf.byteLength) {
          const cc = view.getUint32(chunkOffset, false);
          const cs = view.getUint32(chunkOffset + 4, true);
          if (cc === 0x56503820 || cc === 0x5650384C) {
            vp8FourCC = cc;
            vp8Data = new Uint8Array(buf, chunkOffset, 8 + cs + (cs % 2));
            canvasW = (view.getUint32(24, true) & 0xFFFFFF) + 1;
            canvasH = (view.getUint32(27, true) & 0xFFFFFF) + 1;
            break;
          }
          chunkOffset += 8 + cs + (cs % 2);
        }
      } else {
        vp8FourCC = chunkFourCC;
        const vp8Size = view.getUint32(16, true);
        vp8Data = new Uint8Array(buf, 12, 8 + vp8Size + (vp8Size % 2));

        // Extract canvas dimensions from VP8 bitstream
        if (isLossy) {
          // VP8 frame tag: skip 3 bytes, check 0x9d012a signature
          if (view.getUint16(23, false) === 0x9D01 && view.getUint8(25) === 0x2A) {
            canvasW = (view.getUint16(26, true) & 0x3FFF);
            canvasH = (view.getUint16(28, true) & 0x3FFF);
          } else {
            canvasW = 0; canvasH = 0;
          }
        } else {
          // VP8L: signature byte 0x2F, then 28 bits width-1, 28 bits height-1
          // offset 21 = after RIFF(4)+size(4)+WEBP(4)+VP8L(4)+size(4)+sig(1)
          const bits = view.getUint32(21, true);
          canvasW = (bits & 0x3FFF) + 1;
          canvasH = ((bits >>> 14) & 0x3FFF) + 1;
        }
      }

      if (!vp8Data || !canvasW || !canvasH) return webpBlob;

      // Build VP8X chunk (10 bytes of data)
      const vp8xChunk = new Uint8Array(18); // 4+4+10
      const vxv = new DataView(vp8xChunk.buffer);
      vxv.setUint32(0, 0x56503858, false); // 'VP8X'
      vxv.setUint32(4, 10, true);          // chunk size = 10
      // flags: bit 3 = EXIF present
      vxv.setUint8(8, 0x08);
      // canvas width - 1 (24-bit LE)
      vxv.setUint8(12, (canvasW - 1) & 0xFF);
      vxv.setUint8(13, ((canvasW - 1) >> 8) & 0xFF);
      vxv.setUint8(14, ((canvasW - 1) >> 16) & 0xFF);
      // canvas height - 1 (24-bit LE)
      vxv.setUint8(15, (canvasH - 1) & 0xFF);
      vxv.setUint8(16, ((canvasH - 1) >> 8) & 0xFF);
      vxv.setUint8(17, ((canvasH - 1) >> 16) & 0xFF);

      // Assemble: RIFF header (12) + VP8X (18) + VP8/VP8L chunk + EXIF chunk
      const totalSize = 4 + vp8xChunk.length + vp8Data.length + exifChunk.length;
      const out = new Uint8Array(4 + 4 + totalSize);
      const ov = new DataView(out.buffer);
      ov.setUint32(0, 0x52494646, false); // 'RIFF'
      ov.setUint32(4, totalSize, true);
      ov.setUint32(8, 0x57454250, false); // 'WEBP'
      out.set(vp8xChunk, 12);
      out.set(vp8Data, 12 + vp8xChunk.length);
      out.set(exifChunk, 12 + vp8xChunk.length + vp8Data.length);

      return new Blob([out], { type: 'image/webp' });
    } catch (_) {
      return webpBlob; // fallback: return original blob unchanged
    }
  }

  function applyExifTransform(ctx, orientation, imgW, imgH) {
    // Apply canvas transform to correct EXIF orientation
    // Canvas must already be sized to the corrected (post-rotation) dimensions
    switch (orientation) {
      case 2: ctx.transform(-1, 0, 0, 1, imgW, 0); break;
      case 3: ctx.transform(-1, 0, 0, -1, imgW, imgH); break;
      case 4: ctx.transform(1, 0, 0, -1, 0, imgH); break;
      case 5: ctx.transform(0, 1, 1, 0, 0, 0); break;
      case 6: ctx.transform(0, 1, -1, 0, imgH, 0); break;
      case 7: ctx.transform(0, -1, -1, 0, imgH, imgW); break;
      case 8: ctx.transform(0, -1, 1, 0, 0, imgW); break;
      default: break;
    }
  }

  // ============================================
  // SHARPENING (Unsharp Mask via 5×5 Convolution)
  // ============================================

  function applySharpening(ctx, w, h, amount) {
    if (amount <= 0 || w <= 4 || h <= 4) return;
    const imageData = ctx.getImageData(0, 0, w, h);
    const src = imageData.data;
    const dst = new Uint8ClampedArray(src.length);

    // Copy all source pixels first (handles edges + alpha)
    dst.set(src);

    const a = amount / 100; // scale 0-1.0
    const threshold = 4; // minimum delta to apply sharpening (avoids noise amplification)

    // 5×5 Unsharp mask kernel (Gaussian-weighted neighbors)
    // Approximates a radius-2 unsharp mask for better edge reconstruction
    //
    //  [  0,  -b,  -b,  -b,   0 ]
    //  [ -b,  -c,  -d,  -c,  -b ]
    //  [ -b,  -d, ctr,  -d,  -b ]
    //  [ -b,  -c,  -d,  -c,  -b ]
    //  [  0,  -b,  -b,  -b,   0 ]
    //
    // Where: b = a/12, c = a/6, d = a/4, ctr = 1 + sum(weights)
    const b = a / 12;
    const c = a / 6;
    const d = a / 4;
    const center = 1 + 8 * b + 4 * c + 4 * d; // = 1 + 8*(a/12) + 4*(a/6) + 4*(a/4) = 1 + 2a/3 + 2a/3 + a = 1 + 7a/3

    for (let y = 2; y < h - 2; y++) {
      for (let x = 2; x < w - 2; x++) {
        const idx = (y * w + x) * 4;
        for (let ch = 0; ch < 3; ch++) {
          const orig = src[idx + ch];

          const v =
            orig * center
            // Ring 1 (distance 1): cardinal neighbors weight d, diagonal neighbors weight c
            - src[((y - 1) * w + x) * 4 + ch] * d
            - src[((y + 1) * w + x) * 4 + ch] * d
            - src[(y * w + (x - 1)) * 4 + ch] * d
            - src[(y * w + (x + 1)) * 4 + ch] * d
            - src[((y - 1) * w + (x - 1)) * 4 + ch] * c
            - src[((y - 1) * w + (x + 1)) * 4 + ch] * c
            - src[((y + 1) * w + (x - 1)) * 4 + ch] * c
            - src[((y + 1) * w + (x + 1)) * 4 + ch] * c
            // Ring 2 (distance 2): cardinal weight b, semi-diagonal weight b
            - src[((y - 2) * w + x) * 4 + ch] * b
            - src[((y + 2) * w + x) * 4 + ch] * b
            - src[(y * w + (x - 2)) * 4 + ch] * b
            - src[(y * w + (x + 2)) * 4 + ch] * b
            - src[((y - 2) * w + (x - 1)) * 4 + ch] * b
            - src[((y - 2) * w + (x + 1)) * 4 + ch] * b
            - src[((y + 2) * w + (x - 1)) * 4 + ch] * b
            - src[((y + 2) * w + (x + 1)) * 4 + ch] * b
            - src[((y - 1) * w + (x - 2)) * 4 + ch] * b
            - src[((y - 1) * w + (x + 2)) * 4 + ch] * b
            - src[((y + 1) * w + (x - 2)) * 4 + ch] * b
            - src[((y + 1) * w + (x + 2)) * 4 + ch] * b;

          const rounded = Math.round(v);
          // Threshold: only apply if the sharpened delta is significant enough
          if (Math.abs(rounded - orig) >= threshold) {
            dst[idx + ch] = Math.min(255, Math.max(0, rounded));
          }
          // Otherwise dst keeps original value (already set by dst.set(src))
        }
      }
    }

    ctx.putImageData(new ImageData(dst, w, h), 0, 0);
  }

  // ============================================
  // STATISTICS
  // ============================================

  function updateStats() {
    const total = state.files.length;
    const totalOrig = state.files.reduce((s, f) => s + f.originalSize, 0);
    const converted = state.files.filter((f) => f.status === 'done');
    const totalConverted = converted.reduce((s, f) => s + f.convertedSize, 0);
    const saved = totalOrig - totalConverted;

    statCount.textContent = total;
    statOriginal.textContent = total > 0 ? formatSize(totalOrig) : '—';
    statConverted.textContent = converted.length > 0 ? formatSize(totalConverted) : '—';

    if (converted.length > 0 && totalOrig > 0) {
      const pct = Math.abs((saved / totalOrig) * 100).toFixed(1);
      const sign = saved >= 0 ? '−' : '+';
      statSaved.textContent = sign + formatSize(Math.abs(saved)) + ' (' + pct + '%)';
    } else {
      statSaved.textContent = '—';
    }
  }

  // ============================================
  // ZIP WRITER (no dependencies)
  // ============================================

  class ZipWriter {
    constructor() { this.files = []; }

    addFile(name, blob) { this.files.push({ name, blob }); }

    async generate() {
      const enc = new TextEncoder();
      const localParts = [];
      const centralDir = [];
      let offset = 0;

      for (const { name, blob } of this.files) {
        const nameBytes = enc.encode(name);
        const data = new Uint8Array(await blob.arrayBuffer());
        const crc = crc32(data);
        const size = data.length;

        // Local file header (30 bytes + filename)
        const lh = new Uint8Array(30 + nameBytes.length);
        const lhv = new DataView(lh.buffer);
        lhv.setUint32(0, 0x04034b50, true);
        lhv.setUint16(4, 20, true);
        lhv.setUint16(8, 0, true);
        lhv.setUint32(14, crc, true);
        lhv.setUint32(18, size, true);
        lhv.setUint32(22, size, true);
        lhv.setUint16(26, nameBytes.length, true);
        lh.set(nameBytes, 30);

        // Central directory entry (46 bytes + filename)
        const cd = new Uint8Array(46 + nameBytes.length);
        const cdv = new DataView(cd.buffer);
        cdv.setUint32(0, 0x02014b50, true);
        cdv.setUint16(4, 20, true);
        cdv.setUint16(6, 20, true);
        cdv.setUint16(10, 0, true);
        cdv.setUint32(16, crc, true);
        cdv.setUint32(20, size, true);
        cdv.setUint32(24, size, true);
        cdv.setUint16(28, nameBytes.length, true);
        cdv.setUint32(42, offset, true);
        cd.set(nameBytes, 46);

        localParts.push(lh, data);
        centralDir.push(cd);
        offset += lh.length + data.length;
      }

      const cdSize = centralDir.reduce((s, b) => s + b.length, 0);
      const eocd = new Uint8Array(22);
      const eocdv = new DataView(eocd.buffer);
      eocdv.setUint32(0, 0x06054b50, true);
      eocdv.setUint16(8, this.files.length, true);
      eocdv.setUint16(10, this.files.length, true);
      eocdv.setUint32(12, cdSize, true);
      eocdv.setUint32(16, offset, true);

      return new Blob([...localParts, ...centralDir, eocd], { type: 'application/zip' });
    }
  }

  function crc32(data) {
    let crc = 0xFFFFFFFF;
    for (let i = 0; i < data.length; i++) {
      crc ^= data[i];
      for (let j = 0; j < 8; j++) {
        crc = (crc >>> 1) ^ (crc & 1 ? 0xEDB88320 : 0);
      }
    }
    return (crc ^ 0xFFFFFFFF) >>> 0;
  }

  // ============================================
  // SIDEBAR HEIGHT
  // ============================================

  const optionsPanel = $('.options-panel');

  function updateSidebarMaxHeight() {
    if (!optionsPanel || optionsPanel.offsetParent === null) return;
    const top = optionsPanel.getBoundingClientRect().top;
    const containerPb = parseFloat(getComputedStyle(optionsPanel.closest('.container')).paddingBottom) || 0;
    const maxH = window.innerHeight - top - containerPb;
    if (maxH > 0) {
      optionsPanel.style.setProperty('--sidebar-max-height', maxH + 'px');
    }
  }

  window.addEventListener('resize', updateSidebarMaxHeight);

  // ============================================
  // UTILITIES
  // ============================================

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
