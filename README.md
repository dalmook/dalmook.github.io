# 혜이파파 플레이 — 2026 리뉴얼 오버레이

기존 `dalmook/dalmook.github.io`의 게임 파일을 삭제하거나 다시 쓰지 않고, 홈·게임 런처·콘텐츠·PWA·검증 파일을 덮어씌우는 안전한 개편본입니다.

## 이번 개편에서 달라진 점

- 14개 기존 게임을 한곳에서 검색·필터·즐겨찾기
- 매일 바뀌는 오늘의 도전, XP, 연속 방문, 최근 플레이
- 모바일 우선 반응형 디자인과 다크 모드
- 기존 게임을 그대로 실행하는 `play.html` 런처
- 게임 새로고침, 전체 화면, 공유, 플레이 시간, 다음 게임 추천
- 홈 화면 설치가 가능한 PWA와 오프라인 안내
- 검색엔진용 설명, Open Graph 이미지, 구조화 데이터, 정리된 sitemap
- 놀이 가이드·서비스 소개·개인정보 처리방침
- 광고를 게임 조작 영역과 분리한 홈 1곳 + 게임 설명 아래 1곳 배치
- GitHub Actions 정적 검증

## 가장 안전한 적용 방법

1. 이 폴더를 압축 해제합니다.
2. PowerShell에서 아래처럼 실행합니다.

```powershell
Set-ExecutionPolicy -Scope Process Bypass
.\APPLY_OVERLAY.ps1 -RepositoryPath "C:\경로\dalmook.github.io"
```

3. 저장소에서 검증합니다.

```powershell
cd "C:\경로\dalmook.github.io"
python scripts\validate_site.py
```

4. `git diff`로 변경 범위를 확인한 다음 기능 브랜치에 커밋하고, GitHub Pages 미리보기 또는 로컬 서버에서 확인한 뒤 `main`에 병합합니다.

```powershell
git switch -c feature/modern-heypapa-2026
python -m http.server 8000
```

브라우저에서 `http://localhost:8000`을 엽니다.

## 구조상 안전한 이유

- `matchgame.html`, `logicgame.html` 등 기존 게임 14개는 수정하지 않습니다.
- JavaScript가 꺼져도 메인 카드가 기존 게임 페이지로 직접 연결됩니다.
- JavaScript가 켜지면 `play.html?game=...` 런처로 열어 공통 경험을 제공합니다.
- 서비스워커는 정해진 루트 파일만 처리합니다. `/vietnam/` 같은 별도 하위 앱은 가로채지 않습니다.
- `play.html`은 `noindex`라 검색 결과에 얇은 중복 페이지가 쌓이지 않습니다.

## 배포 전에 콘솔에서 확인할 것

코드만으로 끝나지 않는 설정입니다.

1. **Firebase Console**: Firestore Security Rules를 게임별 데이터 형식·쓰기 범위에 맞게 점검
2. **Firebase App Check**: 각 Firebase 연동 게임에 App Check SDK를 연결하고, 먼저 모니터링한 뒤 정상 트래픽을 확인해 적용 검토
3. **AdSense → 개인정보 보호 및 메시지**: Google 인증 CMP 메시지 설정
4. **Google Search Console**: `https://dalmook.github.io/sitemap.xml` 제출 및 색인 상태 확인
5. **GA4 DebugView**: `game_open`, `game_session_end`, `daily_challenge_complete`, `share_game` 이벤트 확인

## 주의

- 인기나 광고 수익은 디자인만으로 보장되지 않습니다. 재방문할 이유가 되는 새 게임·주간 도전·콘텐츠 업데이트가 핵심입니다.
- Firebase 웹 설정값은 브라우저에 노출되는 값이지만, 실제 보호는 Security Rules와 App Check 구성에 달려 있습니다.
- 공개 순위표에서는 어린이가 실명·학교·연락처를 입력하지 않도록 닉네임 안내를 유지하세요.
