import { useCallback, useEffect, useState } from 'react';

export function useHashRoute() {
  const [route,setRoute]=useState(()=>window.location.hash.slice(1)||'dashboard');
  useEffect(()=>{const update=()=>setRoute(window.location.hash.slice(1)||'dashboard');window.addEventListener('hashchange',update);return()=>window.removeEventListener('hashchange',update);},[]);
  const navigate=useCallback((next:string,replace=false)=>{
    if(replace){window.history.replaceState(null,'',`#${next}`);setRoute(next);}
    else if(window.location.hash===`#${next}`)setRoute(next);
    else window.location.hash=next;
  },[]);
  return {route,navigate};
}
