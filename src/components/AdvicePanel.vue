<script setup>
import { computed } from "vue";

const props = defineProps({
  leaked: Boolean,
  count: Number,
  strengthScore: Number,
  strengthFeedback: {
    type: Object,
    default: () => ({}),
  },
});

const emit = defineEmits(["toast"]);

// Build advice list
const adviceMessages = computed(() => {
  const messages = [];

  // Breach-related advice
  if (props.leaked) {
    messages.push("This password has appeared in known data breaches.");

    if (props.count > 1_000_000) {
      messages.push("This is an extremely common password and widely used by attackers.");
    } else if (props.count > 1_000) {
      messages.push("This password is widely known and frequently attempted by attackers.");
    } else {
      messages.push("Even a small number of breaches is enough to consider it unsafe.");
    }

    messages.push("Change this password everywhere it is used and enable two-factor authentication.");
  } else {
    messages.push("This password was not found in the known breached password dataset.");
  }

  // Strength-related advice
  if (props.strengthScore <= 1) {
    messages.push("Your password is weak. Use a longer passphrase (14+ characters) with mixed character types.");
  } else if (props.strengthScore === 2) {
    messages.push("Your password is average. Add more randomness or length to improve it.");
  } else if (props.strengthScore >= 3 && !props.leaked) {
    messages.push("This is a strong password. Keep it unique and avoid reusing it across accounts.");
  }

  // zxcvbn feedback
  if (props.strengthFeedback.warning) {
    messages.push(props.strengthFeedback.warning);
  }
  if (props.strengthFeedback.suggestions?.length) {
    messages.push(...props.strengthFeedback.suggestions);
  }

  return messages;
});

// Copy advice to clipboard
async function copyAdvice() {
  try {
    await navigator.clipboard.writeText(adviceMessages.value.join("\n"));
    emit("toast", "Advice copied!");
  } catch (e) {
    console.error("Failed to copy advice:", e);
  }
}
</script>

<template>
  <div class="advice-panel">
    <div class="advice-header">
      <span>Advice</span>
      <button class="copy-btn" @click="copyAdvice">Copy</button>
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
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.8rem;
  color: inherit;
  margin-bottom: 0.25rem;
}

.copy-btn {
  border: 1px solid #d1d5db;
  border-radius: 999px;
  padding: 0.05rem 0.5rem;
  font-size: 0.7rem;
  background: #f9fafb;
  cursor: pointer;
}

.copy-btn:hover {
  background: #f3f4f6;
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
.app-dark .copy-btn {
  background: #475569;
  color: #f8fafc;
  border-color: #64748b;
}

.app-dark .copy-btn:hover {
  background: #64748b;
}
</style>
