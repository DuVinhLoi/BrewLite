# BREW-INVENTORY-01 — inventory contract

Task owner: this session. Branch `feat/ingredient-inventory`; worktree `C:\Users\baoth\orca\workspaces\BrewLite\jumbo`. Base `73a6ccb`. Only the task's allowed paths may change. Existing checkout, pricing, roles and payment replay rules remain applicable.

## Design and decisions

Ingredient balances are the only source of availability for new orders. `Product.stock` remains a dormant legacy column for pre-migration orders; catalog responses replace its value with calculated size-S/no-topping availability. We choose additive inventory tables and snapshots over deleting legacy data or estimating ingredient quantities from product stock. A production cutover must first reconcile legacy pending orders and physically count ingredients.

`Ingredient`: id, name, canonical unit (`g`, `ml`, `piece`), tracked, onHand, reserved. Quantities use PostgreSQL numeric(18,3)/Prisma Decimal, transmitted as strings. DB checks require nonnegative balances and reserved <= onHand. Input quantities are decimal strings with at most three fractional digits; `kg` converts to `g`, `l` to `ml`; cross-dimension conversion is rejected. Piece amounts must be integers. Water and ice are assumed unlimited and excluded from limiting calculations.

`Recipe`: id, nullable productId/size or topping. Exactly one selector: productId + S/M/L, or one existing topping name. Unique product/size and unique topping. `RecipeLine`: recipeId, ingredientId, quantity in canonical units, unique pair. An empty recipe, missing recipe, or a base recipe without any tracked ingredient is not sellable. Additional topping lines add to base quantities, including existing pearls in milk tea. Repeated ingredients and cart variants are aggregated before checking stock.

`StockMovement`: id, ingredientId, actorId -> User, kind RECEIVE/ADJUST, quantity (signed delta), onHandAfter, reason, createdAt. Receive adds a positive amount; adjustment sets the counted total, which cannot fall below reserved. Reason required, 1–500 characters. No balance mutation without a movement in the same transaction.

`OrderIngredient`: orderId, ingredientId, quantity, unique pair; immutable aggregate snapshot. `Order.inventoryTracked` defaults false for existing orders and is explicitly true for all new orders. Create reserves from server recipes and creates order, items and snapshot in one transaction. Success decrements both onHand and reserved; failure leaves reserved. Owner cancellation PENDING/PAYMENT_FAILED decrements reserved. Existing order lock/state validation makes these operations happen once. Legacy orders use their original product-stock lifecycle and never invent ingredient snapshots.

Transactions lock recipe rows in ID order while reading a cart, then ingredient rows in ID order; recipe writes use the same recipe lock. Balance writes, payment/cancel and manual stock changes use ordered ingredient row locks. Read-only availability uses one repeatable-read transaction for a consistent snapshot. Menu figures are independent estimates, not additive promises.

## HTTP contract

Existing error envelope: `{statusCode, error, message, details?}`. Auth errors 401 UNAUTHORIZED / 403 FORBIDDEN. Invalid or extra fields 400 VALIDATION_ERROR. Missing entities 404 PRODUCT_NOT_FOUND / INGREDIENT_NOT_FOUND. Business conflicts 409 OUT_OF_STOCK / RECIPE_UNAVAILABLE / BELOW_RESERVED. Failed calls leave data unchanged.

### Public endpoints

- `GET /products` and `GET /products/:id`: existing product fields, with calculated numeric `stock` for S without topping. Missing recipe yields zero.
- `POST /inventory/availability`: `{items:[{productId,size,toppings,quantity}]}` using checkout's limits (1–20 lines, quantities 1–99, known S/M/L and topping values). Returns `{canOrder:boolean, lines:Availability[], shortages:Shortage[]}`. No balance mutation. Unknown products are 404. Missing recipe is represented on the line, not an HTTP error.

`Availability = {productId,size,toppings,quantity,cups:number,sellable:boolean,limitingIngredients:{id,name,unit}[],reason?:string}`. `cups` is per-choice capacity before cart multiplication. Missing recipes produce `sellable:false,cups:0,reason`. `Shortage = {ingredientId,name,unit,requested:string,available:string}` aggregated over the entire cart. `canOrder` is true only when every recipe is valid and aggregate demand fits. The frontend must not cap variants using the menu's size-S `stock`.

### BARISTA-only endpoints (JWT required)

- `GET /inventory/ingredients`: array `{id,name,unit,tracked,onHand:string,reserved:string,available:string}` ordered by name.
- `POST /inventory/ingredients/:id/movements`: `{kind:"RECEIVE"|"ADJUST",quantity:string,unit:"g"|"kg"|"ml"|"l"|"piece",reason:string}`. Returns updated ingredient balance. RECEIVE > 0; ADJUST >= 0. ADJUST means final counted onHand, not a delta. Unit must match ingredient dimension. 409 BELOW_RESERVED for counts below reservations.
- `GET /inventory/movements`: latest 100 movements, including actor email, ingredient name/unit, signed quantity and onHandAfter, newest first.
- `GET /inventory/recipes`: array `{id,productId:string|null,size:string|null,topping:string|null,lines:[{ingredientId,quantity:string,ingredient:{id,name,unit,tracked}}]}`. Product names come from public catalog; topping names from `/catalog/options`.
- `PUT /inventory/recipes`: `{productId,size,lines:[{ingredientId,quantity:string,unit}]}` OR `{topping,lines:[...]}`. Replaces complete recipe atomically, at least one line, at most 50 unique ingredients. Positive compatible quantities only; product and topping selectors validated. Returns recipe in GET format. Recipe editing never changes existing order snapshots.

### Checkout integration

- `POST /orders` request/response unchanged except additive `inventoryTracked`; 409 RECIPE_UNAVAILABLE for missing recipes or 409 OUT_OF_STOCK with aggregate ingredient shortage details. Client cannot supply prices, ingredient quantities or snapshots.
- `POST /payments` unchanged: first success 201, successful replay 200, failure 402, invalid state 409. Success consumes snapshot exactly once in payment/order transaction.
- `PATCH /orders/:id` unchanged: owner cancellation releases snapshot once; repeated cancellation returns 409. Paid cancellation remains forbidden. BARISTA transitions unchanged.

## Seed and cutover

Additive migration preserves existing products/orders. Seed upserts with empty updates: it creates missing ingredients/recipes but never resets operational balances or edited recipes. Initial ingredient onHand is zero; demo stock is explicitly received through the authenticated API/UI after physical count. `SEED_DEMO_USERS=true` enables existing demo accounts only. No stock is inferred from product counts. No automatic cancellation or expiry; abandoned unpaid orders retain reservations.

Eight S recipes follow the supplied task exactly. M = S × 1.25; L = S × 1.5, stored individually; peach pieces round upward. Added pearls/cheese/coconut jelly each use 20 g. These size and topping amounts are demo assumptions. Prepared espresso, phin coffee, filtered cold brew and cooked pearls are separately counted intermediate ingredients; raw-to-prepared batch production is outside scope.

## Acceptance and verification

Theo xác nhận sau đó của chủ dự án, toàn bộ test/tooling đã được xóa **sau** kiểm chứng. Các tiêu chí dưới đây đã được thực thi; kết quả lịch sử và kiểm tra build/lint sau cleanup ở [báo cáo](inventory-verification.md). Bản bàn giao không có lệnh chạy lại bộ test.

Matcha 20g / milk 2000ml / syrup 200ml at 3/150/20 per S must return 6 with matcha limiting. Verify zero/missing recipes, additive sizes/toppings, shared-ingredient carts, transactional rollback, concurrent final stock, failed-payment retry/replay, cancel/repeated cancel, recipe edit after reservation, role/unit validation and staff-to-customer browser flow. Run repository API/web tests, lint, typecheck/build, PostgreSQL integration and Playwright when environment permits. Report actual blockers without claiming skipped checks passed.
