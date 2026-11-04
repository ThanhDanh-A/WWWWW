# Hướng dẫn phát triển và chạy dự án

## 1. Yêu cầu

- Trình duyệt hiện đại như Chrome hoặc Edge.
- Internet để tải các thư viện CDN và gọi Google Gemini API.
- VS Code (khuyến nghị) hoặc trình soạn thảo văn bản.
- Python 3 nếu muốn dùng máy chủ tĩnh có sẵn mà không cài extension.

Dự án không cần framework, bước build hoặc package manager.

## 2. Tải mã nguồn

1. Mở repository trên GitHub.
2. Chọn **Code → Download ZIP** và giải nén.
3. Trong VS Code, chọn **File → Open Folder**.
4. Mở thư mục gốc có chứa `index.html`, không mở riêng file HTML.

## 3. Chạy bằng Python (không cần extension)

Mở Terminal tích hợp của VS Code tại thư mục gốc dự án và chạy:

Windows:
```powershell
py -m http.server 5500
```

macOS/Linux:
```bash
python3 -m http.server 5500
```

Mở trình duyệt tại:

```text
http://localhost:5500
```

Dừng máy chủ bằng `Ctrl + C` trong Terminal.

## 4. Chạy bằng Live Server (tùy chọn)

Có thể cài extension Live Server trong VS Code, nhấp chuột phải vào `index.html` và chọn **Open with Live Server**. Đây là lựa chọn tiện lợi, không bắt buộc.

Không nên mở file trực tiếp bằng đường dẫn `file://`, vì trình duyệt có thể chặn JavaScript ES Modules khi trang không chạy qua HTTP.

## 5. Kết nối Gemini

1. Tạo hoặc quản lý API Key tại [Google AI Studio](https://aistudio.google.com/apikey).
2. Chỉ nhập khóa trong phần **Kết nối Gemini** trên website.
3. Chọn **Lưu API Key** để lưu khóa trên trình duyệt hiện tại.
4. Chọn **Kiểm tra kết nối** để gửi yêu cầu thử nghiệm thực tế.
5. Khi giao diện báo Gemini đã kết nối, gửi một câu hỏi để kiểm tra trò chuyện.

Lưu ý: Lưu khóa thành công không đồng nghĩa khóa đã được xác thực. Nếu kiểm tra thất bại, đọc thông báo trên giao diện và kiểm tra quyền API, trạng thái khóa, mạng và hạn mức tài khoản.

## 6. Làm việc với GitHub

- Tạo nhánh riêng cho thay đổi mới.
- Commit theo từng nhóm thay đổi có nội dung rõ ràng.
- Kiểm tra diff trước khi tạo Pull Request.
- Không commit API Key, file `.env`, dữ liệu riêng tư hoặc thông tin đăng nhập.

## 7. Ghi chú khi chỉnh sửa

- `app.js`: luồng thao tác và giao diện.
- `gemini.js`: kết nối API và xử lý phản hồi.
- `storage.js`: dữ liệu cục bộ.
- `style.css`: trình bày và responsive.
- `index.html`: cấu trúc và nội dung giao diện.
