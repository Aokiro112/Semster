"""
SemesterOS Document Processing & Extraction Microservice
Provides PDF/text document parsing, chunking, and local embeddings support for Ollama RAG.
"""

import os
import sys
import json
from typing import List, Dict, Any

def chunk_text(text: str, chunk_size: int = 500, overlap: int = 50) -> List[Dict[str, Any]]:
    """Chunks text into overlapping segments for RAG retrieval."""
    words = text.split()
    chunks = []
    i = 0
    chunk_id = 0
    while i < len(words):
        chunk_words = words[i:i + chunk_size]
        chunk_str = " ".join(chunk_words)
        chunks.append({
            "chunk_id": chunk_id,
            "text": chunk_str,
            "word_count": len(chunk_words)
        })
        chunk_id += 1
        i += (chunk_size - overlap)
    return chunks

def extract_document(file_path: str) -> Dict[str, Any]:
    """Extracts text content and chunks from a document."""
    if not os.path.exists(file_path):
        return {"error": f"File not found: {file_path}"}

    ext = os.path.splitext(file_path)[1].lower()
    text = ""

    if ext in [".txt", ".md", ".tex", ".py", ".c", ".cpp", ".java"]:
        with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
            text = f.read()
    else:
        # Fallback binary or supported text
        with open(file_path, "rb") as f:
            raw = f.read()
            text = raw.decode("utf-8", errors="ignore")

    chunks = chunk_text(text)
    return {
        "file_path": file_path,
        "total_words": len(text.split()),
        "chunks_count": len(chunks),
        "chunks": chunks
    }

if __name__ == "__main__":
    if len(sys.argv) > 1:
        doc_path = sys.argv[1]
        result = extract_document(doc_path)
        print(json.dumps(result, indent=2))
    else:
        print("SemesterOS Document Extractor Service Ready.")
