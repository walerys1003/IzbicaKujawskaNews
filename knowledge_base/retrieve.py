#!/usr/bin/env python3
"""
RAG retrieve CLI dla bazy wiedzy izbica24.pl.

Użycie:
  python3 retrieve.py "pytanie o projekt"
  python3 retrieve.py "kolor czerwony hero" --k 3
  python3 retrieve.py "n8n VPS workflow" --k 5 --source SESJA_N5_N8N
"""
import json, sys, re, math, argparse
from pathlib import Path
from collections import Counter

IDX_DIR = Path("/home/user/webapp/knowledge_base/index")

# Same stop-words co w build_rag.py
STOP = set("""a aby ach acz aczkolwiek aj albo ale ależ ani aż bardziej bardzo bo bowiem 
by byli bynajmniej być był była było były będzie będą cali cała cały ci cię ciebie co cokolwiek 
coraz coś czasami czasem czemu czy czyli daleko dla dlaczego dlatego do dobrze dokąd dość 
dużo dwa dwaj dwie dwoje dziś dzisiaj gdy gdyby gdyż gdzie gdziekolwiek gdzieś go i ich ile im 
inna inne inny innych iż ja ją jak jakaś jakby jaki jakichś jakie jakimś jakiś jakiż jakoś jako jakże 
jednak jednakże jego jej jemu jest jestem jeszcze jeśli jeżeli już ją każdy kiedy kilka kimś kto 
ktokolwiek ktoś która które którego której który których którym którzy ku lat lecz lub ma mają 
mam mi mimo między mna mną mnie moi moim moja moje może możliwe można mój mu musi 
my na nad nam nami nas nasi nasz nasza nasze naszego naszej naszych natomiast natychmiast 
nawet nią nic nich nie niech niego niej niemu nigdy nim nimi niż no o obok od około on ona 
one oni ono oraz oto owszem pan pana pani po pod podczas pomimo ponad ponieważ powinien 
powinna powinni powinno poza prawie przecież przed przede przedtem przez przy raz razie 
roku również sam sama są się skąd sobie sobą sposób swoje ta tak taka taki takie także tam te 
tego tej temu ten teraz też to tobie tobą toteż trzeba tu tutaj twoi twoim twoja twoje twym 
twój ty tych tylko tym u w wam wami was wasi wasz wasza wasze we według wiele wielu więc 
więcej wszyscy wszystkich wszystkie wszystkim wszystko wtedy wy z za zapewne zawsze ze 
zł znowu znów żaden żadna żadne żadnych że żeby""".split())

def tokenize(text: str):
    text = text.lower()
    tokens = re.findall(r"[a-ząćęłńóśźż0-9]+", text)
    return [t for t in tokens if len(t) > 2 and t not in STOP]

def load():
    chunks = json.loads((IDX_DIR / "chunks.json").read_text(encoding="utf-8"))
    idx = json.loads((IDX_DIR / "bm25_index.json").read_text(encoding="utf-8"))
    return chunks, idx

def bm25(query, idx, k1=1.5, b=0.75):
    q_tokens = tokenize(query)
    if not q_tokens:
        return []
    scores = [0.0] * idx["N"]
    avgdl = idx["avgdl"]
    for qt in q_tokens:
        idf = idx["idf"].get(qt)
        if idf is None:
            continue
        for i in range(idx["N"]):
            tf = idx["tf"][i].get(qt, 0)
            if tf == 0:
                continue
            dl = idx["doc_lens"][i]
            denom = tf + k1 * (1 - b + b * dl / avgdl)
            scores[i] += idf * (tf * (k1 + 1) / denom)
    return scores

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("query", nargs="+", help="Pytanie do bazy wiedzy")
    ap.add_argument("--k", type=int, default=5, help="Liczba wyników")
    ap.add_argument("--source", help="Filtruj po źródle (np. SPEC_UI_UX)")
    ap.add_argument("--json", action="store_true", help="Wyjście JSON")
    args = ap.parse_args()

    query = " ".join(args.query)
    chunks, idx = load()
    scores = bm25(query, idx)
    
    ranked = sorted(enumerate(scores), key=lambda x: x[1], reverse=True)
    results = []
    for i, score in ranked:
        if score <= 0:
            continue
        chunk = chunks[i]
        if args.source and chunk["source"] != args.source:
            continue
        results.append({**chunk, "score": round(score, 4)})
        if len(results) >= args.k:
            break

    if args.json:
        print(json.dumps(results, ensure_ascii=False, indent=2))
    else:
        print(f"\n🔍 Query: {query}")
        print(f"📊 Wyników: {len(results)} (top {args.k})\n")
        for r in results:
            print(f"{'─'*80}")
            print(f"📄 [{r['source']}]  Score: {r['score']}")
            print(f"📍 {r['section'][:100]}")
            print()
            preview = r["text"][:500].strip()
            print(preview + ("..." if len(r["text"]) > 500 else ""))
            print()

if __name__ == "__main__":
    main()
