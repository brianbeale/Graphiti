import React from 'react';
import PropTypes from 'prop-types';
import usePicture from '../../tools/usePicture';
import './Slide.css';

export default function Slide({filePath, height, width}) {
  const src = usePicture(filePath);
  return (
    <div className='Slide'>
      <img src={src} alt={filePath}
        height={height} width={width} 
      />
    </div>
  );
}

Slide.propTypes = {
  filePath: PropTypes.string,
  height: PropTypes.number,
  width: PropTypes.number,
};