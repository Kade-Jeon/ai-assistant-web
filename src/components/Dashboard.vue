<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from "vue"
import type { PeriodType } from "@/composables/useChartData"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useChartData } from "@/composables/useChartData"
import { LineChart } from "@/components/ui/chart-line"
// Skeleton 컴포넌트는 shadcn-vue에서 제공되지 않으므로 간단한 로딩 표시로 대체

const props = defineProps<{
  isVisible: boolean
}>()

defineEmits<{
  (e: "back-to-chat"): void
}>()

// 임시 대시보드 데이터
const stats = [
  { title: "총 대화 수", value: 1234, change: "+12%", changeType: "positive" },
  { title: "활성 사용자", value: 567, change: "+8%", changeType: "positive" },
  { title: "평균 응답 시간", value: 2.3, change: "-5%", changeType: "positive" },
  { title: "만족도 점수", value: 4.8, change: "+2%", changeType: "positive" },
]

// 애니메이션용 값들
const animatedValues = ref<number[]>(stats.map(() => 0))
const isLoading = ref(false)
let animationIntervals: number[] = []

// 숫자 포맷팅 함수
const formatNumber = (num: number): string => {
  if (num >= 1000) {
    return num.toLocaleString()
  }
  return num.toFixed(1) // 소수점 한 자리까지 표시
}

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
const periodOptions = [
  { value: 7, label: "7일" },
  { value: 15, label: "15일" },
  { value: 30, label: "30일" },
] as const

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

    <!-- 차트와 최근 활동 -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
            <Select v-model="selectedPeriod">
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
    </div>

    <!-- 추가 섹션 -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <!-- 시스템 상태 -->
      <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div v-if="isLoading" class="space-y-3">
          <div class="h-6 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-4"></div>
          <div v-for="i in 4" :key="i" class="flex justify-between items-center">
            <div class="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
            <div class="h-4 w-12 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
          </div>
        </div>
        <div v-else>
          <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">시스템 상태</h2>
          <div class="space-y-3">
            <div class="flex justify-between items-center">
              <span class="text-sm text-gray-600 dark:text-gray-400">API 응답 시간</span>
              <span class="text-sm font-medium text-green-600">120ms</span>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-sm text-gray-600 dark:text-gray-400">서버 상태</span>
              <span class="text-sm font-medium text-green-600">정상</span>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-sm text-gray-600 dark:text-gray-400">메모리 사용률</span>
              <span class="text-sm font-medium text-yellow-600">68%</span>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-sm text-gray-600 dark:text-gray-400">디스크 사용률</span>
              <span class="text-sm font-medium text-green-600">45%</span>
            </div>
          </div>
        </div>
      </div>

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
            <button class="w-full text-left p-3 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
              <div class="font-medium text-gray-900 dark:text-white">새 공지사항 작성</div>
              <div class="text-sm text-gray-600 dark:text-gray-400">사용자에게 중요한 업데이트를 알리세요</div>
            </button>
            <button class="w-full text-left p-3 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
              <div class="font-medium text-gray-900 dark:text-white">시스템 유지보수</div>
              <div class="text-sm text-gray-600 dark:text-gray-400">예정된 다운타임 및 업데이트 일정</div>
            </button>
            <button class="w-full text-left p-3 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
              <div class="font-medium text-gray-900 dark:text-white">사용자 피드백 확인</div>
              <div class="text-sm text-gray-600 dark:text-gray-400">최근 사용자 의견 및 제안사항</div>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>