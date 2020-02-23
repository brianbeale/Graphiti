import React from 'react';
import PropTypes from 'prop-types';
import Slide from './Slide';
import './SlideViewer.css';

export default function SlideViewer(props) {
  return (
    <div className='SlideViewer'>
      <div className='MainSlide'
        onClick={()=>props.setFullScreen(true)}
      >
        <Slide filePath={props.filePath} />
      </div>
    </div>
  );
}

SlideViewer.propTypes = {
  setFullScreen: PropTypes.func,
  filePath: PropTypes.string,
};