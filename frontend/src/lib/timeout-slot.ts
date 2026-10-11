// ============================================================
// FEATURE: Khe giữ một timer — đặt lại thì hủy timer cũ, clear() khi rời màn (ProductCard "Đã thêm ✓").
// ============================================================

export interface TimeoutSlot {
  set: (fn: () => void, ms: number) => void;
  clear: () => void;
}

export function createTimeoutSlot(): TimeoutSlot {
  let id: ReturnType<typeof setTimeout> | undefined;
  const clear = () => {
    if (id !== undefined) clearTimeout(id);
    id = undefined;
  };
  return {
    set: (fn, ms) => {
      clear();
      id = setTimeout(() => {
        id = undefined;
        fn();
      }, ms);
    },
    clear,
  };
}
