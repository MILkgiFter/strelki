# v7 (неон, симметрия на 3) и v8 (светлая палитра). Функции берутся из начала make2.py.
import os
src = open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'make2.py'), encoding='utf-8').read().split('# ---------- V4')[0]
exec(src)
R = 135
V = [(256+R*math.sin(math.radians(120*k)), 262-R*math.cos(math.radians(120*k))) for k in range(3)]
def lerp(a, b, t): return (a[0]+(b[0]-a[0])*t, a[1]+(b[1]-a[1])*t)
def arm(k, ts=.7, te=.3):
    a, b, c = V[k], V[(k+1) % 3], V[(k+2) % 3]
    return [lerp(a, b, ts), b, lerp(b, c, te)]

v7 = dict(bg=('rad', (256, 256), 400, [(0, '#4A2FA8'), (.55, '#1D1450'), (1, '#08071C')]), layers=[])
for k, (c, core) in enumerate([('#4DD8FF', '#EFFFFF'), ('#FF4D8D', '#FFEFF6'), ('#FFE84D', '#FFFBE0')]):
    v7['layers'] += glow(arm(k), 42, c, core, k=1.1)

v8 = dict(bg=('lin', (0, 0), (512, 512), [(0, '#9A3DE0'), (1, '#2B2BB0')]), layers=[])
for k, c in enumerate(['#FFB020', '#FF7A59', '#35E09A']):
    v8['layers'] += solid(arm(k), 44, c)

for name, v in [('v7', v7), ('v8', v8)]:
    open(os.path.join(OUT, name+'.svg'), 'w', encoding='utf-8').write(svg_of(v))
    render_png(v, os.path.join(OUT, name+'.png'))


def circ(img, size):
    im = img.resize((size, size), Image.LANCZOS).convert('RGBA')
    m = Image.new('L', (size*4, size*4), 0)
    ImageDraw.Draw(m).ellipse([0, 0, size*4-1, size*4-1], fill=255)
    im.putalpha(m.resize((size, size), Image.LANCZOS))
    return im

names = [('v7', 'v7.png'), ('v8', 'v8.png'), ('v6', 'v6.png'), ('v2 (keep)', 'keep/v2-arrow.png')]
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
sheet.save(os.path.join(OUT, 'preview3.png'))
