import { useState, useEffect } from 'react';

`used by:
  SiblingsRibbon
  SubFolderSelector`

export default function useBoolWatch(dynamicBool, debugName=false) {
  const [flag, setFlag] = useState(false);
  if (debugName) {
    console.log('BoolWatch firing!');
    // console.log('dynamicBool: ');
    console.log(debugName);
    console.log(dynamicBool);
    // debugName=false;
  }
    useEffect(()=>{
    // if ( Array.isArray(dynamicBool) ) {
    if (dynamicBool instanceof Array) {
      if (dynamicBool.length) { setFlag(true) }
      else { setFlag(false) }
    } 
    if (dynamicBool instanceof Map) {
      if (dynamicBool.size) { setFlag(true) }
      else { setFlag(false) }
    } 
    else if (dynamicBool) {
      setFlag(true);
    } else {
      setFlag(false);
    }
  },[dynamicBool]);
  return flag;
};