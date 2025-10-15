Thư mục nội dung cho khu vực Thư giãn.

Cấu trúc đề xuất:

relax/
- tro-choi/          # Trò chơi (games)
- ve-tranh/          # Vẽ tranh (drawing/painting)
- am-nhac/           # Âm nhạc (music/playlist)
- index.json         # Khai báo danh mục/mục con

Mỗi mục có thể là:
- type "game": liên kết tới game (URL) hoặc file HTML nhúng trong dự án
- type "drawing": công cụ/đường dẫn canvas vẽ, hoặc link công cụ
- type "music": danh sách phát (YouTube/MP3) hoặc file .mp3 trong `content/media/music`

Ví dụ mục trong index.json:
{
  "categories": [
    {
      "id": "tro-choi",
      "title": "Trò chơi",
      "items": [
        { "id": "game-memory-1", "type": "game", "title": "Memory Game", "source": "https://example.com/memory" }
      ]
    },
    {
      "id": "ve-tranh",
      "title": "Vẽ tranh",
      "items": [
        { "id": "canvas-basic", "type": "drawing", "title": "Bảng vẽ cơ bản", "source": "apps/draw/index.html" }
      ]
    },
    {
      "id": "am-nhac",
      "title": "Âm nhạc",
      "items": [
        { "id": "playlist-youtube-1", "type": "music", "title": "Nhạc thư giãn", "source": "https://www.youtube.com/playlist?list=XXXX" }
      ]
    }
  ]
}


