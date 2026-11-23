import { ProductDetail } from '@/components/shop/ProductDetail';
/** Hiển thị trang chi tiết sản phẩm theo mã trên URL. */
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params; return <ProductDetail id={id} />;
}