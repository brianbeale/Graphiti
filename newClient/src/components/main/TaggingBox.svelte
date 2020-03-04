<script>
  import { getClient, mutate } from 'svelte-apollo';
  import { ASSIGN_TAG, UNASSIGN_TAG } from '../../queries.js';
  import { fileFocus, searchArray } from '../../stores.js';

  export let filePath; export let updateTags;
  let value = '';
  $: console.log(value);

  const client = getClient();
  async function assignTag(tagName) {
    try {
      await mutate(client, {
        mutation: ASSIGN_TAG,
        variables: { filePath, tagName }
      });
    } catch(error) { console.log('error! assignTag()'); }
  }
  async function unassignTag(tagName) {
    try {
      await mutate(client, {
        mutation: UNASSIGN_TAG,
        variables: { filePath, tagName }
      });
    } catch(error) { console.log('unassignTag() error!'); }
  }
  function onAdd(inputString) {
    const tagNames = inputString.split(',').map( t => t.trim() );
    console.log(tagNames);
    // if array has a first string with content
    if (tagNames.length && tagNames[0].length) {
      tagNames.forEach(tagName => {
        assignTag(tagName);
        console.log(tagName); updateTags();
      });
    }
    value = '';
  }
  function onDel(inputString) {
    unassignTag(inputString);
    value = ''; updateTags();
  }
  $: value = value.toLowerCase();
</script>

<div>
  <input bind:value />
  <button on:click={() => onAdd(value) }>Add</button>
  <button on:click={() => onDel(value)}>Del</button>
</div>

<style>
  div { display: flex; justify-content: space-around; }
</style>