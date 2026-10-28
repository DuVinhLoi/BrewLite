-- A successful key may be reused for a different order (D3).
-- payments_one_success_per_order still prevents a second successful payment.
DROP INDEX payments_success_key_per_user;
