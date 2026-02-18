<script setup lang="ts">
import type { FactCheckResults } from '@/components/FactCheckOutput.vue'
import { nextTick, ref } from 'vue'
import { useRouter } from 'vue-router'
import BlocklyWorkspace from '@/components/BlocklyWorkspace.vue'
import CodeOutput from '@/components/CodeOutput.vue'
import FactCheckOutput from '@/components/FactCheckOutput.vue'
import Header from '@/components/Header.vue'
import Sidebar from '@/components/Sidebar.vue'
import TextEditor from '@/components/TextEditor.vue'
import WelcomeTour from '@/components/WelcomeTour.vue'
import { useAuth } from '@/composables/useAuth'
import { mockFactCheckResults } from '@/data/mockFactCheck'

const router = useRouter()
const { signOut } = useAuth()

const activeView = ref('workspace')
const editorText = ref('')
const factCheckResults = ref<FactCheckResults | null>(null)
const generatedCode = ref('')
const blockCount = ref(0)
const isRunning = ref(false)
const consoleOutput = ref<string[]>([])
const blocklyRef = ref<InstanceType<typeof BlocklyWorkspace> | null>(null)
const welcomeTourRef = ref<InstanceType<typeof WelcomeTour> | null>(null)
const workspaceCollapsed = ref(false)

function onCodeChange(code: string) {
  generatedCode.value = code
}

function onBlockCountChange(count: number) {
  blockCount.value = count
}

function handleRun() {
  isRunning.value = true
  consoleOutput.value = []

  // Run generated Blockly code
  try {
    // eslint-disable-next-line no-console -- capturing console output from user code
    const originalLog = console.log
    const logs: string[] = []
    // eslint-disable-next-line no-console -- redirecting console for user code execution
    console.log = (...args: unknown[]) => {
      logs.push(args.map(a => typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a)).join(' '))
      originalLog(...args)
    }
    // eslint-disable-next-line no-new-func -- required to execute user-generated Blockly code
    const fn = new Function(generatedCode.value)
    fn()
    // eslint-disable-next-line no-console -- restoring console after user code execution
    console.log = originalLog
    consoleOutput.value = logs.length ? logs : ['Program executed successfully.']
  }
  catch (e: unknown) {
    const error = e as Error
    consoleOutput.value = [`Error: ${error.message}`]
  }

  // Simulate fact-check pipeline with mock data
  // (will be replaced with real API calls later)
  setTimeout(() => {
    factCheckResults.value = mockFactCheckResults
    workspaceCollapsed.value = true
    isRunning.value = false
  }, 600)
}

async function toggleWorkspace() {
  workspaceCollapsed.value = !workspaceCollapsed.value
  if (!workspaceCollapsed.value) {
    await nextTick()
    blocklyRef.value?.resize()
  }
}

async function handleLogout() {
  await signOut()
  router.push('/login')
}

async function handleClear() {
  factCheckResults.value = null
  consoleOutput.value = []
  workspaceCollapsed.value = false
  await nextTick()
  blocklyRef.value?.resize()
}

function handleUndo() {
  if (blocklyRef.value) {
    blocklyRef.value.undo()
  }
}

function handleRedo() {
  if (blocklyRef.value) {
    blocklyRef.value.redo()
  }
}
</script>

<template>
  <div class="flex h-screen w-screen flex-col overflow-hidden bg-background text-foreground">
    <WelcomeTour ref="welcomeTourRef" />
    <Header
      :active-view="activeView"
      @run="handleRun"
      @clear="handleClear"
      @undo="handleUndo"
      @redo="handleRedo"
      @logout="handleLogout"
      @help="welcomeTourRef?.show()"
    />
    <div class="flex flex-1 overflow-hidden">
      <Sidebar
        :active-view="activeView"
        @change-view="activeView = $event"
      />
      <main class="flex flex-1 flex-col overflow-hidden">
        <TextEditor v-model="editorText" data-tour="statement" />
        <!-- Blockly section -->
        <div data-tour="workspace" class="flex flex-col overflow-hidden" :class="workspaceCollapsed ? '' : 'flex-1'">
          <!-- Blockly section header (always visible) -->
          <button
            class="group flex shrink-0 items-center gap-3 border-y border-border bg-card px-5 py-3 transition-colors hover:bg-secondary/30"
            @click="toggleWorkspace"
          >
            <svg
              width="18" height="18" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
              class="shrink-0 text-primary"
            >
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <path d="M9 3v18" />
              <path d="m16 15-3-3 3-3" />
            </svg>
            <span class="text-sm font-semibold text-foreground">Blockly Workspace</span>
            <span class="rounded-full bg-primary/15 px-2.5 py-0.5 text-xs font-medium text-primary">{{ blockCount }} blocks</span>
            <svg
              width="16" height="16" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
              class="ml-auto shrink-0 text-muted-foreground transition-transform duration-200"
              :class="workspaceCollapsed ? '' : 'rotate-180'"
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>

          <!-- Blockly workspace + code panel -->
          <div v-if="!workspaceCollapsed" class="flex flex-1 overflow-hidden">
            <div class="relative flex-1 overflow-hidden">
              <BlocklyWorkspace
                ref="blocklyRef"
                @code-change="onCodeChange"
                @block-count-change="onBlockCountChange"
              />
            </div>
            <CodeOutput
              :code="generatedCode"
              :is-running="isRunning"
              :console-output="consoleOutput"
            />
          </div>
        </div>
        <FactCheckOutput :results="factCheckResults" data-tour="results" />
      </main>
    </div>
  </div>
</template>
