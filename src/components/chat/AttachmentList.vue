<script setup lang="ts">
import { useFileIcons } from "@/composables/useFileIcons";
import type { AttachmentMeta } from "@/types/chat";

const props = defineProps<{
  attachments: (File | AttachmentMeta)[];
}>();

const { getFileIcon, getFileColor, formatFileSize } = useFileIcons();

// File 또는 AttachmentMeta에서 파일명과 크기 추출
const getFileName = (item: File | AttachmentMeta): string => {
  return item instanceof File ? item.name : item.filename;
};

const getFileSize = (item: File | AttachmentMeta): number => {
  return item instanceof File ? item.size : item.size;
};
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
          :is="getFileIcon(getFileName(file))"
          :class="['h-3 w-3 flex-shrink-0', getFileColor(getFileName(file))]"
        />
        <span class="truncate flex-1 text-background">{{ getFileName(file) }}</span>
        <span class="text-white flex-shrink-0">{{
          formatFileSize(getFileSize(file))
        }}</span>
      </div>
    </div>
  </div>
</template>
