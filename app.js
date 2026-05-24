// DocParser-AI — Document Parsing & Entity Extraction
const state = {
  entities: [],
  highlighted: false,
  classifications: []
};

const sampleText = `Dear Mr. James Anderson,

Thank you for your inquiry regarding the partnership between Acme Corporation and TechVision Solutions. As discussed during our meeting on March 15, 2024, at the Hilton Hotel in San Francisco, California, we are pleased to proceed with the agreement.

The total investment of $2,450,000 will be transferred to the joint venture account managed by Sarah Chen (sarah.chen@techvision.com, +1-415-555-0142) by April 1, 2024.

This agreement has been reviewed by our legal team at Baker & McKenzie LLP and complies with all applicable regulations in the United States. Please find the finalized terms below and confirm your acceptance by responding to this letter.

Best regards,
Robert Williams
VP of Business Development
Acme Corporation
Email: r.williams@acmecorp.com
Phone: +1-212-555-0198`;

// Entity patterns (regex-based)
const entityPatterns = {
  person: [
    /Mr\.\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)/g,
    /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)\s+(?:of|at|from|@)/g,
    /((?:Robert|Sarah|James|Michael|David|Emily|John|Jane|Mark|Lisa)\s+[A-Z][a-z]+)/g,
    /Best regards,\s*\n([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)/g
  ],
  organization: [
    /((?:[A-Z][a-z]+(?:\s+)?)+(?:Corporation|Inc\.|LLC|Ltd\.|LLP|Co\.|Solutions|Partners))/g,
    /((?:Acme|TechVision|Baker|McKenzie)\s+(?:Corporation|Solutions|&\s+McKenzie))/g
  ],
  location: [
    /(San Francisco|New York|Los Angeles|Chicago|Houston|Phoenix|San Diego|San Jose|Austin|Boston)/g,
    /California/g,
    /(the\s+United\s+States)/g,
    /Hilton\s+Hotel/g
  ],
  date: [
    /((?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2}(?:st|nd|rd|th)?,?\s+\d{4})/g,
    /(\d{1,2}\/\d{1,2}\/\d{4})/g
  ],
  money: [
    /\$[\d,]+(?:\.\d{2})?/g
  ],
  email: [
    /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g
  ],
  phone: [
    /\+[\d\-().\s]{7,}/g
  ]
};

function extractEntities(text) {
  const entities = {};
  const seen = new Set();

  Object.entries(entityPatterns).forEach(([type, patterns]) => {
    entities[type] = [];
    patterns.forEach(pattern => {
      let match;
      const regex = new RegExp(pattern.source, pattern.flags);
      while ((match = regex.exec(text)) !== null) {
        const value = (match[1] || match[0]).trim();
        const key = `${type}:${value}`;
        if (!seen.has(key) && value.length > 1) {
          seen.add(key);
          entities[type].push({ value, type, start: match.index, end: match.index + match[0].length });
        }
      }
    });
  });

  return entities;
}

function classifyDocument(text) {
  const lower = text.toLowerCase();
  const classifications = [];

  if (lower.includes('invoice') || lower.includes('payment') || lower.includes('amount due'))
    classifications.push({ type: 'invoice', confidence: 0.92 });
  if (lower.includes('agreement') || lower.includes('terms') || lower.includes('legal'))
    classifications.push({ type: 'contract', confidence: 0.88 });
  if (lower.includes('dear') && lower.includes('regards'))
    classifications.push({ type: 'letter', confidence: 0.85 });
  if (lower.includes('report') || lower.includes('findings') || lower.includes('analysis'))
    classifications.push({ type: 'report', confidence: 0.78 });
  if (lower.includes('re:') || lower.includes('subject:'))
    classifications.push({ type: 'email', confidence: 0.70 });

  if (classifications.length === 0) {
    classifications.push({ type: 'letter', confidence: 0.45 });
  }

  return classifications.sort((a, b) => b.confidence - a.confidence);
}

function renderEntities(entities) {
  const container = document.getElementById('entitiesContainer');
  container.innerHTML = '';

  const typeLabels = {
    person: '👤 Persons', organization: '🏢 Organizations', location: '📍 Locations',
    date: '📅 Dates', money: '💰 Money', email: '📧 Emails', phone: '📞 Phones'
  };

  Object.entries(entities).forEach(([type, items]) => {
    if (items.length === 0) return;
    const group = document.createElement('div');
    group.className = 'entity-group';
    group.innerHTML = `<div class="entity-group-title">${typeLabels[type] || type} (${items.length})</div>`;
    items.forEach(item => {
      const chip = document.createElement('span');
      chip.className = `entity-chip ${type}`;
      chip.textContent = item.value;
      group.appendChild(chip);
    });
    container.appendChild(group);
  });

  const total = Object.values(entities).flat().length;
  document.getElementById('totalEntities').textContent = total;
  document.getElementById('entityCount').textContent = total;
  document.getElementById('charCount').textContent = document.getElementById('docInput').value.length;
  document.getElementById('wordCount').textContent = document.getElementById('docInput').value.split(/\s+/).filter(Boolean).length;
}

function renderClassifications(classifications) {
  const container = document.getElementById('classifications');
  container.innerHTML = '';
  classifications.forEach(c => {
    const pct = Math.round(c.confidence * 100);
    const tag = document.createElement('span');
    tag.className = `class-tag ${c.type}`;
    tag.innerHTML = `${c.type} <span class="confidence-bar"><span class="confidence-fill" style="width:${pct}%"></span></span> ${pct}%`;
    container.appendChild(tag);
  });
}

function highlightText(text, entities) {
  if (!state.highlighted) return null;

  // Create highlight map
  const highlights = [];
  Object.values(entities).flat().forEach(e => {
    highlights.push({ start: e.start, end: e.end, type: e.type, value: e.value });
  });

  highlights.sort((a, b) => a.start - b.start);

  let result = '';
  let lastIdx = 0;
  highlights.forEach(h => {
    if (h.start >= lastIdx) {
      result += escapeHtml(text.slice(lastIdx, h.start));
      result += `<span class="highlight-${h.type}">${escapeHtml(h.value)}</span>`;
      lastIdx = h.end;
    }
  });
  result += escapeHtml(text.slice(lastIdx));
  return result;
}

function escapeHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br>');
}

function parseDocument() {
  const text = document.getElementById('docInput').value;
  if (!text.trim()) return;

  const entities = extractEntities(text);
  state.entities = entities;

  renderEntities(entities);

  const classifications = classifyDocument(text);
  state.classifications = classifications;
  renderClassifications(classifications);

  // OCR simulation
  document.getElementById('ocrResults').textContent = `[OCR Engine: Tesseract 5.3]\nLanguage: English\nConfidence: 94.7%\nWords detected: ${text.split(/\s+/).length}\nCharacters: ${text.length}\nPages processed: 1\n\n--- Raw OCR Output ---\n${text}`;

  // Highlighted view
  if (state.highlighted) {
    const highlighted = highlightText(text, entities);
    if (highlighted) document.getElementById('highlightedView').innerHTML = highlighted;
  }
}

function toggleHighlight() {
  state.highlighted = !state.highlighted;
  const btn = document.getElementById('btnHighlight');
  btn.className = state.highlighted ? 'btn btn-active' : 'btn';

  if (state.highlighted) {
    const text = document.getElementById('docInput').value;
    const highlighted = highlightText(text, state.entities);
    document.getElementById('highlightedView').innerHTML = highlighted || escapeHtml(text);
    document.getElementById('highlightPanel').style.display = 'block';
  } else {
    document.getElementById('highlightPanel').style.display = 'none';
  }
}

function exportEntities() {
  const flat = {};
  Object.entries(state.entities).forEach(([type, items]) => {
    flat[type] = items.map(i => i.value);
  });
  const json = JSON.stringify({ entities: flat, classifications: state.classifications }, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'entities.json';
  a.click();
  URL.revokeObjectURL(url);
}

// Init
document.getElementById('docInput').value = sampleText;
document.getElementById('btnParse').addEventListener('click', parseDocument);
document.getElementById('btnHighlight').addEventListener('click', toggleHighlight);
document.getElementById('btnExport').addEventListener('click', exportEntities);
