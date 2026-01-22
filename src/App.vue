<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Bot, MessageSquare, Moon, Plus, Search, Settings, Sun, User } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar'

const themeStorageKey = 'chat-theme'
const isDark = ref(false)

const applyTheme = (value: boolean) => {
  document.documentElement.classList.toggle('dark', value)
}

const toggleTheme = () => {
  isDark.value = !isDark.value
  applyTheme(isDark.value)
  localStorage.setItem(themeStorageKey, isDark.value ? 'dark' : 'light')
}

onMounted(() => {
  const savedTheme = localStorage.getItem(themeStorageKey)
  isDark.value = savedTheme === 'dark'
  applyTheme(isDark.value)
})

const threads = [
  { id: 't1', title: '프로덕트 전략 정리', active: true },
  { id: 't2', title: 'Vue 성능 최적화 아이디어', active: false },
  { id: 't3', title: '디자인 시스템 톤앤매너', active: false },
  { id: 't4', title: '온보딩 플로우 개선', active: false },
]

const messages = [
  {
    id: 'm1',
    role: 'assistant',
    content: '안녕하세요! 무엇을 도와드릴까요?\n원하는 스타일이나 기능이 있다면 알려주세요.',
    time: '방금 전',
  },
  {
    id: 'm2',
    role: 'user',
    content: 'ChatGPT처럼 보이는 화면을 만들고 싶어요.',
    time: '1분 전',
  },
  {
    id: 'm3',
    role: 'assistant',
    content:
      '좋아요. 사이드바, 상단 헤더, 메시지 리스트, 입력 영역으로 구성해 깔끔하게 정리해드릴게요.',
    time: '방금 전',
  },
]
</script>

<template>
  <SidebarProvider :open="true">
    <Sidebar>
      <SidebarHeader class="gap-3 p-4">
        <div class="flex items-center justify-between">
          <div class="text-sm font-semibold tracking-tight">ChatGPT</div>
          <Button variant="ghost" size="icon" class="h-8 w-8">
            <Plus class="h-4 w-4" />
            <span class="sr-only">새 대화</span>
          </Button>
        </div>
        <div class="relative">
          <Search class="pointer-events-none absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
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
        <div class="flex items-center gap-2 rounded-md border border-sidebar-border bg-sidebar-accent/50 px-3 py-2 text-xs">
          <User class="h-4 w-4" />
          <div class="flex flex-col">
            <span class="font-medium">kade</span>
            <span class="text-[11px] text-sidebar-foreground/70">Free Plan</span>
          </div>
          <Button variant="ghost" size="icon" class="ml-auto h-7 w-7">
            <Settings class="h-4 w-4" />
            <span class="sr-only">설정</span>
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
    <SidebarInset>
      <header class="flex h-12 items-center justify-between border-b px-4">
        <div class="flex items-center gap-2">
          <SidebarTrigger />
          <div class="flex items-center gap-2 rounded-md bg-muted px-2.5 py-1 text-sm font-medium">
            <Bot class="h-4 w-4" />
            <span>GPT-4o mini</span>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <span class="text-xs text-muted-foreground">새 대화로 시작하세요</span>
          <Button variant="ghost" size="icon" class="h-8 w-8" @click="toggleTheme">
            <component :is="isDark ? Sun : Moon" class="h-4 w-4" />
            <span class="sr-only">다크모드 토글</span>
          </Button>
        </div>
      </header>
      <div class="flex flex-1 flex-col">
        <div class="flex-1 overflow-y-auto">
          <div class="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-6">
            <div v-for="message in messages" :key="message.id" class="flex flex-col gap-2">
              <div class="flex" :class="message.role === 'user' ? 'justify-end' : 'justify-start'">
                <div
                  class="max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-6 shadow-sm"
                  :class="message.role === 'user' ? 'bg-foreground text-background' : 'bg-muted text-foreground'"
                >
                  <p class="whitespace-pre-line">{{ message.content }}</p>
                </div>
              </div>
              <div
                class="flex items-center gap-2 text-xs text-muted-foreground"
                :class="message.role === 'user' ? 'justify-end' : 'justify-start'"
              >
                <component :is="message.role === 'user' ? User : Bot" class="h-3.5 w-3.5" />
                <span>{{ message.role === 'user' ? '나' : 'ChatGPT' }}</span>
                <span>•</span>
                <span>{{ message.time }}</span>
              </div>
            </div>
          </div>
        </div>
        <div class="border-t bg-background">
          <div class="mx-auto w-full max-w-3xl px-4 py-4">
            <div class="flex items-center gap-2 rounded-xl border bg-card p-2 shadow-sm">
              <Input
                class="h-10 flex-1 border-0 bg-transparent px-2 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
                placeholder="메시지를 입력하세요..."
              />
              <Button size="sm" class="h-9">
                전송
              </Button>
            </div>
            <p class="mt-2 text-center text-xs text-muted-foreground">
              ChatGPT는 실수를 할 수 있습니다. 중요한 정보는 확인하세요.
            </p>
          </div>
        </div>
      </div>
    </SidebarInset>
  </SidebarProvider>
</template>