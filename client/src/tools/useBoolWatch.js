import { useState, useEffect } from 'react';

`used by:
  SiblingsRibbon
  SubFolderSelector`;

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
    if (dynamicBool instanceof Array && dynamicBool.length) {
      setFlag(true);
    } 
    else if (dynamicBool instanceof Map && dynamicBool.size) {
      setFlag(true); 
    } else {
      setFlag(false);
    }
  },[dynamicBool]);
  return flag;
}