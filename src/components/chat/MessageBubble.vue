<script setup lang="ts">
import { computed } from "vue";
import MarkdownIt from "markdown-it";
import { Bot as BotIcon, RotateCw, User as UserIcon } from "lucide-vue-next";
import type { ChatMessage, ChatRole } from "@/types/chat";
import AttachmentList from "./AttachmentList.vue";

const props = defineProps<{
  message: ChatMessage;
}>();

const emit = defineEmits<{
  retry: [message: ChatMessage];
}>();

const isUserRole = (role: ChatRole) => role === "user";
const isFailed = computed(
  () => isUserRole(props.message.role) && props.message.status === "failed",
);
const getRoleLabel = (role: ChatRole) => (isUserRole(role) ? "나" : "KadeAI");

// markdown-it 인스턴스 생성 (한 번만 생성)
// html: false로 설정하여 XSS 공격 방지 (보안)
const md = new MarkdownIt({
  html: false, // HTML 태그 비활성화 (보안)
  breaks: false, // breaks를 false로 설정하여 리스트 파싱 개선
  linkify: true, // URL을 자동으로 링크로 변환
  typographer: true, // 일부 typography 개선 (따옴표 등)
});

/**
 * 마크다운 렌더링 전 텍스트 전처리
 * 리스트 항목 앞에 빈 줄을 추가하여 마크다운-it이 제대로 인식하도록 함
 */
function preprocessMarkdown(text: string): string {
  if (!text) return "";

  // 먼저 리스트 항목 패턴을 찾아서 줄바꿈 추가 (한 줄로 연결된 경우 대비)
  // 예: "1. 항목1 2. 항목2" -> "1. 항목1\n2. 항목2"
  let processed = text;

  // 숫자 리스트 항목 패턴: "숫자. " (예: "1. ", "2. ", "10. ")
  // 이전에 리스트 항목이 아닌 문자 뒤에 오는 경우 줄바꿈 추가
  processed = processed.replace(/([^\n])(\d+\.\s+)/g, "$1\n$2");

  // 불릿 리스트 항목 패턴: "- ", "* ", "+ " (단, 이미 줄 시작에 있는 경우 제외)
  processed = processed.replace(/([^\n])([-*+]\s+)/g, "$1\n$2");

  // 줄 단위로 분리하여 처리
  const lines = processed.split("\n");
  const processedLines: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line === undefined) continue;

    const prevLine: string = i > 0 ? (lines[i - 1] ?? "") : "";
    const trimmedLine = line.trim();

    // 리스트 항목 패턴: 숫자. 또는 -, *, + 로 시작하는 줄
    // 예: "1. ", "2. ", "- ", "* ", "+ "
    const isListItem = /^(\d+\.\s+|[-*+]\s+)/.test(trimmedLine);
    const prevIsListItem =
      i > 0 && prevLine ? /^(\d+\.\s+|[-*+]\s+)/.test(prevLine.trim()) : false;
    const prevIsEmpty = prevLine ? prevLine.trim() === "" : true;

    // 리스트 항목이 이전 줄이 비어있지 않고 리스트가 아닌 경우, 빈 줄 추가
    if (isListItem && !prevIsEmpty && !prevIsListItem && i > 0) {
      processedLines.push("");
    }

    processedLines.push(line);
  }

  return processedLines.join("\n");
}

// Assistant 메시지가 로딩 중인지 확인 (content가 비어있을 때)
const isLoading = computed(() => {
  return !isUserRole(props.message.role) && !props.message.content;
});

// Assistant 메시지는 마크다운으로 렌더링, 사용자 메시지는 일반 텍스트
const renderedContent = computed(() => {
  if (isUserRole(props.message.role)) {
    return props.message.content;
  }

  // Assistant 메시지: 마크다운 렌더링
  try {
    const content = props.message.content || "";
    // 마크다운 전처리 후 렌더링
    const preprocessedContent = preprocessMarkdown(content);
    return md.render(preprocessedContent);
  } catch (error) {
    console.error("마크다운 파싱 오류:", error);
    return props.message.content;
  }
});
</script>

<template>
  <div class="flex flex-col gap-2 px-4">
    <div
      class="flex"
      :class="isUserRole(message.role) ? 'justify-end' : 'justify-start'"
    >
      <div
        class="max-w-xl px-4 py-3 text-sm leading-6 rounded-2xl shadow-sm"
        :class="[
          isUserRole(message.role)
            ? 'bg-neutral-400 text-background'
            : 'bg-muted text-foreground',
        ]"
      >
        <!-- 첨부파일 표시 -->
        <AttachmentList
          v-if="message.attachments && message.attachments.length > 0"
          :attachments="message.attachments"
        />

        <!-- 사용자 메시지: 일반 텍스트 -->
        <p v-if="isUserRole(message.role)" class="whitespace-pre-line">
          {{ message.content }}
        </p>

        <!-- Assistant 메시지: 로딩 애니메이션 또는 마크다운 렌더링 -->
        <div v-else-if="isLoading" class="flex items-center gap-1 py-1">
          <span class="loading-dot" />
          <span class="loading-dot" />
          <span class="loading-dot" />
        </div>
        <div v-else class="markdown-content" v-html="renderedContent" />
      </div>
    </div>
    <div
      class="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground"
      :class="isUserRole(message.role) ? 'justify-end' : 'justify-start'"
    >
      <component
        :is="isUserRole(message.role) ? UserIcon : BotIcon"
        class="h-3.5 w-3.5 shrink-0"
      />
      <span>{{ getRoleLabel(message.role) }}</span>
      <span>•</span>
      <span>{{ message.time }}</span>
      <template v-if="isFailed">
        <span>·</span>
        <span class="text-red-500">전송 실패</span>
        <button
          type="button"
          class="rounded p-0.5 text-red-500 hover:bg-slate-200"
          aria-label="다시 시도"
          @click="emit('retry', message)"
        >
          <RotateCw class="h-3.5 w-3.5" />
        </button>
      </template>
    </div>
  </div>
</template>

<style scoped>
.markdown-content {
  font-size: 0.875rem;
  line-height: 1.5rem;
}

.markdown-content :deep(p) {
  margin-bottom: 0.5rem;
}

.markdown-content :deep(p:last-child) {
  margin-bottom: 0;
}

.markdown-content :deep(h1),
.markdown-content :deep(h2),
.markdown-content :deep(h3),
.markdown-content :deep(h4),
.markdown-content :deep(h5),
.markdown-content :deep(h6) {
  font-weight: 600;
  margin-top: 1rem;
  margin-bottom: 0.5rem;
}

.markdown-content :deep(h1:first-child),
.markdown-content :deep(h2:first-child),
.markdown-content :deep(h3:first-child),
.markdown-content :deep(h4:first-child),
.markdown-content :deep(h5:first-child),
.markdown-content :deep(h6:first-child) {
  margin-top: 0;
}

.markdown-content :deep(h1) {
  font-size: 1.25rem;
}

.markdown-content :deep(h2) {
  font-size: 1.125rem;
}

.markdown-content :deep(h3) {
  font-size: 1rem;
}

.markdown-content :deep(ul),
.markdown-content :deep(ol) {
  margin-top: 0.5rem;
  margin-bottom: 0.5rem;
  margin-left: 1rem;
}

.markdown-content :deep(ul) {
  list-style-type: disc;
}

.markdown-content :deep(ol) {
  list-style-type: decimal;
}

.markdown-content :deep(li) {
  margin-top: 0.25rem;
  margin-bottom: 0.25rem;
}

.markdown-content :deep(blockquote) {
  border-left: 4px solid hsl(var(--muted-foreground) / 0.3);
  padding-left: 1rem;
  margin-top: 0.5rem;
  margin-bottom: 0.5rem;
  font-style: italic;
}

.markdown-content :deep(code) {
  background-color: hsl(var(--muted));
  padding: 0.125rem 0.375rem;
  border-radius: 0.25rem;
  font-size: 0.75rem;
  font-family:
    ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono",
    monospace;
}

.markdown-content :deep(pre) {
  background-color: hsl(var(--muted));
  padding: 0.75rem;
  border-radius: 0.5rem;
  overflow-x: auto;
  margin-top: 0.5rem;
  margin-bottom: 0.5rem;
}

.markdown-content :deep(pre code) {
  background-color: transparent;
  padding: 0;
}

.markdown-content :deep(a) {
  color: hsl(var(--primary));
  text-decoration: underline;
}

.markdown-content :deep(a:hover) {
  color: hsl(var(--primary) / 0.8);
}

.markdown-content :deep(strong) {
  font-weight: 600;
}

.markdown-content :deep(em) {
  font-style: italic;
}

.markdown-content :deep(hr) {
  margin-top: 1rem;
  margin-bottom: 1rem;
  border-top: 1px solid hsl(var(--border));
  border-bottom: none;
  border-left: none;
  border-right: none;
}

.markdown-content :deep(table) {
  width: 100%;
  border-collapse: collapse;
  margin-top: 0.5rem;
  margin-bottom: 0.5rem;
}

.markdown-content :deep(th),
.markdown-content :deep(td) {
  border: 1px solid hsl(var(--border));
  padding: 0.25rem 0.5rem;
}

.markdown-content :deep(th) {
  background-color: hsl(var(--muted));
  font-weight: 600;
}

/* 다크 모드 스타일 */
.dark .markdown-content :deep(blockquote) {
  border-color: hsl(var(--muted-foreground) / 0.3);
}

/* 로딩 애니메이션 - 회색조로 부드러운 느낌 */
.loading-dot {
  width: 0.375rem;
  height: 0.375rem;
  border-radius: 50%;
  background-color: var(--muted-foreground);
  animation: loading-bounce 1.4s ease-in-out infinite;
}

.loading-dot:nth-child(1) {
  animation-delay: 0s;
}

.loading-dot:nth-child(2) {
  animation-delay: 0.2s;
}

.loading-dot:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes loading-bounce {
  0%,
  80%,
  100% {
    transform: scale(0.8);
    opacity: 0.5;
  }
  40% {
    transform: scale(1);
    opacity: 1;
  }
}
</style>
