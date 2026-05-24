/**
 * DocParser-AI — Intelligent Document Parser
 * All parsing, extraction, stats, and UI logic lives here.
 */

(function () {
  'use strict';

  /* ========================================================
     1. CONSTANTS & DOM REFERENCES
     ======================================================== */
  const DOM = {
    dropZone: document.getElementById('dropZone'),
    fileInput: document.getElementById('fileInput'),
    browseBtn: document.getElementById('browseBtn'),
    fileInfo: document.getElementById('fileInfo'),
    fileName: document.getElementById('fileName'),
    fileSize: document.getElementById('fileSize'),
    clearBtn: document.getElementById('clearBtn'),
    statsSection: document.getElementById('statsSection'),
    statsGrid: document.getElementById('statsGrid'),
    resultsSection: document.getElementById('resultsSection'),
    highlightedDoc: document.getElementById('highlightedDoc'),
    exportBtn: document.getElementById('exportBtn'),
    frequencySection: document.getElementById('frequencySection'),
    freqChart: document.getElementById('freqChart'),
    freqLimit: document.getElementById('freqLimit'),
    stopWordsToggle: document.getElementById('stopWordsToggle'),
  };

  const STOP_WORDS = new Set([
    'a','an','the','and','or','but','if','in','on','at','to','for','of','with',
    'by','from','as','is','was','are','were','be','been','being','have','has',
    'had','do','does','did','will','would','could','should','may','might',
    'shall','can','need','dare','ought','used','that','this','these','those',
    'i','me','my','mine','we','our','ours','you','your','yours','he','him',
    'his','she','her','hers','it','its','they','them','their','theirs','what',
    'which','who','whom','whose','where','when','how','why','all','each',
    'every','both','few','more','most','other','some','such','no','nor','not',
    'only','own','same','so','than','too','very','just','about','above','after',
    'again','also','any','because','before','between','during','here','into',
    'out','over','then','there','through','under','until','up','while','already',
    'always','even','still','new','much','many','well','make','made','way',
    'back','got','get','let','like','going','go','know','see','come','take',
    'give','say','said','thing','things','one','two','first','don','didn',
    'doesn','isn','wasn','aren','weren','won','hasn','haven','hadn','couldn',
    'wouldn','shouldn','ve','ll','re','s','t','m',
  ]);

  /* ========================================================
     2. REGEX PATTERNS
     ======================================================== */
  const PATTERNS = {
    email: /[a-zA-Z0-9._%+\-!#$&'*/=?^`{|}~]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g,
    url: /https?:\/\/[^\s<>\])"'`]+|www\.[^\s<>\])"'`]+\.[^\s<>\])"'`]+/g,
    phone: /(?:\+?\d{1,3}[\s\-]?)?\(?\d{2,4}\)?[\s\-]?\d{3,4}[\s\-]?\d{3,4}/g,
    date: /\b(?:\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}|\d{4}[\/\-\.]\d{1,2}[\/\-\.]\d{1,2}|\b(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+\d{1,2},?\s+\d{4}|\b\d{1,2}\s+(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+\d{4})\b/g,
    amount: /[$€£¥₹]\s*\d[\d,]*\.?\d{0,2}|\d[\d,]*\.?\d{0,2}\s*(?:USD|EUR|GBP|JPY|INR|dollars?|euros?|pounds?)/g,
    codeBlock: /```[\s\S]*?```/g,
    inlineCode: /`[^`\n]+`/g,
  };

  /* ========================================================
     3. STATE
     ======================================================== */
  let currentText = '';
  let currentFileName = '';
  let extractedData = {};

  /* ========================================================
     4. FILE HANDLING
     ======================================================== */
  function readFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(reader.error);
      reader.readAsText(file);
    });
  }

  function formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  function handleFile(file) {
    const validExts = ['.txt', '.md', '.json'];
    const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    if (!validExts.includes(ext)) {
      alert('Please upload a .txt, .md, or .json file.');
      return;
    }
    readFile(file).then(text => {
      currentText = text;
      currentFileName = file.name;
      DOM.fileName.textContent = file.name;
      DOM.fileSize.textContent = formatBytes(file.size);
      DOM.fileInfo.classList.remove('hidden');
      DOM.dropZone.classList.add('hidden');
      parseDocument(text);
    }).catch(err => {
      console.error('File read error:', err);
      alert('Error reading file.');
    });
  }

  /* ========================================================
     5. EXTRACTION FUNCTIONS
     ======================================================== */
  function extract(pattern, text) {
    const matches = [];
    let m;
    const re = new RegExp(pattern.source, pattern.flags);
    while ((m = re.exec(text)) !== null) {
      matches.push(m[0]);
    }
    return [...new Set(matches)];
  }

  function extractCodeBlocks(text) {
    const blocks = [];
    let m;
    const re = new RegExp(PATTERNS.codeBlock.source, 'g');
    while ((m = re.exec(text)) !== null) {
      blocks.push(m[0]);
    }
    return blocks;
  }

  function extractAll(text) {
    return {
      emails: extract(PATTERNS.email, text),
      urls: extract(PATTERNS.url, text),
      phones: extract(PATTERNS.phone, text).filter(p => p.replace(/\D/g, '').length >= 7),
      dates: extract(PATTERNS.date, text),
      amounts: extract(PATTERNS.amount, text),
      codeBlocks: extractCodeBlocks(text),
    };
  }

  /* ========================================================
     6. DOCUMENT STATISTICS
     ======================================================== */
  function computeStats(text) {
    const trimmed = text.trim();
    if (!trimmed) {
      return { words: 0, sentences: 0, characters: text.length, paragraphs: 0, avgWordLen: 0 };
    }

    const words = trimmed.split(/\s+/).filter(Boolean);
    const wordCount = words.length;
    const avgWordLength = wordCount > 0
      ? (words.reduce((sum, w) => sum + w.replace(/[^a-zA-Z0-9]/g, '').length, 0) / wordCount).toFixed(1)
      : 0;

    const sentences = trimmed.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const sentenceCount = sentences.length;

    const paragraphs = trimmed.split(/\n\s*\n/).filter(p => p.trim().length > 0).length;

    return {
      words: wordCount,
      sentences: sentenceCount,
      characters: trimmed.length,
      paragraphs: paragraphs,
      avgWordLen: parseFloat(avgWordLength),
    };
  }

  /* ========================================================
     7. WORD FREQUENCY
     ======================================================== */
  function wordFrequency(text, excludeStopWords) {
    const words = text
      .toLowerCase()
      .replace(/[^a-z0-9\s'-]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 1);

    const freq = {};
    for (const w of words) {
      if (excludeStopWords && STOP_WORDS.has(w)) continue;
      freq[w] = (freq[w] || 0) + 1;
    }

    return Object.entries(freq)
      .sort((a, b) => b[1] - a[1]);
  }

  /* ========================================================
     8. HIGHLIGHTED DOCUMENT
     ======================================================== */
  function escapeHtml(str) {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function buildHighlightedHTML(text, entities) {
    // Build a sorted list of all match ranges across all entity types
    const replacements = [];
    const typeMap = {
      email: 'hl-email',
      url: 'hl-url',
      phone: 'hl-phone',
      date: 'hl-date',
      amount: 'hl-amount',
      codeBlock: 'hl-code',
    };

    for (const [type, cls] of Object.entries(typeMap)) {
      const list = type === 'codeBlock' ? entities.codeBlocks : (entities[type] || []);
      for (const match of list) {
        let idx = text.indexOf(match);
        while (idx !== -1) {
          replacements.push({ start: idx, end: idx + match.length, cls, text: match });
          idx = text.indexOf(match, idx + 1);
        }
      }
    }

    // Sort by start, longer matches first to avoid nesting issues
    replacements.sort((a, b) => a.start - b.start || b.end - a.end);

    // Merge overlapping ranges (keep outermost)
    const merged = [];
    for (const r of replacements) {
      if (merged.length === 0) { merged.push(r); continue; }
      const last = merged[merged.length - 1];
      if (r.start >= last.end) {
        merged.push(r);
      } else if (r.end > last.end) {
        // Extend the last span
        last.end = r.end;
        last.text = text.substring(last.start, last.end);
      }
    }

    // Build HTML string
    let html = '';
    let cursor = 0;
    for (const r of merged) {
      if (r.start > cursor) {
        html += escapeHtml(text.substring(cursor, r.start));
      }
      html += '<span class="' + r.cls + '">' + escapeHtml(text.substring(r.start, r.end)) + '</span>';
      cursor = r.end;
    }
    if (cursor < text.length) {
      html += escapeHtml(text.substring(cursor));
    }
    return html;
  }

  /* ========================================================
     9. UI RENDERING
     ======================================================== */
  function renderStats(stats) {
    const items = [
      { label: 'Words', value: stats.words },
      { label: 'Sentences', value: stats.sentences },
      { label: 'Characters', value: stats.characters },
      { label: 'Paragraphs', value: stats.paragraphs },
      { label: 'Avg Word Len', value: stats.avgWordLen },
    ];
    DOM.statsGrid.innerHTML = items.map(it =>
      '<div class="stat-card"><div class="stat-value">' + it.value + '</div><div class="stat-label">' + it.label + '</div></div>'
    ).join('');
    DOM.statsSection.classList.remove('hidden');
  }

  function renderEntityList(id, items) {
    const el = document.getElementById(id);
    if (!items.length) {
      el.innerHTML = '<li style="color:var(--text-dim)">None found</li>';
      return;
    }
    el.innerHTML = items.map(i => '<li>' + escapeHtml(i) + '</li>').join('');
  }

  function renderCodeBlocks(blocks) {
    const el = DOM.codeList;
    if (!blocks.length) {
      el.innerHTML = '<div class="code-block" style="color:var(--text-dim)">No code blocks found</div>';
      return;
    }
    el.innerHTML = blocks.map(b => '<div class="code-block">' + escapeHtml(b) + '</div>').join('');
  }

  function renderEntities(entities) {
    renderEntityList('emailList', entities.emails);
    renderEntityList('urlList', entities.urls);
    renderEntityList('phoneList', entities.phones);
    renderEntityList('dateList', entities.dates);
    renderEntityList('amountList', entities.amounts);
    renderCodeBlocks(entities.codeBlocks);

    document.getElementById('emailCount').textContent = entities.emails.length;
    document.getElementById('urlCount').textContent = entities.urls.length;
    document.getElementById('phoneCount').textContent = entities.phones.length;
    document.getElementById('dateCount').textContent = entities.dates.length;
    document.getElementById('amountCount').textContent = entities.amounts.length;
    document.getElementById('codeCount').textContent = entities.codeBlocks.length;

    DOM.highlightedDoc.innerHTML = buildHighlightedHTML(currentText, entities);
    DOM.resultsSection.classList.remove('hidden');
  }

  function renderFrequency(text) {
    const limit = parseInt(DOM.freqLimit.value, 10);
    const exclude = DOM.stopWordsToggle.checked;
    const freq = wordFrequency(text, exclude).slice(0, limit);

    if (!freq.length) {
      DOM.freqChart.innerHTML = '<p style="color:var(--text-dim)">No words to analyze.</p>';
      return;
    }

    const maxCount = freq[0][1];
    DOM.freqChart.innerHTML = freq.map(([word, count]) => {
      const pct = (count / maxCount) * 100;
      return '<div class="freq-row">' +
        '<span class="freq-word">' + escapeHtml(word) + '</span>' +
        '<div class="freq-bar-container"><div class="freq-bar" style="width:' + pct + '%"></div></div>' +
        '<span class="freq-count">' + count + '</span></div>';
    }).join('');
  }

  /* ========================================================
     10. MAIN PARSE ORCHESTRATOR
     ======================================================== */
  function parseDocument(text) {
    const entities = extractAll(text);
    const stats = computeStats(text);

    extractedData = {
      fileName: currentFileName,
      stats: stats,
      entities: entities,
    };

    renderStats(stats);
    renderEntities(entities);
    renderFrequency(text);
    DOM.frequencySection.classList.remove('hidden');
  }

  /* ========================================================
     11. EXPORT
     ======================================================== */
  function exportJSON() {
    const blob = new Blob([JSON.stringify(extractedData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = currentFileName.replace(/\.[^.]+$/, '') + '_parsed.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /* ========================================================
     12. EVENT LISTENERS
     ======================================================== */
  // Drag & drop
  DOM.dropZone.addEventListener('click', () => DOM.fileInput.click());
  DOM.browseBtn.addEventListener('click', (e) => { e.stopPropagation(); DOM.fileInput.click(); });

  DOM.dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    DOM.dropZone.classList.add('drag-over');
  });
  DOM.dropZone.addEventListener('dragleave', () => DOM.dropZone.classList.remove('drag-over'));
  DOM.dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    DOM.dropZone.classList.remove('drag-over');
    if (e.dataTransfer.files.length) handleFile(e.dataTransfer.files[0]);
  });

  DOM.fileInput.addEventListener('change', () => {
    if (DOM.fileInput.files.length) handleFile(DOM.fileInput.files[0]);
  });

  // Clear
  DOM.clearBtn.addEventListener('click', () => {
    currentText = '';
    currentFileName = '';
    extractedData = {};
    DOM.fileInfo.classList.add('hidden');
    DOM.statsSection.classList.add('hidden');
    DOM.resultsSection.classList.add('hidden');
    DOM.frequencySection.classList.add('hidden');
    DOM.dropZone.classList.remove('hidden');
    DOM.fileInput.value = '';
  });

  // Export
  DOM.exportBtn.addEventListener('click', exportJSON);

  // Tabs
  document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(tc => tc.classList.remove('active'));
      tab.classList.add('active');
      document.getElementById('tab-' + tab.dataset.tab).classList.add('active');
    });
  });

  // Frequency controls
  DOM.freqLimit.addEventListener('change', () => { if (currentText) renderFrequency(currentText); });
  DOM.stopWordsToggle.addEventListener('change', () => { if (currentText) renderFrequency(currentText); });

})();
