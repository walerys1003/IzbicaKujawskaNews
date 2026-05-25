#!/usr/bin/env python3
"""
RAG / Knowledge Base Builder for izbica24.pl project.

Strategia:
  1. Chunking — semantyczny: po sekcjach (## i ###), z overlap.
  2. Metadane: source, section_path, headings, char_range.
  3. Indeks: TF-IDF + BM25 (offline, deterministyczny).
  4. Eksport: JSON (chunks.json) + index (bm25.json) gotowe do RAG-retrieve.

Wynik: knowledge_base/index/ + retrieve.py CLI.
"""
import json, re, math, os
from pathlib import Path
from collections import Counter, defaultdict

DOCS = Path("/home/user/webapp/knowledge_base/docs")
OUT  = Path("/home/user/webapp/knowledge_base/index")
OUT.mkdir(parents=True, exist_ok=True)

# Polish stop-words (ograniczone — pełna lista nie jest potrzebna dla BM25)
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

def chunk_markdown(md: str, source: str, max_chars=2200, overlap=250):
    """
    Chunking po nagłówkach (#, ##, ###), łączymy aż osiągniemy max_chars.
    Każdy chunk dostaje 'breadcrumbs' z hierarchii nagłówków.
    """
    lines = md.split("\n")
    chunks = []
    cur_head = {1: "", 2: "", 3: "", 4: ""}
    sections = []  # (heading_path, content)
    buf = []
    head_path = ""
    
    def flush(reason=""):
        nonlocal buf, head_path
        if buf:
            txt = "\n".join(buf).strip()
            if txt:
                sections.append((head_path, txt))
            buf = []
    
    for line in lines:
        m = re.match(r"^(#{1,4})\s+(.*)$", line)
        if m:
            flush("new-heading")
            level = len(m.group(1))
            title = m.group(2).strip()
            cur_head[level] = title
            for k in range(level+1, 5):
                cur_head[k] = ""
            head_path = " > ".join(filter(None, [cur_head[1], cur_head[2], cur_head[3], cur_head[4]]))
            buf.append(line)
        else:
            buf.append(line)
    flush("eof")
    
    # Merge small sections; split big ones with overlap
    for head, content in sections:
        if len(content) <= max_chars:
            chunks.append({"source": source, "section": head, "text": content})
        else:
            # podziel po akapitach
            paras = re.split(r"\n\s*\n", content)
            cur = ""
            for p in paras:
                if len(cur) + len(p) + 2 <= max_chars:
                    cur = (cur + "\n\n" + p) if cur else p
                else:
                    if cur:
                        chunks.append({"source": source, "section": head, "text": cur})
                    if len(p) > max_chars:
                        # twardo podziel po znakach
                        for i in range(0, len(p), max_chars - overlap):
                            chunks.append({"source": source, "section": head, "text": p[i:i+max_chars]})
                        cur = ""
                    else:
                        cur = p
            if cur:
                chunks.append({"source": source, "section": head, "text": cur})
    
    return chunks

# --- 1. Wczytaj wszystkie dokumenty i tworzymy chunki ---
all_chunks = []
manifest_path = Path("/home/user/webapp/knowledge_base/manifest.json")
manifest = json.loads(manifest_path.read_text()) if manifest_path.exists() else []

# Friendly aliasy dla źródeł
ALIAS = {
    "01-struktura-kategorii.md": "STRUKTURA_KATEGORII",
    "02-koncepcja-szaty-graficznej.md": "SZATA_GRAFICZNA",
    "03-specyfikacja-ui-ux.md": "SPEC_UI_UX",
    "04-workflow-portalu.md": "WORKFLOW_PORTALU",
    "05-sesja-n1-wtyczka-newsroom.md": "SESJA_N1_WTYCZKA",
    "06-sesja-n2-newsroom-queue.md": "SESJA_N2_QUEUE",
    "07-sesja-n3-publishpress.md": "SESJA_N3_PUBLISHPRESS",
    "08-sesja-n4-prompt-templates.md": "SESJA_N4_PROMPTS",
    "09-sesja-n5-n8n-import.md": "SESJA_N5_N8N",
    "10-sesja-n6-monitoring.md": "SESJA_N6_MONITORING",
}

for md_file in sorted(DOCS.glob("*.md")):
    source = ALIAS.get(md_file.name, md_file.stem)
    md = md_file.read_text(encoding="utf-8")
    cs = chunk_markdown(md, source)
    for i, c in enumerate(cs):
        c["chunk_id"] = f"{source}#{i:03d}"
        c["chars"] = len(c["text"])
        all_chunks.append(c)
    print(f"{source}: {len(cs)} chunks")

print(f"\nTotal chunks: {len(all_chunks)}, avg size: {sum(c['chars'] for c in all_chunks)//len(all_chunks)} chars")

# --- 2. BM25 index ---
# tokeny per chunk
tokens_per_chunk = [tokenize(c["text"] + " " + c["section"]) for c in all_chunks]
N = len(all_chunks)
avgdl = sum(len(t) for t in tokens_per_chunk) / N

# DF: document frequency
df = Counter()
for toks in tokens_per_chunk:
    for t in set(toks):
        df[t] += 1

# IDF
idf = {t: math.log((N - n + 0.5) / (n + 0.5) + 1) for t, n in df.items()}

# Term frequencies per chunk
tf_per_chunk = [Counter(toks) for toks in tokens_per_chunk]

# Zapisz indeks
index = {
    "N": N,
    "avgdl": avgdl,
    "idf": idf,
    "doc_lens": [len(t) for t in tokens_per_chunk],
    "tf": [dict(c) for c in tf_per_chunk],
    "chunks_meta": [{"chunk_id": c["chunk_id"], "source": c["source"], "section": c["section"], "chars": c["chars"]} for c in all_chunks],
}

(OUT / "chunks.json").write_text(json.dumps(all_chunks, ensure_ascii=False, indent=1), encoding="utf-8")
(OUT / "bm25_index.json").write_text(json.dumps(index, ensure_ascii=False), encoding="utf-8")

# --- 3. Statystyki ---
stats = {
    "total_chunks": N,
    "total_chars": sum(c["chars"] for c in all_chunks),
    "total_tokens_est": sum(c["chars"] for c in all_chunks) // 4,
    "vocab_size": len(idf),
    "sources": {},
}
for c in all_chunks:
    stats["sources"].setdefault(c["source"], {"chunks": 0, "chars": 0})
    stats["sources"][c["source"]]["chunks"] += 1
    stats["sources"][c["source"]]["chars"] += c["chars"]

(OUT / "stats.json").write_text(json.dumps(stats, ensure_ascii=False, indent=2), encoding="utf-8")
print(f"\nVocabulary size: {len(idf):,} unique terms")
print(f"Index saved to: {OUT}")
print(f"  - chunks.json   ({(OUT/'chunks.json').stat().st_size:,} bytes)")
print(f"  - bm25_index.json ({(OUT/'bm25_index.json').stat().st_size:,} bytes)")
