<script setup lang="ts">
import { computed, ref, watch } from "vue";
import type { PeriodType } from "@/composables/useChartData";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LineChart } from "@/components/ui/chart-line";

export interface DailyChartPoint {
  date: string;
  total: number;
  input: number;
  output: number;
}

const props = defineProps<{
  selectedPeriod: PeriodType;
  periodOptions: Array<{ value: PeriodType; label: string }>;
  chartData: DailyChartPoint[];
  /** 초기 로딩 (전체 스켈레톤) */
  isLoading: boolean;
  /** 기간 변경 등 부분 재조회 중 (차트 영역만 오버레이) */
  isRefetching?: boolean;
}>();

const emit = defineEmits<{
  (e: "update:selectedPeriod", value: PeriodType): void;
}>();

const localSelectedPeriod = ref<PeriodType>(props.selectedPeriod);

watch(
  () => props.selectedPeriod,
  (newValue) => {
    localSelectedPeriod.value = newValue;
  },
  { immediate: true },
);

watch(localSelectedPeriod, (newValue) => {
  if (newValue !== props.selectedPeriod) {
    emit("update:selectedPeriod", newValue);
  }
});

const tooltipConfig = computed(() => ({
  total: { label: "Total", color: "hsl(var(--chart-1))" },
  input: { label: "Input", color: "hsl(var(--chart-2))" },
  output: { label: "Output", color: "hsl(var(--chart-3))" },
}));

// 툴팁 날짜: "2025.02.01" → "2025년 2월 1일"
function formatTooltipDate(value: unknown): string {
  if (value == null) return "";
  const s = String(value).trim();
  const parts = s.split(".");
  if (parts.length >= 3) {
    const [y, m, d] = parts;
    return `${y}년 ${Number(m)}월 ${Number(d)}일`;
  }
  return s;
}
</script>

<template>
  <!-- 차트 영역 -->
  <div
    class="lg:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700"
  >
    <div v-if="isLoading" class="space-y-4">
      <div
        class="h-6 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"
      ></div>
      <div class="flex items-end justify-between h-64">
        <div
          v-for="i in 6"
          :key="i"
          class="w-8 h-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"
          :class="i % 2 === 0 ? 'h-24' : 'h-40'"
        ></div>
      </div>
    </div>
    <div v-else>
      <div
        class="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-4"
      >
        <h2 class="text-lg font-semibold text-gray-900 dark:text-white">
          일별 사용량
        </h2>
        <Select v-model="localSelectedPeriod">
          <SelectTrigger class="w-full sm:w-24">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem
              v-for="option in periodOptions"
              :key="option.value"
              :value="option.value"
            >
              {{ option.label }}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div
        v-if="chartData.length === 0"
        class="h-48 sm:h-64 flex items-center justify-center text-gray-500"
      >
        데이터를 불러올 수 없습니다.
      </div>
      <div v-else class="relative">
        <LineChart
          :data="chartData"
          :categories="['total']"
          index="date"
          :colors="['#3b82f6']"
          :tooltip-config="tooltipConfig"
          :tooltip-label-formatter="formatTooltipDate"
          class="h-48 sm:h-64"
          :show-legend="false"
          :show-x-axis="true"
          :show-y-axis="true"
          :show-x-grid-line="false"
          :show-grid-line="true"
          :show-dots="true"
          :show-tooltip="true"
          :selected-period="selectedPeriod"
        />
        <div
          v-if="isRefetching"
          class="absolute inset-0 flex items-center justify-center bg-white/60 dark:bg-gray-900/60 rounded-lg"
        >
          <div
            class="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent"
          />
        </div>
      </div>
    </div>
  </div>
</template>
