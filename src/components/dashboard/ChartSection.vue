<script setup lang="ts">
import { ref, watch } from "vue"
import type { PeriodType } from "@/composables/useChartData"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { LineChart } from "@/components/ui/chart-line"

const props = defineProps<{
  selectedPeriod: PeriodType
  periodOptions: Array<{ value: PeriodType; label: string }>
  chartData: Array<{ date: string; usage: number }>
  isLoading: boolean
  isChartLoading: boolean
}>()

const emit = defineEmits<{
  (e: "update:selectedPeriod", value: PeriodType): void
}>()

// 로컬 상태로 selectedPeriod 관리
const localSelectedPeriod = ref<PeriodType>(props.selectedPeriod)

// props 변경 시 로컬 상태 업데이트
watch(() => props.selectedPeriod, (newValue) => {
  localSelectedPeriod.value = newValue
}, { immediate: true })

// 로컬 상태 변경 시 부모에게 emit
watch(localSelectedPeriod, (newValue) => {
  if (newValue !== props.selectedPeriod) {
    emit('update:selectedPeriod', newValue)
  }
})
</script>

<template>
  <!-- 차트 영역 -->
  <div class="lg:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
    <div v-if="isLoading" class="space-y-4">
      <div class="h-6 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
      <div class="flex items-end justify-between h-64">
        <div v-for="i in 6" :key="i" class="w-8 h-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" :class="i % 2 === 0 ? 'h-24' : 'h-40'"></div>
      </div>
    </div>
    <div v-else>
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-4">
        <h2 class="text-lg font-semibold text-gray-900 dark:text-white">일별 사용량</h2>
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
      <div v-if="isChartLoading" class="h-48 sm:h-64 flex items-center justify-center">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
      <div v-else-if="chartData.length === 0" class="h-48 sm:h-64 flex items-center justify-center text-gray-500">
        데이터를 불러올 수 없습니다.
      </div>
      <LineChart
        v-else
        :data="chartData"
        :categories="['usage']"
        index="date"
        :colors="['#3b82f6']"
        class="h-48 sm:h-64"
        :show-legend="false"
        :show-x-axis="true"
        :show-y-axis="true"
        :show-dots="true"
        :show-tooltip="true"
        :selected-period="selectedPeriod"
      />
    </div>
  </div>
</template>