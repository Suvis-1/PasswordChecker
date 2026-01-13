<script setup>
const props = defineProps({
  score: {
    type: Number,
    required: true,
  },
});

// Labels for each score (0–4)
const labels = ["Very weak", "Weak", "Fair", "Strong", "Very strong"];

// Bar colors
function color(score) {
  return [
    "#dc2626", // red
    "#f97316", // orange
    "#eab308", // yellow
    "#22c55e", // green
    "#16a34a"  // dark green
  ][score] || "#6b7280";
}
</script>

<template>
  <div class="strength-wrapper">
    <span class="strength-label">{{ labels[score] }}</span>

    <div class="bar">
      <div
        class="bar-fill"
        :style="{
          width: (score + 1) * 20 + '%',
          backgroundColor: color(score)
        }"
      ></div>
    </div>
  </div>
</template>

<style scoped>
.strength-wrapper {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.strength-label {
  font-size: 0.75rem;
  color: inherit;
}

.bar {
  width: 100px;
  height: 6px;
  background: #e5e7eb;
  border-radius: 4px;
  overflow: hidden;
}

.bar-fill {
  height: 100%;
  transition: width 0.25s ease-out;
}

/* Dark mode */
.app-dark .bar {
  background: #334155;
}
</style>
