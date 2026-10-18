import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import { GoogleOAuthProvider } from '@react-oauth/google';

// Google Cloud Console එකෙන් ලැබුණු Client ID එක
const GOOGLE_CLIENT_ID = "1089660974376-o1c4lbpt1pvr1s7q5trvjg8u73tvqqd9.apps.googleusercontent.com";

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <App />
    </GoogleOAuthProvider>
  </React.StrictMode>
);