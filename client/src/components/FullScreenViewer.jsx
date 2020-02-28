import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import Slide from './main/Slide';

export default function FullScreenViewer(
  { fileIndex, setFileIndex, filePaths, setFullScreen }
) {
  const numFiles = filePaths.length;
  const [fileFocus, setFileFocus] = useState( filePaths[fileIndex] );
  useEffect(()=>{
    setFileFocus( filePaths[fileIndex] );
  },[fileIndex, filePaths, setFileFocus]);
  
  return (
    <>
      <button onClick={
        () => { setFileIndex( ( (fileIndex - 1) + numFiles) % numFiles); }
      }>
        Prev File
      </button>

      <div className='FullScreenSlide' onClick={() => setFullScreen(false) }>
        <Slide filePath={fileFocus} setFullScreen={setFullScreen} />
      </div>

      <button onClick={
        () => { setFileIndex( (fileIndex + 1) % numFiles ); }
      }>
        Next File
      </button>

      <button onClick={
        () => { setFullScreen(false); }
      }>
        Exit FullScreen
      </button>
    </>
  );
}

FullScreenViewer.propTypes = {
  fileFocus: PropTypes.string,
  setFileFocus: PropTypes.func,

  fileIndex: PropTypes.number,
  setFileIndex: PropTypes.func,

  filePaths: PropTypes.arrayOf(PropTypes.string),
  setFullScreen: PropTypes.func,
};