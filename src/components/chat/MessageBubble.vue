<script setup lang="ts">
import { Bot, User } from "lucide-vue-next"
import type { ChatMessage, ChatRole } from "@/types/chat"
import AttachmentList from "./AttachmentList.vue"

defineProps<{
  message: ChatMessage
}>()

const isUserRole = (role: ChatRole) => role === "user"
const getRoleLabel = (role: ChatRole) => (isUserRole(role) ? "나" : "KadeAI")
</script>

<template>
  <div class="flex flex-col gap-2 px-4">
    <div class="flex" :class="isUserRole(message.role) ? 'justify-end' : 'justify-start'">
      <div
        class="max-w-xl px-4 py-3 text-sm leading-6 rounded-2xl shadow-sm"
        :class="isUserRole(message.role) ? 'bg-foreground text-background' : 'bg-muted text-foreground'"
      >
        <!-- 첨부파일 표시 -->
        <AttachmentList
          v-if="message.attachments && message.attachments.length > 0"
          :attachments="message.attachments"
        />

        <p class="whitespace-pre-line">{{ message.content }}</p>
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
</template>