import { Suspense } from 'react';
import { VnpayReturnScreen } from '@/components/shop/VnpayReturnScreen';
export default function Page() { return <Suspense fallback={<main className="shop-page" role="status">Đang tải…</main>}><VnpayReturnScreen /></Suspense>; }
