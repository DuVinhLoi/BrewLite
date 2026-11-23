import { act, fireEvent, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { json, mockApi, order, payment, renderShop } from '@/test/helpers';
import { OrdersScreen } from './OrdersScreen';

describe('UNIT-T20 order history and controls (FR-21, FR-22, FR-25)', () => {
  it('shows an empty history and a link to the menu', async () => {
    mockApi(() => json([]));
    renderShop(<OrdersScreen />, [], true);
    // Exact string (AC-F21.3). findByText reads only the element's own text, so textContent also rejects wording added in a child element.
    expect((await screen.findByText('Bạn chưa có đơn hàng nào')).textContent).toBe('Bạn chưa có đơn hàng nào');
    expect(screen.getByRole('link', { name: 'Quay lại menu' })).toHaveAttribute('href', '/');
  });
  it.each([['PENDING', 'Chờ thanh toán', true], ['PAYMENT_FAILED', 'Thanh toán thất bại', true], ['PAID', 'Đã thanh toán', false], ['PREPARING', 'Đang pha chế', false], ['READY', 'Sẵn sàng nhận', false], ['COMPLETED', 'Hoàn tất', false], ['CANCELLED', 'Đã hủy', false]] as const)('labels %s and limits cancellation to unpaid orders', async (status, label, cancellable) => {
    mockApi(() => json({ ...order, status }));
    renderShop(<OrdersScreen id="order-1" />, [], true);
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent(label));
    expect(screen.getByText('Tổng tiền: 124.000đ')).toBeInTheDocument();
    if (cancellable) expect(screen.getByRole('button', { name: 'Hủy đơn' })).toBeEnabled();
    else expect(screen.queryByRole('button', { name: 'Hủy đơn' })).not.toBeInTheDocument();
  });
  it('blocks cancellation when the order has an unresolved pending payment', async () => {
    mockApi(() => json({ ...order, payments: [payment] }));
    renderShop(<OrdersScreen id="order-1" />, [], true);
    expect(await screen.findByText('Đơn đang chờ thanh toán qua VNPay nên chưa thể hủy.')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Hủy đơn' })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Tiếp tục thanh toán' })).toHaveAttribute('href', '/checkout?order=order-1');
  });
  it('requires confirmation and reloads the cancelled order after PATCH', async () => {
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false);
    let cancelled = false;
    mockApi((_path, init) => {
      if (init.method === 'PATCH') { cancelled = true; return json({ ...order, status: 'CANCELLED' }); }
      return json({ ...order, status: cancelled ? 'CANCELLED' : 'PENDING' });
    });
    renderShop(<OrdersScreen id="order-1" />, [], true);
    fireEvent.click(await screen.findByRole('button', { name: 'Hủy đơn' }));
    expect(confirm).toHaveBeenCalledWith('Bạn chắc chắn muốn hủy đơn?');
    expect(fetch).toHaveBeenCalledTimes(1);
    confirm.mockReturnValue(true);
    fireEvent.click(screen.getByRole('button', { name: 'Hủy đơn' }));
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('Đã hủy'));
    expect(screen.queryByRole('button', { name: 'Hủy đơn' })).not.toBeInTheDocument();
    expect(fetch).toHaveBeenCalledWith(expect.stringMatching(/\/orders\/order-1$/), expect.objectContaining({ method: 'PATCH', body: '{"status":"CANCELLED"}' }));
  });
  it('polls after five seconds, marks the current step, and stops at a terminal status', async () => {
    vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval', 'Date'] });
    let calls = 0;
    mockApi(() => json({ ...order, status: ++calls === 1 ? 'PREPARING' : 'COMPLETED' }));
    renderShop(<OrdersScreen id="order-1" />, [], true);
    await act(async () => { await Promise.resolve(); });
    expect(screen.getByRole('status')).toHaveTextContent('Đang pha chế');
    expect(screen.getByText('Đang pha chế (Hiện tại)')).toHaveAttribute('aria-current', 'step');
    await act(async () => { await vi.advanceTimersByTimeAsync(5000); });
    expect(screen.getByRole('status')).toHaveTextContent('Hoàn tất');
    await act(async () => { await vi.advanceTimersByTimeAsync(15000); });
    expect(calls).toBe(2);
  });
});
