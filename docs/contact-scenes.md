# Контакты: телефон и книжка

Кнопка «Проконсультироваться» и плавающие кнопки мессенджеров открывают прозрачную сцену у нижней границы: тумба падает сверху на исходную кнопку (850 мс), затем телефон на тумбу (ещё 700 мс). По сторонам выезжают два обрывка страницы с контактами разработки и дизайна. Анимация начинается после декодирования изображений; закрытие во время загрузки отменяет отложенный запуск. Нажатие в любое место, кроме ссылок мессенджеров, закрывает сцену. Telegram сохраняет силуэт самолётика, MAX использует исходный значок с тёплым оттенком.

Кнопки «Связаться» и «Обсудить идею» открывают одну страницу книжки налево от корешка на правом краю экрана; вторая половина подразумевается за экраном. Заголовок, оба направления и все ссылки расположены на одной странице. Положение петли шкафа также привязано к правой границе при любой ширине.

`js/contact-panel.js` выбирает режим по источнику открытия. Общий контроллер диалогов обеспечивает Escape, закрытие, блокировку прокрутки страницы и переключение между меню и контактами. Пока предметы или страница движутся, ссылки не принимают случайные нажатия. Уменьшение движения отключает анимации и сразу делает ссылки доступными. При недостатке высоты прокручивается страница книжки, горизонтальная прокрутка исключена. Контакты остаются обычными HTML-ссылками; набор ссылок одинаков в обоих оформлениях и на всех 13 страницах.

## Изображение

- Готовый файл: [telephone-cabinet.webp](../assets/room/telephone-cabinet.webp), 640 × 960, 122 582 байта, с альфа-каналом.
- Создан встроенным инструментом image_gen; исходник PNG сохранён вне публикуемого дерева. Для сайта выполнены только уменьшение и конвертация в WebP с сохранением прозрачности.
- Референс материала и света — существующий [телефон](../assets/retro-phone.webp), который накладывается отдельным изображением в HTML.

Точный промпт:

> Use case: product-mockup. Generate a website compositing asset: a small vintage Soviet walnut telephone bedside cabinet, ONE piece of furniture ONLY, on a truly transparent alpha background. Reference image is supporting material and lighting reference: dark polished burgundy bakelite and brass rotary phone. Do NOT include a phone in output: the existing reference phone will be placed on the cabinet in HTML. Cabinet must have a broad empty rectangular top surface, one shallow drawer with a small aged brass handle, a lower closed wood cupboard and four short tapered legs, entirely visible. Front-facing camera slightly elevated to see the top surface, nearly symmetrical, shallow right side visible. Warm dim light upper left, subtle cool rim on right, detailed rich brown walnut grain, realistic patina, photographic/3D vintage prop matching reference. Portrait composition, cabinet fills frame with small transparent margins, no wall, no floor, no backdrop, no text, no decorations, no other objects.
