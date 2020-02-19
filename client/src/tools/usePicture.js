import { useState, useEffect } from 'react';
import { useQuery } from '@apollo/react-hooks';
import gql from 'graphql-tag';

export default function usePicture(filePath) {
  const GET_FILE = gql`
    query file($filePath: String) {
      file(filePath: $filePath) {
        contents
      }
    }
  `;
  const { data, loading, error } = useQuery(
    GET_FILE, { variables: { filePath } }
  );
  const [src, setSrc] = useState('');
  useEffect(()=>{
    if (error) { throw error }
    else if (loading) {console.log('Loading Picture...')}
    else {
      setSrc('data:image/gif;base64,' + data.file.contents);
      console.log('Done');
    }
  },[data]);
  return src;
}