import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Auth0Provider } from '@auth0/auth0-react';
import App from './App.jsx';
import './styles.css';

const domain = import.meta.env.VITE_AUTH0_DOMAIN || 'dev-u07vj7opmg6tnu3w.us.auth0.com';
const clientId = import.meta.env.VITE_AUTH0_CLIENT_ID || 'gZzWngqQ6wn29yKyAgxJKLuwVAfFtqgB';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Auth0Provider domain={domain} clientId={clientId} authorizationParams={{ redirect_uri: window.location.origin }}>
      <App />
    </Auth0Provider>
  </StrictMode>,
);
