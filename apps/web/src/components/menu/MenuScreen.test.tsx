import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { deferred, json, mockApi, product } from '@/test/helpers';
import { MenuScreen } from './MenuScreen';

describe('UNIT-T13 menu states (FR-01, FR-02)', () => {
  it('shows Vietnamese loading until the API resolves, then renders the menu', async () => {
    const pending = deferred<Response>();
    mockApi(() => pending.promise);
    render(<MenuScreen />);
    expect(screen.getByRole('status')).toHaveTextContent('Đang tải thực đơn…');
    pending.resolve(json([product]));
    expect(await screen.findByRole('heading', { name: 'Cappuccino' })).toBeInTheDocument();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(fetch).toHaveBeenCalledWith(expect.stringMatching(/\/products$/), expect.objectContaining({ cache: 'no-store', signal: expect.any(AbortSignal) }));
  });
  it('shows the empty message without a drink grid', async () => {
    mockApi(() => json([]));
    render(<MenuScreen />);
    expect(await screen.findByText('Hiện chưa có món nào')).toBeInTheDocument();
    expect(screen.queryByRole('list', { name: 'Danh sách đồ uống' })).not.toBeInTheDocument();
  });
  it.each(['server', 'network'])('retries after a %s failure and displays recovered products', async (failure) => {
    let calls = 0;
    mockApi(() => {
      if (calls++ > 0) return json([product]);
      if (failure === 'network') return Promise.reject(new TypeError('offline'));
      return json({}, 503);
    });
    render(<MenuScreen />);
    expect(await screen.findByRole('alert')).toHaveTextContent('Không tải được thực đơn');
    fireEvent.click(screen.getByRole('button', { name: 'Thử lại' }));
    expect(await screen.findByRole('heading', { name: 'Cappuccino' })).toBeInTheDocument();
    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(2));
  });
});
