import React, { useState, useEffect } from 'react';
import gql from 'graphql-tag';
import { useQuery } from '@apollo/react-hooks';
import Slide from '../main/Slide';

import './SiblingsRibbon.css';
import useBoolWatch from '../../tools/useBoolWatch';

const GET_CHILD_FILES = gql`
  query filePathsInFolder($folderPath: String) {
    folder(folderPath: $folderPath) {
      files {
        filePath
      }
    }
  }
`;

export default function SiblingsRibbon(props) {  
  const { data, loading, error } = useQuery(GET_CHILD_FILES, 
    { variables: { folderPath: props.folderPath } }
  );
  // TODO: move stateful logic to <Controller /> 
  // siblings needs to start as nested array to prevent indexError in loading state
  const [siblings, setSiblings] = useState( [ [] ] );
  // pageNum is 0 index whereas numPages is a length
  const [pageNum, setPageNum] = [props.pageNum, props.setPageNum];
  // numPages needs to start at 1 to avoid NaN in the modulo?
  const [numPages, setNumPages] = useState(1);
  useEffect(()=>{
    if (error) { throw error }
    else if (loading) { console.log('loading') }
    else {
      const filePaths = [ ...data.folder.files.map( file => file.filePath ) ];
      /* np represents numPages to avoid naming conflict
        with useState() numPages (not ready when this effect runs) */
      const np = Math.floor(filePaths.length / props.pageSize) + 1;
      setNumPages(np);
      // Build array of pages, each an array of filePaths
      const pages = [];
      for (let page = 0; page < np; page++) {
        let slots = [];
        for (let slot = 0; slot < props.pageSize; slot++) {
          if (filePaths) {
            let firstFilePath = filePaths.shift();
            if (firstFilePath) {
              slots.push(firstFilePath);
            }
          }
        }
        pages.push(slots);
      }
      setSiblings(pages);
    };
  },[data]);

  useEffect(()=>{
    console.log(`pageNum: ${pageNum}`);
  },[pageNum]);

  // useEffect(()=>{
  //   // resets the page on folder change
  //   console.log(props.folderPath);
  //   setPageNum(0);
  // },[props.folderPath]);

  const flag = useBoolWatch(siblings[0]);

  return (
    <div className='SiblingsRibbon'>
      <button onClick={ (e)=>{ setPageNum( ( (pageNum - 1) + numPages ) % numPages ); } } >
        {'<'}
      </button>
      <ul>
        {flag ?
        siblings[pageNum].map((filePath, index) =>
          {
            return (
              <li key={index} 
                className={ props.focus === filePath ? 'focused' : 'unfocused' }
                onClick={(e) => { props.setFocus(e.target.alt); } }
              >
                <Slide filePath={filePath} />
              </li>
            );
          }
        )
        : <li className='focused'><p>No images in this folder!</p></li>}
      </ul>
      <button onClick={ (e)=>{ setPageNum( (pageNum + 1) % numPages ); } } >
        {'>'}
      </button>
    </div>
  )
};