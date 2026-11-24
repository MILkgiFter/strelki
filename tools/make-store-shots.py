"""Скриншоты для Google Play с крупными подписями (этап 14): цветной фон, заголовок, кадр игры в «телефоне».

Запуск: python -I tools/make-store-shots.py [языки...]
Источник: store/screenshots/<lang>/<N>.png (1080×2160, сняты с эмулятора скриптом shoot-all).
Выход:    store/play-upload-v2/<lang>/<N>.png (1080×1920, 9:16 — требование Play для продвижения).
Рисует headless-браузер (Edge/Chrome) — правильные шрифты для всех письменностей.
"""
import os
import shutil
import subprocess
import sys
import tempfile

from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'store', 'screenshots')
OUT = os.path.join(ROOT, 'store', 'play-upload-v2')
BROWSERS = [r'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe',
            r'C:\Program Files\Google\Chrome\Application\chrome.exe']

# кадр → (фон-градиент сверху, снизу)
SHOTS = [
    ('1-menu', '#5B7FFF', '#3C5BE0'),
    ('2-level', '#2BB673', '#1E9A5E'),
    ('3-finale', '#FF7A59', '#E85C3B'),
    ('4-win', '#FFB020', '#F08C00'),
    ('5-neon', '#2A1F5C', '#14151F'),
    ('6-gift', '#A76BFF', '#7D45E6'),
    ('7-album', '#5B7FFF', '#2BB673'),
]

# подписи: [заголовок, подзаголовок] для каждого кадра по порядку SHOTS
CAP = {
    'en': [('Tap. Clear. Reveal.', 'A calm, clever logic puzzle'), ('Free the path', 'Each arrow flies its own way'),
           ('Arrows build a picture', 'Eiffel Tower, dragons, animals'), ('200 levels', 'Earn stars and rewards'),
           ('Beautiful themes', 'Neon, sunset, chalkboard'), ('Daily gifts', 'Come back every day'), ('100+ pictures', 'Fill your album')],
    'ru': [('Тапни. Освободи. Собери.', 'Спокойная умная головоломка'), ('Освободи путь', 'Каждая стрелка летит в свою сторону'),
           ('Стрелки собирают картинку', 'Эйфелева башня, драконы, звери'), ('200 уровней', 'Звёзды и награды'),
           ('Красивые темы', 'Неон, закат, школьная доска'), ('Подарки каждый день', 'Заходи ежедневно'), ('100+ картинок', 'Собери весь альбом')],
    'es': [('Toca. Despeja. Descubre.', 'Un puzle de lógica relajante'), ('Libera el camino', 'Cada flecha vuela a su lado'),
           ('Las flechas forman una imagen', 'Torre Eiffel, dragones, animales'), ('200 niveles', 'Gana estrellas y premios'),
           ('Temas preciosos', 'Neón, atardecer, pizarra'), ('Regalos diarios', 'Vuelve cada día'), ('Más de 100 imágenes', 'Completa tu álbum')],
    'pt': [('Toque. Limpe. Revele.', 'Um quebra-cabeça lógico relaxante'), ('Libere o caminho', 'Cada seta voa para o seu lado'),
           ('As setas formam uma imagem', 'Torre Eiffel, dragões, animais'), ('200 níveis', 'Ganhe estrelas e prêmios'),
           ('Temas lindos', 'Neon, pôr do sol, lousa'), ('Presentes diários', 'Volte todo dia'), ('Mais de 100 imagens', 'Complete seu álbum')],
    'de': [('Tippen. Räumen. Entdecken.', 'Ein entspanntes Logikrätsel'), ('Mach den Weg frei', 'Jeder Pfeil fliegt in seine Richtung'),
           ('Pfeile ergeben ein Bild', 'Eiffelturm, Drachen, Tiere'), ('200 Level', 'Sammle Sterne und Belohnungen'),
           ('Schöne Designs', 'Neon, Sonnenuntergang, Tafel'), ('Tägliche Geschenke', 'Komm jeden Tag zurück'), ('Über 100 Bilder', 'Fülle dein Album')],
    'fr': [('Touche. Libère. Révèle.', 'Un puzzle logique apaisant'), ('Libère le chemin', 'Chaque flèche file dans sa direction'),
           ('Les flèches forment une image', 'Tour Eiffel, dragons, animaux'), ('200 niveaux', 'Gagne étoiles et récompenses'),
           ('Thèmes superbes', 'Néon, coucher de soleil, tableau'), ('Cadeaux quotidiens', 'Reviens chaque jour'), ('Plus de 100 images', 'Complète ton album')],
    'it': [('Tocca. Libera. Scopri.', 'Un puzzle logico rilassante'), ('Libera la strada', 'Ogni freccia vola per la sua strada'),
           ('Le frecce formano un’immagine', 'Torre Eiffel, draghi, animali'), ('200 livelli', 'Guadagna stelle e premi'),
           ('Temi bellissimi', 'Neon, tramonto, lavagna'), ('Regali ogni giorno', 'Torna ogni giorno'), ('Oltre 100 immagini', 'Completa il tuo album')],
    'tr': [('Dokun. Temizle. Keşfet.', 'Sakin ve zekice bir bulmaca'), ('Yolu aç', 'Her ok kendi yönüne uçar'),
           ('Oklar bir resim oluşturur', 'Eyfel Kulesi, ejderhalar, hayvanlar'), ('200 seviye', 'Yıldız ve ödül kazan'),
           ('Güzel temalar', 'Neon, gün batımı, kara tahta'), ('Günlük hediyeler', 'Her gün geri gel'), ('100+ resim', 'Albümünü doldur')],
    'pl': [('Dotknij. Uwolnij. Odkryj.', 'Spokojna, sprytna łamigłówka'), ('Uwolnij drogę', 'Każda strzałka leci w swoją stronę'),
           ('Strzałki tworzą obrazek', 'Wieża Eiffla, smoki, zwierzęta'), ('200 poziomów', 'Zdobywaj gwiazdki i nagrody'),
           ('Piękne motywy', 'Neon, zachód słońca, tablica'), ('Codzienne prezenty', 'Wracaj każdego dnia'), ('Ponad 100 obrazków', 'Uzupełnij album')],
    'id': [('Ketuk. Bersihkan. Ungkap.', 'Teka-teki logika yang santai'), ('Buka jalannya', 'Setiap panah terbang ke arahnya'),
           ('Panah membentuk gambar', 'Menara Eiffel, naga, hewan'), ('200 level', 'Kumpulkan bintang dan hadiah'),
           ('Tema yang indah', 'Neon, senja, papan kapur'), ('Hadiah harian', 'Kembali setiap hari'), ('100+ gambar', 'Lengkapi albummu')],
    'vi': [('Chạm. Dọn. Khám phá.', 'Trò giải đố logic nhẹ nhàng'), ('Mở đường đi', 'Mỗi mũi tên bay theo hướng riêng'),
           ('Mũi tên ghép thành tranh', 'Tháp Eiffel, rồng, động vật'), ('200 màn chơi', 'Nhận sao và phần thưởng'),
           ('Chủ đề tuyệt đẹp', 'Neon, hoàng hôn, bảng phấn'), ('Quà mỗi ngày', 'Quay lại hằng ngày'), ('Hơn 100 bức tranh', 'Hoàn thành album')],
    'ja': [('タップして、消して、完成！', '頭を使う癒やしパズル'), ('道をあけよう', '矢印はそれぞれの向きへ飛ぶ'),
           ('矢印が絵になる', 'エッフェル塔、ドラゴン、動物'), ('200レベル', '星とごほうびを集めよう'),
           ('美しいテーマ', 'ネオン、夕焼け、黒板'), ('毎日のプレゼント', '毎日遊びに来てね'), ('100種類以上の絵', 'アルバムを完成させよう')],
    'ko': [('탭하고, 비우고, 완성!', '차분하고 똑똑한 퍼즐'), ('길을 열어 주세요', '화살표는 각자 방향으로 날아가요'),
           ('화살표가 그림이 돼요', '에펠탑, 용, 동물'), ('200개 레벨', '별과 보상을 모으세요'),
           ('아름다운 테마', '네온, 노을, 칠판'), ('매일 선물', '매일 들러 주세요'), ('100개 이상의 그림', '앨범을 채워 보세요')],
    'zh': [('点一点，清一清，拼出图！', '轻松烧脑的逻辑解谜'), ('打通道路', '每支箭头飞向自己的方向'),
           ('箭头拼成图画', '埃菲尔铁塔、巨龙、动物'), ('200个关卡', '收集星星和奖励'),
           ('精美主题', '霓虹、日落、黑板'), ('每日礼物', '每天都来看看'), ('100多幅图画', '集满你的图鉴')],
    'hi': [('टैप करें। हटाएँ। तस्वीर बनाएँ।', 'सुकून भरी समझदार पहेली'), ('रास्ता खोलें', 'हर तीर अपनी दिशा में उड़ता है'),
           ('तीरों से बनती तस्वीर', 'एफ़िल टावर, ड्रैगन, जानवर'), ('200 लेवल', 'सितारे और इनाम जीतें'),
           ('सुंदर थीम', 'नियॉन, सूर्यास्त, ब्लैकबोर्ड'), ('रोज़ तोहफ़े', 'हर दिन वापस आएँ'), ('100+ तस्वीरें', 'अपना एल्बम भरें')],
}
HTML_LANG = {'zh': 'zh-CN'}


def page(lang, top, bottom, title, sub, img):
    return f'''<!doctype html><html lang="{HTML_LANG.get(lang, lang)}"><meta charset="utf-8"><style>
html,body{{margin:0;width:1080px;height:1920px;overflow:hidden}}
body{{background:linear-gradient(180deg,{top},{bottom});font-family:"Segoe UI","Nirmala UI","Leelawadee UI","Yu Gothic UI","Malgun Gothic","Microsoft YaHei UI",sans-serif;color:#fff;text-align:center}}
.t{{position:absolute;left:60px;right:60px;top:70px;font-size:92px;font-weight:800;line-height:1.2;text-shadow:0 6px 24px rgba(0,0,0,.22)}}
.s{{position:absolute;left:60px;right:60px;top:0;font-size:48px;font-weight:600;opacity:.92}}
.ph{{position:absolute;left:50%;bottom:-40px;transform:translateX(-50%);width:820px;border-radius:64px;
  border:14px solid #1A1B26;background:#1A1B26;box-shadow:0 30px 80px rgba(0,0,0,.35);overflow:hidden;line-height:0}}
.ph img{{width:100%;display:block}}
</style>
<div class="t" id="t">{title}</div><div class="s" id="s">{sub}</div>
<div class="ph"><img src="{img}"></div>
<script>
const t=document.getElementById('t'), s=document.getElementById('s');
let f=92; while(t.scrollHeight>230&&f>54){{f-=2;t.style.fontSize=f+'px';}}
s.style.top=(70+t.scrollHeight+22)+'px';
let g=48; while(s.scrollHeight>70&&g>30){{g-=2;s.style.fontSize=g+'px';}}
const ph=document.querySelector('.ph'); ph.style.top=(70+t.scrollHeight+22+s.scrollHeight+50)+'px';
</script></html>'''


def main(langs):
    browser = next(b for b in BROWSERS if os.path.exists(b))
    tmp = tempfile.mkdtemp(prefix='shots')
    for lang in langs:
        os.makedirs(os.path.join(OUT, lang), exist_ok=True)
        for i, (name, top, bottom) in enumerate(SHOTS):
            src = os.path.join(SRC, lang, name + '.png')
            if not os.path.exists(src):
                print('нет', src)
                continue
            im = Image.open(src).convert('RGB').crop((0, 70, 1080, 2080))  # без системных полос
            shot = os.path.join(tmp, f'{lang}-{name}.png')
            im.save(shot)
            title, sub = CAP[lang][i]
            html = os.path.join(tmp, f'{lang}-{name}.html')
            open(html, 'w', encoding='utf-8').write(page(lang, top, bottom, title, sub, os.path.basename(shot)))
            png = os.path.join(tmp, f'{lang}-{name}-out.png')
            subprocess.run([browser, '--headless=new', '--disable-gpu', '--hide-scrollbars', '--force-device-scale-factor=1',
                            '--window-size=1080,1920', '--virtual-time-budget=2000', '--screenshot=' + png,
                            'file:///' + html.replace('\\', '/')], check=True, capture_output=True, timeout=90)
            Image.open(png).convert('RGB').crop((0, 0, 1080, 1920)).save(os.path.join(OUT, lang, name + '.png'), optimize=True)
        print(lang, end=' ', flush=True)
    shutil.rmtree(tmp, ignore_errors=True)
    print('\nok →', OUT)


if __name__ == '__main__':
    main(sys.argv[1:] or list(CAP))
