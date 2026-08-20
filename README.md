# 혜이파파 플레이

아이와 가족이 설치나 회원가입 없이 바로 즐길 수 있는 무료 웹게임 놀이터입니다. 기존 14개 게임은 유지하고, 홈·게임 런처·재방문 기능·콘텐츠·PWA·검증 체계를 현대적으로 개편했습니다.

## 주요 기능

- 14개 게임 검색, 카테고리 필터, 즐겨찾기
- 매일 바뀌는 오늘의 도전, XP, 연속 방문, 최근 플레이
- 모바일 우선 반응형 화면과 다크 모드
- 공통 게임 런처: 새로고침, 전체 화면, 공유, 플레이 시간, 추천 게임
- 홈 화면 설치형 PWA와 오프라인 안내
- 놀이 가이드, 서비스 소개, 개인정보 처리방침
- Google Analytics 이벤트와 게임 조작부에서 분리한 광고 영역
- GitHub Actions 정적 검증

## 로컬 실행

```bash
python -m http.server 8000
```

브라우저에서 `http://localhost:8000`을 엽니다. `file://`로 직접 열면 서비스워커, iframe, 일부 브라우저 기능이 정상 작동하지 않을 수 있습니다.

## 검증

```bash
python scripts/validate_site.py
node --check app.js
node --check play.js
node --check games-data.js
node --check sw.js
```

검증 스크립트는 필수 공통 파일, 게임 데이터 형식, 14개 기존 게임 파일과 썸네일 경로, 기본 HTML 구조를 확인합니다.

## 구조

```text
index.html / styles.css / app.js   홈과 재방문 기능
games-data.js                      14개 게임의 단일 메타데이터 원본
play.html / play.css / play.js     기존 게임을 감싸는 공통 런처
guides.html                        보호자용 놀이 가이드
about.html                         서비스 소개
privacy.html                       개인정보·광고·분석 안내
manifest.webmanifest / sw.js       PWA와 제한된 오프라인 캐시
scripts/validate_site.py           배포 전 정적 검증
```

## 안전한 변경 원칙

- `matchgame.html`, `logicgame.html` 등 기존 게임은 기능별로 독립되어 있습니다. 게임 엔진을 바꿀 때는 해당 HTML·CSS·JavaScript와 Firebase 기록 흐름을 함께 확인하세요.
- 홈과 런처는 `games-data.js`를 공통 데이터원으로 사용합니다. 게임을 추가하거나 경로를 바꾸면 이 파일과 `sitemap.xml`, 서비스워커 목록을 함께 갱신하세요.
- JavaScript를 사용할 수 없는 환경에서는 홈의 `<noscript>` 링크로 기존 게임을 직접 열 수 있습니다.
- 서비스워커는 명시된 루트 파일과 게임 자산만 처리하며 `/vietnam/` 같은 별도 하위 앱은 가로채지 않습니다.
- `play.html`은 `noindex`로 설정해 원본 게임 페이지와 중복 색인이 생기지 않도록 했습니다.

## 배포 후 별도 확인

코드 저장소 밖에서 관리해야 하는 항목입니다.

1. Firebase Console의 Firestore Security Rules와 App Check
2. AdSense의 개인정보 보호 및 메시지/CMP 설정
3. Search Console의 `sitemap.xml` 제출과 색인 상태
4. GA4 DebugView의 `game_open`, `game_session_end`, `daily_challenge_complete`, `share_game` 이벤트

## 개인정보와 공개 기록

일부 기존 게임은 Firebase에 점수와 사용자가 입력한 이름을 저장합니다. 공개 순위표에는 실명·학교명·연락처 대신 닉네임을 사용하도록 안내하고, 민감한 값은 GitHub 이슈에 올리지 마세요. 자세한 내용은 `privacy.html`과 `SECURITY.md`를 참고하세요.

## 수익화 원칙

광고는 홈의 게임 목록 아래와 게임 설명 영역에만 배치하며, 시작·정답·다시하기·전체 화면 같은 조작 버튼 가까이에 두지 않습니다. 운영 지표와 콘텐츠 개선 순서는 `MONETIZATION.md`에 정리되어 있습니다.
