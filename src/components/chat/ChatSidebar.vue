<script setup lang="ts">
import { MessageSquare, Plus, Search, Settings, User } from "lucide-vue-next"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import type { ChatThread } from "@/types/chat"

defineProps<{
  threads: ChatThread[]
}>()

defineEmits<{
  (e: "new-chat"): void
}>()
</script>

<template>
  <Sidebar>
    <SidebarHeader class="gap-3 p-4">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2 text-sm font-semibold tracking-tight">
          <SidebarTrigger />
          <span>ChatGPT</span>
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
    </SidebarHeader>
    <SidebarContent>
      <SidebarGroup>
        <SidebarGroupLabel>최근 대화</SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            <SidebarMenuItem v-for="thread in threads" :key="thread.id">
              <SidebarMenuButton
                :class="thread.active ? 'bg-sidebar-accent text-sidebar-accent-foreground' : ''"
              >
                <MessageSquare class="h-4 w-4" />
                <span class="truncate">{{ thread.title }}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    </SidebarContent>
    <SidebarFooter class="p-4">
      <div
        class="flex items-center gap-2 px-3 py-2 text-xs border border-sidebar-border bg-sidebar-accent/50 rounded-md"
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
    </SidebarFooter>
  </Sidebar>
</template>
