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

  // Sync body class with dark mode
  document.body.classList.toggle("dark", isDark.value);
  document.body.classList.toggle("light", !isDark.value);
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

// Add new results (accumulate + prevent duplicates + warn user)
function addResults(newItems) {
  const existing = new Set(results.value.map(r => r.password));

  const duplicates = newItems.filter(item => existing.has(item.password));
  const filtered = newItems.filter(item => !existing.has(item.password));

  if (duplicates.length > 0) {
    showToast("Some passwords were already checked");
  }

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

  document.body.classList.toggle("dark", isDark.value);
  document.body.classList.toggle("light", !isDark.value);
}
</script>

<template>
  <div class="app-shell" :class="{ 'app-dark': isDark }">
    <div class="app">
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
    </div>

    <!-- Toast -->
    <transition name="toast">
      <div v-if="toast" class="toast">{{ toast }}</div>
    </transition>
  </div>
</template>

<style scoped>
/* Outer shell to center the app */
.app-shell {
  min-height: 100vh;
  display: flex;
  justify-content: center;
  padding: 1rem;
}

/* Main app container */
.app {
  width: 100%;
  max-width: 720px;
  display: flex;
  flex-direction: column;
}

/* Header */
.app-header {
  text-align: center;
  margin-bottom: 1.5rem;
}

.app-header h1 {
  margin-bottom: 0.5rem;
}

.app-header p {
  font-size: 0.95rem;
  color: #4b5563;
  margin: 0;
}

.header-actions {
  display: flex;
  gap: 0.5rem;
  margin-top: 0.75rem;
  justify-content: center;
  flex-wrap: wrap;
}

.header-actions button {
  background: #2563eb;
  color: white;
  border: none;
  padding: 0.4rem 0.9rem;
  border-radius: 6px;
  font-size: 0.85rem;
  cursor: pointer;
}

/* Main content card */
.app-main {
  background: #f7f7f7;
  border-radius: 8px;
  padding: 1rem 1.25rem 1.5rem;
  box-shadow: 0 2px 6px rgba(0,0,0,0.08);
  flex: 1;
  overflow-y: auto;
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

.app-dark .app-header p {
  color: #cbd5e1;
}

.app-dark .header-actions button {
  background: #3b82f6;
}

.app-dark .toast {
  background: #334155;
  color: #f8fafc;
}

/* Mobile tweaks */
@media (max-width: 600px) {
  .app-shell {
    padding: 0.75rem;
  }

  .app-main {
    padding: 0.9rem;
  }

  .header-actions {
    flex-direction: column;
    align-items: center;
  }
}
</style>
