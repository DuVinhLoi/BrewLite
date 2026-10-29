-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "inventoryTracked" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "ingredients" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "unit" TEXT NOT NULL,
    "tracked" BOOLEAN NOT NULL DEFAULT true,
    "onHand" DECIMAL(18,3) NOT NULL DEFAULT 0,
    "reserved" DECIMAL(18,3) NOT NULL DEFAULT 0,

    CONSTRAINT "ingredients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recipes" (
    "id" TEXT NOT NULL,
    "productId" TEXT,
    "size" TEXT,
    "topping" TEXT,

    CONSTRAINT "recipes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recipe_lines" (
    "recipeId" TEXT NOT NULL,
    "ingredientId" TEXT NOT NULL,
    "quantity" DECIMAL(18,3) NOT NULL,

    CONSTRAINT "recipe_lines_pkey" PRIMARY KEY ("recipeId","ingredientId")
);

-- CreateTable
CREATE TABLE "stock_movements" (
    "id" TEXT NOT NULL,
    "ingredientId" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "quantity" DECIMAL(18,3) NOT NULL,
    "onHandAfter" DECIMAL(18,3) NOT NULL,
    "reason" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stock_movements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_ingredients" (
    "orderId" TEXT NOT NULL,
    "ingredientId" TEXT NOT NULL,
    "quantity" DECIMAL(18,3) NOT NULL,

    CONSTRAINT "order_ingredients_pkey" PRIMARY KEY ("orderId","ingredientId")
);

-- CreateIndex
CREATE UNIQUE INDEX "ingredients_name_key" ON "ingredients"("name");

-- CreateIndex
CREATE UNIQUE INDEX "recipes_topping_key" ON "recipes"("topping");

-- CreateIndex
CREATE UNIQUE INDEX "recipes_productId_size_key" ON "recipes"("productId", "size");

-- CreateIndex
CREATE INDEX "stock_movements_createdAt_idx" ON "stock_movements"("createdAt");

-- AddForeignKey
ALTER TABLE "recipes" ADD CONSTRAINT "recipes_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recipe_lines" ADD CONSTRAINT "recipe_lines_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "recipes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recipe_lines" ADD CONSTRAINT "recipe_lines_ingredientId_fkey" FOREIGN KEY ("ingredientId") REFERENCES "ingredients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_ingredientId_fkey" FOREIGN KEY ("ingredientId") REFERENCES "ingredients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_ingredients" ADD CONSTRAINT "order_ingredients_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_ingredients" ADD CONSTRAINT "order_ingredients_ingredientId_fkey" FOREIGN KEY ("ingredientId") REFERENCES "ingredients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
-- Existing orders keep inventoryTracked=false. Never infer ingredient stock.

ALTER TABLE "ingredients" ADD CONSTRAINT "ingredients_unit_check" CHECK (unit IN ('g', 'ml', 'piece'));
ALTER TABLE "ingredients" ADD CONSTRAINT "ingredients_balance_check" CHECK ("onHand" >= 0 AND reserved >= 0 AND reserved <= "onHand");
ALTER TABLE "ingredients" ADD CONSTRAINT "ingredients_piece_check" CHECK (unit <> 'piece' OR ("onHand" = trunc("onHand") AND reserved = trunc(reserved)));
ALTER TABLE "recipes" ADD CONSTRAINT "recipes_selector_check" CHECK (
  ("productId" IS NOT NULL AND size IS NOT NULL AND size IN ('S', 'M', 'L') AND topping IS NULL)
  OR ("productId" IS NULL AND size IS NULL AND topping IS NOT NULL AND topping IN ('Trân châu', 'Kem phô mai', 'Thạch dừa'))
);
ALTER TABLE "recipe_lines" ADD CONSTRAINT "recipe_lines_quantity_check" CHECK (quantity > 0);
ALTER TABLE "order_ingredients" ADD CONSTRAINT "order_ingredients_quantity_check" CHECK (quantity > 0);
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_valid_check" CHECK (
  kind IN ('RECEIVE', 'ADJUST') AND "onHandAfter" >= 0 AND length(trim(reason)) BETWEEN 1 AND 500
  AND (kind <> 'RECEIVE' OR quantity > 0)
);

