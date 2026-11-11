# Handoff: đặc tả các use-case còn thiếu (2026-11-11)

`use-case-overview.puml` có 9 use-case cấp cao nhưng mới có đặc tả cho UC-04 (`uc-checkout.md`, trọng tâm theo đề A2 §3.3) và UC-10 (`uc-inventory.md`). Đợt này soạn nháp đặc tả cho 7 use-case còn lại, đặt trong `docs/requirements/use-cases/`. `uc-checkout.*` và `uc-inventory.md` giữ nguyên chỗ cũ.

Đây là tài liệu Task 1 nên agent được soạn nháp (`.claude/rules/doc-code-sync.md`). Nhóm đọc lại, sửa và chốt; mỗi người phải giải thích được phần mình khi vấn đáp.

## Card, branch, worktree

Branch tích hợp: `a2/uc-specs` (worktree `.worktrees/uc-specs`), tạo từ `main` tại `5f09264`.

| Card | Use-case | Độ phức tạp | Branch | Worktree |
|---|---|---|---|---|
| [A](card-A.md) | UC-03 Đăng nhập, UC-09 Đăng ký, UC-05 Lịch sử đơn | Đơn giản | `a2/uc-a-auth-history` | `.worktrees/uc-a` |
| [B](card-B.md) | UC-01 Menu, UC-02 Giỏ hàng | Trung bình | `a2/uc-b-menu-cart` | `.worktrees/uc-b` |
| [C](card-C.md) | UC-06 Hủy đơn, UC-07 Cập nhật trạng thái | Phức tạp | `a2/uc-c-order-lifecycle` | `.worktrees/uc-c` |

Ba card không chung file nào nên chạy song song được. Worker tuân `.claude/rules/multi-agent-workflow.md` (mục "Worker phải tuân"). Integrator làm sau khi merge: render `.svg`, viết `use-cases/README.md`, cập nhật `docs/requirements/README.md` và dòng dẫn link ở `srs.md` mục 2.3.

## Quy tắc chung cho cả ba card

1. **Nguồn sự thật là `docs/requirements/srs.md`.** Mọi bước, mã lỗi, mã HTTP, tên trạng thái, tên endpoint trong đặc tả phải có trong SRS (mục 2, 3 và FR/AC tương ứng). Không thêm hành vi mới.
2. **Đối chiếu code, không sửa code.** Đọc phần code nêu trong card để kiểm đặc tả có mô tả đúng hệ thống đang chạy. Nếu code lệch SRS: viết đặc tả theo SRS và ghi chỗ lệch vào report (file:dòng, SRS nói gì, code làm gì). Không sửa `apps/`, `tests/`, `srs.md`.
3. **Không lặp lại UC-04.** Chỗ nào đã được `uc-checkout.md` đặc tả thì dẫn tới mã luồng của nó (ví dụ "UC-04 A5"), không chép lại.
4. **Sơ đồ khớp overview.** Tên actor, mã UC, mã FR và quan hệ trong `.puml` của từng UC không được mâu thuẫn với `docs/requirements/use-case-overview.puml`. Dùng đúng khối `skinparam` ở mẫu dưới.
5. **Văn phong** tiếng Việt, cùng giọng `uc-checkout.md`. Tham chiếu đề bằng số mục (`đề A2 §3.3`). Mật khẩu chỉ ghi cho tài khoản demo, luôn kèm chữ "demo".
6. **Không ghi ảnh vào repo.** Worker chỉ tạo `.md` và `.puml`; `.svg` do Integrator render. Trong `.md` vẫn nhúng `![...](uc-0x-ten.svg)`.
7. Dùng Edit/Write cho file `.puml` (có `\n`), không dùng heredoc của Bash.

## Khung file `.md` (khoảng 80–150 dòng mỗi UC)

```markdown
# UC-0x — <Tên use-case>

> Đặc tả use-case phụ, bổ sung cho use-case trọng tâm [UC-04](../uc-checkout.md) (đề A2 §3.3). Yêu cầu: [`../srs.md`](../srs.md). Use-case tổng quát: [`../use-case-overview.svg`](../use-case-overview.svg).

## 1. Tóm tắt
Bảng: mã và tên, mục tiêu, giá trị nghiệp vụ, ưu tiên, FR liên quan, quan hệ với UC khác.

## 2. Use-case diagram
Ảnh `.svg`, dòng nguồn `.puml`, giải thích từng quan hệ include/extend/kế thừa.

## 3. Actor
Bảng: actor, loại (chính/phụ), vai trò trong use-case.

## 4. Trigger, tiền điều kiện, hậu điều kiện
Hậu điều kiện tách thành công / thất bại.

## 5. Luồng chính
Bảng: bước, tác nhân (actor, Next.js UI, NestJS API, Database), hành động.

## 6. Luồng thay thế
Mã A1, A2, …; mỗi luồng ghi rẽ từ bước nào và quay lại bước nào.

## 7. Luồng ngoại lệ
Mã E1, E2, …; ghi mã HTTP và mã lỗi theo SRS mục 3.2, dữ liệu có đổi hay không.

## 8. Liên kết với yêu cầu
Bảng: bước hoặc luồng → `FR-xx` → `AC-Fxx.y`. Mọi AC của các FR trong card phải xuất hiện ít nhất một lần.
```

## Mẫu `.puml`

```text
@startuml uc-0x-ten
' BrewLite A2 - Use-case diagram cho UC-0x. Dac ta: docs/requirements/use-cases/uc-0x-ten.md
skinparam DefaultFontColor #1f2937
skinparam ArrowColor #5b6b8c
skinparam ArrowFontColor #1f2937
skinparam RectangleBackgroundColor #ffffff
skinparam RectangleBorderColor #94a3b8
skinparam ActorBackgroundColor #eef2fb
skinparam ActorBorderColor #5b6b8c
skinparam UsecaseBackgroundColor #eef2fb
skinparam UsecaseBorderColor #5b6b8c
skinparam Shadowing false

left to right direction

title UC-0x <Tên> - phạm vi use-case

actor "Khách vãng lai\n(Guest)" as Guest

rectangle "Hệ thống BrewLite" {
  usecase "UC-0x <Tên>\nFR-xx" as UC0x
}

Guest --- UC0x
@enduml
```

Nhãn actor dùng nguyên văn của overview: `Khách vãng lai\n(Guest)`, `Khách hàng\n(Customer)`, `Nhân viên quầy\n(Barista)`, `VNPay sandbox\n(hệ thống ngoài)`.

## Lệnh acceptance (mọi card)

Chạy trong worktree của card, `<base>` là `a2/uc-specs`:

1. `git branch --show-current` ra đúng tên branch của card.
2. Render thử nếu có PlantUML: `java -jar <plantuml.jar> -charset UTF-8 -tsvg -o <thư mục tạm ngoài repo> docs/requirements/use-cases/<file>.puml`, rồi kiểm SVG không có chữ `Syntax Error`. Không có jar thì ghi "chưa render" vào report, Integrator sẽ render.
3. `git diff --check a2/uc-specs...HEAD` sạch.
4. `git diff --name-only a2/uc-specs...HEAD` chỉ gồm allowed paths của card.
5. Mọi link tương đối trong `.md` mới trỏ tới file tồn tại (trừ `.svg` chưa render của chính UC đó).
6. Mọi mã `FR-xx`, `AC-Fxx.y`, `BR-xx` và mã lỗi dùng trong đặc tả đều tìm thấy trong `docs/requirements/srs.md`.
7. `git status --porcelain` sạch sau khi commit.

## Report

Ghi `report-<card>.md` trong thư mục này: hash commit, danh sách file, kết quả từng lệnh acceptance, **danh sách chỗ code lệch SRS** (hoặc "không có"), điểm còn mơ hồ trong SRS mà nhóm cần chốt. Trả về `DONE` / `DONE_WITH_CONCERNS` / `BLOCKED` / `NEEDS_CONTEXT`.
