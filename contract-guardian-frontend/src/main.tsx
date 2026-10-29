import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { ToastProvider } from './components/ui/ToastProvider';
import './styles/index.css';

const root=document.getElementById('root');
if(!root)throw new Error('Elemento de entrada da aplicação não encontrado.');
createRoot(root).render(<StrictMode><ToastProvider><App/></ToastProvider></StrictMode>);
