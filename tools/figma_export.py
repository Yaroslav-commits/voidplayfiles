"""
Выгрузка всех картинок Void Play из Figma в assets/img/ — одной командой.

1. Figma → аватарка → Settings → Security → Personal access tokens → Generate new token
   (права: File content — Read only). Скопируй токен.
2. Запусти из корня проекта:
       python tools/figma_export.py <ТОКЕН>
   или  FIGMA_TOKEN=<ТОКЕН> python tools/figma_export.py
3. Закоммить assets/img/ и запушь.

Нужен только Python 3.9+, без библиотек. Использует официальный Figma REST API.
"""
from __future__ import annotations

import json
import os
import re
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path

FILE_KEY = "6UMCDoHAmhPTvE6fDQoLl1"
OUT = Path(__file__).resolve().parent.parent / "assets" / "img"
API = "https://api.figma.com/v1"

# Рендер узлов (PNG 2x): путь → id слоя в Figma
NODES_PNG = {
    "logo.png": "247:35114",             # load → НЛО
    "games/mines.png": "247:35184",      # main → карточки игр
    "games/lottery.png": "247:35212",
    "games/cases.png": "247:35231",
    "games/crash.png": "247:35252",
    "games/upgrade.png": "247:35279",
    "games/waterball.png": "247:35303",
    "games/ball.png": "247:35329",
    "games/hockey.png": "247:35347",
    "promo-art.png": "247:35387",        # main → promocode → Mask group
    # NFT-подарки (компоненты Default xxx)
    "nft/gift-120.png": "247:35138",
    "nft/gift-127.png": "247:37605",
    "nft/gift-128.png": "247:37606",
    "nft/gift-129.png": "247:37607",
    "nft/gift-047.png": "247:35248",
    "nft/gift-132.png": "247:35249",
    "nft/gift-103.png": "247:35251",
    "nft/gift-126.png": "247:43579",
    "nft/gift-004.png": "247:41187",
    "nft/gift-020.png": "247:41366",
    "nft/gift-065.png": "247:41374",
    "nft/gift-023.png": "247:41382",
    "nft/gift-090.png": "247:41390",
    "nft/gift-074.png": "247:41398",
    # иконки уровней рефералки
    "levels/current.png": "247:41187",
    "levels/1.png": "247:41366",
    "levels/2.png": "247:41374",
    "levels/3.png": "247:41382",
    "levels/4.png": "247:41390",
    "levels/5.png": "247:41398",
    "levels/6.png": "247:41406",
}

# Векторы в SVG
NODES_SVG = {
    "bg-pattern.svg": "247:35104",       # дудл-паттерн фона
}

# Исходные картинки-заливки (по началу хэша) — без поворотов и прозрачности
IMAGE_FILLS = {
    "deco/calendar.png": "a787dc67",
    "deco/bear.png": "5ed82493",
    "deco/deco-0259.png": "20bb0060",
    "deco/deco-0543.png": "4f274054",
    "deco/deco-0251.png": "dc1fc7cd",
    "deco/deco-0249.png": "90deed21",
    "deco/deco-0246.png": "bb4e216b",
    "deco/deco-0311.png": "4fa73495",
    "deco/star-char.png": "606b49",
    "nft/pepe.png": "eafd34",
}

# Масштаб рендера: маленькие иконки подарков рендерим крупнее, чтобы не мылились
SCALE = {"nft/gift-126.png": 0.5}  # этот компонент и так 512×512
BIG = ("nft/", "levels/")          # остальные подарки и уровни — 4x

SUB_MODAL = "247:45889"                  # Frame 523 — модалка «Забирай 15 Stars»


def req(url: str, token: str | None = None, tries: int = 4) -> bytes:
    for i in range(tries):
        try:
            r = urllib.request.Request(url, headers={"X-Figma-Token": token} if token else {})
            with urllib.request.urlopen(r, timeout=120) as resp:
                return resp.read()
        except urllib.error.HTTPError as e:
            if e.code == 429 and i < tries - 1:
                wait = int(e.headers.get("Retry-After", "20"))
                print(f"  лимит Figma, жду {wait} c…")
                time.sleep(wait)
                continue
            if e.code == 403:
                sys.exit("Figma ответила 403: неверный токен или нет доступа к файлу")
            raise
        except urllib.error.URLError:
            if i == tries - 1:
                raise
            time.sleep(3)
    raise RuntimeError("unreachable")


def api(path: str, token: str) -> dict:
    return json.loads(req(f"{API}{path}", token))


def save(rel: str, data: bytes):
    p = OUT / rel
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_bytes(data)
    print(f"  ✓ {rel} ({len(data) // 1024} КБ)")


def render(nodes: dict, token: str, fmt: str, scale: float = 2):
    ids = sorted(set(nodes.values()))
    urls: dict = {}
    for i in range(0, len(ids), 10):
        chunk = ids[i:i + 10]
        q = f"/images/{FILE_KEY}?ids={','.join(chunk)}&format={fmt}" + (f"&scale={scale}" if fmt == "png" else "")
        urls.update(api(q, token).get("images", {}))
    for rel, nid in nodes.items():
        u = urls.get(nid)
        if not u:
            print(f"  ✗ {rel}: Figma не отрендерила {nid}")
            continue
        data = req(u)
        if fmt == "svg":
            # прозрачность задаём в CSS — убираем её из файла
            data = re.sub(rb'\s(fill-|stroke-)?opacity="[^"]*"', b"", data)
        save(rel, data)


def image_fills(token: str):
    refs = api(f"/files/{FILE_KEY}/images", token).get("meta", {}).get("images", {})
    for rel, prefix in IMAGE_FILLS.items():
        ref = next((k for k in refs if k.startswith(prefix)), None)
        if not ref:
            print(f"  ✗ {rel}: картинка {prefix}… не найдена в файле")
            continue
        save(rel, req(refs[ref]))


def sub_hero(token: str):
    """Ищем верхнюю картинку в модалке подписки и рендерим её отдельно."""
    doc = api(f"/files/{FILE_KEY}/nodes?ids={SUB_MODAL}&depth=4", token)["nodes"][SUB_MODAL]["document"]
    box = doc["absoluteBoundingBox"]
    best = None

    def walk(n):
        nonlocal best
        b = n.get("absoluteBoundingBox")
        if b and n.get("type") not in ("TEXT",) and n["id"] != doc["id"]:
            top = (b["y"] - box["y"]) / box["height"]
            if top < 0.4 and b["width"] >= box["width"] * 0.6 and 60 <= b["height"] <= box["height"] * 0.45:
                area = b["width"] * b["height"]
                if not best or area > best[0]:
                    best = (area, n["id"], n.get("name"))
        for c in n.get("children", []):
            walk(c)

    walk(doc)
    if best:
        print(f"  картинка модалки: «{best[2]}»")
        render({"sub-hero.png": best[1]}, token, "png")
    else:
        print("  ✗ картинку модалки подписки не нашёл — останется CSS-версия")


def main():
    token = (sys.argv[1] if len(sys.argv) > 1 else os.getenv("FIGMA_TOKEN", "")).strip()
    if not token:
        sys.exit(__doc__)
    OUT.mkdir(parents=True, exist_ok=True)
    print("Рендер слоёв (PNG)…")
    groups: dict = {}
    for rel, nid in NODES_PNG.items():
        sc = SCALE.get(rel, 4 if rel.startswith(BIG) else 2)
        groups.setdefault(sc, {})[rel] = nid
    for sc, nodes in groups.items():
        render(nodes, token, "png", sc)
    print("Векторы (SVG)…")
    render(NODES_SVG, token, "svg")
    print("Исходные картинки…")
    image_fills(token)
    print("Модалка подписки…")
    try:
        sub_hero(token)
    except Exception as e:  # noqa: BLE001
        print(f"  ✗ {e}")
    print(f"\nГотово → {OUT}")


if __name__ == "__main__":
    main()
