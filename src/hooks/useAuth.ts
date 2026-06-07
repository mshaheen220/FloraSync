import { useState } from 'react';
import { User } from '../../types';

export function useAuth() {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('florasync_token'));
  
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('florasync_user');
    return saved ? JSON.parse(saved) : null;
  });

  const handleLogin = async (username: string, password: string): Promise<void> => {
    const host = window.location.hostname === 'localhost' ? '127.0.0.1' : window.location.hostname;
    const apiBase = ['5173', '5174', '5175'].includes(window.location.port) ? `${window.location.protocol}//${host}:5050` : '';

    const res = await fetch(`${apiBase}/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Login failed');
    }

    setToken(data.token);
    const userObj = { ...data.user, name: data.user.name || data.user.username, imageUrl: data.user.imageUrl || '' };
    setCurrentUser(userObj);
    localStorage.setItem('florasync_token', data.token);
    localStorage.setItem('florasync_user', JSON.stringify(userObj));
    
    window.history.pushState({ internal: true }, '', '/');
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setToken(null);
    localStorage.removeItem('florasync_token');
    localStorage.removeItem('florasync_user');
    window.history.pushState({ internal: true }, '', '/');
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  const handleUpdateUser = (updates: Partial<User>) => {
    if (!currentUser) return;
    const updatedUser = { ...currentUser, ...updates };
    setCurrentUser(updatedUser);
    localStorage.setItem('florasync_user', JSON.stringify(updatedUser));

    if (token) {
      const host = window.location.hostname === 'localhost' ? '127.0.0.1' : window.location.hostname;
      const apiBase = ['5173', '5174', '5175'].includes(window.location.port) ? `${window.location.protocol}//${host}:5050` : '';
      fetch(`${apiBase}/api/users/${updatedUser.id}/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ name: updatedUser.name, imageUrl: updatedUser.imageUrl })
      }).catch(err => console.error('Failed to sync profile update:', err));
    }
  };

  return { token, currentUser, setCurrentUser, handleLogin, handleLogout, handleUpdateUser };
}
