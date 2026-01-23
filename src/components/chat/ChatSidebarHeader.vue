<script setup lang="ts">
import { Plus } from "lucide-vue-next"
import { Button } from "@/components/ui/button"

defineEmits<{
  (e: "new-chat"): void
}>()
</script>

<template>
  <div class="h-12 px-4 border-b flex items-center justify-between">
      <div class="flex items-center gap-2 text-sm font-semibold tracking-tight">
        <span>Kade AI</span>
      </div>
      <Button variant="ghost" size="icon" class="h-8 w-8" @click="$emit('new-chat')">
        <Plus class="h-4 w-4" />
        <span class="sr-only">새 대화</span>
      </Button>
  </div>
</template>