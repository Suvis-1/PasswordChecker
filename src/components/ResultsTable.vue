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

// Emit events to parent (App.vue)
const emit = defineEmits(["remove", "toast"]);

// Track which rows are expanded
const openRows = ref(new Set());

// Toggle a single row
function toggleRow(id) {
  if (openRows.value.has(id)) {
    openRows.value.delete(id);
  } else {
    openRows.value.add(id);
  }
}

// Expand all rows
function expandAll() {
  openRows.value = new Set(props.results.map(r => r.id));
}

// Collapse all rows
function collapseAll() {
  openRows.value = new Set();
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
      
      <!-- Expand/Collapse All -->
      <div class="bulk-controls">
        <button @click="expandAll">Expand all</button>
        <button @click="collapseAll">Collapse all</button>
      </div>

      <!-- Results Table -->
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
          <tr v-for="item in results" :key="item.id">
            <td>{{ item.id }}</td>

            <!-- PASSWORD + EXPAND/COLLAPSE -->
            <td class="password-cell">
              <div class="password-header">
                <code>{{ item.password }}</code>

                <button class="toggle-btn" @click="toggleRow(item.id)">
                  {{ openRows.has(item.id) ? "Hide" : "Show" }}
                </button>
              </div>

              <!-- Advice Panel -->
              <transition name="fade">
                <div
                  v-if="openRows.has(item.id)"
                  class="advice-wrapper"
                >
                  <AdvicePanel
                    :leaked="item.leaked"
                    :count="item.count"
                    :strength-score="item.strengthScore"
                    :strength-feedback="item.strengthFeedback"
                    @toast="emit('toast', $event)"
                  />
                </div>
              </transition>
            </td>

            <!-- LEAKED -->
            <td>
              <span v-if="item.leaked" class="badge bad">Yes</span>
              <span v-else class="badge good">No</span>
            </td>

            <!-- COUNT -->
            <td>
              <span v-if="item.leaked">
                {{ item.count.toLocaleString() }}
              </span>
              <span v-else>-</span>
            </td>

            <!-- STRENGTH -->
            <td>
              <StrengthBadge :score="item.strengthScore" />
            </td>

            <!-- REMOVE -->
            <td>
              <button class="remove-btn" @click="emit('remove', item.id)">
                Remove
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </section>
  </transition>
</template>

<style scoped>
.results {
  margin-top: 1.5rem;
}

/* Expand/Collapse All Buttons */
.bulk-controls {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
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

.password-cell code {
  display: inline-block;
  background: #e5e7eb;
  padding: 0.1rem 0.3rem;
  border-radius: 4px;
  font-size: 0.8rem;
}

/* Expand/Collapse Button */
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

/* Advice scroll wrapper */
.advice-wrapper {
  max-height: 250px;
  overflow-y: auto;
  margin-top: 0.4rem;
  padding-right: 0.3rem;
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

.app-dark .advice-wrapper {
  scrollbar-color: #64748b #1e293b;
}
</style>
