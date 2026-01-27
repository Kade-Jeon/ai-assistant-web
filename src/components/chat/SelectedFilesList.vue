<script setup lang="ts">
import { useFileIcons } from "@/composables/useFileIcons"

defineProps<{
  selectedFiles: File[]
}>()

defineEmits<{
  (e: "removeFile", index: number): void
}>()

const { getFileIcon, getFileColor, formatFileSize } = useFileIcons()
</script>

<template>
  <!-- 선택된 파일 목록 -->
  <div v-if="selectedFiles.length > 0" class="mb-3">
    <div class="flex flex-wrap gap-2">
      <div
        v-for="(file, index) in selectedFiles"
        :key="index"
        class="inline-flex items-center gap-2 px-3 py-1 bg-muted/80 border border-border/30 rounded-full text-sm hover:bg-slate-200 transition-colors"
      >
        <component
          :is="getFileIcon(file.name)"
          :class="['h-3 w-3 flex-shrink-0', getFileColor(file.name)]"
        />
        <span class="truncate max-w-32">{{ file.name }}</span>
        <span class="text-xs text-muted-foreground">
          {{ formatFileSize(file.size) }}
        </span>
        <button
          @click="$emit('removeFile', index)"
          class="text-muted-foreground hover:text-foreground ml-1 rounded-full hover:bg-slate-200 p-0.5 transition-colors"
          type="button"
          title="파일 제거"
        >
          ×
        </button>
      </div>
    </div>
  </div>
</template>