<script setup lang="ts">
import {
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuRoot,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "reka-ui";
import {
  Settings,
  User,
  Sparkles,
  SlidersHorizontal,
  HelpCircle,
  LogOut,
  ChevronRight,
  MessageCircleQuestionMark,
  NotebookPen,
  BookText,
  HeartHandshake,
  Bug,
} from "lucide-vue-next";
import { Button } from "@/components/ui/button";

defineProps<{
  userPlan?: string | null;
}>();

const emit = defineEmits<{
  (e: "plan-upgrade"): void;
  (e: "customize"): void;
  (e: "settings"): void;
  (e: "help", section?: string): void;
  (e: "logout"): void;
}>();
</script>

<template>
  <div class="border-t p-4">
    <div
      class="flex items-center gap-2 rounded-md border border-sidebar-border bg-sidebar-accent/50 px-3 py-2 text-xs"
    >
      <User class="h-4 w-4 shrink-0" />
      <div class="min-w-0 flex-1 flex flex-col">
        <span class="font-medium">kade</span>
        <span class="text-sidebar-foreground/70 text-xs">{{
          userPlan || "Free Plan"
        }}</span>
      </div>
      <DropdownMenuRoot>
        <DropdownMenuTrigger :as-child="true">
          <Button
            variant="ghost"
            size="icon"
            class="ml-auto h-7 w-7"
            aria-label="프로필 메뉴"
          >
            <Settings class="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuPortal>
          <DropdownMenuContent
            class="z-50 min-w-48 rounded-md border bg-popover p-1 text-popover-foreground shadow-md"
            side="top"
            align="end"
            :side-offset="8"
          >
            <!-- 사이드바 푸터와 동일한 프로필 영역 (톱니바퀴만 제외) -->
            <div class="flex items-center gap-2 px-2 py-2 text-xs">
              <User class="h-4 w-4 shrink-0" />
              <div class="flex flex-col">
                <span class="font-medium">kade</span>
                <span class="text-muted-foreground text-xs">{{
                  userPlan || "Free Plan"
                }}</span>
              </div>
            </div>
            <DropdownMenuSeparator
              class="my-1 h-px w-full shrink-0 bg-border"
            />
            <DropdownMenuItem
              class="flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-slate-200"
              @select="emit('plan-upgrade')"
            >
              <Sparkles class="h-4 w-4 shrink-0" />
              <span>플랜 업그레이드</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              class="flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-slate-200"
              @select="emit('customize')"
            >
              <SlidersHorizontal class="h-4 w-4 shrink-0" />
              <span>개인 맞춤 설정</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              class="flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-slate-200"
              @select="emit('settings')"
            >
              <Settings class="h-4 w-4 shrink-0" />
              <span>설정</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator
              class="my-1 h-px w-full shrink-0 bg-border"
            />
            <DropdownMenuSub>
              <DropdownMenuSubTrigger
                class="flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-slate-200 focus:bg-slate-200 data-[state=open]:bg-slate-200"
              >
                <HelpCircle class="h-4 w-4 shrink-0" />
                <span>도움말</span>
                <ChevronRight class="ml-auto h-4 w-4 shrink-0" />
              </DropdownMenuSubTrigger>
              <DropdownMenuPortal>
                <DropdownMenuSubContent
                  class="z-50 min-w-48 rounded-md border bg-popover p-1 text-popover-foreground shadow-md"
                  :side-offset="4"
                >
                  <DropdownMenuItem
                    class="flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-slate-200"
                    @select="emit('help', 'center')"
                  >
                    <MessageCircleQuestionMark class="h-4 w-4 shrink-0" />
                    <span>도움말 센터</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    class="flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-slate-200"
                    @select="emit('help', 'release-notes')"
                  >
                    <NotebookPen class="h-4 w-4 shrink-0" />
                    <span>릴리즈 노트</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    class="flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-slate-200"
                    @select="emit('help', 'terms')"
                  >
                    <BookText class="h-4 w-4 shrink-0" />
                    <span>이용약관 및 정책</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    class="flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-slate-200"
                    @select="emit('help', 'support')"
                  >
                    <HeartHandshake class="h-4 w-4 shrink-0" />
                    <span>고객센터</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    class="flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-slate-200"
                    @select="emit('help', 'bug')"
                  >
                    <Bug class="h-4 w-4 shrink-0" />
                    <span>버그신고</span>
                  </DropdownMenuItem>
                </DropdownMenuSubContent>
              </DropdownMenuPortal>
            </DropdownMenuSub>
            <DropdownMenuItem
              class="flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-slate-200"
              @select="emit('logout')"
            >
              <LogOut class="h-4 w-4 shrink-0" />
              <span>로그아웃</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenuPortal>
      </DropdownMenuRoot>
    </div>
  </div>
</template>
