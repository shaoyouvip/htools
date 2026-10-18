export const ICONFONT_ARROW_SVG = '<svg t="1792247058025" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="[http://www.w3.org/2000/svg](http://www.w3.org/2000/svg)" p-id="1635" width="200" height="200"><path d="M874.666667 512a362.666667 362.666667 0 1 0-362.666667 362.666667V938.666667C276.352 938.666667 85.333333 747.648 85.333333 512S276.352 85.333333 512 85.333333s426.666667 191.018667 426.666667 426.666667-191.018667 426.666667-426.666667 426.666667v-64a362.666667 362.666667 0 0 0 362.666667-362.666667z" fill="#333333" p-id="1636"></path><path d="M456.362667 285.696a32.042667 32.042667 0 0 1 45.312 0l203.605333 203.690667a32 32 0 0 1 0 45.226666l-203.605333 203.690667a32.042667 32.042667 0 0 1-45.312-45.312l149.077333-148.992H298.666667a32 32 0 0 1 0-64h306.773333l-149.077333-148.992a32.042667 32.042667 0 0 1 0-45.312z" fill="#333333" p-id="1637"></path></svg>';
export const ESCAPED_ICONFONT_ARROW_SVG = ICONFONT_ARROW_SVG.replaceAll("<", "\\<");
export const UNSAFE_CATEGORY_SVGS = [
  '<svg xmlns="http://www.w3.org/2000/svg"><script>globalThis.__svgAttack = true</script></svg>',
  '<svg xmlns="http://www.w3.org/2000/svg" onload="globalThis.__svgAttack = true"><path d="M0 0"/></svg>',
  '<svg xmlns="http://www.w3.org/2000/svg"><foreignObject><iframe src="https://svg-attack.example/frame"/></foreignObject></svg>',
  '<!DOCTYPE svg [<!ENTITY xxe SYSTEM "https://svg-attack.example/entity">]><svg xmlns="http://www.w3.org/2000/svg"><title>&xxe;</title></svg>',
  '<svg xmlns="http://www.w3.org/2000/svg"><image href="https://svg-attack.example/image.png"/></svg>',
  '<svg xmlns="http://www.w3.org/2000/svg"><use href="https://svg-attack.example/sprite.svg#icon"/></svg>',
  '<svg xmlns="http://www.w3.org/2000/svg"><path d="M0 0" fill="url(https://svg-attack.example/paint.svg#x)"/></svg>',
  '<svg xmlns="http://www.w3.org/2000/svg"><path d="M0 0" style="fill:url(https://svg-attack.example/paint.svg#x)"/></svg>',
  '<svg xmlns="http://www.w3.org/2000/svg"><defs><linearGradient href="&#104;ttps://svg-attack.example/g.svg#x"/></defs></svg>',
  '<svg xmlns="http://www.w3.org/2000/svg"><style>@import url(https://svg-attack.example/style.css)</style></svg>',
  '<svg xmlns="http://www.w3.org/2000/svg"><animate attributeName="href" to="javascript:alert(1)"/></svg>',
  '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="https://svg-attack.example/ns"><path d="M0 0"/></svg>'
];
