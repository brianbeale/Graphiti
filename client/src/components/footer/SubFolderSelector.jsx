import React, { useState, useEffect } from 'react';
import gql from 'graphql-tag';
import { useQuery } from '@apollo/react-hooks';

import useLogging from '../../tools/useLogging';
import useBoolWatch from '../../tools/useBoolWatch';

const GET_CHILD_FOLDERS = gql`
  query folderPathsInFolder($folderPath: String) {
    folder(folderPath: $folderPath) {
      folders {
        folderPath
      }
    }
  }
`;

export default function SubFolderSelector(props) {
  `Takes a folderPath and renders a dropdown 
  to select from the children`

  const { data, loading, error } = useQuery(GET_CHILD_FOLDERS,
    { variables: { folderPath: props.folderPath } }
  );
  const [subFolders, setSubFolders] = useState([]);
  useEffect(()=>{
    if (error) { throw error }
    else if (loading) { console.log('SubFolderSelector Loading...') }
    else {
      const folderPaths = [...data.folder.folders.map( folder => folder.folderPath ) ];
      console.log(folderPaths);
      const folders = new Map();
      folderPaths.forEach((folderPath) => {
        folders.set( folderPath.slice( folderPath.lastIndexOf('/') ), folderPath );
      });
      setSubFolders(folders);
    }
  },[data]);

  // useLogging('subFolders', subFolders);
  const flag = useBoolWatch(subFolders, 'subfolders');

  // function onSelect(folderPath) {
  //   props.setFolderFocus(folderPath);
  //   props.setPageNum(0);
  // }

  return flag ? (
    <select name="subfolders" id="SubFolderSelector">
    <option value="">subfolders</option>
    {Array.from(subFolders, ([folderName, folderPath])=>{
      return (
        <option key={folderPath} 
          value={folderPath}
          onClick={(e)=>{ props.onSelect(folderPath) } }
        >
          {folderName}
        </option>
      );
    })}
    </select>
  ) : <p></p>;
};