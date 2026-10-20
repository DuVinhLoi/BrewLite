# Task 3.2 – Deployment diagram (production)

> Bản nháp do AI soạn để nhóm sửa. Nền tảng Render + GitHub Container Registry là **đề xuất**; sửa sơ đồ nếu nhóm dùng nền tảng khác (xem [ADR-006](architecture/adr/006-deployment-platform.md)).

Tệp nguồn: `diagrams/deployment.mmd` · ảnh kết xuất: `diagrams/deployment.svg`, `diagrams/deployment.png`.

```mermaid
flowchart LR
  subgraph LOCAL["Local (máy lập trình viên)"]
    DC["docker-compose.yml<br/>web :3000 · api :4000 · postgres :5432"]
  end
  subgraph CI["CI/CD (GitHub Actions)"]
    PIPE["ci.yml: install → lint → test → build<br/>cd.yml: image → push → migrate → deploy → smoke test"]
    SEC["GitHub Secrets"]
  end
  REG[("Container registry<br/>ghcr.io/&lt;org&gt;/brewlite-*:&lt;commit-sha&gt;")]
  subgraph PROD["Production (nền tảng PaaS: Render, đề xuất)"]
    subgraph PUB["Vùng public"]
      WEB["«container» web<br/>Next.js/PWA :3000<br/>(CDN/edge của nền tảng)"]
      API["«container» api<br/>NestJS :4000<br/>GET /health · log stdout"]
    end
    subgraph PRIV["Vùng private (không public)"]
      DB[("«database» PostgreSQL :5432<br/>persistent disk · backup")]
    end
    ENV["Environment variables / secrets<br/>DATABASE_URL, JWT_SECRET, API_URL"]
    LOGS["Platform logs"]
  end
  USER["Thiết bị người dùng<br/>Trình duyệt / PWA"]

  USER -- "HTTPS 443" --> WEB
  USER -- "HTTPS 443 (REST + JWT)" --> API
  WEB -. "SSR/fetch HTTPS" .-> API
  API -- "TCP 5432 (mạng nội bộ, TLS)" --> DB
  PIPE -- "docker push" --> REG
  PIPE -- "deploy (secret CI)" --> PROD
  SEC -.-> PIPE
  REG -- "pull image" --> PROD
  ENV -.-> API
  ENV -.-> WEB
  API -- "stdout" --> LOGS
  PIPE -- "smoke test GET /health" --> API
```

## Giải thích
| Thành phần | Vai trò | Cổng / giao thức | Truy vết |
|---|---|---|---|
| Thiết bị người dùng | Chạy trình duyệt/PWA | HTTPS 443 | Web (Next.js) |
| `web` | Phục vụ Next.js, qua CDN/edge của nền tảng | 3000 (nội bộ), 443 (ngoài) | `apps/web` |
| `api` | NestJS API, `GET /health`, log ra stdout | 4000 (nội bộ), 443 (ngoài) | `apps/api` |
| PostgreSQL | Dữ liệu bền vững (persistent disk, backup), không public | 5432, chỉ mạng nội bộ | migration trong `apps/api` |
| Container registry | Lưu image tag bằng commit SHA | HTTPS | `.github/workflows/cd.yml` |
| CI/CD | `ci.yml`: install→lint→test→build; `cd.yml`: image→push→migrate→deploy→smoke test→rollback nếu lỗi | — | `.github/workflows/` |
| Secrets/env | `DATABASE_URL`, `JWT_SECRET`, `API_URL`… nằm ở GitHub Secrets và biến môi trường của nền tảng, không có trong repo/log | — | `.env.example` |

## Ranh giới môi trường
- **Local:** `docker-compose.yml` chạy web, api, postgres; dùng `.env` cục bộ.
- **CI:** GitHub Actions chạy kiểm tra và build image; giữ secret của CI.
- **Production:** chỉ `web` và `api` công khai qua HTTPS; database nằm vùng private.
