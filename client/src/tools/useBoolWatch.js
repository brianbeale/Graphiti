import { useState, useEffect } from 'react';

export default function useBoolWatch(dynamicBool, debug=false) {
  const [flag, setFlag] = useState(false);
  if (debug) {
    console.log('BoolWatch firing!');
    console.log('dynamicBool: ');
    console.log(dynamicBool);
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