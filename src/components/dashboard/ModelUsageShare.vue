<script setup lang="ts">
export interface ModelShareItem {
  model: string;
  percent: number;
}

defineProps<{
  modelShare: ModelShareItem[];
  isLoading: boolean;
}>();
</script>

<template>
  <div
    class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700"
  >
    <div v-if="isLoading" class="space-y-4">
      <div
        class="h-6 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-4"
      />
      <div v-for="i in 5" :key="i" class="space-y-2">
        <div
          class="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"
        />
        <div
          class="h-3 w-full max-w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"
        />
      </div>
    </div>
    <div v-else>
      <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        모델별 사용 비중
      </h2>
      <div class="space-y-3">
        <div
          v-for="item in modelShare"
          :key="item.model"
          class="flex flex-col gap-1"
        >
          <div class="flex items-center justify-between gap-2 min-w-0">
            <span
              class="text-sm font-medium text-gray-900 dark:text-white truncate shrink-0 max-w-[10rem]"
            >
              {{ item.model }}
            </span>
            <span
              class="text-sm font-mono tabular-nums text-gray-600 dark:text-gray-400 shrink-0"
            >
              {{ item.percent.toFixed(0) }}%
            </span>
          </div>
          <div
            class="h-2 w-full rounded bg-gray-200 dark:bg-gray-700 overflow-hidden"
          >
            <div
              class="h-full rounded bg-blue-500 transition-[width] duration-300"
              :style="{ width: `${Math.min(100, item.percent)}%` }"
            />
          </div>
        </div>
      </div>
      <p
        v-if="modelShare.length === 0"
        class="text-sm text-gray-500 dark:text-gray-400 mt-2"
      >
        데이터가 없습니다.
      </p>
    </div>
  </div>
</template>
