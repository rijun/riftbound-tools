<script lang="ts">
  import AddDeckPanel from '$lib/components/AddDeckPanel.svelte';
  import ComparisonUploader from '$lib/components/ComparisonUploader.svelte';
  import Toolbar from '$lib/components/Toolbar.svelte';
  import ComparisonTable from '$lib/components/ComparisonTable.svelte';
  import MetaPanel from '$lib/components/MetaPanel.svelte';
  import Toaster from '$lib/components/Toaster.svelte';
  import { decksState } from '$lib/state/decks.svelte.ts';
</script>

<main class="page">
  <header class="masthead">
    <div class="masthead-inner">
      <div class="sigil" aria-hidden="true">
        <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
          <!-- Outer hexagon -->
          <path d="M32 4 L56 18 L56 46 L32 60 L8 46 L8 18 Z" stroke="currentColor" stroke-width="1" opacity="0.55"/>
          <!-- Inner subtle hex -->
          <path d="M32 12 L48 22 L48 42 L32 52 L16 42 L16 22 Z" stroke="currentColor" stroke-width="0.6" opacity="0.3"/>
          <!-- Left rune -->
          <path d="M18 22 L24 32 L18 42 L12 32 Z" stroke="currentColor" stroke-width="1.25" stroke-linejoin="round" opacity="0.75"/>
          <!-- Right rune -->
          <path d="M46 22 L52 32 L46 42 L40 32 Z" stroke="currentColor" stroke-width="1.25" stroke-linejoin="round"/>
          <!-- Central rift -->
          <path d="M32 14 L34 24 L30 32 L34 40 L32 50" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          <circle cx="32" cy="32" r="1.5" fill="currentColor"/>
        </svg>
      </div>
      <div class="masthead-text">
        <h1>Riftbound Decklist Comparisons</h1>
        <p class="lede">Compare summoner decks card-by-card.</p>
      </div>
      <div class="masthead-rule" aria-hidden="true">
        <span></span><span></span><span></span>
      </div>
    </div>
  </header>

  <div class="upload-grid">
    <div class="upload-col">
      <h2 class="side-label">Summon a deck</h2>
      <AddDeckPanel />
    </div>
    <div class="upload-col">
      <h2 class="side-label">Restore comparison</h2>
      <ComparisonUploader />
    </div>
  </div>

  {#if decksState.decks.length > 0}
    <MetaPanel />
    <Toolbar />
    <ComparisonTable />
  {:else}
    <p class="empty">
      <span class="empty-glyph" aria-hidden="true">◇ ◆ ◇</span>
      <span class="empty-text">Drop deck files to begin the divination.</span>
    </p>
  {/if}

  <footer class="page-foot" aria-hidden="true">
    <span>~ The rift remembers ~</span>
  </footer>

  <Toaster />
</main>

<style>
  .page {
    max-width: var(--rb-container-max);
    margin: 0 auto;
    padding: var(--rb-space-5) var(--rb-content-pad-x) var(--rb-space-7);
  }

  /* ===== Masthead ===== */
  .masthead {
    position: relative;
    margin: var(--rb-space-4) 0 var(--rb-space-6);
    padding: var(--rb-space-5) 0 var(--rb-space-4);
  }

  .masthead-inner {
    display: grid;
    grid-template-columns: auto 1fr;
    align-items: center;
    gap: clamp(1rem, 1rem + 1vw, 2rem);
  }

  .sigil {
    width: clamp(56px, 4vw + 40px, 84px);
    aspect-ratio: 1;
    color: var(--rb-gold);
    filter: drop-shadow(0 0 14px var(--rb-gold-glow));
    animation: sigil-rise var(--rb-dur-slow) var(--rb-ease-out) both;
  }
  .sigil svg {
    width: 100%;
    height: 100%;
    animation: sigil-spin 60s linear infinite;
  }

  .masthead-text {
    display: flex;
    flex-direction: column;
    gap: 0.15rem;
    animation: rise var(--rb-dur-slow) var(--rb-ease-out) 60ms both;
  }

  h1 {
    margin: 0.1rem 0 0.2rem;
    font-family: var(--rb-font-display);
    font-weight: 600;
    font-size: var(--rb-fs-display);
    letter-spacing: var(--rb-tracking-wide);
    line-height: var(--rb-lh-tight);
    color: var(--rb-vellum);
    text-transform: uppercase;
    /* Subtle gold-into-vellum gradient on letters for depth */
    background: linear-gradient(180deg,
      #f5edd6 0%,
      #efe7d2 60%,
      #c4a872 100%);
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
    text-shadow: 0 1px 0 rgba(0, 0, 0, 0.25);
  }

  .lede {
    margin: 0;
    font-size: var(--rb-fs-sm);
    color: var(--rb-vellum-mute);
    letter-spacing: 0.02em;
  }

  /* Triple hairline rule under masthead — gold+vellum bands */
  .masthead-rule {
    grid-column: 1 / -1;
    margin-top: var(--rb-space-4);
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  .masthead-rule span:nth-child(1) {
    height: 1px;
    background: linear-gradient(to right,
      transparent,
      var(--rb-gold-deep) 12%,
      var(--rb-gold) 50%,
      var(--rb-gold-deep) 88%,
      transparent);
  }
  .masthead-rule span:nth-child(2) {
    height: 1px;
    background: var(--rb-line);
    opacity: 0.6;
  }
  .masthead-rule span:nth-child(3) {
    height: 1px;
    background: linear-gradient(to right, transparent, var(--rb-line-strong), transparent);
    opacity: 0.5;
  }

  /* ===== Empty state ===== */
  .empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--rb-space-2);
    padding: var(--rb-space-7) 0;
    text-align: center;
    color: var(--rb-vellum-dim);
    font-style: italic;
    animation: rise var(--rb-dur-slow) var(--rb-ease-out) both;
  }
  .empty-glyph {
    color: var(--rb-gold);
    letter-spacing: 0.5em;
    font-size: var(--rb-fs-md);
    opacity: 0.7;
  }
  .empty-text {
    font-family: var(--rb-font-display);
    font-size: var(--rb-fs-md);
    letter-spacing: var(--rb-tracking-wide);
    color: var(--rb-vellum-mute);
  }

  /* ===== Foot ornament ===== */
  .page-foot {
    margin-top: var(--rb-space-7);
    text-align: center;
    font-family: var(--rb-font-display);
    font-size: var(--rb-fs-xs);
    letter-spacing: var(--rb-tracking-widest);
    color: var(--rb-vellum-faint);
    text-transform: uppercase;
  }

  /* ===== Animations ===== */
  @keyframes rise {
    from { opacity: 0; transform: translateY(8px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes sigil-rise {
    from { opacity: 0; transform: scale(0.85) rotate(-12deg); }
    to   { opacity: 1; transform: scale(1) rotate(0); }
  }
  @keyframes sigil-spin {
    from { transform: rotate(0); }
    to   { transform: rotate(360deg); }
  }

  /* ===== Upload grid ===== */
  .upload-grid {
    display: grid;
    grid-template-columns: minmax(0, 2.4fr) minmax(0, 1fr);
    gap: 1rem;
    margin-bottom: 1rem;
  }
  .upload-col {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }
  .side-label {
    margin: 0 0 var(--rb-space-1);
    padding-bottom: var(--rb-space-2);
    font-family: var(--rb-font-mono);
    font-size: var(--rb-fs-xs);
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: var(--rb-tracking-widest);
    color: var(--rb-gold);
    opacity: 0.85;
    border-bottom: 1px solid var(--rb-line);
    position: relative;
  }
  .side-label::after {
    /* tiny gold tick under the label, masthead echo */
    content: '';
    position: absolute;
    left: 0;
    bottom: -1px;
    width: 1.5rem;
    height: 1px;
    background: linear-gradient(to right, var(--rb-gold), transparent);
  }

  /* ===== Responsive ===== */
  @media (max-width: 900px) {
    .upload-grid { grid-template-columns: 1fr; }
  }
  @media (max-width: 640px) {
    .masthead-inner {
      grid-template-columns: 1fr;
      text-align: center;
      justify-items: center;
    }
  }
</style>
