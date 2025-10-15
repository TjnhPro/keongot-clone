# Hướng dẫn thêm file âm thanh

## Vấn đề CORS đã được khắc phục!

Các lỗi CORS (Cross-Origin Resource Sharing) đã được khắc phục bằng cách:
- Thay thế các URL âm thanh bên ngoài bằng file local
- Tạo thư mục `assets/sounds` để chứa file âm thanh

## Cách thêm file âm thanh mới:

1. **Chuẩn bị file âm thanh:**
   - Format: MP3 (khuyến nghị)
   - Kích thước: < 5MB mỗi file
   - Nội dung: Nhạc nhẹ nhàng, phù hợp với trẻ em

2. **Đặt file vào thư mục:**
   ```
   assets/sounds/
   ├── applause.mp3 (đã có)
   ├── song1.mp3 (placeholder)
   ├── song2.mp3 (placeholder)
   └── [file mới của bạn].mp3
   ```

3. **Cập nhật tên file trong HTML:**
   - Mở file `thu-gian.html`
   - Tìm phần "Nhạc thư giãn"
   - Cập nhật `data-src` trong các button `.track-btn`

## Ví dụ:
```html
<button class="track-btn" data-src="assets/sounds/ten-file-cua-ban.mp3">
    Tên bài hát
</button>
```

## Lưu ý:
- File âm thanh phải được đặt trong thư mục `assets/sounds/`
- Sử dụng đường dẫn tương đối `assets/sounds/` thay vì URL bên ngoài
- Kiểm tra console để đảm bảo không có lỗi CORS
