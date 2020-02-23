import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import gql from 'graphql-tag';
import { useQuery } from '@apollo/react-hooks';
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

export default function SubFolderSelector({propFolderPath, onSelect}) {
  `Takes a folderPath and renders a dropdown 
  to select from the children`;

  const { data, loading, error } = useQuery(GET_CHILD_FOLDERS,
    { variables: { folderPath: propFolderPath } }
  );
  const [subFolders, setSubFolders] = useState([]);
  useEffect(()=>{
    if (error) { console.error(error); }
    else if (loading) { console.log('SubFolderSelector Loading...'); }
    else {
      const folderPaths = data.folder.folders.map( folder => folder.folderPath );
      const folders = new Map();
      folderPaths.forEach((folderPath) => {
        folders.set( folderPath.slice( folderPath.lastIndexOf('/') ), folderPath );
      });
      setSubFolders(folders);
    }
  },[data, loading, error]);

  const flag = useBoolWatch(subFolders);

  return flag ? (
    <select name="subfolders" id="SubFolderSelector">
      <option value="">subfolders</option>
      {Array.from(subFolders, ([folderName, folderPath])=>{
        return (
          <option key={folderPath} 
            value={folderPath}
            onClick={()=>{ onSelect(folderPath); } }
          >
            {folderName}
          </option>
        );
      })}
    </select>
  ) : <p></p>;
}

SubFolderSelector.propTypes = {
  propFolderPath: PropTypes.string,
  onSelect: PropTypes.func
};