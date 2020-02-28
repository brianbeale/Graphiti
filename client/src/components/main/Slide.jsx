import React from 'react';
import { useQuery } from '@apollo/react-hooks';
import gql from 'graphql-tag';
import PropTypes from 'prop-types';
import spinner from '../../../assets/Spinner-1s-200px.gif';
import warning from '../../../assets/warning.jpeg';
import missingPic from '../../../assets/missingPic.jpeg';
import './Slide.css';

const GET_FILE = gql`
  query file($filePath: String) {
    file(filePath: $filePath) {
      contents
    }
  }
`;

export default function Slide({ filePath, height, width }) {
  const { data, loading, error } = useQuery(
    GET_FILE, { variables: { filePath } }
  );

  if (!filePath) {
    return (
      <div className='Slide'>
        <img src={missingPic} alt='There is no image here'
          height={height} width={width}
        />
      </div>
    );
  }
  
  let src = loading ? spinner : warning;
  if (error) { console.log('Slide query error'); console.log(error); }
  if (data) { src = 'data:image/gif;base64,' + data.file.contents; }
  
  return (
    <div className='Slide'>
      <img src={src}
        alt={filePath} height={height} width={width} 
      />
    </div>
  );
}

Slide.propTypes = {
  filePath: PropTypes.string,

  height: PropTypes.number,
  width: PropTypes.number,
};