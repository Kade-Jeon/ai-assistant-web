<script setup lang="ts">
import { computed } from "vue";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const props = defineProps<{
  userPlan?: string | null;
}>();

type PlanId = "FREE" | "PRO" | "PREMIUM";

interface PlanItem {
  id: PlanId;
  name: string;
  price: string;
  description: string;
  features: string[];
  ctaLabel: string;
  ctaPrimary: boolean;
}

const plans: PlanItem[] = [
  {
    id: "FREE",
    name: "Free",
    price: "무료",
    description: "일상적인 작업을 위한 기본 인텔리전스",
    features: [
      "기본 AI 채팅 이용",
      "제한된 메시지 및 업로드",
      "채팅 기록 저장",
      "웹 및 모바일 액세스",
    ],
    ctaLabel: "Free 사용하기",
    ctaPrimary: false,
  },
  {
    id: "PRO",
    name: "Pro",
    price: "₩19,000/월",
    description: "향상된 한도로 끊김 없는 대화",
    features: [
      "Free 플랜의 모든 기능 포함",
      "확대된 메시지 및 업로드 한도",
      "우선 응답 속도",
      "심층 리서치 및 고급 기능",
    ],
    ctaLabel: "Pro 사용하기",
    ctaPrimary: false,
  },
  {
    id: "PREMIUM",
    name: "Premium",
    price: "₩39,000/월",
    description: "최상위 기능을 모두 제공하는 플랜",
    features: [
      "Pro 플랜의 모든 기능 포함",
      "무제한 메시지 및 업로드",
      "최고 우선순위 응답",
      "전용 고객 지원",
    ],
    ctaLabel: "Premium 사용하기",
    ctaPrimary: false,
  },
];

const normalizedUserPlan = computed(() => {
  const raw = props.userPlan?.trim();
  if (!raw) return null;
  const plan = raw.toUpperCase();
  if (plan === "FREE" || plan === "PRO" || plan === "PREMIUM") return plan;
  if (plan === "FREE PLAN" || plan.includes("FREE")) return "FREE";
  if (plan.includes("PREMIUM")) return "PREMIUM";
  if (plan.includes("PRO")) return "PRO";
  return null;
});

const isCurrentPlan = (planId: PlanId) => normalizedUserPlan.value === planId;

const isComingSoon = (planId: PlanId) =>
  planId === "PRO" || planId === "PREMIUM";
</script>

<template>
  <div
    class="flex flex-col min-h-0 flex-1 overflow-y-auto bg-background justify-center"
  >
    <div class="px-4 py-8 sm:px-6 lg:px-8">
      <header class="mx-auto max-w-3xl text-center mb-10 sm:mb-12">
        <h1
          class="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl"
        >
          가격
        </h1>
        <p class="mt-2 text-sm text-muted-foreground sm:text-base">
          플랜을 자세히 비교해 보세요
        </p>
      </header>

      <div class="mx-auto grid max-w-5xl gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <article v-for="plan in plans" :key="plan.id" class="flex flex-col">
          <Card
            :class="[
              'flex h-full flex-col transition-shadow',
              plan.ctaPrimary &&
                !isComingSoon(plan.id) &&
                'ring-2 ring-primary',
              isComingSoon(plan.id)
                ? 'opacity-75 bg-muted/50 hover:shadow-none'
                : 'hover:shadow-md',
            ]"
          >
            <CardHeader class="pb-4">
              <div class="flex items-center gap-2 flex-wrap">
                <CardTitle class="text-lg">{{ plan.name }}</CardTitle>
                <span
                  v-if="isCurrentPlan(plan.id)"
                  class="rounded-full bg-primary/15 px-2 py-0.5 text-xs font-medium text-primary"
                >
                  사용중
                </span>
                <span
                  v-if="isComingSoon(plan.id)"
                  class="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground"
                >
                  Coming soon
                </span>
              </div>
              <CardDescription
                class="mt-1 text-base font-medium text-foreground"
              >
                {{ plan.price }}
              </CardDescription>
              <p class="text-sm text-muted-foreground">
                {{ plan.description }}
              </p>
            </CardHeader>
            <CardContent class="flex-1 space-y-4">
              <ul class="space-y-2 text-sm text-muted-foreground">
                <li
                  v-for="(feature, index) in plan.features"
                  :key="index"
                  class="flex items-start gap-2"
                >
                  <span class="mt-0.5 text-primary" aria-hidden="true">✓</span>
                  <span>{{ feature }}</span>
                </li>
              </ul>
            </CardContent>
            <CardFooter class="pt-4">
              <Button
                :variant="
                  plan.ctaPrimary && !isComingSoon(plan.id)
                    ? 'default'
                    : 'outline'
                "
                class="w-full"
                :disabled="isComingSoon(plan.id)"
              >
                {{ plan.ctaLabel }}
              </Button>
            </CardFooter>
          </Card>
        </article>
      </div>

      <p
        class="mx-auto mt-8 max-w-2xl text-center text-xs text-muted-foreground"
      >
        기존 플랜이 있으신가요?
        <a href="#" class="underline hover:text-foreground">결제 도움말 보기</a>
      </p>
    </div>
  </div>
</template>
