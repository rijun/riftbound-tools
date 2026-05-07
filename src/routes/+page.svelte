<script lang="ts">
  import DeckUploader from '$lib/components/DeckUploader.svelte';
  import DeckCodePanel from '$lib/components/DeckCodePanel.svelte';
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
          <!-- Outer ring -->
          <circle cx="32" cy="32" r="29" stroke="currentColor" stroke-width="1.25" opacity="0.55"/>
          <circle cx="32" cy="32" r="22" stroke="currentColor" stroke-width="0.75" opacity="0.35"/>
          <!-- Inner rune: hexagram with fissure -->
          <path d="M32 8 L52 44 L12 44 Z" stroke="currentColor" stroke-width="1.25" stroke-linejoin="round"/>
          <path d="M32 56 L12 20 L52 20 Z" stroke="currentColor" stroke-width="1.25" stroke-linejoin="round" opacity="0.65"/>
          <!-- Center fissure -->
          <path d="M32 16 L34 30 L30 34 L32 48" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
          <circle cx="32" cy="32" r="2" fill="currentColor"/>
        </svg>
      </div>
      <div class="masthead-text">
        <p class="eyebrow">Codex of the Rift</p>
        <h1>Riftbound <span class="amp">&amp;</span> Decklist Analyser</h1>
        <p class="lede">Compare summoner decks rune-by-rune, card-by-card.</p>
      </div>
      <div class="masthead-rule" aria-hidden="true">
        <span></span><span></span><span></span>
      </div>
    </div>
  </header>

  <div class="upload-grid">
    <div class="decks-side">
      <h2 class="side-label">Decks</h2>
      <DeckUploader />
      <DeckCodePanel />
    </div>
    <div class="comparisons-side">
      <h2 class="side-label">Comparisons</h2>
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

  .eyebrow {
    margin: 0;
    font-family: var(--rb-font-mono);
    font-size: var(--rb-fs-xs);
    text-transform: uppercase;
    letter-spacing: var(--rb-tracking-widest);
    color: var(--rb-gold);
    opacity: 0.85;
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
  h1 .amp {
    color: var(--rb-gold);
    font-style: italic;
    font-weight: 500;
    -webkit-text-fill-color: var(--rb-gold);
    margin: 0 0.15em;
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
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
    margin-bottom: 1rem;
  }
  .decks-side, .comparisons-side {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }
  .side-label {
    margin: 0;
    font-size: var(--rb-fs-md, 0.95rem);
    font-weight: 500;
    color: var(--rb-vellum-dim, #c9c9cf);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  /* ===== Responsive ===== */
  @media (max-width: 720px) {
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
