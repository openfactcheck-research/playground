<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useAuth } from '@/composables/useAuth'

const emit = defineEmits<{
  close: []
}>()

const { preferences, updatePreferences } = useAuth()

const isVisible = ref(false)
const currentStep = ref(1)
const totalSteps = 4

type Step = {
  title: string
  description: string
  target: string // data-tour attribute value
  position: 'bottom' | 'top' | 'left' | 'right'
}

const steps: Step[] = [
  {
    title: 'Enter Your Statement',
    description: 'Type the claim or statement you want to fact-check in this input field.',
    target: 'statement',
    position: 'bottom',
  },
  {
    title: 'Build Your Pipeline',
    description: 'Click to expand the Blockly workspace, then drag blocks from the toolbox to create your verification workflow.',
    target: 'workspace',
    position: 'top',
  },
  {
    title: 'Run & Review',
    description: 'Click the Run button to execute your pipeline and see the fact-check results.',
    target: 'run',
    position: 'bottom',
  },
  {
    title: 'View Results',
    description: 'See the detailed fact-check analysis here, including sources, verdicts, and confidence scores.',
    target: 'results',
    position: 'top',
  },
]

const currentStepData = computed(() => steps[currentStep.value - 1]!)

// Element highlighting
const targetRect = ref<DOMRect | null>(null)
const tooltipStyle = ref<Record<string, string>>({})
const spotlightPadding = 8
const viewportWidth = ref(window.innerWidth)
const viewportHeight = ref(window.innerHeight)

// Clamp spotlight rect to viewport
const clampedSpotlight = computed(() => {
  if (!targetRect.value)
    return null
  const rect = targetRect.value
  const pad = spotlightPadding
  const vw = viewportWidth.value
  const vh = viewportHeight.value

  let left = rect.left - pad
  let top = rect.top - pad
  let width = rect.width + pad * 2
  let height = rect.height + pad * 2

  // Clamp to viewport
  if (left < 0) {
    width += left
    left = 0
  }
  if (top < 0) {
    height += top
    top = 0
  }
  if (left + width > vw) {
    width = vw - left
  }
  if (top + height > vh) {
    height = vh - top
  }

  return { left, top, width, height }
})

function updateTargetPosition() {
  viewportWidth.value = window.innerWidth
  viewportHeight.value = window.innerHeight

  const step = currentStepData.value
  const el = document.querySelector(`[data-tour="${step.target}"]`)
  if (el) {
    const rect = el.getBoundingClientRect()
    targetRect.value = rect

    // Calculate tooltip position based on step position preference
    const padding = 12
    const tooltipWidth = 320
    const tooltipHeight = 200 // Approximate tooltip height

    let top = 0
    let left = 0

    switch (step.position) {
      case 'bottom':
        top = rect.bottom + padding
        left = rect.left + rect.width / 2 - tooltipWidth / 2
        break
      case 'top':
        top = rect.top - padding - tooltipHeight
        left = rect.left + rect.width / 2 - tooltipWidth / 2
        break
      case 'left':
        top = rect.top + rect.height / 2 - tooltipHeight / 2
        left = rect.left - tooltipWidth - padding
        break
      case 'right':
        top = rect.top + rect.height / 2 - tooltipHeight / 2
        left = rect.right + padding
        break
    }

    // Keep tooltip within viewport
    left = Math.max(16, Math.min(left, window.innerWidth - tooltipWidth - 16))
    top = Math.max(16, Math.min(top, window.innerHeight - tooltipHeight - 16))

    tooltipStyle.value = {
      position: 'fixed',
      top: `${top}px`,
      left: `${left}px`,
      width: `${tooltipWidth}px`,
    }
  }
}

watch(currentStep, async () => {
  await nextTick()
  updateTargetPosition()
})

let resizeObserver: ResizeObserver | null = null

onMounted(() => {
  if (!preferences.value.tourCompleted) {
    isVisible.value = true
    nextTick(() => updateTargetPosition())

    // Update position on resize
    resizeObserver = new ResizeObserver(() => updateTargetPosition())
    resizeObserver.observe(document.body)
    window.addEventListener('resize', updateTargetPosition)
  }
})

onBeforeUnmount(() => {
  resizeObserver?.disconnect()
  window.removeEventListener('resize', updateTargetPosition)
})

function nextStep() {
  if (currentStep.value < totalSteps) {
    currentStep.value++
  }
  else {
    complete()
  }
}

function prevStep() {
  if (currentStep.value > 1) {
    currentStep.value--
  }
}

function skip() {
  complete()
}

function complete() {
  updatePreferences({ tourCompleted: true })
  isVisible.value = false
  emit('close')
}

function show() {
  currentStep.value = 1
  isVisible.value = true
  nextTick(() => {
    updateTargetPosition()
    if (!resizeObserver) {
      resizeObserver = new ResizeObserver(() => updateTargetPosition())
      resizeObserver.observe(document.body)
      window.addEventListener('resize', updateTargetPosition)
    }
  })
}

defineExpose({ show })
</script>

<template>
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="isVisible" class="fixed inset-0 overflow-hidden" style="z-index: 100000;">
        <!-- SVG overlay with spotlight cutout -->
        <svg class="absolute inset-0 h-full w-full">
          <defs>
            <mask id="spotlight-mask">
              <!-- White = visible (dimmed area) -->
              <rect x="0" y="0" width="100%" height="100%" fill="white" />
              <!-- Black = hidden (spotlight hole) -->
              <rect
                v-if="clampedSpotlight"
                :x="clampedSpotlight.left"
                :y="clampedSpotlight.top"
                :width="clampedSpotlight.width"
                :height="clampedSpotlight.height"
                :rx="8"
                fill="black"
              />
            </mask>
          </defs>
          <!-- Dark overlay with spotlight hole -->
          <rect
            x="0"
            y="0"
            width="100%"
            height="100%"
            fill="rgba(0, 0, 0, 0.7)"
            mask="url(#spotlight-mask)"
            @click="skip"
          />
        </svg>

        <!-- Spotlight ring/border -->
        <div
          v-if="clampedSpotlight"
          class="pointer-events-none absolute rounded-lg border-2 border-primary"
          :style="{
            left: `${clampedSpotlight.left}px`,
            top: `${clampedSpotlight.top}px`,
            width: `${clampedSpotlight.width}px`,
            height: `${clampedSpotlight.height}px`,
            boxShadow: '0 0 0 4px rgba(var(--primary-rgb, 0, 83, 85), 0.3)',
          }"
        />

        <!-- Tooltip -->
        <div
          class="rounded-xl border border-border bg-card p-5 shadow-2xl max-h-[calc(100vh-32px)] overflow-auto"
          :style="tooltipStyle"
        >
          <!-- Progress dots -->
          <div class="mb-4 flex justify-center gap-2">
            <button
              v-for="step in totalSteps"
              :key="step"
              class="h-1.5 rounded-full transition-all"
              :class="[
                step === currentStep
                  ? 'w-5 bg-primary'
                  : step < currentStep
                    ? 'w-1.5 bg-primary/50'
                    : 'w-1.5 bg-muted',
              ]"
              @click="currentStep = step"
            />
          </div>

          <!-- Step counter badge -->
          <div class="mb-3 flex items-center gap-2">
            <span class="rounded-full bg-primary/15 px-2 py-0.5 text-xs font-medium text-primary">
              Step {{ currentStep }} of {{ totalSteps }}
            </span>
          </div>

          <!-- Title -->
          <h2 class="mb-2 text-base font-semibold text-foreground">
            {{ currentStepData.title }}
          </h2>

          <!-- Description -->
          <p class="mb-5 text-sm leading-relaxed text-muted-foreground">
            {{ currentStepData.description }}
          </p>

          <!-- Navigation -->
          <div class="flex items-center gap-2">
            <button
              v-if="currentStep > 1"
              class="rounded-lg px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              @click="prevStep"
            >
              Back
            </button>
            <button
              v-else
              class="rounded-lg px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              @click="skip"
            >
              Skip
            </button>

            <button
              class="ml-auto rounded-lg bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
              @click="nextStep"
            >
              {{ currentStep === totalSteps ? 'Get Started' : 'Next' }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>

<!-- Global style to ensure tour overlay is above Blockly elements -->
<style>
.blocklyWidgetDiv,
.blocklyDropDownDiv,
.blocklyToolboxDiv,
.blocklyFlyout {
  z-index: 40 !important;
}
</style>
