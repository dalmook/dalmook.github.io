# 구현 및 검수 기록

## 구현 결과

- 독립적인 HTML/CSS/ES 모듈 정적 웹앱. 기존 AI Shorts Studio 파일 변경 없음.
- 7개 카테고리, 62개 놀이. 모든 놀이에 설명·인원·연령·장소·준비물·활동량·소음·시간·난이도·팀전·안전도·3단계 규칙·팁·4장면 설명 데이터 포함.
- 9가지 조건, 검색, 카테고리, 처음 보는 놀이 추천. 정확한 일치가 없으면 필요한 조건 변경을 안내. 뽑기에는 부적합 후보를 넣지 않음.
- 룰렛, 1/2 주사위, 실제 경로를 따라가는 사다리, 앞뒷면 카드. 결과 효과음·진동(지원 기기)·색종이 효과.
- 각 놀이 24초/4장면 SVG 쇼츠. 팔·다리 움직임과 동작별 소품, 장면 전환, 진행률, 정지/재생, 이전/다음, 다시보기. 숨겨진 탭에서는 시간 진행을 멈춤.
- 즐겨찾기, 최근 방문, 누적 발견, 놀이 완료 기록, 4종 배지, 조건 저장, 준비 확인과 놀이 타이머.
- 오늘의 미션, 비/생일/가족/체육 조건, 장소와 인원 바로가기, 준비물 없는 놀이, 낮은 위험도 조건.
- 직접 제작한 달봉이 SVG 브랜딩, 히어로, 62개 놀이 SVG, 기본/인사/놀람/친구 캐릭터, 분류 아이콘.
- 브라우저 데이터 저장. 로그인·분석·광고·API 키 없음. 효과음은 브라우저에서 합성.

## 검수

- `npm test`: 7개 테스트 통과. 데이터/자산 완전성, 전체 필터, 적합도, 검색/미발견, 빈 후보, 사다리 경로, 무작위 경계 검사.
- `tests/browser-smoke.mjs`: 실제 Chrome에서 홈·도감·상세·4개 뽑기·쇼츠·보물함 확인. 즐겨찾기 재로드 유지, 타이머, 완료 기록, 결과 매핑, 쇼츠 제어, 빈 결과 확인.
- 반응형: 폭 320, 390, 768px에서 9개 화면의 가로 넘침 없음. 1440px 데스크톱 확인.
- `tests/scenes.mjs`: 62개 놀이 × 4장면 = 248개 자막을 320px에서 검사. 자막·화면 하단 표시와 겹침 없음.
- 데스크톱 홈·모바일 홈·모바일 쇼츠 PNG를 열어 시각 검토. 카드 글씨 크기와 대비, 독립적인 팔다리 동작 보강.
- 자동 테스트 통과는 실제 어린이 대상 사용성 조사와는 다릅니다. 실기기 Safari/터치 기기 검증과 배포 후 네트워크 검증은 별도입니다.

## 변경 파일 목록

신규 파일은 모두 `dalbong-playground/` 아래에 있습니다.

- 진입/문서: `index.html`, `package.json`, `.nojekyll`, `.gitignore`, `README.md`, `DELIVERY.md`
- 화면: `css/style.css`
- 모듈: `js/app.js`, `js/art.js`, `js/filters.js`, `js/pickers.js`, `js/shorts-player.js`, `js/storage.js`
- 데이터: `data/games.json`, `data/categories.json`
- 일러스트: `assets/images/play-01.svg` ~ `play-62.svg`, `hero.svg`, `dalbong-happy.svg`, `dalbong-wave.svg`, `dalbong-surprise.svg`, `dalbong-friend.svg`
- 아이콘: `assets/icons/logo.svg`, `chase.svg`, `reaction.svg`, `traditional.svg`, `ground.svg`, `team.svg`, `word.svg`, `party.svg`
- 도구: `scripts/serve.mjs`, `build.mjs`, `create-data.mjs`, `create-art.mjs`, `export-tree.mjs`
- 검증: `tests/core.test.mjs`, `browser-smoke.mjs`, `scenes.mjs`
- 독립 저장소 배포: `.github/workflows/pages.yml`

`dist/`는 `npm run build`가 생성하며 Git에는 넣지 않습니다. `test-results/`의 PNG/검증 JSON은 로컬 검수 산출물입니다.

## 배포 기준

- UTF-8 파일, 상대경로, 해시 라우팅. 하위 URL 배포 지원.
- GitHub Pages branch 방식은 앱 루트의 `index.html`과 자산 폴더를 그대로 사용.
- 독립 Actions 방식은 `npm test` → `npm run build` → `dist/` 업로드.
- 기존 Pages 하위 폴더 추가 PR에서는 앱 바깥의 메인 화면을 수정하지 않음. 실제 공개는 PR 병합과 기존 Pages 배포 완료 이후 확인해야 함.
- 배포 후 JSON/SVG 응답, 모바일 홈, 즐겨찾기, 룰렛 결과, 해시 상세 URL 새로고침 확인.
