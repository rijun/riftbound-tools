<script lang="ts">
  let { cardName, cardId: _cardId }: { cardName: string; cardId?: string } = $props();
  // _cardId unused for now; consumed in Task 18
</script>

<div>Card detail for {cardName} (stub)</div>
