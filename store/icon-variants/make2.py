# Варианты v4-v6: змейки-стрелки как в игре, толстые. Использует функции из make.py (без пересборки v1-v3).
import math, os, re
src = open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'make.py'), encoding='utf-8').read()
src = src.split('# ---------- V1')[0]
src = src.replace('head_poly(pts, w)', 'head_poly(pts, w, layer.get("hl", 1.15), layer.get("hw", 1.05))')
src = src.replace("head_poly([(x+L.get('dx', 0), y+L.get('dy', 0)) for x, y in L['pts']], L['w'])",
                  "head_poly([(x+L.get('dx', 0), y+L.get('dy', 0)) for x, y in L['pts']], L['w'], L.get('hl', 1.15), L.get('hw', 1.05))")
exec(src)

HL, HW = .8, .78


def trim(pts, d):
    (x0, y0), (x1, y1) = pts[-2], pts[-1]
    l = math.hypot(x1-x0, y1-y0)
    return pts[:-1] + [(x1-(x1-x0)/l*d, y1-(y1-y0)/l*d)]


def rot(pts, deg, c=(256, 256)):
    a = math.radians(deg); ca, sa = math.cos(a), math.sin(a)
    return [(c[0]+(x-c[0])*ca-(y-c[1])*sa, c[1]+(x-c[0])*sa+(y-c[1])*ca) for x, y in pts]


def solid(pts, w, col, light='#FFFFFF', shadow=True, hl=HL, hw=HW):
    L = []
    if shadow:
        L.append(dict(pts=pts, w=w, head=True, fill='#000000', opacity=.38, blur=9, dy=9, hl=hl, hw=hw))
    L.append(dict(pts=pts, w=w, head=True, fill=col, hl=hl, hw=hw))
    L.append(dict(pts=pts[:-1], w=w*.2, fill=light, opacity=.38, dx=-w*.17, dy=-w*.17))
    return L


def glow(pts, w, col, core, hl=HL, hw=HW, k=1):
    return [dict(pts=pts, w=w*2.4, head=True, fill=col, opacity=.40*k, blur=24, hl=hl, hw=hw),
            dict(pts=pts, w=w*1.4, head=True, fill=col, opacity=.7*k, blur=8, hl=hl, hw=hw),
            dict(pts=pts, w=w, head=True, fill=col, hl=hl, hw=hw),
            dict(pts=pts[:-1], w=w*.36, fill=core, opacity=.92)]


def trail(pts, w, dirv, n=3, step=30, op=.3):
    out = []
    for i in range(1, n+1):
        out.append(dict(pts=pts[:-2] if len(pts) > 3 else pts[:-1], w=w*(1-.18*i), fill='#FFFFFF', opacity=op/i,
                        dx=dirv[0]*step*i, dy=dirv[1]*step*i))
    return out[::-1]


# ---------- V4: сердце из змеек, одна вылетает ----------
U = 47
def cell(c, r): return (256+(c-3)*U-4, 256+(r-2.5)*U+14)
def cp(cells, d=13): return trim([cell(*c) for c in cells], d)
v4 = dict(bg=('rad', (190, 150), 520, [(0, '#5A3DF0'), (.55, '#2B1C86'), (1, '#120B45')]), layers=[])
W4 = 40
snakes = [
    ([(1,0),(2,0),(2,1),(1,1),(0,1),(0,2),(1,2),(2,2)], '#5BB8FF'),
    ([(3,1),(3,2),(3,3),(2,3),(1,3)], '#C27BFF'),
    ([(4,1),(5,1),(6,1),(6,2),(5,2),(4,2)], '#FFD23F'),
    ([(2,4),(3,4),(3,5)], '#2FD08A'),
    ([(5,3),(4,3),(4,4)], '#FF5C8A'),
]
for cells, col in snakes:
    v4['layers'] += solid(cp(cells), W4, col)
fl = [(321, 160), (321, 96), (392, 96)]
v4['layers'] += trail(fl, W4, (0, 1), 3, 30, .35)
v4['layers'] += solid(fl, 42, '#FF8A3D', hl=.9, hw=.85)
v4['layers'][-1]['fill'] = ('lin', (300, 200), (430, 60), [(0, '#FF7A33'), (1, '#FFD23F')])
v4['layers'][-2]['fill'] = v4['layers'][-1]['fill']

# ---------- V5: клубок, из которого вырывается стрелка ----------
v5 = dict(bg=('lin', (0, 0), (512, 512), [(0, '#FF4F8B'), (.5, '#B93BE0'), (1, '#4B2BD8')]), layers=[])
S = 70; C5 = (206, 306)
def g(x, y): return (C5[0]+x*S, C5[1]+y*S)
W5 = 54
def gp(cells, d=16): return trim([g(*p) for p in cells], d)
v5['layers'] += solid(gp([(-1,-1),(0,-1),(0,0)]), W5, '#35D4FF')
v5['layers'] += solid(gp([(-1,1),(-1,0)]), W5, '#B58CFF')
v5['layers'] += solid(gp([(0,1),(1,1),(1,0)]), W5, '#3CE690')
fl5 = [g(1, -1), g(2.7, -2.7)]
fc = ('lin', g(1, -1), g(2.7, -2.7), [(0, '#FFB020'), (1, '#FFF6B0')])
v5['layers'] += solid(fl5, 60, fc, light='#FFE0A0', hl=.9, hw=.9)
v5['layers'][-3]['fill'] = fc
v5['layers'][-2]['fill'] = fc

# ---------- V6: неоновая вертушка из толстых змеек ----------
v6 = dict(bg=('rad', (256, 256), 400, [(0, '#43308F'), (.55, '#1A1440'), (1, '#07071A')]), layers=[])
arm = [(-40, -12), (-40, -118), (100, -118)]
cols = [('#4DD8FF', '#EFFFFF'), ('#FF4D8D', '#FFEFF6'), ('#FFE84D', '#FFFBE0'), ('#5CFF7A', '#F0FFF2')]
for k, (c, core) in enumerate(cols):
    pts = [(256+x, 256+y) for x, y in arm]
    pts = trim(rot(pts, 90*k), 16)
    v6['layers'] += glow(pts, 42, c, core)

for name, v in [('v4', v4), ('v5', v5), ('v6', v6)]:
    open(os.path.join(OUT, name+'.svg'), 'w', encoding='utf-8').write(svg_of(v))
    render_png(v, os.path.join(OUT, name+'.png'))


def circ(img, size):
    im = img.resize((size, size), Image.LANCZOS).convert('RGBA')
    m = Image.new('L', (size*4, size*4), 0)
    ImageDraw.Draw(m).ellipse([0, 0, size*4-1, size*4-1], fill=255)
    im.putalpha(m.resize((size, size), Image.LANCZOS))
    return im

names = [('v4', 'v4.png'), ('v5', 'v5.png'), ('v6', 'v6.png'), ('v2 (keep)', 'keep/v2-arrow.png')]
CW = 540
sheet = Image.new('RGB', (4*CW+20, 2*540), '#FFFFFF')
sd = ImageDraw.Draw(sheet)
for row, bgc in enumerate(['#F4F1EA', '#14151F']):
    sd.rectangle([0, row*540, sheet.width, row*540+540], fill=bgc)
    for i, (name, f) in enumerate(names):
        im = Image.open(os.path.join(OUT, f)).convert('RGB')
        x0, y0 = 20+i*CW, row*540+14
        big = circ(im, 380); sheet.paste(big, (x0, y0), big)
        s96 = circ(im, 96); sheet.paste(s96, (x0+400, y0), s96)
        s48 = circ(im, 48); sheet.paste(s48, (x0+400, y0+120), s48)
        sheet.paste(im.resize((96, 96), Image.LANCZOS), (x0+400, y0+190))
        sheet.paste(im.resize((48, 48), Image.LANCZOS), (x0+400, y0+300))
        sd.text((x0, y0+385), name, fill='#888888')
        sd.ellipse([x0+190-125, y0+190-125, x0+190+125, y0+190+125], outline='#888888')
sheet.save(os.path.join(OUT, 'preview2.png'))
