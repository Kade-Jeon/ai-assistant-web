<script setup lang="ts">
import { nextTick, watch, ref } from "vue"
import { Bot, User, Paperclip, FileText, FileSpreadsheet, Presentation } from "lucide-vue-next"
import { Skeleton } from "@/components/ui/skeleton"
import type { ChatMessage, ChatRole } from "@/types/chat"

const props = defineProps<{
  messages: ChatMessage[]
  isSidebarOpen: boolean
  isLoading?: boolean
}>()

const isUserRole = (role: ChatRole) => role === "user"
const getRoleLabel = (role: ChatRole) => (isUserRole(role) ? "나" : "KadeAI")

// 자동 스크롤을 위한 ref
const messageContainer = ref<HTMLDivElement>()

// 메시지가 변경될 때마다 스크롤을 맨 아래로 이동
watch(() => props.messages, async () => {
  await nextTick()
  if (messageContainer.value) {
    messageContainer.value.scrollTop = messageContainer.value.scrollHeight
  }
}, { deep: true })

const getFileIcon = (fileName: string) => {
  const extension = fileName.split('.').pop()?.toLowerCase()
  switch (extension) {
    case 'doc':
    case 'docx':
    case 'hwp':
    case 'hwxp':
    case 'txt':
      return FileText
    case 'pdf':
      return FileText
    case 'ppt':
    case 'pptx':
      return Presentation
    case 'xlsx':
    case 'xls':
      return FileSpreadsheet
    default:
      return Paperclip
  }
}

const getFileColor = (fileName: string) => {
  const extension = fileName.split('.').pop()?.toLowerCase()
  switch (extension) {
    case 'doc':
    case 'docx':
      return 'text-blue-600'
    case 'hwp':
    case 'hwxp':
      return 'text-blue-300'
    case 'pdf':
      return 'text-red-500'
    case 'ppt':
    case 'pptx':
      return 'text-orange-500'
    case 'xlsx':
    case 'xls':
      return 'text-green-700'
    case 'txt':
      return 'text-slate-500'
    default:
      return 'text-muted-foreground'
  }
}
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
          <div v-for="message in props.messages" :key="message.id" class="flex flex-col gap-2 px-4">
          <div class="flex" :class="isUserRole(message.role) ? 'justify-end' : 'justify-start'">
            <div
              class="max-w-xl px-4 py-3 text-sm leading-6 rounded-2xl shadow-sm"
              :class="isUserRole(message.role) ? 'bg-foreground text-background' : 'bg-muted text-foreground'"
            >
              <p class="whitespace-pre-line">{{ message.content }}</p>
              <!-- 첨부파일 표시 -->
              <div v-if="message.attachments && message.attachments.length > 0" class="mt-3 space-y-2">
                <div
                  v-for="(file, index) in message.attachments"
                  :key="index"
                  class="flex items-center gap-3 p-3 border rounded-lg bg-card/50 hover:bg-card/80 transition-colors"
                  :class="isUserRole(message.role) ? 'border-border' : 'border-border/50'"
                >
                  <component
                    :is="getFileIcon(file.name)"
                    :class="['h-4 w-4 flex-shrink-0', getFileColor(file.name)]"
                  />
                  <div class="flex-1 min-w-0 space-y-1">
                    <p class="text-sm font-medium truncate leading-tight">{{ file.name }}</p>
                    <p class="text-xs text-muted-foreground">
                      {{ (file.size / 1024 / 1024).toFixed(1) }} MB
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div
            class="flex items-center gap-2 text-xs text-muted-foreground"
            :class="isUserRole(message.role) ? 'justify-end' : 'justify-start'"
          >
            <component :is="isUserRole(message.role) ? User : Bot" class="h-3.5 w-3.5" />
            <span>{{ getRoleLabel(message.role) }}</span>
            <span>•</span>
            <span>{{ message.time }}</span>
          </div>
          </div>
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
