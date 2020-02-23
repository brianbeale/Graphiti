import React from 'react';
import PropTypes from 'prop-types';
import useBoolWatch from '../../tools/useBoolWatch';
import useBuildPages from '../../tools/useBuildPages';
import Slide from '../main/Slide';
import './SiblingsRibbon.css';


export default function SiblingsRibbon(
  { pageNum, setPageNum, pageSize, filePaths, fileIndex, setFileIndex }
) {  
  const siblings = useBuildPages(filePaths, pageSize);
  const numPages = siblings.length;
  const flag = useBoolWatch(siblings[0]);

  return (
    <div className='SiblingsRibbon'>
      <button onClick={ ()=>{ setPageNum( ( (pageNum - 1) + numPages ) % numPages ); } } >
        {'<'}
      </button>
      <ul>
        {flag ?
          siblings[pageNum].map((filePath, index) =>
          {
            return (
              <li key={index} 
                className={ fileIndex === filePaths.indexOf(filePath) ? 'focused' : 'unfocused' }
                onClick={() => { setFileIndex( filePaths.indexOf(filePath) ); } }
              >
                <Slide filePath={filePath} />
              </li>
            );
          })
          : <li className='focused'><p>No images in this folder!</p></li>}
      </ul>
      <button onClick={ ()=>{ setPageNum( (pageNum + 1) % numPages ); } } >
        {'>'}
      </button>
    </div>
  );
}

SiblingsRibbon.propTypes = {
  pageNum: PropTypes.number,
  setPageNum: PropTypes.func,
  pageSize: PropTypes.number,

  filePaths: PropTypes.arrayOf(PropTypes.string),
  fileIndex: PropTypes.number,
  setFileIndex: PropTypes.func,
};