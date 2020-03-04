<script>
  import { getClient, query } from 'svelte-apollo';
  import { GET_TAGS } from '../../queries.js';
  import { searchArray, searchMode, searchString } from '../../stores.js';
  export let tagNames = ['No tags were set'];

  // from SO to remove text-select on shift-click
  ["keyup","keydown"].forEach((event) => {
    window.addEventListener(event, (e) => {
        document.onselectstart = function() {
            return !(e.key == "Shift" && e.shiftKey);
        }
    });
});

function tagSelect(e, tagName) {
  $searchMode = true;
  if (e.shiftKey) {
    if ($searchArray.includes(tagName) ) {
      $searchArray = $searchArray.filter( t => t !== tagName );
      $searchString = $searchArray.join(', ');
    } else {
      $searchArray = $searchArray.concat(tagName);
      $searchString = $searchString + `, ${tagName}`;
    }
  } else { $searchArray = [tagName]; $searchString = tagName; }
}
</script>

<div>
  <ul>
    {#each tagNames as tagName}
    <li class:searched={$searchArray.includes(tagName)}
      on:click={ (e) => tagSelect(e, tagName) }
    >{tagName}</li>
    {/each}
  </ul>
</div>

<style>
  li { display: inline; } li:hover { color: blue; cursor: pointer;}
  li:after { content: ', '; color: hotpink; }
  li:last-child:after { content: '' }
  li.searched { color: orangered; cursor: default; }
</style>