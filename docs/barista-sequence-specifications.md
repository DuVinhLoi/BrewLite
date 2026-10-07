# ĐẶC TẢ BIỂU ĐỒ TUẦN TỰ — PHÂN HỆ PHA CHẾ (BARISTA, EXTENSION NGOÀI MVP)
> Phạm vi: UC08–UC12 theo sơ đồ usecase quầy. Quy ước đọc (`->`, `-->`, `activate`, `alt/opt/group`) xem Phần I của `docs/user-sequence-specifications.md`, áp dụng nguyên vẹn tại đây.

## UC08: Xem hàng đợi đơn chờ pha chế (PAID)
```plantuml
@startuml
skinparam DefaultFontColor #1f2937
skinparam ArrowColor #5b6b8c
skinparam SequenceParticipantBackgroundColor #eef2fb
skinparam SequenceParticipantBorderColor #5b6b8c
skinparam SequenceLifeLineBorderColor #5b6b8c
skinparam NoteBackgroundColor #fef3c7
skinparam NoteBorderColor #d97706
skinparam NoteFontColor #1f2937

autonumber
actor "Nhân viên pha chế" as Barista
participant "Giao diện quầy\n(Barista UI)" as QU
participant "Máy chủ xử lý\n(Backend)" as BE
database "Cơ sở dữ liệu" as DB

Barista -> QU : Mở màn hình hàng đợi pha chế
activate QU
QU -> BE : GET /orders?status=PAID\n(Header: Bearer JWT quầy)
activate BE
BE -> DB : Tra cứu danh sách đơn đã thanh toán (PAID, ORDER BY createdAt DESC)
activate DB
DB --> BE : Trả về danh sách đơn đang chờ pha
deactivate DB
BE --> QU : Gửi danh sách hàng đợi (200 OK)
deactivate BE
QU --> Barista : Hiển thị danh sách các món cần pha chế
deactivate QU
@enduml
```
* **Endpoint:** `GET /orders?status=PAID` (JWT quầy).

## UC09: Tiếp nhận pha chế (PAID -> PREPARING)
```plantuml
@startuml
skinparam DefaultFontColor #1f2937
skinparam ArrowColor #5b6b8c
skinparam SequenceParticipantBackgroundColor #eef2fb
skinparam SequenceParticipantBorderColor #5b6b8c
skinparam SequenceLifeLineBorderColor #5b6b8c

autonumber
actor "Nhân viên pha chế" as Barista
participant "Giao diện quầy\n(Barista UI)" as QU
participant "Máy chủ xử lý\n(Backend)" as BE
database "Cơ sở dữ liệu" as DB

Barista -> QU : Bấm "Tiếp nhận pha chế" cho đơn #1042
activate QU
QU -> BE : PATCH /orders/1042 { status: 'PREPARING' }
activate BE
BE -> BE : assertTransition(from: PAID, to: PREPARING)
BE -> DB : Cập nhật trạng thái đơn thành "PREPARING"
activate DB
DB --> BE : Đã cập nhật thành công
deactivate DB
BE --> QU : Xác nhận nhận đơn thành công (200 OK)
deactivate BE
QU --> Barista : Cập nhật trạng thái đơn: "Đang pha chế"
deactivate QU
@enduml
```
* **Endpoint:** `PATCH /orders/:id` (JWT quầy). Sai trạng thái (vd đơn chưa trả tiền) trả 400.
