# v9 (светлый фон, плоские змейки-стрелки, сердце) и v10 (неон). Функции из начала make2.py.
import os
src = open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'make2.py'), encoding='utf-8').read().split('# ---------- V4')[0]
exec(src)
U = 47
def cell(c, r): return (256+(c-3)*U, 256+(r-2.5)*U+14)
def cp(cells, d=6): return trim([cell(*c) for c in cells], d)
W = 34
snk = [
    [(1,0),(2,0),(2,1),(1,1),(0,1),(0,2),(1,2),(1,3)],
    [(3,1),(3,2),(2,2),(2,3),(2,4)],
    [(4,1),(5,1),(6,1),(6,2),(5,2),(4,2)],
    [(3,3),(3,4),(3,5)],
    [(4,4),(4,3),(5,3)],
]
c40 = cell(4, 0)
fly = [(c40[0]+4, c40[1]-34), (c40[0]+56, c40[1]-34), (c40[0]+56, c40[1]-92)]
dashes = [[(c40[0]-52, c40[1]-52+j*14), (c40[0]-22, c40[1]-52+j*14)] for j in range(3)]

light = ['#5B7FFF', '#A76BFF', '#FFB020', '#2BB673', '#A76BFF']
v9 = dict(bg=('lin', (0, 0), (0, 512), [(0, '#FBF9F4'), (1, '#F4F1EA')]), layers=[])
for cells, c in zip(snk, light):
    v9['layers'].append(dict(pts=cp(cells), w=W, head=True, fill=c, hl=.5, hw=.7))
v9['layers'].append(dict(pts=trim(fly, 4), w=W+3, head=True, fill='#FF7A59', hl=.5, hw=.7))
for d in dashes:
    v9['layers'].append(dict(pts=d, w=8, fill='#FF7A59', opacity=.6))

neon = ['#4DD8FF', '#C76BFF', '#FFE84D', '#5CFF7A', '#FF4D8D']
cores = ['#EFFFFF', '#F8EFFF', '#FFFBE0', '#F0FFF2', '#FFEFF6']
v10 = dict(bg=('lin', (0, 0), (0, 512), [(0, '#14151F'), (1, '#14151F')]), layers=[])
for cells, c, k in zip(snk, neon, cores):
    v10['layers'] += glow(cp(cells), W, c, k, hl=.5, hw=.7, k=.9)
v10['layers'] += glow(trim(fly, 4), W+3, '#FF4D8D', '#FFEFF6', hl=.5, hw=.7)
for d in dashes:
    v10['layers'].append(dict(pts=d, w=8, fill='#FF4D8D', opacity=.7))

for name, v in [('v9', v9), ('v10', v10)]:
    open(os.path.join(OUT, name+'.svg'), 'w', encoding='utf-8').write(svg_of(v))
    render_png(v, os.path.join(OUT, name+'.png'))


def circ(img, size):
    im = img.resize((size, size), Image.LANCZOS).convert('RGBA')
    m = Image.new('L', (size*4, size*4), 0)
    ImageDraw.Draw(m).ellipse([0, 0, size*4-1, size*4-1], fill=255)
    im.putalpha(m.resize((size, size), Image.LANCZOS))
    return im

names = [('v9', 'v9.png'), ('v10', 'v10.png'), ('v2 (keep)', 'keep/v2-arrow.png')]
CW = 540
sheet = Image.new('RGB', (3*CW+20, 2*540), '#FFFFFF')
sd = ImageDraw.Draw(sheet)
for row, bgc in enumerate(['#FFFFFF', '#14151F']):
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
sheet.save(os.path.join(OUT, 'preview4.png'))
