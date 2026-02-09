<script setup lang="ts">
import { X } from "lucide-vue-next";
import { useFileIcons } from "@/composables/useFileIcons";

export interface FileBadgeItem {
  id?: string;
  name: string;
  size?: number;
}

defineProps<{
  items: FileBadgeItem[];
  removable?: boolean;
}>();

defineEmits<{
  (e: "remove", index: number): void;
}>();

const { getFileIcon, getFileColor, formatFileSize } = useFileIcons();
</script>

<template>
  <div v-if="items.length > 0" class="flex flex-wrap gap-2">
    <div
      v-for="(item, index) in items"
      :key="item.id ?? index"
      class="inline-flex items-center gap-2 px-3 py-1 bg-muted/80 border border-border/30 rounded-full text-sm hover:bg-muted transition-colors"
    >
      <component
        :is="getFileIcon(item.name)"
        :class="['h-3 w-3 shrink-0', getFileColor(item.name)]"
      />
      <span class="truncate max-w-32">{{ item.name }}</span>
      <span
        v-if="item.size != null"
        class="text-xs text-muted-foreground shrink-0"
      >
        {{ formatFileSize(item.size) }}
      </span>
      <button
        v-if="removable"
        type="button"
        class="text-red-400 hover:text-red-600 ml-1 rounded-full hover:bg-muted p-0.5 transition-colors shrink-0"
        title="제거"
        @click="$emit('remove', index)"
      >
        <X class="h-3 w-3" />
      </button>
    </div>
  </div>
</template>
