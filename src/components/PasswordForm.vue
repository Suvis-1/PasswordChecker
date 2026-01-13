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
</script>

<template>
  <section class="password-form">
    <h2>Check passwords</h2>

    <!-- Mode switch -->
    <div class="mode-switch">
      <button :class="{ active: mode === 'single' }" @click="mode = 'single'">
        Single password
      </button>
      <button :class="{ active: mode === 'multi' }" @click="mode = 'multi'">
        Multiple passwords
      </button>
    </div>

    <!-- SINGLE MODE -->
    <div v-if="mode === 'single'" class="field">
      <label>Password</label>
      <div class="password-input-wrapper">
        <input
          :type="showSinglePassword ? 'text' : 'password'"
          v-model="singlePassword"
          placeholder="Enter a password"
        />

        <button class="toggle-visibility" @click="showSinglePassword = !showSinglePassword">
          {{ showSinglePassword ? "Hide" : "Show" }}
        </button>

        <button class="generate-btn" @click="handleGenerate">
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
      ></textarea>
    </div>

    <!-- Actions -->
    <div class="actions">
      <button @click="handleSubmit" :disabled="loading">
        {{ loading ? "Checking..." : "Check" }}
      </button>

      <button class="clear-btn" @click="clearForm">
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
}
.mode-switch button.active {
  background: #000000;
  color: white;
}

/* Fields */
.field {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  margin-bottom: 0.75rem;
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
}
.password-input-wrapper button {
  flex: 0 0 auto;
}

/* Buttons */
.toggle-visibility,
.generate-btn {
  flex: 1 1 auto;
  white-space: nowrap;
}

.generate-btn {
  background: #f3f4f6;
  color: #374151;
  border: 1px solid #d1d5db;
}

.actions {
  display: flex;
  gap: 0.5rem;
}

button {
  padding: 0.5rem 0.9rem;
  border-radius: 4px;
  border: none;
  background: #2563eb;
  color: white;
  cursor: pointer;
}

.clear-btn {
  background: #f3f4f6;
  color: #374151;
  border: 1px solid #d1d5db;
}

/* Error */
.error {
  color: #b91c1c;
  margin-top: 0.5rem;
}

/* Dark mode compatibility */
.app-dark .password-form input,
.app-dark .password-form textarea {
  background: #334155;
  color: #f1f5f9;
  border-color: #475569;
}

.app-dark .toggle-visibility,
.app-dark .generate-btn {
  background: #475569;
  color: #f8fafc;
  border-color: #64748b;
}

.app-dark .clear-btn {
  background: #475569;
  color: #f8fafc;
  border-color: #64748b;
}
</style>
