import './bootstrap.min.css';
import './index.css';
import { createRoot } from 'react-dom/client';
import App from './app';

const container = document.getElementById('app-root');

if (!container) {
  throw new Error('App root element was not found');
}

const root = createRoot(container);
root.render(<App />);
