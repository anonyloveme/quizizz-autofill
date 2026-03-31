# Changelog

Tất cả thay đổi đáng chú ý của dự án này được ghi lại tại đây.  
Định dạng theo chuẩn [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

---

## [10.0] — 2026-03-31

### Added
- Anti-debugger: loại bỏ lệnh `debugger` nhúng bởi trang web
- Bypass "Reload site?" popup bằng `beforeunload` capture tại `document-start`
- `safeReload()`: reload bằng `location.href` thay vì `location.reload()`
- Retry badge hiển thị trạng thái retry trực tiếp trên UI panel
- Elapsed timer đếm tổng thời gian chạy

### Changed
- Toàn bộ cơ chế reload được viết lại để tránh popup trình duyệt
- `typeIntoEditor()` bổ sung thêm 3 bước xóa dự phòng
- Log console nâng cấp với màu sắc và timestamp rõ ràng hơn

### Fixed
- Sửa lỗi toggle Multi-select bị tắt sau khi thêm đáp án
- Sửa lỗi checkpoint không lưu đúng khi batch chạy đến câu cuối

---

## [9.0] — 2026-02-15

### Added
- Batch processing: xử lý câu hỏi theo nhóm, tự reload giữa các batch
- Checkpoint system: lưu tiến trình vào `localStorage`
- Auto-retry: thử lại khi gặp lỗi, bỏ qua nếu hết số lần retry
- Floating control panel với nút START / PAUSE / RESUME / STOP
- Hotkey `P` và `S`

### Changed
- Cấu trúc code tách thành các block rõ ràng với comment section

---

## [8.0] — 2026-01-10

### Added
- Hỗ trợ câu hỏi đa đáp án (`is_multi`)
- `ensureToggleOn()`: tự động bật toggle Multi-select
- `ensureOptionCount()`: tự động thêm ô đáp án nếu chưa đủ

### Fixed
- Sửa lỗi script crash khi trang load chậm

---

## [7.0] — 2025-12-01

### Added
- Phiên bản cơ bản: tự động điền câu hỏi và đáp án đơn
- `waitUntil()`: hàm chờ với timeout
- `clickSave()`: tự động nhấn nút Save sau khi điền xong
