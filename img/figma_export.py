r"""
Скачивает картинки Void Play из Figma в папку img сайта.

КАК ЗАПУСТИТЬ (Windows):
  1. Положи этот файл в папку сайта (рядом с index.html) или в папку img — без разницы.
  2. Дважды кликни по нему. Откроется чёрное окно и попросит токен Figma —
     вставь его (правой кнопкой мыши) и нажми Enter.
  3. Жди надпись «Готово». Уже скачанные картинки он пропускает,
     при обрыве интернета просто запусти ещё раз.
  4. После этого файл можно удалить (и .figma_cache.json рядом с index.html тоже).

Если двойной клик открывает файл в редакторе (PyCharm и т.п.):
  в проводнике кликни в адресную строку, напиши  cmd  и нажми Enter,
  в чёрном окне напиши  py figma_export.py  и нажми Enter
  (если файл лежит в img — сначала  cd img ).
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
HERE = Path(__file__).resolve().parent
# папка сайта: где лежит index.html (скрипт может лежать и в самой папке img)
if HERE.name.lower() == "img":
    SITE = HERE.parent
elif (HERE / "index.html").exists():
    SITE = HERE
elif (Path.cwd() / "index.html").exists():
    SITE = Path.cwd()
else:
    SITE = HERE
OUT = SITE / "img"
API = "https://api.figma.com/v1"

# Рендер узлов (PNG 2x): путь → id слоя в Figma
NODES_PNG = {
    "game-mines.png": "247:35184",      # main → карточки игр
    "game-lottery.png": "247:35212",
    "game-cases.png": "247:35231",
    "game-crash.png": "247:35252",
    "game-upgrade.png": "247:35279",
    "game-waterball.png": "247:35303",
    "game-ball.png": "247:35329",
    "game-hockey.png": "247:35347",
    "promo-art.png": "247:35387",        # main → promocode → Mask group
    # NFT-подарки (компоненты Default xxx)
    "gift-120.png": "247:35138",
    "gift-127.png": "247:37605",
    "gift-128.png": "247:37606",
    "gift-129.png": "247:37607",
    "gift-047.png": "247:35248",
    "gift-132.png": "247:35249",
    "gift-103.png": "247:35251",
    "gift-126.png": "247:43579",
    "gift-004.png": "247:41187",
    "gift-020.png": "247:41366",
    "gift-065.png": "247:41374",
    "gift-023.png": "247:41382",
    "gift-090.png": "247:41390",
    "gift-074.png": "247:41398",
}

# Исходные картинки-заливки (по началу хэша) — без поворотов и прозрачности
IMAGE_FILLS = {
    "calendar.png": "a787dc67",
    "bear.png": "5ed82493",
    "deco-0259.png": "20bb0060",
    "deco-0543.png": "4f274054",
    "deco-0251.png": "dc1fc7cd",
    "deco-0249.png": "90deed21",
    "deco-0246.png": "bb4e216b",
    "deco-0311.png": "4fa73495",
    "star-char.png": "606b49",
    "pepe.png": "eafd34",
}

SUB_MODAL = "247:45889"                  # Frame 523 — модалка «Забирай 15 Stars»


CACHE = SITE / ".figma_cache.json"


def _load_cache() -> dict:
    try:
        return json.loads(CACHE.read_text(encoding="utf-8"))
    except (OSError, ValueError):
        return {}


def api(path: str, token: str) -> dict:
    """Запрос к Figma API. Ответ сохраняется в .figma_cache.json — повторный запуск
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
    if p.with_suffix(".webp").exists():
        p = p.with_suffix(".webp")
    if p.exists() and p.stat().st_size > 0:
        print(f"  · {rel} уже есть, пропускаю")
        return True
    return False


def render(nodes: dict, token: str, fmt: str, scale: float = 2):
    if all((OUT / rel).exists() or (OUT / rel).with_suffix(".webp").exists() for rel in nodes):
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
    print(f"Папка сайта: {SITE}\nКартинки будут в: {OUT}\n")
    if not (SITE / "index.html").exists():
        print("⚠ Рядом нет index.html — положи этот файл в папку сайта или в папку img.\n")
    while not token:
        token = input("Вставь токен Figma (начинается с figd_) и нажми Enter: ").strip().strip('"')
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
    print(f"\n✅ Готово! Картинки в папке: {OUT}")
    print("Теперь закинь папку img на GitHub (git add img → git commit → git push).")


if __name__ == "__main__":
    try:
        main()
    except SystemExit as e:
        if e.code not in (None, 0):
            print(e.code)
    except KeyboardInterrupt:
        print("\nОстановлено.")
    except Exception as e:  # noqa: BLE001
        print(f"\n❌ Ошибка: {e}\nЗапусти ещё раз — уже скачанное не потеряется.")
    input("\nНажми Enter, чтобы закрыть окно…")