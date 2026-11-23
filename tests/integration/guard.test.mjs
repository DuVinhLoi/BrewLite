import assert from 'node:assert/strict';
import test from 'node:test';
import { assertSafeTargets } from './helpers.mjs';

// Guard regression test (review finding F-M11): it does not belong to a plan row, so it is named GUARD-T01.
test('GUARD-T01: DATABASE_URL may carry only the schema query parameter', () => {
  const base = new URL(process.env.DATABASE_URL);
  const withQuery = (query) => {
    const url = new URL(base);
    url.search = query;
    return { ...process.env, DATABASE_URL: url.href };
  };
  // Positive controls: the guard still accepts a plain URL and the schema selector.
  assert.doesNotThrow(() => assertSafeTargets(withQuery('')));
  assert.doesNotThrow(() => assertSafeTargets(withQuery('?schema=public')));
  // Prisma can honour extra connection parameters such as host, which would redirect the connection elsewhere.
  for (const query of ['?host=prod.example', '?schema=public&host=prod.example', '?options=-c%20search_path%3Dpublic', '?sslmode=require']) {
    assert.throws(() => assertSafeTargets(withQuery(query)), /only carry the schema query parameter/, query);
  }
});
