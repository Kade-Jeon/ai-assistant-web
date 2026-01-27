<script setup lang="ts">
import {
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuRoot,
  DropdownMenuTrigger,
} from "reka-ui"
import { MessageSquare, Ellipsis, Pencil, Trash2 } from "lucide-vue-next"
import type { ChatThread } from "@/types/chat"

defineProps<{
  threads: ChatThread[]
}>()

const emit = defineEmits<{
  (e: "select-thread"): [conversationId: string]
  (e: "rename"): [conversationId: string]
  (e: "delete"): [conversationId: string]
}>()
</script>

<template>
  <!-- 최근 대화 목록 -->
  <div class="flex-1 overflow-y-auto p-4">
    <div class="space-y-2">
      <h3 class="text-xs font-medium text-sidebar-foreground/70 uppercase tracking-wide">최근 대화</h3>
      <div class="space-y-1">
        <div
          v-for="thread in threads"
          :key="thread.id"
          class="group flex w-full items-center gap-2 rounded-md px-2 py-2 text-sm hover:bg-slate-200 dark:hover:bg-slate-700"
          :class="thread.active ? 'bg-sidebar-accent text-sidebar-accent-foreground' : 'text-sidebar-foreground'"
        >
          <button
            type="button"
            class="flex min-w-0 flex-1 items-center gap-2 text-left"
            @click="emit('select-thread', thread.conversationId)"
          >
            <MessageSquare class="h-4 w-4 shrink-0" />
            <span class="min-w-0 flex-1 truncate">{{ thread.title }}</span>
          </button>
          <DropdownMenuRoot>
            <DropdownMenuTrigger
              type="button"
              class="flex shrink-0 items-center justify-center rounded p-0.5 opacity-0 transition-opacity hover:bg-slate-200 dark:hover:bg-slate-700 focus:opacity-100 group-hover:opacity-100"
              aria-label="대화 메뉴"
            >
              <Ellipsis class="h-4 w-4" />
            </DropdownMenuTrigger>
            <DropdownMenuPortal>
              <DropdownMenuContent
                class="z-50 min-w-40 rounded-md border bg-popover p-1 text-popover-foreground shadow-md"
                side="right"
                align="end"
                :side-offset="4"
              >
                <DropdownMenuItem
                  class="flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-slate-200"
                  @select="emit('rename', thread.conversationId)"
                >
                  <Pencil class="h-4 w-4 shrink-0" />
                  <span>이름 바꾸기</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  class="flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-slate-200"
                  @select="emit('delete', thread.conversationId)"
                >
                  <Trash2 class="h-4 w-4 shrink-0" />
                  <span>삭제</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenuPortal>
          </DropdownMenuRoot>
        </div>
      </div>
    </div>
  </div>
</template>