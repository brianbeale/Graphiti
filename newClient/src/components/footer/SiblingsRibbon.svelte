<script>
  import nestify from '../../tools/nestify.js';
  import Slide from '../main/Slide.svelte';
  import { fileFocus } from '../../stores.js';
  export let pageSize = 5; export let pageNum = 0;
  export let filePaths;
  const siblings = nestify(filePaths, pageSize);
  const numPages = siblings.length;
</script>

<nav>
  <button on:click={()=> pageNum = ( (pageNum - 1) + numPages) % numPages }>
    {'<'}
  </button>
  {#if siblings[pageNum] }
  <ul>
    {#each siblings[pageNum] as filePath}
    <li class:active={$fileFocus===filePath} 
      on:click={()=>$fileFocus=filePath}
    >
      <Slide filePath={filePath}/>
    </li>
    {:else}<li class:active={true}><p>No images in this folder!</p></li>
    {/each}
  </ul>
  {/if}
  <button on:click={()=> pageNum = (pageNum+1) % numPages }>
    {'>'}
  </button>
</nav>

<style>
  .active { border: 2px solid rgb(211, 85, 2); }
  nav {display: flex; align-content: center; justify-content: space-between;}
  ul { width: 94%;
    display: flex; align-content: center; justify-content: space-evenly;}
  li { margin: .5vh; height: calc(100% - 1vh); }
</style>