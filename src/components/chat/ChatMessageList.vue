<script setup lang="ts">
import { nextTick, watch, ref, onMounted, onUnmounted } from "vue";
import { Skeleton } from "@/components/ui/skeleton";
import type { ChatMessage } from "@/types/chat";
import MessageBubble from "./MessageBubble.vue";

const props = defineProps<{
  messages: ChatMessage[];
  isSidebarOpen: boolean;
  isLoading?: boolean;
  isLoadingMore?: boolean;
  hasMoreMessages?: boolean;
}>()

const emit = defineEmits<{
  retry: [message: ChatMessage];
  loadMore: [];
}>();

// 자동 스크롤을 위한 ref
const messageContainer = ref<HTMLDivElement>();
const previousScrollHeight = ref(0);
const isInitialLoad = ref(true);

// 스크롤 이벤트 핸들러 (throttle 적용)
let scrollTimeout: ReturnType<typeof setTimeout> | null = null;
const handleScroll = () => {
  if (scrollTimeout) return;
  
  scrollTimeout = setTimeout(() => {
    scrollTimeout = null;
    
    if (!messageContainer.value) return;
    
    const container = messageContainer.value;
    const scrollTop = container.scrollTop;
    
    // 스크롤이 맨 위에서 100px 이내일 때 이전 메시지 로드
    if (
      scrollTop < 100 &&
      props.hasMoreMessages &&
      !props.isLoadingMore &&
      !props.isLoading &&
      props.messages.length > 0
    ) {
      emit("loadMore");
    }
  }, 100);
};

// 메시지가 변경될 때마다 스크롤 처리
watch(
  () => props.messages,
  async (newMessages, oldMessages) => {
    await nextTick();
    if (!messageContainer.value) return;
    
    const container = messageContainer.value;
    const wasAtBottom = 
      container.scrollHeight - container.scrollTop - container.clientHeight < 50;
    
    // 이전 메시지를 로드한 경우 (메시지가 앞쪽에 추가됨)
    if (oldMessages && newMessages.length > oldMessages.length) {
      const addedCount = newMessages.length - oldMessages.length;
      const firstNewMessage = newMessages[0];
      const wasFirstInOld = oldMessages[0]?.id === firstNewMessage?.id;
      
      if (!wasFirstInOld && addedCount > 0) {
        // 스크롤 위치 유지 (새 메시지가 추가되어도 스크롤이 튀지 않도록)
        const newScrollHeight = container.scrollHeight;
        const heightDiff = newScrollHeight - previousScrollHeight.value;
        container.scrollTop = container.scrollTop + heightDiff;
        previousScrollHeight.value = newScrollHeight;
        return;
      }
    }
    
    // 초기 로드이거나 새 메시지가 추가된 경우 맨 아래로 스크롤
    if (isInitialLoad.value || wasAtBottom) {
      container.scrollTop = container.scrollHeight;
      isInitialLoad.value = false;
    }
    
    previousScrollHeight.value = container.scrollHeight;
  },
  { deep: true },
);

// 로딩 상태가 변경될 때 초기 로드 플래그 리셋
watch(
  () => props.isLoading,
  (isLoading) => {
    if (!isLoading && props.messages.length > 0) {
      isInitialLoad.value = false;
    }
  },
);

onMounted(() => {
  if (messageContainer.value) {
    messageContainer.value.addEventListener("scroll", handleScroll);
    previousScrollHeight.value = messageContainer.value.scrollHeight;
  }
});

onUnmounted(() => {
  if (messageContainer.value) {
    messageContainer.value.removeEventListener("scroll", handleScroll);
  }
  if (scrollTimeout) {
    clearTimeout(scrollTimeout);
  }
});
</script>

<template>
  <div ref="messageContainer" class="flex-1 overflow-y-auto">
    <div
      :class="[
        'flex min-h-full flex-col w-full gap-6 mx-auto',
        props.isSidebarOpen
          ? 'transition-all duration-150 ease-out max-w-2xl pt-6 pb-8'
          : 'transition-all duration-250 ease-out delay-75 max-w-3xl pt-6 pb-8',
      ]"
    >
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

      <!-- 메시지가 없을 때: 화면 정가운데 h1 스타일 -->
      <div
        v-else-if="props.messages.length === 0"
        class="flex flex-1 min-h-0 items-center justify-center"
      >
        <h2 class="text-2xl font-medium text-muted-foreground">
          무엇을 도와드릴까요?
        </h2>
      </div>

      <!-- 실제 메시지들 -->
      <div v-else>
        <!-- 이전 메시지 로딩 중 표시 -->
        <div
          v-if="props.isLoadingMore"
          class="flex justify-center py-4"
        >
          <div class="text-sm text-muted-foreground">이전 메시지를 불러오는 중...</div>
        </div>
        
        <transition-group name="message" tag="div" class="space-y-3">
          <MessageBubble
            v-for="message in props.messages"
            :key="message.id"
            :message="message"
            @retry="emit('retry', $event)"
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
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.6;
  }
}
</style>
