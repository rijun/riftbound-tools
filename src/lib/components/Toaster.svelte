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
    bottom: var(--rb-space-4);
    right: var(--rb-space-4);
    display: flex;
    flex-direction: column;
    gap: var(--rb-space-2);
    z-index: 1000;
  }
  .toast {
    background: linear-gradient(180deg, var(--rb-ink-2), var(--rb-ink-1));
    color: var(--rb-vellum);
    padding: var(--rb-space-3) var(--rb-space-4);
    border-radius: var(--rb-radius-md);
    border: 1px solid var(--rb-line-strong);
    border-left: 3px solid var(--rb-gold);
    box-shadow: var(--rb-shadow-lg);
    max-width: 400px;
    font-size: var(--rb-fs-sm);
    animation: toast-in var(--rb-dur-base) var(--rb-ease-out);
  }
  .toast.error {
    border-color: var(--rb-blood);
    border-left: 3px solid var(--rb-blood);
    color: var(--rb-vellum);
    box-shadow: var(--rb-shadow-lg), 0 0 0 1px rgba(214, 90, 71, 0.25);
  }

  @keyframes toast-in {
    from { opacity: 0; transform: translateX(20px); }
    to   { opacity: 1; transform: translateX(0); }
  }
</style>
