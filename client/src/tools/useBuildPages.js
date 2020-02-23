import { useState, useEffect } from 'react';

export default function useBuildPages(filePaths, pageSize) {
  const [pages, setPages] = useState([ [] ]);
  useEffect(()=>{
    const filePathsCopy = [...filePaths];
    const p = [];
    while (filePathsCopy.length) {
      let slots = [];
      for (let slot = 0; slot < pageSize; slot++) {
        let firstFilePath = filePathsCopy.shift();
        if (firstFilePath) { slots.push(firstFilePath); }
      }
      p.push(slots);
    }
    setPages(p);
  },[filePaths, pageSize]);
  return pages;
}