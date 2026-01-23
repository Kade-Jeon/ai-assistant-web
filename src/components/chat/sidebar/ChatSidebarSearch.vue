<script setup lang="ts">
import { Search } from "lucide-vue-next"
import { Input } from "@/components/ui/input"
</script>

<template>
  <div class="px-4 pt-4 pb-2">
    <div class="relative">
      <Search class="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
      <Input class="h-9 pl-8" placeholder="대화 검색" />
    </div>
  </div>
</template>