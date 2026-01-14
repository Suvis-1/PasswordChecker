<script setup>
import { ref, onMounted, nextTick, watch } from "vue";
import PasswordForm from "./components/PasswordForm.vue";
import ResultsTable from "./components/ResultsTable.vue";
import TutorialModal from "./components/TutorialModal.vue";
import ProductTour from "./components/ProductTour.vue";

const results = ref([]);
const showTutorial = ref(false);
const showTour = ref(false);
const toast = ref("");
const isDark = ref(false);
const passwordFormRef = ref(null);
const isInitializingTour = ref(false);

let toastTimeout = null;

/* -------------------------------------------------------
   LOAD USER PREFERENCES
------------------------------------------------------- */
onMounted(() => {
  showTutorial.value = !localStorage.getItem("tutorialSeen");
  isDark.value = localStorage.getItem("darkMode") === "true";

  document.body.classList.toggle("dark", isDark.value);
  document.body.classList.toggle("light", !isDark.value);

  if (localStorage.getItem("tutorialSeen") && !localStorage.getItem("tourCompleted")) {
    // Start tour after a brief delay
    setTimeout(startTour, 800);
  }
});

/* -------------------------------------------------------
   START TOUR PROPERLY
------------------------------------------------------- */
async function startTour() {
  isInitializingTour.value = true;
  
  // Reset to initial state
  results.value = [];
  
  // Ensure we're in single mode
  if (passwordFormRef.value && passwordFormRef.value.switchMode) {
    passwordFormRef.value.switchMode('single');
  } else {
    // Fallback: try to click the single mode button
    const singleModeBtn = document.querySelector('[data-tour-target="single-mode-btn"]');
    if (singleModeBtn && !singleModeBtn.classList.contains('active')) {
      singleModeBtn.click();
    }
  }
  
  // Wait for UI to update
  await nextTick();
  
  // Clear any existing input
  const input = document.querySelector('[data-tour-target="single-password-input"]');
  if (input) {
    input.value = '';
    const event = new Event('input', { bubbles: true });
    input.dispatchEvent(event);
  }
  
  // Start the tour
  showTour.value = true;
  isInitializingTour.value = false;
}

/* -------------------------------------------------------
   TUTORIAL + TOUR CONTROL
------------------------------------------------------- */
async function closeTutorial() {
  showTutorial.value = false;
  localStorage.setItem("tutorialSeen", "true");

  if (!localStorage.getItem("tourCompleted")) {
    await nextTick();
    // Start tour after tutorial
    setTimeout(startTour, 300);
  }
}

function restartTour() {
  localStorage.removeItem("tourCompleted");
  startTour();
}

function finishTour() {
  localStorage.setItem("tourCompleted", "true");
  showTour.value = false;
}

/* -------------------------------------------------------
   TOUR STEP ACTIONS
------------------------------------------------------- */
// Define tour actions
const tourActions = {
  switchToSingleMode: () => {
    if (passwordFormRef.value && passwordFormRef.value.switchMode) {
      passwordFormRef.value.switchMode('single');
    } else {
      // Fallback: try to click the button
      const button = document.querySelector('[data-tour-target="single-mode-btn"]');
      if (button && !button.classList.contains('active')) {
        button.click();
      }
    }
    return new Promise(resolve => setTimeout(resolve, 150));
  },
  
  switchToMultiMode: () => {
    if (passwordFormRef.value && passwordFormRef.value.switchMode) {
      passwordFormRef.value.switchMode('multi');
    } else {
      // Fallback: try to click the button
      const button = document.querySelector('[data-tour-target="multi-mode-btn"]');
      if (button && !button.classList.contains('active')) {
        button.click();
      }
    }
    return new Promise(resolve => setTimeout(resolve, 150));
  },
  
  // Add a sample password for demonstration (single mode)
  addSamplePassword: () => {
    const input = document.querySelector('[data-tour-target="single-password-input"]');
    if (input) {
      input.value = 'SamplePass123!';
      // Trigger Vue reactivity
      const event = new Event('input', { bubbles: true });
      input.dispatchEvent(event);
    }
    return Promise.resolve();
  },
  
  // Add sample passwords for multiple mode
  addSampleMultiPasswords: () => {
    const textarea = document.querySelector('[data-tour-target="multi-password-textarea"]');
    if (textarea) {
      textarea.value = 'password123\nSamplePass123!\nMySecureP@ssw0rd\n123456\nqwerty';
      // Trigger Vue reactivity
      const event = new Event('input', { bubbles: true });
      textarea.dispatchEvent(event);
    }
    return Promise.resolve();
  },
  
  // Clear the sample password (single mode)
  clearSamplePassword: () => {
    const input = document.querySelector('[data-tour-target="single-password-input"]');
    if (input) {
      input.value = '';
      const event = new Event('input', { bubbles: true });
      input.dispatchEvent(event);
    }
    return Promise.resolve();
  },
  
  // Clear sample passwords (multiple mode)
  clearSampleMultiPasswords: () => {
    const textarea = document.querySelector('[data-tour-target="multi-password-textarea"]');
    if (textarea) {
      textarea.value = '';
      const event = new Event('input', { bubbles: true });
      textarea.dispatchEvent(event);
    }
    return Promise.resolve();
  },
  
  // Add sample results for demonstration
  addSampleResults: () => {
    const sampleResults = [
      {
        id: crypto.randomUUID(),
        password: 'SamplePass123!',
        leaked: false,
        count: 0,
        strengthScore: 3,
        strengthFeedback: {
          warning: '',
          suggestions: ['Add more special characters for better security']
        }
      },
      {
        id: crypto.randomUUID(),
        password: 'password123',
        leaked: true,
        count: 4523567,
        strengthScore: 0,
        strengthFeedback: {
          warning: 'This is a top 10 most common password',
          suggestions: ['Never use common passwords', 'Use a password manager']
        }
      },
      {
        id: crypto.randomUUID(),
        password: 'MySecureP@ssw0rd',
        leaked: false,
        count: 0,
        strengthScore: 4,
        strengthFeedback: {
          warning: '',
          suggestions: ['Great password! Keep it safe and unique.']
        }
      }
    ];
    
    results.value = sampleResults;
    return Promise.resolve();
  },
  
  // Clear sample results
  clearSampleResults: () => {
    results.value = [];
    return Promise.resolve();
  }
};

/* -------------------------------------------------------
   TOASTS
------------------------------------------------------- */
function showToast(msg) {
  toast.value = msg;
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => {
    toast.value = "";
  }, 2000);
}

/* -------------------------------------------------------
   RESULTS HANDLING
------------------------------------------------------- */
function addResults(newItems) {
  const existing = new Set(results.value.map(r => r.password));
  const duplicates = newItems.filter(item => existing.has(item.password));
  const filtered = newItems.filter(item => !existing.has(item.password));

  if (duplicates.length > 0) {
    showToast("Some passwords were already checked");
  }

  results.value = [...results.value, ...filtered];
}

function removeItem(id) {
  results.value = results.value.filter(r => r.id !== id);
}

/* -------------------------------------------------------
   DARK MODE
------------------------------------------------------- */
function toggleDark() {
  isDark.value = !isDark.value;
  localStorage.setItem("darkMode", String(isDark.value));
  document.body.classList.toggle("dark", isDark.value);
  document.body.classList.toggle("light", !isDark.value);
}

// Watch for results changes to update tour positioning
watch(results, () => {
  // When results change, we need to wait a bit for DOM update
  if (showTour.value) {
    setTimeout(() => {
      // This will trigger tour to reposition
      window.dispatchEvent(new Event('resize'));
    }, 100);
  }
}, { deep: true });

/* -------------------------------------------------------
   TOUR STEPS WITH PROPER ASYNC ACTIONS
------------------------------------------------------- */
// Define tour steps as a computed property
const tourSteps = [
  /* 1. Dark/Light mode */
  {
    target: '.header-actions button:nth-child(3)',
    text: 'Switch between light and dark mode anytime.',
    placement: 'bottom'
  },
  /* 2. Single */
  {
    target: '[data-tour-target="single-mode-btn"]',
    text: 'This is Single Password mode — check one password at a time.',
    placement: 'bottom'
  },
  /* 3. Single Password workflow */
  {
    target: '[data-tour-target="single-password-input"]',
    text: 'Enter a password here to analyse it. Let me add a sample for demonstration.',
    placement: 'bottom',
    action: async () => {
      await tourActions.addSamplePassword();
    }
  },
  {
    target: '[data-tour-target="toggle-visibility-btn"]',
    text: 'Click here to show or hide your password.',
    placement: 'right'
  },
  {
    target: '[data-tour-target="check-button"]',
    text: 'Click Check to analyse your password. Let me add some sample results to show you.',
    placement: 'bottom',
    action: async () => {
      await tourActions.addSampleResults();
    }
  },
  {
    target: '.results-container',
    text: 'Your results will appear here. I\'ve added sample results to demonstrate.',
    placement: 'top'
  },
  {
    target: '[data-tour-target="clear-button"]',
    text: 'Clear all results.',
    placement: 'bottom',
    action: async () => {
      await tourActions.clearSampleResults();
    }
  },
  {
    target: '[data-tour-target="generate-password-btn"]',
    text: 'Generate a strong random password.',
    placement: 'right'
  },
  /* 4. Switch to Multiple Password mode */
  {
    target: '[data-tour-target="multi-mode-btn"]',
    text: 'Now let\'s look at Multiple Password mode.',
    placement: 'bottom',
    action: async () => {
      await tourActions.clearSampleResults(); // Clear previous results
      await tourActions.switchToMultiMode();
    }
  },
  {
    target: '[data-tour-target="multi-password-textarea"]',
    text: 'Enter one password per line to check them together. I\'ll add some samples.',
    placement: 'bottom',
    action: async () => {
      await tourActions.addSampleMultiPasswords();
    }
  },
  {
    target: '[data-tour-target="check-button"]',
    text: 'Click Check to analyse all passwords.',
    placement: 'bottom',
    action: async () => {
      await tourActions.addSampleResults(); // Show results for multiple passwords
    }
  },
  {
    target: '.results-container',
    text: 'Results for all passwords will appear here.',
    placement: 'top'
  },
    {
    target: '[data-tour-target="clear-button"]',
    text: 'Clear all results.',
    placement: 'bottom',
    action: async () => {
      await tourActions.clearSampleResults();
    }
  },
  /* 5. Switch back to Single mode and clean up */
  {
    target: '[data-tour-target="single-mode-btn"]',
    text: 'Returning to Single Password mode. I\'ll clear everything and show you the clean interface.',
    placement: 'bottom',
    action: async () => {
      await tourActions.clearSampleResults(); // Clear results
      await tourActions.clearSampleMultiPasswords(); // Clear multi passwords
      await tourActions.switchToSingleMode();
      await tourActions.clearSamplePassword(); // Clear single password
    }
  }
];
</script>

<template>
  <div class="app-shell" :class="{ 'app-dark': isDark }">
    <!-- Product Tour at root level (outside .app container) -->
    <ProductTour
      v-if="showTour && !isInitializingTour"
      :steps="tourSteps"
      @finish="finishTour"
    />

    <!-- Tutorial Modal -->
    <transition name="fade">
      <TutorialModal v-if="showTutorial" @close="closeTutorial" />
    </transition>

    <div class="app">
      <!-- Header -->
      <header class="app-header">
        <h1>Password Leak Checker</h1>
        <p>
          Check whether your passwords have appeared in known data breaches and get
          strength and security advice.
        </p>

        <div class="header-actions">
          <button @click="showTutorial = true">View Intro again</button>
          <button @click="restartTour">Restart tour</button>
          <button @click="toggleDark">
            {{ isDark ? "Light mode" : "Dark mode" }}
          </button>
        </div>
      </header>

      <!-- Main content -->
      <main class="app-main">
        <PasswordForm
          ref="passwordFormRef"
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
.app-shell {
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding: 1rem;
  position: relative;
}

.app {
  position: relative;
  width: 100%;
  max-width: 720px;
  display: flex;
  flex-direction: column;
  z-index: 1;
}

.app-header {
  text-align: center;
  margin-bottom: 1.5rem;
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
  transition: background 0.2s ease;
}

.header-actions button:hover {
  background: #1d4ed8;
}

.app-main {
  background: #f7f7f7;
  border-radius: 8px;
  padding: 1rem 1.25rem 1.5rem;
  box-shadow: 0 2px 6px rgba(0,0,0,0.08);
  flex: 1;
  overflow-y: visible;
  min-height: 400px;
}

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

.app-dark {
  background-color: #0f172a;
  color: #e2e8f0;
}

.app-dark .app-main {
  background: #1e293b;
}

.app-dark .header-actions button {
  background: #3b82f6;
}

.app-dark .header-actions button:hover {
  background: #2563eb;
}

.app-dark .toast {
  background: #334155;
  color: #f8fafc;
}

/* Transitions */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateY(10px);
}
</style>