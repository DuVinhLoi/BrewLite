## Nhánh develop-Assignment2: chỉ tài liệu, không code

Nhánh này chuẩn bị cho đề `docs/Assignment2-BrewLite.md`. Giảng viên cấm vibecoding: **không viết code trong `apps/`, `tests/`, `.github/workflows/`** (chỉ được sửa `README.md` mô tả cần nộp gì). Đọc `.claude/rules/doc-code-sync.md` và `docs/planning/2026-10-15-assignment2-plan.md` trước khi sửa.

## graphify

`graphify-out/` đã bị xóa khỏi nhánh này, nên chưa có knowledge graph. Không chạy `graphify query` / `graphify update` khi `graphify-out/graph.json` chưa tồn tại. Khi nhóm đã viết code trong `apps/`, dựng lại bằng `graphify update .` rồi áp dụng quy tắc của nhánh `develop` (query / path / explain trước khi đọc code).
