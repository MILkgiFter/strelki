# Что куда грузить в Play Console

Все файлы лежат в **`C:\гейм\store\play-upload\`**. Тексты на всех 41 языке уже вставлены и сохранены. Осталось перетащить картинки мышкой.


> **Новые скриншоты с подписями (24.11):** бери их из `C:\гейм\store\play-upload-v2\<язык>\` — те же 7 файлов и те же папки, что в таблице ниже (вместо `play-upload\<язык>\`). Старые в Play можно удалить крестиком и перетащить новые.

## 1. Страница приложения (значок, баннер, скриншоты)
Ссылка: https://play.google.com/console/u/0/developers/7080248602921152147/app/4975218698006159652/store-listings/default/edit

Вверху страницы есть «Выбор языка»: выбираешь язык, прокручиваешь до «Графических ресурсов» и перетаскиваешь файлы. Внизу жмёшь «Сохранить как проект». Кнопка «Следующий язык» переключает на следующий язык.

**Английский (США) — язык по умолчанию** (с 2026-11-24). Обязательные поля: без них Play показывает «Ошибки в переводах»:
| Поле | Файл |
|---|---|
| Значок приложения (512×512) | `icon-512.png` (сердце) |
| Картинка для описания (1024×500) | `banners\feature-en.png` |
| Скриншоты для смартфона | все 7 файлов из `en\` (выдели все и перетащи разом) |

**Русский – ru-RU** теперь перевод: баннер `banners\feature-ru.png`, скриншоты из `ru\`.

**Остальные языки.** Значок общий, в переводах его не трогают. Если картинки для языка не загрузить, Play покажет английские (язык по умолчанию).

| Язык в списке | Баннер | Скриншоты |
|---|---|---|
| Английский (США, Великобритания, Австралия, Канада, en-IN) | `banners\feature-en.png` | `en\` |
| Испанский (Испания, Латинская Америка, США) | `banners\feature-es.png` | `es\` |
| Португальский (Бразилия, Португалия) | `banners\feature-pt.png` | `pt\` |
| Немецкий | `banners\feature-de.png` | `de\` |
| Французский (Франция, Канада) | `banners\feature-fr.png` | `fr\` |
| Итальянский | `banners\feature-it.png` | `it\` |
| Турецкий | `banners\feature-tr.png` | `tr\` |
| Польский | `banners\feature-pl.png` | `pl\` |
| Индонезийский | `banners\feature-id.png` | `id\` |
| Вьетнамский | `banners\feature-vi.png` | `vi\` |
| Японский | `banners\feature-ja.png` | `ja\` |
| Корейский | `banners\feature-ko.png` | `ko\` |
| Китайский (упрощённый) – zh-CN | `banners\feature-zh.png` | `zh\` |
| Хинди | `banners\feature-hi.png` | `hi\` |
| **Новые языки (игра у них на английском):** | | |
| Арабский – ar | `banners\feature-ar.png` | `en\` |
| Нидерландский – nl-NL | `banners\feature-nl.png` | `en\` |
| Шведский – sv-SE | `banners\feature-sv.png` | `en\` |
| Украинский – uk | `banners\feature-uk.png` | `en\` |
| Чешский – cs-CZ | `banners\feature-cs.png` | `en\` |
| Румынский – ro | `banners\feature-ro.png` | `en\` |
| Венгерский – hu-HU | `banners\feature-hu.png` | `en\` |
| Греческий – el-GR | `banners\feature-el.png` | `en\` |
| Иврит – iw-IL | `banners\feature-iw.png` | `en\` |
| Тайский – th | `banners\feature-th.png` | `en\` |
| Малайский (Малайзия) – ms-MY | `banners\feature-ms.png` | `id\` (малайский близок к индонезийскому) |
| Филиппинский – fil | `banners\feature-fil.png` | `en\` |
| Датский – da-DK | `banners\feature-da.png` | `en\` |
| Финский – fi-FI | `banners\feature-fi.png` | `en\` |
| Норвежский – no-NO | `banners\feature-no.png` | `en\` |
| Казахский – kk | `banners\feature-kk.png` | `ru\` |
| Китайский (традиционный) – zh-TW | `banners\feature-zh-TW.png` | `zh\` |
| Бенгальский – bn-BD | `banners\feature-bn.png` | `en\` |

Скриншоты: 1080×1920 (9:16). Это подходит под требование Play для продвижения игры: минимум 4 скриншота 9:16, от 1080 px по стороне.

## 2. Сборка (AAB) во внутреннее тестирование
Ссылка: https://play.google.com/console/u/0/developers/7080248602921152147/app/4975218698006159652/tracks/internal-testing
«Создать выпуск» → перетащить `C:\гейм\android\app\build\outputs\bundle\release\app-release.aab` → «Далее» → «Сохранить и опубликовать».

## 3. Отправить изменения на проверку
Ссылка: https://play.google.com/console/u/0/developers/7080248602921152147/app/4975218698006159652/publishing
«Обзор публикации» → «Отправить изменения на проверку». Страница, анкеты и переводы уходят вместе.

---
Как пересобрать: баннеры `python -I tools/make-banners.py`, иконка `python -I tools/apply-icon.py <картинка>`; тексты лежат в `store/listing/*.md` и `store/listing/extra.json`.
