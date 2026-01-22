<script setup lang="ts">
import { MessageSquare, Plus, Search, Settings, User } from "lucide-vue-next"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { ChatThread } from "@/types/chat"

defineProps<{
  threads: ChatThread[]
  isOpen: boolean
}>()

defineEmits<{
  (e: "new-chat"): void
}>()
</script>

<template>
  <transition
    enter-active-class="transition-transform duration-300 ease-out"
    leave-active-class="transition-transform duration-300 ease-in"
    enter-from-class="transform -translate-x-full"
    enter-to-class="transform translate-x-0"
    leave-from-class="transform translate-x-0"
    leave-to-class="transform -translate-x-full"
  >
    <div v-if="isOpen" class="w-64 bg-sidebar border-r flex flex-col h-full">
      <div class="gap-3 p-4 border-b">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2 text-sm font-semibold tracking-tight">
            <span>Kade AI</span>
          </div>
          <Button variant="ghost" size="icon" class="h-8 w-8" @click="$emit('new-chat')">
            <Plus class="h-4 w-4" />
            <span class="sr-only">새 대화</span>
          </Button>
        </div>
        <div class="relative">
          <Search class="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input class="h-9 pl-8" placeholder="대화 검색" />
        </div>
      </div>
      <div class="flex-1 overflow-y-auto p-4">
        <div class="space-y-2">
          <h3 class="text-xs font-medium text-sidebar-foreground/70 uppercase tracking-wide">최근 대화</h3>
          <div class="space-y-1">
            <button
              v-for="thread in threads"
              :key="thread.id"
              class="w-full flex items-center gap-2 px-2 py-2 text-sm rounded-md hover:bg-sidebar-accent text-left"
              :class="thread.active ? 'bg-sidebar-accent text-sidebar-accent-foreground' : 'text-sidebar-foreground'"
            >
              <MessageSquare class="h-4 w-4" />
              <span class="truncate">{{ thread.title }}</span>
            </button>
          </div>
        </div>
      </div>
      <div class="p-4 border-t">
        <div
          class="flex items-center gap-2 px-3 py-2 text-xs bg-sidebar-accent/50 border border-sidebar-border rounded-md"
        >
          <User class="h-4 w-4" />
          <div class="flex flex-col">
            <span class="font-medium">kade</span>
            <span class="text-xs text-sidebar-foreground/70">Free Plan</span>
          </div>
          <Button variant="ghost" size="icon" class="ml-auto h-7 w-7">
            <Settings class="h-4 w-4" />
            <span class="sr-only">설정</span>
          </Button>
        </div>
      </div>
    </div>
  </transition>
</template>
