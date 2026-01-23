<script setup lang="ts">
import { onUnmounted, ref, watch } from "vue"
import type { PeriodType } from "@/composables/useChartData"
import { useChartData } from "@/composables/useChartData"
import StatsCards from "@/components/dashboard/StatsCards.vue"
import ChartSection from "@/components/dashboard/ChartSection.vue"
import RecentActivities from "@/components/dashboard/RecentActivities.vue"
import SystemStatus from "@/components/dashboard/SystemStatus.vue"
import QuickActions from "@/components/dashboard/QuickActions.vue"
// Skeleton 컴포넌트는 shadcn-vue에서 제공되지 않으므로 간단한 로딩 표시로 대체

const props = defineProps<{
  isVisible: boolean
}>()

defineEmits<{
  (e: "back-to-chat"): void
}>()

// 임시 대시보드 데이터
const stats = [
  { title: "총 대화 수", value: 1234, change: "+12%", changeType: "positive" as const },
  { title: "활성 사용자", value: 567, change: "+8%", changeType: "positive" as const },
  { title: "평균 응답 시간", value: 2.3, change: "-5%", changeType: "positive" as const },
  { title: "만족도 점수", value: 4.8, change: "+2%", changeType: "positive" as const },
]

// 애니메이션용 값들
const animatedValues = ref<number[]>(stats.map(() => 0))
const isLoading = ref(false)
let animationIntervals: number[] = []


// 숫자 카운트업 애니메이션
const startCountUp = () => {
  stats.forEach((stat, index) => {
    const targetValue = stat.value
    const duration = 1500 // 1.5초
    const steps = 60 // 60fps
    const increment = targetValue / steps
    let currentValue = 0

    const interval = setInterval(() => {
      currentValue += increment
      if (currentValue >= targetValue) {
        currentValue = targetValue
        clearInterval(interval)
      }
      animatedValues.value[index] = Math.floor(currentValue)
    }, duration / steps)

    animationIntervals.push(interval)
  })
}

// 대시보드가 표시될 때마다 애니메이션 재실행
watch(() => props.isVisible, (isVisible) => {
  if (isVisible) {
    isLoading.value = true

    // 기존 애니메이션 정리
    animationIntervals.forEach(interval => clearInterval(interval))
    animationIntervals = []
    animatedValues.value = stats.map(() => 0)

    // 약간의 지연 후 새 애니메이션 시작
    setTimeout(() => {
      isLoading.value = false
      startCountUp()
    }, 300)
  }
}, { immediate: true })

// 컴포넌트 언마운트 시 interval 정리
onUnmounted(() => {
  animationIntervals.forEach(interval => clearInterval(interval))
  animationIntervals = []
})


const recentActivities = [
  { action: "새 대화 시작", user: "김철수", time: "방금 전" },
  { action: "피드백 제출", user: "이영희", time: "5분 전" },
  { action: "설정 변경", user: "박민수", time: "10분 전" },
  { action: "로그아웃", user: "정수진", time: "15분 전" },
]

// 기간 선택 옵션
const periodOptions: Array<{ value: PeriodType; label: string }> = [
  { value: 7, label: "7일" },
  { value: 15, label: "15일" },
  { value: 30, label: "30일" },
]

// 선택된 기간 (기본값: 7일)
const selectedPeriod = ref<PeriodType>(7)

// 차트 데이터 관련
const { fetchDailyUsageData } = useChartData()
const chartData = ref<Array<{ date: string; usage: number }>>([])
const isChartLoading = ref(false)

// 차트 데이터 로딩 함수
const loadChartData = async (period: PeriodType) => {
  try {
    isChartLoading.value = true
    const data = await fetchDailyUsageData(period)
    console.log('차트 데이터 로드됨:', data)
    chartData.value = data
  } catch (error) {
    console.error('차트 데이터 로딩 실패:', error)
    // 에러 시 빈 배열로 설정
    chartData.value = []
  } finally {
    isChartLoading.value = false
  }
}

// 기간 변경 시 차트 데이터 다시 로딩
watch(selectedPeriod, (newPeriod) => {
  loadChartData(newPeriod)
}, { immediate: true })

</script>

<template>
  <div class="p-6 max-w-7xl mx-auto space-y-6">
    <!-- 헤더 -->
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-4">
        <div>
          <h1 class="text-3xl font-bold text-gray-900 dark:text-white">대시보드</h1>
          <p class="text-gray-600 dark:text-gray-400">AI 사용량 통계 및 분석</p>
        </div>
      </div>
    </div>

    <!-- 통계 카드들 -->
    <StatsCards :stats="stats" :animated-values="animatedValues" :is-loading="isLoading" />

    <!-- 차트와 최근 활동 -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- 차트 영역 -->
      <ChartSection
        :selected-period="selectedPeriod"
        :period-options="periodOptions"
        :chart-data="chartData"
        :is-loading="isLoading"
        :is-chart-loading="isChartLoading"
        @update:selectedPeriod="selectedPeriod = $event"
      />

      <!-- 최근 활동 -->
      <RecentActivities :recent-activities="recentActivities" :is-loading="isLoading" />
    </div>

    <!-- 추가 섹션 -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <!-- 시스템 상태 -->
      <SystemStatus :is-loading="isLoading" />

      <!-- 빠른 액션 -->
      <QuickActions :is-loading="isLoading" />
    </div>
  </div>
</template>