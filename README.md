# AI Assistant Web

> Vue 3 + TypeScript 기반의 실시간 스트리밍 AI 채팅 웹 애플리케이션

![Vue](https://img.shields.io/badge/Vue-3.5-4FC08D?logo=vue.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-7.2-646CFF?logo=vite&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.1-06B6D4?logo=tailwindcss&logoColor=white)

<!-- 
📸 스크린샷 추가 예정
![메인 화면](./docs/images/main-screenshot.png)
-->

---

## 목차

- [프로젝트 소개](#프로젝트-소개)
- [주요 기능](#주요-기능)
- [기술 스택](#기술-스택)
- [시스템 아키텍처](#시스템-아키텍처)
- [핵심 구현 포인트](#핵심-구현-포인트)
- [문제 해결 사례](#문제-해결-사례)
- [배운 점 & 성장 포인트](#배운-점--성장-포인트)
- [실행 방법](#실행-방법)
- [향후 개선 계획](#향후-개선-계획)

---

## 프로젝트 소개

### 개발 배경

백엔드 개발자로서 **풀스택 경험**을 쌓고 싶어 시작한 프로젝트입니다. 직접 개발한 Spring Boot 기반 AI 어시스턴트 API와 연동하여, 사용자 친화적인 채팅 인터페이스를 제공합니다.

Vue.js 기본 지식을 바탕으로, 실제 서비스 수준의 프로젝트를 구현하며 프론트엔드 역량을 강화하고자 했습니다. 공식 문서와 best practice를 참고하여 구조를 설계했습니다.

### 해결하려는 문제

| 문제 | 해결 방안 |
|------|----------|
| 기존 REST API의 긴 응답 대기 시간 | SSE(Server-Sent Events) 스트리밍으로 실시간 응답 |
| 스트리밍 데이터의 복잡한 파싱 | 상태 머신 기반 JSON 파싱 로직 구현 |
| 대화 히스토리 관리 | 무한 스크롤 페이지네이션 |
| 백엔드와 프론트엔드 간 데이터 포맷 불일치 | 유연한 타임스탬프 파싱 및 변환 로직 |

---

## 주요 기능

### 채팅 기능
- **실시간 스트리밍 응답**: AI 응답을 실시간으로 화면에 표시
- **대화 관리**: 대화방 생성, 제목 변경, 삭제
- **무한 스크롤**: 과거 대화 히스토리 페이지네이션
- **파일 첨부**: 채팅 시 파일 업로드 지원
- **마크다운 렌더링**: AI 응답의 마크다운 포맷 지원

### UI/UX
- **반응형 디자인**: 모바일, 태블릿, 데스크톱 지원
- **다크/라이트 테마**: 시스템 설정 연동 및 수동 전환
- **개인 맞춤 설정**: 닉네임, 직업 등 사용자 정보 관리

### 대시보드
- **사용량 통계**: 차트를 통한 사용량 시각화
- **시스템 상태**: 서비스 상태 모니터링

<!-- 
📸 기능별 스크린샷 추가 예정
| 채팅 화면 | 대시보드 | 모바일 뷰 |
|:---:|:---:|:---:|
| ![채팅](./docs/images/chat.png) | ![대시보드](./docs/images/dashboard.png) | ![모바일](./docs/images/mobile.png) |
-->

---

## 기술 스택

### Frontend

| 구분 | 기술 | 선택 이유 |
|------|------|----------|
| 프레임워크 | Vue 3 (Composition API) | 러닝커브가 낮고, 공식 문서가 잘 정리되어 있음 |
| 언어 | TypeScript 5.9 | 타입 안정성 확보, 백엔드 DTO와 일관성 유지 |
| 빌드 도구 | Vite 7.2 | 빠른 HMR, 개발 생산성 향상 |
| 스타일링 | Tailwind CSS 4.1 | 유틸리티 퍼스트로 빠른 UI 구현 |
| UI 컴포넌트 | Reka UI (shadcn-vue) | 접근성을 고려한 headless 컴포넌트 |
| 마크다운 | markdown-it | AI 응답 마크다운 렌더링 |
| 차트 | @unovis/vue | 대시보드 데이터 시각화 |

### Backend (별도 저장소)

| 구분 | 기술 |
|------|------|
| 프레임워크 | Spring Boot 3.x |
| AI 연동 | OpenAI API (GPT-4) |
| 스트리밍 | SSE (Server-Sent Events) |
| 데이터베이스 | PostgreSQL |

---

## 시스템 아키텍처

<!--
📐 아키텍처 다이어그램 추가 예정
![시스템 아키텍처](./docs/images/architecture.png)
-->

### 전체 데이터 흐름

```
┌─────────────────────────────────────────────────────────────────┐
│                         Frontend (Vue 3)                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│   ChatPage.vue ──→ useChatState ──→ useApi ──→ SSE Stream       │
│        │                │              │            │            │
│        │                │              │            ↓            │
│        │                │              │    chatCompletionParser │
│        │                │              │            │            │
│        ↓                ↓              ↓            ↓            │
│   UI 렌더링 ←── 상태 업데이트 ←── API 응답 ←── JSON 파싱        │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ HTTP / SSE
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                    Backend (Spring Boot)                         │
├─────────────────────────────────────────────────────────────────┤
│   REST API Controller ──→ AI Service ──→ OpenAI API             │
│                                │                                  │
│                                ↓                                  │
│                        SSE 스트리밍 응답                          │
└─────────────────────────────────────────────────────────────────┘
```

### 프론트엔드 레이어 구조

```
src/
├── pages/              # 페이지 컴포넌트 (라우트 레벨)
│   ├── ChatPage.vue
│   ├── LoginPage.vue
│   └── PricingPage.vue
│
├── components/         # UI 컴포넌트
│   ├── chat/          # 채팅 관련 컴포넌트
│   ├── dashboard/     # 대시보드 컴포넌트
│   └── ui/            # 공통 UI 컴포넌트 (버튼, 카드 등)
│
├── composables/        # 비즈니스 로직 (관심사 분리)
│   ├── useApi.ts      # API 호출 및 SSE 스트리밍
│   ├── useChatState.ts # 채팅 상태 관리
│   └── useApiError.ts # 에러 처리
│
├── lib/                # 유틸리티 함수
│   └── chatCompletionParser.ts  # JSON 파싱 로직
│
└── types/              # TypeScript 타입 정의
    └── chat.ts        # 채팅 관련 타입 (백엔드 DTO 매핑)
```

**설계 원칙**
- 컴포넌트는 UI 렌더링에 집중, 비즈니스 로직은 composables로 분리
- API 호출은 컴포넌트에서 직접 하지 않고 useApi를 통해 처리
- 타입 정의는 백엔드 DTO와 일관성 유지

---

## 핵심 구현 포인트

### 1. SSE 스트리밍 및 JSON 파싱

백엔드에서 SSE로 전송되는 AI 응답을 실시간으로 파싱하여 화면에 표시합니다.

**구현 포인트**
- 청크 단위로 도착하는 스트림 데이터를 버퍼에 누적
- 중괄호 카운팅으로 완전한 JSON 객체만 추출
- 문자열 내부의 중괄호는 이스케이프 처리로 구분
- 불완전한 JSON은 버퍼에 보관하여 다음 청크와 결합

```typescript
// src/lib/chatCompletionParser.ts
export function extractCompleteJsonFromBuffer(buffer: string): {
  contents: string[]
  remainingBuffer: string
} {
  // 중괄호 카운팅과 이스케이프 처리로 완전한 JSON 추출
  // 불완전한 JSON은 버퍼에 보관
}
```

**선택 이유**: 단순 `JSON.parse()` 사용 시 불완전한 JSON에서 에러가 발생하므로, 상태 머신 방식으로 안정성 확보

### 2. API 연동 패턴

백엔드와의 통신을 담당하는 `useApi` composable을 통해 모든 API 호출을 일원화했습니다.

**구현 포인트**
- REST API (GET, POST, PATCH, DELETE) 지원
- SSE 스트리밍 연결 및 이벤트 처리
- 파일 업로드 (multipart/form-data)
- 통합 에러 처리 및 토스트 알림

```typescript
// src/composables/useApi.ts
const sendChatMessage = async (
  request: AssistantRequest,
  onMessage: (data: string) => void,  // 스트림 데이터 콜백
  onError?: (error: Error) => void,   // 에러 콜백
  onComplete?: () => void,            // 완료 콜백
  file?: File                         // 첨부 파일
): Promise<void> => {
  // SSE 연결 및 스트리밍 처리
}
```

### 3. 상태 관리 (관심사 분리)

채팅 상태 관리를 `useChatState` composable로 분리하여 컴포넌트의 역할을 명확히 했습니다.

| 관심사 | 담당 | 설명 |
|-------|------|------|
| UI 렌더링 | ChatPage.vue | 화면 표시 및 사용자 입력 |
| 채팅 상태 | useChatState | 메시지, 스레드, 페이지네이션 |
| API 통신 | useApi | HTTP 요청, SSE 스트리밍 |
| 에러 처리 | useApiError | 토스트 알림 |

---

## 문제 해결 사례

### 사례 1: SSE 스트림에서 불완전한 JSON 파싱

**문제 상황**
- 백엔드에서 `{"id":"1","content":"안녕"}{"id":"2","content":"하세요"}`처럼 연속된 JSON이 도착
- 또는 `{"id":"1","content":"안녕하세`처럼 JSON이 중간에 끊김
- `JSON.parse()`를 바로 호출하면 파싱 에러 발생

**원인 분석**
- SSE는 텍스트 스트림이므로 JSON 경계가 명확하지 않음
- 네트워크 버퍼링으로 청크 크기가 일정하지 않음

**해결 방법**
1. 버퍼에 청크를 누적
2. 중괄호 카운팅으로 완전한 JSON 객체 경계 파악
3. 문자열 내부의 중괄호는 이스케이프(`\`) 처리로 구분
4. 불완전한 JSON은 버퍼에 보관 후 다음 청크와 결합

### 사례 2: 백엔드 타임스탬프 형식 불일치

**문제 상황**
- 백엔드가 한국 시간(KST)을 ISO 형식으로 보내되 끝에 `Z`만 붙임
- 예: `2026-01-26T20:38:33Z` (실제로는 KST, UTC 아님)
- `new Date()`로 파싱 시 UTC로 해석되어 9시간 차이 발생

**원인 분석**
- 백엔드에서 `Instant` 직렬화 시 타임존 정보 손실
- ISO 8601 표준에서 `Z`는 UTC를 의미하지만, 실제 데이터는 KST

**해결 방법**
1. ISO 문자열에서 `Z` 제거 후 로컬 시간대로 파싱
2. Epoch 밀리초/초 숫자 형식도 지원
3. 브라우저 로케일 기반 포맷팅

```typescript
// Z 제거 후 로컬 시간대로 파싱
if (isoWithZ) {
  date = new Date(raw.slice(0, -1)) // Z 제거
}
```

---

## 배운 점 & 성장 포인트

### 프론트엔드 개발 역량 강화

기본적인 Vue.js 지식을 바탕으로 실제 서비스를 구현하면서, 프론트엔드 개발에 대한 이해를 한층 깊게 할 수 있었습니다.

- **컴포넌트 기반 설계**: UI를 재사용 가능한 단위로 분리하는 패턴 적용
- **상태 관리 패턴**: 로컬 상태와 공유 상태의 분리 기준 학습
- **반응형 디자인**: Tailwind CSS breakpoint를 활용한 다양한 디바이스 대응
- **빌드 도구 이해**: Vite, TypeScript 설정 및 개발 환경 구성

### 풀스택 관점에서의 인사이트

백엔드 개발자로서 프론트엔드를 직접 구현하면서 얻은 인사이트:

| 관점 | 배운 점 |
|------|---------|
| API 설계 | 프론트엔드 입장에서 사용하기 편한 응답 형식의 중요성 |
| 에러 처리 | 사용자 친화적인 에러 메시지와 상태 코드 설계 |
| 타임존 처리 | 백엔드-프론트엔드 간 일관된 타임존 관리의 중요성 |
| 스트리밍 | SSE 이벤트 설계 시 프론트엔드 파싱 고려 필요 |

### 추가 학습 목표

- 테스트 코드 작성 (Vitest, Playwright)
- 상태 관리 라이브러리 (Pinia) 적용
- 성능 최적화 (가상 스크롤, 메모이제이션)
- 접근성(A11y) 개선

---

## 실행 방법

### 사전 요구사항

- Node.js 18+ 
- 백엔드 API 서버 실행 (localhost:8080)

### 개발 환경

```bash
# 의존성 설치
npm install

# 개발 서버 실행 (http://localhost:5173)
npm run dev
```

### 프로덕션 빌드

```bash
# TypeScript 타입 체크 + 빌드
npm run build

# 빌드 결과 미리보기
npm run preview
```

### 환경 변수 (선택)

```env
VITE_API_BASE_URL=http://localhost:8080  # API 서버 주소
VITE_USER_ID=user@example.com            # 개발용 사용자 ID
```

---

## 향후 개선 계획

### 기능 개선

- [ ] SSE 재연결 로직 (네트워크 끊김 대응)
- [ ] 오프라인 상태 감지 및 메시지 큐잉
- [ ] 이미지/파일 미리보기

### 성능 최적화

- [ ] 가상 스크롤 도입 (vue-virtual-scroller)
- [ ] 메시지 렌더링 최적화

### 품질 개선

- [ ] 단위 테스트 (Vitest)
- [ ] E2E 테스트 (Playwright)
- [ ] 접근성 개선 (키보드 네비게이션, 스크린 리더)

### 모니터링

- [ ] 에러 추적 (Sentry)
- [ ] 성능 메트릭 수집

---

## 프로젝트 정보

- **개발 기간**: 2026년 1월 ~
- **개발자**: 2년차 백엔드 개발자
- **저장소**: [GitHub](https://github.com/your-username/ai-assistant-web)

---

<!-- 
📝 추가 예정 섹션:
- 데모 영상/GIF
- API 연동 시퀀스 다이어그램
- 컴포넌트 구조도
-->
