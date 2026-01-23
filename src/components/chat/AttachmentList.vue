<script setup lang="ts">
import { useFileIcons } from "@/composables/useFileIcons"

defineProps<{
  attachments: File[]
}>()

const { getFileIcon, getFileColor, formatFileSize } = useFileIcons()
</script>

<template>
  <!-- 첨부파일 목록 표시 -->
  <div class="mb-2 pb-2 border-b border-border/30">
    <div class="space-y-1">
      <div
        v-for="(file, index) in attachments"
        :key="index"
        class="flex items-center gap-2 text-xs"
      >
        <component
          :is="getFileIcon(file.name)"
          :class="['h-3 w-3 flex-shrink-0', getFileColor(file.name)]"
        />
        <span class="truncate flex-1 text-background">{{ file.name }}</span>
        <span class="text-muted-foreground flex-shrink-0">{{ formatFileSize(file.size) }}</span>
      </div>
    </div>
  </div>
</template>