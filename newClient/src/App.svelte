<script>
	import {setClient, query} from 'svelte-apollo';
	import { fileFocus, folderFocus, searchArray, searchMode,
		searchString } from './stores.js';
	import { GET_CHILD_FILES, SEARCH_TAGS } from './queries.js';
	import SearchBar from './components/header/SearchBar.svelte';
	import MetaDisplay from './components/main/MetaDisplay.svelte';
	import Slide from './components/main/Slide.svelte';
	import BreadCrumbs from './components/header/BreadCrumbs.svelte';
	import SiblingsRibbon from './components/footer/SiblingsRibbon.svelte';
	export let client; setClient(client);
	
	let qData = query(client, { query: GET_CHILD_FILES, variables: 
		{folderPath: $folderFocus}}); $: qData.refetch({ folderPath: $folderFocus });
	let searchData = query(client, {query: SEARCH_TAGS, variables: 
		{tagNames: $searchArray}}); $: searchData.refetch({tagNames: $searchArray});
	let fullScreen = false; 
	$: console.log($searchArray); $: console.log($searchString);
</script>

{#if fullScreen} <div id='FullScreen' on:click={()=> fullScreen=false}>
	<Slide filePath={$fileFocus} />
</div>{:else}
<header>
	<SearchBar bind:value={$searchString}/> 
	{#if $searchMode}<h2>Search Mode</h2>{/if}
	<BreadCrumbs />
</header>
<main>
	<section id='MetaDisplay'><MetaDisplay filePath={$fileFocus}/></section>
	<section id='SlideViewer' on:click={()=> fullScreen=true}>
		<Slide filePath={$fileFocus}/></section>
</main>
<footer>
	{#if $searchMode}
		{#await $searchData then searchResult}
			<SiblingsRibbon pageSize={3} 
				filePaths={searchResult.data.filesTagged.map( f => f.filePath)}/>
		{/await}
	{:else}
		{#await $qData then qResult}
			<SiblingsRibbon pageSize={3}
				filePaths={qResult.data.folder.files.map( f => f.filePath)}/>
		{/await}
	{/if}
</footer>{/if}

<style>
	header { height: 7vh; display: flex; justify-content: space-around; background-color: indigo; }
	main { height: 69vh; display: flex; justify-content: space-between; }
	footer { height: 21vh; background-color: forestgreen; }
	#MetaDisplay { width: 30%; margin-left: 2vw;}
	#SlideViewer { width: 70%; padding: 1vw; }
</style>