<script lang="ts">
	import { Icon } from "obsidian-svelte";


  export let href: string;

  function handleClicked(){
    app.workspace.openLinkText(href, "");
  }
</script>

<div class="people-link">
  <span class="prefix"><slot/></span><a on:click={handleClicked}>{href}</a>
</div>

<style>
  .people-link {
    font-size: var(--nav-item-size);
    font-weight: var(--nav-item-weight);
    display: flex;
    align-items: center;
    gap: 4px;
    margin-bottom: 4px;
  }

  .prefix {
    color: var(--nav-item-color);
    display: inline-flex;
    gap: 4px;
  }
</style>