# Checkpoint 1 (UI): nền đã có, chưa đổi màn nào

Nhánh `worktree-ui-plan-checkpoint`. Đặc tả: `docs/planning/2026-10-09-ui-visual-plan.md` §3 (hệ thiết kế) và §4 (bộ minh họa).

## Commit của giai đoạn

| Hash | Nội dung |
|---|---|
| `c9abf1f` | Checkpoint 0: số liệu xuất phát (`2026-10-09-ui-checkpoint-0.md`) |
| `4a56873` | Task 1: token, font, 6 component dùng chung, `@phosphor-icons/react@2.1.10` |
| `16bb685` | Task 7a: 7 hình trang trí, 4 ảnh món ghi đè, `doodles.test.ts` |

## Số liệu đo

| Lệnh | Kết quả |
|---|---|
| `cd frontend && npx vitest run` | `Test Files 14 passed (14)`, `Tests 163 passed (163)` |
| `cd frontend && npx tsc --noEmit` | Sạch |
| `cd frontend && npx next build` | `Compiled successfully`, 8 route (giống Checkpoint 0) |
| `cd backend && npx jest` | `Tests: 3 skipped, 124 passed, 127 total` |
| `cd backend && npx tsc --noEmit` | Sạch |

Test mới so với Checkpoint 0 (123 → 163, thêm 40): `ui.test.ts` 13 ca, `doodles.test.ts` 27 ca.

## Task 1

- Token trong `globals.css` đủ bảng §3.1 (đúng mã hex), thang khoảng cách 4/8/12/16/24/32, bo góc (14 CTA, tròn đầy, 24, 28, 32, 16, 12), bóng cứng 6px và 8px, `:focus-visible` mực 2,5px, khối `prefers-reduced-motion: reduce`, lớp `.display` (Fraunces 800), `.tabular`, `.visually-hidden`.
- `layout.tsx`: `next/font/google` Fraunces (axes `SOFT`, `WONK`, `opsz`) và Be Vietnam Pro (400–700), cả hai subset `vietnamese`. Bỏ `maxWidth` inline; `main` do `globals.css` đặt (1120px, lề 24px, 16px dưới 640px).
- `next build` **tải được font** (không cần `next/font/local`): `.next/static/media` có các file woff2 và CSS build có đoạn `unicode-range` `u+0102-0103,u+0110-0111,…` của subset vietnamese. Lưu ý: kiểm lại trong Docker ở Giai đoạn 4.
- Component: `Button` (`primary`, `cta`, `ghost`, `link`, `danger`), `Card`, `Badge` (`neutral`, `ink`, `ok`, `warn`, `danger`), `EmptyState` (có `doodle`), `ErrorState`, `Skeleton`; mỗi cái một `.module.css`.

## Task 7a

- 7 hình ở `frontend/public/doodles/`: `moka`, `mug`, `bag`, `bean`, `leaf`, `sparkle`, `burst`.
- 4 ảnh món ghi đè cùng tên: `viewBox="0 0 240 180"`, `rect` nền bo 20 với màu §3.1 làm lớp dưới cùng, hình ly bọc trong `<g transform="translate(20 0)">`. Cỡ file 1105 đến 1465 byte, mọi file dưới 2 KB.

## Chưa làm / chưa kiểm

- **Chưa nhìn bằng mắt**: phiên này không có trình duyệt. Chưa xem được 4 ảnh món sau khi bọc, hình trang trí, font hiển thị thật, nút/Badge/Card. Cần người duyệt mở trình duyệt xem trước khi áp vào màn.
- Chưa chụp ảnh baseline (xem Checkpoint 0).
- Chưa có màn nào dùng component mới. `ProductCard` vẫn đặt ảnh vào khung cũ với `object-fit: cover` (`ProductCard.tsx:68`). Ảnh mới tỉ lệ 4:3; nếu khung cũ không phải 4:3 thì mép ảnh, kể cả góc bo của ô nền, bị cắt cho tới khi Task 7 làm lại thẻ món. Chưa đo tỉ lệ khung cũ.
- Chưa dùng `@phosphor-icons/react`: mới cài và ghim. `Header` dùng ở Giai đoạn 3.
