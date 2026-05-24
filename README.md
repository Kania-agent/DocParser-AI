# DocParser-AI

**Intelligent Document Parser** — Upload a `.txt`, `.md`, or `.json` file and instantly extract entities, compute statistics, and analyze word frequency.

## Features

| Feature | Description |
|---|---|
| **File Upload** | Drag & drop or browse for `.txt`, `.md`, `.json` files |
| **Entity Extraction** | Emails, URLs, phone numbers, dates, monetary amounts, code blocks |
| **Visual Highlighting** | Color-coded inline highlights for every extracted entity type |
| **Document Statistics** | Word count, sentence count, character count, paragraph count, average word length |
| **Word Frequency** | Top N word frequency bar chart with optional stop-word filtering |
| **JSON Export** | One-click export of all extracted data as a structured JSON file |

## How to Use

1. Open `index.html` in any modern browser.
2. Drag a file onto the upload zone — or click **Choose File**.
3. View the highlighted document, entity tabs, stats, and word frequency chart.
4. Click **Export JSON** to download all extracted data.

## File Structure

```
DocParser-AI/
├── index.html   — Main HTML page
├── style.css    — Dark-theme UI styles
├── app.js       — All parsing logic & UI interactions
└── README.md    — This file
```

## Tech

- Vanilla HTML / CSS / JavaScript — zero dependencies, runs entirely client-side.
- No data leaves your browser.

## License

MIT
