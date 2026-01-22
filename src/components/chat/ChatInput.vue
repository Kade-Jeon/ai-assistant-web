<script setup lang="ts">
import { computed } from "vue"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

const props = defineProps<{
  modelValue: string
  canSend?: boolean
}>()

const emits = defineEmits<{
  (e: "update:modelValue", value: string): void
  (e: "send"): void
}>()

const isDisabled = computed(() => props.canSend === false)

const handleInput = (value: string | number) => {
  emits("update:modelValue", String(value))
}
</script>

<template>
  <div class="bg-background border-t">
    <div class="w-full max-w-3xl mx-auto px-4 py-4">
      <div class="flex items-center gap-2 p-2 border bg-card rounded-xl shadow-sm">
        <Input
          class="flex-1 h-10 px-2 bg-transparent border-0 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
          :model-value="props.modelValue"
          placeholder="메시지를 입력하세요..."
          @update:modelValue="handleInput"
          @keydown.enter.prevent="$emit('send')"
        />
        <Button size="sm" class="h-9" :disabled="isDisabled" @click="$emit('send')">
          전송
        </Button>
      </div>
      <p class="mt-2 text-xs text-center text-muted-foreground">
        ChatGPT는 실수를 할 수 있습니다. 중요한 정보는 확인하세요.
      </p>
    </div>
  </div>
</template>
