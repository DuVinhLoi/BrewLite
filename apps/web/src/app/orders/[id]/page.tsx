import { OrdersScreen } from '@/components/shop/OrdersScreen';
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params; return <OrdersScreen id={id} />;
}