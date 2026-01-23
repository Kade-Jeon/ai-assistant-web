<script setup lang="ts">
import { computed, ref } from "vue"
import { Paperclip, File, FileText, FileType, FileChartPie, Sheet } from "lucide-vue-next"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

const props = defineProps<{
  modelValue: string
  canSend?: boolean
}>()

const emits = defineEmits<{
  (e: "update:modelValue", value: string): void
  (e: "send", value: string, attachments?: File[]): void
}>()

const isDisabled = computed(() => props.canSend === false)
const isComposing = ref(false)
const selectedFiles = ref<File[]>([])
const fileInput = ref<HTMLInputElement>()

const handleInput = (value: string | number) => {
  emits("update:modelValue", String(value))
}

const handleKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Enter' && !isComposing.value) {
    event.preventDefault()
    handleSend()
  }
}

const handleSend = () => {
  emits("send", props.modelValue, selectedFiles.value.length > 0 ? [...selectedFiles.value] : undefined)
  selectedFiles.value = []
}

const handleFileSelect = () => {
  fileInput.value?.click()
}

const handleFileChange = (event: Event) => {
  const target = event.target as HTMLInputElement
  const files = target.files
  if (files) {
    selectedFiles.value = [...selectedFiles.value, ...Array.from(files)]
  }
  // Reset input value to allow selecting the same file again
  target.value = ''
}

const removeFile = (index: number) => {
  selectedFiles.value.splice(index, 1)
}

const getFileIcon = (fileName: string) => {
  const extension = fileName.split('.').pop()?.toLowerCase()
  switch (extension) {
    case 'doc':
    case 'docx':
    case 'hwp':
    case 'hwxp':
    case 'pdf':
      return FileText
    case 'txt':
      return FileType
    case 'ppt':
    case 'pptx':
      return FileChartPie
    case 'xlsx':
    case 'xls':
      return Sheet
    default:
      return File
  }
}

const getFileColor = (fileName: string) => {
  const extension = fileName.split('.').pop()?.toLowerCase()
  switch (extension) {
    case 'doc':
    case 'docx':
      return 'text-blue-600'
    case 'hwp':
    case 'hwxp':
      return 'text-blue-300'
    case 'pdf':
      return 'text-red-500'
    case 'ppt':
    case 'pptx':
      return 'text-orange-500'
    case 'xlsx':
    case 'xls':
      return 'text-green-700'
    case 'txt':
      return 'text-slate-500'
    default:
      return 'text-muted-foreground'
  }
}
</script>

<template>
  <div class="bg-background border-t flex-shrink-0">
    <div class="w-full max-w-3xl mx-auto px-4 py-4">
      <!-- 선택된 파일 목록 -->
      <div v-if="selectedFiles.length > 0" class="mb-3 space-y-2">
        <div
          v-for="(file, index) in selectedFiles"
          :key="index"
          class="flex items-center gap-3 p-3 bg-muted/50 border border-border/50 rounded-lg hover:bg-muted/80 transition-colors"
        >
          <component
            :is="getFileIcon(file.name)"
            :class="['h-4 w-4 flex-shrink-0', getFileColor(file.name)]"
          />
          <div class="flex-1 min-w-0 space-y-1">
            <p class="text-sm font-medium truncate leading-tight">{{ file.name }}</p>
            <p class="text-xs text-muted-foreground">
              {{ (file.size / 1024 / 1024).toFixed(1) }} MB
            </p>
          </div>
          <button
            @click="removeFile(index)"
            class="text-muted-foreground hover:text-foreground p-1 rounded hover:bg-muted transition-colors"
            type="button"
            title="파일 제거"
          >
            ×
          </button>
        </div>
      </div>

      <div class="flex items-center gap-2 p-2 border bg-card rounded-xl shadow-sm">
        <!-- 첨부파일 버튼 -->
        <Button
          size="sm"
          variant="outline"
          class="h-9 px-3"
          @click="handleFileSelect"
          type="button"
          title="첨부파일 추가 (DOC, DOCX, HWP, HWXP, PDF, PPT, PPTX, XLSX, XLS, TXT)"
        >
          <Paperclip class="h-4 w-4" />
        </Button>

        <Input
          class="flex-1 h-10 px-2 bg-transparent border-0 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
          :model-value="props.modelValue"
          placeholder="메시지를 입력하세요..."
          @update:modelValue="handleInput"
          @keydown="handleKeydown"
          @compositionstart="isComposing = true"
          @compositionend="isComposing = false"
        />

        <Button size="sm" class="h-9" :disabled="isDisabled" @click="handleSend">
          전송
        </Button>
      </div>

      <!-- 숨겨진 파일 입력 -->
      <input
        ref="fileInput"
        type="file"
        multiple
        class="hidden"
        @change="handleFileChange"
        accept=".doc,.docx,.hwp,.hwxp,.pdf,.ppt,.pptx,.xlsx,.xls,.txt"
      />

      <p class="mt-2 text-xs text-center text-muted-foreground">
        AI는 실수를 할 수 있습니다. 중요한 정보는 확인하세요.
      </p>
    </div>
  </div>
</template>
