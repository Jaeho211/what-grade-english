# What Grade English

초6~고3 수준을 재미로 추정하는 10문제·20초 영어 퀴즈 프로젝트입니다.

현재는 설계 및 콘텐츠 프로토타입 단계이며 실행 가능한 웹 앱은 아직 없습니다.

- `docs/curriculum/english.md`: 교육과정 기준
- `docs/quiz/question-slots.md`: 84개 커버리지 슬롯
- `docs/quiz/design-review.md`: 구현 전 개선 정책
- `src/quiz/schema.ts`: Level/Domain/Skill/Family 스키마
- `src/quiz/data/level3.json`: 중2 12슬롯 × 2문항 초안

검증: Node.js에서 `node scripts/validate-bank.mjs` 실행. 구조와 커버리지 검사이며 영어 난이도·정답의 의미적 정확성을 보장하지 않습니다.

현재 문항은 작성 시 의미를 검토한 초안이며 학습자 실측 검수를 거치지 않았습니다. expectedMs는 임시값이고 속도 가속은 모두 비활성화했습니다. 어휘 목록 대조와 모바일 20초 플레이로 보정해야 합니다.

다음 단계: L2/L4 추가 → 적응형 엔진과 재확인 정책 → L1/L5~L7 추가 → UI/타이머/결과 → 경로 시뮬레이션 및 실제 플레이. 전체 7학년 판정은 모든 레벨의 콘텐츠가 갖춰진 뒤 공개합니다.
