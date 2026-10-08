import { DEFAULT_SIZE, SIZES, SIZE_UPCHARGE, TOPPING_PRICES } from '../src/order/pricing';

// Bảng giá backend PHẢI khớp frontend/src/lib/pricing.ts (test tương ứng: frontend/src/lib/pricing.test.ts).
// Đổi giá ở 1 bên mà quên bên kia thì 1 trong 2 test này đỏ. Dùng toEqual (không toMatchObject)
// để thêm/bớt size hay topping ở backend cũng phải sửa test này, tức là buộc phải nhìn sang frontend.
describe('bảng giá size/topping backend (pin cùng giá trị với frontend)', () => {
  it('SIZE_UPCHARGE = { S: 0, M: 5000, L: 10000 }', () => {
    expect(SIZE_UPCHARGE).toEqual({ S: 0, M: 5000, L: 10000 });
  });

  it('TOPPING_PRICES = Trân châu 5000, Kem cheese 8000, Thạch cà phê 6000', () => {
    expect(TOPPING_PRICES).toEqual({ 'Trân châu': 5000, 'Kem cheese': 8000, 'Thạch cà phê': 6000 });
  });

  it('DEFAULT_SIZE = M và SIZES = S, M, L', () => {
    expect(DEFAULT_SIZE).toBe('M');
    expect([...SIZES]).toEqual(['S', 'M', 'L']);
  });
});
