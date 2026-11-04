# Kế hoạch kiểm thử

## 1. Mục tiêu

Kiểm tra các luồng quan trọng của Personal AI Assistant: mở trang, lưu API Key, xác thực kết nối Gemini, trò chuyện, lưu lịch sử, xử lý lỗi và hiển thị trên nhiều kích thước màn hình.

> Trạng thái trung thực tại thời điểm tạo tài liệu: các ca kiểm thử dưới đây là kế hoạch cần chạy trên trình duyệt thực tế. Chưa có API Key của người dùng trong môi trường chỉnh sửa nên chưa thể xác nhận cuộc gọi Gemini thành công. Không đánh dấu PASS khi chưa chạy.

## 2. Bảng kiểm thử thủ công

| ID | Tình huống | Kết quả mong đợi | Trạng thái |
|---|---|---|---|
| T01 | Mở website qua localhost | Giao diện, CSS, hình ảnh và JavaScript tải đúng | Chưa kiểm thử |
| T02 | Lưu API Key hợp lệ | Khóa được lưu trên trình duyệt; trạng thái chỉ báo đã lưu | Chưa kiểm thử |
| T03 | Kiểm tra API Key hợp lệ | Gửi yêu cầu thử và hiện tên model khi phản hồi thành công | Chưa kiểm thử |
| T04 | Kiểm tra API Key sai | Hiện thông báo lỗi; không báo kết nối thành công | Chưa kiểm thử |
| T05 | Gửi câu hỏi cho Gemini | Câu hỏi và phản hồi xuất hiện trong khung chat | Chưa kiểm thử |
| T06 | Dùng bốn câu hỏi gợi ý | Mỗi thẻ gợi ý gửi đúng nội dung | Chưa kiểm thử |
| T07 | Tạo hội thoại mới | Hội thoại mới xuất hiện trong danh sách | Chưa kiểm thử |
| T08 | Mở và xóa hội thoại | Mở đúng lịch sử; xóa đúng hội thoại được chọn | Chưa kiểm thử |
| T09 | Tải lại trang | Lịch sử còn trong cùng trình duyệt | Chưa kiểm thử |
| T10 | Sao chép câu trả lời | Nội dung được đưa vào clipboard khi trình duyệt cho phép | Chưa kiểm thử |
| T11 | API trả HTTP 429 | Hiện thông báo về giới hạn/hạn mức, không làm hỏng giao diện | Chưa kiểm thử |
| T12 | Mở ở màn hình điện thoại | Thanh bên và khung chat sử dụng được | Chưa kiểm thử |
| T13 | Xóa API Key | Khóa được xóa khỏi localStorage của ứng dụng | Chưa kiểm thử |
| T14 | Nhấn Enter/Shift + Enter | Enter gửi tin; Shift + Enter xuống dòng | Chưa kiểm thử |

## 3. Kiểm tra tự động trên GitHub

GitHub Actions chạy workflow `.github/workflows/quality-checks.yml` khi có push lên nhánh phù hợp hoặc Pull Request vào `main`. Workflow kiểm tra cú pháp các module JavaScript, đường dẫn tài nguyên cục bộ trong HTML, các ID được `app.js` truy cập và hai module JavaScript được import.

Các kiểm tra tự động này không thay thế việc mở website trên trình duyệt, xác thực API Key thật hoặc kiểm thử giao diện trên điện thoại.

## 4. Cách ghi nhận kết quả

Sau khi chạy từng ca kiểm thử, đổi trạng thái thành một trong các giá trị:

- **PASS**: thao tác đúng kết quả mong đợi.
- **FAIL**: có lỗi; ghi lại bước tái hiện và thông báo lỗi.
- **BLOCKED**: chưa thể thử do thiếu API Key, Internet hoặc quyền truy cập.
- **NOT RUN**: chưa thực hiện.

## 5. Bằng chứng kiểm thử

Nên chụp ảnh màn hình thật sau khi chạy:
- Trang chào mừng trên máy tính.
- Một cuộc trò chuyện đã nhận được phản hồi từ Gemini.
- Lịch sử hội thoại sau khi tải lại trang.
- Giao diện trên điện thoại.

Lưu ảnh vào thư mục `screenshots/`. Che API Key, địa chỉ email và dữ liệu cá nhân trước khi đưa ảnh lên repository công khai.
