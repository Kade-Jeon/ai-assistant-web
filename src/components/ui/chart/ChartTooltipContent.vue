<script setup lang="ts">
import type { HTMLAttributes } from "vue";
import type { ChartConfig } from ".";
import { computed } from "vue";
import { cn } from "@/lib/utils";

const props = withDefaults(
  defineProps<{
    hideLabel?: boolean;
    hideIndicator?: boolean;
    indicator?: "line" | "dot" | "dashed";
    nameKey?: string;
    labelKey?: string;
    labelFormatter?: (d: number | Date) => string;
    payload?: Record<string, any>;
    config?: ChartConfig;
    class?: HTMLAttributes["class"];
    color?: string;
    x?: number | Date;
  }>(),
  {
    payload: () => ({}),
    config: () => ({}),
    indicator: "dot",
  },
);

// TODO: currently we use `createElement` and `render` to render the
// const chartContext = useChart(null)

const payload = computed(() => {
  return Object.entries(props.payload)
    .map(([key, value]) => {
      // const key = `${props.nameKey || item.name || item.dataKey || "value"}`
      const itemConfig = props.config[key];
      const indicatorColor = props.config[key]?.color ?? props.payload.fill;

      return { key, value, itemConfig, indicatorColor };
    })
    .filter((i) => i.itemConfig);
});

const nestLabel = computed(
  () => Object.keys(props.payload).length === 1 && props.indicator !== "dot",
);
const tooltipLabel = computed(() => {
  if (props.hideLabel) return null;
  if (props.labelFormatter && props.x !== undefined) {
    return props.labelFormatter(props.x);
  }
  return props.labelKey
    ? props.config[props.labelKey]?.label || props.payload[props.labelKey]
    : props.x;
});
</script>

<template>
  <div
    :class="
      cn(
        'border-0 bg-background min-w-[8rem] rounded-lg px-2.5 py-1.5 text-xs shadow-xl',
        props.class,
      )
    "
  >
    <slot>
      <div
        v-if="!nestLabel && tooltipLabel"
        class="font-medium text-foreground text-center mb-2 pb-1.5 border-b border-border/50 w-full"
      >
        {{ tooltipLabel }}
      </div>
      <div class="grid gap-1.5">
        <div
          v-for="{ value, itemConfig, indicatorColor, key } in payload"
          :key="key"
          :class="
            cn(
              'grid items-center gap-2 [&>svg]:h-2.5 [&>svg]:w-2.5 [&>svg]:text-muted-foreground',
              indicator === 'line'
                ? 'grid-cols-[4px_1fr_5rem]'
                : 'grid-cols-[10px_1fr_5rem]',
            )
          "
        >
          <component
            :is="itemConfig.icon"
            v-if="itemConfig?.icon"
            class="col-span-1"
          />
          <template v-else-if="!hideIndicator">
            <div
              :class="
                cn(
                  'shrink-0 rounded-[2px] border-(--color-border) bg-(--color-bg)',
                  {
                    'h-2.5 w-2.5': indicator === 'dot',
                    'w-1 h-2.5': indicator === 'line',
                    'w-0 border-[1.5px] border-dashed bg-transparent h-2.5':
                      indicator === 'dashed',
                  },
                )
              "
              :style="{
                '--color-bg': indicatorColor,
                '--color-border': indicatorColor,
              }"
            />
          </template>
          <div class="min-w-0">
            <div v-if="nestLabel" class="font-medium text-foreground">
              {{ tooltipLabel }}
            </div>
            <span class="text-muted-foreground truncate">
              {{ itemConfig?.label || value }}
            </span>
          </div>
          <span
            v-if="value != null"
            class="text-foreground font-mono font-medium tabular-nums text-right"
          >
            {{ typeof value === "number" ? value.toLocaleString() : value }}
          </span>
        </div>
      </div>
    </slot>
  </div>
</template>
