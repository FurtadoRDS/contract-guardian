import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import type { Notify, ToastType } from '../../types';
import { Icon } from './Icon';

const ToastContext=createContext<Notify>(()=>{});
export function ToastProvider({children}:{children:ReactNode}) {
  const [items,setItems]=useState<{id:number;message:string;type:ToastType}[]>([]);
  const counter=useRef(0),timers=useRef<ReturnType<typeof setTimeout>[]>([]);
  const notify=useCallback<Notify>((message,type='success')=>{const id=++counter.current;setItems(items=>[...items,{id,message,type}]);timers.current.push(setTimeout(()=>setItems(items=>items.filter(item=>item.id!==id)),5000));},[]);
  useEffect(()=>()=>timers.current.forEach(clearTimeout),[]);
  return <ToastContext.Provider value={notify}>{children}<div className="toast-region" aria-live="polite" aria-atomic="false">{items.map(item=><div key={item.id} className={`toast ${item.type==='error'?'error':''}`} role={item.type==='error'?'alert':'status'}><Icon name={item.type==='error'?'expired':item.type==='info'?'info':'circleCheck'}/><span>{item.message}</span></div>)}</div></ToastContext.Provider>;
}
export function useToast(){return useContext(ToastContext);}
