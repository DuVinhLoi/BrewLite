import { spawnSync } from 'child_process';
import { join } from 'path';

// main.ts gọi bootstrap() ngay khi nạp nên phải chạy tiến trình thật. Thiếu DATABASE_URL thì dừng trước khi tạo app;
// không thì mỗi module giữ kho in-memory riêng và POST /orders rồi POST /payments ra 404.
test('thiếu DATABASE_URL thì backend không khởi động', () => {
  const env = { ...process.env };
  delete env.DATABASE_URL;
  // timeout: nếu guard bị gỡ, backend lên và nghe cổng 3000 mãi, test phải fail chứ không treo
  const r = spawnSync(process.execPath, ['-r', 'ts-node/register/transpile-only', 'src/main.ts'], {
    cwd: join(__dirname, '..'),
    env,
    encoding: 'utf8',
    timeout: 30000,
  });
  expect(r.stderr).toContain('DATABASE_URL is required');
  expect(r.status).toBe(1);
}, 40000);
