<script lang="ts">
  import {sound} from "svelte-sound";
  import click_mp3 from "../assets/click.mp3";

  let count: number = 0
  const increment = () => {
    count += 1
  }
</script>

<button on:click={increment} use:sound={{src:click_mp3, events:["click"] }}>
  count is {count}
</button>
