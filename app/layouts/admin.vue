<script setup lang="ts">
import { ref } from 'vue'

// Estado em memória (sem persistência nesta fase - ver docs/03)
const sidebarOpen = ref(true)
</script>

<template>
  <div class="fp-shell h-screen flex flex-col overflow-hidden">
    <LayoutAppHeader
      :sidebar-open="sidebarOpen"
      @update:sidebar-open="sidebarOpen = $event"
    />

    <div class="fp-shell-body flex flex-1 min-h-0">
      <LayoutAppSidebar :sidebar-open="sidebarOpen" />

      <main class="fp-shell-content flex-1 overflow-y-auto" style="background-color: #f8fafc">
        <slot />
      </main>
    </div>
  </div>
</template>
