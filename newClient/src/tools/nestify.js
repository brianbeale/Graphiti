export default function nestify(arr, pageSize) {
  const arrCopy = [...arr];
  const pages = [];
  while (arrCopy.length) {
    let slots = [];
    for (let slot = 0; slot < pageSize; slot++) {
      let first = arrCopy.shift();
      if (first) { slots.push(first); }
    }
    pages.push(slots);
  }
  if (!pages.length || !pages[0].length) { 
    pages.push([]); 
  }
  return pages;
}