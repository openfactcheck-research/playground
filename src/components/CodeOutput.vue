<script setup lang="ts">
import hljs from 'highlight.js/lib/core'
import python from 'highlight.js/lib/languages/python'
import { computed, ref, watch } from 'vue'
import 'highlight.js/styles/github-dark.css'

const props = defineProps<{
  code: string
  isRunning: boolean
  consoleOutput: string[]
}>()
hljs.registerLanguage('python', python)

const activeTab = ref<'code' | 'console'>('code')
const copied = ref(false)
const collapsed = ref(true)

const highlightedCode = computed(() => {
  if (!props.code)
    return ''
  try {
    return hljs.highlight(props.code, { language: 'python' }).value
  }
  catch {
    return props.code
  }
})

watch(
  () => props.consoleOutput,
  (val) => {
    if (val.length === 0) {
      activeTab.value = 'code'
      collapsed.value = true
    }
  },
)

function copyCode() {
  navigator.clipboard.writeText(props.code)
  copied.value = true
  setTimeout(() => {
    copied.value = false
  }, 2000)
}
</script>

<template>
  <aside
    class="flex flex-col border-l border-border bg-card transition-all duration-200" :class="[
      collapsed ? 'w-10' : 'w-96',
    ]"
  >
    <!-- Collapse toggle -->
    <div class="flex h-10 items-center border-b border-border">
      <button
        class="flex h-full w-10 shrink-0 items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
        :title="collapsed ? 'Expand panel' : 'Collapse panel'"
        :aria-label="collapsed ? 'Expand panel' : 'Collapse panel'"
        @click="collapsed = !collapsed"
      >
        <svg
          width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
          :class="collapsed ? 'rotate-180' : ''"
          class="transition-transform"
        >
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </button>
      <!-- Tabs (hidden when collapsed) -->
      <template v-if="!collapsed">
        <button
          class="flex h-full items-center px-4 text-xs font-medium transition-colors border-b-2" :class="[
            activeTab === 'code'
              ? 'border-primary text-foreground'
              : 'border-transparent text-muted-foreground hover:text-foreground',
          ]"
          @click="activeTab = 'code'"
        >
          Generated Code
        </button>
        <button
          class="flex h-full items-center px-4 text-xs font-medium transition-colors border-b-2" :class="[
            activeTab === 'console'
              ? 'border-primary text-foreground'
              : 'border-transparent text-muted-foreground hover:text-foreground',
          ]"
          @click="activeTab = 'console'"
        >
          Console
          <span
            v-if="consoleOutput.length > 0"
            class="ml-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary/20 px-1 text-[10px] text-primary"
          >
            {{ consoleOutput.length }}
          </span>
        </button>
      </template>
    </div>

    <template v-if="!collapsed">
      <!-- Language indicator (code tab only) -->
      <div v-if="activeTab === 'code'" class="flex items-center gap-2 border-b border-border px-3 py-2">
        <span class="rounded-md bg-secondary px-2 py-1 text-xs font-medium text-foreground">Python</span>
      </div>

      <!-- Content -->
      <div class="flex-1 overflow-auto p-4">
        <!-- Code view -->
        <div v-if="activeTab === 'code'">
          <pre v-if="code" class="text-xs leading-relaxed font-mono"><code v-html="highlightedCode" /></pre>
          <div v-else class="flex flex-col items-center justify-center py-16 text-center">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="text-muted-foreground/30 mb-3">
              <polyline points="16 18 22 12 16 6" />
              <polyline points="8 6 2 12 8 18" />
            </svg>
            <p class="text-sm text-muted-foreground">
              Add blocks to see generated code
            </p>
          </div>
        </div>

        <!-- Console view -->
        <div v-if="activeTab === 'console'">
          <div v-if="consoleOutput.length > 0" class="flex flex-col gap-1">
            <div
              v-for="(line, i) in consoleOutput"
              :key="i"
              class="flex items-start gap-2 rounded-md px-3 py-2 text-xs font-mono" :class="[
                line.startsWith('Error')
                  ? 'bg-red-500/10 text-red-400'
                  : 'bg-secondary text-secondary-foreground',
              ]"
            >
              <span class="select-none text-muted-foreground">{{ '>' }}</span>
              <span class="whitespace-pre-wrap break-all">{{ line }}</span>
            </div>
          </div>
          <div v-else class="flex flex-col items-center justify-center py-16 text-center">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="text-muted-foreground/30 mb-3">
              <polyline points="4 17 10 11 4 5" />
              <line x1="12" y1="19" x2="20" y2="19" />
            </svg>
            <p class="text-sm text-muted-foreground">
              Click Run to see output
            </p>
          </div>
        </div>
      </div>

      <!-- Footer with copy -->
      <div v-if="activeTab === 'code' && code" class="border-t border-border px-3 py-2">
        <button
          class="flex h-7 w-full items-center justify-center gap-1.5 rounded-md bg-secondary text-xs font-medium text-secondary-foreground transition-colors hover:bg-secondary/80"
          @click="copyCode"
        >
          <svg v-if="!copied" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
            <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
          </svg>
          <svg v-else width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          {{ copied ? 'Copied!' : 'Copy Code' }}
        </button>
      </div>
    </template>
  </aside>
</template>
