// Vùng live luôn có mặt trong DOM: trình đọc màn hình thường bỏ qua vùng role="status" vừa được chèn kèm chữ,
// nên phần tử đứng sẵn (rỗng) và chỉ đổi nội dung bên trong. Rỗng thì visually-hidden (position: absolute, không chiếm chỗ, không margin).
export default function LiveNotice({ message, className }: { message: string | null; className: string }) {
  return (
    <p role="status" className={message ? className : 'visually-hidden'}>
      {message || ''}
    </p>
  );
}
