import { useEffect } from 'react';

export default function useLogging(name, variable) {
  useEffect(()=>{
    console.log(`${name} update: ${variable}`);
    console.log(variable);
  },[name, variable]);
}