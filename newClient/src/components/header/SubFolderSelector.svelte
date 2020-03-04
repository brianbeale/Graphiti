<script>
  import { getClient, query } from 'svelte-apollo';
  import { GET_CHILD_FOLDERS } from '../../queries.js';
  import { folderFocus } from '../../stores.js';

  const client = getClient();
  const qData = query(client, { query: GET_CHILD_FOLDERS, 
    variables: { folderPath: $folderFocus } });
  $: qData.refetch({ folderPath: $folderFocus });
</script>

{#await $qData}
  <p>loading...</p>
{:then qResult}
  {#if qResult.data.folder.folders.length}
    <select name='subfolders'>
      <option disabled>subfolders</option>
      {#each qResult.data.folder.folders as folder}
        <option value={folder.folderPath} 
          on:click={ () => $folderFocus = folder.folderPath }>
          {folder.folderPath.slice(folder.folderPath.lastIndexOf('/') + 1)}
        </option>
      {/each}
    </select>
  {/if}
{:catch error}
  <p>error!</p>
{/await}