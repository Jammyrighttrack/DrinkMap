export const MOCK_SHOPS = [
  {
    "id": "shop-001",
    "name": "Cà Phê Giảng",
    "category": "Cafe",
    "location": {
      "type": "Point",
      "coordinates": [105.8492, 21.0337]
    },
    "address": "39 Nguyễn Hữu Huân, Hoàn Kiếm, Hà Nội",
    "images": [
      "https://images.unsplash.com/photo-1751569543716-70c5fb9a8298"
    ],
    "menu": [
      { "name": "Cà Phê Trứng", "price": 35000, "is_signature": true },
      { "name": "Cà Phê Sữa Đá", "price": 25000, "is_signature": false },
      { "name": "Bạc Xỉu", "price": 28000, "is_signature": false }
    ],
    "tags": ["⚡ High Caffeine", "📸 Sống ảo", "🥚 Egg Coffee", "Traditional"],
    "average_rating": 4.8,
    "total_reviews": 124
  },
  {
    "id": "shop-002",
    "name": "Phúc Long BK",
    "category": "Bubble Tea",
    "location": {
      "type": "Point",
      "coordinates": [105.8445, 21.0042]
    },
    "address": "268 Tô Vĩnh Diện, Khương Đình, Thanh Xuân, Hà Nội",
    "images": [
      "https://images.unsplash.com/photo-1741243038487-1d835e67bcbf"
    ],
    "menu": [
      { "name": "Trà Sữa Oolong", "price": 45000, "is_signature": true },
      { "name": "Trà Đào Cam Sả", "price": 48000, "is_signature": true },
      { "name": "Trà Sữa Thái", "price": 42000, "is_signature": false }
    ],
    "tags": ["🧋 Bubble Tea", "🌱 Healthy", "Student Friendly", "Modern"],
    "average_rating": 4.6,
    "total_reviews": 89
  },
  {
    "id": "shop-003",
    "name": "AHA Coffee Roastery",
    "category": "Cafe",
    "location": {
      "type": "Point",
      "coordinates": [105.8528, 21.0278]
    },
    "address": "16 Nhà Thờ, Hoàn Kiếm, Hà Nội",
    "images": [
      "https://images.unsplash.com/photo-1704883647012-c6f4d29fe360"
    ],
    "menu": [
      { "name": "Single Origin Pour Over", "price": 65000, "is_signature": true },
      { "name": "Flat White", "price": 55000, "is_signature": false },
      { "name": "Cold Brew", "price": 50000, "is_signature": false }
    ],
    "tags": ["⚡ High Caffeine", "Specialty Coffee", "📸 Sống ảo", "Quiet"],
    "average_rating": 4.9,
    "total_reviews": 156
  },
  {
    "id": "shop-004",
    "name": "Trà Chanh Phố Cổ",
    "category": "Tea House",
    "location": {
      "type": "Point",
      "coordinates": [105.8512, 21.0308]
    },
    "address": "45 Hàng Bạc, Hoàn Kiếm, Hà Nội",
    "images": [
      "https://images.unsplash.com/photo-1752802043560-52a8a53e37ae"
    ],
    "menu": [
      { "name": "Trá Chanh", "price": 18000, "is_signature": true },
      { "name": "Trà Đá", "price": 5000, "is_signature": false },
      { "name": "Nước Mía", "price": 15000, "is_signature": false }
    ],
    "tags": ["🌱 Healthy", "Budget Friendly", "Traditional", "Refreshing"],
    "average_rating": 4.3,
    "total_reviews": 67
  },
  {
    "id": "shop-005",
    "name": "The Coffee House - Điện Biên Phủ",
    "category": "Cafe",
    "location": {
      "type": "Point",
      "coordinates": [105.8398, 21.0182]
    },
    "address": "143 Điện Biên Phủ, Ba Đình, Hà Nội",
    "images": [
      "https://images.unsplash.com/photo-1704883647012-c6f4d29fe360"
    ],
    "menu": [
      { "name": "Bạc Sỉu", "price": 39000, "is_signature": false },
      { "name": "Phindi Choco", "price": 45000, "is_signature": true },
      { "name": "CloudFee", "price": 49000, "is_signature": true }
    ],
    "tags": ["📸 Sống ảo", "Modern", "WiFi", "Study Spot"],
    "average_rating": 4.5,
    "total_reviews": 203
  },
  {
    "id": "shop-006",
    "name": "Highlands Coffee BK",
    "category": "Cafe",
    "location": {
      "type": "Point",
      "coordinates": [105.8428, 21.0051]
    },
    "address": "Số 1 Đại Cồ Việt, Hai Bà Trưng, Hà Nội",
    "images": [
      "https://images.unsplash.com/photo-1704883647012-c6f4d29fe360"
    ],
    "menu": [
      { "name": "Freeze Trà Xanh", "price": 55000, "is_signature": true },
      { "name": "Phin Sữa Đá", "price": 39000, "is_signature": false },
      { "name": "Bánh Mì Pate", "price": 29000, "is_signature": false }
    ],
    "tags": ["⚡ High Caffeine", "Student Friendly", "WiFi", "Study Spot"],
    "average_rating": 4.4,
    "total_reviews": 178
  },
  {
    "id": "shop-007",
    "name": "Matcha Corner",
    "category": "Tea House",
    "location": {
      "type": "Point",
      "coordinates": [105.8468, 21.0255]
    },
    "address": "24 Bà Triệu, Hoàn Kiếm, Hà Nội",
    "images": [
      "https://images.unsplash.com/photo-1761150285879-e80fef8f035b"
    ],
    "menu": [
      { "name": "Matcha Latte", "price": 55000, "is_signature": true },
      { "name": "Hojicha Latte", "price": 52000, "is_signature": true },
      { "name": "Matcha Tiramisu", "price": 68000, "is_signature": false }
    ],
    "tags": ["🌱 Healthy", "📸 Sống ảo", "Japanese Style", "Quiet"],
    "average_rating": 4.7,
    "total_reviews": 92
  },
  {
    "id": "shop-008",
    "name": "Choco Lab",
    "category": "Dessert Cafe",
    "location": {
      "type": "Point",
      "coordinates": [105.8505, 21.0295]
    },
    "address": "8 Lý Quốc Sư, Hoàn Kiếm, Hà Nội",
    "images": [
      "https://images.unsplash.com/photo-1704883647012-c6f4d29fe360"
    ],
    "menu": [
      { "name": "Hot Chocolate", "price": 58000, "is_signature": true },
      { "name": "Brownie & Ice Cream", "price": 75000, "is_signature": true },
      { "name": "Affogato", "price": 62000, "is_signature": false }
    ],
    "tags": ["Sweet", "📸 Sống ảo", "Dessert", "Cozy"],
    "average_rating": 4.8,
    "total_reviews": 134
  },
  {
    "id": "shop-009",
    "name": "Cộng Cà Phê",
    "category": "Cafe",
    "location": {
      "type": "Point",
      "coordinates": [105.8485, 21.0318]
    },
    "address": "30 Hàng Đào, Hoàn Kiếm, Hà Nội",
    "images": [
      "https://images.unsplash.com/photo-1752802043560-52a8a53e37ae"
    ],
    "menu": [
      { "name": "Cà Phê Cốt Dừa", "price": 42000, "is_signature": true },
      { "name": "Sinh Tố Bơ", "price": 48000, "is_signature": false },
      { "name": "Soda Chanh Muối", "price": 35000, "is_signature": false }
    ],
    "tags": ["Traditional", "📸 Sống ảo", "Nostalgic", "Vietnamese"],
    "average_rating": 4.6,
    "total_reviews": 201
  },
  {
    "id": "shop-010",
    "name": "TocoToco Tôn Đức Thắng",
    "category": "Bubble Tea",
    "location": {
      "type": "Point",
      "coordinates": [105.8412, 21.0065]
    },
    "address": "102 Tôn Đức Thắng, Đống Đa, Hà Nội",
    "images": [
      "https://images.unsplash.com/photo-1741243038487-1d835e67bcbf"
    ],
    "menu": [
      { "name": "Trà Sữa Đậu Đỏ", "price": 38000, "is_signature": true },
      { "name": "Trà Sữa Oolong", "price": 36000, "is_signature": false },
      { "name": "Yogurt Dâu", "price": 40000, "is_signature": false }
    ],
    "tags": ["🧋 Bubble Tea", "Student Friendly", "Quick", "Affordable"],
    "average_rating": 4.4,
    "total_reviews": 156
  },
  {
    "id": "shop-011",
    "name": "Loading T - Giang Văn Minh",
    "category": "Cafe",
    "location": {
      "type": "Point",
      "coordinates": [105.8368, 21.0215]
    },
    "address": "56 Giang Văn Minh, Ba Đình, Hà Nội",
    "images": [
      "https://images.unsplash.com/photo-1704883647012-c6f4d29fe360"
    ],
    "menu": [
      { "name": "Dirty Coffee", "price": 52000, "is_signature": true },
      { "name": "Milktea Oreo", "price": 48000, "is_signature": true },
      { "name": "Tiger Milk Tea", "price": 45000, "is_signature": false }
    ],
    "tags": ["📸 Sống ảo", "Modern", "Instagram Worthy", "Young Crowd"],
    "average_rating": 4.7,
    "total_reviews": 189
  },
  {
    "id": "shop-012",
    "name": "1976 Cafe & Bánh Mì",
    "category": "Cafe",
    "location": {
      "type": "Point",
      "coordinates": [105.8522, 21.0288]
    },
    "address": "12 Đinh Tiên Hoàng, Hoàn Kiếm, Hà Nội",
    "images": [
      "https://images.unsplash.com/photo-1752802043560-52a8a53e37ae"
    ],
    "menu": [
      { "name": "Cà Phê Sữa", "price": 32000, "is_signature": false },
      { "name": "Bánh Mì Thịt", "price": 25000, "is_signature": true },
      { "name": "Nước Chanh", "price": 20000, "is_signature": false }
    ],
    "tags": ["Traditional", "Budget Friendly", "Authentic", "Local Favorite"],
    "average_rating": 4.5,
    "total_reviews": 143
  },
  {
    "id": "shop-013",
    "name": "The Note Coffee",
    "category": "Cafe",
    "location": {
      "type": "Point",
      "coordinates": [105.8495, 21.0325]
    },
    "address": "14 Lương Văn Can, Hoàn Kiếm, Hà Nội",
    "images": [
      "https://images.unsplash.com/photo-1704883647012-c6f4d29fe360"
    ],
    "menu": [
      { "name": "Coconut Coffee", "price": 45000, "is_signature": true },
      { "name": "Lemon Tea", "price": 35000, "is_signature": false },
      { "name": "Tiramisu", "price": 55000, "is_signature": false }
    ],
    "tags": ["📸 Sống ảo", "Unique", "Post-it Notes", "Tourist Spot"],
    "average_rating": 4.6,
    "total_reviews": 267
  },
  {
    "id": "shop-014",
    "name": "GongCha - Royal City",
    "category": "Bubble Tea",
    "location": {
      "type": "Point",
      "coordinates": [105.8195, 21.0042]
    },
    "address": "Royal City, 72A Nguyễn Trãi, Thanh Xuân, Hà Nội",
    "images": [
      "https://images.unsplash.com/photo-1741243038487-1d835e67bcbf"
    ],
    "menu": [
      { "name": "Brown Sugar Pearl Milk Tea", "price": 52000, "is_signature": true },
      { "name": "Alisan Oolong Milk Tea", "price": 48000, "is_signature": false },
      { "name": "Passion Fruit Green Tea", "price": 45000, "is_signature": false }
    ],
    "tags": ["🧋 Bubble Tea", "Premium", "Mall", "AC"],
    "average_rating": 4.5,
    "total_reviews": 312
  },
  {
    "id": "shop-015",
    "name": "Tranquil Books & Coffee",
    "category": "Cafe",
    "location": {
      "type": "Point",
      "coordinates": [105.8452, 21.0195]
    },
    "address": "5 Nguyễn Quang Bích, Hai Bà Trưng, Hà Nội",
    "images": [
      "https://images.unsplash.com/photo-1704883647012-c6f4d29fe360"
    ],
    "menu": [
      { "name": "Americano", "price": 42000, "is_signature": false },
      { "name": "Caramel Macchiato", "price": 58000, "is_signature": true },
      { "name": "Earl Grey Latte", "price": 48000, "is_signature": false }
    ],
    "tags": ["Quiet", "Study Spot", "Books", "WiFi", "Cozy"],
    "average_rating": 4.8,
    "total_reviews": 98
  }
];
