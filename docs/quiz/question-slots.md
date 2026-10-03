# What Grade English — Question Slot Design

- 작성일: 2026-10-03
- 범위: 초6(Level 1) ~ 고3(Level 7)
- 목적: 10문제·20초 적응형 퀴즈를 위한 대표 출제 유형 정의
- 기준 문서: `docs/curriculum/english.md`

> 이 문서의 84개 slot은 84개의 고정 문항을 뜻하지 않는다.
> 각 slot은 "어떤 능력을 어떤 방식으로 확인할 것인가"를 정의하는 문제 유형이다.
> 실제 문제은행에서는 slot별로 여러 검수 문항 또는 제한적 template variation을 둘 수 있다.

## 1. 공통 설계 원칙

- Level은 초6 → 중1 → 중2 → 중3 → 고1 → 고2 → 고3의 7단계다.
- Domain은 `vocabulary`, `usage`, `reading`, `discourse`의 4개다.
- 각 Level × Domain마다 최소 3개의 대표 skill을 둔다.
- 한 문항은 가능한 한 하나의 핵심 판단만 요구한다.
- 같은 Level 안에서 서로 다른 skill이 비슷한 지식만 반복해서 검사하지 않도록 한다.
- 상위 Level의 난이도는 단순히 문장을 길게 만드는 것이 아니라 어휘 추상성, 구조 복잡도, 추론 깊이, 담화 관계의 정교함으로 높인다.
- 문법 용어를 직접 묻기보다 실제 문장에서 올바른 해석·사용을 요구한다.
- Vocabulary도 가능한 한 문맥 속에서 묻는다.
- 20초 안에 읽고 판단할 수 있는 길이를 유지한다.
- 오답은 무작위 단어가 아니라 실제 학습자가 선택할 법한 distractor로 설계한다.

## 2. Slot ID 규칙

```
L{level}-{domain code}-{number}
```

Domain code:

- V = vocabulary
- U = usage
- R = reading
- D = discourse

예:

- `L3-V02`: 중2 Vocabulary 두 번째 대표 유형
- `L6-D01`: 고2 Discourse 첫 번째 대표 유형

## 3. Level 1 — 초등학교 6학년

### Vocabulary

| Slot | Skill | 판별 목표 | 대표 문제 형태 |
|---|---|---|---|
| L1-V01 | everyday-context-meaning | 익숙한 일상 어휘의 문맥 의미 이해 | 짧은 문장에서 밑줄 단어와 가장 가까운 뜻 선택 |
| L1-V02 | action-word-choice | 상황에 맞는 기본 동사 선택 | 그림 없이도 이해 가능한 일상 상황 + 적절한 동사 |
| L1-V03 | basic-description | 기본 형용사·상태 표현 이해 | 사람·날씨·사물 설명에 맞는 형용사 선택 |

### Usage

| Slot | Skill | 판별 목표 | 대표 문제 형태 |
|---|---|---|---|
| L1-U01 | be-vs-main-verb | be동사와 일반동사의 기본 구조 구별 | 빈칸에 is/are/do/does 계열 중 선택 |
| L1-U02 | basic-tense | 현재와 기본 과거 표현 구별 | yesterday/every day 등의 단서를 이용한 형태 선택 |
| L1-U03 | question-modal-preposition | 기본 의문문·can·전치사 사용 | 한 문장의 자연스러운 완성형 선택 |

### Reading

| Slot | Skill | 판별 목표 | 대표 문제 형태 |
|---|---|---|---|
| L1-R01 | explicit-detail | 1~2문장의 직접 정보 찾기 | who/when/where/what 질문 |
| L1-R02 | simple-main-idea | 아주 짧은 글의 중심 내용 파악 | 두 문장의 공통 내용 선택 |
| L1-R03 | simple-intention | 초대·요청·안내의 목적 이해 | 메시지를 읽고 왜 썼는지 선택 |

### Discourse

| Slot | Skill | 판별 목표 | 대표 문제 형태 |
|---|---|---|---|
| L1-D01 | basic-connector | and/but/because의 기본 관계 이해 | 두 절 사이 연결어 선택 |
| L1-D02 | event-order | 간단한 사건 순서 이해 | first/then/finally가 있는 2~3단계 순서 |
| L1-D03 | clear-reference | he/she/it/they의 명확한 지시 대상 파악 | 두 문장에서 대명사가 가리키는 대상 선택 |

## 4. Level 2 — 중학교 1학년

### Vocabulary

| Slot | Skill | 판별 목표 | 대표 문제 형태 |
|---|---|---|---|
| L2-V01 | context-word-choice | 기본 확장 어휘를 문맥에 맞게 선택 | 감정·학교생활·취미 문장 빈칸 |
| L2-V02 | basic-synonym | 쉬운 유의어의 의미 차이 이해 | 문맥 속 단어와 가장 가까운 표현 선택 |
| L2-V03 | collocation-basic | 자주 쓰는 기본 단어 결합 인식 | make/do/take/have 수준의 자연스러운 결합 선택 |

### Usage

| Slot | Skill | 판별 목표 | 대표 문제 형태 |
|---|---|---|---|
| L2-U01 | tense-progressive | 현재·과거·진행 표현 구별 | 시간 단서와 상황을 함께 보고 형태 선택 |
| L2-U02 | infinitive-gerund-basic | to부정사·동명사의 기본 쓰임 적용 | want/enjoy 등 익숙한 동사 뒤 형태 선택 |
| L2-U03 | comparison-basic | 비교급·최상급의 의미 적용 | 두 대상 또는 세 대상 비교 문장 완성 |

### Reading

| Slot | Skill | 판별 목표 | 대표 문제 형태 |
|---|---|---|---|
| L2-R01 | detail-two-three-sentences | 2~3문장의 구체적 정보 통합 | 두 문장에서 필요한 정보 조합 |
| L2-R02 | reason-purpose-basic | 간단한 행동의 이유·목적 이해 | because/to 표현이 포함된 짧은 글 |
| L2-R03 | main-idea-short | 짧은 단락의 중심 내용 파악 | 세 문장 정도의 공통 주제 선택 |

### Discourse

| Slot | Skill | 판별 목표 | 대표 문제 형태 |
|---|---|---|---|
| L2-D01 | pronoun-reference | 대명사·this/that의 지시 대상 추적 | 앞 문장 명사 중 대상 선택 |
| L2-D02 | cause-effect-basic | 원인과 결과의 방향 이해 | so/because에 맞는 연결 선택 |
| L2-D03 | sequence-connector | 시간 순서와 연결 표현 이해 | before/after/then을 이용한 짧은 순서 판단 |

## 5. Level 3 — 중학교 2학년

### Vocabulary

| Slot | Skill | 판별 목표 | 대표 문제 형태 |
|---|---|---|---|
| L3-V01 | context-meaning-intermediate | 약 1,200단어 수준의 문맥 의미 판단 | 단어 하나의 뜻이 문장 전체에 의해 결정되는 문제 |
| L3-V02 | polysemy-basic | 익숙한 단어의 여러 의미 중 문맥 의미 선택 | light/run/hold류의 기본 다의어 |
| L3-V03 | infer-word-from-context | 정의·예시 단서를 이용한 어휘 추론 | unfamiliar-looking target + 짧은 설명 문맥 |

### Usage

| Slot | Skill | 판별 목표 | 대표 문제 형태 |
|---|---|---|---|
| L3-U01 | perfect-meaning | 현재완료의 형태보다 시간 관계 이해 | 과거 시작→현재 지속 상황과 맞는 문장 선택 |
| L3-U02 | passive-relation | 행위자와 대상 관계 이해 | 능동/수동 중 의미상 자연스러운 형태 선택 |
| L3-U03 | clause-question-relation | 관계 표현·간접의문문의 어순과 의미 이해 | 문맥상 자연스러운 절 완성 |

### Reading

| Slot | Skill | 판별 목표 | 대표 문제 형태 |
|---|---|---|---|
| L3-R01 | main-idea-paragraph | 3~4문장의 중심 내용 파악 | 여러 세부정보를 묶는 핵심 문장 선택 |
| L3-R02 | reason-purpose | 명시적 이유와 목적 구별 | 행동의 이유/목적을 문맥에서 판단 |
| L3-R03 | one-step-inference | 직접 정보에서 한 단계 추론 | 글에 그대로 쓰이지 않은 결과·상황 선택 |

### Discourse

| Slot | Skill | 판별 목표 | 대표 문제 형태 |
|---|---|---|---|
| L3-D01 | connector-context | however/therefore/for example 수준의 연결 관계 | 앞뒤 문맥에 맞는 연결어 선택 |
| L3-D02 | reference-across-sentences | 두세 문장에 걸친 지시 대상 추적 | it/this/they가 가리키는 내용 판단 |
| L3-D03 | short-order | 3개 문장의 자연스러운 순서 파악 | 원인→행동→결과 또는 시간 흐름 배열 |

## 6. Level 4 — 중학교 3학년

### Vocabulary

| Slot | Skill | 판별 목표 | 대표 문제 형태 |
|---|---|---|---|
| L4-V01 | nuanced-context-meaning | 1,500단어 범위에서 문맥에 맞는 의미 구별 | 비슷한 뜻의 선택지 중 적절한 표현 선택 |
| L4-V02 | abstract-word-basic | 기본 추상어 이해 | effect/value/attitude 등 추상 개념의 문맥 의미 |
| L4-V03 | synonym-fit | 유의어 중 collocation·뉘앙스상 가장 자연스러운 단어 선택 | 문법적으로 모두 가능한 보기에서 문맥 적합성 판단 |

### Usage

| Slot | Skill | 판별 목표 | 대표 문제 형태 |
|---|---|---|---|
| L4-U01 | modifier-relation | 관계절·분사구가 무엇을 수식하는지 파악 | 수식 대상 또는 의미가 맞는 문장 선택 |
| L4-U02 | condition-concession | 조건·양보 관계의 의미 이해 | if/unless/although 계열을 문맥에 맞게 선택 |
| L4-U03 | complex-core-structure | 복문에서 주절 핵심 구조 파악 | 삽입·수식 성분을 제외한 핵심 의미 판단 |

### Reading

| Slot | Skill | 판별 목표 | 대표 문제 형태 |
|---|---|---|---|
| L4-R01 | intention-attitude | 필자의 의도·감정·태도 파악 | 짧은 메시지/단락의 태도 선택 |
| L4-R02 | cause-result-inference | 여러 문장의 원인·결과를 종합 | 직접 언급되지 않은 결과 판단 |
| L4-R03 | simple-implication | 쉬운 함축 의미 이해 | 말한 내용이 실제로 시사하는 바 선택 |

### Discourse

| Slot | Skill | 판별 목표 | 대표 문제 형태 |
|---|---|---|---|
| L4-D01 | contrast-concession | 대조와 양보의 차이 이해 | however/although/despite 의미 관계 판단 |
| L4-D02 | logical-order | 이유·예시·결론이 있는 짧은 글의 순서 | 3개 문장 배열 |
| L4-D03 | implicit-link | 연결어가 없어도 문장 사이 논리 관계 추론 | 두 문장 사이 관계 또는 적절한 연결 표현 선택 |

## 7. Level 5 — 고등학교 1학년

### Vocabulary

| Slot | Skill | 판별 목표 | 대표 문제 형태 |
|---|---|---|---|
| L5-V01 | academic-context-basic | 공통영어 수준의 추상·학술 어휘 문맥 이해 | 사회·과학·심리 소재의 짧은 문장 |
| L5-V02 | polysemy-context | 다의어의 비일상적 의미 추론 | common word가 추상적 의미로 쓰인 문장 |
| L5-V03 | contextual-synonym | 문맥 속 유의어 대체 가능성 판단 | 의미가 비슷하지만 쓰임이 다른 보기 선택 |

### Usage

| Slot | Skill | 판별 목표 | 대표 문제 형태 |
|---|---|---|---|
| L5-U01 | complex-sentence-core | 긴 수식어가 있어도 주어·동사·핵심 의미 파악 | 수식어를 제거했을 때 의미가 맞는 선택 |
| L5-U02 | modifier-scope | 관계절·분사·전치사구의 수식 범위 이해 | 어느 성분을 꾸미는지 판단 |
| L5-U03 | clause-meaning-choice | 형태가 아니라 절 사이 의미 관계로 문법 선택 | 원인/조건/양보/목적에 맞는 형태 선택 |

### Reading

| Slot | Skill | 판별 목표 | 대표 문제 형태 |
|---|---|---|---|
| L5-R01 | main-idea-abstract | 짧은 추상 글의 요지·주제 파악 | 20~35단어 micro-passage |
| L5-R02 | purpose-claim | 필자의 목적·주장 구별 | 설명/설득/비판/제안 중 적절한 것 선택 |
| L5-R03 | supported-inference | 여러 단서에 근거한 간단한 추론 | 글에서 가장 잘 뒷받침되는 결론 선택 |

### Discourse

| Slot | Skill | 판별 목표 | 대표 문제 형태 |
|---|---|---|---|
| L5-D01 | relation-classification | 원인·대조·예시·결론 관계 구별 | 두 문장 관계 선택 |
| L5-D02 | sentence-bridge | 두 문장 사이에 들어갈 연결 문장 선택 | 앞내용을 받고 다음 내용으로 넘기는 문장 |
| L5-D03 | development-pattern | 짧은 글의 전개 방식 파악 | 주장→예시, 문제→해결, 원인→결과 등 |

## 8. Level 6 — 고등학교 2학년

### Vocabulary

| Slot | Skill | 판별 목표 | 대표 문제 형태 |
|---|---|---|---|
| L6-V01 | abstract-context | 2,000단어 수준의 추상어를 문맥에서 이해 | 개념적 문장 속 target word 의미 선택 |
| L6-V02 | nuance-between-synonyms | 유의어의 의미 강도·적합성 구별 | 문법상 가능하지만 의미가 미묘하게 다른 선택지 |
| L6-V03 | infer-unknown-word | 대조·정의·예시 단서로 미지어 의미 추론 | target word 자체를 몰라도 문맥으로 해결 가능 |

### Usage

| Slot | Skill | 판별 목표 | 대표 문제 형태 |
|---|---|---|---|
| L6-U01 | long-distance-relation | 떨어져 있는 주어·동사 또는 수식 관계 추적 | 삽입 성분이 있는 문장에서 구조 판단 |
| L6-U02 | clause-function | 절이 문장 안에서 수행하는 기능과 의미 파악 | 명사/수식/부사 역할을 용어 없이 판단 |
| L6-U03 | grammatical-but-inappropriate | 문법적으로 가능해 보여도 문맥상 부적절한 표현 구별 | 의미와 문법을 동시에 확인 |

### Reading

| Slot | Skill | 판별 목표 | 대표 문제 형태 |
|---|---|---|---|
| L6-R01 | author-position | 필자의 입장·태도 추론 | 명시적 감정어가 없는 짧은 주장 글 |
| L6-R02 | implied-conclusion | 직접 쓰이지 않은 결론 추론 | 근거 두 개에서 가장 타당한 결론 선택 |
| L6-R03 | abstract-main-point | 추상적 micro-passage의 핵심 논지 압축 | 세부 예시보다 일반화된 요지 선택 |

### Discourse

| Slot | Skill | 판별 목표 | 대표 문제 형태 |
|---|---|---|---|
| L6-D01 | blank-logic | 빈칸 전후의 논리 관계를 이용한 내용 선택 | 단순 단어가 아닌 짧은 구/문장 선택 |
| L6-D02 | premise-conclusion | 전제·근거·결론의 관계 파악 | 어느 문장이 결론인지 또는 무엇을 뒷받침하는지 판단 |
| L6-D03 | structural-transition | 글의 전환 지점과 기능 파악 | 일반론→반론, 문제→해결 등 변화 판단 |

## 9. Level 7 — 고등학교 3학년

### Vocabulary

| Slot | Skill | 판별 목표 | 대표 문제 형태 |
|---|---|---|---|
| L7-V01 | precise-abstract-meaning | 2,500단어 범위 추상어의 정교한 의미 구별 | 개념적 문맥에서 가장 정확한 뜻 선택 |
| L7-V02 | contextual-connotation | 비슷한 단어의 함의·태도 차이 이해 | 긍정/중립/비판적 뉘앙스 구별 |
| L7-V03 | semantic-shift | 익숙한 단어가 비유적·추상적으로 쓰인 의미 추론 | surface/weight/frame류의 문맥적 의미 판단 |

### Usage

| Slot | Skill | 판별 목표 | 대표 문제 형태 |
|---|---|---|---|
| L7-U01 | scope-changes-meaning | 수식·부정·강조 범위에 따라 의미가 달라지는 구조 이해 | 구조 차이로 의미가 바뀌는 선택지 비교 |
| L7-U02 | embedded-structure | 여러 절이 중첩된 문장의 핵심 관계 추적 | 짧지만 구조적으로 밀도 높은 문장 |
| L7-U03 | subtle-usage-fit | 모두 그럴듯한 보기 중 의미·구조상 정확한 표현 선택 | 고난도 distractor 기반 문장 완성 |

### Reading

| Slot | Skill | 판별 목표 | 대표 문제 형태 |
|---|---|---|---|
| L7-R01 | implication | 추상적 글의 함축 의미 추론 | 명시되지 않은 전제 또는 시사점 선택 |
| L7-R02 | argument-core | 근거와 예시를 제거하고 핵심 주장 파악 | 25~40단어 논증 micro-passage |
| L7-R03 | assumption-conclusion | 글의 전제·결론 관계 이해 | 결론이 성립하려면 필요한 전제 또는 가장 타당한 결론 선택 |

### Discourse

| Slot | Skill | 판별 목표 | 대표 문제 형태 |
|---|---|---|---|
| L7-D01 | sentence-insertion | 앞뒤 지시어·논리 흐름을 이용한 문장 삽입 | 3~4문장 내 한 위치 결정 |
| L7-D02 | argument-order | 추상적 논증의 문장 순서 판단 | 주장·근거·반론·결론의 순서 |
| L7-D03 | high-density-blank | 짧은 글의 전제와 결론을 모두 고려한 빈칸 추론 | 수능형 사고를 micro-passage로 축소 |

## 10. Level 간 난이도 경계

같은 Domain에서도 Level이 올라갈수록 다음 요소 중 하나 이상이 증가해야 한다.

| 축 | 낮은 Level | 높은 Level |
|---|---|---|
| Vocabulary | 일상·구체 | 추상·다의·뉘앙스 |
| Sentence structure | 단문 | 삽입·중첩·복합 수식 |
| Reading | 직접 정보 | 함축·전제·추론 |
| Discourse | 명시적 연결어 | 암묵적 논리 관계 |
| Distractor | 명백히 틀림 | 부분적으로 맞지만 최종적으로 부적절 |
| Text length | 짧음 | 조금 증가하되 고3도 20초 내 유지 |

Level을 올리기 위해 텍스트 길이만 늘리는 것은 금지한다.

## 11. Slot별 문항 수 목표

초기 구현:

- slot당 최소 2개의 검수 문항
- 총 최소 168문항

안정화 이후:

- 자주 출제되는 핵심 slot: 4~6문항
- 나머지 slot: 최소 3문항
- 제한적 template variation은 자연스러움과 정답 안정성을 테스트한 slot에만 적용

10문제 한 회차에서는 동일 `skill`의 반복 출제를 피하고,
가능하면 동일 Domain의 연속 출제도 최소화한다.

## 12. 문제 선택 시 활용

문제 선택기는 다음 우선순위를 사용한다.

1. 현재 target Level과 가까운 문제
2. 아직 정답 근거가 없는 Domain
3. 아직 출제하지 않은 skill
4. 직전 문제와 다른 Domain
5. 동일 조건 후보 중 무작위 선택

최종 학년 판정에서 Domain 다양성을 요구하므로,
탐색 단계에서도 한 Domain에 출제가 몰리지 않도록 한다.

## 13. 속도 사용 원칙

속도는 최종 Level을 직접 올리는 근거가 아니라 탐색 가속 신호다.

초기 권장:

- Vocabulary: speed acceleration 허용
- Usage: speed acceleration 허용
- Reading: 기본적으로 +2 가속 제외
- Discourse: 짧은 connector/reference 문제만 제한적으로 허용

각 문항은 `expectedMs`와 선택적 `fastThresholdMs`를 가진다.

1초 미만 응답은 속도 가속 근거에서 제외한다.

## 14. 검증 체크리스트

문제 추가 시 자동 또는 수동으로 확인한다.

- ID 중복 없음
- Level 1~7 범위
- Domain 네 종류 중 하나
- 등록된 skill 사용
- choices 중복 없음
- answer index 유효
- explanation 존재
- 20초 내 읽을 수 있는 길이
- 정답이 두 개로 해석될 여지 없음
- 오답이 지나치게 황당하지 않음
- 문제의 난이도가 단순한 희귀 단어 지식에만 의존하지 않음
- 상위 Level 문항이 하위 Level보다 단순히 길기만 한 문제가 아님
- 동일 회차에서 같은 skill 반복을 피할 수 있을 정도의 문제 수 확보

## 15. 구현 순서

1. 이 84개 slot을 코드 상수 또는 schema로 정의한다.
2. Level 3(중2) 문제부터 작성해 시작 화면의 기본 난이도를 확보한다.
3. Level 2·4를 추가해 적응형 상하 이동을 검증한다.
4. Level 1과 Level 5~7을 추가한다.
5. 각 slot 최소 2문항을 확보한다.
6. 1,024개 정오답 경로 시뮬레이션으로 모든 회차가 10문제로 끝나는지 확인한다.
7. 실제 플레이로 문제별 정답률·풀이 시간을 수집해 Level과 expectedMs를 조정한다.
