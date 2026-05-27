"""
validate_integrity.py
=====================
Phase 2: Kiem tra tinh toan ven du lieu (Referential Integrity)
truoc khi thuc hien bat ky thao tac import nao vao MongoDB.

Kiem tra:
  1. Tat ca shop_id trong drinks.json co ton tai trong shops.json khong?
  2. Tat ca shop_id trong reviews.json co ton tai trong shops.json khong?
  3. Moi shop document co cac truong bat buoc khong?
  4. Khong co slug trung lap trong shops.json?

Ket qua tra ve:
  - Exit 0: du lieu hop le, san sang import
  - Exit 1: co loi, KHONG duoc phep chay import_data.py

Chay tu thu muc server/:
    python scripts/data_import/validate_integrity.py
"""

import json
import sys
from collections import Counter
from pathlib import Path

# Fix cp1252 UnicodeEncodeError on Windows PowerShell
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
    sys.stderr.reconfigure(encoding='utf-8', errors='replace')

# ── Paths ─────────────────────────────────────────────────────────────────────
_SERVER = Path(__file__).resolve().parents[2]   # server/
DATA_DIR = _SERVER / "src" / "app" / "data"

SHOPS_JSON   = DATA_DIR / "shops.json"
DRINKS_JSON  = DATA_DIR / "drinks.json"
REVIEWS_JSON = DATA_DIR / "reviews.json"

# Truong bat buoc toi thieu cho moi collection
REQUIRED_SHOP_FIELDS   = {"id", "name", "slug", "address", "location"}
REQUIRED_DRINK_FIELDS  = {"name", "shop_id", "price"}
REQUIRED_REVIEW_FIELDS = {"shop_id", "rating", "comment"}


# ── Helpers ───────────────────────────────────────────────────────────────────

def load(path: Path) -> list[dict]:
    if not path.exists():
        print(f"  [MISSING FILE] {path}")
        sys.exit(1)
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def section(title: str) -> None:
    print(f"\n{'='*60}")
    print(f"  {title}")
    print(f"{'='*60}")


def check_required_fields(
    docs: list[dict],
    required: set[str],
    label: str,
) -> list[str]:
    """Tra ve danh sach loi thieu truong bat buoc."""
    errors = []
    for i, doc in enumerate(docs):
        missing = required - doc.keys()
        if missing:
            name = doc.get("name", doc.get("id", f"index={i}"))
            errors.append(f"  [{label}] '{name}' missing fields: {missing}")
    return errors


def check_referential_integrity(
    child_docs: list[dict],
    parent_ids: set[str],
    child_label: str,
) -> list[str]:
    """Kiem tra moi shop_id trong child_docs ton tai trong parent_ids."""
    errors = []
    for doc in child_docs:
        sid = doc.get("shop_id", "")
        if sid not in parent_ids:
            name = doc.get("name", "(no name)")
            errors.append(
                f"  [{child_label}] '{name}' -> shop_id='{sid}' NOT FOUND in shops.json"
            )
    return errors


# ── Main ──────────────────────────────────────────────────────────────────────

def validate() -> bool:
    """
    Chay tat ca cac kiem tra. Tra ve True neu hop le, False neu co loi.
    """
    all_errors: list[str] = []
    all_warnings: list[str] = []

    # ── 1. Doc du lieu ────────────────────────────────────────────────────────
    section("Buoc 1/4: Doc file du lieu")
    shops   = load(SHOPS_JSON)
    drinks  = load(DRINKS_JSON)
    reviews = load(REVIEWS_JSON)

    print(f"  shops.json   : {len(shops):>5} documents")
    print(f"  drinks.json  : {len(drinks):>5} documents")
    print(f"  reviews.json : {len(reviews):>5} documents")

    # ── 2. Kiem tra truong bat buoc ───────────────────────────────────────────
    section("Buoc 2/4: Kiem tra truong bat buoc")

    shop_errors = check_required_fields(shops,   REQUIRED_SHOP_FIELDS,   "shops")
    drink_errors = check_required_fields(drinks,  REQUIRED_DRINK_FIELDS,  "drinks")
    review_errors = check_required_fields(reviews, REQUIRED_REVIEW_FIELDS, "reviews")

    for err in shop_errors + drink_errors + review_errors:
        print(f"  [FAIL] {err}")
        all_errors.append(err)

    if not (shop_errors + drink_errors + review_errors):
        print("  [OK] Tat ca truong bat buoc hien dien day du.")

    # ── 3. Kiem tra referential integrity (shop_id) ───────────────────────────
    section("Buoc 3/4: Kiem tra Referential Integrity (shop_id)")

    # Lay tap hop tat ca shop id hop le
    shop_ids: set[str] = set()
    for s in shops:
        sid = s.get("id", "")
        if sid:
            shop_ids.add(sid)

    print(f"  shop_ids hop le: {len(shop_ids)}")

    drink_ref_errors  = check_referential_integrity(drinks,  shop_ids, "drinks -> shops")
    review_ref_errors = check_referential_integrity(reviews, shop_ids, "reviews -> shops")

    orphan_drinks  = len(drink_ref_errors)
    orphan_reviews = len(review_ref_errors)

    if drink_ref_errors:
        print(f"\n  [FAIL] {orphan_drinks} drinks co shop_id khong hop le (sample):")
        for e in drink_ref_errors[:5]:
            print(e)
        if orphan_drinks > 5:
            print(f"  ... va {orphan_drinks - 5} loi khac")
        all_errors.extend(drink_ref_errors)
    else:
        print("  [OK] Tat ca drinks.shop_id deu khop voi shops.id")

    if review_ref_errors:
        print(f"\n  [FAIL] {orphan_reviews} reviews co shop_id khong hop le (sample):")
        for e in review_ref_errors[:5]:
            print(e)
        if orphan_reviews > 5:
            print(f"  ... va {orphan_reviews - 5} loi khac")
        all_errors.extend(review_ref_errors)
    else:
        print("  [OK] Tat ca reviews.shop_id deu khop voi shops.id")

    # ── 4. Kiem tra trung lap ─────────────────────────────────────────────────
    section("Buoc 4/4: Kiem tra trung lap (duplicates)")

    # Slug trung lap
    slug_counts = Counter(s.get("slug", "") for s in shops)
    dup_slugs = {k: v for k, v in slug_counts.items() if v > 1 and k}
    if dup_slugs:
        for slug, count in dup_slugs.items():
            msg = f"  slug '{slug}' xuat hien {count} lan"
            print(f"  [WARN] {msg}")
            all_warnings.append(msg)
    else:
        print("  [OK] Khong co slug trung lap")

    # Shop id trung lap
    shop_id_counts = Counter(s.get("id", "") for s in shops)
    dup_ids = {k: v for k, v in shop_id_counts.items() if v > 1 and k}
    if dup_ids:
        for sid, count in dup_ids.items():
            msg = f"  shop id '{sid}' xuat hien {count} lan"
            print(f"  [FAIL] {msg}")
            all_errors.append(msg)
    else:
        print("  [OK] Khong co shop id trung lap")

    # ── Ket qua tong hop ──────────────────────────────────────────────────────
    section("KET QUA KIEM TRA")
    print(f"  Tong so loi (FAIL)  : {len(all_errors)}")
    print(f"  Tong so canh bao    : {len(all_warnings)}")

    if all_errors:
        print("\n  [STOP] Du lieu KHONG hop le.")
        print("  Hay sua cac loi tren truoc khi chay import_data.py!")
        return False
    else:
        print("\n  [PASS] Du lieu hop le. San sang chay Phase 3: import_data.py")
        return True


if __name__ == "__main__":
    ok = validate()
    sys.exit(0 if ok else 1)
