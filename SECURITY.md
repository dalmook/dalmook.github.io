# Security Policy

## Supported version

`main` 브랜치에 배포된 최신 GitHub Pages 버전을 지원합니다. 오래된 복사본과 실험 페이지는 별도 지원하지 않습니다.

## Reporting a vulnerability

공개 가능한 일반 오류는 저장소의 GitHub Issues로 알려 주세요. 다음 정보가 있으면 재현에 도움이 됩니다.

- 문제가 발생한 페이지 주소
- 기기와 브라우저
- 재현 순서
- 콘솔 오류 또는 화면 캡처

API 키, 개인 정보, Firebase 문서 내용, 인증 정보처럼 공개하면 안 되는 자료는 공개 이슈 본문에 올리지 마세요. 공개 이슈가 부적절한 보안 문제라면 민감한 값을 제거한 최소 설명만 남기고 비공개 연락 방법을 먼저 요청해 주세요.

## Firebase and client-side records

이 사이트의 일부 게임은 브라우저에서 Firebase Firestore에 직접 연결합니다. Firebase 웹 구성값을 숨기는 것만으로 보안이 생기지 않습니다. 배포 전 다음을 별도로 점검해야 합니다.

- Firestore Security Rules의 읽기·쓰기 범위
- 필드 형식, 길이, 허용값 검증
- 과도한 반복 쓰기와 비정상 트래픽
- Firebase App Check 모니터링 및 적용
- 어린이 실명 대신 닉네임 사용 안내

## Dependency policy

외부 CDN과 브라우저 API를 사용하는 게임은 정기적으로 로드 상태를 확인하고, 더 이상 유지되지 않는 라이브러리는 검증 후 교체합니다.
