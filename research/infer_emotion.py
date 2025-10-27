#!/usr/bin/env python3
"""
Lightweight inference wrapper that reads a JSON array of texts from stdin
and outputs a JSON array of predicted emotion labels to stdout.

This uses the same transformer used in `qsvc_emotion_classifier.py` for
pseudo-labeling (fast, CPU-friendly) so we can perform server-side
classification on the fly without re-training the QSVC pipeline.

Input: JSON array of strings (one subtitle per video)
Output: JSON array of labels (e.g. ["joy", "neutral", ...])

Keep this script minimal and avoid changing `qsvc_emotion_classifier.py`.
"""
import sys
import json
from typing import List

try:
    from transformers import pipeline
except Exception as e:
    print(json.dumps({"error": "missing transformers: install via pip install transformers"}))
    sys.exit(1)


def read_stdin() -> List[str]:
    raw = sys.stdin.read()
    if not raw:
        return []
    try:
        data = json.loads(raw)
        if isinstance(data, list):
            return [str(x) if x is not None else "" for x in data]
    except Exception:
        pass
    return []


def main():
    texts = read_stdin()
    if not texts:
        print(json.dumps([]))
        return

    # Use the same emotion model used in the QSVC script for pseudo-labeling
    classifier = pipeline("text-classification", model="j-hartmann/emotion-english-distilroberta-base", top_k=1)

    labels = []
    for t in texts:
        try:
            pred = classifier(t[:512])[0][0]
            label = pred.get("label", "neutral").lower()
            score = float(pred.get("score", 0.0))
            if score < 0.6:
                label = "neutral"
        except Exception:
            label = "neutral"
        labels.append(label)

    print(json.dumps(labels))


if __name__ == "__main__":
    main()
