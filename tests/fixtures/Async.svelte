<script lang="ts">
  import { createSound } from 'svelte-sound';
  import { memoryPlayer } from './memory-player.js';
  const player = createSound({
    src: 'async-effect',
    createPlayer: memoryPlayer,
  });
  const label = await Promise.resolve('resolved');
</script>

<p id="async-status">{label}:{player.state.status}</p>
