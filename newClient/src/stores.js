import { writable } from 'svelte/store';

export let folderFocus = writable('/home/brian/Pictures');
export let fileFocus = writable('/home/brian/Pictures/index.jpeg');
export let searchArray = writable(['ape']);
export let searchMode = writable(false);
export let searchString = writable('');