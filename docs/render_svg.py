#!/usr/bin/env python3
"""Offline SVG preview renderer for the four supplied PlantUML diagrams.
The .puml source remains canonical; use PlantUML CLI to refresh native SVG if available.
"""
from pathlib import Path
import re, html, math, textwrap
from xml.etree import ElementTree as ET
from graphviz import Digraph

ROOT=Path(__file__).parent/'docs'/'diagrams'
FONT='DejaVu Sans'
C={'ink':'#20354a','blue':'#315c7e','line':'#65829c','pale':'#eef5fb','gold':'#fff3d7','goldline':'#b38a40','green':'#e5f5e9','red':'#ffecea','bg':'#ffffff','muted':'#64788d'}
NS='http://www.w3.org/2000/svg'
ET.register_namespace('',NS)
def svg_elem(tag,**attrs):return ET.Element('{'+NS+'}'+tag,{k.replace('_','-'):str(v) for k,v in attrs.items() if v is not None})
def add(parent,tag,**attrs):
 e=svg_elem(tag,**attrs);parent.append(e);return e
def txt(parent,x,y,s,fontsize=14,bold=False,anchor='middle',fill=None,linespace=1.3):
 arr=str(s).replace('\\n','\n').split('\n'); el=add(parent,'text',x=x,y=y,fill=fill or C['ink'],font_family=FONT,font_size=fontsize,font_weight='bold' if bold else 'normal',text_anchor=anchor)
 for i,t in enumerate(arr):
  e=add(el,'tspan',x=x,dy='0' if i==0 else str(fontsize*linespace));e.text=t
 return el
def wrap(s,width=38):
 segments=str(s).replace('\\n','\n').split('\n');r=[]
 for seg in segments:
  r.extend(textwrap.wrap(seg,width=width,break_long_words=False,break_on_hyphens=False) or [''])
 return '\n'.join(r)
def rect(p,x,y,w,h,fill,stroke=None,rx=10,sw=1.6):return add(p,'rect',x=x,y=y,width=w,height=h,rx=rx,fill=fill,stroke=stroke or 'none',stroke_width=sw)
def line(p,x1,y1,x2,y2,dashed=False,color=None,width=1.8):return add(p,'line',x1=x1,y1=y1,x2=x2,y2=y2,stroke=color or C['line'],stroke_width=width,stroke_dasharray='6,5' if dashed else None)
def save_svg(svg,file):
 tree=ET.ElementTree(svg);tree.write(file,encoding='utf-8',xml_declaration=True)
def make_canvas(w,h,title,subtitle):
 s=svg_elem('svg',viewBox=f'0 0 {w} {h}',width=w,height=h)
 rect(s,0,0,w,h,C['bg'],rx=0)
 rect(s,0,0,w,82,C['blue'],rx=0)
 txt(s,40,40,title,24,True,'start','#fff')
 txt(s,40,65,subtitle,12,False,'start','#e4eff7')
 return s

# Class diagram: exact types, attributes and relations read from PlantUML source.
def render_class():
 src=(ROOT/'class-domain.puml').read_text(); d=Digraph('ClassDomain',format='svg',engine='dot')
 d.attr(rankdir='LR',bgcolor='white',splines='spline',nodesep='0.52',ranksep='1.05',pad='0.36',fontname=FONT)
 d.attr('node',shape='plain',fontname=FONT)
 d.attr('edge',fontname=FONT,fontsize='10',color=C['line'],fontcolor=C['ink'],arrowsize='.6')
 found={}
 for mo in re.finditer(r'(?ms)^(class|enum)\s+(\w+)\s*\{\n(.*?)^\}',src):
  kind,name,body=mo.groups(); attrs=[x.strip() for x in body.splitlines() if x.strip()]
  found[name]=kind
  hd='#315c7e' if kind=='class' else '#6a7288'
  rows=[f'<TR><TD BGCOLOR="{hd}" ALIGN="LEFT" CELLPADDING="9"><FONT COLOR="white" POINT-SIZE="16"><B>{html.escape(name)}</B></FONT></TD></TR>']
  for a in attrs:rows.append('<TR><TD ALIGN="LEFT" CELLPADDING="4"><FONT FACE="DejaVu Sans" POINT-SIZE="11">'+html.escape(a)+'</FONT></TD></TR>')
  label='< <TABLE BORDER="1" CELLBORDER="0" CELLSPACING="0" CELLPADDING="1" COLOR="#6b869e" BGCOLOR="#f5f9fc">'+''.join(rows)+'</TABLE> >'
  d.node(name,label=label)
 # The exact parser used for all associations:
 for ln in src.splitlines():
  m=re.match(r'^([A-Z]\w*)\s+"([^"]+)"\s+(\*--|--)\s+"([^"]+)"\s+([A-Z]\w*)\s*:\s*(.+)',ln)
  if m:
   a,ma,rel,mb,b,verb=m.groups();d.edge(a,b,taillabel=ma,headlabel=mb,label=verb.strip(),dir='none',len='1.5',minlen='1')
  m=re.match(r'^([A-Z]\w*)\s+\.\.>\s+([A-Z]\w*)$',ln)
  if m:d.edge(*m.groups(),style='dashed',constraint='false',color='#b5a5bb',arrowsize='.5')
 for extra,txts in [('Promotion','Domain only: FR-17 Won\'t'),('LoyaltyTransaction','Domain only: FR-18/19 Won\'t')]:
  pass
 out=ROOT/'class-domain.svg';d.render(filename=str(out.with_suffix('')),cleanup=True,format='svg')
 return out

def render_state():
 src=(ROOT/'state-order.puml').read_text();d=Digraph('StateOrder',format='svg',engine='dot')
 d.attr(rankdir='LR',bgcolor='white',pad='.45',nodesep='.7',ranksep='1.0',splines='spline',fontname=FONT)
 d.attr('node',fontname=FONT,shape='box',style='rounded,filled',fillcolor=C['pale'],color=C['line'],fontcolor=C['ink'],penwidth='1.6',fontsize='13',margin='0.25,0.16')
 d.attr('edge',fontname=FONT,fontsize='10',color=C['blue'],fontcolor=C['ink'],arrowsize='.7')
 states=['PENDING','PAYMENT_FAILED','PAID','PREPARING','READY','COMPLETED','CANCELLED']
 for st in states:
  fill=C['red'] if st=='PAYMENT_FAILED' else (C['green'] if st=='COMPLETED' else '#eeeef2' if st=='CANCELLED' else C['pale'])
  d.node(st,fillcolor=fill)
 d.node('START',label='',shape='circle',width='.2',height='.2',style='filled',fillcolor=C['ink'])
 d.node('END',label='',shape='doublecircle',width='.23',height='.23',style='filled',fillcolor=C['ink'])
 for ln in src.splitlines():
  m=re.match(r'^([A-Z_]+|\[\*\])\s+-->\s+([A-Z_]+|\[\*\])\s*(?::\s*(.*))?',ln)
  if m:
   fr,to,label=m.groups(); fr='START' if fr=='[*]' else fr;to='END' if to=='[*]' else to
   c=('dashed' if label and 'Could' in label else 'solid')
   d.edge(fr,to,label=label or '',style=c)
 d.node('model_note',shape='note',label='8 valid business transitions (BR-08 / FR-23)\nPAID → CANCELLED is forbidden: 409\nThe two → CANCELLED edges are FR-25 (Could).',fontsize='11',fillcolor=C['gold'],color=C['goldline'])
 d.edge('PAID','model_note',style='dotted',arrowhead='none',constraint='false')
 out=ROOT/'state-order.svg';d.render(filename=str(out.with_suffix('')),cleanup=True,format='svg')
 return out

# Sequence renderer: lifelines, message ordering, requests and returns taken from the canonical source.
def render_sequence():
 src=(ROOT/'sequence-checkout.puml').read_text().splitlines()
 people=[];rows=[];i=0
 while i<len(src):
  ln=src[i].strip();i+=1
  m=re.match(r'^(actor|participant|database)\s+"(.+)"\s+as\s+(\w+)',ln)
  if m: people.append((m.group(3),m.group(2).replace('\\n','\n'),m.group(1)));continue
  if ln.startswith('=='):rows.append(('header',ln.strip('= '),None,None));continue
  m=re.match(r'^([A-Za-z]+)\s+(-->|->)\s+([A-Za-z]+)\s*:\s*(.+)$',ln)
  if m:rows.append(('msg',m.group(1),m.group(3),m.group(4),m.group(2)));continue
  if ln.startswith(('alt ','else ','opt ','group ','break ','end')):
   if ln=='end':rows.append(('end','','',''))
   else:rows.append(('ctrl',ln.split(' ',1)[0],None,ln.split(' ',1)[1]))
   continue
  if ln.startswith('note '):
   if ':' in ln: note=ln.split(':',1)[1].strip()
   else:
    content=[]
    while i<len(src) and src[i].strip()!='end note':content.append(src[i].strip());i+=1
    i+=1
    note=' '.join(content)
   rows.append(('note',None,None,note));continue
 row_heights=[]
 for r in rows:
  typ,a,b,c,*_=r
  if typ=='msg':row_heights.append(51+18*(len(wrap(c,40).splitlines())-1))
  elif typ=='header':row_heights.append(56)
  elif typ=='ctrl':row_heights.append(40+12*(len(wrap(c,105).splitlines())-1))
  elif typ=='note':row_heights.append(44+14*(len(wrap(c,135).splitlines())-1))
  else:row_heights.append(16)
 width=1950;h=155+sum(row_heights)+70;s=make_canvas(width,h,'Sequence diagram · UC-04 Checkout','Customer | Next.js UI | NestJS API | Database | Payment Service · A2')
 x_by={n:165+405*j for j,(n,_,_) in enumerate(people)}
 for n,label,kind in people:
  x=x_by[n];rect(s,x-117,101,234,64,C['pale'],C['line'],10)
  txt(s,x,121,label,14,True)
  line(s,x,166,x,h-44,True,C['line'],1.4)
 y=185;depth=0
 for row,rh in zip(rows,row_heights):
  typ,a,b,c,*_=row
  if typ=='header':
   rect(s,55,y+7,width-110,36,'#dceaf5',rx=4)
   txt(s,width/2,y+31,a,15,True)
  elif typ=='ctrl':
   if a=='else':
    line(s,66,y+2,width-66,y+2,True,'#cba96b',1.3)
   else:depth+=1
   fill=C['gold'] if a in ('alt','else','break') else '#ecf4f9'
   border=C['goldline'] if a in ('alt','else','break') else '#bed0df'
   rect(s,69+min(depth,5)*6,y+4,width-138-min(depth,5)*12,rh-10,fill,border,rx=4,sw=1)
   txt(s,90+min(depth,5)*6,y+23,wrap(f'{a.upper()} — {c}',125),12,True,'start')
  elif typ=='end':
   line(s,79,y+8,width-79,y+8,True,'#ccd6e1',1);depth=max(depth-1,0)
  elif typ=='note':
   rect(s,86,y+2,width-172,rh-8,'#fff9e9','#ddc58f',rx=8,sw=1)
   txt(s,106,y+19,wrap(c,135),11,False,'start')
  elif typ=='msg':
   x1,x2=x_by.get(a,165),x_by.get(b,165);is_self=x1==x2
   arrow_kind=row[4];is_return=arrow_kind=='-->'
   label=wrap(c,42 if not is_self else 37)
   msg_y=y+28+17*(len(label.splitlines())-1)
   if is_self:
    add(s,'path',d=f'M {x1} {msg_y} h 104 v 16 h -104',stroke=C['blue'],fill='none',stroke_width=1.8,stroke_dasharray='5,4' if is_return else None)
    add(s,'path',d=f'M {x1} {msg_y+16} l 8 -5 v 10 z',fill=C['blue'])
    tx=x1+13;anchor='start'
   else:
    line(s,x1,msg_y,x2,msg_y,dashed=is_return,color=C['blue'])
    direction=1 if x2>x1 else -1
    if is_return:
     add(s,'path',d=f'M {x2-10*direction} {msg_y-5} L {x2} {msg_y} L {x2-10*direction} {msg_y+5}',fill='none',stroke=C['blue'],stroke_width=1.8)
    else:
     add(s,'polygon',points=f'{x2},{msg_y} {x2-11*direction},{msg_y-5} {x2-11*direction},{msg_y+5}',fill=C['blue'])
    tx=(x1+x2)/2;anchor='middle'
   txt(s,tx,y+18,label,11.7,False,anchor)
  y+=rh
 txt(s,40,h-27,'BrewLite A2 · Source: sequence-checkout.puml · Offline SVG preview',11,False,'start',C['muted'])
 out=ROOT/'sequence-checkout.svg';save_svg(s,out);return out

# Swimlane activity visual: summarized from the detailed actions/decision structure of activity-checkout.puml.
def render_activity():
 # An offline swimlane view of the UC-04 branches in activity-checkout.puml.
 w,h=1860,4020;s=make_canvas(w,h,'Activity diagram · UC-04 Checkout','SRS A2 · E1a/E1b authentication | E2 stock | E3 payment | E4a replay')
 lanes=[(20,470),(485,460),(950,460),(1415,425)];names=['Customer','Next.js UI','NestJS API','Payment Service']
 for i,(x,ww) in enumerate(lanes):
  rect(s,x,100,ww,h-142,('#f9fbfd' if i%2==0 else '#eff6fb'),'#d8e6f0',3,1)
  rect(s,x,100,ww,49,'#dceaf5',rx=3,sw=0)
  txt(s,x+ww/2,131,names[i],18,True)
 centers=[x+ww/2 for x,ww in lanes];nodes={}
 def step(id,lane,y,label,kind='action',ww=345):
  cx=centers[lane]
  if kind=='diamond':
   bw=240;add(s,'polygon',points=f'{cx},{y-51} {cx+bw/2},{y} {cx},{y+51} {cx-bw/2},{y}',fill=C['gold'],stroke=C['goldline'],stroke_width=2)
   txt(s,cx,y-7,wrap(label,22),12,True);nodes[id]=(cx,y,kind);return
  if kind=='terminal':
   good=('PAID' in label or 'SUCCESS' in label)
   rect(s,cx-142,y-30,284,60,C['green'] if good else '#fff0ee','#6b8597',29)
   txt(s,cx,y-7,wrap(label,33),13,True);nodes[id]=(cx,y,kind);return
  label=wrap(label,39);mult=len(label.splitlines());bh=max(56,22+mult*18)
  rect(s,cx-ww/2,y-bh/2,ww,bh,C['pale'],C['line'],9,1.7)
  txt(s,cx,y-(mult-1)*9+5,label,13,False);nodes[id]=(cx,y,kind)
 def arrow(a,b,label='',dashed=False):
  x1,y1,_=nodes[a];x2,y2,_=nodes[b]
  if abs(x2-x1)<35:st=(x1,y1+33);en=(x2,y2-32)
  else:st=(x1+(170 if x2>x1 else -170),y1+12);en=(x2-(170 if x2>x1 else -170),y2-12)
  if abs(st[0]-en[0])<5:
   add(s,'path',d=f'M {st[0]} {st[1]} L {en[0]} {en[1]}',fill='none',stroke=C['blue'],stroke_width=1.8,stroke_dasharray='7,5' if dashed else None)
  else:
   midway=(st[1]+en[1])/2
   add(s,'path',d=f'M {st[0]} {st[1]} L {st[0]} {midway} L {en[0]} {midway} L {en[0]} {en[1]}',fill='none',stroke=C['blue'],stroke_width=1.8,stroke_dasharray='7,5' if dashed else None)
  if en[1]>=st[1]:pts=f'{en[0]},{en[1]} {en[0]-5},{en[1]-10} {en[0]+5},{en[1]-10}'
  else:pts=f'{en[0]},{en[1]} {en[0]-5},{en[1]+10} {en[0]+5},{en[1]+10}'
  add(s,'polygon',points=pts,fill=C['blue'])
  if label:
   tx=(st[0]+en[0])/2+12;ty=(st[1]+en[1])/2-8
   rect(s,tx-36,ty-15,72,23,'white',rx=4)
   txt(s,tx,ty,label,11,True)
 step('start',0,195,'START',kind='terminal')
 step('cart',0,290,'Cart -> checkout')
 step('auth',1,400,'Logged in as CUSTOMER?',kind='diamond')
 step('login',0,512,'E1a: Login; cart retained')
 step('loginout',0,609,'END: if no login, no Order',kind='terminal')
 step('checkout',1,640,'Return to /checkout')
 step('confirm',0,755,'Choose wallet/card; confirm')
 step('postorder',1,850,'POST /orders + JWT + items')
 step('orderguard',2,940,'JWT/role guard (401 -> login then retry)')
 step('dto',2,1090,'Validate DTO; compute server prices')
 step('badinput',1,1190,'E6: 400/404; correct cart')
 step('inputend',0,1310,'END: invalid cart preserved',kind='terminal')
 step('stock',2,1370,'Stock sufficient?',kind='diamond')
 step('outstock',1,1510,'E2: 409 OUT_OF_STOCK; rollback')
 step('stockend',0,1610,'END: no Order; edit cart',kind='terminal')
 step('tx',2,1600,'T1: reserve stock + insert Order PENDING + items')
 step('received',1,1740,'201 orderId; persist owner + key')
 step('postpay',1,1860,'POST /payments + key + orderId')
 step('payguard',2,1960,'JWT guard; unauthorized -> 401')
 step('expired',2,2080,'401 after Order? (E1b)',kind='diamond')
 step('loginpay',0,2220,'Re-login SAME Customer; keep orderId/key')
 step('fetch',2,2290,'GET /orders/:id, check ownership/status')
 step('status',2,2410,'Owner + payable?',kind='diamond')
 step('noresume',1,2520,'403 / PAID+ / CANCELLED: no charge')
 step('resumeend',0,2610,'END: original Order retained',kind='terminal')
 step('retrypay',1,2640,'Retry SAME /payments request')
 step('validpay',2,2750,'Validate body/key; check owner (E6/E7)')
 step('cache',2,2890,'API success cache hit? (E4a)',kind='diamond')
 step('cachehit',1,3030,'200 original SUCCESS; no charge')
 step('payable',2,3090,'Order payable?',kind='diamond')
 step('nonpayable',1,3190,'409 ORDER_NOT_PAYABLE')
 step('nonpayend',0,3310,'END: do not charge',kind='terminal')
 step('charge',3,3230,'Payment Service: charge by orderId (E8b)')
 step('accept',3,3330,'Charge SUCCESS?',kind='diamond')
 step('failed',2,3480,'E3: Payment FAILED; Order PAYMENT_FAILED')
 step('failedui',1,3600,'402; keep cart & reserved stock; Retry')
 step('failedend',0,3720,'END: PAYMENT_FAILED',kind='terminal')
 step('success',2,3710,'T2: one Payment SUCCESS + Order PAID')
 step('receipt',1,3840,'Receipt; clear cart after SUCCESS')
 step('successend',0,3940,'END: PAID / tracking',kind='terminal')
 for a,b,label,ds in [
 ('start','cart','',0),('cart','auth','',0),('auth','login','no',0),
 ('login','checkout','done',0),('login','loginout','leave',1),('auth','checkout','yes',0),
 ('checkout','confirm','',0),('confirm','postorder','',0),('postorder','orderguard','',0),('orderguard','dto','',0),
 ('dto','badinput','invalid',0),('badinput','inputend','',0),('dto','stock','valid',0),
 ('stock','outstock','no',0),('outstock','stockend','',0),('stock','tx','yes',0),('tx','received','',0),
 ('received','postpay','',0),('postpay','payguard','',0),('payguard','expired','',0),
 ('expired','loginpay','401',1),('loginpay','fetch','',1),('fetch','status','',1),
 ('status','noresume','no',1),('noresume','resumeend','',1),('status','retrypay','yes',1),
 ('retrypay','validpay','same key',1),('expired','validpay','JWT ok',0),
 ('validpay','cache','',0),('cache','cachehit','hit',0),('cache','payable','miss',0),
 ('payable','nonpayable','no',0),('nonpayable','nonpayend','',0),
 ('payable','charge','yes',0),('charge','accept','',0),('accept','failed','no',0),
 ('failed','failedui','',0),('failedui','failedend','',0),('accept','success','yes',0),
 ('success','receipt','',0),('cachehit','receipt','',0),('receipt','successend','',0)
 ]:arrow(a,b,label,bool(ds))
 out=ROOT/'activity-checkout.svg';save_svg(s,out);return out

if __name__=='__main__':
 for f in (render_activity,render_sequence,render_class,render_state):
  p=f();print(p,p.stat().st_size)
