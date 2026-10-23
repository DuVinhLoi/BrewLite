import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const products = [
  {
    id: 'ca-phe-sua',
    name: 'Cà phê sữa',
    description: 'Cà phê phin đậm vị hòa quyện cùng sữa đặc, thơm béo truyền thống.',
    price: 35000,
    imageUrl: '/images/ca-phe-sua.svg',
    stock: 50,
  },
  {
    id: 'americano',
    name: 'Americano',
    description: 'Espresso pha loãng với nước nóng, vị đậm đà, ít ngọt.',
    price: 40000,
    imageUrl: '/images/americano.svg',
    stock: 50,
  },
  {
    id: 'cappuccino',
    name: 'Cappuccino',
    description: 'Espresso kết hợp sữa nóng và lớp bọt mịn đặc trưng nước Ý.',
    price: 45000,
    imageUrl: '/images/cappuccino.svg',
    stock: 30,
  },
  {
    id: 'tra-dao',
    name: 'Trà đào',
    description: 'Trà đen thanh mát hòa cùng đào ngâm, thêm chút chanh tươi.',
    price: 39000,
    imageUrl: '/images/tra-dao.svg',
    stock: 30,
  },
  {
    id: 'tra-sua-tran-chau',
    name: 'Trà sữa trân châu',
    description: 'Trà sữa béo mịn cùng trân châu dai giòn tự làm.',
    price: 42000,
    imageUrl: '/images/tra-sua-tran-chau.svg',
    stock: 20,
  },
  {
    id: 'matcha-latte',
    name: 'Matcha latte',
    description: 'Matcha Nhật Bản đắng nhẹ hòa cùng sữa tươi mát lạnh.',
    price: 48000,
    imageUrl: '/images/matcha-latte.svg',
    stock: 20,
  },
  {
    id: 'bac-xiu',
    name: 'Bạc xỉu',
    description: 'Cà phê nhạt pha sữa đặc và sữa tươi, thơm dịu dễ uống.',
    price: 38000,
    imageUrl: '/images/bac-xiu.svg',
    stock: 3,
  },
  {
    id: 'cold-brew',
    name: 'Cold brew',
    description: 'Cà phê ủ lạnh 12 giờ, vị mượt, thanh và ít chua.',
    price: 45000,
    imageUrl: '/images/cold-brew.svg',
    stock: 0,
  },
];

async function main(): Promise<void> {
  for (const product of products) {
    await prisma.product.upsert({
      where: { id: product.id },
      update: product,
      create: product,
    });
  }

  const count = await prisma.product.count();
  console.log(`Seed xong: ${count} sản phẩm trong bảng products.`);
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
