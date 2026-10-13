import math
import re
from typing import List, Dict, Any, Tuple, Optional

try:
    from .db import get_all_searchable_chunks
except (ImportError, ValueError):
    from db import get_all_searchable_chunks

def tokenize(text: str) -> List[str]:
    """Tokenize text into lowercase alphanumeric tokens."""
    return re.findall(r'\b[a-zA-Z0-9_\-]{2,}\b', text.lower())

class BM25Retriever:
    """
    BM25 implementation for lexical relevance ranking over document chunks.
    Ensures real, grounded retrieval without external vector DB dependencies.
    """
    def __init__(self, k1: float = 1.5, b: float = 0.75):
        self.k1 = k1
        self.b = b

    def retrieve(self, query: str, top_k: int = 4, score_threshold: float = 1.2, subject: Optional[str] = None, user_id: Optional[str] = None) -> Tuple[List[Dict[str, Any]], bool]:
        chunks = get_all_searchable_chunks(user_id=user_id)
        if not chunks:
            return [], False

        query_tokens = tokenize(query)
        # Remove ultra-common stop tokens from query
        stop_words = {"what", "how", "why", "when", "where", "who", "which", "is", "are", "the", "a", "an", "in", "on", "of", "to", "for", "and", "or", "can", "you", "tell", "me", "about", "explain"}
        filtered_query = [t for t in query_tokens if t not in stop_words]
        if not filtered_query:
            filtered_query = query_tokens

        N = len(chunks)
        doc_tokens = [tokenize(c["content"] + " " + c["title"] + " " + " ".join(c.get("keywords", []))) for c in chunks]
        doc_lens = [len(tokens) for tokens in doc_tokens]
        avgdl = sum(doc_lens) / (N if N > 0 else 1)

        # Calculate document frequency (DF) for each query term
        df = {}
        for term in set(filtered_query):
            count = sum(1 for tokens in doc_tokens if term in tokens)
            df[term] = count

        scores = []
        for idx, c in enumerate(chunks):
            score = 0.0
            tokens = doc_tokens[idx]
            d_len = doc_lens[idx]
            tf_dict = {}
            for t in tokens:
                tf_dict[t] = tf_dict.get(t, 0) + 1

            for term in filtered_query:
                tf = tf_dict.get(term, 0)
                if tf > 0:
                    term_df = df.get(term, 0)
                    # Robertson-Spärck Jones IDF
                    idf = math.log((N - term_df + 0.5) / (term_df + 0.5) + 1.0)
                    # BM25 TF formula
                    num = tf * (self.k1 + 1)
                    denom = tf + self.k1 * (1 - self.b + self.b * (d_len / (avgdl if avgdl > 0 else 1)))
                    score += idf * (num / denom)

            # Bonus for exact phrase or title matches
            clean_q = " ".join(filtered_query)
            if clean_q and clean_q in c["content"].lower():
                score += 2.0
            if clean_q and clean_q in c["title"].lower():
                score += 3.0

            # Bonus when chunk aligns with user's selected educational subject
            if subject and subject.strip():
                sub_clean = subject.strip().lower()
                chunk_topic = c.get("topic", "").lower()
                chunk_title = c.get("title", "").lower()
                if sub_clean in chunk_topic or chunk_topic in sub_clean:
                    score += 3.5
                elif sub_clean in chunk_title:
                    score += 2.0

            scores.append((score, c))

        # Sort descending by score
        scores.sort(key=lambda x: x[0], reverse=True)

        top_results = []
        for s, c in scores[:top_k]:
            if s > 0.05:  # minimal non-zero match
                res_item = dict(c)
                res_item["relevance_score"] = round(s, 2)
                top_results.append(res_item)

        # Check if the highest scoring chunk meets the sufficiency threshold
        has_sufficient = False
        if top_results and top_results[0]["relevance_score"] >= score_threshold:
            has_sufficient = True

        return top_results, has_sufficient

retriever = BM25Retriever()

def search_relevant_chunks(query: str, top_k: int = 4, threshold: float = 1.0, subject: Optional[str] = None, user_id: Optional[str] = None) -> Tuple[List[Dict[str, Any]], bool]:
    return retriever.retrieve(query, top_k=top_k, score_threshold=threshold, subject=subject, user_id=user_id)

