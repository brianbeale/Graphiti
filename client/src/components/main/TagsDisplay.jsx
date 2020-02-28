import React from 'react';
import PropTypes from 'prop-types';
import './TagsDisplay.css';


export default function TagsDisplay({ tagNames, searchedTags }) {


  return (
    <div className='TagsDisplay' >
      <ul>
        {tagNames.map( (tagName, i) => {return(
          <li key={i} className={searchedTags.includes(tagName) ? 'highlight' : 'no-highlight'}>
            {tagName}
          </li>);
        })}
      </ul>
    </div>
  );
}

TagsDisplay.propTypes = {
  tagNames: PropTypes.arrayOf(PropTypes.string),
  searchedTags: PropTypes.arrayOf(PropTypes.string),
};