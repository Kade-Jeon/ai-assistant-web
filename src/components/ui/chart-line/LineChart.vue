<script setup lang="ts" generic="T extends Record<string, any>">
import type { BulletLegendItemInterface } from "@unovis/ts";
import type { Component } from "vue";
import type { BaseChartProps } from ".";
import { Axis, CurveType, Line } from "@unovis/ts";

import { VisAxis, VisLine, VisScatter, VisXYContainer } from "@unovis/vue";
import { useMounted } from "@vueuse/core";
import { computed, ref } from "vue";
import { cn } from "@/lib/utils";
import type { ChartConfig } from "@/components/ui/chart";
import {
  ChartCrosshair,
  ChartTooltip,
  ChartTooltipContent,
  componentToString,
  defaultColors,
} from "@/components/ui/chart";

const props = withDefaults(
  defineProps<
    BaseChartProps<T> & {
      /**
       * Render custom tooltip component.
       */
      customTooltip?: Component;
      /**
       * 툴팁에 표시할 항목 설정. 없으면 categories 기반으로만 표시.
       * 일별 사용량 등에서 total + input/output 툴팁 표시용.
       */
      tooltipConfig?: ChartConfig;
      /**
       * Type of curve
       */
      curveType?: CurveType;
      /**
       * Show dots/points on the line
       */
      showDots?: boolean;
      /**
       * Selected period for tick calculation
       */
      selectedPeriod?: number;
      /**
       * X축 tick 개수 직접 지정 (일별 차트 등). 지정 시 selectedPeriod 기반 계산 대신 사용
       */
      xAxisNumTicks?: number;
      /**
       * X축에 정수 위치만 라벨 표시 (0.5, 1.5 등 제거)
       */
      xAxisIntegerTicksOnly?: boolean;
      /**
       * 툴팁 상단 날짜/라벨 포맷터 (미설정 시 기본 "날짜: {index값}" 사용)
       */
      tooltipLabelFormatter?: (value: unknown) => string;
      /**
       * X축 그리드 라인 표시 (Y축은 showGridLine으로 제어)
       * @default false
       */
      showXGridLine?: boolean;
    }
  >(),
  {
    curveType: CurveType.MonotoneX,
    filterOpacity: 0.2,
    margin: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
    showXAxis: true,
    showYAxis: true,
    showTooltip: true,
    showLegend: true,
    showGridLine: true,
    showXGridLine: false,
    showDots: false,
  }
);

const emits = defineEmits<{
  legendItemClick: [d: BulletLegendItemInterface, i: number];
}>();

type KeyOfT = Extract<keyof T, string>;
type Data = (typeof props.data)[number];

const index = computed(() => props.index as KeyOfT);
const xAxisIntegerTicksOnly = computed(
  () => props.xAxisIntegerTicksOnly ?? false
);
const colors = computed(() =>
  props.colors?.length ? props.colors : defaultColors(props.categories.length)
);

// X축 tick 개수 계산 (xAxisNumTicks 있으면 일별 등 직접 지정값 사용)
const xAxisTicks = computed(() => {
  if (props.xAxisNumTicks != null && props.xAxisNumTicks > 0) {
    return props.xAxisNumTicks;
  }
  const period = props.selectedPeriod || 7;
  return Math.max(2, Math.floor(period / 2) + 1);
});

// Chart config for tooltip (기본: categories[0]만; tooltipConfig 있으면 해당 설정 사용)
const chartConfig = computed(() => {
  if (props.tooltipConfig && Object.keys(props.tooltipConfig).length > 0) {
    return props.tooltipConfig;
  }
  const categoryName = props.categories[0];
  if (!categoryName) return {};
  return {
    [categoryName as string]: {
      label: categoryName as string,
      color: colors.value[0],
    },
  };
});

const legendItems = ref<BulletLegendItemInterface[]>(
  props.categories.map((category, i) => ({
    name: category,
    color: colors.value[i],
    inactive: false,
  }))
);

const isMounted = useMounted();

function _handleLegendItemClick(d: BulletLegendItemInterface, i: number) {
  emits("legendItemClick", d, i);
}
</script>

<template>
  <div
    :class="cn('w-full h-[400px] flex flex-col items-end', $attrs.class ?? '')"
    :style="{
      '--vis-tooltip-padding': '0px',
      '--vis-tooltip-background-color': 'transparent',
      '--vis-tooltip-border-color': 'transparent',
      '--vis-tooltip-text-color': 'none',
      '--vis-tooltip-shadow-color': 'none',
      '--vis-tooltip-backdrop-filter': 'none',
    }"
  >
    <!-- <ChartLegend v-if="showLegend" v-model:items="legendItems" @legend-item-click="handleLegendItemClick" /> -->

    <VisXYContainer
      :margin="{ left: 20, right: 20 }"
      :data="data"
      :x-domain="[0, Math.max(0, data.length - 1)]"
      :style="{ height: isMounted ? '100%' : 'auto' }"
    >
      <ChartTooltip />
      <ChartCrosshair
        v-if="showTooltip"
        :colors="colors"
        :items="legendItems"
        :index="index"
        :template="
          componentToString(chartConfig, ChartTooltipContent, {
            indicator: Object.keys(chartConfig).length > 1 ? 'line' : 'dot',
            labelFormatter(d) {
              if (props.tooltipLabelFormatter) {
                const idx = typeof d === 'number' ? Math.floor(d) : 0;
                const item = data[idx];
                const raw = item && item[index] != null ? item[index] : d;
                return props.tooltipLabelFormatter(raw);
              }
              const idx = typeof d === 'number' ? Math.floor(d) : 0;
              const item = data[idx];
              if (item && item[index]) {
                return `날짜: ${item[index]}`;
              }
              return `날짜: ${d}`;
            },
          })
        "
      />

      <template v-for="(cat, i) in categories" :key="cat">
        <VisLine
          :x="(_d: Data, idx: number) => idx"
          :y="(d: Data) => d[cat]"
          :curve-type="curveType"
          :color="colors[i]"
          :attributes="{
            [Line.selectors.line]: {
              opacity: legendItems.find((item) => item.name === cat)?.inactive
                ? filterOpacity
                : 1,
            },
          }"
        />
        <VisScatter
          v-if="showDots"
          :x="(_d: Data, idx: number) => idx"
          :y="(d: Data) => d[cat]"
          :color="colors[i]"
          :size="6"
        />
      </template>

      <VisAxis
        v-if="showXAxis"
        type="x"
        :tick-format="
          (v: number) => {
            if (xAxisIntegerTicksOnly && !Number.isInteger(v)) return '';
            const idx = Number.isInteger(v) ? v : Math.floor(v);
            const item = data[idx];
            if (item && item[index]) {
              const dateStr = item[index] as string;
              const parts = dateStr.split('.');
              if (parts.length >= 3) {
                return parts[1] + '.' + parts[2]; // MM.DD 형식
              }
              return dateStr;
            }
            return Number.isInteger(v) ? String(v) : '';
          }
        "
        :num-ticks="xAxisTicks"
        :grid-line="showXGridLine"
        :tick-line="false"
        :domain-line="false"
        tick-text-color="var(--muted-foreground)"
      />
      <VisAxis
        v-if="showYAxis"
        type="y"
        :tick-line="false"
        :tick-format="yFormatter"
        :domain-line="false"
        :grid-line="showGridLine"
        :attributes="{
          [Axis.selectors.grid]: {
            class: 'line-chart-axis-grid',
          },
        }"
        tick-text-color="var(--muted-foreground)"
      />

      <slot />
    </VisXYContainer>
  </div>
</template>
