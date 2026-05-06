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
    gap: 1rem;
    align-items: start;
  }
  img { width: 100%; border-radius: 8px; }
  h3 { margin: 0 0 0.5rem 0; }
  .meta { display: flex; flex-wrap: wrap; gap: 0.5rem; opacity: 0.85; font-size: 0.9em; }
  .meta span {
    background: rgba(255,255,255,0.05);
    border: 1px solid #2a2d35;
    padding: 0.1rem 0.45rem;
    border-radius: 4px;
  }
  .text { white-space: pre-wrap; }
  .flavour { font-style: italic; opacity: 0.7; }
  .set, .tags { font-size: 0.8em; opacity: 0.6; }
  .missing { opacity: 0.75; font-style: italic; }
  .id { opacity: 0.5; font-family: monospace; }
  @media (max-width: 720px) {
    .detail { grid-template-columns: 1fr; }
    img { max-width: 220px; }
  }
</style>
