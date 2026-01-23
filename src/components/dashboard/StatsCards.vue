<script setup lang="ts">
interface Stat {
  title: string
  value: number
  change: string
  changeType: 'positive' | 'negative'
}

defineProps<{
  stats: Stat[]
  animatedValues: number[]
  isLoading: boolean
}>()

// 숫자 포맷팅 함수
const formatNumber = (num: number): string => {
  if (num >= 1000) {
    return num.toLocaleString()
  }
  return num.toFixed(1) // 소수점 한 자리까지 표시
}
</script>

<template>
  <!-- 통계 카드들 -->
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
    <div
      v-for="i in 4"
      :key="i"
      class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700"
    >
      <div class="flex items-center justify-between">
        <div class="space-y-2">
          <div v-if="isLoading" class="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
          <div v-else></div>
          <div v-if="isLoading">
            <div class="h-8 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
          </div>
          <div v-else class="space-y-1">
            <p class="text-sm font-medium text-gray-600 dark:text-gray-400">{{ stats[i - 1]?.title }}</p>
            <p class="text-2xl font-bold text-gray-900 dark:text-white">{{ formatNumber(animatedValues[i - 1] || 0) }}</p>
          </div>
        </div>
        <div v-if="isLoading">
          <div class="h-5 w-12 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
        </div>
        <div v-else :class="stats[i - 1]?.changeType === 'positive' ? 'text-green-600' : 'text-red-600'" class="text-sm font-medium">
          {{ stats[i - 1]?.change }}
        </div>
      </div>
    </div>
  </div>
</template>