import React, { useState } from 'react';
import { useMutation } from '@apollo/react-hooks';
import gql from 'graphql-tag';
import PropTypes from 'prop-types';

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

export default function TaggingBox(
  { filePath, addTagForDisplay, removeDisplayedTag }
) {
  const [assignTag] = useMutation(ASSIGN_TAG);
  const [unassignTag] = useMutation(UNASSIGN_TAG);
  const [val, setVal] = useState('');

  function onAdd(name) {
    assignTag({ variables: { filePath, tagName: name } });
    addTagForDisplay(name);
    setVal('');
    console.log('onAdd');
  }
  function onDelete(name) {
    unassignTag({ variables: { filePath, tagName: name } });
    removeDisplayedTag(name);
    setVal('');
    console.log('onDelete()');
  }
  return (
    <>
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
    </>
  );
}

TaggingBox.propTypes = {
  filePath: PropTypes.string,

  addTagForDisplay: PropTypes.func,
  removeDisplayedTag: PropTypes.func,
};