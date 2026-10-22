import { readFileSync } from 'node:fs';
import path from 'node:path';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, test } from 'vitest';
import LoginView from './LoginView';
import { formatVND } from '@/lib/pricing';
import { VND_FOR_ONE_POINT } from '@/lib/promo';
import { REGISTER_OK_NOTICE } from '@/lib/login';
import { blocks, mediaBody, missingClasses, motionOutsideNoPreference, readCss } from '@/test-utils/css';

// Màn Đăng nhập / Đăng ký: ui-visual-plan.md §6 mục 8, artboard LoginDoodle. Không có DOM trong test:
// LoginView là phần vẽ thuần, app/login/page.tsx giữ state, fetch và logic sau đăng nhập.
const noop = () => {};
type ViewProps = Parameters<typeof LoginView>[0];
const view = (over: Partial<ViewProps> = {}) =>
  renderToStaticMarkup(
    createElement(LoginView, {
      mode: 'login',
      email: '',
      password: '',
      error: null,
      notice: null,
      loading: false,
      onModeChange: noop,
      onEmailChange: noop,
      onPasswordChange: noop,
      onSubmit: noop,
      ...over,
    }),
  );
const text = (out: string) => out.replace(/<[^>]+>/g, '');
const attr = (tag: string, name: string) => new RegExp(`\\b${name}="([^"]*)"`).exec(tag)?.[1];
const buttons = (out: string) => Array.from(out.matchAll(/<button\b([^>]*)>([\s\S]*?)<\/button>/g), (m) => ({ tag: m[1], label: text(m[2]).replace('↗', '').trim() }));

describe('LoginView: panel trái', () => {
  const out = view();

  test('đúng một h1 "Đăng nhập để đặt món và theo dõi đơn" lớp display', () => {
    expect(out.match(/<h1\b/g)).toHaveLength(1);
    expect(out).toMatch(/<h1[^>]*class="[^"]*display[^"]*"[^>]*>Đăng nhập để đặt món và theo dõi đơn<\/h1>/);
  });

  test('h1 theo tab: Đăng ký thì "Đăng ký để đặt món và theo dõi đơn" (tiêu đề trang khớp tiêu đề form)', () => {
    const reg = view({ mode: 'register' });
    expect(reg.match(/<h1\b/g)).toHaveLength(1);
    expect(reg).toMatch(/<h1[^>]*>Đăng ký để đặt món và theo dõi đơn<\/h1>/);
    expect(reg).not.toContain('Đăng nhập để đặt món');
  });

  test('câu về điểm tính từ VND_FOR_ONE_POINT', () => {
    expect(text(out)).toContain(`Mỗi ${formatVND(VND_FOR_ONE_POINT)} thanh toán được cộng 1 điểm tích lũy`);
  });

  test('cốc, lá, hạt, sao trang trí: alt="" và aria-hidden', () => {
    for (const src of ['mug', 'leaf', 'bean', 'sparkle', 'burst']) {
      const img = new RegExp(`<img[^>]*src="/doodles/${src}\\.svg"[^>]*>`).exec(out)?.[0] ?? '';
      expect(img, src).not.toBe('');
      expect(img).toContain('alt=""');
      expect(img).toContain('aria-hidden="true"');
    }
  });
});

describe('LoginView: tab chọn thao tác', () => {
  test('nhóm 2 nút type="button" có aria-pressed, không dùng disabled để đánh dấu tab đang chọn', () => {
    const out = view();
    expect(out).toMatch(/role="group"[^>]*aria-label="Chọn thao tác"/);
    const [login, register] = buttons(out);
    expect(login.label).toBe('Đăng nhập');
    expect(register.label).toBe('Đăng ký');
    expect(attr(login.tag, 'type')).toBe('button');
    expect(attr(register.tag, 'type')).toBe('button');
    expect(attr(login.tag, 'aria-pressed')).toBe('true');
    expect(attr(register.tag, 'aria-pressed')).toBe('false');
    expect(login.tag).not.toContain('disabled');
    expect(register.tag).not.toContain('disabled');
  });

  test('chế độ Đăng ký: tab Đăng ký aria-pressed="true", tiêu đề form h2 "Đăng ký"', () => {
    const out = view({ mode: 'register' });
    const [login, register] = buttons(out);
    expect(attr(login.tag, 'aria-pressed')).toBe('false');
    expect(attr(register.tag, 'aria-pressed')).toBe('true');
    expect(out).toMatch(/<h2[^>]*class="[^"]*display[^"]*"[^>]*>Đăng ký<\/h2>/);
    expect(view()).toMatch(/<h2[^>]*>Đăng nhập<\/h2>/);
  });
});

describe('LoginView: form', () => {
  test('ô Email: <label for> ở trên, type email, name email, required, autocomplete email, không placeholder', () => {
    const out = view({ email: 'khach@brewlite.test' });
    const input = /<input\b[^>]*type="email"[^>]*>/.exec(out)?.[0] ?? '';
    const id = attr(input, 'id');
    expect(id).toBeTruthy();
    expect(out.indexOf(`<label`)).toBeLessThan(out.indexOf(input));
    expect(out).toMatch(new RegExp(`<label[^>]*for="${id}"[^>]*>Email</label>`));
    expect(attr(input, 'name')).toBe('email');
    expect(input).toContain('required=""');
    expect(attr(input, 'autoComplete') ?? attr(input, 'autocomplete')).toBe('email');
    expect(attr(input, 'value')).toBe('khach@brewlite.test');
    expect(input).not.toContain('placeholder');
  });

  test('ô Mật khẩu: <label for>, name password, required, minlength 6, gợi ý "Ít nhất 6 ký tự." nối bằng aria-describedby', () => {
    const out = view();
    const input = /<input\b[^>]*type="password"[^>]*>/.exec(out)?.[0] ?? '';
    const id = attr(input, 'id');
    expect(out).toMatch(new RegExp(`<label[^>]*for="${id}"[^>]*>Mật khẩu</label>`));
    expect(attr(input, 'name')).toBe('password');
    expect(input).toContain('required=""');
    expect(attr(input, 'minLength') ?? attr(input, 'minlength')).toBe('6');
    const hint = attr(input, 'aria-describedby');
    expect(hint).toBeTruthy();
    expect(out).toMatch(new RegExp(`id="${hint}"[^>]*>Ít nhất 6 ký tự\\.<`));
    expect(input).not.toContain('placeholder');
  });

  test('autocomplete mật khẩu: current-password khi đăng nhập, new-password khi đăng ký', () => {
    const ac = (out: string) => {
      const input = /<input\b[^>]*type="password"[^>]*>/.exec(out)?.[0] ?? '';
      return attr(input, 'autoComplete') ?? attr(input, 'autocomplete');
    };
    expect(ac(view())).toBe('current-password');
    expect(ac(view({ mode: 'register' }))).toBe('new-password');
  });

  test('nút gửi type="submit", chữ theo chế độ, đúng một ↗ trên cả màn', () => {
    const submitOf = (out: string) => buttons(out).find((b) => attr(b.tag, 'type') === 'submit');
    const login = view();
    expect(submitOf(login)?.label).toBe('Đăng nhập');
    expect(submitOf(login)?.tag).toMatch(/class="[^"]*cta/);
    expect(login.match(/↗/g)).toHaveLength(1);
    expect(submitOf(view({ mode: 'register' }))?.label).toBe('Đăng ký');
  });

  test('đang gửi: nút gửi "Đang xử lý…" và vô hiệu', () => {
    const out = view({ loading: true });
    const submit = buttons(out).find((b) => attr(b.tag, 'type') === 'submit');
    expect(submit?.label).toBe('Đang xử lý…');
    expect(submit?.tag).toContain('disabled=""');
  });

  test('lỗi: hiện trong role="alert" lớp error; không lỗi thì không có alert', () => {
    expect(view()).not.toContain('role="alert"');
    const out = view({ error: 'Sai email hoặc mật khẩu.' });
    expect(out).toMatch(/<p[^>]*role="alert"[^>]*class="[^"]*error[^"]*"[^>]*>Sai email hoặc mật khẩu\.<\/p>|<p[^>]*class="[^"]*error[^"]*"[^>]*role="alert"[^>]*>Sai email hoặc mật khẩu\.<\/p>/);
    expect(out.match(/role="alert"/g)).toHaveLength(1);
  });

  test('thông báo đăng ký thành công: nằm trong vùng role="status" có sẵn; chưa có thông báo thì vùng rỗng', () => {
    expect(view()).toMatch(/<div[^>]*role="status"[^>]*><\/div>/);
    const out = view({ notice: REGISTER_OK_NOTICE });
    const status = /<div[^>]*role="status"[^>]*>([\s\S]*?)<\/div>/.exec(out)?.[1] ?? '';
    expect(text(status)).toBe('Đăng ký thành công. Đăng nhập bằng email vừa tạo.');
    expect(out.match(/role="status"/g)).toHaveLength(1);
  });

  test('không href="#", không em-dash, không style inline', () => {
    const out = view({ notice: REGISTER_OK_NOTICE, error: 'x' });
    expect(out).not.toContain('href="#"');
    expect(text(out)).not.toContain('—');
    expect(out).not.toContain('style=');
  });
});

describe('app/login/page.tsx giữ nguyên logic sau đăng nhập (R25)', () => {
  const page = readFileSync(path.resolve(__dirname, '../app/login/page.tsx'), 'utf8');

  test('route, body, lưu token, giữ/bỏ đơn đang trả dở, điều hướng ?next=', () => {
    expect(page).toContain('fetch(`${API}/auth/${mode}`');
    expect(page).toContain('body: JSON.stringify({ email, password })');
    expect(page).toContain('saveToken(data.accessToken);');
    expect(page).toContain('clearCheckoutIfOtherUser(userIdFromToken(data.accessToken));');
    expect(page).toContain('router.push(postLoginTarget(window.location.search));');
  });

  test('nhân viên (BARISTA/ADMIN): báo Swagger và return trước saveToken, không lưu phiên', () => {
    const guard = 'if (staffMessage) return showError(staffMessage);';
    expect(page).toContain('staffLoginMessage(roleFromToken(data.accessToken))');
    expect(page.indexOf(guard)).toBeGreaterThan(0);
    expect(page.indexOf(guard)).toBeLessThan(page.indexOf('saveToken(data.accessToken);'));
  });

  test('lỗi đi qua authErrorMessage, đăng ký xong dùng afterRegister; vẽ bằng LoginView', () => {
    expect(page).toContain('authErrorMessage(');
    expect(page).toContain('afterRegister');
    expect(page).toContain('<LoginView');
    expect(page).not.toMatch(/style=\{/);
  });
});

describe('LoginView.module.css (artboard LoginDoodle)', () => {
  const css = readCss(path.join(__dirname, 'LoginView.module.css'));
  const tsx = readFileSync(path.join(__dirname, 'LoginView.tsx'), 'utf8');

  test('mọi styles.X trong component đều có lớp .X; tsx không có style inline', () => {
    expect(missingClasses(tsx, css)).toEqual([]);
    expect(tsx).not.toMatch(/style=\{/);
  });

  test('chuyển động chỉ trong @media (prefers-reduced-motion: no-preference); không viết cứng hex', () => {
    expect(motionOutsideNoPreference(css)).toEqual([]);
    expect(css).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
  });

  test('cốc nổi 6s, keyframes chỉ đổi transform', () => {
    const motion = mediaBody(css, /prefers-reduced-motion:\s*no-preference/);
    expect(blocks(motion, '.float')).toMatch(/animation:\s*\S+\s+6s/);
    const kf = /@keyframes\s+[\w-]+\s*\{([\s\S]*?\})\s*\}/.exec(motion)?.[1] ?? '';
    expect(kf).not.toBe('');
    const props = Array.from(kf.matchAll(/([\w-]+)\s*:/g), (m) => m[1]);
    expect(new Set(props)).toEqual(new Set(['transform']));
  });

  test('hai cột 1.1fr / 1fr; từ 860px trở xuống một cột (gồm mọi bề rộng dưới 760px)', () => {
    expect(blocks(css, '.page')).toMatch(/grid-template-columns:\s*minmax\(0,\s*1\.1fr\)\s+minmax\(0,\s*1fr\)/);
    const sm = mediaBody(css, /\(max-width:\s*860px\)/);
    expect(blocks(sm, '.page')).toMatch(/grid-template-columns:\s*minmax\(0,\s*1fr\)/);
  });

  test('panel trái nền --mist bo --radius-block-lg, che hình tràn; tiêu đề xoay -2deg', () => {
    const art = blocks(css, '.art');
    expect(art).toMatch(/background:\s*var\(--mist\)/);
    expect(art).toMatch(/border-radius:\s*var\(--radius-block-lg\)/);
    expect(art).toMatch(/overflow:\s*hidden/);
    expect(blocks(css, '.heading')).toMatch(/transform:\s*rotate\(-2deg\)/);
  });

  test('thẻ form viền mực bo --radius-block (28)', () => {
    const card = blocks(css, '.card');
    expect(card).toMatch(/border:\s*var\(--stroke\)/);
    expect(card).toMatch(/border-radius:\s*var\(--radius-block\)/);
  });

  test('tab dạng viên trên --mist; tab đang chọn nền mực chữ trắng', () => {
    expect(blocks(css, '.tabs')).toMatch(/background:\s*var\(--mist\)/);
    const on = blocks(css, '.tab[aria-pressed="true"]');
    expect(on).toMatch(/background:\s*var\(--ink\)/);
    expect(on).toMatch(/color:\s*var\(--paper\)/);
  });

  test('ô nhập viền mực bo --radius-input; gợi ý --muted', () => {
    const input = blocks(css, '.input');
    expect(input).toMatch(/border:\s*var\(--stroke\)/);
    expect(input).toMatch(/border-radius:\s*var\(--radius-input\)/);
    expect(blocks(css, '.hint')).toMatch(/color:\s*var\(--muted\)/);
  });

  test('thông báo nền --ok-bg chữ --ok-ink; lỗi nền --danger-bg chữ --danger-ink', () => {
    const ok = blocks(css, '.notice');
    expect(ok).toMatch(/background:\s*var\(--ok-bg\)/);
    expect(ok).toMatch(/color:\s*var\(--ok-ink\)/);
    const err = blocks(css, '.error');
    expect(err).toMatch(/background:\s*var\(--danger-bg\)/);
    expect(err).toMatch(/color:\s*var\(--danger-ink\)/);
  });
});
