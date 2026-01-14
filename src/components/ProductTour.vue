<script setup>
import { ref, onMounted, watch, nextTick, onUnmounted } from "vue";

const props = defineProps({
  steps: {
    type: Array,
    required: true
  }
});

const emit = defineEmits(["finish"]);

const current = ref(0);
const targetRect = ref(null);
const tooltipPos = ref({ top: 0, left: 0 });
const arrowPos = ref({ top: 0, left: 0, placement: "bottom" });
const isLoading = ref(false);

function endTour() {
  emit("finish");
}

async function prevStep() {
  if (current.value > 0) {
    current.value--;
    // Reposition after going back
    await nextTick();
    setTimeout(updatePositions, 200);
  }
}

async function nextStep() {
  if (isLoading.value) return;
  
  const step = props.steps[current.value];
  
  // Execute action before moving to next step
  if (step.action && typeof step.action === 'function') {
    isLoading.value = true;
    try {
      await step.action();
    } catch (error) {
      console.warn('Tour action failed:', error);
    } finally {
      isLoading.value = false;
    }
  }
  
  if (current.value < props.steps.length - 1) {
    current.value++;
  } else {
    endTour();
  }
}

/* -------------------------------------------------------
   POSITIONING LOGIC
------------------------------------------------------- */
function computeTooltipPos(rect, placement) {
  const tooltipWidth = 320;
  const tooltipHeight = 140;
  const arrowSize = 12;

  let top = rect.top;
  let left = rect.left;
  let arrowTop = 0;
  let arrowLeft = 0;

  switch (placement) {
    case "top":
      top = rect.top - tooltipHeight - arrowSize;
      left = rect.left + rect.width / 2 - tooltipWidth / 2;
      arrowTop = top + tooltipHeight;
      arrowLeft = rect.left + rect.width / 2 - arrowSize;
      break;

    case "bottom":
      top = rect.bottom + arrowSize;
      left = rect.left + rect.width / 2 - tooltipWidth / 2;
      arrowTop = top - arrowSize * 2;
      arrowLeft = rect.left + rect.width / 2 - arrowSize;
      break;

    case "left":
      top = rect.top + rect.height / 2 - tooltipHeight / 2;
      left = rect.left - tooltipWidth - arrowSize;
      arrowTop = top + tooltipHeight / 2 - arrowSize;
      arrowLeft = left + tooltipWidth;
      break;

    case "right":
      top = rect.top + rect.height / 2 - tooltipHeight / 2;
      left = rect.right + arrowSize;
      arrowTop = top + tooltipHeight / 2 - arrowSize;
      arrowLeft = left - arrowSize * 2;
      break;
  }

  // Clamp to viewport
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  left = Math.max(20, Math.min(left, vw - tooltipWidth - 20));
  top = Math.max(20, Math.min(top, vh - tooltipHeight - 20));

  tooltipPos.value = { top, left };
  arrowPos.value = { top: arrowTop, left: arrowLeft, placement };
}

/* -------------------------------------------------------
   UPDATE POSITIONS WITH RETRY
------------------------------------------------------- */
function updatePositions() {
  const step = props.steps[current.value];
  
  if (!step || !step.target) return;
  
  // Try multiple selector strategies
  let el = null;
  
  // First try the exact selector
  el = document.querySelector(step.target);
  
  // If not found, try fallback selectors
  if (!el) {
    // Try by class if it looks like a class selector
    if (step.target.startsWith('.')) {
      const className = step.target.substring(1);
      el = document.querySelector(`.${className}`);
    }
  }

  if (!el) {
    console.warn('Element not found for selector:', step.target);
    // Try again in a moment
    setTimeout(updatePositions, 200);
    return;
  }

  const rect = el.getBoundingClientRect();

  if (rect.width === 0 || rect.height === 0) {
    console.warn('Element has zero dimensions:', step.target);
    setTimeout(updatePositions, 200);
    return;
  }

  targetRect.value = rect;
  computeTooltipPos(rect, step.placement);
}

onMounted(async () => {
  await nextTick();
  setTimeout(updatePositions, 500);

  const debounced = () => {
    clearTimeout(window._tourUpdate);
    window._tourUpdate = setTimeout(updatePositions, 150);
  };

  window.addEventListener("resize", debounced);
  window.addEventListener("scroll", debounced, { passive: true });

  const keyHandler = (e) => {
    if (e.key === "Escape") endTour();
    if (e.key === "ArrowRight") nextStep();
    if (e.key === "ArrowLeft") prevStep();
  };
  
  window.addEventListener("keydown", keyHandler);
  
  // Cleanup function
  onUnmounted(() => {
    window.removeEventListener("resize", debounced);
    window.removeEventListener("scroll", debounced);
    window.removeEventListener("keydown", keyHandler);
    clearTimeout(window._tourUpdate);
  });
});

watch(current, async () => {
  await nextTick();
  // Give time for UI updates after action
  setTimeout(updatePositions, 300);
});
</script>

<template>
  <div class="tour-overlay">

    <!-- Blur layer -->
    <div class="tour-blur-layer"></div>

    <!-- Cutout hole -->
    <div
      v-if="targetRect"
      class="tour-cutout"
      :style="{
        top: targetRect.top + 'px',
        left: targetRect.left + 'px',
        width: targetRect.width + 'px',
        height: targetRect.height + 'px'
      }"
    ></div>

    <!-- Highlight border -->
    <div
      v-if="targetRect"
      class="highlight"
      :style="{
        top: targetRect.top + 'px',
        left: targetRect.left + 'px',
        width: targetRect.width + 'px',
        height: targetRect.height + 'px'
      }"
    ></div>

    <!-- Tooltip -->
    <div
      class="tooltip"
      :style="{
        top: tooltipPos.top + 'px',
        left: tooltipPos.left + 'px'
      }"
    >
      <div
        class="arrow"
        :class="arrowPos.placement"
        :style="{
          top: arrowPos.top - tooltipPos.top + 'px',
          left: arrowPos.left - tooltipPos.left + 'px'
        }"
      ></div>

      <div class="progress">
        Step {{ current + 1 }} / {{ steps.length }}
      </div>

      <p>{{ steps[current]?.text }}</p>

      <div class="actions">
        <button class="skip" @click.stop="endTour">Skip</button>
        <button class="back" @click.stop="prevStep" :disabled="current === 0 || isLoading">
          Back
        </button>
        <button class="next" @click.stop="nextStep" :disabled="isLoading">
          {{ isLoading ? 'Working...' : current < steps.length - 1 ? "Next" : "Finish" }}
        </button>
      </div>
    </div>

  </div>
</template>

<style scoped>
/* Overlay */
.tour-overlay {
  position: fixed;
  inset: 0;
  z-index: 999999;
  pointer-events: auto;
  isolation: isolate;
}

/* Blur layer */
.tour-blur-layer {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(6px);
  z-index: 1;
  pointer-events: none;
}

/* Cutout hole */
.tour-cutout {
  position: fixed;
  border-radius: 8px;
  background: transparent;
  box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0);
  z-index: 2;
  pointer-events: none;
  mix-blend-mode: difference;
}

/* Highlight border */
.highlight {
  position: fixed;
  border-radius: 8px;
  box-shadow: 0 0 0 3px #3b82f6;
  z-index: 3;
  pointer-events: none;
  animation: pulse 1.8s infinite ease-in-out;
}

@keyframes pulse {
  0% { box-shadow: 0 0 0 3px #3b82f6; }
  50% { box-shadow: 0 0 0 5px #60a5fa; }
  100% { box-shadow: 0 0 0 3px #3b82f6; }
}

/* Tooltip */
.tooltip {
  position: absolute;
  width: 320px;
  min-height: 140px;
  background: white;
  color: #111;
  padding: 1rem;
  border-radius: 12px;
  box-shadow: 0 10px 25px rgba(0,0,0,0.3);
  animation: fadeIn 0.25s ease-out;
  z-index: 4;
  pointer-events: auto;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px) scale(0.97); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}

.tooltip p {
  margin: 0.75rem 0 1.25rem 0;
  font-size: 0.95rem;
  line-height: 1.4;
}

/* Progress */
.progress {
  font-size: 0.8rem;
  font-weight: 600;
  color: #2563eb;
  margin-bottom: 0.5rem;
}

/* Buttons */
.actions {
  display: flex;
  gap: 0.5rem;
}

.skip,
.back,
.next {
  flex: 1;
  padding: 0.45rem 0.7rem;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  font-size: 0.85rem;
  font-weight: 500;
  transition: background 0.2s ease;
}

.skip { 
  background: #6b7280; 
  color: white; 
}
.skip:hover { 
  background: #4b5563; 
}

.back { 
  background: #9ca3af; 
  color: white; 
}
.back:hover { 
  background: #6b7280; 
}

.next { 
  background: #2563eb; 
  color: white; 
}
.next:hover { 
  background: #1d4ed8; 
}

.back:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.back:disabled:hover {
  background: #9ca3af;
}

/* Arrows */
.arrow {
  position: absolute;
  width: 0;
  height: 0;
  border-style: solid;
}

.arrow.bottom {
  border-width: 0 10px 12px 10px;
  border-color: transparent transparent white transparent;
  top: -12px !important;
}

.arrow.top {
  border-width: 12px 10px 0 10px;
  border-color: white transparent transparent transparent;
  bottom: -12px !important;
}

.arrow.left {
  border-width: 10px 12px 10px 0;
  border-color: transparent white transparent transparent;
  right: -12px !important;
}

.arrow.right {
  border-width: 10px 0 10px 12px;
  border-color: transparent transparent transparent white;
  left: -12px !important;
}

/* Dark mode */
:deep(.app-dark) .tooltip {
  background: #1e293b;
  color: #f1f5f9;
}

:deep(.app-dark) .arrow.bottom {
  border-color: transparent transparent #1e293b transparent;
}

:deep(.app-dark) .arrow.top {
  border-color: #1e293b transparent transparent transparent;
}

:deep(.app-dark) .arrow.left {
  border-color: transparent #1e293b transparent transparent;
}

:deep(.app-dark) .arrow.right {
  border-color: transparent transparent transparent #1e293b;
}
</style>