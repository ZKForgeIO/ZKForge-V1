import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Landing from './pages/Landing';
import Auth from './pages/Auth';
import Username from './pages/Username';
import Chat from './pages/Chat';
import ProfileSettings from './pages/ProfileSettings';
import Explorer from './pages/Explorer';
import Introduction from './pages/docs/Introduction';
import Architecture from './pages/docs/Architecture';
import ZKAuth from './pages/docs/ZKAuth';
import Solana from './pages/docs/Solana';
import Contracts from './pages/docs/Contracts';
import API from './pages/docs/API';
import TechStack from './pages/docs/TechStack';
import Roadmap from './pages/docs/Roadmap';
import { Toaster } from 'sonner';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
    <Toaster position="top-center" richColors closeButton theme="dark" expand />
      <Routes>
        {/* <Route path="/" element={<Landing />} /> */}
        <Route path="/dapp/auth" element={<Auth />} />
        <Route path="/" element={<Auth />} />
        <Route path="/dapp/username" element={<Username />} />
        <Route path="/dapp/chat" element={<Chat />} />
        <Route path="/dapp/settings" element={<ProfileSettings />} />
        <Route path="/dapp/explorer" element={<Explorer />} />
        <Route path="/docs" element={<Introduction />} />
        <Route path="/docs/architecture" element={<Architecture />} />
        <Route path="/docs/zk-auth" element={<ZKAuth />} />
        <Route path="/docs/solana" element={<Solana />} />
        <Route path="/docs/contracts" element={<Contracts />} />
        <Route path="/docs/api" element={<API />} />
        <Route path="/docs/tech-stack" element={<TechStack />} />
        <Route path="/docs/roadmap" element={<Roadmap />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>
);
