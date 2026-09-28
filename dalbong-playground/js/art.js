// Original vector artwork. Shared geometry keeps Dalbong consistent in every scene.
export function mascot(color = "#ffc85c", pose = "happy") {
  return `<g stroke="#344c3c" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path class="arm-left" d="M-22 31 Q-42 48 -40 66" fill="none"/><path class="arm-right" d="M22 31 Q40 39 43 20" fill="none"/><path class="leg-left" d="M-14 65 L-20 89 L-4 89" fill="none" stroke-width="9"/><path class="leg-right" d="M14 65 L21 89 L34 89" fill="none" stroke-width="9"/><rect x="-29" y="14" width="58" height="58" rx="24" fill="${color}"/><path d="M-19 35 Q0 48 19 35 L17 69 L-17 69Z" fill="#398565"/><circle cx="0" cy="3" r="36" fill="${color}"/><path d="M-28 -23 Q-36 -50 -13 -32 M12 -31 Q34 -51 28 -22" fill="${color}"/><path d="M-6 -31 Q1 -43 9 -33" fill="#6b9660"/><ellipse cx="-13" cy="1" rx="3" ry="4" fill="#344c3c" stroke="none"/><ellipse cx="13" cy="1" rx="3" ry="4" fill="#344c3c" stroke="none"/><ellipse cx="-23" cy="12" rx="7" ry="4" fill="#ed936f" stroke="none"/><ellipse cx="23" cy="12" rx="7" ry="4" fill="#ed936f" stroke="none"/>${pose === "surprise" ? '<ellipse cx="0" cy="15" rx="5" ry="7" fill="#344c3c"/>' : '<path d="M-7 12 Q0 22 7 12" fill="none"/>'}<circle cx="0" cy="54" r="5" fill="#ffe9b0" stroke="none"/></g>`;
}
const actionProps = {
  hide: '<g class="prop obstacle"><rect x="87" y="178" width="28" height="125" rx="8" fill="#b38159"/><circle cx="102" cy="163" r="66" fill="#7caa70"/><circle cx="68" cy="183" r="38" fill="#98bd81"/></g>',
  freeze:
    '<g class="ice"><path d="M285 197L341 187 364 305 283 315Z" fill="#b8e1ed" fill-opacity=".72" stroke="#6ab4cf" stroke-width="3"/></g>',
  stop: '<path class="signal" d="M276 74h63v55h-63z" fill="#e79575"/><path d="M308 129v36" stroke="#7b6655" stroke-width="5"/>',
  rescue:
    '<rect x="267" y="221" width="106" height="88" rx="15" fill="none" stroke="#9a83ae" stroke-width="6" stroke-dasharray="9 5"/>',
  jump: '<path d="M130 289Q250 252 371 289" fill="none" stroke="#e89c79" stroke-width="7"/>',
  hop: '<g fill="none" stroke="#fdfaf0" stroke-width="5"><path d="M140 335L200 243H303L365 335Z M173 288H333 M156 311H347 M248 243V311"/></g>',
  throw:
    '<g><ellipse cx="341" cy="291" rx="34" ry="10" fill="#577b76"/><path d="M307 291l8 42h52l8-42" fill="#80aaa0"/><circle class="moving-prop" cx="190" cy="206" r="12" fill="#e79465"/></g>',
  kick: '<g class="moving-prop"><path d="M219 237l-14-32 14 11 15-15-6 36" fill="#ec9375"/><ellipse cx="220" cy="240" rx="13" ry="6" fill="#776bb2"/></g>',
  toss: '<ellipse class="moving-prop" cx="250" cy="151" rx="29" ry="36" fill="#ea9b88"/><path d="M247 186l-4 9h13l-5-9" fill="#ca7766"/>',
  flip: '<g class="moving-prop"><path d="M230 298l30-28 29 29-29 28z" fill="#eea260" stroke="#bb7940" stroke-width="3"/><path d="M231 298h56m-27-27v55" stroke="#ffe2b7" stroke-width="3"/></g>',
  spin: '<g class="moving-prop"><path d="M235 288q25-25 50 0l-25 35z" fill="#c4acd9"/><path d="M260 261v26" stroke="#685584" stroke-width="6"/></g>',
  word: '<g class="bubble"><rect x="179" y="116" width="142" height="66" rx="22" fill="white"/><path d="M199 175l-9 25 34-23" fill="white"/><text x="250" y="159" text-anchor="middle" fill="#436c55" font-size="28" font-weight="800">가 → 나</text></g>',
  card: '<g class="moving-prop"><rect x="224" y="189" width="53" height="75" rx="10" fill="#f9e6a3" stroke="#c99848" stroke-width="3"/><path d="M241 220l9-13 9 13-9 15z" fill="#ed9a73"/></g>',
  board:
    '<g fill="#f8ebc5" stroke="#b8a877" stroke-width="3"><path d="M182 267h143v75H182z"/><path d="M218 267v75m36-75v75m35-75v75m-107-38h143"/><circle class="moving-prop" cx="200" cy="285" r="9" fill="#e19274"/></g>',
  draw: '<g><path d="M177 266h153v77H177z" fill="#fff9e6"/><path d="M196 321l31-31 27 17 45-28" fill="none" stroke="#89a873" stroke-width="6"/><path class="moving-prop" d="M264 281l30-43 8 6-30 43z" fill="#e49861"/></g>',
  pull: '<path d="M135 248Q251 262 365 248" stroke="#b0865e" stroke-width="9" fill="none"/><path d="M248 255v27l18-8-18-6" fill="#e78d77"/>',
  stretch:
    '<path d="M159 237l79-28 99 33-81 32Z M159 237l178 5m-99-33 18 65" stroke="#a088b5" stroke-width="4" fill="none"/>',
  balance:
    '<path d="M69 322Q180 274 260 334T433 314" fill="none" stroke="#f6f1d9" stroke-width="11"/>',
  slide:
    '<ellipse cx="317" cy="319" rx="50" ry="22" fill="none" stroke="#f5ebc5" stroke-width="5"/><ellipse class="moving-prop" cx="218" cy="319" rx="16" ry="7" fill="#d38d70"/>',
  stack:
    '<g fill="#dfa080" stroke="#fff2d0" stroke-width="3"><path d="M217 311l5-28h25l5 28zm39 0 5-28h25l5 28zm-20-30 5-28h25l5 28z"/></g>',
  fly: '<path class="moving-prop" d="M223 147l75-23-34 58-9-28z" fill="#f8ebc5" stroke="#b1ab82" stroke-width="3"/>',
  pass: '<circle class="moving-prop" cx="248" cy="240" r="19" fill="#eda172"/>',
  count:
    '<g class="bubble"><rect x="191" y="114" width="120" height="57" rx="20" fill="#fff8e6"/><text x="251" y="152" text-anchor="middle" font-size="29" fill="#3e7158">1 · 2 · 3</text></g>',
};
export function scene(
  action = "chase",
  bg = "park",
  label = "",
  uid = "scene",
) {
  const room = bg === "room";
  return `<svg class="scene action-${action}" viewBox="0 0 500 380" role="img" aria-label="${label || "달봉이와 친구의 놀이 장면"}" xmlns="http://www.w3.org/2000/svg"><rect width="500" height="380" fill="${room ? "#f2e9da" : "#e4efde"}"/>${room ? '<rect x="190" y="35" width="120" height="110" rx="32" fill="#d0e3dd" stroke="#fff9ee" stroke-width="12"/><path d="M250 36v109m-60-55h120" stroke="#fff9ee" stroke-width="6"/><path d="M0 277h500v103H0" fill="#e5d0b1"/>' : '<circle cx="392" cy="66" r="30" fill="#f7d983"/><path d="M-30 298Q120 164 286 291T545 258V380H0Z" fill="#c5d6aa"/><path d="M-20 334Q260 264 523 338V380H0Z" fill="#abc797"/><path d="M65 65q15-27 32-3 27-8 28 15H63q-12-5 2-12" fill="#fafbf2"/><path d="M297 330l8-14 8 14m108-34 6-12 6 12" stroke="#86a778" stroke-width="3" fill="none"/>'}<ellipse cx="155" cy="327" rx="48" ry="10" fill="#6f8252" opacity=".13"/><ellipse cx="346" cy="327" rx="45" ry="10" fill="#6f8252" opacity=".13"/><g transform="translate(151 230)"><g class="actor actor-a">${mascot()}</g></g><g transform="translate(342 237) scale(.88)"><g class="actor actor-b">${mascot("#f4ad92")}</g></g>${actionProps[action] || ""}${action === "celebrate" ? '<g fill="#e8ad58"><path d="M245 70l7 18 20 1-16 13 5 20-16-11-17 11 5-20-16-13 20-1z"/><circle cx="100" cy="120" r="5"/><circle cx="378" cy="168" r="6"/></g>' : ""}</svg>`;
}
export function hero() {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 450" role="img" aria-label="달봉이와 친구들이 풀밭에서 함께 노는 모습"><path d="M0 393Q156 208 368 318T655 326V450H0" fill="#d1deb9"/><ellipse cx="345" cy="399" rx="263" ry="48" fill="#b9d19e"/><path d="M94 196v176" stroke="#ab845e" stroke-width="21"/><circle cx="98" cy="177" r="72" fill="#87ab75"/><circle cx="54" cy="207" r="48" fill="#9aba83"/><path d="M462 160h123v150H462z" fill="#d9b893"/><path d="M440 163l84-64 85 64z" fill="#dd9774"/><path d="M509 228q17-28 34 0v82h-34" fill="#927f5f"/><circle cx="560" cy="64" r="27" fill="#f3cf70"/><g transform="translate(329 242) scale(1.45) rotate(-8)">${mascot()}</g><g transform="translate(501 304) scale(.8) rotate(12)">${mascot("#eaa4a0")}</g><g transform="translate(181 319) scale(.7) rotate(-10)">${mascot("#b2c3e1")}</g><path d="M244 366l28-9 10 21-28 11z" fill="#e6a177"/><path d="M385 387l21-19 23 20-22 20z" fill="#a08abc"/><path d="M125 79q21-31 40-3 34-9 37 17h-82q-8-8 5-14" fill="#fffaf0"/><path d="M384 82l10-21m16 30 19-6M205 220l-17-12" stroke="#d9aa53" stroke-width="5" stroke-linecap="round"/><g fill="#faf8e9"><circle cx="69" cy="397" r="7"/><circle cx="586" cy="375" r="7"/><circle cx="438" cy="423" r="5"/></g></svg>`;
}
