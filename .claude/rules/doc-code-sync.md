---
paths:
  - "docs/Assignment2-BrewLite.md"
  - "docs/requirements/**"
  - "docs/diagrams/**"
  - "docs/architecture/**"
  - "docs/traceability-matrix.md"
  - "docs/deployment.md"
  - "docs/planning/2026-10-15-assignment2-plan.md"
  - "apps/**"
  - "tests/**"
  - ".github/workflows/**"
---

# Đồng bộ đề A2, yêu cầu, sơ đồ và code (nhánh develop-Assignment2)

## Quy tắc số 1: tài liệu được soạn, code chỉ viết khi được yêu cầu

Giảng viên cấm vibecoding, nên phân hai loại việc:

- **Tài liệu (Task 1–3), agent được soạn nháp:** `docs/requirements/` (context-and-scope, SRS, đặc tả use-case), `docs/diagrams/` (`.puml` + `.svg`), `docs/architecture/` (mô tả kiến trúc, ADR, deployment diagram), `docs/traceability-matrix.md`, `docs/deployment.md`, kế hoạch và `README.md`. Bản soạn là bản nháp để nhóm đọc, sửa và chốt; mỗi người phải giải thích được phần mình khi vấn đáp.
- **Code (Task 4–5), chỉ khi người dùng yêu cầu rõ:** `apps/`, `tests/`, `.github/workflows/`, Dockerfile, `docker-compose.yml`. Không tự viết code khi chỉ được giao lên plan hay soạn tài liệu. Khi được yêu cầu, làm đúng phạm vi được giao và nhắc rằng nhóm phải hiểu, giải thích được phần code đó.

Ngoài ra luôn được: đối chiếu bài của nhóm với đề và báo chỗ lệch, giải thích khái niệm, đề xuất cấu trúc.

## Nguồn, theo thứ tự ưu tiên

1. **Đề A2** `docs/Assignment2-BrewLite.md` (bản PDF cùng thư mục). Đề A1 `docs/BrewLite-CongNghePhanMem-fixed.md` chỉ là bối cảnh (stakeholder §3.2, NFR §4.2, state machine §9.1).
2. **Yêu cầu** `docs/requirements/` (`context-and-scope.md`, `srs.md`, `uc-checkout.md`).
3. **Sơ đồ và kiến trúc** `docs/diagrams/`, `docs/architecture/` (kể cả `adr/`).
4. **Code** `apps/web`, `apps/api`, `tests/`, `.github/workflows/`.

Tầng dưới lệch tầng trên thì sửa tầng dưới. Chưa rõ bên nào đúng thì hỏi người dùng trước khi sửa. Truy vết hai chiều trong `docs/traceability-matrix.md` (mẫu đề A2 §8.1).

## Khi nhóm đổi hành vi

Trong cùng pull request, cập nhật theo thứ tự: SRS (`FR-xx` / `NFR-xx` và tiêu chí chấp nhận), sơ đồ liên quan, ADR nếu là quyết định kiến trúc, `docs/traceability-matrix.md`, rồi mới đến code và test. Mô tả PR ghi lý do (đề A2 §6.2).

## Tài liệu A1 trong `docs/reference/a1/`

Là đầu vào tham khảo, mô tả code ở nhánh `develop`. Không sửa nội dung, không coi là tạo phẩm A2, không dẫn từ tài liệu nộp bài như thể đó là nguồn sự thật của A2.

## Ràng buộc kiểm tra được

- Lớp domain của A2: tối thiểu 7 lớp `User`, `Product`, `Order`, `OrderItem`, `Payment`, `Promotion`, `LoyaltyTransaction` (đề A2 §4.3). Tên lớp, thuộc tính, trạng thái trong sơ đồ khớp SRS.
- Mỗi sơ đồ lưu cả `.puml` và ảnh kết xuất `.svg` (đề A2 §4.2).
- Secret thật không xuất hiện trong repo; mật khẩu chỉ ghi cho tài khoản demo, luôn kèm chữ "demo" (đề A2 §7.4).
- Tham chiếu đề bằng số mục, ví dụ `đề A2 §7.3`.

## Xong khi

- Mọi khối PlantUML đã sửa render được, không ra ảnh "Syntax Error".
- `git diff --check` sạch; các liên kết tương đối trong tài liệu mới trỏ tới file tồn tại.
- Mọi yêu cầu bắt buộc của đề A2 vẫn được phủ bởi bảng cuối `docs/planning/2026-10-15-assignment2-plan.md`.

Viết tiếng Việt, cùng văn phong các file trong `docs/`.
