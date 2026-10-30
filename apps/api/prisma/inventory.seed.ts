import { Prisma, type PrismaClient } from '@prisma/client';

const ingredients = [
  ['espresso', 'Espresso pha sẵn', 'ml'],
  ['prepared-phin', 'Cà phê phin đậm pha sẵn', 'ml'],
  ['ground-phin', 'Cà phê xay pha phin', 'g'],
  ['condensed-milk', 'Sữa đặc', 'ml'],
  ['unsweetened-milk', 'Sữa tươi không đường', 'ml'],
  ['whole-milk', 'Sữa tươi nguyên kem', 'ml'],
  ['filtered-cold-brew', 'Cold brew đã ủ và lọc', 'ml'],
  ['matcha', 'Matcha', 'g'],
  ['sugar-syrup', 'Siro đường', 'ml'],
  ['black-tea', 'Trà đen', 'g'],
  ['peach-syrup', 'Siro đào', 'ml'],
  ['peach', 'Đào ngâm', 'piece'],
  ['cooked-pearls', 'Trân châu chín', 'g'],
  ['cheese-foam', 'Kem phô mai', 'g'],
  ['coconut-jelly', 'Thạch dừa', 'g'],
] as const;

const bases: Record<string, [string, string][]> = {
  americano: [['espresso', '30']],
  'bac-xiu': [['prepared-phin', '30'], ['condensed-milk', '25'], ['unsweetened-milk', '100']],
  'ca-phe-sua': [['ground-phin', '25'], ['condensed-milk', '25']],
  cappuccino: [['espresso', '30'], ['whole-milk', '120']],
  'cold-brew': [['filtered-cold-brew', '200']],
  'matcha-latte': [['matcha', '3'], ['unsweetened-milk', '150'], ['sugar-syrup', '20']],
  'tra-dao': [['black-tea', '5'], ['peach-syrup', '30'], ['peach', '3']],
  'tra-sua-tran-chau': [['black-tea', '5'], ['unsweetened-milk', '80'], ['condensed-milk', '25'], ['cooked-pearls', '50']],
};

export async function seedInventory(prisma: PrismaClient): Promise<void> {
  // Seed only missing records. Physical counts must be recorded via stock movements.
  for (const [id, name, unit] of ingredients) await prisma.ingredient.upsert({ where: { id }, update: {}, create: { id, name, unit } });
  for (const [productId, base] of Object.entries(bases)) {
    for (const [size, factor] of [['S', '1'], ['M', '1.25'], ['L', '1.5']]) {
      const lines = base.map(([ingredientId, amount]) => {
        let quantity = new Prisma.Decimal(amount).mul(factor);
        if (ingredientId === 'peach') quantity = quantity.ceil();
        return { ingredientId, quantity };
      });
      await prisma.recipe.upsert({ where: { productId_size: { productId, size } }, update: {}, create: { productId, size, lines: { create: lines } } });
    }
  }
  for (const [topping, ingredientId] of [['Trân châu', 'cooked-pearls'], ['Kem phô mai', 'cheese-foam'], ['Thạch dừa', 'coconut-jelly']]) {
    await prisma.recipe.upsert({ where: { topping }, update: {}, create: { topping, lines: { create: [{ ingredientId, quantity: '20' }] } } });
  }
}
