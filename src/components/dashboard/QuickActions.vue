<script setup lang="ts">
interface QuickAction {
  title: string
  description: string
}

defineProps<{
  isLoading: boolean
}>()

// 빠른 액션 데이터
const quickActions: QuickAction[] = [
  {
    title: "새 공지사항 작성",
    description: "사용자에게 중요한 업데이트를 알리세요"
  },
  {
    title: "시스템 유지보수",
    description: "예정된 다운타임 및 업데이트 일정"
  },
  {
    title: "사용자 피드백 확인",
    description: "최근 사용자 의견 및 제안사항"
  }
]
</script>

<template>
  <!-- 빠른 액션 -->
  <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
    <div v-if="isLoading" class="space-y-3">
      <div class="h-6 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-4"></div>
      <div v-for="i in 3" :key="i" class="p-3 rounded-lg border border-gray-200 dark:border-gray-700">
        <div class="h-5 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-1"></div>
        <div class="h-4 w-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
      </div>
    </div>
    <div v-else>
      <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">빠른 액션</h2>
      <div class="space-y-3">
        <button
          v-for="action in quickActions"
          :key="action.title"
          class="w-full text-left p-3 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          <div class="font-medium text-gray-900 dark:text-white">{{ action.title }}</div>
          <div class="text-sm text-gray-600 dark:text-gray-400">{{ action.description }}</div>
        </button>
      </div>
    </div>
  </div>
</template>