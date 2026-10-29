import { useEffect, useState } from 'react';

export interface Preferences { theme:'dark'|'light'; alerts:boolean; alertDays:number }
const KEY='guardian-preferences-v1';
function load():Preferences {
  try{const saved=JSON.parse(localStorage.getItem(KEY)||'{}') as Partial<Preferences>;return {theme:saved.theme==='light'?'light':'dark',alerts:saved.alerts!==false,alertDays:[7,15,30,60,90].includes(Number(saved.alertDays))?Number(saved.alertDays):30};}
  catch{return {theme:'dark',alerts:true,alertDays:30};}
}
export function usePreferences() {
  const [preferences,setPreferences]=useState<Preferences>(load);
  useEffect(()=>{document.body.dataset.theme=preferences.theme;try{localStorage.setItem(KEY,JSON.stringify(preferences));}catch{/* Preferences still work for this session. */}},[preferences]);
  return {preferences,setPreferences,toggleTheme:()=>setPreferences(p=>({...p,theme:p.theme==='dark'?'light':'dark'}))};
}
