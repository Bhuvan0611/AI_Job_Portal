# AI Service

Python FastAPI microservice that powers the AI features of the Job Portal.

## Features

- **Resume Analysis** — PDF text extraction (pdfplumber) + structured analysis (Gemini)
- **Job Matching** — SentenceTransformer embeddings + cosine similarity + skill overlap
- **RAG Assistant** — Grounded Q&A over recruiter's candidate data
- **Interview** — AI question generation + semantic answer evaluation
- **Report** — Explainable hiring report with weighted scoring

## Setup

### 1. Create virtual environment

```bash
cd ai-service
python -m venv venv

# Windows
venv\Scripts\activate

# macOS/Linux
source venv/bin/activate
```

### 2. Install dependencies

```bash
pip install -r requirements.txt
```

### 3. Download NLTK data (auto-downloads on first run, but you can pre-download)

```bash
python -c "import nltk; nltk.download('punkt'); nltk.download('punkt_tab'); nltk.download('stopwords'); nltk.download('wordnet'); nltk.download('omw-1.4')"
```

### 4. Configure environment

```bash
cp .env.example .env
# Edit .env and add your GEMINI_API_KEY
```

### 5. Run

```bash
python main.py
# or
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

### 6. Verify

```bash
curl http://localhost:8000/health
# → {"status":"ok"}
```

## Architecture

```
ai-service/
├── main.py                  ← FastAPI app + endpoints
├── services/
│   ├── llm_service.py       ← Gemini wrapper (swap providers here)
│   ├── resume_service.py    ← PDF extraction + analysis
│   ├── matching_service.py  ← Embeddings + cosine similarity
│   ├── rag_service.py       ← Context formatting + LLM
│   └── interview_service.py ← Question gen + evaluation
├── utils/
│   └── text_processing.py   ← clean_text(), clean_for_grading()
├── requirements.txt
├── .env.example
└── README.md
```

## Notes

- **SentenceTransformer model** (`all-MiniLM-L6-v2`, ~80MB) downloads on first use. First startup takes ~30-60s.
- **NLTK data** auto-downloads on first import if not present.
- **LLM provider**: Only `services/llm_service.py` knows about Gemini. To switch providers, edit only that file.
