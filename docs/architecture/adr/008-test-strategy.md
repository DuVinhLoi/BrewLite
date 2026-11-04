# ADR-008: Khôi phục unit, integration và E2E trong CI

- **Trạng thái:** Accepted — quyết định Q1/Q2 ngày 2026-11-04; triển khai và minh chứng PR-2 còn chờ.
- **Nguồn:** [báo cáo P1 của chủ repo](../../planning/handoff/2026-11-owner-p1-report.md), SRS AC-N12.1/AC-N17.1/AC-N18.1; đề A2 §5.1, §6.4, §7.2, §7.3, §9.1.

## Bối cảnh

Bộ test cũ bị gỡ sau kiểm chứng theo yêu cầu bàn giao trước đây. Đề A2 yêu cầu unit, integration, E2E và test trong pipeline; bằng chứng lịch sử không thay suite có thể chạy lại. Test cũ viết cho simulator và `Product.stock`, trong khi bản hiện tại dùng VNPay và kho nguyên liệu/snapshot, nên không khôi phục nguyên trạng.

## Quyết định

| Tầng | Công cụ và vị trí dự kiến | Ranh giới |
|---|---|---|
| Unit API | `node:test` + `tsx`; `apps/api/test/*.test.ts` | Không DB/mạng; stub `fetch`; không thêm dependency API |
| Unit/component web | Vitest + Testing Library + jsdom; `apps/web/src/**/*.test.ts(x)` | Mock `fetch`/`shopApi`, kiểm hành vi hiển thị và tương tác |
| API/integration | `node:test` + `fetch` + `node:crypto`; `tests/integration/*.test.mjs` | Black-box HTTP vào API đã build và PostgreSQL thật; không import controller/service Nest, để kiểm wiring guard/filter/CORS |
| E2E | Playwright, Chromium; `tests/e2e/*.spec.ts`, `apps/web/playwright.config.ts` | Trình duyệt, web và API thật; một worker, chờ theo điều kiện, giữ trace khi lỗi |

Integration/E2E phải kiểm tên DB trước khi chạy: chỉ chấp nhận `^brewlite_(ci|test)(_[a-z0-9]+)?$`, sai thì dừng. Không dùng production. Seed với `SEED_DEMO_USERS=true`; mỗi test tự nhập kho qua API Barista với lý do và tự tạo Customer email ngẫu nhiên. Chạy test kho tuần tự; INT-T04 tạo cạnh tranh ngay trong kịch bản của nó. Seed chạy hai lần để kiểm tính lặp an toàn, giữ số dư/công thức đã sửa.

Chỉ dùng cấu hình **fake, CI only**: `JWT_SECRET` ít nhất 32 ký tự, `VNP_TMN_CODE=FAKETMN1`, `VNP_HASH_SECRET=FAKE_SECRET_FOR_CI_ONLY`, `WEB_URL=http://127.0.0.1:3105`. E2E chặn điều hướng sang sandbox, kiểm chữ ký URL rồi đóng vai VNPay: tự ký IPN/return bằng secret giả với `node:crypto`, gọi API và mở trang return. Không dùng hàm ký của app làm đáp án; không cần OTP, secret thật hoặc sandbox hoạt động. Các ca này kiểm giao thức của ứng dụng; thao tác sandbox thật vẫn là kiểm tay riêng.

CI dự kiến: Install → Lint → Unit Test (API, web) → Migration/seed ×2 → Build → Integration Test → E2E → Compose validation. CD push `main` hoặc tag `a2-v*` gọi lại CI qua quality gate, test lỗi chặn publish/deploy. Mã và phạm vi dự kiến tại [ma trận, Phần B](../../traceability-matrix.md#phan-b); chỉ ghi PASS sau khi có kết quả theo SHA/run URL. Áp dụng L2: test lộ bug ghi `skip` kèm lý do và PR sửa riêng, không sửa ứng dụng trong PR khôi phục test.

## Phương án đã loại

- **Khôi phục nguyên Jest/supertest cũ:** thêm công cụ/dependency API khi `node:test`, `tsx` và HTTP chuẩn đã đủ; test cũ dựa simulator/Product.stock không chứng minh hành vi VNPay/kho hiện tại.
- **E2E trả tiền trên sandbox bằng thẻ test:** chậm, cần OTP, IPN công khai và phụ thuộc sandbox bảo trì; khó chạy ổn định trong CI. Giữ để kiểm tay/demo, không làm cổng tự động.
- **Chỉ giữ hồ sơ lịch sử hoặc chỉ test API:** không đáp ứng E2E Chromium và unit/component web theo Q1, NFR-12/NFR-17.

## Hệ quả

- Q2 duyệt thêm devDependency web theo bản khóa tại `73a6ccb`: `vitest 5.0.5`, `@testing-library/react 16.3.3`, `@testing-library/jest-dom 7.0.1`, `jsdom 30.1.3`, `@playwright/test 1.64.1`. Commit tài liệu này chưa cài dependency hay đổi workflow.
- Cần PostgreSQL test, Chromium và thư viện hệ thống trên runner; test kho tuần tự và E2E một worker làm CI lâu hơn. **Chưa có số phút tăng thực đo:** phải bổ sung thời lượng, SHA và run URL sau khi pipeline đủ tầng chạy, không lấy thời lượng CI cũ thiếu test làm số đo suite mới.
- Ba run CI liên tiếp cùng phạm vi test và minh chứng PR đỏ do test còn chờ. Protection Q3 đã bật theo báo cáo P1; cấu hình đó không chứng minh suite đã chạy.
- Test bằng secret giả không xác nhận VNPay thật, cấu hình production, mọi nhánh QueryDR/race hay legacy. Khoảng trống ghi trong ma trận/UC-04 cần minh chứng riêng; không đổi kết quả lịch sử thành PASS hiện tại.
