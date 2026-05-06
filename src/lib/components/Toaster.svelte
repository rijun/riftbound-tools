<script lang="ts">
  import { getToasts } from './toaster-store.svelte.ts';
  const toasts = getToasts();
</script>

<div class="toaster">
  {#each toasts as t (t.id)}
    <div class="toast" class:error={t.kind === 'error'}>{t.message}</div>
  {/each}
</div>

<style>
  .toaster {
    position: fixed;
    bottom: 1rem;
    right: 1rem;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    z-index: 1000;
  }
  .toast {
    background: #1a1c22;
    color: #e8e8ee;
    padding: 0.75rem 1rem;
    border-radius: 6px;
    border: 1px solid #2a2d35;
    box-shadow: 0 6px 20px rgba(0,0,0,0.4);
    max-width: 400px;
  }
  .toast.error { border-color: #c84d3b; }
</style>
