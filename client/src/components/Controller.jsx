/* 
  External Frameworks and Libraries 
*/
import React, { useState, useEffect, useCallback } from 'react';
import { useQuery } from '@apollo/react-hooks';
import gql from 'graphql-tag';
/* 
  My Components 
*/
import MetaDisplay from './main/MetaDisplay';
import SlideViewer from './main/SlideViewer';
import SiblingsRibbon from './footer/SiblingsRibbon';
import BreadCrumbs from './footer/BreadCrumbs';
import FullScreenViewer from './FullScreenViewer';
/* 
  CSS responsible for this Component 
  & others w/ minimal related display logic 
*/
import './Controller.css';
import spinner from '../../assets/Spinner-1s-200px.gif';
import warning from '../../assets/warning.jpeg';
import SearchBar from './header/SearchBar';
import useLogging from '../tools/useLogging';

/* 
  Template for the query this component needs to render
*/
const GET_CHILD_FILES = gql`
  query filePathsInFolder($folderPath: String) {
    folder(folderPath: $folderPath) {
      files {
        filePath
      }
    }
  }
`;

// No props or PropTypes required for this component yet
export default function Controller() {
  console.log('Controller()');
  // Toggle function for switching CSS classes, not data-flow related
  const [fullScreen, setFullScreen] = useState(false);

  // Used in <BreadCrumbs /> & query GET_CHILD_FILES to generate filePaths
  const [folderFocus, setFolderFocus] = useState('/home/brian/Pictures');
  // Master context, entry point for meaningful data into the client
  const [filePaths, setFilePaths] = useState(['']);

  // Pages of <SiblingsRibbon />, which must be reset on setFolderFocus()
  const [pageNum, setPageNum] = useState(0);
  // enables directional commands
  const [fileIndex, setFileIndex] = useState(0);

  /*  Standard pattern for destructuring useQuery:
      data, loading, error are dynamic variables  */  
  const { data, loading, error } = useQuery(GET_CHILD_FILES,
    { variables: { folderPath: folderFocus } }
  );
  // ensures setFilePaths uses the final state of data
  useEffect(()=>{
    if (error) { console.log('Controller query error'); console.log(error); }
    else if (loading) { console.log('loading'); }
    else {
      setFilePaths(data.folder.files.map( file => file.filePath ) );
    }
  },[data, loading, error]);

  // Base everything all displays on filteredPaths to allow Search to define the context
  const [filteredPaths, setFilteredPaths] = useState([]);
  
  const onSearch = useCallback((searchPaths) => {
    setFilteredPaths( filePaths.filter( path => searchPaths.includes(path) ) );
    setFileIndex(0);
  },[filePaths]);
  const [searchMode, setSearchMode] = useState(false);
  useEffect(()=>{
    setSearchMode(false);
    setsearchedTags(['']);
  },[folderFocus]);
  useLogging('searchMode', searchMode);
  useEffect(()=>{
    console.log(filteredPaths.length);
    if (filteredPaths.length && filteredPaths[0].length) {
      setSearchMode(true);
    } else { setSearchMode(false); }
  },[filteredPaths]);
  // const displayPaths = searchMode ? filteredPaths : filePaths;
  const [displayPaths, setDisplayPaths] = useState(filePaths);
  useEffect(()=>{
    if (searchMode) {
      setDisplayPaths(filteredPaths);
    } else { setDisplayPaths(filePaths); }
  },[searchMode, filePaths, filteredPaths]);

  // Keeps the filePath around instead of requiring indexes
  const [fileFocus, setFileFocus] = useState( displayPaths[fileIndex] );
  useEffect(() => {
    setFileFocus( displayPaths[fileIndex] );
    console.log('displayPaths'); console.log(displayPaths);
  },[displayPaths, fileIndex]);

  const [searchedTags, setsearchedTags] = useState(['']);

  if (loading) { 
    return <img src={spinner} />;
  } else if (error) { return <img src={warning} height='300px'/>; }

  return fullScreen ?
    (<FullScreenViewer 
      setFullScreen={setFullScreen}
      filePaths={displayPaths} fileFocus={fileFocus}
      fileIndex={fileIndex} setFileIndex={setFileIndex}
    />)
    : (
      <>
        <main>
          <div className='verticalSpacer'></div>
          {/* Becomes TagsDisplay & TaggingBox */}
          <MetaDisplay filePath={ fileFocus } searchedTags={searchedTags} />
          <SlideViewer setFullScreen={setFullScreen}
            filePath={fileFocus} 
          />
          <div className='horizontalSpacer'></div>
        </main>
        <footer>
          <SiblingsRibbon 
            filePaths={displayPaths}
            fileIndex={fileIndex} setFileIndex={setFileIndex}
            pageSize={3} pageNum={pageNum} setPageNum={setPageNum}
          />
          <BreadCrumbs propFolderPath={folderFocus}
            setFolderFocus={setFolderFocus} 
            searchMode={searchMode} setSearchMode={setSearchMode}
            setPageNum={setPageNum} setFileIndex={setFileIndex}
            fileIndex={fileIndex}
          />
          <SearchBar initVal='' searchMode={searchMode}
            folderFocus={folderFocus} 
            onResults={onSearch} 
            searchedTags={searchedTags} setsearchedTags={setsearchedTags}
          />
        </footer>
      </>
    );
}