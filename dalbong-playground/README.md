# 달봉이의 놀이동산

“오늘 뭐 하고 놀지?”를 함께 결정하는 모바일 중심 놀이 추천 웹앱입니다. 62개의 전통·생활 놀이, 조건 추천, 네 가지 뽑기, 24초 SVG 애니메이션 설명을 제공합니다. 가입·백엔드·유료 API 없이 정적 호스팅에서 실행됩니다.

## 실행

Node.js 20 이상에서 이 폴더를 열고 실행합니다. 런타임 패키지 설치는 필요하지 않습니다.

```sh
npm start
```

`http://127.0.0.1:4173`을 엽니다. JSON을 fetch하므로 `index.html`을 `file://`로 직접 열지 마세요. 다른 정적 웹 서버도 사용할 수 있습니다.

## 사용 방법

1. 홈에서 장소·정확한 인원·시간·준비물을 선택하고 추천을 받습니다. 펼침 메뉴에는 활동량·소음·연령·팀전·안전도 조건이 있습니다.
2. 놀이 도감에서 검색하거나 카테고리를 선택합니다. 모든 조건이 맞는 놀이를 먼저 표시합니다. 없으면 바꿔야 하는 조건을 명시한 제안을 표시합니다.
3. 뽑기는 현재 조건을 **모두** 만족하는 놀이만 사용합니다. 룰렛은 최대 8개, 사다리는 최대 4개, 카드는 최대 6개 후보를 무작위 추출합니다. 주사위 하나는 6칸에, 두 개는 6×6칸에 매핑합니다. 풀이 작으면 후보가 반복될 수 있어 놀이별 확률이 완전히 동일하지 않을 수 있습니다. 후보와 매핑은 화면에 표시합니다.
4. 놀이 상세에서 규칙·준비물·주의사항을 확인합니다. `움직이는 설명 보기`는 4장면, 총 24초입니다. 자동 재생·일시정지·장면 이동·다시보기를 지원합니다. 기기 설정의 모션 감소를 존중합니다.
5. `바로 시작`에서 공간 준비를 확인하고 타이머를 사용합니다. `다 놀았어요`는 놀이 기록을 남깁니다. 하트는 즐겨찾기, 보물함은 최근 본 놀이·배지·완료한 놀이를 보여줍니다.
6. 음표 버튼은 사용자 입력 이후 Web Audio 효과음만 켭니다. 기본은 무음이며 음성 합성이나 외부 오디오를 사용하지 않습니다.

## 폴더와 주요 구현

| 파일/폴더              | 역할                                                       |
| ---------------------- | ---------------------------------------------------------- |
| `index.html`           | 접근성 랜드마크, 내비게이션, 앱 진입점                     |
| `css/style.css`        | 데스크톱/모바일 화면과 동작별 애니메이션                   |
| `js/app.js`            | 해시 라우팅, 홈, 도감, 상세, 보물함, 타이머                |
| `js/filters.js`        | 조건 비교, 적합도 정렬, 무작위 추출                        |
| `js/pickers.js`        | 포인터와 일치하는 룰렛, 1/2 주사위, 실제 사다리 경로, 카드 |
| `js/shorts-player.js`  | 장면 시간, 재생 상태, 진행률, 탭 비활성 시 일시 정지       |
| `js/art.js`            | 직접 제작한 SVG 캐릭터·배경·놀이 소품                      |
| `js/storage.js`        | 버전이 있는 localStorage 저장과 실패 대응                  |
| `data/games.json`      | 62개 놀이 원본 데이터                                      |
| `data/categories.json` | 7개 분류와 색상                                            |
| `assets/images/`       | 놀이별 SVG 62개, 히어로, 달봉이 포즈                       |
| `assets/icons/`        | 로고, 7개 카테고리 일러스트                                |
| `scripts/`             | 로컬 서버, 정적 빌드, 초기 데이터·일러스트 생성            |
| `tests/`               | 데이터·추천·사다리 검증, 실제 Chrome 기능·반응형 검증      |

## 놀이 추가 방법

`data/games.json`의 배열에 아래 형식으로 항목을 추가합니다. 기존 id는 변경하지 않아야 저장된 즐겨찾기가 유지됩니다. 놀이 데이터는 신뢰할 수 있는 편집자가 관리하는 정적 콘텐츠입니다.

```json
{
  "id": "play-63",
  "title": "새로운 놀이",
  "subtitle": "아이에게 건네는 짧은 한 줄 소개",
  "category": "word",
  "places": ["집", "거실", "교실", "실내"],
  "minPlayers": 2,
  "maxPlayers": 8,
  "activityLevel": "낮음",
  "noiseLevel": "낮음",
  "durationMin": 10,
  "materials": [],
  "ageGroup": "6세 이상",
  "minAge": 6,
  "difficulty": "쉬움",
  "team": false,
  "risk": "낮음",
  "safety": ["놀이에 해당하는 구체적인 주의사항"],
  "steps": ["준비 방법", "실제 진행 방법", "차례 변경과 완료 조건"],
  "tips": ["재미있는 변형 규칙"],
  "tags": ["비 오는 날"],
  "ruleNote": "달봉이 쉬운 규칙 · 시작 전에 함께 약속해요.",
  "thumbnail": "assets/images/play-63.svg",
  "illustration": "assets/images/play-63.svg",
  "shortScenes": [
    {
      "sceneTitle": "먼저 준비해요",
      "narration": "준비 방법",
      "caption": "준비 방법",
      "characterAction": "prepare",
      "backgroundType": "room",
      "duration": 5
    },
    {
      "sceneTitle": "이렇게 놀아요",
      "narration": "진행 방법",
      "caption": "진행 방법",
      "characterAction": "word",
      "backgroundType": "room",
      "duration": 7
    },
    {
      "sceneTitle": "함께 성공!",
      "narration": "완료 조건",
      "caption": "완료 조건",
      "characterAction": "word",
      "backgroundType": "room",
      "duration": 7
    },
    {
      "sceneTitle": "안전하게 놀아요",
      "narration": "주의사항",
      "caption": "주의사항",
      "characterAction": "celebrate",
      "backgroundType": "room",
      "duration": 5
    }
  ]
}
```

카테고리 id: `chase`, `reaction`, `traditional`, `ground`, `team`, `word`, `party`.
활동량·소음도: `낮음`, `보통`, `높음`. 재료가 없는 경우 `materials: []`.
시간 필터의 5분/10분은 상한, 20분은 하한입니다. 인원 필터는 구간 이름이 아닌 **실제 참여 인원**을 비교합니다. 연령은 가장 어린 참여자를 기준으로 최소 연령 이상인지 검사합니다.

`characterAction` 지원값: `prepare`, `chase`, `hide`, `rescue`, `freeze`, `stop`, `count`, `raise`, `clap`, `mirror`, `kick`, `toss`, `flip`, `board`, `throw`, `jump`, `spin`, `stretch`, `fly`, `hop`, `draw`, `balance`, `pull`, `pass`, `word`, `mime`, `card`, `slide`, `stack`, `celebrate`. 배경은 `park` 또는 `room`입니다. 새 동작은 `js/art.js`의 소품과 CSS의 `.action-*` 규칙을 함께 추가합니다.

기존 동작으로 썸네일을 만들려면 `node scripts/create-art.mjs`를 실행하세요. 직접 제작한 SVG로 교체해도 됩니다. **`create-data.mjs`는 최초 시드 생성 전용이며 실행하면 편집한 games.json을 덮어씁니다. 일상 데이터 편집에는 실행하지 마세요.**

## 검증

```sh
npm test
npm run build
```

실제 브라우저 검증은 `puppeteer-core`와 Chrome이 있는 개발 환경에서, 서버를 실행한 뒤 `node tests/browser-smoke.mjs`를 사용합니다. 필요하면 `npm install --no-save puppeteer-core`로 설치하고, Windows 기본 설치 위치가 아니면 `CHROME_PATH`를 지정합니다. 앱 자체에는 이 패키지가 필요하지 않습니다. `test-results/`에 스크린샷과 JSON 결과가 생성됩니다.

## GitHub Pages 배포

### 독립 저장소

이 폴더의 **내용물**을 저장소 루트에 올립니다. 가장 단순한 방법은 GitHub `Settings → Pages → Deploy from a branch → main / (root)`입니다. `.nojekyll` 파일을 포함하세요.

GitHub Actions 방식을 선택하면 `.github/workflows/pages.yml`을 사용합니다. `Settings → Pages → Source`를 `GitHub Actions`로 바꾸고 main에 푸시하거나 워크플로를 수동 실행하세요. 워크플로는 단위 검증 후 `dist/`만 업로드합니다. 배포 URL은 Actions 결과에 표시됩니다.

### 기존 개인 Pages의 하위 앱

`dalbong-playground/` 폴더째 추가하면 `https://<계정>.github.io/dalbong-playground/`에서 실행할 수 있습니다. 모든 자산 경로가 상대경로이고 라우팅은 `#game/play-01` 형태라 별도 rewrite 설정이 필요하지 않습니다. 기존 저장소가 별도 빌드/업로드 경로를 사용하면 이 폴더가 배포 산출물에 포함되는지 확인합니다. 이 폴더 안의 `.github/`는 하위 앱 배포에서 자동 실행되지 않습니다.

[공식 Pages 안내](https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-github-pages-site), [사용자 지정 워크플로](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages).

## 운영 참고

- 놀이 규칙은 시작하기 쉬운 변형입니다. 나이먹기는 가상 나이·점수 방식, 땅따먹기는 종이 점 연결, 비석치기는 스펀지 버전으로 표시했습니다. 전통 규칙의 유일한 정본을 주장하지 않습니다.
- 6세 이상 중심입니다. 6세 미만 전용 콘텐츠는 포함하지 않았습니다. 지역·공간·참여자에 맞게 어른과 규칙을 조정하세요.
- 인기 영역은 실제 이용 통계가 아닌 편집 추천이며, `언제 해도 즐거운, 우리 놀이`로 표시합니다. 신규 영역은 데이터에 최근 추가된 항목입니다.
- 즐겨찾기·배지는 기기 간 동기화하지 않습니다. 저장이 제한되면 현재 창의 메모리에서 동작합니다.
- Google Fonts를 사용할 수 있으면 Noto Sans KR / Gowun Dodum을 읽고, 연결할 수 없으면 시스템 sans-serif로 표시합니다. 필수 실행 자산은 모두 프로젝트에 포함돼 있습니다. 분석·광고·계정 서버는 사용하지 않습니다.
- 실제 영상이나 녹음 파일 대신 브라우저 SVG/CSS 애니메이션과 자막을 사용합니다.

전체 파일 목록과 검수 범위는 `DELIVERY.md`를 참고하세요.
