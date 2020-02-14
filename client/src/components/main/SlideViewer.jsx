import React, { useState, useEffect } from 'react';
import { useQuery } from '@apollo/react-hooks';
import gql from 'graphql-tag';
// import { useMutation, useQuery } from '@apollo/react-hooks';

const GET_FILE = gql`
  query file($filePath: String) {
    file(filePath: $filePath) {
      contents
    }
  }
`;

export default function SlideViewer(props) {
  const { data, loading, error } = useQuery(GET_FILE, {variables: {filePath: props.filePath}});
  const [src, setSrc] = useState('');
  useEffect(()=>{
    if (error) {throw error}
    else if (loading) {console.log('Loading...')}
    else { 
      setSrc('data:image/gif;base64,' + data.file.contents);
      console.log('Done!');
    }
  },[data]);
  return (
    <img src={src} alt='Focused image should appear here!' />
  );
};