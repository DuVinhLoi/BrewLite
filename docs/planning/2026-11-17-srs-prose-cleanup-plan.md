# Plan: sửa văn phong SRS cho tự nhiên, bớt dấu hiệu văn AI (2026-11-17)

## 1. Mục tiêu

Rà toàn bộ `docs/requirements/srs.md` theo một checklist 6 dấu hiệu văn AI (mục 3) và viết lại phần văn xuôi cho gọn, tự nhiên, nhất quán. Mục 1.4 còn có một lỗi nội dung phải sửa ngay trong đợt này: bullet về Won't chỉ kể 5 trong 9 yêu cầu (thiếu FR-28, FR-30, FR-31, FR-32).

Đây là tài liệu Task 1, agent được soạn nháp (`.claude/rules/doc-code-sync.md`). Không đổi hành vi, không đổi phạm vi, không viết code. Nhóm đọc lại và chốt trước khi merge.

## 2. Quyết định đã chốt với người dùng

- **Phương án 2:** rà toàn SRS theo checklist, sửa văn xuôi từng mục. Không đụng nội dung kiểm chứng của tiêu chí chấp nhận.
- **Một commit duy nhất** chứa toàn bộ thay đổi của đợt này (`srs.md` và file plan này). Không tách commit theo mục, không commit "fix" chồng lên.
- **Nhánh:** `a2/srs-prose`, tạo từ `origin/main` sau `git fetch origin` (main local hay cũ). Một nhánh, một người viết; không cần worktree riêng.
- **Thuật ngữ chuẩn:** gọi phạm vi được nộp là **"bản nộp"**. Bỏ "bản hiện tại", "bản tối thiểu", "baseline"; "MVP" chỉ còn trong bảng thuật ngữ, ghi rõ tài liệu gọi là "bản nộp".
- **Dấu nháy:** thống nhất `Won't` (nháy thẳng `'`).
- **Tên diagram giữ tiếng Anh** (người dùng chốt sau review): class diagram, use-case diagram, sequence diagram, activity diagram; không dùng "sơ đồ lớp", "sơ đồ".
- Merge và push chỉ làm khi người dùng đồng ý.

## 3. Checklist 6 dấu hiệu (dùng cho mọi mục)

| Mã | Dấu hiệu | Cách sửa |
|---|---|---|
| S1 | Một khái niệm nhiều tên ("bản hiện tại", "bản tối thiểu", "MVP", "Won't bản nộp") | Dùng đúng một tên theo mục 2 |
| S2 | Câu rào đón, chặn trước cách hiểu sai ("điều này không có nghĩa là…", "không cần…") | Viết thành câu khẳng định điều đúng, bỏ phần phủ định thừa |
| S3 | Mảnh vá sau review: lý do lẻ cho 1–2 mã, chú "(Must)" rải khắp nơi, ý lặp giữa các mục | Bỏ, hoặc dời về đúng chỗ (mô tả của chính FR đó) |
| S4 | Dồn ngoặc và tham chiếu, mẫu ba vế "X ở A, Y ở B, Z ở C" | Tách câu; giữ tham chiếu cần thiết, bỏ tham chiếu lặp |
| S5 | Nhãn in đậm đứng trước câu trong đoạn văn; tiếng Anh chen không cần ("simulator", "shortage", "decimal string", "free") | Bỏ nhãn hoặc biến thành câu chủ đề; dịch từ không phải thuật ngữ |
| S6 | Tiêu chí viết kiểu ghi chú cụt ("Chủ đơn PATCH CANCELLED ở PENDING/PAYMENT_FAILED trả 200"), tên định danh không có backtick | Viết lại theo khuôn "Khi … thì …" như các AC khác, bọc định danh bằng backtick |

## 4. Ràng buộc (không được đổi)

- Mọi mã: `FR-xx`, `NFR-xx`, `AC-Fxx.n`, `AC-Nxx.n`, `BR-xx`, `UC-xx`, `R-xx`, `A-xx`, `ADR-xxx`, `S1`–`S6`. Không thêm, bỏ hay đánh lại số.
- Số mục và thứ tự heading (kể cả `3.5a`), thứ tự các mục đánh số trong mục 8. Tên heading được đổi chữ, không đổi số (các file khác dẫn "SRS mục 1.4", "mục 8"; không có link anchor `srs.md#…`, đã kiểm bằng `grep -rn "srs.md#"`).
- Mọi giá trị kiểm chứng: số, đơn vị, mã HTTP, mã lỗi, endpoint, tên trường, mã VNPay, ngưỡng thời gian.
- Mọi chuỗi giao diện trong ngoặc kép (test so khớp nguyên văn).
- Tên use-case ở cột "Tên use-case" mục 2.3 phải khớp `docs/requirements/use-case-overview.puml` (ví dụ UC-06 là "Hủy đơn chưa trả").
- Nội dung bảng 3.2, 3.4, 3.5 (BR), bảng QueryDR cuối FR-16 và các AC của FR-14 đến FR-16: chỉ sửa dấu nháy và lỗi chính tả, không viết lại câu. Phần này dày nhưng chính xác; viết lại dễ lệch nghĩa. Ngoại lệ duy nhất: AC-F15.3 viết lại theo Bước 5 (reviewer đã xác nhận cùng nghĩa).
- Chỉ sửa `docs/requirements/srs.md` và file plan này. File khác cần đổi theo thì ghi vào mục "Còn lại" của báo cáo, không tự sửa.

## 5. Các bước

Mỗi bước sửa một vùng; làm tuần tự, **không commit giữa chừng**.

### Bước 0. Chuẩn bị

Nhánh và worktree đã tạo ngày 2026-11-17: nhánh `a2/srs-prose` tại `62c71a2` (`origin/main`), worktree `.worktrees/srs-prose`. Trước khi sửa, kiểm lại:

```bash
cd .worktrees/srs-prose
git branch --show-current                 # a2/srs-prose
git fetch origin && git rev-list --count HEAD..origin/main   # 0; khác 0 thì báo người dùng trước
git show origin/main:docs/requirements/srs.md > "$SCRATCH/srs-before.md"   # bản gốc để đối chiếu ở bước 9
```

`$SCRATCH` là thư mục scratchpad của phiên, không ghi file tạm vào repo.

### Bước 1. Mục 1.3 và 1.4

- 1.3: "Bắt buộc có trong MVP" → "Bắt buộc có trong bản nộp"; dòng Should "thiếu thì MVP vẫn chạy" → "thiếu thì bản nộp vẫn chạy"; dòng Won't chỉ trỏ "mục 5.9" (S1, S4).
- 1.4: thay toàn bộ bằng đoạn dưới (đổi tên heading, giữ số 1.4). Bản này sửa lỗi thiếu 4 mã Won't, bỏ câu lẻ về FR-25/FR-29 (S3), bỏ câu rào đón (S2), bỏ nhãn đậm "VNPay sandbox." (S5), bỏ câu riêng về FR-31 vì đã nằm trong danh sách 9 mã.

```markdown
### 1.4 Phạm vi bản nộp

Bản nộp làm 23 yêu cầu Must: FR-01 đến FR-16, FR-20 đến FR-25 và FR-29. Chín yêu cầu còn lại (FR-17 đến FR-19, FR-26 đến FR-28, FR-30 đến FR-32) là Won't; mục 5.9 ghi lý do và cách kiểm chứng từng yêu cầu. Các mã này giữ nguyên số và không có giao diện, endpoint hay dữ liệu mẫu đi kèm.

Khi nghiệm thu chỉ xét NFR mức Must, và chỉ trên các endpoint, luồng thuộc bản nộp.

Đề A2 §4.3 yêu cầu class diagram ở Task 2 mô hình hóa `Promotion` và `LoyaltyTransaction` đủ thuộc tính, quan hệ và multiplicity, dù bản nộp không làm tính năng khuyến mãi và điểm thưởng.

Thanh toán dùng VNPay sandbox (ADR-007). `POST /payments` chỉ tạo một `Payment` ở trạng thái `PENDING` và trả về URL đã ký, không quyết định kết quả. Khách trả tiền trên trang VNPay, sau đó hệ thống nhận kết quả qua IPN hoặc tự hỏi lại bằng QueryDR (BR-10, BR-11). Quy ước chi tiết ở mục 3.4, hành vi ở FR-14 đến FR-16; rủi ro liên quan là R-13 đến R-15 trong [context-and-scope](context-and-scope.md).
```

- 1.5 câu cuối: viết lại cho rõ vì sao có khoảng trống trong dãy mã, ví dụ "Mã của tiêu chí, quy tắc và luồng đã bỏ không được dùng lại, nên dãy số có chỗ trống (ví dụ không có BR-06, AC-F15.2)." Kiểm lại ví dụ bằng grep trước khi viết.

### Bước 2. Mục 2 (actor, danh mục use-case)

- 2.1 dòng Customer: "hủy đơn chưa trả (FR-25, Must)" → "hủy đơn chưa thanh toán (FR-25)" (S3).
- 2.3 dòng UC-04: "FR-17/18 ngoài bản nộp" → "FR-17, FR-18 (Won't)".
- 2.3 dòng UC-06: tên giữ "Hủy đơn chưa trả" (khớp `.puml`); cột actor "Customer; VNPay sandbox (khi phải đối soát payment quá hạn)"; cột yêu cầu "FR-25; FR-26 (Won't)". Bỏ cụm "Barista chỉ ở phần FR-26 ngoài phạm vi" và "hủy đơn đã trả/hoàn tiền vẫn ngoài phạm vi" (S3, S4).
- 2.3 các dòng "— ngoài bản nộp, không vẽ trong sơ đồ": giữ ý, nhưng gom lại thành câu dưới bảng (dòng 89 đã nói) thay vì lặp ở từng dòng tên use-case.

### Bước 3. Mục 3 (quy ước)

- 3.1 dòng `PATCH /orders/:id`: "(hủy theo FR-25 Must)" → "(hủy theo FR-25)".
- 3.1 đoạn "**Trường thanh toán trong `GET /orders/:id`.**": giữ (đây là tiêu đề nhỏ, không phải nhãn thừa).
- 3.4 câu mở đầu: giữ ý, tách nếu dồn tham chiếu.
- 3.5a: "Nguyên liệu tracked là nguyên liệu được theo dõi số lượng (`Ingredient.tracked`)" → "Nguyên liệu được theo dõi số lượng (`Ingredient.tracked = true`) gọi tắt là nguyên liệu `tracked`." "decimal string" → "chuỗi số thập phân" (S5).
- 3.6: không sửa câu, chỉ thống nhất dấu nháy.

### Bước 4. Mục 4 (bảng tóm tắt)

- Dòng 6: "(Won’t bản nộp)" → "(Won't)".
- Dòng 8: "FR-23, FR-24 (Must); FR-25 (Must); FR-26, FR-27 (Won’t bản nộp)" → "FR-23, FR-24, FR-25 (Must); FR-26, FR-27 (Won't)" (S3).
- Câu dưới bảng: "Won’t bản nộp: FR-17, …" → "Won't: FR-17 đến FR-19, FR-26 đến FR-28, FR-30 đến FR-32." Giữ nguyên câu đếm tổng (32 FR, 20 NFR).

### Bước 5. Mục 5 (FR): chỉ các AC viết kiểu ghi chú cụt (S6)

Viết lại theo khuôn "Khi … thì …", giữ nguyên mọi giá trị. Bản đề xuất:

- **AC-F04.4** câu cuối: "Khi lần kiểm lúc bấm thêm thấy giỏ dự kiến thiếu nguyên liệu thì…" → "Khi bấm thêm mà lần kiểm cho thấy giỏ dự kiến thiếu nguyên liệu thì…".
- **AC-F05.4** "kiểm availability cho cả giỏ dự kiến" → "kiểm khả năng bán (availability) cho cả giỏ dự kiến".
- **AC-F11.2:** "Mọi đơn mới có `inventoryTracked=true` và snapshot `OrderIngredient` tổng hợp. Khi đặt 2 ly Matcha S với công thức 3g matcha, 150ml sữa không đường, 20ml syrup thì `reserved` tăng đúng 6g matcha, 300ml sữa không đường, 40ml syrup, `onHand` chưa đổi. Sửa công thức sau đó không làm đổi snapshot này."
- **AC-F11.3:** "Khi có lỗi sau bước giữ kho hoặc lúc tạo `OrderItem` thì toàn bộ thao tác rollback: không có đơn hay snapshot mới, mọi `onHand`/`reserved` không đổi."
- **AC-F13.4** "Khi availability báo shortage" → "Khi kiểm khả năng bán báo thiếu nguyên liệu".
- **AC-F15.3:** "Khi thanh toán thất bại thì `onHand`, `reserved` và snapshot giữ nguyên; đơn giữ `OrderItem` và hiện trong lịch sử ở trạng thái `PAYMENT_FAILED`. `Payment FAILED` (kể cả `EXPIRED`) không nhả nguyên liệu. Thử lại cùng `orderId` không giữ thêm nguyên liệu."
- **AC-F24.2:** "Khi Customer gửi trạng thái `PREPARING`, `READY` hoặc `COMPLETED` thì trả 403 `FORBIDDEN`; không có token thì trả 401. Customer chỉ hủy được đơn của mình theo AC-F25.1 và AC-F25.2. Thao tác bị từ chối không đổi trạng thái đơn hay số dư."
- **AC-F24.4:** bọc định danh bằng backtick (`GET /orders/:id`, `PATCH`, `PREPARING`/`READY`/`COMPLETED`, `PAID`).
- **AC-F25.1:** "Khi chủ đơn gửi `PATCH /orders/:id` với `{ "status": "CANCELLED" }` cho đơn `PENDING` hoặc `PAYMENT_FAILED` thì trả 200. Đơn `inventoryTracked=true` giảm `reserved` theo snapshot, `onHand` không đổi; gọi lại lần hai trả 409 và không nhả nguyên liệu lần nữa. Đơn `inventoryTracked=false` chỉ hoàn `Product.stock` theo vòng đời cũ, không đổi nguyên liệu."
- **FR-25 mô tả:** bọc `PENDING`/`PAYMENT_FAILED`, `onHand` bằng backtick.
- 5.9: chỉ sửa dấu nháy. Cột "Lý do không làm" có 4 dòng ghi "Ngoài bản nộp" (lý do vòng tròn); **không tự viết lý do mới**, ghi thành câu hỏi cho nhóm ở mục 7 của plan.

### Bước 6. Mục 6 (NFR)

- AC-N02.2 "dịch vụ free đang ngủ" → "dịch vụ gói miễn phí đang ngủ".
- AC-N13.1, AC-N16.1, AC-N16.3: bọc định danh bằng backtick (`Order`, `OrderItem`, `OrderIngredient`, `reserved`, `onHand`, `SEED_DEMO_USERS=true`, `Product.stock`); thêm "Khi …" nếu câu cụt. Giữ nguyên giá trị.

### Bước 7. Mục 8 (quyết định phạm vi)

Giữ 9 mục và số thứ tự.

- Mục 1: bỏ câu "FR-25 và FR-29 là Must." (lặp mục 1.4).
- Mục 2: "FR-23, FR-24, FR-25, FR-29 là Must; các yêu cầu Won't ở mục 5.9." → "23 yêu cầu Must và 9 yêu cầu Won't, liệt kê ở mục 1.4; lý do Won't ở mục 5.9."
- Mục 6: "bản tối thiểu" → "bản nộp".
- Mục 8: "không cần mô tả FR-26" → "sơ đồ không cần thể hiện FR-26".
- Mục 9: giữ nội dung; nếu tách thành câu ngắn thì không bỏ hạng mục nào trong danh sách.

### Bước 8. Mục 9 (thuật ngữ) và toàn file

- Dòng MVP: thêm "Tài liệu này gọi là **bản nộp**."
- Thêm dòng **Replay**: "Nhánh của `POST /payments` trả lại kết quả đã có thay vì tạo giao dịch mới (BR-05): kết quả `Payment SUCCESS` của cùng một yêu cầu (nhánh 1), hoặc URL và thời hạn của `Payment PENDING` còn hạn cùng `paymentMethod`, kể cả khi key mới (nhánh 4). Trả 200, không ký lại, không gọi VNPay." (từ này dùng nhiều ở FR-14 đến FR-16 nhưng chưa định nghĩa; gửi lại cùng key sau `Payment FAILED` không phải replay, xem AC-F16.5).
- Toàn file: thay mọi `’` bằng `'`. Dùng Edit/Write, không dùng `sed` qua heredoc (xem memory về backslash).

### Bước 9. Kiểm tra (chạy hết trước khi commit)

```bash
F=docs/requirements/srs.md; B="$SCRATCH/srs-before.md"
# 1. Dấu nháy cong: phải ra 0
grep -c "’" $F
# 2. Thuật ngữ cũ: chỉ được còn dòng MVP trong mục 9
grep -n "bản hiện tại\|bản tối thiểu\|Baseline\|MVP\|Won't bản nộp" $F
# 3. Tập mã giữ nguyên: diff phải rỗng
diff <(grep -oE '\b(FR|NFR|BR|UC|R|A|ADR)-[0-9.]+|AC-[FN][0-9]+\.[0-9]+' $B | sort -u) \
     <(grep -oE '\b(FR|NFR|BR|UC|R|A|ADR)-[0-9.]+|AC-[FN][0-9]+\.[0-9]+' $F | sort -u)
# 4. Chuỗi giao diện trong ngoặc kép: diff chỉ được có dòng thêm (">"), không có dòng mất ("<")
diff <(grep -oE '"[^"]+"' $B | sort -u) <(grep -oE '"[^"]+"' $F | sort -u)
# 5. Định danh trong backtick: không được mất định danh nào (chỉ thêm)
diff <(grep -oE '`[^`]+`' $B | sort -u) <(grep -oE '`[^`]+`' $F | sort -u) | grep '^<'
# 6. Số mục heading giữ nguyên
diff <(grep -oE '^#+ [0-9]+(\.[0-9]+)?[a-z]?|^#### (FR|NFR)-[0-9]+' $B) <(grep -oE '^#+ [0-9]+(\.[0-9]+)?[a-z]?|^#### (FR|NFR)-[0-9]+' $F)
# 7. Khoảng trắng và phạm vi file
git diff --check
git status --porcelain     # chỉ srs.md và file plan này
# 8. Đọc diff theo từ để soát nghĩa
git diff --word-diff $F
```

Lệnh 5 có thể báo mất token khi một định danh được viết lại trong câu mới (ví dụ `Won’t` cong trong backtick); mỗi dòng `<` phải giải thích được trong báo cáo.

Sau đó cho một reviewer (subagent `opus`, người dùng đã chọn) đọc `git diff --word-diff` với câu hỏi duy nhất: "Có câu nào đổi nghĩa, đổi giá trị hay bỏ điều kiện không?". Có thì sửa lại trước khi commit.

### Bước 10. Commit duy nhất

```bash
git add docs/requirements/srs.md docs/planning/2026-11-17-srs-prose-cleanup-plan.md
git commit -m "docs(requirements): tighten SRS prose and fix Won't scope list" \
  -m "Rewrite section 1.4 to list all nine Won't requirements, unify the term for the submitted scope, normalize apostrophes, and rewrite note-style acceptance criteria as Khi/thì sentences. No requirement IDs, values, or UI strings changed."
git log -1 --format=%B | grep -i co-authored-by   # phải không ra gì
```

Không có trailer `Co-Authored-By`. Nếu phát hiện lỗi sau khi commit, sửa rồi `git commit --amend` (nhánh chưa push), để vẫn giữ một commit. Không push, không mở PR khi chưa có đồng ý của người dùng.

## 6. Người thực hiện

Một người viết duy nhất vì chỉ có một file. Người viết: subagent `sonnet` (cần phán đoán văn phong). Reviewer ở bước 9: subagent `opus` (người dùng chọn ngày 2026-11-17). Chỉ bắt đầu sửa khi người dùng báo "proceed".

## 7. Câu hỏi mở cho nhóm (không tự sửa trong đợt này)

- Mục 5.9, cột "Lý do không làm" của FR-17, FR-18, FR-19, FR-26, FR-27 ghi "Ngoài bản nộp" là lý do vòng tròn. Nhóm nên ghi lý do thật (thời gian, ưu tiên luồng chính, phụ thuộc VNPay refund…).
- `docs/requirements/README.md:3` nói "các quyết định và phần phụ thuộc nằm ở SRS mục 1.4 và 8". Sau khi đổi tên mục 1.4 thành "Phạm vi bản nộp", câu này vẫn đúng ý nhưng có thể sửa chữ ở đợt sau.
- `context-and-scope.md`, `uc-*.md` và ADR có thể còn dùng "bản tối thiểu", `Won’t` cong; ngoài phạm vi commit này.
