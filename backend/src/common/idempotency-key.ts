import { BadRequestException } from '@nestjs/common';

// Cột idempotencyKey có chỉ số unique: key ngẫu nhiên dài vài nghìn ký tự làm Postgres từ chối (500), nên chặn ở biên API
export const MAX_IDEMPOTENCY_KEY_LENGTH = 255;

export function assertIdempotencyKeyLength(key: string): void {
  if (key.length > MAX_IDEMPOTENCY_KEY_LENGTH) throw new BadRequestException('Idempotency-Key too long');
}
