"""
Text processing utilities for the AI service.
Ported from AI-HR-Platform/chatbot.py — clean_text() and clean_for_grading().
"""

import re
import nltk

# Download required NLTK data (idempotent — skips if already present)
for resource in ["punkt", "punkt_tab", "stopwords", "wordnet", "omw-1.4"]:
    try:
        nltk.data.find(f"corpora/{resource}" if resource not in ("punkt", "punkt_tab") else f"tokenizers/{resource}")
    except LookupError:
        nltk.download(resource, quiet=True)

from nltk.corpus import stopwords
from nltk.stem import WordNetLemmatizer

# NLTK's word_tokenize splits contractions like "don't" into ["do", "n't"] —
# the "n't" fragment fails an isalnum() check and gets dropped, and "do" is a
# stopword that gets dropped too, so the negation silently disappears before
# it ever reaches clean_for_grading()'s "preserve negation" logic below.
# Expanding contractions to their full form first ("don't" -> "do not") keeps
# the literal word "not" in the token stream so it survives stopword removal.
_NEGATION_CONTRACTIONS = {
    "don't": "do not",
    "doesn't": "does not",
    "didn't": "did not",
    "isn't": "is not",
    "aren't": "are not",
    "wasn't": "was not",
    "weren't": "were not",
    "shouldn't": "should not",
    "wouldn't": "would not",
    "couldn't": "could not",
    "won't": "will not",
    "can't": "can not",
    "cannot": "can not",
    "haven't": "have not",
    "hasn't": "has not",
    "hadn't": "had not",
}
_NEGATION_PATTERN = re.compile(
    r"\b(" + "|".join(re.escape(c) for c in _NEGATION_CONTRACTIONS) + r")\b"
)


def _expand_negation_contractions(text: str) -> str:
    """Expand contracted negations (e.g. "don't" -> "do not") so the word
    "not" survives tokenization instead of being silently lost."""
    return _NEGATION_PATTERN.sub(lambda m: _NEGATION_CONTRACTIONS[m.group(0)], text)


def clean_text(text: str) -> str:
    """
    Clean raw resume/job text for embedding and LLM analysis.

    Steps:
      1. Lowercase
      2. Remove URLs, hashtags, mentions
      3. Remove special characters (keep alphanumeric + spaces)
      4. Remove non-ASCII
      5. Collapse whitespace
      6. Tokenize → lemmatize → remove stopwords
    """
    if not text:
        return ""

    lemmatizer = WordNetLemmatizer()
    stop_words = set(stopwords.words("english"))

    text = text.lower()
    text = re.sub(r"http\S+\s*", " ", text)       # URLs
    text = re.sub(r"RT|cc", " ", text)             # retweet/cc markers
    text = re.sub(r"#\S+", "", text)               # hashtags
    text = re.sub(r"@\S+", " ", text)              # mentions
    text = re.sub(
        r"[%s]" % re.escape("""!"#$%&'()*+,-./:;<=>?@[\\]^_`{|}~"""),
        " ",
        text,
    )
    text = re.sub(r"[^\x00-\x7f]", " ", text)     # non-ASCII
    text = re.sub(r"\s+", " ", text).strip()

    tokens = nltk.word_tokenize(text)
    cleaned_tokens = [
        lemmatizer.lemmatize(word)
        for word in tokens
        if word not in stop_words and word.isalnum()
    ]
    return " ".join(cleaned_tokens)


def clean_for_grading(text: str) -> str:
    """
    Clean text for semantic similarity grading.

    Same as clean_text but PRESERVES negation words (not, no, don't, etc.)
    because they are critical for meaning in interview answer evaluation.
    """
    if not text:
        return ""

    unsafe_stops = set(stopwords.words("english"))
    # Keep negation words — removing them would flip the meaning
    negation_words = {
        "not", "no", "nor", "doesn't", "isn't", "wasn't",
        "shouldn't", "wouldn't", "couldn't", "won't",
        "can't", "don't", "haven't", "hasn't", "hadn't",
    }
    safe_stops = unsafe_stops - negation_words

    words = nltk.word_tokenize(_expand_negation_contractions(text.lower()))
    important_words = [
        w for w in words if w.isalnum() and w not in safe_stops
    ]
    return " ".join(important_words)
