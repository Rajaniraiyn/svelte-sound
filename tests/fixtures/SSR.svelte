<script lang="ts">
  import { createSound } from 'svelte-sound';
  const player = createSound({
    src: '/never-fetched.mp3',
    preload: true,
    createPlayer() {
      throw new Error('SSR must not create audio.');
    },
  });
</script>

<p>{player.state.status}:{player.state.playing}</p>
