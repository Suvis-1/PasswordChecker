<script setup>
import { ref } from "vue";

const emit = defineEmits(["close"]);

const slides = [
  {
    title: "Welcome!",
    text: "This tool checks your passwords securely using privacy‑preserving methods.",
  },
  {
    title: "Your password stays on your device",
    text: "We never send your actual password to any server. It is hashed locally using SHA‑1.",
  },
  {
    title: "Only 5 characters of the hash are sent",
    text: "We send only the first 5 characters of the hash to check against known breaches.",
  },
  {
    title: "Accurate and private",
    text: "We compare the rest of the hash locally, so your full password never leaves your device.",
  },
  {
    title: "Get started",
    text: "You can now check single or multiple passwords and receive strength and security advice.",
  },
];

const index = ref(0);

function nextSlide() {
  if (index.value < slides.length - 1) {
    index.value++;
  } else {
    finish();
  }
}

function prevSlide() {
  if (index.value > 0) {
    index.value--;
  }
}

function skip() {
  localStorage.setItem("tutorialSeen", "true");
  emit("close");
}

function finish() {
  localStorage.setItem("tutorialSeen", "true");
  emit("close");
}
</script>

<template>
  <div class="overlay">
    <div class="modal">
      <button class="skip-btn" @click="skip">Skip</button>

      <h2>{{ slides[index].title }}</h2>
      <p>{{ slides[index].text }}</p>

      <div class="controls">
        <button v-if="index > 0" @click="prevSlide">Back</button>
        <button @click="nextSlide">
          {{ index === slides.length - 1 ? "Finish" : "Next" }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Overlay */
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.55);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 50;
  animation: fadeIn 0.2s ease-out;
}

/* Modal */
.modal {
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  width: 90%;
  max-width: 420px;
  box-shadow: 0 10px 25px rgba(0,0,0,0.2);
  position: relative;
  animation: scaleIn 0.22s ease-out;
}

.skip-btn {
  position: absolute;
  top: 0.6rem;
  right: 0.6rem;
  background: transparent;
  border: none;
  color: #6b7280;
  cursor: pointer;
  font-size: 0.85rem;
}

.controls {
  margin-top: 1.2rem;
  display: flex;
  justify-content: space-between;
}

.controls button {
  padding: 0.45rem 1rem;
  border: none;
  border-radius: 6px;
  background: #2563eb;
  color: white;
  cursor: pointer;
}

.controls button:first-child {
  background: #6b7280;
}

/* Animations */
@keyframes scaleIn {
  from {
    transform: scale(0.92);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* Dark mode */
.app-dark .modal {
  background: #1e293b;
  color: #e2e8f0;
}

.app-dark .skip-btn {
  color: #cbd5e1;
}

.app-dark .controls button:first-child {
  background: #475569;
}

.app-dark .controls button {
  background: #3b82f6;
}
</style>
