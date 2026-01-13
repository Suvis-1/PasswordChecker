<script setup>
import { ref, watch } from "vue";
import StrengthBadge from "./StrengthBadge.vue";
import AdvicePanel from "./AdvicePanel.vue";

const props = defineProps({
  results: {
    type: Array,
    required: true,
  },
});

const emit = defineEmits(["remove", "toast"]);

// Track expanded rows
const openRows = ref(new Set());

// Toggle a single row
function toggleRow(id) {
  if (openRows.value.has(id)) openRows.value.delete(id);
  else openRows.value.add(id);
}

// Expand all
function expandAll() {
  openRows.value = new Set(props.results.map(r => r.id));
}

// Collapse all
function collapseAll() {
  openRows.value = new Set();
}

/* -------------------------------------------------------
   FORMAT ADVICE FOR COPY (single + all)
------------------------------------------------------- */
function formatAdvice(item) {
  const strengthLabels = ["Very weak", "Weak", "Fair", "Strong", "Very strong"];

  const lines = [];

  lines.push(`Password: ${item.password}`);
  lines.push(`Strength: ${strengthLabels[item.strengthScore]} (${item.strengthScore}/4)`);

  if (item.leaked) {
    lines.push(`Leaked: Yes`);
    lines.push(`Times seen: ${item.count.toLocaleString()}`);
  } else {
    lines.push(`Leaked: No`);
    lines.push(`Times seen: -`);
  }

  lines.push("");
  lines.push("Advice:");

  const advice = [];

  if (item.leaked) {
    advice.push("This password has appeared in known data breaches.");

    if (item.count > 1_000_000) {
      advice.push("This is an extremely common password and widely used by attackers.");
    } else if (item.count > 1_000) {
      advice.push("This password is widely known and frequently attempted by attackers.");
    } else {
      advice.push("Even a small number of breaches is enough to consider it unsafe.");
    }

    advice.push("Change this password everywhere it is used and enable two-factor authentication.");
  } else {
    advice.push("This password was not found in the known breached password dataset.");
  }

  if (item.strengthScore <= 1) {
    advice.push("Your password is weak. Use a longer passphrase (14+ characters) with mixed character types.");
  } else if (item.strengthScore === 2) {
    advice.push("Your password is average. Add more randomness or length to improve it.");
  } else if (item.strengthScore >= 3 && !item.leaked) {
    advice.push("This is a strong password. Keep it unique and avoid reusing it across accounts.");
  }

  if (item.strengthFeedback.warning) {
    advice.push(item.strengthFeedback.warning);
  }
  if (item.strengthFeedback.suggestions?.length) {
    advice.push(...item.strengthFeedback.suggestions);
  }

  advice.forEach(a => lines.push(`- ${a}`));

  return lines.join("\n");
}

/* -------------------------------------------------------
   COPY ALL ADVICE
------------------------------------------------------- */
function copyAllAdvice() {
  const all = props.results
    .map(item => formatAdvice(item))
    .join("\n\n----------------------\n\n");

  navigator.clipboard.writeText(all)
    .then(() => emit("toast", "All advice copied!"))
    .catch(err => console.error("Copy failed:", err));
}

/* -------------------------------------------------------
   COPY SINGLE ADVICE
------------------------------------------------------- */
function copySingle(item) {
  const formatted = formatAdvice(item);

  navigator.clipboard.writeText(formatted)
    .then(() => emit("toast", "Advice copied!"))
    .catch(err => console.error("Copy failed:", err));
}

// Auto-expand newly added rows
watch(
  () => props.results,
  (newVal, oldVal) => {
    if (newVal.length > oldVal.length) {
      const newItems = newVal.slice(oldVal.length);
      newItems.forEach(item => openRows.value.add(item.id));
    }
  }
);
</script>

<template>
  <transition name="fade-slide">
    <section v-if="results.length" class="results">

      <!-- Bulk controls -->
      <div class="bulk-controls">
        <button @click="expandAll">Expand all</button>
        <button @click="collapseAll">Collapse all</button>
        <button @click="copyAllAdvice">Copy all</button>
      </div>

      <!-- FIXED HEIGHT WRAPPER -->
      <div class="results-container">
        <table class="results-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Password</th>
              <th>Leaked</th>
              <th>Times seen</th>
              <th>Strength</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            <template v-for="(item, index) in results" :key="item.id">

              <!-- MAIN ROW -->
              <tr>
                <td>{{ index + 1 }}</td>

                <td class="password-cell">
                  <div class="password-header">
                    <code>{{ item.password }}</code>

                    <button class="toggle-btn" @click="toggleRow(item.id)">
                      {{ openRows.has(item.id) ? "Hide" : "Show" }}
                    </button>
                  </div>
                </td>

                <td>
                  <span v-if="item.leaked" class="badge bad">Yes</span>
                  <span v-else class="badge good">No</span>
                </td>

                <td>
                  <span v-if="item.leaked">{{ item.count.toLocaleString() }}</span>
                  <span v-else>-</span>
                </td>

                <td>
                  <StrengthBadge :score="item.strengthScore" />
                </td>

                <td class="actions-cell">
                  <button class="copy-btn" @click="copySingle(item)">
                    Copy advice
                  </button>

                  <button class="remove-btn" @click="emit('remove', item.id)">
                    Remove
                  </button>
                </td>
              </tr>

              <!-- EXPANDED ADVICE ROW -->
              <tr v-if="openRows.has(item.id)" class="advice-row">
                <td colspan="6">
                  <AdvicePanel
                    :item="item"
                    :formatAdvice="formatAdvice"
                    @toast="emit('toast', $event)"
                  />
                </td>
              </tr>

            </template>
          </tbody>
        </table>
      </div>

    </section>
  </transition>
</template>

<style scoped>
.results {
  margin-top: 1.5rem;
}

/* FIXED HEIGHT WRAPPER */
.results-container {
  max-height: 600px;
  overflow-y: auto;
  padding-right: 0.5rem;
  border-radius: 6px;
}

/* Bulk controls */
.bulk-controls {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
  flex-wrap: wrap;
}

.bulk-controls button {
  background: #2563eb;
  color: white;
  border: none;
  padding: 0.35rem 0.75rem;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.8rem;
}

/* Table */
.results-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.9rem;
}

.results-table th,
.results-table td {
  border-bottom: 1px solid #e5e7eb;
  padding: 0.5rem 0.4rem;
  vertical-align: top;
}

/* Password column */
.password-cell code {
  display: inline-block;
  background: #e5e7eb;
  padding: 0.1rem 0.3rem;
  border-radius: 4px;
  font-size: 0.8rem;
}

.password-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.toggle-btn {
  background: #e5e7eb;
  border: none;
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.75rem;
}

/* Advice row */
.advice-row td {
  background: transparent;
  padding-top: 0.4rem;
  padding-bottom: 0.8rem;
}

/* Actions column */
.actions-cell {
  display: flex;
  gap: 0.4rem;
}

.copy-btn {
  background: #3b82f6;
  color: white;
  border: none;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.75rem;
}

.app-dark .copy-btn {
  background: #60a5fa;
}

/* Leaked badges */
.badge {
  display: inline-block;
  padding: 0.1rem 0.4rem;
  border-radius: 999px;
  font-size: 0.75rem;
  color: white;
}

.badge.bad {
  background: #b91c1c;
}

.badge.good {
  background: #16a34a;
}

/* Remove button */
.remove-btn {
  background: #ef4444;
  color: white;
  border: none;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.75rem;
}

/* Animations */
.fade-slide-enter-active {
  transition: all 0.25s ease-out;
}
.fade-slide-leave-active {
  transition: all 0.15s ease-in;
}
.fade-slide-enter-from {
  opacity: 0;
  transform: translateY(10px);
}
.fade-slide-enter-to {
  opacity: 1;
  transform: translateY(0);
}
.fade-slide-leave-from {
  opacity: 1;
}
.fade-slide-leave-to {
  opacity: 0;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease-out;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Dark mode */
.app-dark .results-table th,
.app-dark .results-table td {
  color: #e2e8f0;
  border-color: #334155;
}

.app-dark .password-cell code {
  background: #334155;
  color: #f1f5f9;
}

.app-dark .toggle-btn {
  background: #475569;
  color: #f8fafc;
}

.app-dark .remove-btn {
  background: #dc2626;
}

.app-dark .bulk-controls button {
  background: #3b82f6;
}

.app-dark .results-container {
  scrollbar-color: #64748b #1e293b;
}
</style>
