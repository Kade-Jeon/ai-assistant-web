<script setup lang="ts">
import { computed } from "vue";

interface SystemMetric {
  label: string;
  value: string;
  color: string;
}

const props = defineProps<{
  isLoading: boolean;
  /** SPAN 중 level=ERROR 비율 (0~100). 있으면 에러율 행에 표시 */
  spanErrorRatePercent?: number;
}>();

const systemMetrics = computed<SystemMetric[]>(() => {
  const err =
    props.spanErrorRatePercent != null ? props.spanErrorRatePercent : null;
  const errorRateItem: SystemMetric = {
    label: "에러율",
    value: err != null ? `${err.toFixed(1)}%` : "—",
    color:
      err == null || err === 0
        ? "text-green-600"
        : err < 5
          ? "text-yellow-600"
          : "text-red-600",
  };
  return [
    { label: "서버 상태", value: "정상", color: "text-green-600" },
    errorRateItem,
    { label: "메모리 사용률", value: "68%", color: "text-yellow-600" },
    { label: "디스크 사용률", value: "45%", color: "text-green-600" },
  ];
});
</script>

<template>
  <!-- 시스템 상태 -->
  <div
    class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700"
  >
    <div v-if="isLoading" class="space-y-3">
      <div
        class="h-6 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-4"
      ></div>
      <div v-for="i in 4" :key="i" class="flex justify-between items-center">
        <div
          class="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"
        ></div>
        <div
          class="h-4 w-12 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"
        ></div>
      </div>
    </div>
    <div v-else>
      <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        시스템 상태
      </h2>
      <div class="space-y-3">
        <div
          v-for="metric in systemMetrics"
          :key="metric.label"
          class="flex justify-between items-center"
        >
          <span class="text-sm text-gray-600 dark:text-gray-400">{{
            metric.label
          }}</span>
          <span class="text-sm font-medium" :class="metric.color">{{
            metric.value
          }}</span>
        </div>
      </div>
    </div>
  </div>
</template>
