# Обои и свет лампы

Фон продолжает винтажный стиль сайта: подвесная лампа, латунные акценты, деревянная дверца меню, телевизор и дисковый телефон. Тихий дамасский орнамент добавляет фактуру свободному пространству и не конкурирует с типографикой и работами.

Текстура создана встроенным ImageGen по приложенному пользователем образцу, затем сохранена в WebP без изменения рисунка. Рабочий файл: `assets/backgrounds/damask-charcoal.webp`, 1254 × 1254, около 134 КиБ. PNG генерации остаётся в стандартной папке ImageGen.

`css/lamp/wallpaper.css` задаёт неподвижную стену под контентом, постоянную тёмную полупрозрачную маску и освещённую копию той же текстуры с мягкой радиальной маской. Обе текстуры точно совмещены, браузер использует один файл. При выключении плавно исчезает только освещённый слой: остальной фон не вспыхивает во время перехода. Текст и карточки находятся выше маски.

`js/lamp/lighting.js` получает координаты центра колбы от существующего контроллера. Координаты переводятся из сцены под хедером в систему координат окна; пятно следует за перетаскиванием, наклоном, раскачиванием и изменением размеров. Состояние питания общее с лампой и подсветкой карточек. Прежнее поведение сохранено: вне первого экрана лампа выключается, при возвращении включается. На мобильных экранах паттерн мельче; системное сокращение движения отключает плавное затухание.

## Финальный промпт

Use case: style-transfer. Asset type: seamless repeating wallpaper texture for a dark portfolio website. Input image 1 is the edit target and exact damask ornament reference. Preserve its traditional repeating floral damask motifs, scale, spacing, and aged matte paper grain. Recreate as a perfectly seamless square tile, matching left/right and top/bottom edges. Change only the palette: almost-black warm charcoal background (#161515), subtly lighter charcoal/umber ornament (#2b2823 to #373128). Very restrained contrast, elegant faded vintage wallpaper. Flat uniform diffuse light across the entire tile, no vignette, no gradients, no highlights, no light source, no scene, no text, no border. The website itself will add localized warm lamp illumination, so keep all lighting completely uniform. Output one square full-bleed tile.
