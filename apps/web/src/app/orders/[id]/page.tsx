import { OrdersScreen } from '@/components/shop/OrdersScreen';
/** Hiển thị trang chi tiết đơn hàng theo mã trên URL. */
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params; return <OrdersScreen id={id} />;
}