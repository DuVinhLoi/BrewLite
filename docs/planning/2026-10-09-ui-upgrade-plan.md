> **Trạng thái:** các bước ở mục 4 đã được thay bằng `2026-10-09-frontend-ui-plan.md` (thứ tự task và checkpoint) và `2026-10-09-ui-visual-plan.md` (đặc tả hình ảnh). File này chỉ còn là tài liệu nghiên cứu ThreeUI.

# Kế hoạch: Nâng cấp giao diện frontend (tham khảo ThreeUI)

> Nguồn tham khảo: https://github.com/MengTo/threeui (bản Community, MIT) và catalog https://threeui.com.
> Phạm vi: chỉ giao diện. Không đổi hành vi, endpoint, luồng đơn hàng hay state machine.

## 1. ThreeUI là gì và có hợp BrewLite không

ThreeUI là catalog component WebGL (shader, hero 3D, nền chuyển động). Đã clone bản Community về thư mục tạm và đọc mã (chưa chạy dev server, chưa nhìn thấy hình thật của component nào).

**Số liệu đo từ mã nguồn (v1.2.0):**
- Community có khoảng 84 mục trong 8 nhóm: Backgrounds 29, Buttons 20, Text Animation 14, UI Elements 9, CSS 5, Hero 3, Sections 2, Landing Pages 2. Không có nhóm Loaders, Forms, Cards hay Pricing riêng.
- Gói npm `@designcodeio/threeui` nặng **54,7 MB** khi giải nén và kéo theo hai bản `three` riêng (0.128 và 0.165) cùng peer `three >=0.149`. Không nên cài cả gói chỉ để dùng 1 component.
- Phần lớn nền (Condensation, Elements, Liquid Form, Energy Orb, Liquid Metal Button) viết bằng **WebGL thuần, không dùng Three.js**, mã nguồn chỉ vài chục KB. Chỉ Skeuomorphic Toggle và Animated Top Dock dùng Three.js.
- Giấy phép: MIT cho code và ảnh do ThreeUI viết, font OFL, runtime Three.js MIT. Thumbnail và video xem trước tải từ threeui.com, không nằm trong giấy phép của repo.
- Danh sách trên threeui.com gồm cả mục Pro/Beta. Thermo Button, Hourglass Loader, Ember Keycap (phù hợp thương mại nhất) **không có** trong mã Community, nên bỏ khỏi cân nhắc. Loader duy nhất của Community là Uplink Loader: chạy trong `<iframe>`, nền xanh đen kiểu terminal, lệch thương hiệu.

**Ứng viên cho BrewLite (đã đọc mã, chưa xem hình):**

| Component | Loại | Ghi chú |
|---|---|---|
| `CondensationBackground` | Nền, WebGL thuần, ~6,5 KB renderer | Giọt nước ngưng tụ lớn dần rồi chảy xuống (đọc từ mã). Hợp ly cà phê đá. Tùy chọn: `speed`, `dropAmount`, `opacity`. Không có tùy chọn màu |
| `ElementsBackground` (Water, Fire, Condensation, Generative Tree) | Nền, WebGL2, ~14 KB | Cần xem thử biến thể nào hợp |
| `LiquidFormBackground`, `EnergyOrb` | Nền, WebGL | Màu bạc / xanh, có thể lệch thương hiệu |
| `RectangleButtons`, `CircleButtons` | Nút, CSS thuần (rectangle ~32 KB) | Dùng ý tưởng hoặc sao chép kiểu CTA, không cần WebGL |
| `SkeuomorphicToggle` | Công tắc, Three.js | Chỉ dùng nếu cần bật/tắt (ví dụ "đang mở quán" ở admin). Kéo Three.js nên không ưu tiên |
| `GalleryHeading`, `TextAnimationCollection` | Chữ động | Tiêu đề hero; không cần cho các trang làm việc |

**Kết luận:** ThreeUI là nguồn cảm hứng và vài điểm nhấn, không phải thư viện UI để thay giao diện. Bốn việc chính của app (menu, giỏ, thanh toán, hàng đợi barista) cần form, bảng, thẻ sản phẩm rõ ràng, phần này ThreeUI không có. Phần lớn công sức nên vào hệ thống thiết kế (màu, chữ, khoảng cách, component) làm bằng CSS thường. WebGL chỉ để 1 đến 2 điểm nhấn.

**Cách lấy component: sao chép mã nguồn, không cài gói npm.** Lấy đúng 1 file (ví dụ `src/shaders/condensation/`, MIT), đặt vào `frontend/src/components/fx/`, kèm dòng ghi nguồn và giấy phép MIT. Tránh 54 MB, tránh hai bản Three.js, tránh cấu hình CSS/asset của gói thư viện viết cho Vite.

**Rủi ro cần chặn:**
- Component dùng `ResizeObserver`, `IntersectionObserver`, `requestAnimationFrame`, WebGL: phải là client component và nạp bằng `next/dynamic` với `ssr: false`.
- Mã nguồn ThreeUI viết dạng một dòng dài, khó đọc; khi sao chép nên format lại bằng prettier và chạy qua `tsc`/lint của frontend.
- Máy yếu, điện thoại, `prefers-reduced-motion`, không có WebGL: bắt buộc có fallback tĩnh (gradient CSS).
- Demo trên máy chiếu của lớp: thử trước trên máy sẽ demo. Component tự dừng khi ra khỏi màn hình hoặc tab ẩn (Condensation có sẵn), đó là điểm tốt.
- Màu: Condensation không có tùy chọn màu, nền phải do CSS phía sau quyết định (kiểm tra trong spike).

## 2. Hiện trạng frontend

- Next 14.2.35, React 18.3.1, zustand. Không có Tailwind, không có thư viện UI, không có `next/font`.
- 12 file `.tsx` dùng style inline hoặc object `styles` (`ProductCard`, `ProductGrid`, `cart/page`, `history/page`, `barista/page`, ...). `globals.css` chỉ có 3 rule (font hệ thống, nền `#f9fafb`).
- Layout: `Header` + `<main>` rộng 1024px. Thẻ sản phẩm có emoji ☕ khi chưa có ảnh; mỗi thẻ có hai nút cùng kiểu ("Thêm vào giỏ", "Tùy chọn size / topping").
- Chưa có `@media`, chưa có `prefers-reduced-motion`, chưa có skeleton loading.
- Test hiện có (`vitest`) chỉ phủ `src/lib` và `OrderStatusTrack`, không phủ giao diện.

## 3. Hướng đề xuất

CSS variables (design tokens) trong `globals.css` + CSS Modules cho từng component. Không thêm Tailwind hay thư viện UI: ít phụ thuộc nhất, người trong nhóm không cần học công cụ mới, và không đụng cấu hình Docker build.

Thương hiệu: tông cà phê (nâu espresso, kem, một màu nhấn), chữ qua `next/font` (một font có dấu tiếng Việt đầy đủ cho tiêu đề, một font cho nội dung). Chọn font cụ thể trong bước spike, kiểm tra hiển thị đủ dấu.

## 4. Các bước

### Bước 0 — Spike ThreeUI (giới hạn 2 giờ, quyết định có hay không)

- [ ] Trong nhánh tạm: sao chép `condensation/` và `elements/` từ bản Community (không cài gói npm) vào `frontend/src/components/fx/`, format lại, sửa cho qua `tsc`.
- [ ] Dựng trang thử `/fx-spike` qua `next/dynamic` với `ssr: false`, thử `CondensationBackground` và 1 biến thể của `ElementsBackground` trên nền nâu/kem.
- [ ] Xem bằng mắt (người làm nốt, môi trường này không có trình duyệt): có hợp thương hiệu không, có dễ đọc chữ phủ lên không.
- [ ] Đo: kích thước JS thêm vào (`next build`), FPS trên máy sẽ demo, có chạy trong Docker build không.
- [ ] **Cổng quyết định:** bỏ Bước 3 nếu không có nền nào hợp thương hiệu, hoặc JS thêm vào trang Menu quá vài chục KB gzip, hoặc giật trên máy demo. Ngưỡng này là ước lượng vì mã WebGL thuần rất nhỏ; chỉnh theo số đo thật. Các bước còn lại không đổi.

### Bước 1 — Nền tảng thiết kế

- [ ] `globals.css`: biến màu, cỡ chữ, khoảng cách, bo góc, đổ bóng, focus ring; reset gọn; `@media (prefers-reduced-motion: reduce)`.
- [ ] `next/font` trong `layout.tsx`; `lang="vi"` giữ nguyên.
- [ ] Lớp tiện ích dùng chung: `button` (chính, phụ, nguy hiểm, vô hiệu), `input`, `card`, `badge`, `skeleton`.
- [ ] Đổi `Header` (điều hướng theo vai trò, giỏ hàng có số lượng, responsive).

### Bước 2 — Các màn hình, mỗi màn một commit

Thứ tự theo luồng khách hàng đi qua, vì đó là phần được demo:

- [ ] Menu (`page.tsx`, `ProductGrid`, `ProductCard`): lưới responsive, ảnh tỉ lệ cố định, skeleton thay chữ "loading", nút chính/phụ khác nhau rõ, trạng thái "Hết hàng".
- [ ] `ProductDetailModal` và `QtyStepper`: focus trap, đóng bằng Esc, vùng bấm đủ lớn.
- [ ] Giỏ (`cart/page`) và `PaymentForm`: bố cục hai cột (danh sách / tổng tiền), trạng thái lỗi thanh toán rõ ràng, nút bị khóa khi đang gửi.
- [ ] `PaymentSuccess` và `OrderStatusTrack`: làm nổi bật các bước của state machine (`PENDING` đến `COMPLETED`).
- [ ] `history`, `login`.
- [ ] `barista` và `admin`: bảng/cột đọc nhanh trên màn hình lớn, nút thao tác lớn, màu theo trạng thái đơn.

### Bước 3 — Điểm nhấn ThreeUI (chỉ nếu Bước 0 qua cổng)

- [ ] Component bọc `HeroBackdrop`: lazy-load, hiện gradient CSS khi đang tải, khi `prefers-reduced-motion`, khi WebGL không có, hoặc trên màn hình hẹp.
- [ ] Đặt ở đầu trang Menu hoặc trang Login, không đặt ở `barista`/`admin` (màn hình làm việc, cần nhẹ).
- [ ] Tùy chọn: hiệu ứng ở `PaymentSuccess`. Chỉ làm nếu thời gian còn dư.

### Bước 4 — Hoàn thiện và kiểm chứng

- [ ] Tương phản màu đạt WCAG AA, thao tác được bằng bàn phím, có nhãn cho nút chỉ có biểu tượng.
- [ ] Kiểm tra ở 360px, 768px, 1280px.
- [ ] `cd frontend && npm test && npm run build`; `docker compose up -d --build`, đi tay luồng khách đặt và trả 1 đơn, barista nhận pha đến giao.
- [ ] Chụp màn hình trước/sau cho slide.

## 5. Ràng buộc

- Theo `.claude/rules/doc-code-sync.md`: nếu đổi câu thông báo giao diện mà sơ đồ sequence trích (ví dụ nhãn nút, thông báo lỗi thanh toán), sửa sơ đồ và ma trận Phần III trong cùng commit. Giữ nguyên chữ hiện có khi có thể.
- Không đổi props / API của `lib/` và `store/`; test hiện có phải tiếp tục xanh.
- Không thêm trailer đồng tác giả vào commit (xem memory của repo).

## 6. Cần người dùng quyết

1. Có làm Bước 3 (WebGL) không, hay chỉ làm hệ thống thiết kế bằng CSS? Đề xuất: làm Bước 0 trước, quyết sau khi có số đo.
2. Đổi thương hiệu màu: chấp nhận tông cà phê (nâu / kem) hay có màu của nhóm sẵn?
3. Có cần chế độ tối không? Đề xuất: không, để ngoài phạm vi.
