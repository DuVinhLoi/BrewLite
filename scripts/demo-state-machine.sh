#!/usr/bin/env bash
# Demo Order State Machine (đề §9.1) bằng curl, dự phòng cho buổi demo khi giao diện trục trặc.
# Luồng: đăng nhập demo → tạo đơn (PENDING) → thanh toán (PAID) → PATCH PREPARING → READY → COMPLETED,
# in trạng thái đọc lại từ backend sau mỗi bước, rồi thử 1 chuyển sai (COMPLETED → CANCELLED) để thấy 400.
# Chỉ gọi các endpoint có sẵn. Không cần jq. Thoát mã khác 0 nếu có bước không ra đúng kết quả.
#
# Chạy:  bash scripts/demo-state-machine.sh        (backend ở http://localhost:3000, đã seed tài khoản demo)
# Biến:  API=http://host:3000  DEMO_EMAIL=...  DEMO_PASSWORD=...
set -u

API="${API:-http://localhost:3000}"
EMAIL="${DEMO_EMAIL:-demo@brewlite.vn}"
PASSWORD="${DEMO_PASSWORD:-demo1234}"
BODY="$(mktemp)"
trap 'rm -f "$BODY"' EXIT

fail() { echo "LỖI: $*" >&2; exit 1; }

# json_get <field>: lấy giá trị chuỗi đầu tiên của "field" trong JSON một dòng ở $BODY (NestJS trả JSON gọn)
json_get() { sed -n "s/.*\"$1\":\"\([^\"]*\)\".*/\1/p" "$BODY" | head -n 1; }

# call <METHOD> <path> [json] [header...]: gọi API, ghi body vào $BODY, in mã HTTP
call() {
  local method="$1" path="$2" data="${3:-}"; shift 3 2>/dev/null || shift $#
  local args=(-s -o "$BODY" -w '%{http_code}' -X "$method" "$API$path" -H 'Content-Type: application/json')
  [ -n "${TOKEN:-}" ] && args+=(-H "Authorization: Bearer $TOKEN")
  for h in "$@"; do args+=(-H "$h"); done
  [ -n "$data" ] && args+=(-d "$data")
  curl "${args[@]}"
}

expect() { # expect <mã thực tế> <mã mong đợi> <mô tả>
  [ "$1" = "$2" ] || { echo "Phản hồi: $(cat "$BODY")" >&2; fail "$3: mong đợi HTTP $2, nhận $1"; }
}

state() { # đọc lại trạng thái đơn từ backend (GET /orders/:id)
  local code; code="$(call GET "/orders/$ORDER_ID" '')"
  expect "$code" 200 "GET /orders/$ORDER_ID"
  json_get status
}

step() { # step <số> <tiêu đề> <trạng thái mong đợi>
  local got; got="$(state)"
  [ "$got" = "$3" ] || fail "$2: mong đợi trạng thái $3, backend trả '$got'"
  printf '[%s] %-34s -> %s\n' "$1" "$2" "$got"
}

echo "== Demo Order State Machine ($API) =="

# 1. Đăng nhập
code="$(call POST /auth/login "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}")"
expect "$code" 200 "Đăng nhập $EMAIL"
TOKEN="$(json_get accessToken)"
[ -n "$TOKEN" ] || fail "Không lấy được accessToken"
echo "[0] Đăng nhập $EMAIL                    -> có JWT"

# 2. Chọn món còn hàng
code="$(call GET /products '')"
expect "$code" 200 "GET /products"
PRODUCT_ID="$(json_get id)"
[ -n "$PRODUCT_ID" ] || fail "Không có món nào còn hàng (hết kho?)"

# 3. Tạo đơn → PENDING
code="$(call POST /orders "{\"items\":[{\"productId\":\"$PRODUCT_ID\",\"quantity\":1}]}")"
expect "$code" 201 "POST /orders"
ORDER_ID="$(json_get id)"
[ -n "$ORDER_ID" ] || fail "Không lấy được mã đơn"
step 1 "POST /orders" PENDING

# 4. Thanh toán → PAID
KEY="demo-$(date +%s)-$RANDOM$RANDOM"
code="$(call POST /payments "{\"orderId\":\"$ORDER_ID\",\"paymentMethod\":\"WALLET\"}" "Idempotency-Key: $KEY")"
expect "$code" 201 "POST /payments"
step 2 "POST /payments" PAID

# 5. Tiến đơn như "quầy": PAID → PREPARING → READY → COMPLETED
n=3
for next in PREPARING READY COMPLETED; do
  code="$(call PATCH "/orders/$ORDER_ID" "{\"status\":\"$next\"}")"
  expect "$code" 200 "PATCH $next"
  step "$n" "PATCH /orders/:id {$next}" "$next"
  n=$((n + 1))
done

# 6. Chuyển sai có chủ đích: COMPLETED là trạng thái cuối nên hủy phải bị chặn
code="$(call PATCH "/orders/$ORDER_ID" '{"status":"CANCELLED"}')"
expect "$code" 400 "PATCH CANCELLED trên đơn COMPLETED"
echo "[6] PATCH CANCELLED trên đơn COMPLETED  -> HTTP 400 (chặn đúng): $(json_get message)"
step 7 "Trạng thái sau khi bị chặn" COMPLETED

echo "== Xong: PENDING → PAID → PREPARING → READY → COMPLETED, chuyển sai bị chặn 400 =="
