<script setup lang="ts">
import { computed } from "vue";

const props = defineProps<{
  isLoading: boolean;
  /** SPAN 평균 latency (ms) */
  avgMs: number;
  /** SPAN p95 latency (ms) */
  p95Ms: number;
  /** SPAN p99 latency (ms) */
  p99Ms: number;
}>();

function formatLatency(ms: number): string {
  if (!Number.isFinite(ms) || ms < 0) return "—";
  if (ms < 1000) return `${Math.round(ms)}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

const rows = computed(() => [
  { label: "Avg", value: formatLatency(props.avgMs) },
  { label: "p95", value: formatLatency(props.p95Ms) },
  { label: "p99", value: formatLatency(props.p99Ms) },
]);
</script>

<template>
  <div
    class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700"
  >
    <div v-if="isLoading" class="space-y-3">
      <div
        class="h-6 w-28 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-4"
      />
      <div v-for="i in 3" :key="i" class="flex justify-between items-center">
        <div
          class="h-4 w-12 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"
        />
        <div
          class="h-4 w-14 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"
        />
      </div>
    </div>
    <div v-else>
      <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        API 응답 시간
      </h2>
      <div class="space-y-3">
        <div
          v-for="row in rows"
          :key="row.label"
          class="flex justify-between items-center"
        >
          <span class="text-sm text-gray-600 dark:text-gray-400">{{
            row.label
          }}</span>
          <span
            class="text-sm font-mono tabular-nums font-medium text-gray-900 dark:text-white"
          >
            {{ row.value }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>
