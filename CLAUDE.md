## Nhánh develop-Assignment2: tài liệu soạn được, code chỉ khi được yêu cầu

Nhánh này chuẩn bị cho đề `docs/Assignment2-BrewLite.md`. Giảng viên cấm vibecoding: agent được soạn nháp tài liệu Task 1–3 (SRS, sơ đồ, ADR); **code trong `apps/`, `tests/`, `.github/workflows/` chỉ viết khi người dùng yêu cầu rõ**. Đọc `.claude/rules/doc-code-sync.md` và `docs/planning/2026-10-15-assignment2-plan.md` trước khi sửa.

## graphify

`graphify-out/` đã bị xóa khỏi nhánh này, nên chưa có knowledge graph. Không chạy `graphify query` / `graphify update` khi `graphify-out/graph.json` chưa tồn tại. Khi nhóm đã viết code trong `apps/`, dựng lại bằng `graphify update .` rồi áp dụng quy tắc của nhánh `develop` (query / path / explain trước khi đọc code).
