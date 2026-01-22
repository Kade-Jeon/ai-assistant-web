<script setup lang="ts">
import { Bot, User, Paperclip } from "lucide-vue-next"
import type { ChatMessage, ChatRole } from "@/types/chat"

const props = defineProps<{
  messages: ChatMessage[]
  isSidebarOpen: boolean
}>()

const isUserRole = (role: ChatRole) => role === "user"
const getRoleLabel = (role: ChatRole) => (isUserRole(role) ? "나" : "ChatGPT")
</script>

<template>
  <div class="flex-1 overflow-y-auto">
    <div :class="[
      'flex flex-col w-full gap-6 mx-auto px-4 py-6',
      props.isSidebarOpen
        ? 'transition-all duration-150 ease-out max-w-2xl'
        : 'transition-all duration-250 ease-out delay-75 max-w-3xl'
    ]">
      <div v-if="props.messages.length === 0" class="py-16 text-sm text-center text-muted-foreground">
        아직 대화가 없어요. 메시지를 입력해 시작하세요.
      </div>
      <div v-else>
        <div v-for="message in props.messages" :key="message.id" class="flex flex-col gap-2">
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
                  class="flex items-center gap-2 p-2 bg-opacity-20 rounded-md"
                  :class="isUserRole(message.role) ? 'bg-background' : 'bg-foreground'"
                >
                  <Paperclip class="h-3 w-3 flex-shrink-0" />
                  <div class="flex-1 min-w-0">
                    <p class="text-xs font-medium truncate">{{ file.name }}</p>
                    <p class="text-xs opacity-70">{{ (file.size / 1024 / 1024).toFixed(1) }}MB</p>
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
