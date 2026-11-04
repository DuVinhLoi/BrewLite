'use client';
import Link from 'next/link';
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { addLine, type CartLine } from '@/lib/shop';
type Session = { token: string; email: string; role: string };
type Store = { cart: CartLine[]; ready: boolean; session: Session | null; add: (line: CartLine) => void; quantity: (key: string, value: number) => void; clear: () => void; login: (value: Session) => void; logout: () => void };
const Context = createContext<Store | null>(null);
export function ShopProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartLine[]>([]);
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    Promise.resolve().then(() => {
      try {
        const stored: unknown = JSON.parse(localStorage.getItem('brewlite-cart') ?? '[]');
        if (Array.isArray(stored)) {
          const valid = stored.filter((line): line is CartLine => line && typeof line.productId === 'string' && typeof line.name === 'string' && ['S', 'M', 'L'].includes(line.size) && Array.isArray(line.toppings) && line.toppings.every((t: unknown) => typeof t === 'string') && Number.isInteger(line.quantity) && line.quantity >= 1 && line.quantity <= 99 && Number.isInteger(line.unitPrice) && line.unitPrice >= 0 && typeof line.key === 'string').slice(0, 20);
          setCart(valid);
        }
        const saved = JSON.parse(sessionStorage.getItem('brewlite-session') ?? 'null');
        if (saved && typeof saved.token === 'string' && typeof saved.email === 'string' && ['CUSTOMER', 'BARISTA'].includes(saved.role)) setSession(saved);
      } catch { /* Corrupt or unavailable browser storage starts a fresh session. */ }
      setReady(true);
    });
  }, []);
  useEffect(() => { if (ready) { try { localStorage.setItem('brewlite-cart', JSON.stringify(cart)); } catch { /* In-memory cart remains usable. */ } } }, [cart, ready]);
  const clear = useCallback(() => setCart([]), []);
  const logout = useCallback(() => { setSession(null); try { sessionStorage.removeItem('brewlite-session'); } catch { /* Session already cleared in memory. */ } }, []);
  const store: Store = {
    cart, ready, session,
    add(line) { const next = addLine(cart, line); setCart(next); },
    quantity(key, value) { if (Number.isInteger(value) && value >= 0 && value <= 99) setCart(cart.map((line) => line.key === key ? { ...line, quantity: value } : line).filter((line) => line.quantity > 0)); },
    clear,
    login(value) { setSession(value); try { sessionStorage.setItem('brewlite-session', JSON.stringify(value)); } catch { /* Session remains in memory. */ } },
    logout,
  };
  return <Context.Provider value={store}><nav className="shop-nav" aria-label="Điều hướng"><Link href="/">BrewLite</Link><Link href="/cart">Giỏ hàng ({cart.reduce((sum, line) => sum + line.quantity, 0)})</Link><Link href="/orders">Đơn hàng</Link>{session?.role === 'BARISTA' && <Link href="/inventory">Kho nguyên liệu</Link>}{session ? <><span>{session.email}</span><button onClick={store.logout}>Đăng xuất</button></> : <Link href="/login">Đăng nhập</Link>}</nav>{children}</Context.Provider>;
}
export function useShop() { const value = useContext(Context); if (!value) throw new Error('ShopProvider missing'); return value; }
