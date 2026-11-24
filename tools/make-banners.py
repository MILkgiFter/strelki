"""Баннеры Play 1024×500 на всех языках: название + слоган слева, фигура (финал уровня 32) справа.

Запуск: python -I tools/make-banners.py
Рисует headless-браузер (Edge/Chrome): он правильно шейпит арабский, иврит, хинди, бенгальский, тайский.
Выход: store/play-upload/banners/feature-<lang>.png, а также store/feature-graphic.png (en) и -ru.png.
"""
import json
import os
import shutil
import subprocess
import tempfile

from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'store', 'play-upload', 'banners')
BROWSERS = [r'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe',
            r'C:\Program Files\Google\Chrome\Application\chrome.exe']

TAG = {
    'en': ('Tap arrows. Clear the board.', 'Reveal the picture.'),
    'ru': ('Тапай стрелки, освобождай поле', 'и собирай картинку.'),
    'es': ('Toca flechas. Despeja el tablero.', 'Descubre la imagen.'),
    'pt': ('Toque nas setas. Limpe o tabuleiro.', 'Revele a imagem.'),
    'de': ('Tippe Pfeile. Räum das Feld.', 'Enthülle das Bild.'),
    'fr': ('Touche les flèches. Vide la grille.', 'Révèle l’image.'),
    'it': ('Tocca le frecce. Libera la griglia.', 'Scopri l’immagine.'),
    'tr': ('Oklara dokun. Tahtayı temizle.', 'Resmi ortaya çıkar.'),
    'pl': ('Dotykaj strzałek. Czyść planszę.', 'Odkryj obrazek.'),
    'id': ('Ketuk panah. Bersihkan papan.', 'Ungkap gambarnya.'),
    'vi': ('Chạm mũi tên. Dọn sạch bảng.', 'Lộ ra bức tranh.'),
    'ja': ('矢印をタップして盤面をクリア。', '絵を完成させよう。'),
    'ko': ('화살표를 탭해 판을 비우고', '그림을 완성하세요.'),
    'zh': ('点击箭头，清空棋盘，', '拼出一幅图画。'),
    'hi': ('तीरों पर टैप करें, बोर्ड साफ़ करें', 'और तस्वीर बनाएँ।'),
    'ar': ('انقر على الأسهم وفرّغ اللوحة', 'واكتشف الصورة.'),
    'nl': ('Tik op pijlen. Maak het bord leeg.', 'Onthul het plaatje.'),
    'sv': ('Tryck på pilar. Töm brädet.', 'Avslöja bilden.'),
    'uk': ('Тапай стрілки, звільняй поле', 'і збирай картинку.'),
    'cs': ('Ťukej na šipky. Vyčisti plochu.', 'Odhal obrázek.'),
    'ro': ('Atinge săgețile. Golește tabla.', 'Descoperă imaginea.'),
    'hu': ('Koppints a nyilakra, ürítsd a táblát,', 'és fedd fel a képet.'),
    'el': ('Πάτα τα βέλη. Άδειασε τον πίνακα.', 'Αποκάλυψε την εικόνα.'),
    'iw': ('הקישו על החיצים, נקו את הלוח', 'וגלו את התמונה.'),
    'th': ('แตะลูกศร เคลียร์กระดาน', 'แล้วเผยภาพ'),
    'ms': ('Ketik anak panah. Kosongkan papan.', 'Dedahkan gambar.'),
    'fil': ('I-tap ang arrows. Linisin ang board.', 'Ilantad ang larawan.'),
    'da': ('Tryk på pile. Ryd brættet.', 'Afslør billedet.'),
    'fi': ('Napauta nuolia. Tyhjennä lauta.', 'Paljasta kuva.'),
    'no': ('Trykk på piler. Tøm brettet.', 'Avslør bildet.'),
    'kk': ('Нұсқаларды бас, алаңды тазала', 'және суретті жина.'),
    'zh-TW': ('點擊箭頭，清空棋盤，', '拼出一幅圖畫。'),
    'bn': ('তীরে ট্যাপ করুন, বোর্ড খালি করুন', 'আর ছবি তৈরি করুন।'),
}
RTL = {'ar', 'iw'}
HTML_LANG = {'iw': 'he', 'zh': 'zh-CN', 'fil': 'tl', 'no': 'nb'}


def titles():
    t = {}
    d = os.path.join(ROOT, 'store', 'listing')
    for f in os.listdir(d):
        if f.endswith('.md'):
            s = open(os.path.join(d, f), encoding='utf-8').read().split('\n')
            i = next(k for k, l in enumerate(s) if l.startswith('## '))
            t[f[:-3]] = s[i + 1].strip()
    for k, v in json.load(open(os.path.join(d, 'extra.json'), encoding='utf-8')).items():
        t[k] = v['t']
    # название — часть до двоеточия (как логотип в игре)
    return {k: v.replace('：', ':').split(':')[0].strip() for k, v in t.items()}


def page(lang, name, l1, l2, img):
    rtl = lang in RTL
    return f'''<!doctype html><html lang="{HTML_LANG.get(lang, lang)}" dir="{'rtl' if rtl else 'ltr'}"><meta charset="utf-8">
<style>
html,body{{margin:0;width:1024px;height:500px;overflow:hidden;background:#F4F1EA}}
body{{font-family:"Segoe UI","Nirmala UI","Leelawadee UI","Yu Gothic UI","Malgun Gothic","Microsoft YaHei UI","Microsoft JhengHei UI",sans-serif}}
.pic{{position:absolute;top:15px;{'left' if rtl else 'right'}:60px;height:470px}}
.txt{{position:absolute;top:0;bottom:0;{'right' if rtl else 'left'}:58px;width:540px;display:flex;flex-direction:column;justify-content:center}}
h1{{margin:0 0 18px;font-size:96px;line-height:1.05;font-weight:700;color:#2E2A24;white-space:nowrap}}
p{{margin:0;font-size:34px;line-height:1.3;color:#8A8275}}
.bars{{display:flex;gap:10px;margin-top:30px}} .bars i{{display:block;height:8px}}
</style>
<img class="pic" src="{img}">
<div class="txt"><h1 id="t">{name}</h1><p id="p">{l1}<br>{l2}</p>
<div class="bars"><i style="width:200px;background:#5B7FFF"></i><i style="width:60px;background:#FF7A59"></i><i style="width:40px;background:#2BB673"></i></div></div>
<script>
const fit=(el,max,min)=>{{let s=max; el.style.fontSize=s+'px'; while(el.scrollWidth>540&&s>min){{s-=2; el.style.fontSize=s+'px';}}}};
fit(document.getElementById('t'),96,48);
const p=document.getElementById('p'); let s=34; while(p.scrollHeight>100&&s>22){{s-=1;p.style.fontSize=s+'px';}}
p.style.whiteSpace='nowrap'; s=parseFloat(p.style.fontSize||34); while(p.scrollWidth>540&&s>20){{s-=1;p.style.fontSize=s+'px';}}
</script></html>'''


def main():
    browser = next(b for b in BROWSERS if os.path.exists(b))
    tmp = tempfile.mkdtemp(prefix='banners')
    src = Image.open(os.path.join(ROOT, 'store', 'screenshots', 'ru', '3-finale.png')).convert('RGB')
    pic = src.crop((110, 370, 910, 1600))
    pic = pic.resize((int(pic.width * 470 / pic.height), 470), Image.LANCZOS)
    pic.save(os.path.join(tmp, 'pic.png'))
    os.makedirs(OUT, exist_ok=True)
    names = titles()
    for lang, (l1, l2) in TAG.items():
        html = os.path.join(tmp, lang + '.html')
        open(html, 'w', encoding='utf-8').write(page(lang, names[lang], l1, l2, 'pic.png'))
        png = os.path.join(tmp, lang + '.png')
        subprocess.run([browser, '--headless=new', '--disable-gpu', '--hide-scrollbars', '--force-device-scale-factor=1',
                        '--window-size=1024,500', '--virtual-time-budget=2000', '--screenshot=' + png,
                        'file:///' + html.replace('\\', '/')], check=True, capture_output=True, timeout=60)
        im = Image.open(png).convert('RGB')
        if im.size != (1024, 500):
            im = im.crop((0, 0, 1024, 500))
        im.save(os.path.join(OUT, 'feature-%s.png' % lang), optimize=True)
        print(lang, end=' ', flush=True)
    shutil.copy(os.path.join(OUT, 'feature-en.png'), os.path.join(ROOT, 'store', 'feature-graphic.png'))
    shutil.copy(os.path.join(OUT, 'feature-ru.png'), os.path.join(ROOT, 'store', 'feature-graphic-ru.png'))
    shutil.rmtree(tmp, ignore_errors=True)
    print('\nok:', len(TAG), 'баннеров →', OUT)


if __name__ == '__main__':
    main()
