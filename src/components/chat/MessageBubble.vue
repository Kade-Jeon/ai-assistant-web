<script setup lang="ts">
import { computed, watch } from "vue";
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
 * 서버가 마크다운을 코드 블록으로 감싸서 보내는 경우, 코드 블록을 제거하고 내용만 추출
 */
function preprocessMarkdown(text: string): string {
  if (!text) return "";

  let processed = text.trim();

  // 서버가 마크다운을 코드 블록으로 감싸서 보내는 경우 처리
  // 예: ```markdown\n...\n``` -> 내용만 추출
  // 앞뒤 공백이나 다른 내용이 있어도 매칭되도록 수정
  const markdownCodeBlockRegex = /```markdown\s*\n([\s\S]*?)\n```/;
  const match = processed.match(markdownCodeBlockRegex);
  if (match && match[1]) {
    processed = match[1].trim();
  }

  return processed;
}

// Assistant 메시지가 로딩 중인지 확인 (content가 비어있을 때)
const isLoading = computed(() => {
  return !isUserRole(props.message.role) && !props.message.content;
});

// 스트리밍 중인지 확인 (명시적으로 computed로 만들어서 반응성 보장)
const isStreaming = computed(() => {
  return props.message.isStreaming === true;
});

// Assistant 메시지는 마크다운으로 렌더링, 사용자 메시지는 일반 텍스트
// 주의: 스트리밍 중인지 여부는 템플릿에서 처리하므로, 여기서는 항상 마크다운 파싱
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

// 디버깅: isStreaming 변경 감지
watch(
  () => props.message.isStreaming,
  (newVal, oldVal) => {
    console.log("[MessageBubble] isStreaming 변경 감지", {
      messageId: props.message.id,
      old: oldVal,
      new: newVal,
    });
  },
);
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

        <!-- Assistant 메시지: 로딩 애니메이션, 스트리밍 중 원문 표시, 또는 마크다운 렌더링 -->
        <div v-else-if="isLoading" class="flex items-center gap-1 py-1">
          <span class="loading-dot" />
          <span class="loading-dot" />
          <span class="loading-dot" />
        </div>
        <!-- 스트리밍 중에는 원문을 그대로 표시 (마크다운 파싱 안 함) -->
        <p v-else-if="isStreaming" class="whitespace-pre-line">{{ message.content }}</p>
        <!-- 스트리밍 완료 후 마크다운 렌더링 -->
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
