/**
 * 대시보드 데이터: ObservationDto 목록을 조회하고 SPAN/GENERATION별로 집계합니다.
 * - SPAN: latency → API 평균 응답시간
 * - GENERATION: costDetails, model, usage → 비용/최근 모델/일별 토큰 사용량
 */
import { computed, ref } from "vue";
import { useApi } from "@/composables/useApi";
import type {
  ObservationDto,
  CostDetailNumbers,
  DailyUsageItem,
  DailyCostItem,
} from "@/types/dashboard";
import type { PeriodType } from "@/composables/useChartData";

const MODEL_TOP_N = 5;

/**
 * GET /api/v1/ai/stat 응답을 ObservationDto[]로 정규화합니다.
 * 응답이 배열이면 그대로, { observations: [] } 형태면 observations 사용.
 */
function normalizeToObservationList(data: unknown): ObservationDto[] {
  if (Array.isArray(data)) return data as ObservationDto[];
  if (data && typeof data === "object" && "observations" in data) {
    const obs = (data as { observations: unknown }).observations;
    return Array.isArray(obs) ? (obs as ObservationDto[]) : [];
  }
  return [];
}

function toNum(v: unknown): number {
  if (v == null) return 0;
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function parseObservationDate(obs: ObservationDto): string | null {
  const raw =
    obs.endTime ?? obs.startTime ?? obs.createdAt ?? obs.updatedAt ?? null;
  if (raw == null) return null;
  let d: Date;
  if (typeof raw === "number") {
    d = new Date(Number(raw) < 1e12 ? raw * 1000 : raw);
  } else if (typeof raw === "string") {
    d = new Date(raw);
  } else {
    return null;
  }
  if (Number.isNaN(d.getTime())) return null;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}.${m}.${day}`;
}

function getCostFromDetails(
  costDetails: ObservationDto["costDetails"]
): CostDetailNumbers {
  if (!costDetails || typeof costDetails !== "object") {
    return { input: 0, output: 0, total: 0 };
  }
  const input = toNum(costDetails.input);
  const output = toNum(costDetails.output);
  const total = toNum(costDetails.total);
  return {
    input,
    output,
    total: total > 0 ? total : input + output,
  };
}

/** usageDetails에서 input, output, total 추출 (오늘 사용량은 usageDetails.total 합산) */
function getUsageFromDetails(
  usageDetails: ObservationDto["usageDetails"]
): { input: number; output: number; total: number } {
  if (!usageDetails || typeof usageDetails !== "object") {
    return { input: 0, output: 0, total: 0 };
  }
  const input = toNum(usageDetails.input);
  const output = toNum(usageDetails.output);
  const total = toNum(usageDetails.total);
  return {
    input,
    output,
    total: total > 0 ? total : input + output,
  };
}

/** GENERATION 한 건의 비용 (costDetails 우선, 없으면 DTO 상단 필드 사용) */
function getCostFromObservation(obs: ObservationDto): CostDetailNumbers {
  const fromDetails = getCostFromDetails(obs.costDetails);
  if (
    fromDetails.total > 0 ||
    fromDetails.input > 0 ||
    fromDetails.output > 0
  ) {
    return fromDetails;
  }
  const input = toNum(obs.calculatedInputCost);
  const output = toNum(obs.calculatedOutputCost);
  const total = toNum(obs.calculatedTotalCost);
  return {
    input,
    output,
    total: total > 0 ? total : input + output,
  };
}

function getUsageFromObservation(obs: ObservationDto): {
  input: number;
  output: number;
  total: number;
} {
  const u = obs.usage;
  if (u && typeof u === "object") {
    return {
      input: toNum(u.input),
      output: toNum(u.output),
      total:
        toNum(u.total) ||
        toNum(obs.totalTokens) ||
        toNum(obs.promptTokens) + toNum(obs.completionTokens),
    };
  }
  return {
    input: toNum(obs.promptTokens),
    output: toNum(obs.completionTokens),
    total:
      toNum(obs.totalTokens) ||
      toNum(obs.promptTokens) + toNum(obs.completionTokens),
  };
}

export interface DashboardAggregates {
  /** SPAN 평균 latency (ms) */
  averageLatencyMs: number;
  /** SPAN latency p95 (ms) */
  p95LatencyMs: number;
  /** SPAN latency p99 (ms) */
  p99LatencyMs: number;
  /** SPAN 중 level=ERROR 비율 (0~100) */
  spanErrorRatePercent: number;
  /** GENERATION costDetails 합계 (전체) */
  costTotal: number;
  costInput: number;
  costOutput: number;
  /** 매월 1일 ~ 현재 costDetails 합계 */
  monthCostTotal: number;
  monthCostInput: number;
  monthCostOutput: number;
  /** 모델별 사용 비중 Top 5 + others (이름, 비율 0~100) */
  modelUsageShare: Array<{ model: string; percent: number }>;
  /** 일별 토큰 사용량 (total, input, output) */
  dailyUsage: DailyUsageItem[];
  /** 이번 달 1일~오늘 일별 비용 (input, output, total) */
  dailyCostThisMonth: DailyCostItem[];
  /** 오늘 비용 (costDetails total), 전날 대비 변화율 */
  todayCost: number;
  todayCostChangePercent: number;
  /** 오늘 토큰 (usage total), 전날 대비 변화율 */
  todayTokens: number;
  todayTokensChangePercent: number;
}

export function useDashboardData() {
  const { getAiStat } = useApi();
  const observations = ref<ObservationDto[]>([]);
  const isLoading = ref(false);
  /** 기간 변경 시 해당 차트만 로딩 (어떤 셀렉트를 바꿨는지에 따라 한쪽만 표시) */
  const isUsageChartRefetching = ref(false);
  const isCostChartRefetching = ref(false);
  const error = ref<string | null>(null);

  const aggregates = computed<DashboardAggregates>(() => {
    const list = observations.value;

    const spans = list.filter((o) => String(o.type).toUpperCase() === "SPAN");
    const generations = list.filter(
      (o) => String(o.type).toUpperCase() === "GENERATION"
    );

    const latencies = spans
      .map((o) => toNum(o.latency))
      .filter((ms) => Number.isFinite(ms) && ms >= 0);
    latencies.sort((a, b) => a - b);
    let averageLatencyMs = 0;
    let p95LatencyMs = 0;
    let p99LatencyMs = 0;
    if (latencies.length > 0) {
      averageLatencyMs =
        latencies.reduce((acc, v) => acc + v, 0) / latencies.length;
      const p95Index = Math.min(
        latencies.length - 1,
        Math.ceil(0.95 * latencies.length) - 1
      );
      const p99Index = Math.min(
        latencies.length - 1,
        Math.ceil(0.99 * latencies.length) - 1
      );
      p95LatencyMs = latencies[Math.max(0, p95Index)] ?? 0;
      p99LatencyMs = latencies[Math.max(0, p99Index)] ?? 0;
    }

    const spanErrorCount = spans.filter(
      (o) => String(o.level).toUpperCase() === "ERROR"
    ).length;
    const spanErrorRatePercent =
      spans.length > 0 ? (spanErrorCount / spans.length) * 100 : 0;

    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const monthStartStr = `${year}.${month}.01`;

    let costTotal = 0;
    let costInput = 0;
    let costOutput = 0;
    let monthCostTotal = 0;
    let monthCostInput = 0;
    let monthCostOutput = 0;
    // GENERATION costDetails 기준 일별 비용 (차트: Y축 total, 막대 구성 input/output)
    const costByDate = new Map<
      string,
      { input: number; output: number; total: number }
    >();

    for (const o of generations) {
      const c = getCostFromObservation(o);
      costTotal += c.total;
      costInput += c.input;
      costOutput += c.output;

      // 이번 달 비용: costDetails.total만 사용 (매월 1일~현재)
      const detailsOnly = getCostFromDetails(o.costDetails);
      const dateStr = parseObservationDate(o);
      if (dateStr && dateStr >= monthStartStr) {
        monthCostTotal += detailsOnly.total;
        monthCostInput += detailsOnly.input;
        monthCostOutput += detailsOnly.output;
        const cur = costByDate.get(dateStr) ?? {
          input: 0,
          output: 0,
          total: 0,
        };
        costByDate.set(dateStr, {
          input: cur.input + detailsOnly.input,
          output: cur.output + detailsOnly.output,
          total: cur.total + detailsOnly.total,
        });
      }
    }

    const dailyCostThisMonth: DailyCostItem[] = [];
    for (let day = 1; day <= now.getDate(); day++) {
      const d = `${year}.${month}.${String(day).padStart(2, "0")}`;
      const cur = costByDate.get(d) ?? { input: 0, output: 0, total: 0 };
      dailyCostThisMonth.push({ date: d, ...cur });
    }

    // 모델별 사용량 비중 Top 5 + others (GENERATION only, usageDetails 기반)
    const usageByModel = new Map<string, number>();
    const normalizedModelName = (
      raw: string | null | undefined
    ): string | null => {
      const s = (raw ?? "").trim().toLowerCase();
      if (!s || s === "none" || s === "null") return null;
      return (raw ?? "").trim();
    };
    for (const o of generations) {
      const model = normalizedModelName(o.model ?? o.modelId);
      if (model == null) continue;
      const usage = getUsageFromDetails(o.usageDetails);
      const current = usageByModel.get(model) ?? 0;
      usageByModel.set(model, current + usage.total);
    }
    const totalUsage = Array.from(usageByModel.values()).reduce(
      (a, b) => a + b,
      0
    );
    const sorted = Array.from(usageByModel.entries()).sort(
      (a, b) => b[1] - a[1]
    );
    const top = sorted.slice(0, MODEL_TOP_N);
    const othersUsage = totalUsage - top.reduce((s, [, c]) => s + c, 0);
    const modelUsageShare: Array<{ model: string; percent: number }> = top.map(
      ([name, usageValue]) => ({
        model: name,
        percent: totalUsage === 0 ? 0 : (usageValue / totalUsage) * 100,
      })
    );
    if (othersUsage > 0) {
      modelUsageShare.push({
        model: "others",
        percent: totalUsage === 0 ? 0 : (othersUsage / totalUsage) * 100,
      });
    }

    // GENERATION usageDetails.total 기준 날짜별 합산 (일별 사용량 차트·오늘 사용량)
    const usageByDate = new Map<
      string,
      { input: number; output: number; total: number }
    >();
    for (const o of generations) {
      const date = parseObservationDate(o);
      if (!date) continue;
      const usage = getUsageFromDetails(o.usageDetails);
      const cur = usageByDate.get(date) ?? { input: 0, output: 0, total: 0 };
      usageByDate.set(date, {
        input: cur.input + usage.input,
        output: cur.output + usage.output,
        total: cur.total + usage.total,
      });
    }

    const dailyUsage: DailyUsageItem[] = Array.from(usageByDate.entries())
      .map(([date, u]) => ({ date, ...u }))
      .sort((a, b) => a.date.localeCompare(b.date));

    const todayStr = `${year}.${month}.${String(now.getDate()).padStart(2, "0")}`;
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = `${yesterday.getFullYear()}.${String(yesterday.getMonth() + 1).padStart(2, "0")}.${String(yesterday.getDate()).padStart(2, "0")}`;

    const todayCost = costByDate.get(todayStr)?.total ?? 0;
    const yesterdayCost = costByDate.get(yesterdayStr)?.total ?? 0;
    const todayCostChangePercent =
      yesterdayCost === 0
        ? todayCost === 0
          ? 0
          : 100
        : ((todayCost - yesterdayCost) / yesterdayCost) * 100;

    const todayTokens = usageByDate.get(todayStr)?.total ?? 0;
    const yesterdayTokens = usageByDate.get(yesterdayStr)?.total ?? 0;
    const todayTokensChangePercent =
      yesterdayTokens === 0
        ? todayTokens === 0
          ? 0
          : 100
        : ((todayTokens - yesterdayTokens) / yesterdayTokens) * 100;

    return {
      averageLatencyMs,
      p95LatencyMs,
      p99LatencyMs,
      spanErrorRatePercent,
      costTotal,
      costInput,
      costOutput,
      monthCostTotal,
      monthCostInput,
      monthCostOutput,
      modelUsageShare,
      dailyUsage,
      dailyCostThisMonth,
      todayCost,
      todayCostChangePercent,
      todayTokens,
      todayTokensChangePercent,
    };
  });

  async function fetchObservations(
    days?: 7 | 15,
    options?: { chartOnly?: "usage" | "cost" }
  ) {
    const chartOnly = options?.chartOnly;
    if (chartOnly === "usage") {
      isUsageChartRefetching.value = true;
    } else if (chartOnly === "cost") {
      isCostChartRefetching.value = true;
    } else {
      isLoading.value = true;
    }
    error.value = null;
    try {
      const data = await getAiStat(days);
      console.log("[Dashboard] API 응답:", data);
      observations.value = normalizeToObservationList(data);
    } catch (e) {
      error.value = e instanceof Error ? e.message : "데이터 조회 실패";
      observations.value = [];
    } finally {
      if (chartOnly === "usage") {
        isUsageChartRefetching.value = false;
      } else if (chartOnly === "cost") {
        isCostChartRefetching.value = false;
      } else {
        isLoading.value = false;
      }
    }
  }

  /**
   * 지정 기간(일)에 맞춰 dailyUsage를 채웁니다.
   * 비어 있는 날은 0으로 채워서 차트에 연속된 날짜를 표시합니다.
   */
  function getDailyUsageForPeriod(period: PeriodType): DailyUsageItem[] {
    const today = new Date();
    const result: DailyUsageItem[] = [];
    const map = new Map(aggregates.value.dailyUsage.map((u) => [u.date, u]));
    for (let i = period - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      const dateStr = `${y}.${m}.${day}`;
      const existing = map.get(dateStr);
      result.push(existing ?? { date: dateStr, total: 0, input: 0, output: 0 });
    }
    return result;
  }

  /**
   * 지정 기간(일)에 맞춰 일별 비용을 채웁니다.
   * GENERATION costDetails 기준으로 날짜별 합산 후, 비어 있는 날은 0으로 채웁니다.
   */
  function getDailyCostForPeriod(period: PeriodType): DailyCostItem[] {
    const list = observations.value;
    const generations = list.filter(
      (o) => String(o.type).toUpperCase() === "GENERATION"
    );
    const costByDate = new Map<
      string,
      { input: number; output: number; total: number }
    >();
    for (const o of generations) {
      const dateStr = parseObservationDate(o);
      if (!dateStr) continue;
      const c = getCostFromObservation(o);
      const cur = costByDate.get(dateStr) ?? {
        input: 0,
        output: 0,
        total: 0,
      };
      costByDate.set(dateStr, {
        input: cur.input + c.input,
        output: cur.output + c.output,
        total: cur.total + c.total,
      });
    }
    const today = new Date();
    const result: DailyCostItem[] = [];
    for (let i = period - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      const dateStr = `${y}.${m}.${day}`;
      const cur = costByDate.get(dateStr) ?? { input: 0, output: 0, total: 0 };
      result.push({ date: dateStr, ...cur });
    }
    return result;
  }

  /**
   * 해당 월 1일부터 오늘까지 일별 사용량을 채웁니다.
   * 비어 있는 날은 0으로 채워서 차트에 연속된 날짜를 표시합니다.
   */
  function getDailyUsageFromMonthStart(): DailyUsageItem[] {
    const today = new Date();
    const result: DailyUsageItem[] = [];
    const map = new Map(aggregates.value.dailyUsage.map((u) => [u.date, u]));
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const todayDate = today.getDate();
    for (let day = 1; day <= todayDate; day++) {
      const dateStr = `${year}.${month}.${String(day).padStart(2, "0")}`;
      const existing = map.get(dateStr);
      result.push(existing ?? { date: dateStr, total: 0, input: 0, output: 0 });
    }
    return result;
  }

  return {
    observations,
    isLoading,
    isUsageChartRefetching,
    isCostChartRefetching,
    error,
    aggregates,
    fetchObservations,
    getDailyUsageForPeriod,
    getDailyCostForPeriod,
    getDailyUsageFromMonthStart,
  };
}
