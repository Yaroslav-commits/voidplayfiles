r"""
Выгрузка всех картинок Void Play из Figma в assets/img/ — одной командой.

1. Figma → аватарка → Settings → Security → Personal access tokens → Generate new token
   (права: File content — Read only). Скопируй токен.
2. Открой терминал в папке сайта (где лежит index.html) и запусти:
       python tools/figma_export.py figd_ТВОЙ_ТОКЕН
   Windows:
       py tools\figma_export.py figd_ТВОЙ_ТОКЕН
   Если интернет оборвётся — просто запусти ещё раз, скачанное не потеряется.
3. Закоммить assets/img/ и запушь.

Нужен только Python 3.9+, без библиотек. Использует официальный Figma REST API.
"""
from __future__ import annotations

import http.client
import json
import os
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

SUB_MODAL = "247:45889"                  # Frame 523 — модалка «Забирай 15 Stars»


CACHE = Path(__file__).resolve().parent / ".figma_cache.json"


def _load_cache() -> dict:
    try:
        return json.loads(CACHE.read_text(encoding="utf-8"))
    except (OSError, ValueError):
        return {}


def api(path: str, token: str) -> dict:
    """Запрос к Figma API. Ответ сохраняется в tools/.figma_cache.json — повторный запуск
    не тратит лимит запросов (на бесплатном плане их ~20 в месяц)."""
    cache = _load_cache()
    if path in cache:
        return cache[path]
    for i in range(6):
        try:
            r = urllib.request.Request(f"{API}{path}", headers={"X-Figma-Token": token})
            with urllib.request.urlopen(r, timeout=300) as resp:
                data = json.loads(resp.read())
            cache[path] = data
            CACHE.write_text(json.dumps(cache), encoding="utf-8")
            return data
        except urllib.error.HTTPError as e:
            if e.code == 429:
                wait = int(e.headers.get("Retry-After", "20") or 20)
                if wait > 120 or i == 5:
                    sys.exit("\n❌ Figma не даёт больше запросов: на бесплатном плане лимит API ~20 запросов в месяц.\n"
                             "Экспортируй картинки вручную (см. README, раздел «Картинки из Figma») и кинь zip в чат.\n")
                print(f"  лимит Figma, жду {wait} c…")
                time.sleep(wait)
                continue
            if e.code in (401, 403):
                sys.exit("\n❌ Figma ответила 403: неверный токен или нет доступа к файлу.\n")
            raise
        except (urllib.error.URLError, http.client.HTTPException, OSError) as e:
            print(f"  связь с Figma оборвалась ({type(e).__name__}), пробую ещё раз…")
            time.sleep(5)
    sys.exit("\n❌ Нет связи с Figma. Проверь интернет и запусти ещё раз — уже скачанное не потеряется.\n")


def download(url: str, rel: str, post=None):
    """Скачивание с докачкой: файл качается кусками, при обрыве продолжает с места остановки."""
    dest = OUT / rel
    dest.parent.mkdir(parents=True, exist_ok=True)
    part = dest.with_name(dest.name + ".part")
    fails = 0
    while True:
        have = part.stat().st_size if part.exists() else 0
        headers = {"Range": f"bytes={have}-"} if have else {}
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers=headers), timeout=60) as resp:
                if have and resp.status != 206:      # сервер не умеет докачку — начинаем заново
                    have = 0
                    part.unlink(missing_ok=True)
                total = have + int(resp.headers.get("Content-Length") or 0)
                with open(part, "ab") as f:
                    while True:
                        chunk = resp.read(64 * 1024)
                        if not chunk:
                            break
                        f.write(chunk)
                        fails = 0
            size = part.stat().st_size
            if total and size < total:
                raise http.client.IncompleteRead(b"", total - size)
            break
        except urllib.error.HTTPError as e:
            if e.code == 416:                         # уже всё скачано
                break
            if e.code in (403, 404):
                CACHE.unlink(missing_ok=True)
                sys.exit("\n❌ Ссылка на картинку устарела. Запусти команду ещё раз.\n")
            fails += 1
        except (urllib.error.URLError, http.client.HTTPException, OSError):
            fails += 1
        if fails > 25:
            sys.exit(f"\n❌ Не получается скачать {rel}: интернет обрывается. Запусти ещё раз позже — скачанное сохранится.\n")
        kb = part.stat().st_size // 1024 if part.exists() else 0
        print(f"  … {rel}: связь оборвалась, докачиваю (уже {kb} КБ)")
        time.sleep(min(2 + fails, 10))
    data = part.read_bytes()
    if post:
        data = post(data)
    dest.write_bytes(data)
    part.unlink(missing_ok=True)
    print(f"  ✓ {rel} ({len(data) // 1024} КБ)")


def done(rel: str) -> bool:
    p = OUT / rel
    if p.exists() and p.stat().st_size > 0:
        print(f"  · {rel} уже есть, пропускаю")
        return True
    return False


def render(nodes: dict, token: str, fmt: str, scale: float = 2):
    if all((OUT / rel).exists() for rel in nodes):
        for rel in nodes:
            done(rel)
        return
    ids = sorted(set(nodes.values()))
    urls: dict = {}
    for i in range(0, len(ids), 50):
        chunk = ids[i:i + 50]
        q = f"/images/{FILE_KEY}?ids={','.join(chunk)}&format={fmt}" + (f"&scale={scale}" if fmt == "png" else "")
        urls.update(api(q, token).get("images", {}))
    for rel, nid in nodes.items():
        if done(rel):
            continue
        u = urls.get(nid)
        if not u:
            print(f"  ✗ {rel}: Figma не отрендерила {nid}")
            continue
        download(u, rel)


def image_fills(token: str):
    refs = api(f"/files/{FILE_KEY}/images", token).get("meta", {}).get("images", {})
    for rel, prefix in IMAGE_FILLS.items():
        if done(rel):
            continue
        ref = next((k for k in refs if k.startswith(prefix)), None)
        if not ref:
            print(f"  ✗ {rel}: картинка {prefix}… не найдена в файле")
            continue
        download(refs[ref], rel)


def sub_hero(token: str):
    """Ищем верхнюю картинку в модалке подписки и рендерим её отдельно."""
    if done("sub-hero.png"):
        return
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
        sys.exit("\n❌ Не передан токен Figma.\n\nЗапусти так (токен начинается с figd_):\n"
                 "  python tools/figma_export.py figd_ТВОЙ_ТОКЕН\n"
                 "На Windows:\n  py tools\\figma_export.py figd_ТВОЙ_ТОКЕН\n")
    if not token.startswith("figd_"):
        print("⚠ Токен обычно начинается с figd_ — проверь, что скопировал его целиком.")
    OUT.mkdir(parents=True, exist_ok=True)
    print("Рендер слоёв (PNG 3x)…")
    render(NODES_PNG, token, "png", 3)
    print("Исходные картинки…")
    image_fills(token)
    print("Модалка подписки…")
    try:
        sub_hero(token)
    except Exception as e:  # noqa: BLE001
        print(f"  ✗ {e}")
    print(f"\nГотово → {OUT}\nТеперь: git add assets/img  →  git commit -m \"Картинки из Figma\"  →  git push")


if __name__ == "__main__":
    main()
