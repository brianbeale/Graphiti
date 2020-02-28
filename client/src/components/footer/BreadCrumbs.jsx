import React from 'react';
import PropTypes from 'prop-types';
import SubFolderSelector from './SubFolderSelector';
import './BreadCrumbs.css';

export default function BreadCrumbs(
  { propFolderPath, setFolderFocus, setPageNum, setFileIndex, 
    searchMode, setSearchMode }
){
  `Needs to take props.folderPath and make a Map of folderPaths
  with folderName as keys`;

  const folders = folderPathToBreadCrumbsMap(propFolderPath);

  function onSelect(folderPath) {
    console.log('%conSelect()', 'color:blue');
    setFolderFocus(folderPath);
    setPageNum(0);
    setFileIndex(0);
    setSearchMode(false);
  }

  return (
    <div className='BreadCrumbs'>
      <ul>
        {Array.from(folders, ([folderName, folderPath]) => {
          return (
            <li key={folderPath} >
              <a onClick={ () => onSelect(folderPath) }
                className={ folderPath === propFolderPath ? 'focused' : 'unfocused' }
              >
                {folderName}
              </a>
            </li>
          );
        })}
      </ul>
      <SubFolderSelector propFolderPath={propFolderPath} 
        onSelect={onSelect}
      />
      {searchMode ? <p>Search Mode</p> : <></>}
    </div>
  );
}

function folderPathToBreadCrumbsMap(folderPath) {
  const folderNames = folderPath.split('/');
  folderNames.shift();
  const folderPaths = [];
  folderNames.forEach((folderName, index) => {
    const parent = index ? folderPaths[index - 1] : '';
    folderPaths.push( `${parent}/${folderName}` );
  });
  const folders = new Map();
  folderNames.forEach((folderName, i) => {
    folders.set(folderName, folderPaths[i]);
  });
  return folders;
}

BreadCrumbs.propTypes = {
  propFolderPath: PropTypes.string,
  setFolderFocus: PropTypes.func,

  setPageNum: PropTypes.func,
  setFileIndex: PropTypes.func,

  searchMode: PropTypes.bool,
  setSearchMode: PropTypes.func,
};