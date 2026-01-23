// 일별 사용량 차트 데이터 composable
// 실제 백엔드 연동 시 교체 예정

// 날짜 포맷팅 헬퍼 함수
const formatDateString = (date: Date): string => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}.${month}.${day}`
}

// 임시 mock 데이터 생성 함수
const generateMockUsageData = (days: number): Array<{ date: string; usage: number }> => {
  const data = []
  const today = new Date()

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(today.getDate() - i)

    // 랜덤 사용량 생성 (0-1000 범위)
    const baseUsage = 200 + Math.random() * 600
    // 주말에는 사용량이 적도록 조정
    const isWeekend = date.getDay() === 0 || date.getDay() === 6
    const usage = isWeekend ? baseUsage * 0.7 : baseUsage

    data.push({
      date: formatDateString(date),
      usage: Math.round(usage)
    })
  }

  return data
}

// 실제 API 호출처럼 약간의 지연을 주기 위한 헬퍼 함수
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

export type PeriodType = 7 | 15 | 30

export const useChartData = () => {
  /**
   * 지정된 기간의 일별 사용량 데이터를 조회합니다.
   * 실제 백엔드에서는 /api/analytics/daily-usage 엔드포인트로 호출될 예정입니다.
   */
  const fetchDailyUsageData = async (period: PeriodType): Promise<Array<{ date: string; usage: number }>> => {
    try {
      // 실제 API 호출 시뮬레이션
      await delay(300)

      // 임시 mock 데이터 반환
      return generateMockUsageData(period)
    } catch (error) {
      console.error(`일별 사용량 데이터 조회 실패 (${period}일):`, error)
      throw new Error('일별 사용량 데이터를 불러오는데 실패했습니다.')
    }
  }

  return {
    fetchDailyUsageData
  }
}