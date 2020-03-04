<script>
  import folderPathToBreadMap from '../../tools/breadMap.js';
  import { folderFocus, searchMode } from '../../stores.js';
  import SubFolderSelector from './SubFolderSelector.svelte';

  $: folders = folderPathToBreadMap($folderFocus);
  $: { $folderFocus; $searchMode = false; }
</script>

<ul>
  {#each [...folders] as [folderName, folderPath]}
  <li>
    <button on:click={ 
      () => {$folderFocus = folderPath; $searchMode = false;} }
      class:active={folderPath===$folderFocus}
    >
      {folderName}
    </button>
  </li>
  {/each}
  <SubFolderSelector />
</ul>

<style>
  ul {
    display: flex;
    align-content: center;
    justify-content: space-around;
  }
</style>