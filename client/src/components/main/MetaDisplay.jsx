import React, { useState, useEffect } from 'react';
import { useQuery } from '@apollo/react-hooks';
import gql from 'graphql-tag';
import PropTypes from 'prop-types';
import TagsDisplay from './TagsDisplay';
import TaggingBox from './TaggingBox';

export const GET_TAGS = gql`
 query tagsAssignedToFile($filePath: String) {
   file(filePath: $filePath) {
     tags {
       tagName
     }
   }
 }
`;

export default function MetaDisplay({ filePath, searchedTags }) {
  const { data, loading, error } = useQuery(
    GET_TAGS, { variables: { filePath } }
  );
  const [tagNames, setTagNames] = useState([]);

  function addTagForDisplay(inputString) {
    const tagSet = new Set(tagNames);
    tagSet.add(inputString);
    setTagNames( [...tagSet] );
  }
  function removeDisplayedTag(inputString) {
    const tagSet = new Set(tagNames);
    tagSet.delete(inputString);
    setTagNames( [...tagSet] );
  }

  // if (loading && !data) { return <p>loading...</p>; }
  // if (error) { console.log(error); return <p>error!</p>;}
  // console.log(data.file.tags);
  // console.log(tagNames);
  // console.log(filePath);
  // console.log(loading, error);
  useEffect(()=>{
    if (loading) { setTagNames( ['loading'] ); }
    if (error) { setTagNames( ['error!'] ); }
    if (data) { setTagNames( data.file.tags.map( tag => tag.tagName ) ); }
  },[data, loading, error]);

  return (
    <>
      <TagsDisplay tagNames={tagNames} searchedTags={searchedTags} />
      <TaggingBox filePath={filePath} 
        addTagForDisplay={addTagForDisplay} removeDisplayedTag={removeDisplayedTag}
      />
    </>
  );
}

MetaDisplay.propTypes = {
  filePath: PropTypes.string,
  searchedTags: PropTypes.arrayOf(PropTypes.string),
};