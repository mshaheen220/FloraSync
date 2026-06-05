import { useState, FC, FormEvent } from 'react';
import { Container, Title, Card, Button, Input, Subtitle } from '../styles/StyledElements';

interface LoginScreenProps {
  onLogin: (username: string, password: string) => Promise<void>;
}

export const LoginScreen: FC<LoginScreenProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (!username.trim() || !password.trim()) {
      setError('Username and password are required');
      return;
    }
    setIsLoading(true);
    try {
      await onLogin(username.trim(), password.trim());
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
      setIsLoading(false);
    }
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
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Username</label>
            <Input placeholder="Username" value={username} onChange={e => setUsername(e.target.value)} required />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Password</label>
            <Input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required />
          </div>
          {error && <p className="text-red-500 text-sm font-semibold">{error}</p>}
          <Button type="submit" disabled={isLoading} className="mt-2">{isLoading ? 'Logging In...' : 'Log In'}</Button>
        </form>
      </Card>
    </Container>
  );
};