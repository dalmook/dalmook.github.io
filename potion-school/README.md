# 방울방울 마법학교

어린이용 물약 따르기 퍼즐. React · TypeScript · Vite · Radix UI · Lucide · Web Audio로 제작했습니다.

## 실행
현재 폴더의 `index.html`, `assets/`, `momo.webp`, `friends-atlas.webp`, `favicon.svg`는 완성된 정적 배포판입니다. GitHub Pages의 `/potion-school/`에서 실행할 수 있습니다. 별도 서버/API 키가 필요하지 않습니다.

## 기능
- 풀이 검증된 30개 레벨과 3개 테마
- 실제로 기울어지는 병, 캔버스 물약 줄기, 병 안에 차오르는 수위와 보글보글 효과음
- 별 보상과 일러스트로 그린 마법 친구 5종 수집
- 무료 힌트, 되돌리기, 다시 시작, 빈 병 추가
- 효과음/움직임 설정, 색 문양 표시, 키보드/터치 지원
- 이 기기에 완료 기록과 설정 저장 (현재 퍼즐 배치는 새로고침 시 초기화)
- 회원가입/광고/결제/추적 코드 없음

## 수정 및 다시 빌드
Node 22.13 이상에서 이 폴더에서 `npm install` 후 `npm run dev`.
`npm run build`는 `build/`에 HTML과 번들을 출력합니다. 배포할 때 해당 파일을 현재 폴더에 복사하고 `momo.webp`, `friends-atlas.webp`, `favicon.svg`를 함께 유지하세요. 이미지는 개발/빌드 전에 자동으로 복사됩니다.

## 검증
`npm test`로 전체 레벨 풀이, 수량 보존, 병 용량, 불가능한 이동, 입력 불변성을 검증합니다.

## 저작물
모모와 친구 일러스트는 이 게임용으로 AI 생성했습니다. Lucide 및 Radix UI 아이콘/컴포넌트는 각각의 오픈소스 라이선스를 따릅니다.
