<script setup lang="ts">
import {
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuRoot,
  DropdownMenuTrigger,
} from "reka-ui";
import { FolderOpen, Ellipsis, Pencil, Trash2 } from "lucide-vue-next";
import type { ProjectItem } from "@/types/project";

defineProps<{
  projects: ProjectItem[];
  currentView: "chat" | "dashboard" | "project" | "pricing";
  selectedProjectId?: string | null;
}>();

const emit = defineEmits<{
  (e: "select-project", projectId: string): void;
  (e: "rename-project", projectId: string): void;
  (e: "delete-project", projectId: string): void;
}>();
</script>

<template>
  <div class="px-4 py-1 border-b">
    <h3
      class="text-xs font-medium text-sidebar-foreground/70 uppercase tracking-wide mb-2"
    >
      프로젝트
    </h3>
    <div class="space-y-1">
      <div
        v-for="project in projects"
        :key="project.conversationId"
        class="group flex w-full items-center gap-2 rounded-md px-2 py-2 text-sm hover:bg-slate-200 dark:hover:bg-slate-700"
        :class="
          currentView === 'project' && selectedProjectId === project.conversationId
            ? 'bg-sidebar-accent text-sidebar-accent-foreground'
            : 'text-sidebar-foreground'
        "
      >
        <button
          type="button"
          class="flex min-w-0 flex-1 items-center gap-2 text-left"
          @click="emit('select-project', project.conversationId)"
        >
          <FolderOpen class="h-4 w-4 shrink-0" />
          <span class="min-w-0 flex-1 truncate">{{ project.subject }}</span>
        </button>
        <DropdownMenuRoot>
          <DropdownMenuTrigger
            type="button"
            class="flex shrink-0 items-center justify-center rounded p-0.5 opacity-0 transition-opacity hover:bg-slate-200 dark:hover:bg-slate-700 focus:opacity-100 group-hover:opacity-100"
            aria-label="프로젝트 메뉴"
          >
            <Ellipsis class="h-4 w-4" />
          </DropdownMenuTrigger>
          <DropdownMenuPortal>
            <DropdownMenuContent
              class="z-50 min-w-40 rounded-md border bg-popover p-1 text-popover-foreground shadow-md"
              side="right"
              align="end"
              :side-offset="4"
            >
              <DropdownMenuItem
                class="flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-slate-200"
                @select="emit('rename-project', project.conversationId)"
              >
                <Pencil class="h-4 w-4 shrink-0" />
                <span>이름 바꾸기</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                class="flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-slate-200"
                @select="emit('delete-project', project.conversationId)"
              >
                <Trash2 class="h-4 w-4 shrink-0" />
                <span>삭제</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenuPortal>
        </DropdownMenuRoot>
      </div>
    </div>
  </div>
</template>
