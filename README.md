# 📄 DocParser-AI

> Intelligent document parsing and structured extraction powered by MiMo V2.5

## Why This Exists

Every organization drowns in unstructured documents — PDFs, scanned invoices, contracts, medical records, research papers. Converting these into structured, queryable data has historically required either rigid templates that break on format variations or expensive manual data entry that doesn't scale. The gap between "we have documents" and "we can query our documents" costs enterprises billions annually.

DocParser-AI uses MiMo V2.5's multimodal reasoning to parse documents the way a human would — **reading the content, understanding context, and extracting meaning** — not just matching regex patterns. It handles messy OCR output, degrades gracefully on low-quality scans, and understands the *intent* of document structures like tables, forms, and legal clauses. Each document is processed through an intelligent pipeline that adapts its extraction strategy based on document type and quality.

Whether you're processing thousands of insurance claims, extracting clauses from legal contracts, or building a knowledge base from research papers, DocParser-AI delivers structured output with confidence scores. The system learns from corrections and improves over time, making it the last document parser you'll ever need to configure.

## Architecture

```
┌───────────┐     ┌─────┐     ┌────────────────┐     ┌──────────────────┐     ┌─────────────┐
│ DOCUMENT  │────▶│ OCR │────▶│ ENTITY EXTRACT │────▶│ CLASSIFICATION   │────▶│ STRUCTURED  │
│           │     │     │     │                │     │                  │     │ OUTPUT      │
│ • PDF     │     │ • OCR│    │ • Names/Dates  │     │ • Doc Type       │     │ • JSON      │
│ • Image   │     │ • VLM│    │ • Tables       │     │ • Intent         │     │ • CSV       │
│ • Scanned │     │ • Den│    │ • Amounts      │     │ • Confidence     │     │ • XML       │
│ • Digital │     │   oise│   │ • Relationships│     │ • Routing        │     │ • Database  │
└───────────┘     └─────┘     └────────────────┘     └──────────────────┘     └─────────────┘

    MiMo V2.5 Agent adapts parsing strategy based on document type and quality
```

## Token Consumption Model

| Stage | Description | Tokens/Doc | Avg Latency | Cost Estimate |
|-------|-------------|------------|-------------|---------------|
| **OCR & Layout** | Visual text extraction, layout analysis, table structure detection | 100K | 4s | $0.04 |
| **Entity Extraction** | Named entities, relationships, key-value pairs, table data | 500K | 22s | $0.20 |
| **Classification** | Document type detection, intent classification, routing decisions | 200K | 8s | $0.08 |
| **Total** | Full document processing | **800K** | **34s** | **$0.32** |

*Token estimates for a typical 10-page document. Multi-page documents scale approximately linearly.*

## Features

- **Multimodal OCR** — Combines traditional OCR with vision language models for accurate text extraction from any document quality
- **Layout-Aware Parsing** — Understands document structure: columns, headers, footers, sidebars, watermarks
- **Table Extraction** — Accurately extracts complex tables including merged cells, nested structures, and spanning headers
- **Entity Recognition** — Extracts names, dates, monetary amounts, addresses, IDs, and custom entity types
- **Document Classification** — Auto-detects document type (invoice, contract, form, letter) with confidence scoring
- **Relationship Mapping** — Links entities across document sections (e.g., matching buyer to purchase order)
- **Confidence Scoring** — Every extracted field includes a confidence score for downstream quality filtering
- **Batch Processing** — Parallel document processing with configurable concurrency and retry logic
- **Correction Learning** — Incorporates human corrections to improve extraction accuracy over time
- **Template Free** — No templates to configure — adapts to new document formats automatically

## Tech Stack

- **Runtime**: Python 3.11+
- **Agent Engine**: MiMo V2.5 (Nous Research)
- **OCR**: Tesseract 5, PaddleOCR, MiMo Vision (VLM)
- **PDF Processing**: PyMuPDF, pdfplumber, Camelot
- **Image Processing**: OpenCV, Pillow, scikit-image
- **NLP**: spaCy, Hugging Face Tokenizers
- **ML Framework**: PyTorch 2.x
- **Storage**: PostgreSQL (metadata), MinIO (document store)
- **API**: FastAPI, async workers
- **Task Queue**: Celery + Redis

## Quick Start

```bash
# Install DocParser-AI
pip install docparser-ai

# Parse a single document
docparser parse invoice.pdf --output result.json

# Parse with specific extraction schema
docparser parse contract.pdf --schema legal_contracts --output result.json

# Batch process a directory
docparser batch ./documents/ --output ./results/ --workers 8

# Start the API server
docparser serve --port 8000

# Classify a document without full extraction
docparser classify mystery_doc.pdf
```

## Project Structure

```
DocParser-AI/
├── README.md
├── pyproject.toml
├── schemas/
│   ├── invoice.yaml              # Invoice extraction schema
│   ├── contract.yaml             # Contract extraction schema
│   └── medical_record.yaml       # Medical record schema
├── src/
│   ├── __init__.py
│   ├── agent/
│   │   ├── parser.py             # MiMo V2.5 parsing agent
│   │   ├── planner.py            # Document strategy selection
│   │   └── reasoner.py           # Context-aware extraction
│   ├── ocr/
│   │   ├── engine.py             # OCR orchestrator
│   │   ├── tesseract.py          # Tesseract adapter
│   │   ├── vlm.py                # Vision language model
│   │   └── denoiser.py           # Image pre-processing
│   ├── extraction/
│   │   ├── entity.py             # Named entity recognition
│   │   ├── table.py              # Table structure extraction
│   │   ├── relation.py           # Relationship mapping
│   │   └── keyvalue.py           # Key-value pair extraction
│   ├── classification/
│   │   ├── classifier.py         # Document type classifier
│   │   ├── intent.py             # Intent detection
│   │   └── models/               # Trained classification models
│   ├── output/
│   │   ├── json_writer.py        # JSON serialization
│   │   ├── csv_writer.py         # CSV export
│   │   └── xml_writer.py         # XML export
│   └── utils/
│       ├── confidence.py         # Confidence scoring
│       ├── page_splitter.py      # Multi-page handling
│       └── feedback.py           # Correction learning loop
├── tests/
│   ├── test_ocr.py
│   ├── test_extraction.py
│   ├── test_classification.py
│   └── fixtures/                 # Sample documents for testing
├── api/
│   └── main.py                   # FastAPI endpoints
└── Dockerfile
```

---

> Built with MiMo V2.5 — [Nous Research](https://nousresearch.com)
