# Промпты для генерации картинок (ступень 4 из docs/GRAPHICS.md)

Сгенерируй картинку в любом сервисе (ChatGPT / DALL·E, Midjourney, Ideogram, Leonardo), положи результат в `assets/incoming/`, дальше агент подгонит размеры (Android, Play 512, баннеры).

## Иконка приложения «Стрелки» (2026-11-23)

Почему так: у конкурентов-лидеров на иконке кусок игрового поля (линии-стрелки на светлом фоне), наше отличие — стрелки разноцветные и складываются в картинку. Рисунок кодом (варианты v1–v10 в `store/icon-variants`) даёт чистые формы, но силуэт из стрелок на 48 px не читается.

**Промпт (EN, вставлять как есть):**

> Mobile game app icon, square 1024×1024, full-bleed background, no text, no border, no rounded corners.
> A cute plump heart shape built entirely from thick colorful maze-like arrows — each arrow is a chunky rounded line bending at 90° on an invisible grid, ending in a bold triangular arrowhead, like pieces of a tangled arrow puzzle. Arrow colors: royal blue #5B7FFF, coral #FF7A59, green #2BB673, golden yellow #FFB020, violet #A76BFF.
> One coral arrow is shooting out of the top-right of the heart with short speed lines, giving a satisfying "pop" moment.
> Soft 3D toy-like look: glossy highlights, subtle inner shadow, gentle drop shadow under the heart. Background: warm cream #F4F1EA with a soft radial light in the center.
> Keep the main shape inside the central 66% of the canvas. Bold, high contrast, instantly readable at 48 px. Casual puzzle game style, clean, premium, playful.

**Вариант «неон» (для сравнения):**

> Same composition, but neon style: dark navy background #14151F, the arrows are thick glowing neon tubes (cyan #4DD8FF, hot pink #FF4D8D, lime #5CFF7A, yellow #FFE84D, purple #C76BFF) with strong bloom, the escaping arrow hot pink.

Советы: сделать 4–8 генераций, выбрать ту, где сердце читается силуэтом; если сервис рисует текст или рамку — добавить «no letters, no frame». Чужие картинки и логотипы в промпт не подставлять.
