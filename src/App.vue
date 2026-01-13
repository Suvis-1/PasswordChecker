<script setup>
import { ref, onMounted } from "vue";
import PasswordForm from "./components/PasswordForm.vue";
import ResultsTable from "./components/ResultsTable.vue";
import TutorialModal from "./components/TutorialModal.vue";

const results = ref([]);
const showTutorial = ref(false);
const toast = ref("");
const isDark = ref(false);

let toastTimeout = null;

// Load preferences on startup
onMounted(() => {
  showTutorial.value = !localStorage.getItem("tutorialSeen");
  isDark.value = localStorage.getItem("darkMode") === "true";
});

// Close tutorial
function closeTutorial() {
  showTutorial.value = false;
}

// Toast notifications
function showToast(msg) {
  toast.value = msg;

  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => {
    toast.value = "";
  }, 2000);
}

// Add new results (accumulate + prevent duplicates)
function addResults(newItems) {
  const existing = new Set(results.value.map(r => r.password));
  const filtered = newItems.filter(item => !existing.has(item.password));
  results.value = [...results.value, ...filtered];
}

// Remove a single row
function removeItem(id) {
  results.value = results.value.filter(r => r.id !== id);
}

// Toggle dark mode
function toggleDark() {
  isDark.value = !isDark.value;
  localStorage.setItem("darkMode", String(isDark.value));
}
</script>

<template>
  <div class="app" :class="{ 'app-dark': isDark }">
    <!-- Tutorial Modal -->
    <transition name="fade">
      <TutorialModal v-if="showTutorial" @close="closeTutorial" />
    </transition>

    <!-- Header -->
    <header class="app-header">
      <h1>Password Leak Checker</h1>
      <p>
        Check whether your passwords have appeared in known data breaches and get
        strength and security advice.
      </p>

      <div class="header-actions">
        <button @click="showTutorial = true">View tutorial again</button>
        <button @click="toggleDark">
          {{ isDark ? "Light mode" : "Dark mode" }}
        </button>
      </div>
    </header>

    <!-- Main content -->
    <main class="app-main">
      <PasswordForm
        @update:results="addResults"
        @clear="results = []"
      />

      <ResultsTable
        :results="results"
        @remove="removeItem"
        @toast="showToast"
      />
    </main>

    <!-- Toast -->
    <transition name="toast">
      <div v-if="toast" class="toast">{{ toast }}</div>
    </transition>
  </div>
</template>

<style scoped>
/* Layout */
.app {
  max-width: 1000px;
  margin: 0 auto;
  padding: 1.5rem;
}

.app-header {
  margin-bottom: 1.5rem;
}

.header-actions {
  display: flex;
  gap: 0.5rem;
  margin-top: 0.5rem;
}

.app-main {
  background: #f7f7f7;
  border-radius: 8px;
  padding: 1rem 1.25rem 1.5rem;
}

/* Toast */
.toast {
  position: fixed;
  bottom: 20px;
  right: 20px;
  background: #111827;
  color: white;
  padding: 0.6rem 1rem;
  border-radius: 6px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.25);
  font-size: 0.85rem;
  z-index: 100;
}

.toast-enter-active,
.toast-leave-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateY(10px);
}

/* Fade transition */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease-out;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Dark mode */
.app-dark {
  background-color: #0f172a;
  color: #e2e8f0;
}

.app-dark .app-main {
  background: #1e293b;
}

.app-dark .app-header p,
.app-dark .header-actions button {
  color: #cbd5e1;
  border-color: #64748b;
}

.app-dark button {
  background: #334155;
  color: #f1f5f9;
  border: 1px solid #475569;
}

.app-dark .toast {
  background: #334155;
  color: #f8fafc;
}
</style>
