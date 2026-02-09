<script setup lang="ts">
import { computed } from "vue";
import FileBadgeList from "./FileBadgeList.vue";

const props = defineProps<{
  selectedFiles: File[];
}>();

defineEmits<{
  (e: "removeFile", index: number): void;
}>();

const badgeItems = computed(() =>
  props.selectedFiles.map((f) => ({ name: f.name, size: f.size })),
);
</script>

<template>
  <div v-if="selectedFiles.length > 0" class="mb-3">
    <FileBadgeList
      :items="badgeItems"
      :removable="true"
      @remove="$emit('removeFile', $event)"
    />
  </div>
</template>
