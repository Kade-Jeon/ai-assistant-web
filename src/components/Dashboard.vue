<script setup lang="ts">
import { computed, onUnmounted, ref, watch } from "vue";
import type { PeriodType } from "@/composables/useChartData";
import { useDashboardData } from "@/composables/useDashboardData";
import StatsCards from "@/components/dashboard/StatsCards.vue";
import ChartSection from "@/components/dashboard/ChartSection.vue";
import CostChartSection from "@/components/dashboard/CostChartSection.vue";
import ModelUsageShare from "@/components/dashboard/ModelUsageShare.vue";
import ApiResponseTime from "@/components/dashboard/ApiResponseTime.vue";
import SystemStatus from "@/components/dashboard/SystemStatus.vue";
import QuickActions from "@/components/dashboard/QuickActions.vue";

const props = defineProps<{
  isVisible: boolean;
}>();

defineEmits<{
  (e: "back-to-chat"): void;
}>();

const {
  aggregates,
  isLoading: isDashboardLoading,
  isUsageChartRefetching,
  isCostChartRefetching,
  fetchObservations,
  getDailyUsageForPeriod,
  getDailyCostForPeriod,
} = useDashboardData();

function formatChangePercent(pct: number): string {
  if (pct === 0) return "0%";
  const sign = pct > 0 ? "+" : "";
  return `${sign}${pct.toFixed(1)}%`;
}

const stats = computed(() => {
  const a = aggregates.value;
  return [
    {
      title: "총 대화 수",
      value: 1234,
      change: "+12%",
      changeType: "positive" as const,
    },
    {
      title: "오늘 비용",
      value: a.todayCost,
      change: formatChangePercent(a.todayCostChangePercent),
      changeType: (a.todayCostChangePercent >= 0 ? "positive" : "negative") as
        | "positive"
        | "negative",
    },
    {
      title: "오늘 사용량",
      value: a.todayTokens,
      change: formatChangePercent(a.todayTokensChangePercent),
      changeType: (a.todayTokensChangePercent >= 0
        ? "positive"
        : "negative") as "positive" | "negative",
    },
    {
      title: "이번 달 비용",
      value: a.monthCostTotal,
      change: "",
      changeType: "positive" as const,
    },
  ];
});

// 기간별(7일/15일) 일별 비용 차트 (Input/Output, 툴팁 Line Indicator)
const costChartData = computed(() =>
  getDailyCostForPeriod(selectedCostPeriod.value).map((d) => ({
    date: d.date,
    input: d.input,
    output: d.output,
    total: d.total,
  })),
);

const animatedValues = ref<number[]>([]);

const startCountUp = (targets: number[]) => {
  targets.forEach((targetValue, index) => {
    const duration = 1500;
    const steps = 60;
    const increment = targetValue / steps;
    let currentValue = 0;
    const interval = setInterval(() => {
      currentValue += increment;
      if (currentValue >= targetValue) {
        currentValue = targetValue;
        clearInterval(interval);
      }
      animatedValues.value[index] = Math.round(currentValue * 100) / 100;
    }, duration / steps);
    animationIntervals.push(interval);
  });
};

let animationIntervals: number[] = [];

watch(
  () => props.isVisible,
  (isVisible) => {
    if (isVisible) {
      animationIntervals.forEach((interval) => clearInterval(interval));
      animationIntervals = [];
      const values = stats.value.map((s) => s.value);
      animatedValues.value = values.map(() => 0);
      setTimeout(() => {
        startCountUp(values);
      }, 300);
    }
  },
  { immediate: true },
);

onUnmounted(() => {
  animationIntervals.forEach((interval) => clearInterval(interval));
  animationIntervals = [];
});

// 로딩 완료 시 또는 오늘 비용/토큰·이번 달 비용 등 집계값 갱신 시 카드 숫자 동기화
watch(
  [
    isDashboardLoading,
    () =>
      aggregates.value.todayCost +
      aggregates.value.todayTokens +
      aggregates.value.monthCostTotal,
  ],
  ([loading]) => {
    if (!loading && stats.value.length) {
      const values = stats.value.map((s) => s.value);
      animatedValues.value = [...values];
    }
  },
  { immediate: true },
);

// 모델별 사용 비중 Top 5 + others
const modelShare = computed(() => aggregates.value.modelUsageShare);

// 일별 사용량 / 비용 각각 7일 또는 15일 기간 (독립 선택)
const periodOptions: Array<{ value: PeriodType; label: string }> = [
  { value: 7, label: "7일" },
  { value: 15, label: "15일" },
];
const selectedUsagePeriod = ref<PeriodType>(7);
const selectedCostPeriod = ref<PeriodType>(7);

const chartData = computed(() => {
  const daily = getDailyUsageForPeriod(selectedUsagePeriod.value);
  return daily.map((d) => ({
    date: d.date,
    total: d.total,
    input: d.input,
    output: d.output,
  }));
});

/** 두 차트 중 더 긴 기간으로 API 조회 (한 번에 조회 후 각 차트가 필요한 만큼만 사용) */
function getFetchDays(): 7 | 15 {
  return Math.max(selectedUsagePeriod.value, selectedCostPeriod.value) as 7 | 15;
}

watch(
  () => props.isVisible,
  (visible) => {
    if (visible) {
      fetchObservations(getFetchDays());
    }
  },
  { immediate: true },
);

watch(selectedUsagePeriod, () => {
  if (props.isVisible) {
    fetchObservations(getFetchDays(), { chartOnly: "usage" });
  }
});

watch(selectedCostPeriod, () => {
  if (props.isVisible) {
    fetchObservations(getFetchDays(), { chartOnly: "cost" });
  }
});
</script>

<template>
  <div class="p-6 max-w-7xl mx-auto space-y-6">
    <!-- 헤더 -->
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-4">
        <div>
          <h1 class="text-3xl font-bold text-gray-900 dark:text-white">
            대시보드
          </h1>
          <p class="text-gray-600 dark:text-gray-400">AI 사용량 통계 및 분석</p>
        </div>
      </div>
    </div>

    <!-- 통계 카드들 -->
    <StatsCards
      :stats="stats"
      :animated-values="animatedValues"
      :is-loading="isDashboardLoading"
    />

    <!-- 차트와 최근 활동 -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- 차트 영역: 일별 사용량 (total), 툴팁에 input/output -->
      <ChartSection
        :selected-period="selectedUsagePeriod"
        :period-options="periodOptions"
        :chart-data="chartData"
        :is-loading="isDashboardLoading"
        :is-refetching="isUsageChartRefetching"
        @update:selectedPeriod="selectedUsagePeriod = $event"
      />

      <!-- 모델별 사용 비중 Top 5 -->
      <ModelUsageShare
        :model-share="modelShare"
        :is-loading="isDashboardLoading"
      />
    </div>

    <!-- 기간별 비용 차트 (7일/15일, Input/Output, Tooltip Line Indicator) -->
    <CostChartSection
      :selected-period="selectedCostPeriod"
      :period-options="periodOptions"
      :chart-data="costChartData"
      :is-loading="isDashboardLoading"
      :is-refetching="isCostChartRefetching"
      @update:selectedPeriod="selectedCostPeriod = $event"
    />

    <!-- 추가 섹션: API 응답 시간 / 시스템 상태 / 빠른 액션 -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <ApiResponseTime
        :is-loading="isDashboardLoading"
        :avg-ms="aggregates.averageLatencyMs"
        :p95-ms="aggregates.p95LatencyMs"
        :p99-ms="aggregates.p99LatencyMs"
      />
      <SystemStatus
        :is-loading="isDashboardLoading"
        :span-error-rate-percent="aggregates.spanErrorRatePercent"
      />
      <QuickActions :is-loading="isDashboardLoading" />
    </div>
  </div>
</template>
