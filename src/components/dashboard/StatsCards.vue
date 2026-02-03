<script setup lang="ts">
interface Stat {
  title: string;
  value: number;
  change: string;
  changeType: "positive" | "negative";
}

defineProps<{
  stats: Stat[];
  animatedValues: number[];
  isLoading: boolean;
}>();

const formatNumber = (num: number): string => {
  if (num >= 1000) return num.toLocaleString();
  return num.toFixed(1);
};

/** 이번 달 비용 등 달러 표시용 */
const formatDollar = (num: number): string => {
  const formatted = num.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 4,
  });
  return `$${formatted}`;
};
</script>

<template>
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
    <div
      v-for="i in 4"
      :key="i"
      class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700"
    >
      <div class="flex items-center justify-between">
        <div class="space-y-2">
          <div
            v-if="isLoading"
            class="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"
          />
          <div v-else class="space-y-1">
            <p class="text-sm font-medium text-gray-600 dark:text-gray-400">
              {{ stats[i - 1]?.title }}
            </p>
            <!-- 오늘 비용 / 이번 달 비용: $ 달러 표시 -->
            <p
              v-if="
                stats[i - 1]?.title === '오늘 비용' ||
                stats[i - 1]?.title === '이번 달 비용'
              "
              class="text-2xl font-bold text-gray-900 dark:text-white"
            >
              {{ formatDollar(animatedValues[i - 1] ?? 0) }}
            </p>
            <p v-else class="text-2xl font-bold text-gray-900 dark:text-white">
              {{ formatNumber(animatedValues[i - 1] ?? 0) }}
            </p>
          </div>
        </div>
        <div
          v-if="isLoading"
          class="h-5 w-12 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"
        />
        <div
          v-else-if="stats[i - 1]?.change"
          :class="
            stats[i - 1]?.changeType === 'positive'
              ? 'text-green-600'
              : 'text-red-600'
          "
          class="text-sm font-medium"
        >
          {{ stats[i - 1]?.change }}
        </div>
      </div>
    </div>
  </div>
</template>
