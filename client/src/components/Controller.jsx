import React, { useState, useEffect } from 'react';

import SlideViewer from './main/SlideViewer';
// import SiblingsRibbon from './footer/SiblingsRibbon';

export default function Controller(props) {
  const filePath = '/home/brian/Pictures/index.jpeg';
  const folderPath = '/home/brian/Pictures/'

  return (
    <>
      <SlideViewer filePath={filePath} />
      {/* <footer>
        <SiblingsRibbon folderPath={folderPath} focus={filePath}/>
      </footer> */}
    </>
  );
}