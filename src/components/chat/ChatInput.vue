<script setup lang="ts">
import { computed, ref } from "vue";
import { Send } from "lucide-vue-next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import FileSelector from "./FileSelector.vue";
import SelectedFilesList from "./SelectedFilesList.vue";

const props = defineProps<{
  modelValue: string;
  canSend?: boolean;
}>();

const emits = defineEmits<{
  (e: "update:modelValue", value: string): void;
  (e: "send", value: string, attachments?: File[]): void;
}>();

const isDisabled = computed(() => props.canSend === false);
const isComposing = ref(false);
const selectedFiles = ref<File[]>([]);
const fileInput = ref<HTMLInputElement>();

const handleInput = (value: string | number) => {
  emits("update:modelValue", String(value));
};

const handleKeydown = (event: KeyboardEvent) => {
  if (event.key === "Enter" && !isComposing.value) {
    event.preventDefault();
    handleSend();
  }
};

const handleSend = () => {
  emits(
    "send",
    props.modelValue,
    selectedFiles.value.length > 0 ? [...selectedFiles.value] : undefined,
  );
  selectedFiles.value = [];
};

const handleFileSelect = () => {
  fileInput.value?.click();
};

const handleFileChange = (event: Event) => {
  const target = event.target as HTMLInputElement;
  const files = target.files;
  if (files) {
    selectedFiles.value = [...selectedFiles.value, ...Array.from(files)];
  }
  // Reset input value to allow selecting the same file again
  target.value = "";
};

const removeFile = (index: number) => {
  selectedFiles.value.splice(index, 1);
};
</script>

<template>
  <div class="bg-background border-t flex-shrink-0">
    <div class="w-full max-w-3xl mx-auto px-4 py-4">
      <!-- 선택된 파일 목록 -->
      <SelectedFilesList
        :selected-files="selectedFiles"
        @remove-file="removeFile"
      />

      <div
        class="flex items-center gap-2 p-2 border bg-card rounded-xl shadow-sm"
      >
        <!-- 첨부파일 버튼 -->
        <FileSelector @file-select="handleFileSelect" />

        <Input
          class="flex-1 h-10 px-2 bg-transparent border-0 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
          :model-value="props.modelValue"
          placeholder="메시지를 입력하세요..."
          @update:modelValue="handleInput"
          @keydown="handleKeydown"
          @compositionstart="isComposing = true"
          @compositionend="isComposing = false"
        />

        <Button
          size="sm"
          class="h-9 border border-border bg-white text-black hover:bg-slate-200 disabled:border-neutral-300 disabled:bg-neutral-200 dark:bg-input/30 dark:border-input dark:text-foreground dark:hover:bg-slate-700 dark:disabled:border-neutral-600 dark:disabled:bg-neutral-700"
          :disabled="isDisabled"
          aria-label="전송"
          @click="handleSend"
        >
          <Send class="h-4 w-4" />
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
