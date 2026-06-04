import { useState, FC, FormEvent } from 'react';
import { Container, Title, Card, Button, Input, Subtitle } from '../styles/StyledElements';

interface LoginScreenProps {
  onLogin: (name: string) => void;
}

export const LoginScreen: FC<LoginScreenProps> = ({ onLogin }) => {
  const [name, setName] = useState('');
  const [passcode, setPasscode] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    // Simple gateway passcode to protect your data
    if (passcode !== 'florasync2024') {
      setError('Invalid app passcode');
      return;
    }
    if (!name.trim()) {
      setError('Name is required');
      return;
    }
    onLogin(name.trim());
  };

  return (
    <Container className="flex flex-col justify-center h-screen animate-in fade-in duration-500">
      <Card className="text-center py-10 shadow-lg border-emerald-500">
        <div className="flex justify-center mb-4">
          <span className="text-6xl">🌿</span>
        </div>
        <Title>FloraSync Login</Title>
        <Subtitle className="mb-6">Please log in to access the garden data.</Subtitle>
        
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 text-left">
          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Your Name</label>
            <Input placeholder="e.g. Alice" value={name} onChange={e => setName(e.target.value)} required />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">App Passcode</label>
            <Input type="password" placeholder="Passcode" value={passcode} onChange={e => setPasscode(e.target.value)} required />
          </div>
          {error && <p className="text-red-500 text-sm font-semibold">{error}</p>}
          <Button type="submit" className="mt-2">Log In</Button>
        </form>
      </Card>
    </Container>
  );
};