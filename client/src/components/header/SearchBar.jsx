import React, { useState, useEffect } from 'react';
import { useQuery } from '@apollo/react-hooks';
import gql from 'graphql-tag';
import PropTypes from 'prop-types';

const SEARCH_TAGS = gql`
  query filesTagged($tagNames: [String]) {
    filesTagged(tagNames: $tagNames) {
      filePath
    }
  }
`;

export default function SearchBar(
  { initVal, searchMode, folderFocus, onResults, searchedTags, setsearchedTags }
) {
  console.log('SearchBar()');
  const [val, setVal] = useState(initVal);
  // // THIS CODE WILL BREAK THINGS
  // setsearchedTags(
  //   initVal.split(',').map( word => word.trim() )
  // );
  useEffect(()=>{
    if (!searchMode) {
      setVal('');
      setsearchedTags(['']);
    }
  },[searchMode, folderFocus, setsearchedTags]);
  const { data, loading, error } = useQuery(
    SEARCH_TAGS, { variables: { tagNames: searchedTags } }
  );
  const [loadState, setLoadState] = useState('loading');
  useEffect(() => {
    if (error) { setLoadState('error'); }
    if (data && !loading) { setLoadState('done');
      // console.log('data'); console.log(data);
      const searchPaths = data.filesTagged.map(file => file.filePath);
      // console.log('searchPaths');console.log(searchPaths);
      if (searchPaths.length) {
        onResults(searchPaths);
      } else { setVal(''); setsearchedTags(['']); }
    }
  },[data, loading, error, onResults, setsearchedTags]);


  if (loadState==='error') { return <p>error</p>; }
  if (loadState==='loading') { return <p>loading...</p>; }

  return (
    <div className='SearchBar'>
      <input value={val} 
        onChange={ (e) => setVal(e.target.value) }
      />
      <button onClick={
        () => setsearchedTags( val.split(',').map( word => word.trim() ) )
      }>
      Search
      </button>
    </div>
  );
}

SearchBar.propTypes = {
  initVal: PropTypes.string,
  searchMode: PropTypes.bool,
  folderFocus: PropTypes.string,

  onResults: PropTypes.func,

  searchedTags: PropTypes.arrayOf(PropTypes.string),
  setsearchedTags: PropTypes.func,
};