<script setup lang="ts">
import { Bot, Moon, Sun } from "lucide-vue-next"
import { Button } from "@/components/ui/button"
import { SidebarTrigger } from "@/components/ui/sidebar"

const props = withDefaults(defineProps<{
  isDark: boolean
  modelName?: string
  hintText?: string
}>(), {
  modelName: "GPT-4o mini",
  hintText: "새 대화로 시작하세요",
})

defineEmits<{
  (e: "toggle-theme"): void
}>()
</script>

<template>
  <header class="flex items-center justify-between h-12 px-4 border-b">
    <div class="flex items-center gap-2">
      <SidebarTrigger />
      <div class="flex items-center gap-2 px-2.5 py-1 text-sm font-medium bg-muted rounded-md">
        <Bot class="h-4 w-4" />
        <span>{{ props.modelName }}</span>
      </div>
    </div>
    <div class="flex items-center gap-2">
      <span class="text-xs text-muted-foreground">{{ props.hintText }}</span>
      <Button variant="ghost" size="icon" class="h-8 w-8" @click="$emit('toggle-theme')">
        <component :is="props.isDark ? Sun : Moon" class="h-4 w-4" />
        <span class="sr-only">다크모드 토글</span>
      </Button>
    </div>
  </header>
</template>
