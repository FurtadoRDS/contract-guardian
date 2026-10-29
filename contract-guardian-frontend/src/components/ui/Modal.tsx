import { useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import type { ReactNode } from 'react';

interface ModalProps { open:boolean; onClose:()=>void; title:string; children:ReactNode; className?:string }
export function Modal({open,onClose,title,children,className='help-dialog'}:ModalProps) {
  const ref=useRef<HTMLDialogElement>(null),labelId=useId();
  useEffect(()=>{
    const dialog=ref.current;if(!dialog)return;
    const opener=document.activeElement instanceof HTMLElement?document.activeElement:null;
    if(open&&!dialog.open)dialog.showModal();
    if(!open&&dialog.open)dialog.close();
    return ()=>{if(dialog.open)dialog.close();if(open&&opener?.isConnected)opener.focus();};
  },[open]);
  return createPortal(<dialog ref={ref} className={className} aria-label={title} aria-labelledby={labelId} onCancel={e=>{e.preventDefault();onClose();}} onClick={e=>{if(e.target!==e.currentTarget)return;const rect=e.currentTarget.getBoundingClientRect();if(e.clientX<rect.left||e.clientX>rect.right||e.clientY<rect.top||e.clientY>rect.bottom)onClose();}}><span id={labelId} className="sr-only">{title}</span>{children}</dialog>,document.body);
}
