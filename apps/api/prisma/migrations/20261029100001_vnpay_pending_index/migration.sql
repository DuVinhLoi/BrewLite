-- At most one PENDING payment per order. Runs after the migration that adds PENDING to the enum.
CREATE UNIQUE INDEX "payments_one_pending_per_order" ON "payments" ("orderId") WHERE "status" = 'PENDING';
