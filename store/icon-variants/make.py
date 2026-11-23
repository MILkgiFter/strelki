# Генератор вариантов иконки: один набор слоёв -> SVG и PNG (Pillow, без внешних растеризаторов).
import math, os
from PIL import Image, ImageDraw, ImageFilter
OUT = os.path.dirname(os.path.abspath(__file__))
N, S = 512, 2


def bez(p0, p1, p2, p3, n=40):
    r = []
    for i in range(n + 1):
        t = i / n
        u = 1 - t
        r.append((u**3*p0[0]+3*u*u*t*p1[0]+3*u*t*t*p2[0]+t**3*p3[0],
                  u**3*p0[1]+3*u*u*t*p1[1]+3*u*t*t*p2[1]+t**3*p3[1]))
    return r


def hexc(h):
    h = h.lstrip('#')
    return tuple(int(h[i:i+2], 16) for i in (0, 2, 4))


def head_poly(pts, w, hl=1.15, hw=1.05):
    (x0, y0), (x1, y1) = pts[-2], pts[-1]
    d = math.hypot(x1-x0, y1-y0)
    dx, dy = (x1-x0)/d, (y1-y0)/d
    nx, ny = -dy, dx
    L, H = w*hl*1.5, w*hw
    return [(x1+nx*H, y1+ny*H), (x1-nx*H, y1-ny*H), (x1+dx*L, y1+dy*L)]


def mask_of(layer):
    m = Image.new('L', (N*S, N*S), 0)
    d = ImageDraw.Draw(m)
    w = layer['w']*S
    pts = [((x+layer.get('dx', 0))*S, (y+layer.get('dy', 0))*S) for x, y in layer['pts']]
    for a, b in zip(pts, pts[1:]):
        dx, dy = b[0]-a[0], b[1]-a[1]
        l = math.hypot(dx, dy) or 1
        nx, ny = -dy/l*w/2, dx/l*w/2
        d.polygon([(a[0]+nx, a[1]+ny), (b[0]+nx, b[1]+ny), (b[0]-nx, b[1]-ny), (a[0]-nx, a[1]-ny)], fill=255)
    for p in pts:
        d.ellipse([p[0]-w/2, p[1]-w/2, p[0]+w/2, p[1]+w/2], fill=255)
    if layer.get('head'):
        hp = head_poly(pts, w)
        d.polygon(hp, fill=255)
        r = w*0.12
        hp2 = hp + [hp[0]]
        for a, b in zip(hp2, hp2[1:]):
            d.line([a, b], fill=255, width=int(r*2))
        for p in hp:
            d.ellipse([p[0]-r, p[1]-r, p[0]+r, p[1]+r], fill=255)
    if layer.get('blur'):
        m = m.filter(ImageFilter.GaussianBlur(layer['blur']*S))
    return m


def lut_color(stops, t):
    c = hexc(stops[-1][1])
    if t < stops[0][0]:
        return hexc(stops[0][1])
    for (o1, c1), (o2, c2) in zip(stops, stops[1:]):
        if o1 <= t <= o2:
            k = (t-o1)/(o2-o1) if o2 > o1 else 0
            return tuple(int(hexc(c1)[j]*(1-k)+hexc(c2)[j]*k) for j in range(3))
    return c


def grad_img(g, W):
    small = 128
    img = Image.new('RGB', (small, small))
    px = img.load()
    for yy in range(small):
        for xx in range(small):
            X, Y = (xx+.5)/small*N, (yy+.5)/small*N
            if g[0] == 'lin':
                (x1, y1), (x2, y2) = g[1], g[2]
                vx, vy = x2-x1, y2-y1
                t = ((X-x1)*vx+(Y-y1)*vy)/(vx*vx+vy*vy)
                stops = g[3]
            else:
                (cx, cy), r, stops = g[1], g[2], g[3]
                t = math.hypot(X-cx, Y-cy)/r
            px[xx, yy] = lut_color(stops, min(1, max(0, t)))
    return img.resize((W, W), Image.BICUBIC)


def render_png(v, path):
    W = N*S
    base = grad_img(v['bg'], W).convert('RGBA')
    for L in v['layers']:
        m = mask_of(L)
        if L.get('opacity', 1) < 1:
            m = m.point(lambda a, o=L['opacity']: int(a*o))
        f = L['fill']
        col = grad_img(f, W) if isinstance(f, tuple) else Image.new('RGB', (W, W), hexc(f))
        base.paste(col, (0, 0), m)
    base.convert('RGB').resize((N, N), Image.LANCZOS).save(path)


def svg_of(v):
    defs = []
    body = []

    def grad_def(g, gid):
        st = ''.join('<stop offset="%s" stop-color="%s"/>' % (o, c) for o, c in g[3])
        if g[0] == 'lin':
            return '<linearGradient id="%s" gradientUnits="userSpaceOnUse" x1="%s" y1="%s" x2="%s" y2="%s">%s</linearGradient>' % (gid, g[1][0], g[1][1], g[2][0], g[2][1], st)
        return '<radialGradient id="%s" gradientUnits="userSpaceOnUse" cx="%s" cy="%s" r="%s">%s</radialGradient>' % (gid, g[1][0], g[1][1], g[2], st)
    defs.append(grad_def(v['bg'], 'bg'))
    body.append('<rect width="%d" height="%d" fill="url(#bg)"/>' % (N, N))
    for i, L in enumerate(v['layers']):
        f = L['fill']
        if isinstance(f, tuple):
            defs.append(grad_def(f, 'g%d' % i))
            fill = 'url(#g%d)' % i
        else:
            fill = f
        if L.get('blur'):
            defs.append('<filter id="b%d" x="-30%%" y="-30%%" width="160%%" height="160%%"><feGaussianBlur stdDeviation="%s"/></filter>' % (i, L['blur']))
        pts = ' '.join('%.1f,%.1f' % (x+L.get('dx', 0), y+L.get('dy', 0)) for x, y in L['pts'])
        fa = ' filter="url(#b%d)"' % i if L.get('blur') else ''
        op = ' opacity="%s"' % L['opacity'] if L.get('opacity', 1) < 1 else ''
        s = '<g%s%s><polyline points="%s" fill="none" stroke="%s" stroke-width="%s" stroke-linecap="round" stroke-linejoin="round"/>' % (fa, op, pts, fill, L['w'])
        if L.get('head'):
            hp = head_poly([(x+L.get('dx', 0), y+L.get('dy', 0)) for x, y in L['pts']], L['w'])
            s += '<polygon points="%s" fill="%s" stroke="%s" stroke-width="%.1f" stroke-linejoin="round"/>' % (
                ' '.join('%.1f,%.1f' % p for p in hp), fill, fill, L['w']*0.24)
        body.append(s + '</g>')
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 %d %d" width="%d" height="%d"><defs>%s</defs>%s</svg>' % (
        N, N, N, N, ''.join(defs), ''.join(body))


def snake(pts, w, color):
    return [dict(pts=pts, w=w, head=True, fill='#000000', opacity=.30, blur=12, dy=12),
            dict(pts=pts, w=w, head=True, fill=color)]


# ---------- V1: вложенные колена, вылетающие вверх ----------
w1 = 38


def elbow(y, x, tip_y, col):
    pts = [(108, y), (x, y), (x, tip_y)]
    L = snake(pts, w1, col)
    L.append(dict(pts=[(109, y-9), (x-9, y-9), (x-9, tip_y)], w=w1*0.22, fill='#FFFFFF', opacity=.38))
    return L


v1 = dict(bg=('lin', (60, 0), (450, 512), [(0, '#7C9BFF'), (1, '#3447D6')]), layers=[])
v1['layers'] += elbow(400, 385, 165, '#FFB020') + elbow(337, 322, 205, '#FF7A59') + elbow(274, 259, 245, '#FFFFFF')

# ---------- V2: большая стрелка со шлейфом ----------
def sc(p): return [(256+(x-256)*.86-4, 256+(y-256)*.86+6) for x, y in p]
path = sc(bez((112, 392), (100, 250), (170, 215), (255, 205), 40)[:-1] + bez((255, 205), (330, 195), (350, 160), (360, 150), 30))
v2 = dict(bg=('lin', (0, 512), (512, 0), [(0, '#2A1A66'), (1, '#8B3DDB')]), layers=[])
for off, op, wd in [(-34, .25, 22), (-62, .14, 16)]:
    v2['layers'].append(dict(pts=[(x+off, y+off*0.5) for x, y in path[:-6]], w=wd, fill='#FFFFFF', opacity=op))
g2 = ('lin', (112, 392), (380, 130), [(0, '#FF7A59'), (.5, '#FFB020'), (1, '#FFF2B0')])
v2['layers'] += [dict(pts=path, w=54, head=True, fill='#000000', opacity=.35, blur=14, dy=14),
                 dict(pts=path, w=54, head=True, fill=g2),
                 dict(pts=path, w=14, fill='#FFFFFF', opacity=.35, dx=-10, dy=-10)]

# ---------- V3: неон ----------
v3 = dict(bg=('rad', (256, 256), 360, [(0, '#242649'), (1, '#0C0D17')]), layers=[])
w3 = 36


def neon(pts, col, core):
    return [dict(pts=pts, w=w3*2.2, head=True, fill=col, opacity=.35, blur=22),
            dict(pts=pts, w=w3*1.35, head=True, fill=col, opacity=.6, blur=7),
            dict(pts=pts, w=w3, head=True, fill=col),
            dict(pts=pts, w=w3*.38, fill=core, opacity=.9)]


v3['layers'] += neon([(112, 140), (256, 140), (256, 235)], '#4DD8FF', '#EFFFFF')
v3['layers'] += neon([(400, 400), (400, 215)], '#FF4D8D', '#FFEFF6')
v3['layers'] += neon([(112, 250), (112, 385), (285, 385)], '#5CFF7A', '#F0FFF2')

for name, v in [('v1', v1), ('v2', v2), ('v3', v3)]:
    open(os.path.join(OUT, name+'.svg'), 'w', encoding='utf-8').write(svg_of(v))
    render_png(v, os.path.join(OUT, name+'.png'))


# ---------- превью ----------
def circ(img, size):
    im = img.resize((size, size), Image.LANCZOS).convert('RGBA')
    m = Image.new('L', (size*4, size*4), 0)
    ImageDraw.Draw(m).ellipse([0, 0, size*4-1, size*4-1], fill=255)
    im.putalpha(m.resize((size, size), Image.LANCZOS))
    return im


sheet = Image.new('RGB', (3*540+20, 2*540), '#FFFFFF')
sd = ImageDraw.Draw(sheet)
for row, bgc in enumerate(['#F4F1EA', '#14151F']):
    sd.rectangle([0, row*540, sheet.width, row*540+540], fill=bgc)
    for i, name in enumerate(['v1', 'v2', 'v3']):
        im = Image.open(os.path.join(OUT, name+'.png')).convert('RGB')
        x0, y0 = 20+i*540, row*540+14
        big = circ(im, 380)
        sheet.paste(big, (x0, y0), big)
        s96 = circ(im, 96)
        sheet.paste(s96, (x0+400, y0), s96)
        s48 = circ(im, 48)
        sheet.paste(s48, (x0+400, y0+120), s48)
        sheet.paste(im.resize((96, 96), Image.LANCZOS), (x0+400, y0+190))
        sd.text((x0, y0+385), name, fill='#888888')
        # безопасная зона 66%
        sd.ellipse([x0+190-125, y0+190-125, x0+190+125, y0+190+125], outline='#888888')
sheet.save(os.path.join(OUT, 'preview.png'))
