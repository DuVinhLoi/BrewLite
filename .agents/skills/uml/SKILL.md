---
name: uml
description: Use when creating UML diagrams (Class, Sequence, State Machine, Component, Deployment, Use Case, Activity, ERD) in Markdown using PlantUML.
---

# UML Diagrams (PlantUML)

Use this skill whenever generating technical UML diagrams for software engineering, architecture, system design, or documentation.

This skill is powered by the **PlantUML engine** (`@markdown-viewer/draw-uml` / `@markdown-viewer/documd`), inheriting complete styling and pattern standards from [`../documd-visuals`](../documd-visuals/SKILL.md).

---

## 1. Iron Rules for UML Blocks

1. **Code Fence:** Always use ````plantuml```` (or ````puml````).
2. **Start & End tags:** Always wrap diagram definitions between `@startuml` and `@enduml`.
3. **Multi-line Declarations:** Prefer multi-line definitions (`class User {\n  +String name\n}`) rather than single-line shorthands for maximum parser compatibility.
4. **Consistent Styling:** Always include clean theme skinparams to avoid raw default monochrome styles. Use the **Default Theme** skinparams (or Slate/Contrast from `../documd-visuals/styles/palette.md`).
5. **Single Diagram per Fence:** Do not combine multiple diagram engines or nest fences.

---

## 2. Common Theme Skinparams

Add this standard styling block at the top of every diagram right after `@startuml`:

```plantuml
skinparam DefaultFontColor #1f2937
skinparam ArrowColor #5b6b8c
skinparam ArrowFontColor #1f2937
skinparam PackageBackgroundColor #f8fafc
skinparam PackageBorderColor #94a3b8
skinparam ClassBackgroundColor #eef2fb
skinparam ClassBorderColor #5b6b8c
skinparam ClassFontColor #1f2937
skinparam StateBackgroundColor #eef2fb
skinparam StateBorderColor #5b6b8c
skinparam StateFontColor #1f2937
skinparam ComponentBackgroundColor #eef2fb
skinparam ComponentBorderColor #5b6b8c
skinparam SequenceParticipantBackgroundColor #eef2fb
skinparam SequenceParticipantBorderColor #5b6b8c
skinparam SequenceLifeLineBorderColor #5b6b8c
skinparam NoteBackgroundColor #fef3c7
skinparam NoteBorderColor #d97706
skinparam NoteFontColor #1f2937
```

---

## 3. Standard Diagram Patterns

### A. State Machine Diagram (e.g. Order State Machine)
*Best for: Order lifecycles, connection states, workflow progression.*

```plantuml
@startuml
skinparam DefaultFontColor #1f2937
skinparam ArrowColor #5b6b8c
skinparam StateBackgroundColor #eef2fb
skinparam StateBorderColor #5b6b8c
skinparam StateFontColor #1f2937

title Order State Machine

[*] --> PENDING : createOrder()

state PENDING
state PAID #d8ebe0
state PREPARING
state READY
state COMPLETED #d8ebe0
state PAYMENT_FAILED #fbe4e4
state CANCELLED #e0e0e0

PENDING --> PAID : paymentSuccess
PENDING --> PAYMENT_FAILED : paymentError
PAYMENT_FAILED --> PENDING : retryPayment
PENDING --> CANCELLED : cancel()

PAID --> PREPARING : accept()
PREPARING --> READY : finishBrewing()
READY --> COMPLETED : deliver()
COMPLETED --> [*]

PAID --> CANCELLED : refund()
PAYMENT_FAILED --> CANCELLED : cancel()
CANCELLED --> [*]
@enduml
```

### B. Sequence Diagram (e.g. Payment & Checkout Flow)
*Best for: API request/response flows, inter-service communication, asynchronous callbacks.*

```plantuml
@startuml
skinparam SequenceParticipantBackgroundColor #eef2fb
skinparam SequenceParticipantBorderColor #5b6b8c
skinparam SequenceLifeLineBorderColor #5b6b8c
skinparam ArrowColor #5b6b8c

actor Customer
participant "Frontend (Next.js)" as FE
participant "PaymentController" as Controller
participant "PaymentService" as Service
participant "MockPaymentGateway" as Gateway
database "PostgreSQL" as DB

Customer -> FE : Chọn Ví điện tử & Bấm Thanh toán
FE -> Controller : POST /payments (Idempotency-Key)
activate Controller

Controller -> Service : processPayment(dto, key)
activate Service

Service -> DB : Check existing IdempotencyKey
alt Key already processed
    DB --> Service : Return existing Payment record
    Service --> Controller : Return cached 200 OK
else New transaction
    Service -> Gateway : charge(amount, method)
    Gateway --> Service : SUCCESS
    Service -> DB : update Order status to PAID
    Service -> DB : save Payment & add Loyalty points
    Service --> Controller : Return 201 Created (PAID)
end

Controller --> FE : 200/201 Payment response
deactivate Service
deactivate Controller
FE --> Customer : Hiển thị màn hình Xác nhận đơn
@enduml
```

### C. Class Diagram (e.g. Domain Entities & Database Models)
*Best for: Entity modeling, attributes, methods, inheritance, and relations.*

```plantuml
@startuml
skinparam ClassBackgroundColor #eef2fb
skinparam ClassBorderColor #5b6b8c
skinparam ArrowColor #5b6b8c

class User {
  +String id
  +String email
  +String passwordHash
  +Int loyaltyPoints
}

class Product {
  +String id
  +String name
  +Decimal price
  +Int stock
  +Int version
  +checkAndDeductStock(qty: Int)
}

class Order {
  +String id
  +String userId
  +OrderStatus status
  +Decimal total
  +DateTime createdAt
  +assertTransition(next: OrderStatus)
}

class OrderItem {
  +String id
  +String orderId
  +String productId
  +String size
  +Int quantity
  +Decimal lineTotal
}

class Payment {
  +String id
  +String orderId
  +String idempotencyKey
  +Decimal amount
  +PaymentMethod method
  +PaymentStatus status
}

enum OrderStatus {
  PENDING
  PAID
  PREPARING
  READY
  COMPLETED
  PAYMENT_FAILED
  CANCELLED
}

User "1" -- "0..*" Order : places >
Order "1" *-- "1..*" OrderItem : contains >
Product "1" -- "0..*" OrderItem : ordered in >
Order "1" -- "0..1" Payment : settled by >
@enduml
```

### D. Component Diagram (System Architecture)
*Best for: Service boundaries, packages, external systems, and API boundaries.*

```plantuml
@startuml
skinparam ComponentBackgroundColor #eef2fb
skinparam ComponentBorderColor #5b6b8c
skinparam DatabaseBackgroundColor #e3f3ea
skinparam DatabaseBorderColor #0a7a3d

package "BrewLite System" {
  [Next.js Client] as Client
  [NestJS REST API] as Backend
  
  package "Backend Modules" {
    [OrderModule] as Orders
    [PaymentModule] as Payments
    [AuthModule] as Auth
  }
}

database "PostgreSQL (Prisma)" as DB
cloud "Mock Payment Provider" as PaymentGateway

Client --> Backend : HTTPS / REST JSON
Backend --> DB : Prisma Client
Payments --> PaymentGateway : HTTP API
@enduml
```

---

## 4. Deep References & Specialized Scenarios

For comprehensive technical guides, see:
- Engine rules & icon library: [`../documd-visuals/engines/plantuml.md`](../documd-visuals/engines/plantuml.md)
- Software design scenarios (C4, Packages, Use cases): [`../documd-visuals/goals/software-design.md`](../documd-visuals/goals/software-design.md)
- Software behavior scenarios (Lifecycle, Sequences): [`../documd-visuals/goals/software-behaviour.md`](../documd-visuals/goals/software-behaviour.md)
- Palettes and styling tokens: [`../documd-visuals/styles/palette.md`](../documd-visuals/styles/palette.md)
