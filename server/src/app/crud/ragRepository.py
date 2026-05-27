import logging
import re
from app.core.ai_config import client, redis_client
from app.core.database import Database

logger = logging.getLogger("DrinkMapAPI")

class RAGRepository:
    @staticmethod
    def _normalize_query(query: str) -> str:
        if not query: return ""
        q = query.lower()
        q = re.sub(r'[^\w\s]', '', q)
        return re.sub(r'\s+', '-', q.strip())

    @staticmethod
    async def get_relevant_context(user_query: str, lat: float = None, lng: float = None) -> str:
        cache_key = f"drinkmap:rag:context:{RAGRepository._normalize_query(user_query)}"
        
        if redis_client:
            try:
                cached = await redis_client.get(cache_key)
                if cached:
                    logger.info(f"[CACHE HIT] {cache_key}")
                    return cached
            except Exception:
                pass  # Graceful Degradation

        try:
            db = Database.get_db()
        except Exception:
            return ""

        try:
            # ── 1. Geospatial search ($geoNear) if coordinates are available ──
            geo_shops = []
            if lat is not None and lng is not None:
                try:
                    geo_pipeline = [
                        {
                            "$geoNear": {
                                "near": {"type": "Point", "coordinates": [float(lng), float(lat)]},
                                "distanceField": "distance",
                                "maxDistance": 15000,  # 15km
                                "spherical": True
                            }
                        },
                        {
                            "$project": {
                                "_id": 1, "name": 1, "address": 1, "description": 1,
                                "cover_image": 1, "slug": 1, "location": 1,
                                "rating": 1, "tags": 1, "distance": 1
                            }
                        },
                        {"$limit": 5}
                    ]
                    geo_shops = await db.shops.aggregate(geo_pipeline).to_list(None)
                    print(f"DEBUG [RAG] GeoNear Search → tìm thấy {len(geo_shops)} shops", flush=True)
                except Exception as geo_err:
                    print(f"DEBUG [RAG] GeoNear Search FAILED: {geo_err}", flush=True)

            # ── 2. Vector search ──────────────────────────────────────────────
            # SDK mới: client.models.embed_content trả về EmbedContentResponse
            embedding_response = client.models.embed_content(
                model="models/gemini-embedding-2",
                contents=user_query,
            )
            query_vector = embedding_response.embeddings[0].values

            vector_pipeline = [
                {
                    "$vectorSearch": {
                        "index": "vector_index",
                        "path": "embedding",
                        "queryVector": query_vector,
                        "numCandidates": 100,
                        "limit": 5
                    }
                },
                {
                    "$project": {
                        "_id": 1,
                        "name": 1,
                        "address": 1,
                        "description": 1,
                        "cover_image": 1,
                        "slug": 1,
                        "location": 1,
                        "rating": 1,
                        "tags": 1,
                        "score": {"$meta": "vectorSearchScore"}
                    }
                }
            ]
            
            try:
                shops = await db.shops.aggregate(vector_pipeline).to_list(None)
                print(f"DEBUG [RAG] Vector Search → tìm thấy {len(shops)} shops", flush=True)
            except Exception as vector_err:
                logger.warning(f"Vector search failed: {vector_err}. Fallback to rating sort.")
                print(f"DEBUG [RAG] Vector Search FAILED: {vector_err}", flush=True)
                shops = []

            # ── 3. Parallel text/location search ──────────────────────────────
            # Trích địa danh từ query: bắt mọi từ >= 3 ký tự có thể là địa điểm
            location_hits: list[dict] = []
            try:
                text_pipeline = [
                    {
                        "$match": {
                            "$or": [
                                {"name":    {"$regex": user_query, "$options": "i"}},
                                {"address": {"$regex": user_query, "$options": "i"}},
                                {"tags":    {"$regex": user_query, "$options": "i"}},
                            ]
                        }
                    },
                    {
                        "$project": {
                            "_id": 1, "name": 1, "address": 1, "description": 1,
                            "cover_image": 1, "slug": 1, "location": 1,
                            "rating": 1, "tags": 1
                        }
                    },
                    {"$limit": 5}
                ]
                location_hits = await db.shops.aggregate(text_pipeline).to_list(None)
                print(f"DEBUG [RAG] Text/Location Search → {len(location_hits)} shops", flush=True)
            except Exception as text_err:
                print(f"DEBUG [RAG] Text search failed: {text_err}", flush=True)

            # ── Merge & deduplicate (geoNear first, then vector, then text) ───
            merged_shops = []
            seen_ids = set()

            for s in geo_shops:
                if s["_id"] not in seen_ids:
                    merged_shops.append(s)
                    seen_ids.add(s["_id"])

            for s in shops:
                if s["_id"] not in seen_ids:
                    merged_shops.append(s)
                    seen_ids.add(s["_id"])

            for s in location_hits:
                if s["_id"] not in seen_ids:
                    merged_shops.append(s)
                    seen_ids.add(s["_id"])

            shops = merged_shops[:6]

            # ── Final fallback: top-rated shops nếu vẫn rỗng ────────────────────
            if not shops:
                total_in_db = await db.shops.count_documents({})
                print(f"DEBUG [RAG] Khong tim thay shop nao! Tong shops trong DB: {total_in_db}", flush=True)
                shops = await db.shops.find(
                    {},
                    {"_id": 1, "name": 1, "address": 1, "description": 1,
                     "cover_image": 1, "slug": 1, "location": 1, "rating": 1, "tags": 1}
                ).sort("rating", -1).limit(5).to_list(None)
                print(f"DEBUG [RAG] Top-rating fallback → {len(shops)} shops", flush=True)

            if not shops:
                return ""

            shop_ids = [s["_id"] for s in shops]
            shop_names = {s["_id"]: s.get("name", "Unknown") for s in shops}

            drinks = await db.drinks.find(
                {"shop_id": {"$in": shop_ids}},
                {"name": 1, "price": 1, "shop_id": 1, "image_url": 1}
            ).limit(5).to_list(None)
            print(f"DEBUG [RAG] Drinks tìm thấy: {len(drinks)}", flush=True)

            reviews = await db.reviews.find(
                {"shop_id": {"$in": shop_ids}}
            ).sort("date", -1).limit(10).to_list(None)

            db_info: list[str] = []

            db_info.append("=== TOP QUÁN CAFE PHÙ HỢP (VECTOR SEARCH) ===")

            def _centroid(shop: dict) -> tuple[float, float] | tuple[None, None]:
                """Tính tọa độ trung tâm từ GeoJSON Polygon hoặc Point."""
                loc = shop.get("location", {})
                geo_type = loc.get("type", "")
                coords = loc.get("coordinates", [])
                try:
                    if geo_type == "Point" and coords:
                        return float(coords[1]), float(coords[0])  # lat, lng
                    if geo_type in ("Polygon", "MultiPolygon") and coords:
                        ring = coords[0] if geo_type == "Polygon" else coords[0][0]
                        if ring:
                            avg_lng = sum(c[0] for c in ring) / len(ring)
                            avg_lat = sum(c[1] for c in ring) / len(ring)
                            return round(avg_lat, 7), round(avg_lng, 7)
                except Exception:
                    pass
                return None, None

            for s in shops:
                lat, lng = _centroid(s)
                db_info.append(
                    f"- Quán: {s.get('name', '?')} | Slug: {s.get('slug', '?')} "
                    f"| Địa chỉ: {s.get('address', '?')} "
                    f"| lat: {lat} | lng: {lng} "
                    f"| Ảnh: {s.get('cover_image', '')} "
                    f"| Giới thiệu: {s.get('description', '')}"
                )


            if drinks:
                db_info.append("=== MÓN NƯỚC NỔI BẬT (DRINKS) ===")
                db_info.extend(
                    f"- Món: {d.get('name', '?')} | Giá: {d.get('price', '?')}₫ | Ảnh món: {d.get('image_url', '')} | Tại quán: {shop_names.get(d.get('shop_id'), 'Unknown')}"
                    for d in drinks
                )
            
            if reviews:
                db_info.append("=== ĐÁNH GIÁ THỰC TẾ (HONEST CRITIC) ===")
                for rv in reviews:
                    sn = shop_names.get(rv.get("shop_id"), "Unknown Shop")
                    scores = rv.get("ratings", {})
                    db_info.append(
                        f"- {sn} (Bởi: {rv.get('user_name', 'Giấu tên')}) "
                        f"[Đồ Uống: {scores.get('drink', 0)}/5, Phục Vụ: {scores.get('service', 0)}/5, Không Gian: {scores.get('ambiance', 0)}/5] "
                        f"-> '{rv.get('comment', '')}'"
                    )

            result_text = "[CƠ SỞ DỮ LIỆU ĐỘC LẬP TỪ DRINKMAP AI]\n" + "\n".join(db_info)
            print(f"DEBUG [RAG] Context đã build xong — {len(result_text)} ký tự", flush=True)
            print(f"DEBUG [RAG] Preview:\n{result_text[:300]}\n...", flush=True)
            
            if redis_client and result_text:
                try:
                    await redis_client.set(cache_key, result_text, ex=86400)
                except Exception:
                    pass
                    
            return result_text

        except Exception as e:
            logger.error(f"Vector Search Error: {e}")
            return ""
