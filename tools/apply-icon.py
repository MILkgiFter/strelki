"""Поставить новую иконку приложения из одной картинки во все места.

Запуск: python -I tools/apply-icon.py assets/incoming/<файл>.png
Картинка: квадратная (или будет обрезана по центру), фон на весь квадрат, главное в центральных 66%.
Пишет: public/icons/*, android mipmap-* (обычная, круглая, передний слой adaptive), цвет фона adaptive,
заставки drawable*/splash.png, store/icon-512.png, store/play-upload/icon-512.png.
"""
import base64
import io
import os
import re
import sys

from PIL import Image, ImageDraw

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RES = os.path.join(ROOT, 'android', 'app', 'src', 'main', 'res')
DENS = {'mdpi': 1, 'hdpi': 1.5, 'xhdpi': 2, 'xxhdpi': 3, 'xxxhdpi': 4}


def load(path):
    im = Image.open(path).convert('RGBA')
    w, h = im.size
    s = min(w, h)
    im = im.crop(((w - s) // 2, (h - s) // 2, (w - s) // 2 + s, (h - s) // 2 + s))
    return im.resize((1024, 1024), Image.LANCZOS)


def edge_color(im):
    # средний цвет полоски по краям — фон adaptive-иконки и заставки
    px = im.convert('RGB').load()
    pts = [(x, y) for x in range(0, 1024, 32) for y in (4, 1019)] + [(x, y) for y in range(0, 1024, 32) for x in (4, 1019)]
    r = g = b = 0
    for x, y in pts:
        c = px[x, y]
        r, g, b = r + c[0], g + c[1], b + c[2]
    n = len(pts)
    return (r // n, g // n, b // n)


def masked(im, size, kind):
    big = im.resize((size * 4, size * 4), Image.LANCZOS)
    m = Image.new('L', big.size, 0)
    d = ImageDraw.Draw(m)
    if kind == 'round':
        d.ellipse((0, 0, big.size[0] - 1, big.size[1] - 1), fill=255)
    else:
        d.rounded_rectangle((0, 0, big.size[0] - 1, big.size[1] - 1), radius=int(big.size[0] * 0.2), fill=255)
    out = Image.new('RGBA', big.size, (0, 0, 0, 0))
    out.paste(big, (0, 0), m)
    return out.resize((size, size), Image.LANCZOS)


def save(img, *parts):
    p = os.path.join(ROOT, *parts)
    os.makedirs(os.path.dirname(p), exist_ok=True)
    img.save(p, optimize=True)
    return p


def main(src):
    im = load(src)
    bg = edge_color(im)
    hexbg = '#%02X%02X%02X' % bg
    rgb = im.convert('RGB')

    # веб / PWA
    save(rgb.resize((512, 512), Image.LANCZOS), 'public', 'icons', 'icon-512.png')
    save(rgb.resize((192, 192), Image.LANCZOS), 'public', 'icons', 'icon-192.png')
    save(rgb.resize((512, 512), Image.LANCZOS), 'public', 'icons', 'maskable-512.png')
    save(rgb.resize((180, 180), Image.LANCZOS), 'public', 'icons', 'apple-touch-icon.png')
    buf = io.BytesIO()
    masked(im, 128, 'square').save(buf, 'PNG', optimize=True)
    svg = ('<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 128 128">'
           '<image width="128" height="128" xlink:href="data:image/png;base64,%s"/></svg>\n') % base64.b64encode(buf.getvalue()).decode()
    with open(os.path.join(ROOT, 'public', 'icons', 'icon.svg'), 'w', encoding='utf-8') as f:
        f.write(svg)

    # Play
    save(rgb.resize((512, 512), Image.LANCZOS), 'store', 'icon-512.png')
    save(rgb.resize((512, 512), Image.LANCZOS), 'store', 'play-upload', 'icon-512.png')

    # Android: обычная и круглая (старые лаунчеры), передний слой adaptive (108dp, картинка на весь слой)
    for name, k in DENS.items():
        s = int(48 * k)
        save(masked(im, s, 'square'), 'android', 'app', 'src', 'main', 'res', 'mipmap-' + name, 'ic_launcher.png')
        save(masked(im, s, 'round'), 'android', 'app', 'src', 'main', 'res', 'mipmap-' + name, 'ic_launcher_round.png')
        save(im.resize((int(108 * k), int(108 * k)), Image.LANCZOS), 'android', 'app', 'src', 'main', 'res', 'mipmap-' + name, 'ic_launcher_foreground.png')
    p = os.path.join(RES, 'values', 'ic_launcher_background.xml')
    s = open(p, encoding='utf-8').read()
    s = re.sub(r'#[0-9A-Fa-f]{6,8}', hexbg, s, count=1)
    open(p, 'w', encoding='utf-8').write(s)

    # заставки: фон цвета краёв иконки, иконка по центру (треть короткой стороны)
    n = 0
    for d in os.listdir(RES):
        f = os.path.join(RES, d, 'splash.png')
        if not d.startswith('drawable') or not os.path.exists(f):
            continue
        w, h = Image.open(f).size
        sp = Image.new('RGB', (w, h), bg)
        ic = masked(im, max(48, min(w, h) // 3), 'square')
        sp.paste(ic, ((w - ic.size[0]) // 2, (h - ic.size[1]) // 2), ic)
        sp.save(f, optimize=True)
        n += 1
    print('ok: фон', hexbg, '| заставок', n)


if __name__ == '__main__':
    if len(sys.argv) != 2:
        sys.exit('usage: python -I tools/apply-icon.py <картинка>')
    main(sys.argv[1])
