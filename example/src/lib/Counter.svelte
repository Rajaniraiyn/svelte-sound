<script lang="ts">
  import { Sound, sound } from "svelte-sound";
  import click_mp3 from "../assets/click.mp3";

  let count: number = 0;
  const increment = () => {
    count += 1;
  };

  const clickSound = new Sound(click_mp3); // this is reusable sound

  function handleClick() {
    clickSound.play();
    setTimeout(() => {
      clickSound.play();
      count += 1; // this is to accompany the double click sound
    }, 400);
  }
</script>

<div>
  <div class="button">
    Action
    <button
      on:click={increment}
      use:sound={{ src: click_mp3, events: ["click"] }}
    >
      count is {count}
    </button>
    <span> (single click sound) </span>
  </div>

  <div class="button">
    Manual Sound
    <button on:click={increment} on:click={handleClick}>
      count is {count}
    </button>
    <span> (double click sound) </span>
  </div>
</div>

<style>
  div {
    display: flex;
    flex-direction: row;
    justify-content: space-around;
  }
  .button {
    display: inline-flex;
    flex-direction: column;
  }

  span {
    font-size: 0.8em;
    color: #999;
  }
</style>
