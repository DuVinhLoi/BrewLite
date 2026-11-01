# Vercel + Render Deployment Implementation Plan — Task 5

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox syntax for tracking.

**Goal:** Khắc phục CD đang lỗi, tự chạy CI/CD khi push nhánh delivery, và lưu bằng chứng production, smoke, rollback theo CR-5.3/5.4 và AC-N18.1–3.

**Architecture:** `apps/web` lên Vercel; API image full commit SHA lên GHCR rồi Render; PostgreSQL kết nối nội bộ cùng region. Hiện CD chỉ chạy theo tag; thiết kế đích bổ sung push đúng nhánh `feat/assignment2-task5-delivery`, dùng lại quality workflow trên cùng commit trước khi publish/deploy. Giữ tag `a2-v*` để phát hành và giữ Git auto-deploy của Vercel/Render tắt.

**Tech Stack:** Next.js, NestJS, Prisma, PostgreSQL 16, Docker/GHCR, GitHub Actions, Vercel CLI 65.2.0, Render image service; Node theo `.nvmrc`.

## Global Constraints

- Task: CR-task5; branch `feat/assignment2-task5-delivery`; worktree `C:/BrewLite-a2-Task5`.
- Nguồn phạm vi: [CR-task5](../planning/handoff/2026-10-21-req-sync/CR-task5.md), [SRS](../requirements/srs.md), [ADR-004](../architecture/adr/004-vercel-render.md).
- Đây là kế hoạch, chưa cho biết deploy mới đã chạy. Không thay source, workflow, dependency hoặc cấu hình nền tảng trong lượt lập kế hoạch.
- Không merge PR, di chuyển tag cũ, reset DB, sửa migration cũ hoặc tự nâng gói trả phí.
- `/health` giữ contract `{status, database}`; kiểm đúng image qua metadata Render, không thêm version vào endpoint.
- Khi thực thi, chỉ chủ Task 5 ghi các file báo cáo bên dưới. Thay đổi code nếu phát sinh phải được giao rõ phạm vi trước.
- Yêu cầu mới của người dùng: lập kế hoạch tự chạy CI/CD khi push. Phạm vi triển khai đề xuất bổ sung `.github/workflows/ci.yml` bên cạnh `.github/workflows/cd.yml`; giao một owner Task 5 cho cả hai file khi triển khai. Đây là thay đổi cấu hình được mô tả trong kế hoạch, chưa áp dụng.
- Không ghi token, hook URL, DATABASE_URL hay JWT_SECRET vào repo/log/chat. Các bước dashboard do người có quyền thực hiện; có thể dùng skill wizard khi bước thực thi cần hướng dẫn nhập credential.

## Kết quả kiểm tra ngày 28/10/2026

Đã đọc source local và đối chiếu GitHub bằng lệnh chỉ đọc. Chưa kiểm tra lại runtime Render/Vercel trong lượt này; kết quả deploy tay dưới đây là bằng chứng lịch sử ngày 27/10.

| Hạng mục | Kết quả |
|---|---|
| HEAD local/remote delivery | `8b563bbc6700532bb560f52b1969cb26f6c9eed7`; worktree sạch trước khi thêm kế hoạch |
| Baseline | Remote `develop-Assignment2` là `4d35ee4e2968369eece0b7c2720ed7b10f80e56f`; delivery thiếu 0 commit, hơn 19 commit |
| PR tổng hợp | [PR #25](https://github.com/DuVinhLoi/BrewLite/pull/25) OPEN, chưa merge |
| Release hiện có | `a2-v0.2.0-rc.1` trỏ source `d8dcb870142cfba5fbe75038d33d2f438e77d391` |
| Khác biệt HEAD với source RC1 | Chỉ tài liệu/bằng chứng; code API/web, Dockerfile, CI/CD giống nhau |
| CR-5.1/5.2 | Source đã dùng fingerprint order/method, lookup có owner/order/key; có migration mới bỏ index key xuyên đơn; simulator bỏ UNAVAILABLE |
| CR-5.3 source | CD đã có quality → publish API → deploy-api/deploy-web → smoke; Docker CMD migrate trước server; hai file deploy VPS đã bị xóa |
| CD gần nhất trên GitHub | [Run 40475323601](https://github.com/DuVinhLoi/BrewLite/actions/runs/40475323601): quality SUCCESS; publish FAIL với `denied: permission_denied: write_package`; deploy/smoke SKIPPED |
| Secrets environment production | Hiện chỉ có `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`; thiếu `RENDER_DEPLOY_HOOK_URL`, `VERCEL_TOKEN` |
| Variables production | API `https://brewlite-a2-api.onrender.com`; web `https://brewlite-a2-web.vercel.app` |
| Environment policy | `production` và `release` hiện không có protection rules hoặc deployment branch policy; không có gate chặn tag delivery tại thời điểm đọc |
| Deploy/rollback trước đó | [Evidence](release-evidence.json) ghi manual deploy, smoke, rollback rồi restore RC1 PASS; chưa chứng minh đường deploy hook trong CI |

`CR-task5.md` mô tả nhiều trạng thái trước triển khai, vì vậy không dùng các câu “hiện tại” trong CR làm trạng thái source hôm nay. CR-5.0 và việc viết lại CD đã được thực hiện; phần cần hoàn tất là quyền/credential và bằng chứng CD thật.

## Task 1: Mở quyền publish và hoàn thiện credential

**Files:** Không sửa repository.

**Consumes:** Quyền quản trị package GitHub, service Render và project/team Vercel hiện hữu.

**Produces:** GITHUB_TOKEN publish được API image; bốn secret production có mặt và credential đúng service/project.

- [ ] GitHub → package `brewlite-api` → Package settings → Manage Actions access → thêm repository `DuVinhLoi/BrewLite`, chọn **Write**. Package public chỉ giúp Render đọc anonymous; không tự cấp quyền workflow ghi. Giữ `packages: write` và GITHUB_TOKEN trong job publish, không thay bằng PAT quyền rộng. [GitHub hướng dẫn cấp quyền workflow](https://docs.github.com/en/packages/learn-github-packages/configuring-a-packages-access-control-and-visibility).
- [ ] Render → service `brewlite-a2-api` → Settings → Deploy Hook: lấy URL đầy đủ, đặt secret `RENDER_DEPLOY_HOOK_URL` trong GitHub environment **production**. Hook phải thuộc service `srv-dbdms83ncjis73aodm1g`.
- [ ] Vercel → Account Settings → Tokens: tạo token CI có quyền deploy team/project `brewlite-a2-web`, đặt secret `VERCEL_TOKEN` trong cùng environment. Giữ hai ID đã có, xác minh project ID `prj_6BUoPh0TSriVnqrpLjZ1g0vijK3O`; không dùng session token của CLI thay token CI.
- [ ] Kiểm tra tên secret/variable và quyền GHCR qua lần publish tiếp theo. Danh sách secret không chứng minh giá trị hoặc quyền của token đúng:

```powershell
gh secret list --repo DuVinhLoi/BrewLite --env production
gh variable list --repo DuVinhLoi/BrewLite --env production
```

**Gate:** Có đủ bốn tên secret; variables đúng HTTPS production. Chưa rerun nếu credential chưa được điền.

## Task 2: Đối chiếu nền tảng trước release

**Files:** `docs/deployment.md` chỉ cập nhật nếu cấu hình thực tế thay đổi.

**Consumes:** Các resource hiện có; không tạo lại project/service/DB.

**Produces:** Checklist cấu hình và cặp deployment đang live để rollback.

- [ ] Render Postgres `brewlite-a2-db` và API cùng Singapore; API dùng Internal Database URL, không dùng external URL. Kiểm external access không mở công khai. Báo cáo cũ dùng allowlist `127.0.0.1/32`, ADR yêu cầu tắt external access; xác nhận cấu hình thực tế và ghi rõ, không suy diễn chỉ từ URL internal. [Render networking](https://render.com/docs/postgresql-creating-connecting).
- [ ] API default image repository là `ghcr.io/duvinhloi/brewlite-api`; auto-deploy off; health `/health`; `PORT=4000`; JWT ít nhất 32 ký tự; CORS đúng `https://brewlite-a2-web.vercel.app`.
- [ ] Docker Command override trống để image CMD chạy `npx prisma migrate deploy && node dist/main.js`. Không bật lại override migrate/seed của Pha A. Không chạy seed tự động mỗi deploy.
- [ ] Vercel Root Directory `apps/web`, framework Next.js, Node 24.x; Production `NEXT_PUBLIC_API_URL=https://brewlite-a2-api.onrender.com`; Git auto-deploy vẫn tắt. Workflow hiện chạy CLI từ repository root theo cấu hình project; không tự thêm `cd apps/web` vì có thể làm lệch cách resolve Root Directory.
- [ ] Ghi lại full image SHA/digest và Render deployment đang live, Vercel production deployment ID **ngay trước lần chạy mới**. Không mặc định các ID lịch sử vẫn đang live.
- [ ] Xác nhận ngày hết hạn DB thực tế. Metadata cũ ghi tạo 23/10, hết hạn **22/11/2026**; nếu ngày nghiệm thu muộn hơn, nhóm phải chọn và duyệt phương án duy trì dữ liệu trước hạn. Render xác nhận Free Postgres hết hạn sau 30 ngày. [Render Free](https://render.com/docs/free).

**Gate:** Đúng project/service/DB, runtime env, đường migration và rollback target. Chưa dùng smoke HTTP làm bằng chứng đúng revision.

## Task 3: Khôi phục CD RC1 trên workflow hiện có

**Files:** Không cần sửa `.github/workflows/cd.yml` hoặc `apps/api/Dockerfile` theo kết quả đọc hiện tại.

**Consumes:** Tasks 1–2; tag RC1 và source d8dcb87 đã có quality SUCCESS.

**Produces:** Run CD thật cho cùng source API/web của delivery hiện tại, không thay tag RC1.

- [ ] Chạy lại failed jobs của run hiện có sau khi hoàn thiện quyền/secret:

```powershell
gh run rerun 40475323601 --failed --repo DuVinhLoi/BrewLite
gh run watch 40475323601 --repo DuVinhLoi/BrewLite --exit-status
gh run view 40475323601 --repo DuVinhLoi/BrewLite --json status,conclusion,headSha,jobs,url
```

- [ ] Xác nhận publish push được `ghcr.io/duvinhloi/brewlite-api:d8dcb870142cfba5fbe75038d33d2f438e77d391`; không chỉ build thành công. Nếu package có chính sách tag immutable và từ chối push lại, dùng tag release mới của bước dưới thay vì xóa image/tag.
- [ ] Xác nhận `deploy-api` và `deploy-web` thực sự chạy. Render dùng `imgURL` URL-encoded; repository của image phải khớp default image, chỉ tag/digest được thay. Hook trả 200/202 chỉ nhận yêu cầu/đưa vào hàng đợi. [Render deploy hooks](https://render.com/docs/deploy-hooks).
- [ ] Vercel chạy CLI 65.2.0: pull Production → build `--prod` → deploy `--prebuilt --prod`. Nếu monorepo build lỗi, lấy log đã che secret, kiểm Root Directory/env trước khi đề xuất sửa workflow. [Vercel GitHub Actions](https://vercel.com/kb/guide/how-can-i-use-github-actions-with-vercel).

**Nếu cần phát hành đúng HEAD delivery thay vì phục hồi CD RC1:** sau khi commit/push tài liệu và quality cho SHA đã chọn đạt, tạo **tag mới**. Kiểm tra tag chưa tồn tại và biến SHA trước khi chạy các lệnh ghi bên dưới. Đề xuất `a2-v0.2.0-rc.2` nếu tên đó còn trống:

```powershell
git status --short
git ls-remote origin refs/heads/feat/assignment2-task5-delivery
git ls-remote --tags origin 'a2-v0.2.0-rc.2*'
$ReleaseSha = git rev-parse HEAD
git show --stat $ReleaseSha
# Chỉ tiếp tục khi worktree sạch, remote delivery khớp ReleaseSha,
# quality của ReleaseSha đạt và tag chưa tồn tại.
git tag -a a2-v0.2.0-rc.2 $ReleaseSha -m "BrewLite Assignment 2 delivery RC2"
git push origin a2-v0.2.0-rc.2
```

Không cần merge PR #25 hoặc chuyển sang main để deploy tag delivery. Rerun RC1 vẫn chạy source d8dcb87; không báo đó là deployment từ HEAD 8b563bb. Tag mới sẽ tạo image mới theo SHA commit được tag.

Task này kiểm quyền/credential trên pipeline cũ. Tự chạy theo push và chờ Render tự động thuộc Tasks 5–6; rerun RC1 không lấy workflow mới từ HEAD.

**Gate:** Publish, deploy-api, deploy-web và smoke đều SUCCESS; ghi rõ run attempt, source SHA/tag thực tế. Nếu chạy `--failed`, quality SUCCESS được kế thừa trên cùng SHA.

## Task 4: Nghiệm thu runtime và diễn tập rollback qua hook

**Files:** Ghi kết quả thực tế vào `docs/task5/release-evidence.json`, `docs/task5/release-notes.md`, `docs/planning/handoff/2026-10-21-req-sync/report-task5.md`; bổ sung ngày/kết quả vào `docs/deployment.md` và `docs/task5/verification.md`. Chủ Task 5 cập nhật cột Test NFR-18 trong `docs/traceability-matrix.md` sau khi có bằng chứng.

**Consumes:** Run mới và cặp rollback target vừa ghi ở Task 2.

**Produces:** Bằng chứng đáp ứng AC-N18.1–3 và URL demo đang hoạt động.

- [ ] Trên Render xác nhận deployment **live** và image full SHA đúng run, log migration thành công; trên Vercel xác nhận deployment READY và production alias trỏ đúng bản. Workflow hiện bỏ response hook và chưa poll deployment status; bước đối chiếu metadata này là gate vận hành bắt buộc, không phải thay đổi `/health`.
- [ ] Chạy smoke dưới bằng Git Bash sau khi Render live; mỗi endpoint retry tối đa khoảng 10 phút như workflow. Kiểm JSON health chính xác, products có 8 món demo và web mở được:

```bash
set -o pipefail
API_URL=https://brewlite-a2-api.onrender.com
WEB_URL=https://brewlite-a2-web.vercel.app
curl -fsS --connect-timeout 5 --max-time 15 --retry 60 --retry-delay 10 --retry-max-time 600 --retry-all-errors "$API_URL/health" | python -c 'import json,sys; d=json.load(sys.stdin); assert d=={"status":"ok","database":"up"}, d'
curl -fsS --connect-timeout 5 --max-time 15 --retry 60 --retry-delay 10 --retry-max-time 600 --retry-all-errors "$API_URL/products" | python -c 'import json,sys; d=json.load(sys.stdin); assert isinstance(d,list) and len(d)==8'
curl -fsS --connect-timeout 5 --max-time 15 --retry 60 --retry-delay 10 --retry-max-time 600 --retry-all-errors "$WEB_URL/" >/dev/null
```

- [ ] Mở trình duyệt production, kiểm menu tám món, request products không lỗi CORS, quantity picker và manifest. Bộ test checkout/integration đầy đủ dùng DB test trong quality; không chạy bộ test ghi dữ liệu lên DB production.
- [ ] Dùng đúng **deploy hook** đưa API về image trước; dùng Vercel CLI 65.2.0 rollback về deployment production trước; chờ live/READY và chạy lại smoke/browser. Theo [quy trình rollback](../deployment.md#rollback); secret cấp qua env, không in hook ra log. Vercel Hobby giới hạn rollback về production deployment liền trước, nên chọn target phù hợp. [Vercel rollback](https://vercel.com/docs/cli/rollback).
- [ ] Giữ schema/migration history; xác nhận image trước tương thích schema hiện tại. Sau diễn tập, khôi phục image release và promote lại deployment web đã tạo; smoke lại và ghi trạng thái cuối. Job `rollback-instructions` chỉ in hướng dẫn, không tự rollback khi CI lỗi.
- [ ] Lưu tag/full SHA, run URL/attempt, image digest, API/web deployment IDs, thời điểm giờ Việt Nam, kết quả từng smoke, rollback và restore. Giữ phân biệt chứng cứ manual ngày 27/10 với chứng cứ hook/CI mới; không thay failure lịch sử bằng một PASS không có run tương ứng.

**Gate:** AC-N18.1 có chuỗi CD thực thi; AC-N18.2 có smoke sau đúng deployments; AC-N18.3 có diễn tập và smoke; production kết thúc ở release mong muốn. Chỉ sau đó đề xuất nhóm review/merge PR #25 theo quy trình riêng.

## Task 5: Tự chạy CI/CD khi push delivery, không chạy quality hai lần cho một push

**Files:** Sửa `.github/workflows/cd.yml`, `.github/workflows/ci.yml` ở bước triển khai sau khi nhóm giao owner; lượt này chỉ sửa kế hoạch.

**Consumes:** CI reusable hiện có, quyền/credential Tasks 1–2, nhánh delivery đã xác định.

**Produces:** Một workflow Delivery tự chạy quality rồi deploy cùng commit khi push delivery. PR và nhánh khác không deploy production.

**Lựa chọn thiết kế:** Bổ sung trigger trực tiếp cho Delivery và giữ `quality.uses` hiện có là phương án đề xuất vì dùng lại source/quality cùng SHA. Bật native Git deployment ở Vercel/Render sẽ tạo đường deploy riêng trước quality nên không chọn. Chaining bằng `workflow_run` cần xử lý checkout head SHA và quyền khác context, không cần cho bài này.

| Sự kiện | Workflow đích | Có deploy production? |
|---|---|---|
| Push `feat/assignment2-task5-delivery` | Delivery, gọi CI reusable qua job quality | Có, sau quality SUCCESS |
| Push nhánh Task 5 khác đang được CI hỗ trợ | CI | Không |
| PR vào `develop-Assignment2` | CI kiểm PR | Không |
| Push `develop-Assignment2` | CI | Không trong phạm vi delivery hiện tại |
| Push tag `a2-v*` | Delivery, gọi CI reusable | Có, giữ AC-N18.1 |

- [ ] Trong `cd.yml`, thay khối trigger bằng nội dung dưới; giữ các job quality/publish/deploy/smoke và quyền job hiện có. Job publish tiếp tục `needs: quality`, không deploy khi lint/test đỏ:

```yaml
on:
  push:
    branches: ['feat/assignment2-task5-delivery']
    tags: ['a2-v*']
  workflow_dispatch:
```

- [ ] Trong `ci.yml`, thay khối trigger bằng nội dung dưới. Negative pattern đứng sau positive pattern; bỏ trigger tag standalone vì Delivery đã gọi CI. Giữ toàn bộ job CI cùng `workflow_call`:

```yaml
on:
  pull_request:
    branches: [develop-Assignment2]
  push:
    branches:
      - develop-Assignment2
      - 'feat/assignment2-task5-*'
      - '!feat/assignment2-task5-delivery'
  workflow_dispatch:
  workflow_call:
```

- [ ] Giữ `concurrency.group: production-delivery` và `cancel-in-progress: false`. Không hủy một deploy/migration đang chạy khi push tiếp; lần pending có thể được thay bằng push mới hơn. Không cam kết FIFO hay mọi commit trung gian đều được deploy khi push liên tiếp. Cơ chế này dùng chung cho branch và tag.
- [ ] Giữ checkout của quality/publish/web theo event SHA; image API dùng cùng `GITHUB_SHA`. Không checkout HEAD branch mới nhất giữa run, không lấy image `latest`, không tự tạo tag bằng GITHUB_TOKEN để làm cơ chế kích hoạt CD.
- [ ] Kiểm environment `release`/`production` cho phép đúng branch delivery và tag `a2-v*`. Nếu có reviewer bắt buộc thì run sẽ chờ duyệt; muốn tự deploy hoàn toàn phải cấu hình environment phù hợp với nhánh demo đã thống nhất. Không bật rule chỉ cho main rồi kỳ vọng delivery tự deploy.
- [ ] Sau khi pipeline push xanh, tag vẫn là lựa chọn phát hành có version. Nếu push branch và tag cùng SHA, có thể có hai run Delivery tuần tự; đây là hai sự kiện khác nhau, không phải lỗi CI trùng của một push.

**Gate:** Một push delivery tạo một run Delivery có quality, không tạo thêm standalone CI do sự kiện push đó. Khi PR đang mở, CI của sự kiện PR vẫn có thể chạy riêng vì kiểm merge context, không xóa check PR chỉ để giảm số run.

Nguồn: [GitHub trigger/filter](https://docs.github.com/en/actions/how-tos/write-workflows/choose-when-workflows-run/trigger-a-workflow), [reusable workflows](https://docs.github.com/en/actions/how-tos/reuse-automations/reuse-workflows).

## Task 6: GitHub chỉ xanh sau khi Render deploy xong

**Files:** `.github/workflows/cd.yml`; ưu tiên các step inline, chưa cần thêm framework hay dependency.

**Consumes:** Deploy hook, image SHA, Render service ID và quyền đọc trạng thái deployment.

**Produces:** `deploy-api` thất bại nếu deployment mới không live; smoke không lấy phản hồi image cũ làm kết quả của release mới.

- [ ] Bổ sung secret production `RENDER_API_KEY` có quyền đọc deployment của service; thêm variable `RENDER_SERVICE_ID=srv-dbdms83ncjis73aodm1g`. Đây là credential bổ sung cho bước chờ tự động, khác hai secret đang thiếu để pipeline cũ chạy được. Chỉ gắn credential này với job deploy-api, không chuyển vào quality, Docker build hoặc frontend.
- [ ] Giữ POST hook với `imgURL` đã encode, nhưng lưu HTTP status và JSON response trong runner, không bỏ response bằng `>/dev/null`. Kiểm response theo tài liệu Render trước khi parse deploy ID; không in hook URL hoặc toàn bộ response có thông tin nhạy cảm.
- [ ] Với HTTP 200, lấy deploy ID và poll `GET https://api.render.com/v1/services/{serviceId}/deploys/{deployId}` bằng Bearer token, mỗi 10 giây, deadline 600 giây. Chỉ SUCCESS khi deployment đó live và metadata image khớp tag/digest đã publish. Không kiểm `/health.version`.
- [ ] Với HTTP 202 không có ID, truy vấn deploy list theo service, đối chiếu image SHA và thời điểm request để nhận diện deployment mới; phải lấy được ID duy nhất trước khi nghiệm thu. Nếu không xác định chắc chắn thì fail có thông báo cụ thể, không lấy deployment cũ đang live. Kiểm schema của response hook/deploy/list theo API chính thức trong bước thực thi, không tự invent field.
- [ ] Dừng sớm khi status deployment báo lỗi hoặc bị hủy; fail khi quá deadline. Request API có timeout; lỗi 401/403 dừng ngay; lỗi 429/5xx retry trong cùng deadline. Log chỉ ID, trạng thái và image đã che dữ liệu nhạy cảm. Không tự POST lại hook chỉ vì poll chậm.
- [ ] Giữ `smoke.needs: [deploy-api, deploy-web]`, Vercel deploy `--prebuilt --prod` và ba kiểm nội dung hiện có. Giữ hướng dẫn rollback khi lỗi; workflow hiện không thực hiện rollback tự động và kế hoạch này không bổ sung rollback tự động.
- [ ] Kiểm trên fixture response đã lọc secret: 200 + live đúng image phải đạt; live image cũ phải thất bại; trạng thái failed/canceled phải thất bại; polling quá hạn phải thất bại; 202 thiếu ID không được coi là deploy thành công. Không inject lỗi vào production để kiểm nhánh lỗi.

Nếu chưa cung cấp RENDER_API_KEY, chỉ có thể chạy mô hình cũ với bước xác nhận metadata thủ công ở Task 4. Không gọi mô hình đó là đã hoàn tất mục tiêu chờ deploy tự động.

Nguồn: [Render hook trả 200/202 và ID](https://render.com/docs/deploy-hooks), [Retrieve deploy](https://api-docs.render.com/reference/retrieve-deploy), [List deploys](https://api-docs.render.com/reference/list-deploys).

## Task 7: Kiểm chứng push tự chạy và bàn giao

**Files:** `README.md`, `docs/deployment.md`, các file evidence/report ở Task 4. Báo chủ Task 3 bổ sung ADR-004 về trigger branch; giữ trigger tag theo SRS nên không bỏ AC-N18.1.

**Consumes:** Tasks 5–6 đã review, credential/platform sẵn sàng, quyền push nhánh delivery.

**Produces:** Bằng chứng một push thực sự đưa đúng commit lên hai nền tảng và smoke xanh.

- [ ] Chạy actionlint cho hai workflow, parse YAML và kiểm shell blocks. Dùng tool có sẵn hoặc phiên bản cố định; không thay application dependency/build config chỉ để lint workflow.
- [ ] Chạy fixture checks cho bước chờ Render; kiểm bằng dữ liệu mô phỏng rằng quality thất bại chặn publish/deploy. Không cố ý push test hỏng lên delivery production; `needs: quality` và CI đỏ ở nhánh kiểm tra là bằng chứng cần dùng.
- [ ] Commit/push hai workflow và tài liệu trên delivery sau review. Không dùng rerun RC1 làm bằng chứng cho trigger mới vì nó vẫn chạy workflow cũ. Mỗi commit delivery sau thay đổi trigger đều có thể tự deploy, kể cả commit chỉ đổi docs; chuẩn bị credential trước push.

```powershell
git branch --show-current
git status --short
git diff --check
git diff --name-status
# Sau khi review, commit và push thay đổi đã được giao phạm vi:
git push origin feat/assignment2-task5-delivery
gh run list --repo DuVinhLoi/BrewLite --workflow cd.yml --branch feat/assignment2-task5-delivery --limit 5 --json databaseId,headSha,event,status,conclusion,url
```

- [ ] Chọn đúng run có `event=push` và `headSha` bằng SHA vừa push, watch tới khi kết thúc. Kiểm quality, publish, deploy-api, deploy-web, smoke đều SUCCESS; không diễn giải job `rollback-instructions` SUCCESS là deploy thành công.
- [ ] Xác nhận image full SHA, Render deployment live, Vercel deployment/alias và smoke/browser; diễn tập rollback nếu bản triển khai mới thay đổi quy trình. Lưu bằng chứng vào report/release notes thay vì chỉ ảnh dấu tick xanh.
- [ ] Kiểm CI vẫn chạy cho PR và branch CI-only; không có deployment production từ các sự kiện đó. Kiểm trigger tag bằng tag mới `a2-v*` khi thực hiện release, không di chuyển tag RC1 để làm sạch deployment cũ.
- [ ] Giữ run RC1 thất bại làm lịch sử, có thể rerun sau sửa quyền để tạo attempt xanh trên cùng source. Mục tiêu vận hành là run mới đúng commit xanh; không xóa record lỗi hoặc sửa check status thủ công.

**Gate cuối:** Push delivery → quality → publish → deploy đúng revision → smoke SUCCESS không cần bấm deploy tay; tag release tiếp tục hoạt động; PR chỉ CI; secret không xuất hiện trong repo/log. Chưa có run thực tế đạt chuỗi này thì báo trạng thái chưa nghiệm thu.

## Kiểm tra và bàn giao tài liệu

- [ ] Chạy kiểm tra sau khi cập nhật bằng chứng, xem toàn bộ path thay đổi và xác nhận một writer mỗi file:

```powershell
python docs/validate_task2.py
git diff --check
git diff --name-status
git status --short
```

- [ ] Không sửa app/workflow thì không cần chạy lại local suite chỉ vì thêm tài liệu. Nếu phát sinh sửa code, chạy các lệnh CR-5.6 theo đúng card trước khi tag mới, integration dùng DB test riêng.
- [ ] Handoff ghi task CR-task5, branch/worktree, SHA release, file đã sửa, lệnh/kết quả chính xác và blocker còn lại. Kế hoạch này chỉ thêm một file trong `docs/task5/`, chưa commit và chưa deploy.
