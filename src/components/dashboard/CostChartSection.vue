<script setup lang="ts">
/**
 * 이번 달 비용 차트
 * - 데이터: type GENERATION 의 costDetails.input, costDetails.output, costDetails.total
 * - Y축: total (막대 전체 높이 = total)
 * - 막대 구성: input(아래) + output(위) 스택
 */
import type { ChartConfig } from "@/components/ui/chart";
import {
  ChartContainer,
  ChartCrosshair,
  ChartTooltip,
  ChartTooltipContent,
  componentToString,
} from "@/components/ui/chart";
import { VisAxis, VisStackedBar, VisXYContainer } from "@unovis/vue";
import { computed } from "vue";

export interface CostChartPoint {
  date: string;
  input: number;
  output: number;
  total: number;
}

const props = defineProps<{
  chartData: CostChartPoint[];
  isLoading: boolean;
}>();

type DataWithDate = CostChartPoint & { dateObj: Date };

function toDateObj(dateStr: string): Date {
  const iso = dateStr.replace(/\./g, "-");
  return new Date(iso);
}

const chartDataWithDate = computed<DataWithDate[]>(() =>
  props.chartData.map((d) => ({
    ...d,
    dateObj: toDateObj(d.date),
  }))
);

const chartConfig = computed<ChartConfig>(() => ({
  total: { label: "Total", color: "var(--chart-1)" },
  input: { label: "Input", color: "var(--chart-2)" },
  output: { label: "Output", color: "var(--chart-3)" },
}));

// 막대 구성: [input, output] → Y축 total(높이) = input + output
const barColors = ["var(--chart-2)", "var(--chart-3)"];

// 라인 차트(일별 사용량)와 동일: "2025년 2월 1일"
function formatTooltipDate(d: number | Date): string {
  const date = new Date(d);
  if (Number.isNaN(date.getTime())) return "";
  const y = date.getFullYear();
  const m = date.getMonth() + 1;
  const day = date.getDate();
  return `${y}년 ${m}월 ${day}일`;
}
</script>

<template>
  <div
    class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700"
  >
    <div v-if="isLoading" class="space-y-4">
      <div
        class="h-6 w-40 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"
      />
      <div class="flex items-end justify-between h-64">
        <div
          v-for="i in 6"
          :key="i"
          class="w-8 h-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"
          :class="i % 2 === 0 ? 'h-24' : 'h-40'"
        />
      </div>
    </div>
    <div v-else>
      <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        비용
      </h2>
      <div
        v-if="chartDataWithDate.length === 0"
        class="h-48 sm:h-64 flex items-center justify-center text-gray-500"
      >
        이번 달 비용 데이터가 없습니다.
      </div>
      <ChartContainer v-else :config="chartConfig" class="h-48 sm:h-64">
        <VisXYContainer
          :data="chartDataWithDate"
          :padding="{ top: 10, bottom: 10, left: 10, right: 10 }"
        >
          <VisStackedBar
            :x="(d: DataWithDate) => d.dateObj"
            :y="[(d: DataWithDate) => d.input, (d: DataWithDate) => d.output]"
            :color="barColors"
            :rounded-corners="4"
            :bar-padding="0.1"
          />
          <VisAxis
            type="x"
            :x="(d: DataWithDate) => d.dateObj"
            :tick-line="false"
            :domain-line="false"
            :grid-line="false"
            :num-ticks="chartDataWithDate.length"
            :tick-format="
              (d: number) => {
                const date = new Date(d);
                const m = date.getMonth() + 1;
                const day = date.getDate();
                return `${m}/${day}`;
              }
            "
            :tick-values="chartDataWithDate.map((d) => d.dateObj)"
          />
          <VisAxis
            type="y"
            :tick-line="false"
            :domain-line="false"
            :grid-line="true"
          />
          <ChartTooltip />
          <ChartCrosshair
            :template="
              componentToString(chartConfig, ChartTooltipContent, {
                indicator: 'line',
                labelFormatter(d) {
                  return formatTooltipDate(d as number | Date);
                },
              })
            "
            color="#0000"
          />
        </VisXYContainer>
      </ChartContainer>
    </div>
  </div>
</template>
