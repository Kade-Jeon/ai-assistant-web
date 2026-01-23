<script setup lang="ts" generic="T extends Record<string, any>">
import type { BulletLegendItemInterface } from "@unovis/ts"
import type { Component } from "vue"
import type { BaseChartProps } from "."
import { Axis, CurveType, Line } from "@unovis/ts"

import { VisAxis, VisLine, VisScatter, VisXYContainer } from "@unovis/vue"
import { useMounted } from "@vueuse/core"
import { computed, ref } from "vue"
import { cn } from "@/lib/utils"
import { ChartCrosshair, ChartTooltip, ChartTooltipContent, componentToString, defaultColors } from '@/components/ui/chart'

const props = withDefaults(defineProps<BaseChartProps<T> & {
  /**
   * Render custom tooltip component.
   */
  customTooltip?: Component
  /**
   * Type of curve
   */
  curveType?: CurveType
  /**
   * Show dots/points on the line
   */
  showDots?: boolean
  /**
   * Selected period for tick calculation
   */
  selectedPeriod?: number
}>(), {
  curveType: CurveType.MonotoneX,
  filterOpacity: 0.2,
  margin: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
  showXAxis: true,
  showYAxis: true,
  showTooltip: true,
  showLegend: true,
  showGridLine: true,
  showDots: false,
})

const emits = defineEmits<{
  legendItemClick: [d: BulletLegendItemInterface, i: number]
}>()

type KeyOfT = Extract<keyof T, string>
type Data = typeof props.data[number]

const index = computed(() => props.index as KeyOfT)
const category = computed(() => props.categories[0] as KeyOfT)
const colors = computed(() => props.colors?.length ? props.colors : defaultColors(props.categories.length))

// X축 tick 개수 계산
const xAxisTicks = computed(() => {
  const period = props.selectedPeriod || 7
  return period / 2 + 1  // 선택된 기간 + 1
})


// Chart config for tooltip
const chartConfig = computed(() => {
  const categoryName = props.categories[0]
  if (!categoryName) return {}
  return {
    [categoryName as string]: {
      label: categoryName as string,
      color: colors.value[0],
    },
  }
})

const legendItems = ref<BulletLegendItemInterface[]>(props.categories.map((category, i) => ({
  name: category,
  color: colors.value[i],
  inactive: false,
})))

const isMounted = useMounted()

function handleLegendItemClick(d: BulletLegendItemInterface, i: number) {
  emits("legendItemClick", d, i)
}
</script>

<template>
  <div :class="cn('w-full h-[400px] flex flex-col items-end', $attrs.class ?? '')">
    <!-- <ChartLegend v-if="showLegend" v-model:items="legendItems" @legend-item-click="handleLegendItemClick" /> -->

    <VisXYContainer
      :margin="{ left: 20, right: 20 }"
      :data="data"
      :style="{ height: isMounted ? '100%' : 'auto' }"
    >
      <ChartTooltip />
      <ChartCrosshair
        v-if="showTooltip"
        :colors="colors"
        :items="legendItems"
        :index="index"
        :template="componentToString(chartConfig, ChartTooltipContent, {
          labelFormatter(d) {
            // d는 인덱스 값, 이를 사용해서 데이터에서 날짜를 찾음
            const item = data[Math.floor(d)];
            if (item && item[index]) {
              return `날짜: ${item[index]}`;
            }
            return `날짜: ${d}`;
          }
        })"
      />

      <template v-for="(category, i) in categories" :key="category">
        <VisLine
          :x="(d: Data, i: number) => i"
          :y="(d: Data) => d[category]"
          :curve-type="curveType"
          :color="colors[i]"
          :attributes="{
            [Line.selectors.line]: {
              opacity: legendItems.find(item => item.name === category)?.inactive ? filterOpacity : 1,
            },
          }"
        />
        <VisScatter
          v-if="showDots"
          :x="(d: Data, i: number) => i"
          :y="(d: Data) => d[category]"
          :color="colors[i]"
          :size="6"
        />
      </template>

      <VisAxis
        v-if="showXAxis"
        type="x"
        :tick-format="(v: number) => {
          const item = data[v];
          if (item && item[index]) {
            const dateStr = item[index] as string;
            const parts = dateStr.split('.');
            if (parts.length >= 3) {
              return parts[1] + '.' + parts[2]; // MM.DD 형식
            }
            return dateStr;
          }
          return v.toString();
        }"
        :num-ticks="xAxisTicks"
        :grid-line="false"
        :tick-line="false"
        tick-text-color="#000000"
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
            class: 'text-muted',
          },
        }"
        tick-text-color="#000000"
      />

      <slot />
    </VisXYContainer>
  </div>
</template>
