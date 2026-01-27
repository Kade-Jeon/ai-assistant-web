<script setup lang="ts">
import { watch, onUnmounted } from "vue";
import { useApiError } from "@/composables/useApiError";
import { X } from "lucide-vue-next";

const AUTO_CLOSE_MS = 5000;

const { currentToast, clearApiError } = useApiError();
let autoCloseTimer: ReturnType<typeof setTimeout> | null = null;

function clearTimer() {
  if (autoCloseTimer) {
    clearTimeout(autoCloseTimer);
    autoCloseTimer = null;
  }
}

watch(
  currentToast,
  (toast) => {
    clearTimer();
    if (toast) {
      autoCloseTimer = setTimeout(() => {
        clearApiError();
        autoCloseTimer = null;
      }, AUTO_CLOSE_MS);
    }
  },
  { immediate: true },
);

onUnmounted(clearTimer);
</script>

<template>
  <Teleport to="#chat-toast-container">
    <Transition
      enter-active-class="transition duration-200 ease-out"
      leave-active-class="transition duration-150 ease-in"
      enter-from-class="opacity-0 scale-95"
      enter-to-class="opacity-100 scale-100"
      leave-from-class="opacity-100 scale-100"
      leave-to-class="opacity-0 scale-95"
    >
      <div
        v-if="currentToast"
        class="pointer-events-auto relative flex w-full max-w-sm flex-col overflow-hidden rounded-lg border-0 px-4 py-3 text-white shadow-lg"
        :class="currentToast.type === 'error' ? 'bg-red-300' : 'bg-blue-300'"
        role="alert"
      >
        <div class="flex items-start gap-3">
          <p class="min-w-0 flex-1 text-sm font-bold">
            {{ currentToast.message }}
          </p>
          <button
            type="button"
            class="shrink-0 rounded p-1 text-white/80 hover:bg-slate-200 hover:text-zinc-800"
            aria-label="닫기"
            @click="clearApiError"
          >
            <X class="h-4 w-4" />
          </button>
        </div>
        <div
          class="absolute bottom-0 left-0 h-0.5 rounded-b-lg bg-white/60 toast-progress"
          :style="{ animationDuration: `${AUTO_CLOSE_MS}ms` }"
          aria-hidden="true"
        />
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.toast-progress {
  animation: toast-shrink linear forwards;
}
@keyframes toast-shrink {
  from {
    width: 0%;
  }
  to {
    width: 100%;
  }
}
</style>
