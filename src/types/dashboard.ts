/**
 * 대시보드 Observation API 응답 타입 (백엔드 ObservationDto와 동일 구조)
 */
export interface ObservationUsageDto {
  unit?: string | null;
  input?: number | null;
  output?: number | null;
  total?: number | null;
}

/** costDetails / usageDetails의 input, output, total 등 */
export type ObservationMap = Record<string, unknown>;

export interface ObservationDto {
  id?: string | null;
  traceId?: string | null;
  startTime?: string | null;
  projectId?: string | null;
  parentObservationId?: string | null;
  type?: string | null;
  environment?: string | null;
  endTime?: string | null;
  name?: string | null;
  level?: string | null;
  statusMessage?: string | null;
  version?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  input?: unknown;
  output?: unknown;
  model?: string | null;
  modelParameters?: unknown;
  completionStartTime?: string | null;
  promptId?: string | null;
  promptName?: string | null;
  promptVersion?: string | null;
  latency?: number | null;
  timeToFirstToken?: number | null;
  usageDetails?: ObservationMap | null;
  costDetails?: ObservationMap | null;
  usagePricingTierId?: string | null;
  usagePricingTierName?: string | null;
  modelId?: string | null;
  inputPrice?: number | null;
  outputPrice?: number | null;
  totalPrice?: number | null;
  calculatedInputCost?: number | null;
  calculatedOutputCost?: number | null;
  calculatedTotalCost?: number | null;
  unit?: string | null;
  promptTokens?: number | null;
  completionTokens?: number | null;
  totalTokens?: number | null;
  usage?: ObservationUsageDto | null;
}

/** costDetails에서 input, output, total 추출용 */
export interface CostDetailNumbers {
  input: number;
  output: number;
  total: number;
}

/** 일별 사용량 (토큰) - 차트 및 툴팁용 */
export interface DailyUsageItem {
  date: string;
  total: number;
  input: number;
  output: number;
}

/** 일별 비용 (costDetails) - 차트용 */
export interface DailyCostItem {
  date: string;
  input: number;
  output: number;
  total: number;
}
