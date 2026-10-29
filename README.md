# mimik

A small animated SVG face for your app. 50 expressions, 7 face types (round, robot, cat, ghost, blob, alien, bear), 9 reactions, lip-synced speech. One file, no dependencies, MIT.

Live: https://reinharddev.github.io/mimik/

```html
<div id="bot" style="width:160px;height:160px;--face-skin:#000;--face-ink:#e9ebec;--face-ring:#34363a"></div>
<script type="module">
  import { createFace } from 'https://reinharddev.github.io/mimik/face.js'
  const face = createFace(document.querySelector('#bot'), { expression: 'curious', mouth: true })
  face.react('bounce')
  face.talk(0.6) // 0-1 speech energy, per frame
</script>
```

API: `createFace(el, opts)` returns `{ set, update, react, talk, destroy }`. See the playground for every option.

Respects `prefers-reduced-motion`. Faces share one animation loop and skip frames when offscreen.
