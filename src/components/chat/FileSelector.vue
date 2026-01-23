<script setup lang="ts">
import { Paperclip } from "lucide-vue-next"
import { Button } from "@/components/ui/button"

defineEmits<{
  (e: "fileSelect"): void
}>()
</script>

<template>
  <!-- 첨부파일 버튼 -->
  <Button
    size="sm"
    variant="outline"
    class="h-9 px-3"
    @click="$emit('fileSelect')"
    type="button"
    title="첨부파일 추가 (DOC, DOCX, HWP, HWXP, PDF, PPT, PPTX, XLSX, XLS, TXT)"
  >
    <Paperclip class="h-4 w-4" />
  </Button>
</template>