#!/usr/bin/env python3
"""Static A2 Task-2 acceptance smoke test. Does NOT replace PlantUML -checkonly."""
from pathlib import Path
import re
import sys
from xml.etree import ElementTree as ET

ROOT=Path(__file__).resolve().parent / 'diagrams'
EXPECTED={'activity-checkout','sequence-checkout','class-domain','state-order'}
DOMAIN={
    'User':['id','email','passwordHash','role'],
    'Product':['id','name','description','price','imageUrl','stock'],
    'Order':['id','userId','status','total','discountAmount','promotionId','createdAt'],
    'OrderItem':['id','orderId','productId','size','toppings','quantity','unitPrice','lineTotal'],
    'Payment':['id','orderId','method','status','amount','idempotencyKey','createdAt'],
    'Promotion':['id','code','discountPercent','validFrom','validTo','maxUses','usedCount','active'],
    'LoyaltyTransaction':['id','userId','orderId','type','points','createdAt'],
}
ENUMS={
 'Role':{'CUSTOMER','BARISTA'},
 'OrderStatus':{'PENDING','PAID','PAYMENT_FAILED','PREPARING','READY','COMPLETED','CANCELLED'},
 'PaymentMethod':{'WALLET','CARD'},
 'PaymentStatus':{'SUCCESS','FAILED','REFUNDED'},
 'LoyaltyType':{'EARN','REVERSAL'},
}
TRANSITIONS={('PENDING','PAID'),('PENDING','PAYMENT_FAILED'),('PENDING','CANCELLED'),
             ('PAYMENT_FAILED','PENDING'),('PAYMENT_FAILED','CANCELLED'),
             ('PAID','PREPARING'),('PREPARING','READY'),('READY','COMPLETED')}
RELATIONS=[('User','1','0..*','Order'),('Order','1','1..*','OrderItem'),
 ('Product','1','0..*','OrderItem'),('Order','1','0..*','Payment'),
 ('Promotion','0..1','0..*','Order'),('User','1','0..*','LoyaltyTransaction'),
 ('Order','0..1','0..*','LoyaltyTransaction')]
errors=[]
def check(ok, description):
 print(('PASS ' if ok else 'FAIL ')+description)
 if not ok:errors.append(description)

def block(text, kind, name):
 m=re.search(rf'(?ms)^\s*{kind}\s+{re.escape(name)}\s*\{{(.*?)^\}}',text)
 return m.group(1) if m else None

def action_balanced(s):
 depth=0;notes=0
 for ln in s.splitlines():
  v=ln.strip()
  if v.startswith('note '):notes+=1
  elif v=='end note':notes-=1
  elif not notes:
   if v.startswith('if ('):depth+=1
   if v=='endif':depth-=1
   if depth<0:return False
 return depth==0 and notes==0

def sequence_balanced(s):
 stack=[];note=False
 for ln in s.splitlines():
  v=ln.strip()
  if v.startswith('note '):
   note=not (':' in v)
   continue
  if note:
   if v=='end note':note=False
   continue
  if v.startswith(('alt ','opt ','group ','loop ','break ','par ')):stack.append(v.split(' ',1)[0])
  elif v.startswith('else'):
   if not stack or stack[-1]!='alt':return False
  elif v=='end':
   if not stack:return False
   stack.pop()
 return not stack and not note

for name in EXPECTED:
 p=ROOT/(name+'.puml');svg=ROOT/(name+'.svg')
 check(p.is_file() and svg.is_file(),f'{name}: source .puml + image .svg')
 if p.is_file():
  content=p.read_text(encoding='utf-8')
  check(content.lstrip().startswith('@startuml') and content.rstrip().endswith('@enduml'),f'{name}: PlantUML boundary markers')
 if svg.is_file():
  try:
   r=ET.parse(svg).getroot();ok=r.tag.endswith('svg') and svg.stat().st_size>500 and any(m in svg.read_text(encoding='utf-8') for m in ('<?plantuml','data-diagram-type='))
  except ET.ParseError:ok=False
  check(ok,f'{name}: SVG valid XML rendered by PlantUML')

class_src=(ROOT/'class-domain.puml').read_text(encoding='utf-8')
for name,attrs in DOMAIN.items():
 b=block(class_src,'class',name)
 check(b is not None and all(re.search(rf'\+{attr}\s*:',b) for attr in attrs),f'{name}: minimum properties')
for name,values in ENUMS.items():
 b=block(class_src,'enum',name)
 check(b is not None and set(re.findall(r'^\s*([A-Z][A-Z_]+)\s*$',b,re.M))==values,f'{name}: exact values')
relations=set()
for a,ma,mb,b in re.findall(r'(?m)^(\w+)\s+"([^"]+)"\s+(?:\*--|--)\s+"([^"]+)"\s+(\w+)',class_src):
 relations.add((a,ma,mb,b))
check(relations==set(RELATIONS),'class diagram: 7 associations & multiplicities')

state_src=(ROOT/'state-order.puml').read_text(encoding='utf-8')
actual=set(re.findall(r'(?m)^([A-Z_]+)\s+-->\s+([A-Z_]+)\s*:',state_src))
check(actual==TRANSITIONS,'state machine: exactly eight business transitions')
check(('PAID','CANCELLED') not in actual,'state machine: PAID -> CANCELLED is forbidden')

act=(ROOT/'activity-checkout.puml').read_text(encoding='utf-8')
check(all(f'|{name}|' in act for name in ('Customer','Next.js UI','NestJS API','Payment Service')),'activity: all four swimlanes')
check('start\n' in act and len(re.findall(r'^\s*stop\s*$',act,re.M))>=3,'activity: start and explicit terminal nodes for failures')
check(all(code in act for code in ('401 UNAUTHORIZED','OUT_OF_STOCK','PAYMENT_DECLINED')),'activity: E1/E2/E3 explicit')
check(action_balanced(act),'activity: balanced if/endif, note blocks')

seq=(ROOT/'sequence-checkout.puml').read_text(encoding='utf-8')
check(all(re.search(rf'^(?:actor|participant|database) "{re.escape(label)}',seq,re.M) for label in ('Customer','Next.js UI','NestJS API','Database','Payment Service')),'sequence: all five required lifelines')
check(all(s in seq for s in ('POST /orders','POST /payments','GET /orders/:id','JWT guard','Idempotency-Key')),'sequence: calls, JWT, idempotency header')
check(all(s in seq for s in ('Transaction T1','Transaction T2','E4a: successful replay','SAME orderId')),'sequence: T1/T2, replay, retry same order')
check(sequence_balanced(seq),'sequence: balanced alt/opt/group/end fragments')

if errors:
 print(f'\n{len(errors)} checks FAILED')
 sys.exit(1)
print('\nAll static checks PASSED. Run PlantUML -checkonly before PR merge.')
