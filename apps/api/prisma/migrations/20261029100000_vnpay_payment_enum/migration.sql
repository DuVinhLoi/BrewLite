-- PENDING cannot be used until this transaction commits, so the partial index
-- that references it lives in the next migration (20261029100001_vnpay_pending_index).
-- AlterEnum
ALTER TYPE "PaymentStatus" ADD VALUE 'PENDING';

-- AlterTable
ALTER TABLE "payments" ADD COLUMN     "bankCode" TEXT,
ADD COLUMN     "expiresAt" TIMESTAMP(3),
ADD COLUMN     "gatewayCreateDate" TEXT,
ADD COLUMN     "gatewayResponseCode" TEXT,
ADD COLUMN     "gatewayTransactionStatus" TEXT,
ADD COLUMN     "gatewayTxnNo" TEXT,
ADD COLUMN     "paidAt" TIMESTAMP(3),
ADD COLUMN     "paymentUrl" TEXT,
ADD COLUMN     "provider" TEXT NOT NULL DEFAULT 'VNPAY';

-- Rows that exist now were created by the old simulator; new rows keep the VNPAY default.
UPDATE "payments" SET "provider" = 'SIMULATOR';
