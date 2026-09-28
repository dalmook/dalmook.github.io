/* Original interface and character vector artwork. */
window.BunnyArt = (() => {
  const paths = {
    home:'<path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z"/>',
    book:'<path d="M3 4q5-2 9 2 4-4 9-2v15q-5-2-9 2-4-4-9-2zM12 6v15"/>',
    game:'<path d="M7 7h10q3 0 4 4l1 6q0 5-5 1l-1-1H8l-1 1q-5 4-5-1l1-6q1-4 4-4zM7 10v6M4 13h6M16 11h.01M19 14h.01"/>',
    friends:'<path d="M6 11C1-5 13-2 10 10m4 0c-3-12 9-15 4 1"/><path d="M3 15c0-8 18-8 18 0 0 9-18 9-18 0zM8 15h.01M16 15h.01M10 18q2 2 4 0"/>',
    chart:'<path d="M4 3v18h17M8 16v-4m5 4V7m5 9v-7"/>',
    arrow:'<path d="M4 12h16m-6-6 6 6-6 6"/>', back:'<path d="M20 12H4m6-6-6 6 6 6"/>',
    sound:'<path d="m11 4-6 5H2v6h3l6 5zM15 8q5 4 0 8m3-12q9 8 0 16"/>', mute:'<path d="m11 4-6 5H2v6h3l6 5zM16 9l6 6m0-6-6 6"/>',
    settings:'<path d="m9 3-1 3-3 1-2 4 2 3 1 4 4 2 3-1 4 1 3-4-1-3 1-4-4-2-3 1z"/><circle cx="12" cy="12" r="3"/>',
    star:'<path d="m12 2 3 6.5 7 .9-5 5 1.1 7.1-6.1-3.4-6.1 3.4L7 14.4l-5-5 7-.9z"/>',
    coin:'<circle cx="12" cy="12" r="9"/><path d="m12 6 1.5 4 4 .5-3 2.5.8 4-3.3-2-3.3 2 .8-4-3-2.5 4-.5z"/>',
    fire:'<path d="M12 2q-1 5 3 8l1-5q13 15-1 17C0 24 1 11 6 8q0 7 4 5 2-2 2-11z"/>',
    check:'<path d="m5 12 4 4L19 6"/>', close:'<path d="m6 6 12 12M18 6 6 18"/>',
    plus:'<path d="M12 4v16M4 12h16"/>', search:'<circle cx="10" cy="10" r="6"/><path d="m15 15 6 6"/>',
    image:'<rect x="3" y="3" width="18" height="18" rx="4"/><circle cx="9" cy="9" r="2"/><path d="m3 17 5-5 4 4 4-6 5 7"/>',
    upload:'<path d="M12 16V3m-5 5 5-5 5 5M3 15v6h18v-6"/>', download:'<path d="M12 3v13m-5-5 5 5 5-5M3 15v6h18v-6"/>',
    shield:'<path d="m12 2 9 4v6q0 7-9 11-9-4-9-11V6zM8 12l3 3 5-6"/>',
    edit:'<path d="m15 3 6 6-12 12H3v-6zM12 6l6 6"/>',trash:'<path d="M3 6h18M9 3h6m-10 3 1 15h12l1-15M9 10v7m6-7v7"/>',
    refresh:'<path d="M20 8V3l-3 3a8 8 0 1 0 3 10M20 8h-5"/>',
    lock:'<rect x="4" y="10" width="16" height="11" rx="3"/><path d="M7 10V7a5 5 0 0 1 10 0v3m-5 5v2"/>',
    heart:'<path d="M12 21C-6 10 4-4 12 5c8-9 18 5 0 16z"/>',
    leaf:'<path d="M20 3C2 2 1 14 8 18c8 4 13-3 12-15zM4 21 16 8"/>',
    flag:'<path d="M5 22V3q5-3 9 0 3 2 6 0v10q-3 2-6 0-4-3-9 0"/>',
    target:'<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
    bolt:'<path d="m14 2-11 13h8l-1 7L21 9h-8z"/>',
    gift:'<path d="M3 9h18v5H3zm2 5v7h14v-7M12 9v12M12 9Q1 9 5 4q4-4 7 5 3-9 7-5 4 5-7 5"/>',
    key:'<path d="M4 19h16M6 7h12M8 12h8"/>',
    github:'<path d="M8 21v-4c-5 1-5-3-7-3m19 7v-4c0-2-1-3-1-3 4-1 5-3 5-6 0-2-1-3-2-4 0-2 0-3-1-4-2 0-4 2-4 2-3-1-6-1-9 0 0 0-2-2-4-2-1 1-1 2-1 4-1 1-2 2-2 4 0 3 1 5 5 6" transform="translate(3 2) scale(.8)"/>',
    music:'<path d="M9 18V5l12-3v13M9 9l12-3"/><ellipse cx="6" cy="18" rx="3" ry="3"/><ellipse cx="18" cy="15" rx="3" ry="3"/>',
    trophy:'<path d="M7 3h10v6q0 6-5 6-5 0-5-6zM7 5H3q0 7 5 7m9-7h4q0 7-5 7m-4 3v5m-5 1h10"/>'
  };
  function icon(name,size=22){return `<svg class="icon" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.85" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name]||paths.star}</svg>`;}
  function bunny(outfit='scarf', id='b') {
    const clothes={
      scarf:'<path d="M92 202q37 15 74-1v20q-37 17-74-1z" fill="#aaa0f2"/><path d="M143 219l23 1 7 39-25-6z" fill="#9286df"/><path d="m149 241 20 5" stroke="#cdc5ff" stroke-width="5"/>',
      bow:'<path d="M127 211q-33-28-32 4 0 22 32 5 33 19 33-6 0-29-33-3" fill="#f7a4bf"/><circle cx="128" cy="215" r="9" fill="#dc7b9f"/>',
      cape:'<path d="M88 207q-24 28-17 71l59-15 58 15q9-40-20-71z" fill="#778bd1"/><path d="M96 211q31 15 65 0" stroke="#fbe197" stroke-width="10"/><circle cx="128" cy="221" r="9" fill="#ffe9ad"/>',
      crown:'<path d="m82 125-5-37 27 13 24-27 24 27 26-13-5 37z" fill="#f6d579" stroke="#e7b94e" stroke-width="3"/><path d="M89 120h76" stroke="#fff0b0" stroke-width="5"/><path d="m128 97 7 10-7 10-7-10z" fill="#aaa0f2"/>',
      hat:'<path d="M84 128q-4-60 45-59 48 0 46 59" fill="#c4ac86"/><ellipse cx="129" cy="129" rx="64" ry="16" fill="#dbc298"/><path d="M88 116q40 12 81 0" stroke="#9ca988" stroke-width="11"/>',
      flower:'<g transform="translate(179 142)"><g fill="#efa4c5"><ellipse cy="-15" rx="9" ry="15"/><ellipse cy="15" rx="9" ry="15"/><ellipse cx="-15" rx="15" ry="9"/><ellipse cx="15" rx="15" ry="9"/></g><circle r="10" fill="#ffe5a0"/></g>'
    };
    const front=['crown','hat','flower'].includes(outfit);
    return `<svg class="bunny" viewBox="0 0 270 330" role="img" aria-label="흰 토끼 버니${outfit==='crown'?', 왕관 착용':''}"><defs><linearGradient id="fur-${id}" x2=".8" y2="1"><stop stop-color="#ffffff"/><stop offset="1" stop-color="#eeeafb"/></linearGradient><linearGradient id="ear-${id}" x2="0" y2="1"><stop stop-color="#f2aac1"/><stop offset="1" stop-color="#ffe2e9"/></linearGradient></defs><ellipse class="bunny-shadow" cx="135" cy="304" rx="68" ry="12" fill="#7564b4" opacity=".17"/><g class="bunny-body"><ellipse cx="186" cy="251" rx="22" ry="23" fill="#fffefa"/><ellipse cx="128" cy="245" rx="53" ry="60" fill="url(#fur-${id})"/><ellipse cx="107" cy="291" rx="31" ry="17" fill="#fffefa" transform="rotate(-10 107 291)"/><ellipse cx="159" cy="291" rx="31" ry="17" fill="#fffefa" transform="rotate(10 159 291)"/><ellipse cx="127" cy="256" rx="33" ry="35" fill="#fffefa"/><g class="bunny-ear left-ear"><ellipse cx="96" cy="85" rx="26" ry="72" transform="rotate(-13 96 85)" fill="url(#fur-${id})"/><ellipse cx="97" cy="81" rx="12" ry="51" transform="rotate(-13 97 81)" fill="url(#ear-${id})"/></g><g class="bunny-ear right-ear"><ellipse cx="160" cy="80" rx="25" ry="73" transform="rotate(12 160 80)" fill="url(#fur-${id})"/><ellipse cx="159" cy="77" rx="11" ry="51" transform="rotate(12 159 77)" fill="url(#ear-${id})"/></g><ellipse cx="130" cy="166" rx="73" ry="62" fill="url(#fur-${id})"/><g class="bunny-eyes" fill="#474262"><ellipse cx="103" cy="166" rx="6" ry="9"/><ellipse cx="157" cy="166" rx="6" ry="9"/><circle cx="105" cy="163" r="2" fill="white"/><circle cx="159" cy="163" r="2" fill="white"/></g><ellipse cx="83" cy="184" rx="12" ry="7" fill="#f8b5ca"/><ellipse cx="177" cy="184" rx="12" ry="7" fill="#f8b5ca"/><path d="m124 181 6 4 6-4" stroke="#d19aaf" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M130 185v5m0 0q-5 7-10 1m10-1q5 7 10 1" stroke="#665b7c" stroke-width="3" fill="none" stroke-linecap="round"/>${!front?(clothes[outfit]||clothes.scarf):''}<ellipse cx="80" cy="246" rx="15" ry="29" fill="#fffefa" transform="rotate(22 80 246)"/><g class="bunny-wave"><ellipse cx="180" cy="235" rx="15" ry="32" fill="#fffefa" transform="rotate(-40 180 235)"/><ellipse cx="195" cy="220" rx="6" ry="8" fill="#f6c5d5"/></g>${front?clothes[outfit]:''}</g></svg>`;
  }
  function landscape(outfit='scarf') {
    return `<div class="island-scene" aria-hidden="true"><div class="scene-sun"></div><div class="cloud cloud-a"></div><div class="cloud cloud-b"></div><span class="sparkle spark-a">✦</span><span class="sparkle spark-b">✧</span><span class="sparkle spark-c">✦</span><div class="back-hill hill-a"></div><div class="back-hill hill-b"></div><div class="island-rock"></div><div class="island-grass"></div><div class="tiny-tree tree-a"><i></i></div><div class="tiny-tree tree-b"><i></i></div><div class="mushroom mush-a"></div><div class="mushroom mush-b"></div><div class="flower-dot flower-a"></div><div class="flower-dot flower-b"></div><div class="hero-bunny">${bunny(outfit,'hero')}</div><div class="floating-word float-apple"><img src="content/images/apple.svg" data-asset="content/images/apple.svg" alt=""/><span>apple</span></div><div class="floating-word float-star"><img src="content/images/star.svg" data-asset="content/images/star.svg" alt=""/><span>star</span></div><div class="hello-bubble">같이 모험할래?</div><div class="scene-path"></div></div>`;
  }
  return {icon,bunny,landscape};
})();
