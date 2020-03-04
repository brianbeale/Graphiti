<script>
  import { getClient, query } from 'svelte-apollo';
  import { GET_TAGS } from '../../queries.js';
  import TagsDisplay from './TagsDisplay.svelte';
  import TaggingBox from './TaggingBox.svelte';
  export let filePath;
  const client = getClient();
  const qData = query(client, { query: GET_TAGS,
    variables: { filePath } } );
  $: qData.refetch({ filePath });
  function updateTags() {
    qData.refetch({ filePath });
  }
</script>

<div>
  {#await $qData}
    <p>loading...</p>
  {:then qResult}
    <section id='TagsDisplay'><TagsDisplay 
      tagNames={qResult.data.file.tags.map( (t) => t.tagName )} 
    /></section>
  {:catch}
    <p>error!</p>
  {/await}
  <section id='TaggingBox'><TaggingBox {filePath} {updateTags}/></section>
</div>

<style>
  div { display: flex; flex-direction: column; }
  #TagsDisplay { height: 100% - 8vh;}
  #TaggingBox { height: 8vh; }
</style>