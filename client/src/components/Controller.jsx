import React, { useState, useEffect } from 'react';

import Slide from './main/Slide';
import SlideViewer from './main/SlideViewer';
import SiblingsRibbon from './footer/SiblingsRibbon';
import BreadCrumbs from './footer/BreadCrumbs';
import './Controller.css';

export default function Controller(props) {
  const [folderFocus, setFolderFocus] = useState('/home/brian/Pictures/p/67');
  const [fileFocus, setFileFocus] = useState('/home/brian/Pictures/index.jpeg');
  const [fullScreen, setFullScreen] = useState(false);
  const [pageNum, setPageNum] = useState(0);
  useEffect(()=>{
    console.log(`Fullscreen: ${fullScreen}`);
  },[fullScreen]);
  return fullScreen ?
    (<div className='FullScreenDiv' onClick={()=>setFullScreen(false)}>
      <Slide filePath={fileFocus} />
    </div>)
  : (
    <>
      <main>
        <SlideViewer setFullScreen={setFullScreen}
          filePath={fileFocus} 
        />
      </main>
      <footer>
        <SiblingsRibbon 
          folderPath={folderFocus} 
          focus={fileFocus} setFocus={setFileFocus}
          pageSize={3} pageNum={pageNum} setPageNum={setPageNum}
        />
        <BreadCrumbs folderPath={folderFocus}
          setFolderFocus={setFolderFocus} setPageNum={setPageNum}
        />
      </footer>
    </>
  );
};