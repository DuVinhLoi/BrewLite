import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, test } from 'vitest';

// Bộ minh họa nét mực (ui-visual-plan.md §4): nhẹ, không chữ, không gradient, không style/script.
const publicDir = path.resolve(__dirname, '../../public');
const DOODLES = ['moka', 'mug', 'bag', 'bean', 'leaf', 'sparkle', 'burst'].map((n) => `doodles/${n}.svg`);
const DISHES = ['latte', 'americano', 'cappuccino', 'tra-dao'].map((n) => `images/${n}.svg`);
const read = (rel: string) => readFileSync(path.join(publicDir, rel));

describe.each([...DOODLES, ...DISHES])('%s', (rel) => {
  test('nhỏ hơn 2 KB, có viewBox', () => {
    const buf = read(rel);
    expect(buf.length).toBeLessThan(2048);
    expect(buf.toString('utf8')).toMatch(/viewBox="[^"]+"/);
  });

  test('không có <style, <script, <text, gradient', () => {
    const svg = read(rel).toString('utf8');
    for (const banned of ['<style', '<script', '<text', 'gradient']) expect(svg).not.toContain(banned);
  });
});

describe('ảnh món', () => {
  test.each(DISHES)('%s: viewBox 0 0 240 180 và có ô nền bo góc làm lớp dưới cùng', (rel) => {
    const svg = read(rel).toString('utf8');
    expect(svg).toContain('viewBox="0 0 240 180"');
    expect(svg).toMatch(/<rect width="240" height="180" rx="20" fill="#[0-9a-fA-F]{6}"\/>/);
  });

  test('màu ô nền đúng bảng §3.1', () => {
    const fill = (rel: string) => /<rect width="240" height="180" rx="20" fill="(#[0-9a-fA-F]{6})"/.exec(read(rel).toString('utf8'))?.[1].toLowerCase();
    expect(fill('images/latte.svg')).toBe('#f3e7d8');
    expect(fill('images/americano.svg')).toBe('#e7e4fa');
    expect(fill('images/cappuccino.svg')).toBe('#e4eedf');
    expect(fill('images/tra-dao.svg')).toBe('#fce3d6');
  });
});
