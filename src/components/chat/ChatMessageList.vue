<script setup lang="ts">
import { Bot, User } from "lucide-vue-next"
import type { ChatMessage, ChatRole } from "@/types/chat"

const props = defineProps<{
  messages: ChatMessage[]
}>()

const isUserRole = (role: ChatRole) => role === "user"
const getRoleLabel = (role: ChatRole) => (isUserRole(role) ? "나" : "ChatGPT")
</script>

<template>
  <div class="flex-1 overflow-y-auto">
    <div class="flex flex-col gap-6 w-full max-w-3xl mx-auto px-4 py-6">
      <div v-if="props.messages.length === 0" class="py-16 text-sm text-center text-muted-foreground">
        아직 대화가 없어요. 메시지를 입력해 시작하세요.
      </div>
      <div v-else>
        <div v-for="message in props.messages" :key="message.id" class="flex flex-col gap-2">
          <div class="flex" :class="isUserRole(message.role) ? 'justify-end' : 'justify-start'">
            <div
              class="max-w-xl px-4 py-3 text-sm leading-6 shadow-sm rounded-2xl"
              :class="isUserRole(message.role) ? 'bg-foreground text-background' : 'bg-muted text-foreground'"
            >
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
      </div>
    </div>
  </div>
</template>
