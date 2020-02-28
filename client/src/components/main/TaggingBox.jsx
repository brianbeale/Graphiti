import React, { useState } from 'react';
import { useMutation } from '@apollo/react-hooks';
import gql from 'graphql-tag';
import PropTypes from 'prop-types';
import './TaggingBox.css';

const ASSIGN_TAG = gql`
  mutation tagFile($filePath: String, $tagName: String) {
    tagFile(filePath: $filePath, tagName: $tagName) {
      filePath,
      tagNames
    }
  }
`;
const UNASSIGN_TAG = gql`
 mutation untagFile($filePath: String, $tagName: String) {
   untagFile(filePath: $filePath, tagName: $tagName) {
     filePath,
     tagNames
   }
 }
`;

// const UPDATE_CACHE = gql`
//   query updateCache()
// `;
import { GET_TAGS } from './MetaDisplay';

export default function TaggingBox(
  { filePath, addTagForDisplay, removeDisplayedTag }
) {
  const [assignTag] = useMutation(ASSIGN_TAG);
  const [unassignTag] = useMutation(UNASSIGN_TAG);
  const [val, setVal] = useState('');

  function onAdd(inputString) {
    const name = inputString.trim();
    if (name.length) {
      assignTag({ variables: { filePath, tagName: name }, 
        refetchQueries: [{query: GET_TAGS, variables: { filePath } }] });
      addTagForDisplay(name);
    }
    setVal('');
    console.log('onAdd');
  }
  function onDelete(name) {
    unassignTag({ variables: { filePath, tagName: name },
      refetchQueries: [{query: GET_TAGS, variables: { filePath } }] });
    removeDisplayedTag(name);
    setVal('');
    console.log('onDelete()');
  }
  return (
    <div className='TaggingBox'>
      <input value={val}
        onChange={ (e) => setVal( e.target.value.toLowerCase() ) } 
      />
      <button onClick={ 
        () => { onAdd(val); } 
      }>
        {'+'}
      </button>
      <button onClick={
        () => { onDelete(val); }
      }
      >
        {'-'}
      </button>
    </div>
  );
}

TaggingBox.propTypes = {
  filePath: PropTypes.string,

  addTagForDisplay: PropTypes.func,
  removeDisplayedTag: PropTypes.func,
};