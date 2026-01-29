# AI Assistant Web

## 프로젝트 개요

- **프로젝트 이름**: AI Assistant Web
- **한 줄 요약**: Vue 3 + TypeScript 기반의 실시간 스트리밍 AI 채팅 웹 애플리케이션
- **개발 목적**: 백엔드 Java/Spring 기반 AI 어시스턴트 API와 연동하여 사용자 친화적인 채팅 인터페이스를 제공하고, SSE(Server-Sent Events) 스트리밍을 통한 실시간 응답 경험을 구현
- **실제로 해결하려던 문제**:
    - 기존 REST API의 단순 요청-응답 방식으로는 AI 응답의 긴 대기 시간과 사용자 경험 저하 문제
    - 스트리밍 데이터 파싱 및 상태 관리의 복잡성
    - 대화 히스토리 관리 및 무한 스크롤 구현

## 실행 방법

### 개발 환경 실행

```bash
# 의존성 설치
npm install

# 개발 서버 실행
npm run dev
```

개발 서버 실행 후 브라우저에서 `http://localhost:5173` 접속

### 프로덕션 빌드

```bash
# TypeScript 타입 체크 + 빌드
npm run build

# 빌드 결과 미리보기
npm run preview
```

**주의사항**:

- 백엔드 API 서버(`localhost:8080`)가 실행 중이어야 함
- 개발 환경에서는 Vite 프록시가 자동으로 `/api` 요청을 백엔드로 전달
- 환경 변수 설정: `VITE_API_BASE_URL`, `VITE_USER_ID` (선택사항)

## 기술 스택

- **언어 / 프레임워크**:
    - Vue 3 (Composition API, `<script setup>`)
    - TypeScript 5.9
    - Vite 7.2
- **인프라 / 미들웨어**:
    - Vite Dev Server (프록시: `/api` → `localhost:8080`)
    - SSE (Server-Sent Events) 스트리밍
- **DB / 캐시**:
    - 없음 (백엔드 API에 의존)
- **기타**:
    - Tailwind CSS 4.1 (유틸리티 퍼스트 스타일링)
    - Reka UI (shadcn-vue 기반 컴포넌트 라이브러리)
    - markdown-it (마크다운 렌더링)
    - @unovis/vue (차트 라이브러리)

## 핵심 구현 포인트

### 1. SSE 스트리밍 파싱 및 버퍼 관리

**문제**: 백엔드에서 SSE로 전송되는 JSON 객체들이 청크 단위로 도착하며, 하나의 JSON 객체가 여러 청크에 걸쳐 분할될 수 있음. 또한 `{"a":1}{"b":2}`처럼 연속된 JSON 객체가 붙어서 전송됨.

**해결**:

- `extractCompleteJsonFromBuffer()` 함수로 버퍼에서 완전한 JSON만 추출
- 중괄호 카운팅과 문자열 이스케이프 처리로 정확한 JSON 경계 파악
- 불완전한 JSON은 버퍼에 보관하여 다음 청크와 결합

**트레이드오프**:

- 단순 `JSON.parse()` 대신 상태 머신 방식 채택 → 복잡도 증가하지만 안정성 확보
- 버퍼 크기 제한 없음 → 메모리 사용량 증가 가능성 (실무에서는 제한 필요)

```typescript
// src/lib/chatCompletionParser.ts
export function extractCompleteJsonFromBuffer(buffer: string): {
  contents: string[];
  remainingBuffer: string;
} {
  // 중괄호 카운팅으로 완전한 JSON만 추출
  // 문자열 내부의 중괄호는 이스케이프 처리로 구분
}
```

### 2. Vue 반응성과 스트리밍 상태 동기화

**문제**: 스트리밍 중인 메시지의 `isStreaming` 플래그를 `false`로 변경해도 UI가 즉시 반영되지 않음.

**해결**:

- `nextTick()`을 사용하여 Vue의 반응성 업데이트 사이클 보장
- 배열과 객체를 완전히 새로 생성하여 참조 변경 (`[...messages.value]`)
- 스트리밍 완료 시점에 명시적으로 메시지 객체 재생성

**트레이드오프**:

- `nextTick()` 사용으로 약간의 지연 발생 → 사용자 경험에는 영향 없음
- 배열 복사로 인한 메모리 오버헤드 → 대화 메시지 수가 많지 않아 허용 가능

```typescript
// src/composables/useChatState.ts
onComplete: async () => {
  await nextTick();
  const updatedMessages = [...messages.value];
  updatedMessages[messageIndex] = { ...currentMessage, isStreaming: false };
  messages.value = updatedMessages;
  await nextTick();
};
```

### 3. Composables 패턴으로 관심사 분리

**설계 선택**:

- 컴포넌트에서 API 호출 금지 → `useApi` composable로 분리
- 채팅 상태 관리 → `useChatState` composable로 분리
- 에러 처리 → `useApiError` composable로 분리

**이유**:

- 단일 책임 원칙 준수 (컴포넌트는 렌더링, composable은 비즈니스 로직)
- 테스트 용이성 (composable 단위 테스트 가능)
- 재사용성 (다른 컴포넌트에서도 동일 로직 사용)

**트레이드오프**:

- 파일 수 증가 → 프로젝트 구조 복잡도 증가
- Props drilling 감소 → 하지만 composable 간 의존성 관리 필요

### 4. 무한 스크롤 페이지네이션

**구현**:

- `beforeTimestamp` 쿼리 파라미터로 서버 사이드 페이지네이션
- 가장 오래된 메시지의 `rawTimestamp`를 기준으로 이전 메시지 로드
- 서버 응답이 20개 미만이면 `hasMoreMessages = false`로 설정

**고민했던 점**:

- 클라이언트 사이드 가상 스크롤 vs 서버 사이드 페이지네이션
- 선택: 서버 사이드 페이지네이션 (백엔드 API 제약, 메모리 효율성)

### 5. 타임스탬프 파싱 및 로케일 처리

**문제**: 백엔드가 한국 시간(KST)을 ISO 형식으로 보내되 끝에 `Z`만 붙여서 전송 (실제 UTC 아님). 예: `2026-01-26T20:38:33Z` (실제로는 KST 20:38).

**해결**:

- ISO 문자열에서 `Z` 제거 후 로컬 시간대로 파싱
- Epoch 밀리초/초 숫자 형식도 지원
- 브라우저 `navigator.language`를 사용한 로케일 기반 포맷팅

```typescript
// src/composables/useApi.ts
function formatTimestamp(timestamp: string | number | null | undefined): string {
  // Z 제거 후 로컬 시간대로 파싱
  const isoWithZ = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?(\.\d+)?Z$/i.test(raw)
  if (isoWithZ) {
    date = new Date(raw.slice(0, -1)) // Z 제거
  }
  return date.toLocaleDateString(locale, {...})
}
```

## 아키텍처 설명

### 전체 흐름

```
사용자 입력
  ↓
ChatPage.vue (페이지 컴포넌트)
  ↓
useChatState (상태 관리 composable)
  ↓
useApi (API 호출 composable)
  ↓
SSE 스트림 수신 → chatCompletionParser (JSON 파싱)
  ↓
스트리밍 데이터 → useChatState (메시지 업데이트)
  ↓
Vue 반응성 → ChatMessageList.vue (UI 렌더링)
```

### 레이어 구조

1. **Pages Layer** (`src/pages/`)
    - 라우트 레벨 컴포넌트
    - 최소한의 로직, 주로 레이아웃 구성

2. **Components Layer** (`src/components/`)
    - UI 컴포넌트: `ui/` (버튼, 카드 등 재사용 컴포넌트)
    - 도메인 컴포넌트: `chat/`, `dashboard/` (비즈니스 로직 포함)
    - 컴포넌트는 300줄 이하로 제한

3. **Composables Layer** (`src/composables/`)
    - `useApi`: HTTP 요청 및 SSE 스트리밍
    - `useChatState`: 채팅 상태 관리 (메시지, 스레드, 페이지네이션)
    - `useApiError`: 에러 토스트 관리
    - 비즈니스 로직의 핵심

4. **Lib Layer** (`src/lib/`)
    - 순수 함수 유틸리티
    - `chatCompletionParser`: JSON 파싱 로직

5. **Types Layer** (`src/types/`)
    - TypeScript 타입 정의
    - 백엔드 DTO와 프론트엔드 모델 매핑

### 아키텍처 선택 이유

**왜 Composables 패턴인가?**

- Vue 3 Composition API의 표준 패턴
- Pinia 같은 전역 상태 관리 없이도 충분 (로컬 상태 우선 원칙)
- 컴포넌트와 로직의 명확한 분리

**왜 컴포넌트를 세분화했는가?**

- Single Responsibility Principle 준수
- 테스트 용이성
- 재사용성 향상

**왜 Tailwind CSS만 사용하는가?**

- 유틸리티 퍼스트로 일관된 디자인 시스템
- `<style>` 블록 최소화로 번들 크기 감소
- 반응형 디자인을 breakpoint로 일원화

## 문제 해결 사례

### 사례 1: SSE 스트림에서 불완전한 JSON 파싱 오류

**문제**:

- 백엔드에서 `{"id":"1","content":"안녕"}{"id":"2","content":"하세요"}`처럼 연속된 JSON이 한 청크에 도착
- 또는 `{"id":"1","content":"안녕하세`처럼 JSON이 중간에 끊김
- `JSON.parse()`를 바로 호출하면 파싱 에러 발생

**원인 분석**:

- SSE는 텍스트 스트림이므로 JSON 경계가 명확하지 않음
- 네트워크 버퍼링으로 인해 청크 크기가 일정하지 않음

**해결 방법**:

1. 버퍼에 청크를 누적
2. 중괄호 카운팅으로 완전한 JSON 객체만 추출
3. 문자열 내부의 중괄호는 이스케이프(`\`) 처리로 구분
4. 불완전한 JSON은 버퍼에 보관하여 다음 청크와 결합

**결과**:

- 파싱 에러 없이 안정적으로 스트리밍 데이터 처리
- 메시지 손실 없음

### 사례 2: Vue 반응성 업데이트 타이밍 문제

**문제**:

- 스트리밍 완료 시 `isStreaming: false`로 변경해도 UI의 로딩 인디케이터가 사라지지 않음
- `messages.value[index].isStreaming = false`로 직접 수정해도 반응성 동작 안 함

**원인 분석**:

- Vue 3의 반응성 시스템은 객체/배열의 참조 변경을 감지
- 중첩된 속성 변경은 `nextTick()` 없이는 즉시 반영되지 않을 수 있음
- 배열 인덱스 직접 수정은 반응성 트리거 안 됨

**해결 방법**:

1. 배열을 새로 생성 (`[...messages.value]`)
2. 메시지 객체도 새로 생성 (`{ ...currentMessage, isStreaming: false }`)
3. `nextTick()`으로 Vue 업데이트 사이클 보장
4. 스트리밍 완료 콜백에서 2번의 `nextTick()` 사용

**결과**:

- UI가 즉시 업데이트되어 로딩 인디케이터가 정확히 사라짐
- 사용자 경험 개선

### 사례 3: 백엔드 타임스탬프 형식 불일치

**문제**:

- 백엔드가 한국 시간(KST)을 ISO 형식으로 보내되 끝에 `Z`만 붙임
- 예: `2026-01-26T20:38:33Z` (실제로는 KST 20:38, UTC가 아님)
- `new Date()`로 파싱하면 UTC로 해석되어 시간이 9시간 앞당겨짐

**원인 분석**:

- 백엔드에서 `Instant`를 직렬화할 때 타임존 정보 손실
- ISO 8601 표준에서는 `Z`가 UTC를 의미하지만, 실제 데이터는 KST

**해결 방법**:

1. ISO 문자열에서 `Z` 제거 후 파싱
2. Epoch 밀리초/초 숫자 형식도 지원
3. 브라우저 로케일(`navigator.language`)로 포맷팅

**결과**:

- 정확한 시간 표시 (한국 시간 기준)
- 다양한 타임스탬프 형식 지원

## 확장/개선 가능성

### 현재 한계

1. **에러 복구 메커니즘 부재**
    - 네트워크 끊김 시 자동 재연결 없음
    - 스트리밍 중단 시 부분 응답 복구 불가

2. **성능 최적화 미흡**
    - 메시지가 많아질수록 렌더링 성능 저하 가능
    - 가상 스크롤 미적용 (현재는 전체 메시지 렌더링)

3. **테스트 코드 없음**
    - 단위 테스트, 통합 테스트 미구현
    - JSON 파싱 로직 등 핵심 로직 테스트 필요

4. **접근성(A11y) 미고려**
    - 키보드 네비게이션, 스크린 리더 지원 부족

### 실무 기준으로 추가하고 싶은 것

1. **에러 처리 강화**
    - SSE 재연결 로직 (exponential backoff)
    - 부분 실패 시 재시도 메커니즘
    - 오프라인 상태 감지 및 큐잉

2. **성능 최적화**
    - 가상 스크롤 도입 (vue-virtual-scroller 등)
    - 메시지 메모이제이션
    - 이미지/파일 레이지 로딩

3. **테스트 코드 작성**
    - Vitest로 composable 단위 테스트
    - JSON 파싱 로직 엣지 케이스 테스트
    - E2E 테스트 (Playwright 등)

4. **모니터링 및 로깅**
    - 에러 추적 (Sentry 등)
    - 성능 메트릭 수집
    - 사용자 행동 분석

5. **보안 강화**
    - XSS 방지 (마크다운 렌더링 시 sanitization)
    - 파일 업로드 크기/타입 제한
    - Rate limiting (프론트엔드 레벨)

6. **다국어 지원**
    - i18n 라이브러리 도입
    - 날짜/시간 포맷 로케일화

7. **PWA 기능**
    - 오프라인 지원
    - 푸시 알림
    - 설치 가능한 웹 앱