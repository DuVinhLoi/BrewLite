# Workflow nhiều agent (worktree)

Áp dụng khi một plan chia việc cho nhiều agent cùng lúc. Có ba vai:

- **Integrator:** dựng worktree, chạy cổng, merge branch task vào branch tích hợp. Là người duy nhất ghi ledger.
- **Dispatcher:** người dùng, giao từng Task Card cho agent.
- **Worker:** agent làm đúng một card.

## Worker phải tuân

1. **Một worktree, một người ghi.** Chỉ làm việc trong worktree của card mình. Trước khi sửa, kiểm `git branch --show-current` đúng tên branch của card.
2. **Chỉ sửa allowed paths của card.** Với file dùng chung, chỉ sửa đúng vùng (mục) đã khai. Cần sửa ngoài vùng thì không tự sửa: ghi change request `CR-<card>.md` gồm đoạn cũ, đoạn mới và lý do vào thư mục handoff của plan.
3. **Mỗi file có một chủ trong một wave.** Ngoại lệ phải được khai trong plan, kèm các vùng không liền kề nhau.
4. **Cấm lệnh git:**
   - push, merge, rebase, `checkout` / `switch` sang branch khác;
   - `reset --hard`, `clean`, các lệnh `worktree`;
   - `stash`: stash dùng chung cho mọi worktree của repo.
5. **Cấm đụng tài nguyên dùng chung:**
   - sửa `package*.json`, chạy `npm install` (Integrator đã chạy `npm ci`);
   - chạy `docker compose` hoặc dev server: cổng 3000 / 5432 dùng chung;
   - `graphify update`;
   - sửa file ở worktree khác, ở checkout chính hoặc ở `~/.claude`.
6. **Đầu vào:**
   - đọc `.claude/rules/doc-code-sync.md`;
   - chạy `graphify query "<câu hỏi>"` trước khi đọc code;
   - dùng Edit/Write cho text có `\` (PlantUML);
   - render PlantUML ra thư mục tạm, không ghi ảnh vào repo.
7. **Commit trên branch của card**, đúng message trong card, không có trailer `Co-Authored-By`.
8. **Trước khi báo xong:**
   - `git status --porcelain` sạch, chỉ được còn các file Integrator chép vào (`CLAUDE.md`, `.claude/settings.json`);
   - `git diff --name-only <branch tích hợp>...HEAD` nằm trong allowed paths;
   - đã chạy các lệnh acceptance;
   - đã ghi report: hash commit, danh sách file, dòng tổng kết của từng lệnh, output test đỏ (nếu là TDD), rủi ro.
9. **Trả về** `DONE` / `DONE_WITH_CONCERNS` / `BLOCKED` / `NEEDS_CONTEXT`, kèm đường dẫn report. Không tự gọi thêm agent con.

## Integrator chạy cổng trước khi merge mỗi branch

- **G1:** worktree sạch, đúng branch.
- **G2:** file đổi nằm trong allowed paths. File dùng chung không bị sửa ra ngoài vùng đã khai.
- **G3:** không có trailer `Co-Authored-By`.
- **G4:** report có đủ bằng chứng.
- **G5:** `git merge --no-ff` vào branch tích hợp.
  - Có conflict thì `git merge --abort`, ghi ledger, trả card về worker.
  - Conflict chỉ ở tài liệu, trong vùng đã khai: Integrator tự giải và ghi ledger.
- **G6:** sau khi merge, chạy lại test của phần bị đụng và render PlantUML.

Tối đa 3 vòng sửa một card. Quá 3 vòng thì ghi `Ruling:` vào ledger và báo người dùng.

Merge vào `develop` / `main` và mọi lệnh push chỉ làm khi người dùng đồng ý.

## Ledger (chỉ Integrator ghi)

Mỗi card một dòng: agent / công cụ, bắt đầu, xong, số vòng sửa, số lần test đỏ trước khi xanh, conflict khi merge, file ngoài phạm vi bị chặn, token. Thêm một dòng `Ruling:` cho mỗi quyết định Integrator tự đưa ra. Cuối đợt có một dòng nhận xét: chạy song song có đáng không, lần sau tăng hay giảm số agent.
