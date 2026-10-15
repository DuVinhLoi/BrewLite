# BrewLite — Assignment 2 (Requirements to Deployment)

> Nhánh `develop-Assignment2`: **chỉ có kế hoạch và tài liệu, chưa có code**. Giảng viên cấm vibecoding, nên code của Assignment 2 (A2) do nhóm tự viết trong `apps/web` và `apps/api`, theo kế hoạch bên dưới.

**Code Assignment 1 (A1) nằm ở nhánh `develop`** (`backend/`, `frontend/`, `docker-compose.yml`). Nhánh này không chứa code đó. Xem lại bằng `git show develop:backend/src/...`.

## Hai đề

| Đề | File | Nội dung |
|---|---|---|
| A2 (đề của nhánh này) | [`docs/Assignment2-BrewLite.md`](docs/Assignment2-BrewLite.md) (bản PDF: [`docs/Assignment2-BrewLite.pdf`](docs/Assignment2-BrewLite.pdf)) | 5 task: yêu cầu, mô hình hóa, kiến trúc, Sprint 1, Sprint 2 + CI/CD + production. 10 điểm |
| A1 (đã làm ở `develop`) | [`docs/BrewLite-CongNghePhanMem-fixed.md`](docs/BrewLite-CongNghePhanMem-fixed.md) | 10 task Agile Scrum, MVP đặt cà phê không tiền mặt |

## Kế hoạch thực hiện

**[`docs/planning/2026-10-15-assignment2-plan.md`](docs/planning/2026-10-15-assignment2-plan.md)** — quy trình làm việc, từng task 1→5 kèm tạo phẩm và đường dẫn file, checklist nghiệm thu, nền tảng triển khai, backlog Sprint 1 và 2, bảng phủ yêu cầu đề A2.

Làm đúng thứ tự Task 1 → 5 (đề A2 §1): task sau chỉ được nghiệm thu khi tạo phẩm bắt buộc của task trước đã có trên repo kèm lịch sử commit.

## Cấu trúc repository (theo đề A2 §9)

```text
apps/web/                 # Next.js mobile-first/PWA     (Task 4-5, nhóm tự viết)
apps/api/                 # NestJS + PostgreSQL          (Task 4-5, nhóm tự viết)
docs/requirements/        # Task 1
docs/diagrams/            # Task 2
docs/architecture/        # Task 3 (adr/ chứa các ADR)
docs/planning/            # kế hoạch A2 và kế hoạch lịch sử của A1
docs/reference/a1/        # tài liệu UC / sequence của A1, chỉ để tham khảo
docs/traceability-matrix.md   # Task 1 trở đi, mẫu đề A2 §8.1 (chưa tạo)
docs/deployment.md            # Task 5.4 (chưa tạo)
tests/                    # integration / E2E            (Task 5.2)
.github/workflows/        # ci.yml, cd.yml               (Task 4.4, 5.3)
docker-compose.yml, .env.example   # Task 4.1 / 5.2 (chưa tạo)
```

Hiện tại mỗi thư mục `apps/web`, `apps/api`, `tests/`, `.github/workflows/`, `docs/requirements/`, `docs/diagrams/`, `docs/architecture/` chỉ có `README.md` mô tả nhóm cần nộp gì ở đó.

## Quy tắc quan trọng

- Agent AI được soạn nháp tài liệu Task 1–3 (SRS, sơ đồ, ADR) để nhóm sửa và chốt; code trong `apps/`, `tests/`, `.github/workflows/` chỉ viết khi người dùng yêu cầu rõ. Chi tiết: [`.claude/rules/doc-code-sync.md`](.claude/rules/doc-code-sync.md).
- Mỗi thay đổi làm trên nhánh `a2/task-<n>-<tên>`, mở pull request vào `develop-Assignment2`, có người review và nêu lý do thay đổi.
- Không push và không merge vào `develop` / `main` khi chưa có đồng ý của nhóm.

## Tài liệu của A1 còn lại trên nhánh này

- `docs/reference/a1/`: đặc tả use-case và sequence của A1 (đầu vào để nhóm tự vẽ lại sơ đồ A2).
- `docs/scrum-process.md`: số liệu Scrum / git của A1.
- `docs/planning/` (các kế hoạch cũ), `docs/checkpoints/`: nhật ký lịch sử của A1. Chúng nhắc tới `backend/`, `frontend/` và nhiều file đã xóa khỏi nhánh này; đọc như tư liệu, không làm theo.
