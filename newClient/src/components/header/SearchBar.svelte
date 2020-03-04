<script>
  import { searchArray, searchMode } from '../../stores.js';
  export let value;
  function submit(inputString) {
    $searchArray = inputString.split(',').map( 
      word => word.trim() ).filter(x => x);
    $searchMode = true;
  }
  $: if (!$searchMode) { value = ''; $searchArray=[];}
</script>

<div>
  <input bind:value />
  <button on:click={() => submit(value) }>Search</button>
</div>