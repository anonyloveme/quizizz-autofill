# 🤖 Quizizz Auto-Fill

> Tampermonkey userscript tự động điền câu hỏi trắc nghiệm vào Quizizz / Wayground với chế độ batch, tự động reload, retry khi lỗi và bypass popup trình duyệt.

![Version](https://img.shields.io/badge/version-10.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Platform](https://img.shields.io/badge/platform-Tampermonkey-orange)
![Sites](https://img.shields.io/badge/sites-Quizizz%20%7C%20Wayground-purple)

---

## 📋 Mục lục

- [✨ Tính năng](#-tính-năng)
- [📦 Yêu cầu](#-yêu-cầu)
- [🗂️ Cấu trúc repo](#️-cấu-trúc-repo)
- [🚀 Cài đặt](#-cài-đặt)
- [⚙️ Cấu hình](#️-cấu-hình)
- [📝 Định dạng dữ liệu câu hỏi](#-định-dạng-dữ-liệu-câu-hỏi)
- [🕹️ Sử dụng](#️-sử-dụng)
- [🔄 Sơ đồ hoạt động](#-sơ-đồ-hoạt-động)
- [🔧 Debug & Troubleshooting](#-debug--troubleshooting)
- [❓ FAQ](#-faq)
- [⚠️ Lưu ý](#️-lưu-ý)
- [📜 License](#-license)

---

## ✨ Tính năng

| Tính năng | Mô tả |
|---|---|
| **Batch processing** | Xử lý câu hỏi theo từng nhóm, tự động reload giữa các batch |
| **Auto-retry** | Tự thử lại khi gặp lỗi, bỏ qua câu nếu hết số lần retry |
| **Checkpoint** | Lưu tiến trình vào `localStorage`, tiếp tục từ chỗ dừng sau reload |
| **Bypass popup** | Vô hiệu hóa hộp thoại *"Reload site?"* của trình duyệt |
| **Anti-debugger** | Loại bỏ lệnh `debugger` được trang web nhúng vào |
| **Control panel** | Giao diện nổi với đầy đủ nút điều khiển và log realtime |
| **Hotkey** | Phím `P` → Pause/Resume, phím `S` → Stop |
| **Điền & chọn đáp án** | Hỗ trợ cả Multiple Choice và Multi-select |
| **Elapsed timer** | Hiển thị tổng thời gian chạy |
| **Progress tracker** | Hiển thị tiến trình câu hiện tại / tổng số câu |

---

## 📦 Yêu cầu

| Thành phần | Chi tiết |
|---|---|
| Trình duyệt | Chrome, Firefox, Edge (phiên bản mới nhất) |
| Extension | [Tampermonkey](https://www.tampermonkey.net/) |
| Trang hỗ trợ | `quizizz.com/admin/quiz/*` và `wayground.com/admin/quiz/*` |

---

## 🗂️ Cấu trúc repo

```
quizizz-autofill/
├── Quizizz Auto-Fill v10.0-10.0.user.js   # File script chính — chỉnh sửa file này
└── README.md                               # Tài liệu hướng dẫn
```

> ⚠️ **Lưu ý:** Toàn bộ logic, cấu hình và dữ liệu câu hỏi đều nằm trong **một file script duy nhất**. Bạn chỉ cần chỉnh sửa file `.user.js` là đủ.

---

## 🚀 Cài đặt

### Cách 1 — Cài thủ công (khuyến nghị)

Do tên file chứa khoảng trắng, tính năng cài đặt trực tiếp qua URL có thể không hoạt động trên một số trình duyệt. Hãy cài thủ công theo các bước sau:

**Bước 1:** Mở Tampermonkey Dashboard — nhấp icon Tampermonkey trên thanh công cụ trình duyệt → chọn **Dashboard**.

**Bước 2:** Tạo script mới — nhấp vào dấu **"+"** góc trên bên trái của Dashboard.

**Bước 3:** Dán code vào — xóa toàn bộ nội dung mặc định, sau đó copy toàn bộ nội dung file [`Quizizz Auto-Fill v10.0-10.0.user.js`](https://github.com/anonyloveme/quizizz-autofill/blob/main/Quizizz%20Auto-Fill%20v10.0-10.0.user.js) và dán vào.

**Bước 4:** **Thay thế mảng `questions`** bằng dữ liệu câu hỏi của bạn (xem phần [Định dạng dữ liệu](#-định-dạng-dữ-liệu-câu-hỏi) bên dưới).

**Bước 5:** Lưu lại — nhấn **Ctrl + S** (Windows / Linux) hoặc **Cmd + S** (Mac).

---

### Cách 2 — Cài trực tiếp qua URL

```
https://raw.githubusercontent.com/anonyloveme/quizizz-autofill/main/Quizizz%20Auto-Fill%20v10.0-10.0.user.js
```

Dán URL trên vào trình duyệt → Tampermonkey mở trang xác nhận → Nhấn **Install**.

> ⚠️ Sau khi cài xong, bạn vẫn cần mở Tampermonkey Dashboard để **thay thế mảng `questions`** bằng dữ liệu của mình rồi lưu lại.

---

## ⚙️ Cấu hình

Mở script trong Tampermonkey Dashboard, tìm phần `CONFIGURATION` ở đầu file và chỉnh các thông số theo nhu cầu:

```javascript
const BATCH_SIZE      = 5;    // Số câu xử lý mỗi batch trước khi reload
const START_FROM      = 0;    // Câu bắt đầu (index tính từ 0)
const AUTO_START      = true; // Tự động tiếp tục sau khi reload
const MAX_RETRY       = 5;    // Số lần thử lại tối đa khi gặp lỗi
const RETRY_WAIT_SEC  = 30;   // Số giây chờ trước khi retry
const RELOAD_WAIT_SEC = 20;   // Số giây chờ sau khi reload batch
```

**Gợi ý cấu hình theo tình huống:**

| Tình huống | `BATCH_SIZE` | `RETRY_WAIT_SEC` | `RELOAD_WAIT_SEC` |
|---|---|---|---|
| Mạng nhanh, ổn định | 10 | 15 | 10 |
| Mạng bình thường | 5 | 30 | 20 |
| Mạng chậm / hay lỗi | 3 | 45 | 30 |

---

## 📝 Định dạng dữ liệu câu hỏi

> ⚠️ **Quan trọng:** Script có sẵn một mảng `questions` mẫu. Bạn cần **xóa toàn bộ nội dung mẫu đó** và thay bằng dữ liệu câu hỏi của mình.

Tìm phần `DATA` trong script và thay thế nội dung bên trong `const questions = [...]`:

```javascript
const questions = [

  // Câu hỏi đơn đáp án
  {
    question: "Nội dung câu hỏi?",
    options:  ["Đáp án A", "Đáp án B", "Đáp án C", "Đáp án D"],
    answer:   [1],        // index của đáp án đúng, bắt đầu từ 0
    is_multi: false       // false = chỉ 1 đáp án đúng
  },

  // Câu hỏi đa đáp án
  {
    question: "Chọn TẤT CẢ đáp án đúng?",
    options:  ["Đáp án A", "Đáp án B", "Đáp án C", "Đáp án D"],
    answer:   [0, 2],     // nhiều index đáp án đúng
    is_multi: true        // true = nhiều đáp án đúng
  },

];
```

**Quy tắc index đáp án:**

```
options: ["Đáp án A",  "Đáp án B",  "Đáp án C",  "Đáp án D"]
index:        0             1             2             3

answer: [0]       → chọn "Đáp án A"
answer: [1, 3]    → chọn "Đáp án B" và "Đáp án D"
```

---

## 🕹️ Sử dụng

**Bước 1:** Truy cập trang chỉnh sửa quiz trên Quizizz hoặc Wayground.

**Bước 2:** Panel điều khiển tự động xuất hiện ở góc trên bên phải màn hình.

**Bước 3:** Nhập số câu muốn bắt đầu vào ô **"From Q#"** — mặc định là `0` tức câu đầu tiên.

**Bước 4:** Nhấn ▶ **START** và script tự chạy, không cần thao tác thêm.

---

**Mô tả các nút điều khiển:**

| Nút | Phím tắt | Chức năng |
|---|---|---|
| ▶ START | — | Bắt đầu từ câu chỉ định trong ô "From Q#" |
| ⏸ PAUSE | `P` | Tạm dừng sau khi hoàn thành câu hiện tại |
| ▶ RESUME | `P` | Tiếp tục sau khi pause |
| ⏹ STOP | `S` | Dừng hoàn toàn và xóa auto-flag |
| 🎯 GO | — | Chạy ngay từ câu được nhập trong ô "From Q#" |
| 🔄 RESET | — | Xóa toàn bộ checkpoint, đặt lại về câu 0 |

---

**Thông tin hiển thị trên panel:**

```
🤖 Quizizz Auto-Fill v10.0
⚙ Batch: 5 câu | Retry: 5 lần | Chờ: 30s
▶ Status   : Đang chạy câu 12/150
📊 Progress : 11 / 150
🔁 Retry câu 12: lần 2/5
⏱ Elapsed  : 3m 42s
```

---

## 🔄 Sơ đồ hoạt động

```
           START
             │
             ▼
    ┌─────────────────┐
    │  Xử lý từng câu │◄──────────────────────┐
    │  trong batch     │                       │
    └────────┬────────┘                       │
             │                                │
    ┌────────▼────────────────────────────┐   │
    │ 1. Click Add Question               │   │
    │ 2. Chọn Multiple Choice             │   │
    │ 3. Điền câu hỏi + đáp án           │   │
    │ 4. Chọn đáp án đúng                │   │
    │ 5. Click Save                       │   │
    │ 6. Lưu checkpoint                   │   │
    └────────┬────────────────────────────┘   │
             │                                │
          Gặp lỗi?                            │
          ┌──┴──┐                             │
         Có    Không                          │
          │      │                            │
          ▼      └────────────────────────────┤
       [Retry]                                │
          │                                   │
       Hết retry?                             │
       ┌──┴──┐                               │
      Có    Không                             │
       │      └──────────────────────────────►│
       ▼                                      │
    [Bỏ qua câu] ────────────────────────────►│
             │                                │
          Hết batch?                          │
          ┌──┴──┐                             │
         Có    Không                          │
          │      └────────────────────────────┘
          ▼
       [Reload trang]
       [Chạy batch kế tiếp]
          │
       Hết tất cả?
          │
          ▼
       ✅ Hoàn thành!
```

---

## 🔧 Debug & Troubleshooting

### Xem log trong Console

Mở **DevTools** (F12) → tab **Console** để xem log realtime của script. Tất cả log đều có prefix `[QAF]`.

### Checkpoint localStorage

Script lưu tiến trình vào `localStorage` với key **`qaf_checkpoint`**. Nếu cần xóa thủ công (ví dụ khi checkpoint bị hỏng), mở Console và chạy:

```javascript
localStorage.removeItem('qaf_checkpoint');
```

Hoặc nhấn nút **RESET** trên panel để script tự xóa.

### Kiểm tra script có đang chạy không

Mở Console và kiểm tra dòng log:

```
[AntiDebugger] ✅ OK
```

Nếu thấy dòng này tức script đã được load thành công.

---

## ❓ FAQ

**Q: Script dừng giữa chừng và không tự reload?**
Nhấn **RESET** để xóa checkpoint cũ, nhập lại số câu muốn tiếp tục vào ô **"From Q#"**, sau đó nhấn **GO**.

**Q: Câu hỏi bị điền sai nội dung hoặc sai đáp án?**
Kiểm tra lại mảng `questions` trong script, đảm bảo `answer` là index đúng bắt đầu từ `0`, không phải `1`.

**Q: Script không chạy khi mở trang?**
Kiểm tra 3 điều: Tampermonkey đã được bật, script đang ở trạng thái **Enabled** trong Dashboard, và URL trang đang mở khớp với `@match` trong header script.

**Q: Làm sao tiếp tục sau khi tắt máy?**
Checkpoint được lưu tự động vào `localStorage` với key `qaf_checkpoint` sau mỗi câu. Khi mở lại trang, script tự đọc checkpoint và đếm ngược rồi chạy tiếp — không cần làm gì thêm.

**Q: Có thể thay đổi `BATCH_SIZE` trong khi đang chạy không?**
Không được. Cần nhấn **STOP**, sửa giá trị `BATCH_SIZE` trong Tampermonkey Dashboard, lưu lại, sau đó nhấn **GO** với số câu muốn tiếp tục.

**Q: Script chạy đến đâu thì reload trang?**
Sau mỗi `BATCH_SIZE` câu, script tự reload. Ví dụ với `BATCH_SIZE = 5`: batch 1 xử lý câu 1–5 rồi reload, batch 2 xử lý câu 6–10 rồi reload, và cứ tiếp tục như vậy cho đến hết.

**Q: Tính năng tự động cập nhật script có hoạt động không?**
Hiện tại chưa hoạt động do `@updateURL` và `@downloadURL` trong script trỏ đến tên file cũ. Hãy kiểm tra repo theo định kỳ để cập nhật thủ công khi có phiên bản mới.

---

## ⚠️ Lưu ý

- Chỉ sử dụng với nội dung và tài khoản thuộc sở hữu của bạn.
- Script hoạt động tốt nhất khi **không thao tác chuột hay bàn phím** trong lúc đang chạy.
- Không dùng để vi phạm điều khoản dịch vụ của Quizizz hay Wayground.
- Tác giả không chịu trách nhiệm về bất kỳ hậu quả nào từ việc sử dụng sai mục đích.

---

## 📜 License

Dự án này được cấp phép theo **MIT License**. Bạn có tự do sử dụng, chỉnh sửa và chia sẻ với điều kiện giữ nguyên thông tin tác giả.

---

*Nếu thấy hữu ích, hãy ⭐ Star repo để ủng hộ tác giả nhé!*

[🔝 Về đầu trang](#-quizizz-auto-fill)
