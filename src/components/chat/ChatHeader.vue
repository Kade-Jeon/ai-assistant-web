<script setup lang="ts">
import { FolderOpen, Files, Moon, Sun, PanelLeftClose, PanelRightClose } from "lucide-vue-next"
import { Button } from "@/components/ui/button"

const props = withDefaults(defineProps<{
  isDark: boolean
  isSidebarOpen: boolean
  modelName?: string
  hintText?: string
  /** 프로젝트 대화 시 가운데 표시할 문구 (예: '프로젝트 {프로젝트명}') */
  centerTitle?: string
  /** 프로젝트 대화 시 문서 패널 토글 버튼 표시 여부 */
  showDocumentButton?: boolean
  /** 문서 패널이 열려 있는지 (버튼 활성 상태 표시용) */
  isDocumentPanelOpen?: boolean
  /** 프로젝트에 추가된 문서 개수 (뱃지 표시용) */
  documentCount?: number
}>(), {
  modelName: "GPT-4o mini",
  hintText: "새 대화로 시작하세요",
})

defineEmits<{
  (e: "toggle-theme"): void
  (e: "toggle-sidebar"): void
  (e: "toggle-documents"): void
}>()
</script>

<template>
  <header class="flex items-center justify-between h-12 px-4 border-b">
    <div class="flex items-center gap-2 min-w-0 shrink-0">
      <Button variant="ghost" size="icon" class="h-8 w-8" @click="$emit('toggle-sidebar')">
        <PanelLeftClose v-if="isSidebarOpen" class="h-4 w-4" />
        <PanelRightClose v-else class="h-4 w-4" />
        <span class="sr-only">사이드바 토글</span>
      </Button>
    </div>
    <div
      v-if="props.centerTitle"
      class="flex-1 flex justify-center items-center gap-2 min-w-0 px-2"
    >
      <FolderOpen class="h-4 w-4 shrink-0 text-muted-foreground" />
      <span class="text-sm font-medium truncate">{{ props.centerTitle }}</span>
    </div>
    <div class="flex items-center gap-2 shrink-0">
      <span v-if="!props.centerTitle" class="text-xs text-muted-foreground">{{ props.hintText }}</span>
      <Button
        v-if="props.showDocumentButton"
        variant="ghost"
        size="icon"
        class="relative h-8 w-8"
        :class="props.isDocumentPanelOpen ? 'bg-muted' : ''"
        @click="$emit('toggle-documents')"
      >
        <Files class="h-4 w-4" />
        <span
          v-if="props.documentCount != null && props.documentCount > 0"
          class="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-medium text-primary-foreground"
        >
          {{ props.documentCount > 99 ? '99+' : props.documentCount }}
        </span>
        <span class="sr-only">문서 패널 {{ props.isDocumentPanelOpen ? '접기' : '열기' }}</span>
      </Button>
      <Button variant="ghost" size="icon" class="h-8 w-8" @click="$emit('toggle-theme')">
        <component :is="props.isDark ? Sun : Moon" class="h-4 w-4" />
        <span class="sr-only">다크모드 토글</span>
      </Button>
    </div>
  </header>
</template>
