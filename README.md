# 🎯 Quizizz Auto-Fill

> Tampermonkey userscript tự động điền câu hỏi trắc nghiệm vào Quizizz / Wayground  
> với chế độ batch, tự động reload, retry khi lỗi và bypass popup trình duyệt.

![Version](https://img.shields.io/badge/version-10.0-blue?style=flat-square)
![License](https://img.shields.io/badge/license-MIT-green?style=flat-square)
![Platform](https://img.shields.io/badge/Tampermonkey-✓-orange?style=flat-square)
![Sites](https://img.shields.io/badge/Quizizz%20%7C%20Wayground-supported-purple?style=flat-square)

---

## 📌 Mục lục

- [Tính năng](#-tính-năng)
- [Yêu cầu](#-yêu-cầu)
- [Cài đặt](#-cài-đặt)
- [Cấu hình](#️-cấu-hình)
- [Định dạng dữ liệu](#-định-dạng-dữ-liệu-câu-hỏi)
- [Sử dụng](#️-sử-dụng)
- [Sơ đồ hoạt động](#-sơ-đồ-hoạt-động)
- [FAQ](#-faq)
- [Lưu ý](#️-lưu-ý)
- [Changelog](#-changelog)
- [License](#-license)

---

## ✨ Tính năng

| Tính năng | Mô tả |
|---|---|
| 🔄 **Batch processing** | Xử lý câu hỏi theo từng nhóm, tự động reload giữa các batch |
| 🔁 **Auto-retry** | Tự thử lại khi gặp lỗi, bỏ qua câu nếu hết số lần retry |
| 💾 **Checkpoint** | Lưu tiến trình vào `localStorage`, tiếp tục từ chỗ dừng sau reload |
| 🚫 **Bypass popup** | Vô hiệu hóa hộp thoại "Reload site?" của trình duyệt |
| 🐛 **Anti-debugger** | Loại bỏ lệnh `debugger` được trang web nhúng vào |
| 🖥️ **Control panel** | Giao diện nổi với đầy đủ nút điều khiển và log realtime |
| ⌨️ **Hotkey** | Phím `P` để Pause/Resume, phím `S` để Stop |
| ✅ **Đơn & đa đáp án** | Hỗ trợ cả Multiple Choice và Multi-select |
| ⏱️ **Elapsed timer** | Hiển thị tổng thời gian đã chạy |
| 📊 **Progress tracker** | Hiển thị tiến trình câu hiện tại / tổng số câu |

---

## 📋 Yêu cầu

| Thành phần | Chi tiết |
|---|---|
| Trình duyệt | Chrome, Firefox, Edge (phiên bản mới nhất) |
| Extension | [Tampermonkey](https://www.tampermonkey.net/) |
| Trang hỗ trợ | `quizizz.com/admin/quiz/*` và `wayground.com/admin/quiz/*` |

---

## 🚀 Cài đặt

### ⚡ Cách 1 — Cài trực tiếp (khuyến nghị)

Nhấp vào link bên dưới, Tampermonkey sẽ tự nhận diện và hiển thị trang cài đặt:

<div align="center">

### 👉 [Nhấp vào đây để cài đặt script](https://raw.githubusercontent.com/anonyloveme/quizizz-autofill/main/quizizz-autofill.user.js)

</div>

> Sau khi nhấp link → Tampermonkey mở trang xác nhận → Nhấn **Install** là xong ✅

---

### 🔧 Cách 2 — Cài thủ công

**Bước 1:** Mở Tampermonkey Dashboard

