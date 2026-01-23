<script setup lang="ts">
interface Activity {
  action: string
  user: string
  time: string
}

defineProps<{
  recentActivities: Activity[]
  isLoading: boolean
}>()
</script>

<template>
  <!-- 최근 활동 -->
  <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
    <div v-if="isLoading" class="space-y-4">
      <div class="h-6 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-4"></div>
      <div v-for="i in 4" :key="i" class="flex items-start space-x-3">
        <div class="w-2 h-2 bg-gray-200 dark:bg-gray-700 rounded-full mt-2 animate-pulse"></div>
        <div class="flex-1 space-y-2">
          <div class="h-4 w-3/4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
          <div class="h-3 w-1/2 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
        </div>
      </div>
    </div>
    <div v-else>
      <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">최근 활동</h2>
      <div class="space-y-4">
        <div
          v-for="activity in recentActivities"
          :key="activity.time"
          class="flex items-start space-x-3"
        >
          <div class="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium text-gray-900 dark:text-white">{{ activity.action }}</p>
            <p class="text-sm text-gray-600 dark:text-gray-400">{{ activity.user }} • {{ activity.time }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>