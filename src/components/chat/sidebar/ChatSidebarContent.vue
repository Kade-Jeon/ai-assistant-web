<script setup lang="ts">
import ChatSidebarSearch from "./ChatSidebarSearch.vue";
import ChatSidebarMenu from "./ChatSidebarMenu.vue";
import ChatSidebarProjectList from "./ChatSidebarProjectList.vue";
import ChatSidebarHistory from "./ChatSidebarHistory.vue";
import type { ChatThread } from "@/types/chat";
import type { ProjectItem } from "@/types/project";

defineProps<{
  threads: ChatThread[];
  projects: ProjectItem[];
  currentView: "chat" | "dashboard" | "project" | "pricing";
  selectedProjectId?: string | null;
}>();

defineEmits<{
  (e: "dashboard"): void;
  (e: "new-project"): void;
  (e: "select-thread", conversationId: string): void;
  (e: "select-project", projectId: string): void;
  (e: "rename", conversationId: string): void;
  (e: "rename-project", projectId: string): void;
  (e: "delete", conversationId: string): void;
  (e: "delete-project", projectId: string): void;
}>();
</script>

<template>
  <ChatSidebarSearch />
  <ChatSidebarMenu
    :currentView="currentView"
    @dashboard="$emit('dashboard')"
    @new-project="$emit('new-project')"
  />
  <ChatSidebarProjectList
    :projects="projects"
    :currentView="currentView"
    :selectedProjectId="selectedProjectId"
    @select-project="$emit('select-project', $event)"
    @rename-project="$emit('rename-project', $event)"
    @delete-project="$emit('delete-project', $event)"
  />
  <ChatSidebarHistory
    :threads="threads"
    @select-thread="$emit('select-thread', $event)"
    @rename="$emit('rename', $event)"
    @delete="$emit('delete', $event)"
  />
</template>
