<script>
  import { getClient, query } from 'svelte-apollo';
  import spinner from '../../../assets/Spinner-1s-200px.gif';
  import warning from '../../../assets/warning.jpeg';
  import { GET_FILE } from '../../queries.js';
  export let filePath;
  const client = getClient();
  const qData = query(client, { query: GET_FILE, variables: {filePath} });
  $: qData.refetch({ filePath });
</script>

<div class=className>
  {#await $qData}
  <img src={spinner} alt='The image is being loaded...'
    class='system'
  />
  {:then qResult}
  <img src={ 'data:image/gif;base64,' + qResult.data.file.contents } 
    alt='Image fetched from graphql endpoint' 
  />
  {:catch error}
  <img src={warning} alt={error.message} class='system'/>
  {/await}
</div>

<style>
  div { display: flex; justify-content: space-around; }
  img.system { width: 24vw; } 
  img { cursor: pointer; }
</style>