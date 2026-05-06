<script lang="ts">
  import { cardStore } from '$lib/cards/store.svelte.ts';

  let { cardName, cardId }: { cardName: string; cardId?: string } = $props();

  const card = $derived.by(() => {
    const r = cardStore.resolver;
    if (!r) return undefined;
    return (cardId && r.byId(cardId)) || r.byName(cardName);
  });
</script>

{#if !card}
  <div class="missing">
    <strong>{cardName}</strong> — no match in card DB.
    {#if cardId}<span class="id"> ({cardId})</span>{/if}
  </div>
{:else}
  <div class="detail">
    {#if card.media?.image_url}
      <img src={card.media.image_url} alt={card.media.accessibility_text ?? card.name} />
    {/if}
    <div class="fields">
      <h3>{card.name}</h3>
      <p class="meta">
        {#if card.classification?.type}<span>{card.classification.type}</span>{/if}
        {#if card.classification?.rarity}<span>{card.classification.rarity}</span>{/if}
        {#if card.classification?.domain && card.classification.domain.length > 0}
          <span>{card.classification.domain.join(' / ')}</span>
        {/if}
        {#if card.attributes?.energy != null}<span>Energy {card.attributes.energy}</span>{/if}
        {#if card.attributes?.power != null}<span>Power {card.attributes.power}</span>{/if}
        {#if card.attributes?.might != null}<span>Might {card.attributes.might}</span>{/if}
      </p>
      {#if card.text?.plain}<p class="text">{card.text.plain}</p>{/if}
      {#if card.text?.flavour}<p class="flavour">{card.text.flavour}</p>{/if}
      {#if card.set}<p class="set">{card.set.label} · {card.collector_number ?? card.id}</p>{/if}
      {#if card.tags && card.tags.length > 0}
        <p class="tags">{card.tags.join(', ')}</p>
      {/if}
    </div>
  </div>
{/if}

<style>
  .detail {
    display: grid;
    grid-template-columns: 220px 1fr;
    gap: var(--rb-space-5);
    align-items: start;
  }
  img {
    width: 100%;
    border-radius: var(--rb-radius-md);
    border: 1px solid var(--rb-gold-deep);
    box-shadow: var(--rb-shadow-md), 0 0 0 1px rgba(212, 176, 106, 0.1);
  }
  .fields {
    display: flex;
    flex-direction: column;
    gap: var(--rb-space-2);
  }
  h3 {
    margin: 0;
    font-family: var(--rb-font-display);
    font-weight: 600;
    font-size: var(--rb-fs-lg);
    letter-spacing: var(--rb-tracking-wide);
    color: var(--rb-gold);
    text-transform: uppercase;
  }
  .meta {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem;
    margin: 0;
    font-size: var(--rb-fs-xs);
  }
  .meta span {
    background: var(--rb-ink-2);
    border: 1px solid var(--rb-line);
    padding: 0.18rem 0.55rem;
    border-radius: var(--rb-radius-xs);
    color: var(--rb-vellum-mute);
    font-family: var(--rb-font-mono);
    text-transform: uppercase;
    letter-spacing: var(--rb-tracking-wider);
  }
  .text {
    white-space: pre-wrap;
    color: var(--rb-vellum);
    font-size: var(--rb-fs-base);
    line-height: var(--rb-lh-base);
    margin: var(--rb-space-1) 0;
  }
  .flavour {
    font-family: var(--rb-font-display);
    font-style: italic;
    color: var(--rb-vellum-mute);
    font-size: var(--rb-fs-sm);
    border-left: 2px solid var(--rb-gold-deep);
    padding-left: var(--rb-space-3);
    margin: var(--rb-space-2) 0;
  }
  .set, .tags {
    font-family: var(--rb-font-mono);
    font-size: var(--rb-fs-xs);
    text-transform: uppercase;
    letter-spacing: var(--rb-tracking-wide);
    color: var(--rb-vellum-faint);
    margin: 0;
  }
  .missing {
    color: var(--rb-vellum-dim);
    font-style: italic;
  }
  .id {
    color: var(--rb-vellum-faint);
    font-family: var(--rb-font-mono);
  }

  @media (max-width: 720px) {
    .detail { grid-template-columns: 1fr; }
    img { max-width: 220px; }
  }
</style>
