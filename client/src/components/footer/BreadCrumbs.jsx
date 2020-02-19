import React, { useState, useEffect } from 'react';
import gql from 'graphql-tag';
import { useQuery } from '@apollo/react-hooks';

import './BreadCrumbs.css';
import SubFolderSelector from './SubFolderSelector';

export default function BreadCrumbs(props) {
  `Needs to take props.folderPath and make a Map of folderPaths
  with folderName as keys`

  // function pathsFromNames(folderNames) {
  //   const folderPaths = [];
  //   folderNames.forEach((folderName, index)=>{
  //     const ancestor = index ? folderPaths[index-1] : '';
  //     folderPaths.push(`${ancestor}/${folderName}`);
  //   });
  // }

  const folderNames = props.folderPath.split('/');
  folderNames.shift();
  const folderPaths = [];
  folderNames.forEach((folderName, index)=>{
    const parent = index ? folderPaths[index-1] : '';
    folderPaths.push(`${parent}/${folderName}`);
  });
  const folders = new Map();
  folderNames.forEach((folderName, i) => {
    folders.set(folderName, folderPaths[i]);
  });
  // console.log(folders);

  return (
    <div className='BreadCrumbs'>
      <ul>
        {Array.from(folders, ([folderName, folderPath]) => {
          return (
            <li key={folderPath} >
              <a onClick={ (e)=>{props.setFolderFocus(folderPath)} }
                className={ props.folderPath === folderPath ? 'focused' : 'unfocused' }
              >
                {folderName}
              </a>
            </li>
          );
        })}
      </ul>
      <SubFolderSelector folderPath={props.folderPath} 
        setFolderFocus={props.setFolderFocus} setPageNum={props.setPageNum}
      />
    </div>
  );
};