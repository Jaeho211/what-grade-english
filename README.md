# What Grade English

초6~고3의 재미용 영어 학년 퀴즈. 10문제, 문제당 20초입니다.

## 실행 및 배포

Node.js 24 이상. 빌드와 엔진 검사에는 별도 패키지가 필요하지 않습니다.

```sh
npm run dev
npm run validate
npm test
npm run build
```

로컬: http://127.0.0.1:4173/

Cloudflare 빌드 명령: `npm run build`. 출력 디렉터리: `dist`. Node 버전: 24 이상 (`.node-version` 포함). Cloudflare에 Node 버전 환경변수를 별도로 설정했다면 `NODE_VERSION=24`로 맞춥니다.

Cloudflare Workers(`english.2dain.workers.dev`)는 저장소의 `wrangler.jsonc`를 사용합니다. 배포 명령은 `npx wrangler deploy`이며, 이 명령이 빌드를 실행한 후 `dist` 전체를 업로드합니다. `public`은 HTML/CSS 원본만 있어 배포하면 안 됩니다. `--assets public` 같은 명령줄 옵션은 설정을 덮어쓰므로 제거합니다. 프로젝트 루트에서 배포해야 합니다.

배포 후 `/web/app.js`, `/quiz/engine.js`, `/quiz/schema.js`, `/quiz/data/bank.json`이 모두 200으로 응답하는지 확인합니다. JS가 빠지면 첫 화면의 “문제를 준비하고 있어요…”에서 멈춥니다.

## 구현

- 7레벨 각 24문항, 총 168문항/84슬롯
- 중2 시작, 적응형 탐색 및 마지막 세 문항 영역별 재확인
- 모바일 대응 지문/질문/보기, 20초 타이머와 넘기기
- 정답 해설, 단일 학년 결과, 문제별 내 답·정답·해설
- 최근 문항 고려 및 보기 섞기
- 공유 메뉴/복사/수동 복사 대안

개인 결과의 동적 공유 미리보기 이미지는 아직 없습니다.

## 검증

중1~중3 및 전체 7레벨 각각 1,024개 정오답 경로 × 8개 시드와 타이머/넘기기/실수 후 회복/영역 편중/보기 섞기를 검사합니다. 빌드 결과의 JS 구문과 모듈 참조도 검사합니다.

문항 난이도는 설계에 따른 초안으로 실제 플레이 및 공식 어휘 목록 대조가 필요합니다. expectedMs는 임시값이고 실제 은행의 속도 가속은 꺼져 있습니다. 초6 하한 결과는 초6 숙달 확인이 아닙니다.

2026-10-04 배포 사이트에서 시작 화면 → 첫 문제 → 정답·해설을 실제 브라우저로 확인했습니다. 전체 브라우저 smoke suite는 아직 완료하지 않았습니다. Playwright/Chromium이 설치된 환경에서 로컬 서버 실행 후 `npm run test:browser`로 검사합니다. 별도 정적 TypeScript 검사는 아직 구성하지 않았습니다.

설계와 UI 정책은 docs/curriculum 및 docs/quiz에 있습니다.

제품 방향과 수학 자매 사이트 대비 품질 기준은 [제품 기준](docs/product-plan.md)을 따릅니다.
