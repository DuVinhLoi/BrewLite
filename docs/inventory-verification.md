# BREW-INVENTORY-01 — kết quả kiểm chứng và bàn giao

Task: `BREW-INVENTORY-01`. Branch: `feat/ingredient-inventory`. Worktree: `C:\Users\baoth\orca\workspaces\BrewLite\jumbo`. Baseline/HEAD: `73a6ccb53691d5a6304d631761f1b7446a25701a`. Ngày kiểm chứng: 29/10/2026. Không commit, push hoặc triển khai production.

Yêu cầu: [contract](inventory-contract.md), [kế hoạch](planning/2026-10-29-ingredient-inventory.md), [runbook](inventory-runbook.md), [checkpoint trước khi tiếp tục](checkpoints/2026-10-29-ingredient-inventory.md).

## Tính năng và dữ liệu

- Kho nguyên liệu là nguồn khả dụng cho đơn mới; `available = onHand - reserved`, Decimal/numeric(18,3), quy đổi kg→g và l→ml, không quy đổi khác loại. Menu `stock` là số ly S không topping.
- Công thức riêng từng size và topping; cộng nhu cầu toàn bộ giỏ, kiểm tra và giữ trong transaction; snapshot nguyên liệu theo đơn.
- Thanh toán thành công trừ tồn thực và lượng giữ một lần; thất bại giữ nguyên; retry/replay không trừ lại. Chủ đơn hủy đơn chưa trả giải phóng snapshot một lần.
- Nhân viên xem số dư/lịch sử, nhập/kiểm đếm có lý do, sửa công thức và xem nguyên liệu giới hạn. Khách xem biến thể, kiểm tra giỏ dùng chung nguyên liệu và sửa giỏ khi checkout báo thiếu.
- Migration `20261029000000_ingredient_inventory` chỉ thêm dữ liệu/schema. Đơn cũ `inventoryTracked=false` giữ cơ chế Product.stock; không backfill nguyên liệu từ số ly.
- Seed 8 món, 15 nguyên liệu bắt đầu từ 0, 24 công thức món/size và 3 công thức topping. Chạy lại không reset tồn/giữ/công thức đã chỉnh.

## Môi trường và lệnh kiểm chứng trước khi xóa test

Node 24.19.0, Prisma 6.19.3, PostgreSQL 16.14 tạm tại `127.0.0.1:55439`; Chromium do Playwright cài. Docker không có trong máy. Dùng `npm.cmd` vì PowerShell không cho chạy `npm.ps1`. Hai app đã cài từ lockfile bằng `npm.cmd ci --no-audit --no-fund`.

Các lệnh trong bảng đã chạy thật **trước khi xóa bộ test**. Chúng là hồ sơ lịch sử, không phải hướng dẫn chạy lại trên bản bàn giao không còn test.

| Nơi chạy | Lệnh / thao tác | Kết quả |
|---|---|---|
| apps/api | `npm.cmd test -- --runInBand` | Exit 0; 5 suites, **26/26** |
| apps/api | `npm.cmd test -- --runInBand --testRegex=.integration-spec.ts$` với TEST_DATABASE_URL tách biệt | Exit 0; 2 suites, **20/20**, PostgreSQL thật |
| apps/api | `npm.cmd run lint` | Exit 0 |
| apps/api | `node_modules/.bin/tsc.cmd --noEmit` | Exit 0 |
| apps/api | `npm.cmd run build` | Exit 0 |
| apps/api | `npm.cmd run prisma:generate` | Exit 0 |
| apps/api | `node_modules/.bin/prisma.cmd validate` với DATABASE_URL tạm | Exit 0 |
| apps/api | `node_modules/.bin/prisma.cmd migrate status` | Bốn migration đã áp dụng, schema up to date |
| apps/web | `npm.cmd test` | Exit 0; 9 files, **48/48** |
| apps/web | `npm.cmd run lint` | Exit 0 |
| apps/web | `npm.cmd run typecheck` | Exit 0 |
| apps/web | `npm.cmd run build` với NEXT_PUBLIC_API_URL trỏ API tạm | Exit 0; có route `/inventory` |
| apps/web | `npm.cmd run test:e2e` với DB E2E tách biệt | Exit 0; Chromium **7/7**, 15.3 giây |
| docs | Official PlantUML 1.2025.10 render 7 nguồn `.puml` thành SVG | Worker: exit 0, SVG/XML **7/7**, PNG đã xem trực quan |

Database riêng: `brewlite_test_inventory` (integration/seed), `brewlite_test_e2e` (browser), `brewlite_test_migration` (legacy upgrade). Không dùng hoặc sửa production DB.

## Các hành vi đã kiểm chứng

| Nhóm | Bằng chứng trước cleanup |
|---|---|
| Khả dụng | Matcha 20g, sữa 2000ml, siro 200ml → S=6 ly, matcha giới hạn; Decimal tại biên phân số; thiếu/không hợp lệ công thức hoặc tồn 0 không cho bán |
| Công thức | Size riêng; topping cộng vào nền, gồm trân châu vốn có; bỏ nước/đá không quản lý tồn; đơn vị và precision bị kiểm tra |
| Giỏ chung | Gộp các dòng/biến thể và nhiều món dùng chung nguyên liệu; backend từ chối tổng nhu cầu vượt khả dụng |
| Transaction | Trigger cố ý làm insert Order thất bại sau bước giữ nguyên liệu; không để lại Order/snapshot/lượng giữ một phần |
| Cạnh tranh | Nhiều yêu cầu tranh nguyên liệu cuối không bán vượt; kiểm thứ tự khóa công thức/nguyên liệu |
| Thanh toán | Decline giữ reserved; thử lại và replay đồng thời chỉ có một lần tiêu thụ thành công; giá do server tính |
| Hủy/snapshot | Hủy đúng lượng giữ; hủy lặp bị từ chối; sửa công thức sau khi đặt không đổi lượng hoàn của đơn cũ |
| Quyền | JWT/chủ đơn/BARISTA; nhân viên và khách không vượt quyền; kiểm đếm dưới reserved bị từ chối, dữ liệu không đổi |
| Hồi quy | 10 trường hợp checkout PostgreSQL trước đây vẫn đạt; 6 browser flow giữ đơn/key qua lỗi mạng, mất response, decline và 401 |
| UI kho mobile | Nhập nguyên liệu → S6/M5 → decline/giữ → hủy/giải phóng → trả thành công/tiêu thụ; viewport 390px không tràn ngang |
| UI phản hồi cũ | Hai trường hợp chờ thêm giỏ rồi rời trang/sửa giỏ; một trường hợp initial load kho đến sau refresh và nhập kho thành công |

Các mã UNIT/INT/E2E trong SRS/traceability là mã minh chứng lịch sử; mã nguồn kiểm thử không thuộc bản bàn giao cuối theo yêu cầu chủ dự án.

## Migration và seed bảo toàn dữ liệu

1. Migrate DB trống bằng `npm.cmd run prisma:migrate`: áp dụng thành công cả bốn migration trên DB inventory và E2E.
2. Kiểm upgrade DB cũ: áp dụng ba migration gốc vào DB riêng, thêm đơn PENDING cùng OrderItem và Product.stock=7, rồi áp dụng migration inventory. Kiểm tra thực tế: đơn/items/tồn vẫn giữ, marker false, không tạo nguyên liệu hoặc snapshot ước lượng.
3. Kiểm seed chạy lại: trên DB tạm đặt Matcha onHand=20, reserved=3 và sửa định lượng S thành 4.125; chạy `npm.cmd run prisma:seed`; kiểm exact Decimal không đổi, không tăng số bản ghi trùng; trả fixture về trạng thái trước kiểm.

Hai kiểm này dùng script tạm ngoài repository, có assert vào DB riêng; không phải suy luận từ source. Runbook mô tả preflight, đối soát đơn legacy, kiểm kê và bật cơ chế mới. Không tự hủy legacy hoặc rollback về API Product.stock cũ sau khi đã có đơn inventory.

## Rà soát và sửa lỗi

- Review API phát hiện FK insert của công thức có thể khóa nguyên liệu ngược thứ tự checkout. Đã tái hiện bằng PostgreSQL: giữ A, lưu B/A, thử khóa B với timeout 250ms. Test thất bại 55P03 trước sửa; sau sửa khóa ingredient IDs theo SQL ORDER BY trước insert, toàn bộ 20 integration đạt. Scoped review lại không còn phát hiện mở.
- Review UI phát hiện request thêm giỏ đến muộn có thể khôi phục giỏ cũ. Hai regression tái hiện giỏ từ 0 quay về 3 trước sửa; sau sửa hủy pending request khi unmount/id/cart đổi và bỏ kết quả đã hủy, cả hai đạt.
- Review UI phát hiện initial/manual/post-save load kho có thể ghi đè nhau. Regression tái hiện tồn 30 quay về 20 trước sửa; sau sửa dùng controller chung và chỉ nhận kết quả hiện hành, đạt. Review cuối không có contract drift đáng kể.
- Lint React yêu cầu cập nhật state trong callback bất đồng bộ; loader cuối dùng promise callbacks, lint/typecheck/build đạt.

Lỗi môi trường ban đầu (cache/network sandbox, Prisma Client chưa generate, tsx Windows userInfo, thiếu Chromium/quyền teardown) đã xử lý bằng các lần chạy được cấp quyền phù hợp. Seed từng có lỗi ngoặc đã sửa trước khi kiểm bảo toàn. Log ERROR của trường hợp rollback cố ý là kết quả được mong đợi. Cảnh báo Prisma package.json deprecation, Jest VM modules và Next standalone khi chạy E2E không làm các lệnh thất bại.

## Xóa test theo yêu cầu chủ dự án

Chủ dự án đã xác nhận “Xóa toàn bộ test của dự án” sau kiểm chứng. Cleanup bao gồm toàn bộ `apps/api/test/`, `tests/`, web `*.test.ts(x)`, script smoke `docs/validate_task2.py`, Vitest/Playwright/Jest config và test-only dependencies/scripts. CI giữ lint, migration/seed DB riêng, typecheck/build và Compose validation; health/smoke vận hành deployment được giữ. Sau đó (2026-10-29), theo quyết định D3 của kế hoạch VNPay, chỉ thêm lại unit test VNPay tối thiểu `apps/api/test/vnpay.test.ts`; các test còn lại vẫn đã xóa.

Đã xóa **26 tệp** test/cấu hình/tài liệu test, gồm cả test mới dùng để kiểm chứng tính năng rồi được xóa trước bàn giao. Đã gỡ 12 dev dependencies trực tiếp chỉ phục vụ test: API `@nestjs/testing`, `@types/jest`, `@types/supertest`, `cross-env`, `jest`, `supertest`, `ts-jest`; web `@playwright/test`, `@testing-library/jest-dom`, `@testing-library/react`, `jsdom`, `vitest`. npm cập nhật cả hai lockfile; kiểm so sánh không phát hiện thay đổi phiên bản của package còn được giữ.

## Kiểm tra bản cuối sau cleanup

| Kiểm tra | Kết quả |
|---|---|
| API lint, `tsc --noEmit`, Nest build | Tất cả exit 0 trên dependency đã gỡ test |
| Web lint, typecheck, Next production build | Tất cả exit 0 trên dependency đã gỡ test; API URL build cuối `http://localhost:4000` |
| Prisma validate / migrate status trên DB tạm | Exit 0; schema hợp lệ, up to date |
| `npm.cmd ls --depth=0` tại cả hai app | Exit 0; không thiếu dependency trực tiếp |
| API runtime sau cleanup | `node dist/main.js` trên cổng tạm 4217: health ok, 8 products, đăng nhập BARISTA xem 15 ingredients, endpoint availability trả một lựa chọn đúng cấu trúc |
| So sánh lockfiles với baseline | Không đổi phiên bản package còn giữ; manifest và dependency maps đầu lockfile khớp |
| Review cleanup độc lập | Không còn import/config/CI command thực thi tham chiếu bộ test đã xóa; runtime dependencies giữ nguyên |
| Diff và scope cuối | `git diff --check` exit 0; đã xem name-status và 93 đường dẫn thay đổi/mới, nằm trong phạm vi task hoặc cleanup được xác nhận |

Quét file/script và scope của diff dùng helper tạm ngoài repo; CI được xem xét cấu trúc thủ công, không tuyên bố đã chạy GitHub Actions hoặc Docker. Lần smoke PowerShell đầu bọc JSON array bằng `@(...)` làm đếm thành array lồng; sửa cách nhận response và chạy lại đạt 8/15. Đây là lỗi thao tác kiểm chứng, không sửa API để làm khớp phép đếm.

## Demo và giới hạn

Theo [runbook](inventory-runbook.md): cài dependency → generate → migrate → seed → đăng nhập BARISTA → `/inventory` → nhập Matcha 20g, sữa không đường 2000ml, siro 200ml kèm lý do → xem Matcha S còn 6 ly → CUSTOMER đặt và thanh toán hoặc hủy.

M=1.25×S, L=1.5×S, ceil nguyên liệu miếng và topping 20g là giả định demo. Không tự hết hạn đơn bỏ dở; không sản xuất theo mẻ; nước/đá không giới hạn. Số menu là ước tính độc lập. Production chưa triển khai, Docker/Compose chưa chạy trong môi trường local này; CI từ xa chưa chạy cho thay đổi chưa commit.

Đã dừng API smoke và PostgreSQL tạm sau kiểm chứng; giữ dữ liệu tạm để đối chiếu. Worktree/nhánh được giữ nguyên với thay đổi chưa commit, không còn blocker đã biết trong phạm vi bàn giao local.

## Danh sách thay đổi và mục đích

M = sửa, D = xóa, ?? = mới; danh sách từ `git status --porcelain=v1 --untracked-files=all`. Các tệp mới chưa được commit.

| Trạng thái | Đường dẫn | Mục đích |
|---|---|---|
| M | [.github/workflows/README.md](../.github/workflows/README.md) | CI giữ migration/seed, lint/build; loại bước test đã xóa và đồng bộ hướng dẫn |
| M | [.github/workflows/ci.yml](../.github/workflows/ci.yml) | CI giữ migration/seed, lint/build; loại bước test đã xóa và đồng bộ hướng dẫn |
| M | [CONTRIBUTING.md](../CONTRIBUTING.md) | Đồng bộ hướng dẫn setup/build, cleanup test hoặc tài liệu triển khai |
| M | [README.md](../README.md) | Đồng bộ hướng dẫn setup/build, cleanup test hoặc tài liệu triển khai |
| M | [apps/api/README.md](../apps/api/README.md) | Đồng bộ hướng dẫn setup/build, cleanup test hoặc tài liệu triển khai |
| M | [apps/api/eslint.config.mjs](../apps/api/eslint.config.mjs) | Bỏ tham chiếu file/types/globals của bộ test |
| M | [apps/api/package-lock.json](../apps/api/package-lock.json) | Gỡ test-only dev dependencies/scripts; giữ runtime dependencies và phiên bản còn dùng |
| M | [apps/api/package.json](../apps/api/package.json) | Gỡ test-only dev dependencies/scripts; giữ runtime dependencies và phiên bản còn dùng |
| M | [apps/api/prisma/schema.prisma](../apps/api/prisma/schema.prisma) | Mô hình kho, công thức, lịch sử và snapshot; marker legacy |
| M | [apps/api/prisma/seed.ts](../apps/api/prisma/seed.ts) | Seed tạo thiếu nguyên liệu/công thức, bảo toàn số dư và chỉnh sửa |
| M | [apps/api/src/catalog/catalog.module.ts](../apps/api/src/catalog/catalog.module.ts) | Trả stock tính từ nguyên liệu cho size S không topping |
| M | [apps/api/src/catalog/catalog.service.ts](../apps/api/src/catalog/catalog.service.ts) | Trả stock tính từ nguyên liệu cho size S không topping |
| M | [apps/api/src/checkout/checkout.module.ts](../apps/api/src/checkout/checkout.module.ts) | Tích hợp giữ/trừ/hoàn snapshot trong transaction và tương thích đơn cũ |
| M | [apps/api/src/checkout/checkout.service.ts](../apps/api/src/checkout/checkout.service.ts) | Tích hợp giữ/trừ/hoàn snapshot trong transaction và tương thích đơn cũ |
| D | `apps/api/test/auth.spec.ts` | Xóa test/cấu hình/tài liệu test theo xác nhận của chủ dự án |
| D | `apps/api/test/checkout.integration-spec.ts` | Xóa test/cấu hình/tài liệu test theo xác nhận của chủ dự án |
| D | `apps/api/test/checkout.spec.ts` | Xóa test/cấu hình/tài liệu test theo xác nhận của chủ dự án |
| D | `apps/api/test/order-state.spec.ts` | Xóa test/cấu hình/tài liệu test theo xác nhận của chủ dự án |
| D | `apps/api/test/products.e2e-spec.ts` | Xóa test/cấu hình/tài liệu test theo xác nhận của chủ dự án |
| M | [apps/api/tsconfig.build.json](../apps/api/tsconfig.build.json) | Bỏ tham chiếu file/types/globals của bộ test |
| M | [apps/api/tsconfig.json](../apps/api/tsconfig.json) | Bỏ tham chiếu file/types/globals của bộ test |
| D | `apps/api/tsconfig.test.json` | Xóa test/cấu hình/tài liệu test theo xác nhận của chủ dự án |
| M | [apps/web/README.md](../apps/web/README.md) | Đồng bộ hướng dẫn setup/build, cleanup test hoặc tài liệu triển khai |
| M | [apps/web/package-lock.json](../apps/web/package-lock.json) | Gỡ test-only dev dependencies/scripts; giữ runtime dependencies và phiên bản còn dùng |
| M | [apps/web/package.json](../apps/web/package.json) | Gỡ test-only dev dependencies/scripts; giữ runtime dependencies và phiên bản còn dùng |
| D | `apps/web/playwright.config.ts` | Xóa test/cấu hình/tài liệu test theo xác nhận của chủ dự án |
| M | [apps/web/src/app/globals.css](../apps/web/src/app/globals.css) | Bố cục kho/công thức mobile-first theo style hiện có |
| D | `apps/web/src/components/menu/MenuScreen.test.tsx` | Xóa test/cấu hình/tài liệu test theo xác nhận của chủ dự án |
| D | `apps/web/src/components/menu/ProductCard.test.tsx` | Xóa test/cấu hình/tài liệu test theo xác nhận của chủ dự án |
| M | [apps/web/src/components/menu/ProductCard.tsx](../apps/web/src/components/menu/ProductCard.tsx) | Nhãn ước tính S; cho mở chi tiết kiểm tra các biến thể |
| D | `apps/web/src/components/shop/CartScreen.test.tsx` | Xóa test/cấu hình/tài liệu test theo xác nhận của chủ dự án |
| M | [apps/web/src/components/shop/CartScreen.tsx](../apps/web/src/components/shop/CartScreen.tsx) | Kiểm nhu cầu nguyên liệu cả giỏ, thông báo thiếu và cho sửa giỏ |
| D | `apps/web/src/components/shop/CheckoutScreen.test.tsx` | Xóa test/cấu hình/tài liệu test theo xác nhận của chủ dự án |
| M | [apps/web/src/components/shop/CheckoutScreen.tsx](../apps/web/src/components/shop/CheckoutScreen.tsx) | Kiểm nhu cầu nguyên liệu cả giỏ, thông báo thiếu và cho sửa giỏ |
| D | `apps/web/src/components/shop/ProductDetail.test.tsx` | Xóa test/cấu hình/tài liệu test theo xác nhận của chủ dự án |
| M | [apps/web/src/components/shop/ProductDetail.tsx](../apps/web/src/components/shop/ProductDetail.tsx) | Khả dụng biến thể/tổng giỏ và hủy phản hồi cũ khi chuyển trang/giỏ thay đổi |
| M | [apps/web/src/components/shop/ShopProvider.tsx](../apps/web/src/components/shop/ShopProvider.tsx) | Điều hướng kho chỉ dành cho BARISTA |
| D | `apps/web/src/lib/format.test.ts` | Xóa test/cấu hình/tài liệu test theo xác nhận của chủ dự án |
| D | `apps/web/src/lib/shop.test.ts` | Xóa test/cấu hình/tài liệu test theo xác nhận của chủ dự án |
| D | `apps/web/src/lib/stock.test.ts` | Xóa test/cấu hình/tài liệu test theo xác nhận của chủ dự án |
| D | `apps/web/vitest.config.mts` | Xóa test/cấu hình/tài liệu test theo xác nhận của chủ dự án |
| D | `apps/web/vitest.setup.ts` | Xóa test/cấu hình/tài liệu test theo xác nhận của chủ dự án |
| M | [docs/PR_DESCRIPTION.md](PR_DESCRIPTION.md) | Đồng bộ hướng dẫn setup/build, cleanup test hoặc tài liệu triển khai |
| M | [docs/architecture/README.md](architecture/README.md) | Đồng bộ yêu cầu, UC, sơ đồ nguồn/render, kiến trúc và ADR với kho nguyên liệu |
| M | [docs/architecture/adr/001-monorepo.md](architecture/adr/001-monorepo.md) | Đồng bộ yêu cầu, UC, sơ đồ nguồn/render, kiến trúc và ADR với kho nguyên liệu |
| M | [docs/architecture/adr/003-containerization.md](architecture/adr/003-containerization.md) | Đồng bộ yêu cầu, UC, sơ đồ nguồn/render, kiến trúc và ADR với kho nguyên liệu |
| M | [docs/architecture/adr/004-vercel-render.md](architecture/adr/004-vercel-render.md) | Đồng bộ yêu cầu, UC, sơ đồ nguồn/render, kiến trúc và ADR với kho nguyên liệu |
| M | [docs/architecture/adr/005-idempotency-and-optimistic-lock.md](architecture/adr/005-idempotency-and-optimistic-lock.md) | Đồng bộ yêu cầu, UC, sơ đồ nguồn/render, kiến trúc và ADR với kho nguyên liệu |
| M | [docs/architecture/adr/README.md](architecture/adr/README.md) | Đồng bộ yêu cầu, UC, sơ đồ nguồn/render, kiến trúc và ADR với kho nguyên liệu |
| M | [docs/architecture/architecture.md](architecture/architecture.md) | Đồng bộ yêu cầu, UC, sơ đồ nguồn/render, kiến trúc và ADR với kho nguyên liệu |
| M | [docs/architecture/deployment.puml](architecture/deployment.puml) | Đồng bộ yêu cầu, UC, sơ đồ nguồn/render, kiến trúc và ADR với kho nguyên liệu |
| M | [docs/architecture/deployment.svg](architecture/deployment.svg) | Đồng bộ yêu cầu, UC, sơ đồ nguồn/render, kiến trúc và ADR với kho nguyên liệu |
| M | [docs/deployment.md](deployment.md) | Đồng bộ hướng dẫn setup/build, cleanup test hoặc tài liệu triển khai |
| M | [docs/diagrams/README.md](diagrams/README.md) | Đồng bộ yêu cầu, UC, sơ đồ nguồn/render, kiến trúc và ADR với kho nguyên liệu |
| M | [docs/diagrams/activity-checkout.puml](diagrams/activity-checkout.puml) | Đồng bộ yêu cầu, UC, sơ đồ nguồn/render, kiến trúc và ADR với kho nguyên liệu |
| M | [docs/diagrams/activity-checkout.svg](diagrams/activity-checkout.svg) | Đồng bộ yêu cầu, UC, sơ đồ nguồn/render, kiến trúc và ADR với kho nguyên liệu |
| M | [docs/diagrams/class-domain.puml](diagrams/class-domain.puml) | Đồng bộ yêu cầu, UC, sơ đồ nguồn/render, kiến trúc và ADR với kho nguyên liệu |
| M | [docs/diagrams/class-domain.svg](diagrams/class-domain.svg) | Đồng bộ yêu cầu, UC, sơ đồ nguồn/render, kiến trúc và ADR với kho nguyên liệu |
| M | [docs/diagrams/sequence-checkout.puml](diagrams/sequence-checkout.puml) | Đồng bộ yêu cầu, UC, sơ đồ nguồn/render, kiến trúc và ADR với kho nguyên liệu |
| M | [docs/diagrams/sequence-checkout.svg](diagrams/sequence-checkout.svg) | Đồng bộ yêu cầu, UC, sơ đồ nguồn/render, kiến trúc và ADR với kho nguyên liệu |
| M | [docs/diagrams/state-order.puml](diagrams/state-order.puml) | Đồng bộ yêu cầu, UC, sơ đồ nguồn/render, kiến trúc và ADR với kho nguyên liệu |
| M | [docs/diagrams/state-order.svg](diagrams/state-order.svg) | Đồng bộ yêu cầu, UC, sơ đồ nguồn/render, kiến trúc và ADR với kho nguyên liệu |
| M | [docs/requirements/README.md](requirements/README.md) | Đồng bộ yêu cầu, UC, sơ đồ nguồn/render, kiến trúc và ADR với kho nguyên liệu |
| M | [docs/requirements/context-and-scope.md](requirements/context-and-scope.md) | Đồng bộ yêu cầu, UC, sơ đồ nguồn/render, kiến trúc và ADR với kho nguyên liệu |
| M | [docs/requirements/srs.md](requirements/srs.md) | Đồng bộ yêu cầu, UC, sơ đồ nguồn/render, kiến trúc và ADR với kho nguyên liệu |
| M | [docs/requirements/uc-checkout.md](requirements/uc-checkout.md) | Đồng bộ yêu cầu, UC, sơ đồ nguồn/render, kiến trúc và ADR với kho nguyên liệu |
| M | [docs/requirements/uc-checkout.puml](requirements/uc-checkout.puml) | Đồng bộ yêu cầu, UC, sơ đồ nguồn/render, kiến trúc và ADR với kho nguyên liệu |
| M | [docs/requirements/uc-checkout.svg](requirements/uc-checkout.svg) | Đồng bộ yêu cầu, UC, sơ đồ nguồn/render, kiến trúc và ADR với kho nguyên liệu |
| M | [docs/requirements/use-case-overview.puml](requirements/use-case-overview.puml) | Đồng bộ yêu cầu, UC, sơ đồ nguồn/render, kiến trúc và ADR với kho nguyên liệu |
| M | [docs/requirements/use-case-overview.svg](requirements/use-case-overview.svg) | Đồng bộ yêu cầu, UC, sơ đồ nguồn/render, kiến trúc và ADR với kho nguyên liệu |
| M | [docs/traceability-matrix.md](traceability-matrix.md) | Truy vết yêu cầu → thiết kế → code/API → minh chứng lịch sử |
| D | `docs/validate_task2.py` | Xóa test/cấu hình/tài liệu test theo xác nhận của chủ dự án |
| D | `tests/README.md` | Xóa test/cấu hình/tài liệu test theo xác nhận của chủ dự án |
| D | `tests/deployment/test_render_deploy.py` | Xóa test/cấu hình/tài liệu test theo xác nhận của chủ dự án |
| D | `tests/e2e/checkout.spec.ts` | Xóa test/cấu hình/tài liệu test theo xác nhận của chủ dự án |
| D | `tests/postman/BrewLite-Sprint2.postman_collection.json` | Xóa test/cấu hình/tài liệu test theo xác nhận của chủ dự án |
| ?? | [apps/api/prisma/inventory.seed.ts](../apps/api/prisma/inventory.seed.ts) | Seed tạo thiếu nguyên liệu/công thức, bảo toàn số dư và chỉnh sửa |
| ?? | [apps/api/prisma/migrations/20261029000000_ingredient_inventory/migration.sql](../apps/api/prisma/migrations/20261029000000_ingredient_inventory/migration.sql) | Migration cộng thêm, giữ dữ liệu cũ và ràng buộc toàn vẹn |
| ?? | [apps/api/src/inventory/inventory.controller.ts](../apps/api/src/inventory/inventory.controller.ts) | API kho, Decimal/validation, khả dụng tổng giỏ, khóa/reserve/settle snapshot |
| ?? | [apps/api/src/inventory/inventory.module.ts](../apps/api/src/inventory/inventory.module.ts) | API kho, Decimal/validation, khả dụng tổng giỏ, khóa/reserve/settle snapshot |
| ?? | [apps/api/src/inventory/inventory.service.ts](../apps/api/src/inventory/inventory.service.ts) | API kho, Decimal/validation, khả dụng tổng giỏ, khóa/reserve/settle snapshot |
| ?? | [apps/api/src/inventory/inventory.ts](../apps/api/src/inventory/inventory.ts) | API kho, Decimal/validation, khả dụng tổng giỏ, khóa/reserve/settle snapshot |
| ?? | [apps/web/src/app/inventory/page.tsx](../apps/web/src/app/inventory/page.tsx) | Trang nhân viên: số dư/nhập/kiểm đếm/công thức/lịch sử/khả dụng và bảo vệ phản hồi cũ |
| ?? | [apps/web/src/components/shop/InventoryScreen.tsx](../apps/web/src/components/shop/InventoryScreen.tsx) | Trang nhân viên: số dư/nhập/kiểm đếm/công thức/lịch sử/khả dụng và bảo vệ phản hồi cũ |
| ?? | [apps/web/src/components/shop/useAvailability.ts](../apps/web/src/components/shop/useAvailability.ts) | Khả dụng biến thể/tổng giỏ và hủy phản hồi cũ khi chuyển trang/giỏ thay đổi |
| ?? | [apps/web/src/lib/inventory.ts](../apps/web/src/lib/inventory.ts) | Kiểu client, request availability và thông báo/validation số lượng |
| ?? | [docs/architecture/adr/006-ingredient-inventory-snapshots.md](architecture/adr/006-ingredient-inventory-snapshots.md) | Đồng bộ yêu cầu, UC, sơ đồ nguồn/render, kiến trúc và ADR với kho nguyên liệu |
| ?? | [docs/checkpoints/2026-10-29-ingredient-inventory.md](checkpoints/2026-10-29-ingredient-inventory.md) | Giữ checkpoint tạm dừng và ghi trạng thái đã tiếp tục |
| ?? | [docs/inventory-contract.md](inventory-contract.md) | Contract dữ liệu/API/phân quyền/lifecycle đã ghi trước triển khai |
| ?? | [docs/inventory-runbook.md](inventory-runbook.md) | Preflight/cutover, kiểm kê/seed/demo và rollback tương thích |
| ?? | [docs/inventory-verification.md](inventory-verification.md) | Kết quả kiểm chứng, cleanup và danh sách thay đổi/bàn giao |
| ?? | [docs/planning/2026-10-29-ingredient-inventory.md](planning/2026-10-29-ingredient-inventory.md) | Kế hoạch và trạng thái thực hiện task |
| ?? | [docs/requirements/uc-inventory.md](requirements/uc-inventory.md) | Đồng bộ yêu cầu, UC, sơ đồ nguồn/render, kiến trúc và ADR với kho nguyên liệu |
