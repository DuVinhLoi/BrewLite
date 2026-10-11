# Checkpoint 4 (UI): 11 màn theo canvas "nét mực" đã dựng xong

Nhánh `worktree-ui-plan-checkpoint`. Hoàn tất Giai đoạn 3 (Task 7): Header và Menu (đã ghi ở `2026-10-10-ui-checkpoint-3a.md`) cộng 9 màn: Chi tiết món, Giỏ hàng, Thanh toán, Đặt hàng thành công, Đăng nhập/Đăng ký, Hồ sơ, Lịch sử, Quầy, Kho. Đặc tả: `docs/planning/2026-10-09-ui-visual-plan.md` §3 đến §9; artboard: `E:/CNPM/BrewLite/docs/superpowers/canvas/project/<Tên>Doodle.dc.html`. Quy trình subagent: mỗi cụm màn có implementer và reviewer riêng (đều được duyệt, không có lỗi Critical hay Important), sau đó `/code-review` toàn Giai đoạn 3b, fix wave 5 mục, re-review có phạm vi.

**Chưa có ai nhìn các màn này bằng mắt.** Phiên làm việc không có trình duyệt. Mọi giá trị hình ảnh lấy từ artboard và token; phần ảnh chụp 360px và 1280px ở checklist của Checkpoint 4 trong `frontend-ui-plan.md` chưa làm được.

## Commit (từ `fa06e54`)

| Màn | Commit |
|---|---|
| Chi tiết món (focus trap, Esc) | `6bea1f3` |
| Giỏ hàng | `7aac17a` |
| Thanh toán | `f71055e` |
| Đặt hàng thành công | `3121ddc` |
| Đăng nhập / Đăng ký | `5818022` |
| Hồ sơ | `f3dcc06` |
| `GuestState` dùng chung | `0f1562c` |
| Lịch sử | `d53e8e2` |
| Quầy pha chế | `c2bc385` |
| Kho | `7e7d582` |
| Sửa sau `/code-review` (modal phím, `isStaff` một nguồn, `alt` ảnh giỏ, tiêu đề đăng ký) | `a471b2b`, `fce6975`, `a05908d` |

## Số liệu đo (HEAD `a05908d`)

| Lệnh | Kết quả |
|---|---|
| `cd backend && npx jest` | `Tests: 3 skipped, 130 passed, 133 total` (backend không đổi trong giai đoạn này) |
| `cd frontend && npx vitest run` | `Test Files 47 passed (47)`, `Tests 796 passed (796)` |
| `tsc --noEmit` | Sạch ở cả hai |
| `next build` | `Compiled successfully`, 8 route (chạy trên bản sao; dev server cổng 3001 giữ `frontend/.next`) |
| Grep `href="#"` trong `frontend/src/**/*.tsx` (không tính test) | 0 kết quả |
| Grep em-dash trong chữ hiển thị của `*.tsx` | 0 kết quả |

So với Checkpoint 3a: frontend 522 → 796 test. Smoke trên Postgres thật không chạy lại vì backend không đổi từ Checkpoint 3.

## Bạn cần xem bằng mắt (theo thứ tự quan trọng)

Mở `next dev` (sau khi xóa `frontend/.next`) và đi hết luồng khách rồi quầy và kho, ở 1280px, 1024px, 760px và 360px, kèm "reduce motion" bật và tắt.

1. **Hero Menu** (xem danh sách chi tiết ở `ui-checkpoint-3a.md`).
2. **Chi tiết món:** ô ảnh 4:3 canh giữa có thể thừa khoảng trắng; Tab xoay vòng trong modal, Esc đóng, focus về nút mở (Safari và Firefox macOS: click chuột không focus nút nên có thể không trả focus); nút + dừng ở trần.
3. **Giỏ hàng:** cốc trong khối "Tổng" ở 861 đến 950px và 320 đến 360px (số tiền lớn có thể bẻ giữa số); nút −/+ 40px.
4. **Thanh toán:** moka, lá, sao trong "Đơn của bạn" có đè danh sách không; "Thực trả" Fraunces 44px ở 360px; radio thật chọn bằng phím mũi tên.
5. **Đặt hàng thành công:** sao bật lên một lần; thanh 5 bước (nét nối thẳng tâm chấm, nhãn xuống dòng ở 360px).
6. **Đăng nhập/Đăng ký:** vị trí doodle ở bố cục hẹp (tự chọn, artboard không cho); tiêu đề xoay -2°.
7. **Hồ sơ:** số điểm 150px sau xoay -3° ở 861 đến 1000px và 360px.
8. **Lịch sử:** thẻ mờ 0,72 (chữ phụ 3,5 đến 3,8:1); thanh nhỏ 12px ở 360px; ô ảnh món là hạt cà phê.
9. **Quầy:** ba cột từ 761px (mỗi cột còn khoảng 227px): nút "Hủy (hết nguyên liệu)" và dòng mã cộng tổng có xuống dòng xấu không; chiều cao cột cố định 520px.
10. **Kho:** bảng cuộn ngang trong khung, vòng focus có bị `overflow` của khung cắt không; ảnh 4:3 cắt vuông 48px.

## Quyết định cần bạn biết (đầy đủ trong ledger)

- **Ký hiệu tiền** "đ" (app) thay "₫" (canvas); email chỉ ở `title` của pill vai trò; `alt` ảnh thẻ món Menu bằng tên món; ba điểm này đã nêu ở Checkpoint 3a.
- **Chữ mới theo đặc tả:** "+N điểm tích lũy" (thay "+N điểm"), nhãn "Mã giảm giá" kèm gợi ý "Ví dụ: BREWLITE10" (bỏ placeholder), "Đăng ký thành công. Đăng nhập bằng email vừa tạo.", lỗi đăng nhập tiếng Việt ("Email đã được đăng ký.", "Sai email hoặc mật khẩu."), tiêu đề tấm trái đăng ký "Đăng ký để đặt món và theo dõi đơn", "Đang tải…" và "Chưa có món nào." ở Kho. Sơ đồ UC liên quan đã sửa cùng commit.
- **"Đã hủy" xám thay vì đỏ như canvas** vì `OrderStatusTrack.test.ts` ghim màu xám và quy tắc là không sửa test cũ; `OrderStatusTrack` giữ hex dự phòng (`#b91c1c`, `#6b7280`) trong `var()` chỉ vì lý do đó.
- **Quầy và Kho bỏ hẳn hiệu ứng nhấn nút** (không dùng `ui/Button`, không `:active` scale), đúng quy tắc "màn làm việc không chuyển động".
- **Nút Đăng nhập/Đăng ký có ↗ cam** (đặc tả §3.3 liệt kê, canvas thì không).
- **Ô ảnh món ở Lịch sử là hạt cà phê** vì `GET /orders/me` không trả ảnh.
- **Đề §7 wireframe không sửa** (là tham khảo): vẫn thỏa về chữ; dấu ✓ lớn của wireframe 5 thay bằng cốc, vẫn còn dấu ✓ trong thanh trạng thái.

## Việc nhỏ còn nợ (không chặn)

- Catch cuối của `app/login/page.tsx` che lỗi hiếm (thân JSON `null`), hiện chữ chung tiếng Việt.
- Bốn wrapper `Page` gần giống nhau ở `HistoryView`, `BaristaView`, `InventoryView`, `ProfileView` (refactor thuần).
- Thanh 5 bước ở 320 đến 360px; offset `#menu` cố định 88px/196px; nút −/+ giỏ 40px (<44px); lưới Quầy ép 3 cột từ 761px.
- Docs §2.8 chưa nhắc hai trạng thái mới của Kho ("Đang tải…", "Chưa có món nào."); test "không chuyển động" của Quầy/Kho chỉ cấm `transform: scale`.
- Các nợ nhỏ cũ ở cuối `2026-10-09-ui-checkpoint-3.md` và `2026-10-10-ui-checkpoint-3a.md`.

## Còn lại theo kế hoạch

Giai đoạn 4 (Task 9 đến 11): Task 9 đối chiếu wireframe đề §7 (lập bảng 5 dòng), Task 10 Dockerfile production kèm ESLint (kiểm `next/font/google` tải được trong Docker build), Task 11 kiểm thử cuối và bàn giao. Dừng ở Checkpoint 5; không push, không merge.
