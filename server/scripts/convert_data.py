"""
convert_data.py
===============
Converts the raw GeoJSON export from OpenStreetMap into three clean JSON files
that the seed.py script can load directly into MongoDB:

    src/app/data/shops.json   — shop documents with a stable string `id`
    src/app/data/drinks.json  — drinks linked by `shop_id` (not shop_name)
    src/app/data/reviews.json — reviews linked by `shop_id` (not shop_name)

Run from the `server/` directory:
    python scripts/convert_data.py
"""

import json
import uuid
import re
import os


# ── Vietnamese slug helper ────────────────────────────────────────────────────

def create_slug(text: str) -> str:
    replacements = [
        (r'[àáạảãâầấậẩẫăằắặẳẵ]', 'a'),
        (r'[èéẹẻẽêềếệểễ]',         'e'),
        (r'[ìíịỉĩ]',               'i'),
        (r'[òóọỏõôồốộổỗơờớợởỡ]',   'o'),
        (r'[ùúụủũưừứựửữ]',         'u'),
        (r'[ỳýỵỷỹ]',               'y'),
        (r'đ',                      'd'),
    ]
    text = text.lower()
    for pattern, replacement in replacements:
        text = re.sub(pattern, replacement, text)
    text = re.sub(r'[^a-z0-9\s-]', '', text)
    text = re.sub(r'[\s-]+', '-', text).strip('-')
    return text


# ── Stage 1: GeoJSON → shops.json ────────────────────────────────────────────

def convert_geojson_to_shops(input_path: str, output_path: str) -> list[dict]:
    """
    Parse a GeoJSON file and emit a clean shops list.
    Every shop gets a stable string `id` (UUID4) injected here so that
    convert_data.py and seed.py share the exact same IDs — the drinks/reviews
    JSON files reference these IDs via `shop_id`.
    Returns the list of shop dicts so the caller can immediately generate
    related documents without re-reading the file.
    """
    print(f"[1/3] Đang đọc file GeoJSON: {input_path} ...")
    try:
        with open(input_path, "r", encoding="utf-8") as f:
            data = json.load(f)
    except FileNotFoundError:
        print(f"❌ Lỗi: Không tìm thấy file '{input_path}'")
        return []

    features = data.get("features", [])
    if not features:
        print("⚠️  File GeoJSON không có dữ liệu (features rỗng).")
        return []

    shops: list[dict] = []
    for feature in features[:100]:          # Cap at 100 to stay under embedding rate limits
        props = feature.get("properties", {})
        geom  = feature.get("geometry", {})

        name = props.get("name", "").strip()
        if not name:
            continue

        street      = props.get("addr:street", "")
        housenumber = props.get("addr:housenumber", "")
        district    = props.get("addr:district", "") or props.get("addr:subdistrict", "")
        city        = props.get("addr:city", "") or props.get("addr:province", "") or "Hà Nội"

        parts = []
        if housenumber or street:
            parts.append(f"{housenumber} {street}".strip())
        if district:
            parts.append(district)
        if city:
            parts.append(city)

        address     = ", ".join(parts) if parts else "Địa chỉ chưa cập nhật"
        slug        = f"{create_slug(name)}-{str(uuid.uuid4())[:6]}"   # suffix prevents collision

        shop_doc = {
            # ── KEY FIX: inject a stable string `id` here ──────────────────
            # seed.py reads this field directly; drinks/reviews reference it
            # as `shop_id` so ragRepository can join on `shop_id`.
            "id":           str(uuid.uuid4()),
            # ───────────────────────────────────────────────────────────────
            "name":         name,
            "slug":         slug,
            "address":      address,
            "city":         city,
            "location":     geom,           # GeoJSON Point — kept as-is for $geoNear
            "category":     ["Cà phê"],
            "average_rating": 0.0,
            "total_reviews":  0,
            "is_active":    True,
            "description":  "Quán có không gian thư giãn, thích hợp để học tập và làm việc.",
            "cover_image":  "https://images.unsplash.com/photo-1554118811-1e0d58224f24",
            "tags":         ["chill", "wifi", "học bài"],
        }
        shops.append(shop_doc)

    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(shops, f, ensure_ascii=False, indent=2)
    print(f"   ✅ Đã trích xuất {len(shops)} quán → {output_path}")
    return shops


# ── Stage 2: shops list → drinks.json & reviews.json ─────────────────────────

def generate_drinks_and_reviews(
    shops: list[dict],
    drinks_path: str,
    reviews_path: str,
) -> None:
    """
    Generate mock drinks and reviews and link them by `shop_id` (the string
    UUID injected into each shop in Stage 1). This is what ragRepository
    queries on when it does db.drinks.find({"shop_id": {"$in": shop_ids}}).

    IMPORTANT: we use shop["id"] — NOT shop["name"] — as the foreign key.
    """
    drinks:  list[dict] = []
    reviews: list[dict] = []

    DRINK_TEMPLATES = [
        {
            "name":      "Cà Phê Trứng Bọt Khí",
            "price":     45000,
            "category":  "coffee",
            "image_url": "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd",
        },
        {
            "name":      "Trà Oolong Trái Cây",
            "price":     55000,
            "category":  "tea",
            "image_url": "https://images.unsplash.com/photo-1558857563-b371033873b8",
        },
    ]

    for shop in shops:
        shop_id   = shop["id"]      # ← the stable UUID, NOT shop["name"]
        shop_name = shop["name"]

        # 2 drinks per shop
        for tmpl in DRINK_TEMPLATES:
            drinks.append({
                **tmpl,
                # ── KEY FIX: link by shop_id, not shop_name ────────────────
                "shop_id":    shop_id,
                # ──────────────────────────────────────────────────────────
                "is_available": True,
            })

        # 1 review per shop
        reviews.append({
            "user_id":   "seed-user-001",
            "user_name": "DrinkMap Reviewer",
            # ── KEY FIX: link by shop_id, not shop_name ────────────────────
            "shop_id":   shop_id,
            # ──────────────────────────────────────────────────────────────
            "rating":    4.5,
            "ratings":   {"drink": 5, "service": 4, "ambiance": 5},
            "comment":   f"Trải nghiệm tuyệt vời tại {shop_name}! Không gian yên tĩnh, wifi khỏe.",
            "taste_tags": ["ngon", "chill"],
            "photos":    [],
        })

    with open(drinks_path, "w", encoding="utf-8") as f:
        json.dump(drinks, f, ensure_ascii=False, indent=2)
    print(f"   ✅ Đã tạo {len(drinks)} drinks → {drinks_path}")

    with open(reviews_path, "w", encoding="utf-8") as f:
        json.dump(reviews, f, ensure_ascii=False, indent=2)
    print(f"   ✅ Đã tạo {len(reviews)} reviews → {reviews_path}")


# ── Entrypoint ────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    # All paths are relative to the `server/` working directory.
    GEOJSON_INPUT = "connectMongo/export.geojson"
    DATA_DIR      = "src/app/data"

    print("=" * 60)
    print("  convert_data.py — DrinkMap Data Conversion Pipeline")
    print("=" * 60)

    shops = convert_geojson_to_shops(
        input_path  = GEOJSON_INPUT,
        output_path = f"{DATA_DIR}/shops.json",
    )

    if not shops:
        print("❌ Không có shop nào được tạo. Dừng.")
        raise SystemExit(1)

    print(f"\n[2/3] Đang tạo mock drinks & reviews...")
    generate_drinks_and_reviews(
        shops        = shops,
        drinks_path  = f"{DATA_DIR}/drinks.json",
        reviews_path = f"{DATA_DIR}/reviews.json",
    )

    print("\n[3/3] Hoàn tất!")
    print(f"      → Chạy tiếp: python scripts/seed.py")
    print("=" * 60)
