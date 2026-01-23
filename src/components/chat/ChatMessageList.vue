<script setup lang="ts">
import { nextTick, watch, ref } from "vue"
import { Bot, User, Paperclip, FileText, FileSpreadsheet, Presentation } from "lucide-vue-next"
import type { ChatMessage, ChatRole } from "@/types/chat"

const props = defineProps<{
  messages: ChatMessage[]
  isSidebarOpen: boolean
}>()

const isUserRole = (role: ChatRole) => role === "user"
const getRoleLabel = (role: ChatRole) => (isUserRole(role) ? "나" : "ChatGPT")

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
      <div v-if="props.messages.length === 0" class="py-16 text-sm text-center text-muted-foreground">
        아직 대화가 없어요. 메시지를 입력해 시작하세요.
      </div>
      <div v-else>
        <div v-for="message in props.messages" :key="message.id" class="flex flex-col gap-2 mb-3">
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
      </div>
    </div>
  </div>
</template>
