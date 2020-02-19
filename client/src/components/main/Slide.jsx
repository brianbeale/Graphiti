import React from 'react';
import usePicture from '../../tools/usePicture';
import './Slide.css';

export default function Slide(props) {
  const src = usePicture(props.filePath);
  return (
    <div className='Slide'>
      <img src={src} alt={props.filePath}
        height={props.height} width={props.width} 
      />
    </div>
  );
};