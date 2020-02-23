import React, { useState, useEffect } from 'react';
import { useQuery } from '@apollo/react-hooks';
import gql from 'graphql-tag';

import SlideViewer from './main/SlideViewer';
import SiblingsRibbon from './footer/SiblingsRibbon';
import BreadCrumbs from './footer/BreadCrumbs';
import FullScreenViewer from './FullScreenViewer';
import './Controller.css';

const GET_CHILD_FILES = gql`
  query filePathsInFolder($folderPath: String) {
    folder(folderPath: $folderPath) {
      files {
        filePath
      }
    }
  }
`;

export default function Controller() {
  const [folderFocus, setFolderFocus] = useState('/home/brian/Pictures/p');
  const [fullScreen, setFullScreen] = useState(false);
  const [pageNum, setPageNum] = useState(0);
  const [fileIndex, setFileIndex] = useState(0);

  const [filePaths, setFilePaths] = useState([]);
  const { data, loading, error } = useQuery(GET_CHILD_FILES,
    { variables: { folderPath: folderFocus } }
  );
  useEffect(()=>{
    
    if (error) { console.error(error); }
    else if (loading) { console.log('loading'); }
    else {
      setFilePaths(data.folder.files.map( file => file.filePath ) );
    }
  },[data, loading, error]);

  return fullScreen ?
    (<FullScreenViewer 
      setFullScreen={setFullScreen}
      filePaths={filePaths} fileFocus={filePaths[fileIndex]}
      fileIndex={fileIndex} setFileIndex={setFileIndex}
    />)
    : (
      <>
        <main>
          <SlideViewer setFullScreen={setFullScreen}
            filePath={filePaths[fileIndex]} 
          />
        </main>
        <footer>
          <SiblingsRibbon 
            filePaths={filePaths}
            fileIndex={fileIndex} setFileIndex={setFileIndex}
            pageSize={4} pageNum={pageNum} setPageNum={setPageNum}
          />
          <BreadCrumbs propFolderPath={folderFocus}
            setFolderFocus={setFolderFocus} 
            setPageNum={setPageNum} setFileIndex={setFileIndex}
            fileIndex={fileIndex}
          />
        </footer>
      </>
    );
}