# Предметы для футера

Все три изображения подготовлены встроенным ImageGen с настоящим прозрачным фоном, затем сохранены в WebP с сохранением альфа-канала. Исходные PNG остаются в стандартной папке ImageGen.

- `assets/room/vintage-radio.webp`, 640 × 505 — радио по фотографии пользователя; удалён фон, сохранены корпус, антенна и детали.
- `assets/room/paper-boat.webp`, 480 × 161 — кораблик по фотографии пользователя; удалён фон, сохранены цвет и складки бумаги.
- `assets/room/wooden-stool.webp`, 640 × 665 — деревянная табуретка, созданная для сцены с телевизором.

Рабочие WebP уменьшены с учётом размера показа и плотных экранов: суммарно около 160 КиБ вместо 777 КиБ. Полноразмерные исходники сохранены локально в `.source-media/` и не публикуются.

Цвет, небольшое затемнение и контактные тени согласованы через `css/sections/footer-props.css`. Радиоприёмник и табуретка — отдельные слои, радио остаётся настоящей кнопкой. Кораблик привязан к правому верхнему краю телевизора и масштабируется вместе с ним.

## Радио — финальный промпт

Use case: background-extraction. Asset type: transparent radio cutout for a vintage website scene. Edit target: input image 1. Remove only the off-white background and the large empty margins. Preserve exactly this reddish brown wooden portable vintage radio, woven speaker grille, two brass knobs, tuning dial and its diagonal telescopic antenna, shape and perspective. Keep all the antenna intact. Tightly frame the whole radio including antenna with about 3 percent transparent margin. Transparent alpha everywhere outside the radio. No scene, no tabletop, no stool, no floor shadow, no added text. Preserve aged material and natural warm photographic light.

## Кораблик — финальный промпт

Use case: background-extraction. Asset type: transparent paper boat cutout to rest on a vintage wooden television. Edit target: input image 1. Remove only the white background and large empty margins. Preserve this exact cream aged-paper origami boat, fold geometry, paper texture, shape, perspective and warm neutral color. Tightly crop the entire boat to around 3 percent transparent margins. Genuine transparent alpha outside the boat, including holes around folds if any. No new object, no surface, no scene, no text, no water, no floor shadow.

## Табуретка — финальный промпт

Use case: product-mockup. Asset type: transparent photorealistic wooden stool cutout for a dark vintage room website footer, to hold a separate old wooden radio. Generate ONE ordinary Soviet era wooden kitchen stool, no backrest, four straight gently splayed square wooden legs, low stretchers, modest square seat with slightly rounded corners. Aged warm medium-dark walnut, matte worn varnish, understated realistic wood grain, no ornate carving. Front view, very slightly from above so a narrow top plane of the seat is visible, very slight right side visible, matching a front-facing old television photographed just above floor level. Entire stool including all four feet visible and tightly framed with 3 percent transparent margins. Empty unobstructed flat seat, nothing on it. Realistic soft warm diffuse light, no dramatic lighting. No floor, no wall, no rug, no radio, no scenery, no cast floor shadow, no text. Genuine transparent background. The stool must have believable sturdy geometry and joinery.
