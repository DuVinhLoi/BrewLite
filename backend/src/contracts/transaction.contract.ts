// Opaque DB-transaction handle threaded through I*Repository.
// Prisma impl passes its TransactionClient; InMemory impl ignores it
// (atomicity comes from the serialized snapshot in in-memory-tx.ts).
export type TxContext = unknown;
