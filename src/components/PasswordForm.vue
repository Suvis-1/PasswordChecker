<script setup>
import { ref } from "vue";
import { fetchPwnedRange } from "../apiClient";
import zxcvbn from "zxcvbn";

// Emit events to parent
const emit = defineEmits(["update:results", "clear"]);

const singlePassword = ref("");
const multiPasswords = ref("");
const mode = ref("single");
const loading = ref(false);
const error = ref("");
const showSinglePassword = ref(false);

// Password generator
const charset =
  "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()-_=+[]{};:,.?/";

function generatePassword(length = 16) {
  const array = new Uint32Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, x => charset[x % charset.length]).join("");
}

function handleGenerate() {
  singlePassword.value = generatePassword(16);
}

// SHA‑1 hashing
async function sha1(str) {
  const data = new TextEncoder().encode(str);
  const hashBuffer = await crypto.subtle.digest("SHA-1", data);
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, "0"))
    .join("")
    .toUpperCase();
}

// Main checker
async function checkPasswordList(passwords) {
  const results = [];

  for (let i = 0; i < passwords.length; i++) {
    const pwd = passwords[i].trim();
    if (!pwd) continue;

    const hash = await sha1(pwd);
    const prefix = hash.slice(0, 5);
    const suffix = hash.slice(5);

    const text = await fetchPwnedRange(prefix);
    const lines = text.split("\n");
    const matchLine = lines.find(line => line.startsWith(suffix));

    let leaked = false;
    let count = 0;

    if (matchLine) {
      leaked = true;
      count = parseInt(matchLine.split(":")[1], 10) || 0;
    }

    const strength = zxcvbn(pwd);

    results.push({
      id: crypto.randomUUID(), // stable unique ID
      password: pwd,
      leaked,
      count,
      strengthScore: strength.score,
      strengthFeedback: strength.feedback,
    });
  }

  emit("update:results", results);
}

// Submit handler
async function handleSubmit() {
  error.value = "";
  loading.value = true;

  try {
    if (mode.value === "single") {
      if (!singlePassword.value) {
        error.value = "Please enter a password.";
        return;
      }
      await checkPasswordList([singlePassword.value]);
    } else {
      const lines = multiPasswords.value
        .split("\n")
        .map(l => l.trim())
        .filter(l => l.length > 0);

      if (!lines.length) {
        error.value = "Please enter at least one password.";
        return;
      }

      await checkPasswordList(lines);
    }
  } catch (err) {
    console.error(err);
    error.value = "Something went wrong. Please try again.";
  } finally {
    loading.value = false;
  }
}

// Clear form + results
function clearForm() {
  singlePassword.value = "";
  multiPasswords.value = "";
  error.value = "";
  emit("clear");
}

// Function to programmatically switch mode (for tour)
function switchMode(newMode) {
  mode.value = newMode;
}

// Expose functions for tour
defineExpose({
  switchMode
});
</script>

<template>
  <section class="password-form">
    <h2>Check passwords</h2>

    <!-- Mode switch -->
    <div class="mode-switch">
      <button 
        :class="{ active: mode === 'single' }" 
        @click="mode = 'single'"
        data-tour-target="single-mode-btn"
      >
        Single password
      </button>
      <button 
        :class="{ active: mode === 'multi' }" 
        @click="mode = 'multi'"
        data-tour-target="multi-mode-btn"
      >
        Multiple passwords
      </button>
    </div>

    <!-- SINGLE MODE -->
    <div v-if="mode === 'single'" class="field">
      <label>Password</label>
      <div class="password-input-wrapper">
        <form @submit.prevent>
          <input
            :type="showSinglePassword ? 'text' : 'password'"
            v-model="singlePassword"
            placeholder="Enter a password"
            data-tour-target="single-password-input"
          />
        </form>


        <button 
          class="toggle-visibility" 
          @click="showSinglePassword = !showSinglePassword"
          data-tour-target="toggle-visibility-btn"
        >
          {{ showSinglePassword ? "Hide" : "Show" }}
        </button>

        <button 
          class="generate-btn" 
          @click="handleGenerate"
          data-tour-target="generate-password-btn"
        >
          Generate
        </button>
      </div>
    </div>

    <!-- MULTI MODE -->
    <div v-else class="field">
      <label>Passwords (one per line)</label>
      <textarea
        rows="6"
        v-model="multiPasswords"
        placeholder="Enter one password per line"
        data-tour-target="multi-password-textarea"
      ></textarea>
    </div>

    <!-- Actions -->
    <div class="actions">
      <button 
        @click="handleSubmit" 
        :disabled="loading"
        data-tour-target="check-button"
      >
        {{ loading ? "Checking..." : "Check" }}
      </button>

      <button 
        class="clear-btn action-button" 
        @click="clearForm"
        data-tour-target="clear-button"
      >
        Clear
      </button>
    </div>

    <p v-if="error" class="error">{{ error }}</p>
  </section>
</template>

<style scoped>
.password-form {
  margin-top: 1rem;
  margin-bottom: 1rem;
}

/* Mode switch */
.mode-switch {
  display: inline-flex;
  border: 1px solid #d1d5db;
  overflow: hidden;
  margin-bottom: 0.75rem;
}
.mode-switch button {
  padding: 0.35rem 0.9rem;
  border: none;
  background: #a7a7a755;
  cursor: pointer;
  color: black;
  transition: background 0.2s ease;
}
.mode-switch button.active {
  background: #000000;
  color: white;
}
.mode-switch button:hover:not(.active) {
  background: #d1d5db;
}

/* Fields */
.field {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  margin-bottom: 0.75rem;
}

.field label {
  font-weight: 500;
  font-size: 0.9rem;
}

/* Password input row */
.password-input-wrapper {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
}

.password-input-wrapper input {
  flex: 1 1 100%;
  min-width: 0;
  padding: 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  font-size: 0.9rem;
  height: 38px; /* Set fixed height */
  box-sizing: border-box; /* Include padding in height */
}

.password-input-wrapper input:focus {
  outline: 2px solid #3b82f6;
  outline-offset: -1px;
}

/* Make all buttons in password-input-wrapper the same size */
.password-input-wrapper button {
  flex: 1 1 auto;
  white-space: nowrap;
  padding: 0.5rem 0.9rem;
  border-radius: 4px;
  border: none;
  cursor: pointer;
  font-size: 0.85rem;
  transition: background 0.2s ease;
  height: 38px; /* Match input height exactly */
  box-sizing: border-box; /* Include padding in height */
}

.toggle-visibility,
.generate-btn {
  background: #f3f4f6;
  color: #374151;
  border: 1px solid #d1d5db !important;
}

.toggle-visibility:hover,
.generate-btn:hover {
  background: #e5e7eb;
}

.generate-btn {
  background: #f3f4f6;
  color: #374151;
  border: 1px solid #d1d5db;
}

/* Textarea */
textarea {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  font-size: 0.9rem;
  font-family: monospace;
  resize: vertical;
  min-height: 120px;
}

textarea:focus {
  outline: 2px solid #3b82f6;
  outline-offset: -1px;
}

/* Actions - Make Check and Clear buttons same size as Show/Generate */
.actions {
  display: flex;
  gap: 0.4rem; /* Same gap as password-input-wrapper */
  margin-top: 1rem;
}

.actions button {
  flex: 1 1 auto; /* Make them flex equally */
  padding: 0.5rem 0.9rem; /* Same padding */
  border-radius: 4px; /* Same border radius */
  border: none;
  cursor: pointer;
  font-size: 0.85rem; /* Same font size */
  transition: background 0.2s ease;
  height: 38px; /* Same height */
  box-sizing: border-box; /* Include padding in height */
  white-space: nowrap; /* Same text wrapping */
}

/* Check button - blue style */
.actions button:first-child {
  background: #2563eb;
  color: white;
  border: 1px solid #2563eb;
}

.actions button:first-child:hover:not(:disabled) {
  background: #1d4ed8;
  border-color: #1d4ed8;
}

/* Clear button - same style as Show/Generate buttons */
.clear-btn {
  background: #f3f4f6;
  color: #374151;
  border: 1px solid #d1d5db !important;
}

.clear-btn:hover {
  background: #e5e7eb;
}

button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Error */
.error {
  color: #b91c1c;
  margin-top: 0.5rem;
  font-size: 0.85rem;
  padding: 0.5rem;
  background: #fee2e2;
  border-radius: 4px;
  border-left: 3px solid #b91c1c;
}

/* Dark mode compatibility */
:deep(.app-dark) .password-form input,
:deep(.app-dark) .password-form textarea {
  background: #334155;
  color: #f1f5f9;
  border-color: #475569;
}

:deep(.app-dark) .password-form input:focus,
:deep(.app-dark) .password-form textarea:focus {
  outline-color: #60a5fa;
}

:deep(.app-dark) .toggle-visibility,
:deep(.app-dark) .generate-btn,
:deep(.app-dark) .clear-btn {
  background: #475569;
  color: #f8fafc;
  border-color: #64748b !important;
}

:deep(.app-dark) .toggle-visibility:hover,
:deep(.app-dark) .generate-btn:hover,
:deep(.app-dark) .clear-btn:hover {
  background: #4b5563;
}

:deep(.app-dark) .actions button:first-child {
  background: #3b82f6;
  border-color: #3b82f6;
}

:deep(.app-dark) .actions button:first-child:hover:not(:disabled) {
  background: #2563eb;
  border-color: #2563eb;
}

:deep(.app-dark) .mode-switch {
  border-color: #475569;
}

:deep(.app-dark) .mode-switch button {
  background: #475569;
  color: #f8fafc;
}

:deep(.app-dark) .mode-switch button.active {
  background: #3b82f6;
  color: white;
}

:deep(.app-dark) .mode-switch button:hover:not(.active) {
  background: #4b5563;
}

:deep(.app-dark) .error {
  color: #fca5a5;
  background: #7f1d1d;
  border-left-color: #ef4444;
}
</style>