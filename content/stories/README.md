# Thư viện Câu chuyện Giáo dục

Thư mục này chứa tất cả các câu chuyện giáo dục được tổ chức theo chủ đề.

## 📁 Cấu trúc thư mục:

```
content/stories/
├── chia-se/              # Sự chia sẻ
│   ├── index.json
│   ├── README.md
│   └── images/
├── tu-lap/               # Tự lập
│   ├── index.json
│   ├── README.md
│   └── images/
├── tinh-ban/             # Tình bạn
│   ├── index.json
│   ├── README.md
│   └── images/
├── gia-dinh/             # Gia đình
│   ├── index.json
│   ├── README.md
│   └── images/
├── cam-xuc-co-ban/       # Cảm xúc cơ bản
│   ├── index.json
│   ├── README.md
│   └── images/
├── index.json            # Danh sách tất cả chủ đề
└── README.md             # File này
```

## 🚀 Cách thêm truyện mới:

### 1. Chọn chủ đề phù hợp
- Vào thư mục chủ đề tương ứng (ví dụ: `chia-se/`)

### 2. Tạo file truyện
- Tạo file JSON: `truyen-1.json`, `truyen-2.json`, ...
- Hoặc tạo file văn bản: `truyen-1.txt`

### 3. Cập nhật index.json
- Thêm thông tin truyện vào file `index.json` của chủ đề đó

### 4. Thêm ảnh minh họa (tùy chọn)
- Đặt ảnh vào thư mục `images/` của chủ đề

## 📝 Định dạng file truyện:

### JSON Format:
```json
{
  "id": "chia-se-1",
  "title": "Tên câu chuyện",
  "description": "Mô tả ngắn",
  "content": "Nội dung câu chuyện...",
  "age_range": "6-8",
  "duration": "5-10 phút",
  "image": "images/truyen-1.jpg",
  "lessons": [
    "Bài học 1",
    "Bài học 2"
  ],
  "author": "Tác giả",
  "created_date": "2025-01-09"
}
```

### Text Format:
```
# Tên câu chuyện

**Mô tả:** Mô tả ngắn về câu chuyện

**Độ tuổi:** 6-8 tuổi
**Thời gian đọc:** 5-10 phút

---

Nội dung câu chuyện...

---

**Bài học:**
- Bài học 1
- Bài học 2
```

## 🎯 Các chủ đề hiện có:

1. **Sự chia sẻ** - Học cách chia sẻ và giúp đỡ người khác
2. **Tự lập** - Khuyến khích trẻ tự làm những việc phù hợp
3. **Tình bạn** - Cách kết bạn và duy trì tình bạn
4. **Gia đình** - Tình yêu thương và gắn kết gia đình
5. **Cảm xúc cơ bản** - Nhận biết và quản lý cảm xúc

## 💡 Gợi ý thêm chủ đề mới:

Nếu muốn thêm chủ đề mới:
1. Tạo thư mục mới với tên tiếng Việt không dấu
2. Tạo `index.json` và `README.md` tương tự
3. Cập nhật file `index.json` chính để thêm chủ đề mới