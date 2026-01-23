<script setup lang="ts">
import { nextTick, watch, ref } from "vue"
import { Skeleton } from "@/components/ui/skeleton"
import type { ChatMessage } from "@/types/chat"
import MessageBubble from "./MessageBubble.vue"

const props = defineProps<{
  messages: ChatMessage[]
  isSidebarOpen: boolean
  isLoading?: boolean
}>()

// 자동 스크롤을 위한 ref
const messageContainer = ref<HTMLDivElement>()

// 메시지가 변경될 때마다 스크롤을 맨 아래로 이동
watch(() => props.messages, async () => {
  await nextTick()
  if (messageContainer.value) {
    messageContainer.value.scrollTop = messageContainer.value.scrollHeight
  }
}, { deep: true })
</script>

<template>
  <div ref="messageContainer" class="flex-1 overflow-y-auto">
    <div :class="[
      'flex flex-col w-full gap-6 mx-auto',
      props.isSidebarOpen
        ? 'transition-all duration-150 ease-out max-w-2xl pt-6 pb-8'
        : 'transition-all duration-250 ease-out delay-75 max-w-3xl pt-6 pb-8'
    ]">
      <!-- 로딩 중일 때 스켈레톤 표시 -->
      <div v-if="props.isLoading" class="space-y-4">
        <div v-for="i in 3" :key="i" class="flex flex-col gap-2">
          <div :class="i % 2 === 0 ? 'justify-end' : 'justify-start'">
            <div class="max-w-xl px-4 py-3 rounded-2xl shadow-sm bg-muted">
              <Skeleton class="h-4 w-full mb-2" />
              <Skeleton class="h-4 w-3/4" />
            </div>
          </div>
        </div>
      </div>

      <!-- 메시지가 없을 때 -->
      <div v-else-if="props.messages.length === 0" class="py-16 text-sm text-center text-muted-foreground">
        아직 대화가 없어요. 메시지를 입력해 시작하세요.
      </div>

      <!-- 실제 메시지들 -->
      <div v-else>
        <transition-group name="message" tag="div" class="space-y-3">
          <MessageBubble
            v-for="message in props.messages"
            :key="message.id"
            :message="message"
          />
        </transition-group>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 메시지 애니메이션 */
.message-enter-active,
.message-leave-active {
  transition: all 0.6s cubic-bezier(0.4, 0, 0.2, 1);
}

.message-enter-from {
  opacity: 0;
  transform: translateY(30px) scale(0.95);
}

.message-leave-to {
  opacity: 0;
  transform: translateY(-30px) scale(0.95);
}

.message-move {
  transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);
}

/* 스켈레톤 애니메이션 강화 */
.message-enter-active .skeleton-loading {
  animation: pulse 1.5s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.6;
  }
}
</style>
