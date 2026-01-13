<script setup>
import { computed } from "vue";

const props = defineProps({
  item: {
    type: Object,
    required: true
  },
  formatAdvice: {
    type: Function,
    required: true
  }
});

// Build advice list for on‑screen display
const adviceMessages = computed(() => {
  const messages = [];

  if (props.item.leaked) {
    messages.push("This password has appeared in known data breaches.");

    if (props.item.count > 1_000_000) {
      messages.push("This is an extremely common password and widely used by attackers.");
    } else if (props.item.count > 1_000) {
      messages.push("This password is widely known and frequently attempted by attackers.");
    } else {
      messages.push("Even a small number of breaches is enough to consider it unsafe.");
    }

    messages.push("Change this password everywhere it is used and enable two-factor authentication.");
  } else {
    messages.push("This password was not found in the known breached password dataset.");
  }

  if (props.item.strengthScore <= 1) {
    messages.push("Your password is weak. Use a longer passphrase (14+ characters) with mixed character types.");
  } else if (props.item.strengthScore === 2) {
    messages.push("Your password is average. Add more randomness or length to improve it.");
  } else if (props.item.strengthScore >= 3 && !props.item.leaked) {
    messages.push("This is a strong password. Keep it unique and avoid reusing it across accounts.");
  }

  if (props.item.strengthFeedback.warning) {
    messages.push(props.item.strengthFeedback.warning);
  }
  if (props.item.strengthFeedback.suggestions?.length) {
    messages.push(...props.item.strengthFeedback.suggestions);
  }

  return messages;
});
</script>

<template>
  <div class="advice-panel">
    <div class="advice-header">
      <span>Advice</span>
    </div>

    <ul class="advice-list">
      <li v-for="(msg, index) in adviceMessages" :key="index">
        {{ msg }}
      </li>
    </ul>
  </div>
</template>

<style scoped>
.advice-panel {
  margin-top: 0.4rem;
}

.advice-header {
  font-size: 0.8rem;
  color: inherit;
  margin-bottom: 0.25rem;
  font-weight: 600;
}

.advice-list {
  margin: 0.3rem 0 0;
  padding-left: 1.1rem;
  font-size: 0.85rem;
  color: inherit;
}

.advice-list li + li {
  margin-top: 0.25rem;
}

/* Dark mode */
.app-dark .advice-header {
  color: #f1f5f9;
}

.app-dark .advice-list {
  color: #e2e8f0;
}
</style>
