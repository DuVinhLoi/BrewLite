# Checkpoint 3a (UI): Header và Menu theo canvas "nét mực"

Nhánh `worktree-ui-plan-checkpoint`. Gồm hai mục đầu của Giai đoạn 3 (Task 7): Header và Menu (hero, lưới món, thẻ món). Làm theo `docs/planning/2026-10-09-ui-visual-plan.md` §3 đến §6 và artboard `MenuDoodle.dc.html` (đọc từ `E:/CNPM/BrewLite/docs/superpowers/canvas/`). Quy trình subagent: mỗi mục có implementer và reviewer riêng (đều được duyệt, không có lỗi Critical hay Important), sau đó `/code-review` Header + Menu, fix wave 6 mục, re-review có phạm vi.

**Chưa có ai nhìn các màn này bằng mắt.** Phiên làm việc không có trình duyệt. Toàn bộ giá trị hình ảnh (kích thước, tọa độ cảnh bình moka, góc xoay, màu) lấy từ artboard và token. Đây là điểm DỪNG 3a để bạn duyệt hero trên trình duyệt trước khi làm 9 màn còn lại.

## Commit

| Hash | Nội dung |
|---|---|
| `35c409b` | Header: `HeaderView` + `Header` mỏng, `lib/nav.ts`, logo bean, nav dạng viên, pill "Xem giỏ hàng", pill vai trò, Phosphor `bold` |
| `841fb17` | Menu hero: `MenuHero`, `menuSummary`, `app/page.tsx` |
| `c8b3f12` | Lưới món và thẻ món (`ProductCard.module.css`, `MenuSection`, skeleton thẻ 4:3), modal chuyển ra ngoài thẻ |
| `b28996c` | Sửa sau review: `lib/stock.ts` trung tính, vùng `role="status"` riêng cho "Đã thêm ✓", skeleton có role, `Skeleton` bắt buộc kích thước, logo bean có `height` |
| `9b191fd` | Sửa sau review: nét vẽ hơi nước và mũi tên ẩn hẳn trước khi vẽ (không còn chấm tròn) |

## Số liệu đo (HEAD `9b191fd`)

| Lệnh | Kết quả |
|---|---|
| `cd backend && npx jest` | `Tests: 3 skipped, 130 passed, 133 total` (backend không đổi) |
| `cd frontend && npx vitest run` | `Test Files 35 passed (35)`, `Tests 522 passed (522)` |
| `tsc --noEmit` | Sạch ở cả hai |
| `next build` | `Compiled successfully`, 8 route (chạy trên bản sao; dev server cổng 3001 giữ `frontend/.next`) |

So với Checkpoint 3: frontend 385 → 522 test.

## Bạn cần xem bằng mắt (theo thứ tự quan trọng)

1. **Hero ở 1280px:** tỉ lệ ba cột, tiêu đề xoay -4° có bị cắt dấu tiếng Việt không, cảnh bình moka (hơi nước và mũi tên vẽ một lần khi tải, bình nổi lên xuống, sao nhấp nháy, lá lắc).
2. **Hero ở 1081 đến 1167px:** tọa độ cảnh moka sao chép từ artboard rộng 1152px, trong khi vùng nội dung của app tối đa 1072px. Lá có thể chồng lên chữ cột bên ("+1 điểm", cụm ảnh món). Các bậc co nhỏ cảnh ở 1080/900/840/480px là do implementer tự chọn, không có trong artboard.
3. **Hero ở 360px:** một cột, tiêu đề xoay không gây cuộn ngang, cảnh moka thu nhỏ (còn khoảng 49px trống trên và dưới).
4. **Header ở 1024px với tài khoản ADMIN:** nav không được vỡ thành hai dòng; nhóm bên phải có thể xuống dòng. Vòng focus của pill nav.
5. **Bấm "Đặt cà phê ↗":** tiêu đề "Menu hôm nay" có nằm dưới header sticky không (offset cố định 88px, 196px dưới 760px; header của BARISTA và ADMIN cao hơn khi bị xuống dòng).
6. **Giảm chuyển động** (cài đặt hệ điều hành "reduce motion"): trang đứng yên, hơi nước và mũi tên hiện đầy đủ.
7. **Thẻ món:** ô ảnh 4:3 (bốn ảnh món đã có nền màu và bo góc 20), "Sắp hết, còn N", nhãn "Đã thêm ✓", hover nhấc 3px kèm bóng cứng.

Trước khi xem: xóa `frontend/.next` và khởi động lại `next dev` (dev server cũ giữ thư mục này).

## Quyết định cần bạn biết (đầy đủ trong ledger)

- **Ký hiệu tiền:** artboard dùng "₫" nhưng `formatVND` của app trả "35.000đ". Hero dùng `formatVND` như thẻ món (cùng một ký hiệu trên trang). Muốn đổi cả app sang "₫" thì sửa `formatVND`, `pricing.test.ts` và các sơ đồ trích số tiền.
- **Email không hiện trong pill vai trò**, chỉ nằm trong `title`: đúng đặc tả §6.1, nhưng trên màn cảm ứng không có hover. Muốn thấy email thì phải đổi đặc tả.
- **`alt` của ảnh thẻ món bằng tên món** (đặc tả §4), nên trình đọc màn hình đọc tên hai lần với tiêu đề thẻ.
- **Modal chi tiết món chuyển ra ngoài `<article>` của thẻ:** hover trên thẻ có `transform` sẽ thu nhỏ lớp phủ `position: fixed`. Modal chưa có focus trap và phím Esc (từ trước; thuộc mục Chi tiết món).
- **Thẻ "Hết hàng" thực tế không xuất hiện** trên Menu vì `GET /products` chỉ trả món còn hàng (`stock > 0`, đã kiểm trong backend); nhãn chỉ là phòng hờ.
- Logo chữ "BrewLite" 28px theo đặc tả (artboard 30px); pill "Đăng nhập" không có icon (đặc tả chỉ cho icon giỏ và người dùng); header theo `--container` 1120px (artboard 1200px).

## Việc nhỏ còn nợ (không chặn)

- Modal chuyển ra ngoài thẻ chưa có test.
- Link "Tùy chọn size / topping" dùng `--accent-ink`, artboard dùng `--ink`.
- Skeleton thẻ thấp hơn thẻ thật nên có giật nhẹ khi tải xong.
- Khoảng cách trong CSS Modules dùng px thay vì `--space-*`.
- `docs/develop-status-report.md` (~dòng 112) và `docs/planning/2026-10-09-ui-visual-plan.md:191` còn nhắc cách làm cũ (ảnh chụp cũ, ngoài doc-code-sync).
- Dòng "Test:" trong `user-sequence-specifications.md` chưa liệt kê `stock.test.ts`.
- Xem thêm các việc nợ từ Checkpoint 3 (`2026-10-09-ui-checkpoint-3.md`).
