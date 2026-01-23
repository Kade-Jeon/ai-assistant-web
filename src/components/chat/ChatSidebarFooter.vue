<script setup lang="ts">
import { Settings, User } from "lucide-vue-next"
import { Button } from "@/components/ui/button"
</script>

<template>
  <div class="p-4 border-t">
    <div
      class="flex items-center gap-2 px-3 py-2 text-xs bg-sidebar-accent/50 border border-sidebar-border rounded-md"
    >
      <User class="h-4 w-4" />
      <div class="flex flex-col">
        <span class="font-medium">kade</span>
        <span class="text-xs text-sidebar-foreground/70">Free Plan</span>
      </div>
      <Button variant="ghost" size="icon" class="ml-auto h-7 w-7">
        <Settings class="h-4 w-4" />
        <span class="sr-only">설정</span>
      </Button>
    </div>
  </div>
</template>