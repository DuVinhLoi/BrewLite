import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

// README bảo `cp .env.example .env` rồi `docker compose up`. Compose thay ${VAR} bằng giá trị trong .env, mà
// DATABASE_URL trong .env.example là localhost (cho chạy rời npm run start:dev) → nếu compose dùng biến đó cho
// container backend thì backend không tới được DB. Test này chốt cấu hình để lỗi không quay lại.
const root = join(__dirname, '..', '..');
const read = (f: string) => readFileSync(join(root, f), 'utf8').replace(/\r\n/g, '\n');

// Chỉ chạy được khi chạy từ repo đầy đủ (trong image backend không có file ở thư mục gốc repo)
const repo = existsSync(join(root, 'docker-compose.yml')) ? describe : describe.skip;

repo('compose + .env.example (README: cp .env.example .env && docker compose up)', () => {
  test('container backend luôn nối service `db`, không lấy DATABASE_URL từ .env', () => {
    const compose = read('docker-compose.yml');
    const backend = /^ {2}backend:\n([\s\S]*?)^ {2}\w+:/m.exec(compose)![1];
    const url = /^\s+DATABASE_URL:\s*(.+)$/m.exec(backend)![1].trim();
    expect(url).not.toContain('${');
    expect(url).toBe('postgresql://brewlite:brewlite@db:5432/brewlite');
  });

  test('.env.example vẫn dùng localhost cho chạy rời (npm run start:dev)', () => {
    expect(read('.env.example')).toMatch(/^DATABASE_URL=postgresql:\/\/brewlite:brewlite@localhost:5432\/brewlite$/m);
  });

  test('.gitignore chặn .env (không commit mật khẩu / JWT_SECRET thật)', () => {
    expect(read('.gitignore').split('\n').map((l) => l.trim())).toContain('.env');
  });
});
