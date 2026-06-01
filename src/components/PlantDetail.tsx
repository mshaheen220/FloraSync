import { useEffect, useState, FC, FormEvent } from 'react';
import { PlantInstance, PlantArchetype, Location } from '../types';
import { Container, Title, Card, Button, StatusBadge, Input, Toast, Subtitle } from '../styles/StyledElements';

interface PlantDetailProps {
  qrId: string;
  initialAction: string | null;
  instance?: PlantInstance;
  archetype?: PlantArchetype;
  location?: Location;
  onWater: (qrId: string) => void;
  onRegister: (qrId: string, name: string) => void;
  onGoHome: () => void;
  onClearAction: () => void;
}

export const PlantDetail: FC<PlantDetailProps> = ({ 
  qrId, initialAction, instance, archetype, location, onWater, onRegister, onGoHome, onClearAction 
}) => {
  const [toastMessage, setToastMessage] = useState('');
  const [regName, setRegName] = useState('');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  // 1. "Zero-Click" Action Handling: Instantly process URL params mapping physical scanning context to actions.
  useEffect(() => {
    if (instance && initialAction === 'water') {
      onWater(qrId);
      showToast('💦 Plant watered successfully!');
      window.history.replaceState({}, '', `/?qr=${qrId}`); // Cleans the URL state post-action
      onClearAction();
    }
  }, [instance, initialAction, qrId, onWater, onClearAction]);

  const handleManualWater = () => {
    onWater(qrId);
    showToast('💦 Plant watered successfully!');
  };

  const handleRegister = (e: FormEvent) => {
    e.preventDefault();
    if (!regName.trim()) return;
    onRegister(qrId, regName);
    showToast('🌱 Plant registered successfully!');
  };

  // 4. Dynamic Just-In-Time Registration Form (when QR isn't mapped in instances)
  if (!instance) {
    return (
      <Container className="flex flex-col justify-center animate-in fade-in duration-500">
        <Card className="text-center py-10 shadow-lg">
          <div className="text-5xl mb-4">🪴</div>
          <Title>New Tag Detected</Title>
          <p className="text-slate-500 text-sm mb-8 leading-relaxed px-2">
            Tag <strong className="text-emerald-700 font-semibold">{qrId}</strong> is unassigned. 
            What are we planting here?
          </p>
          <form onSubmit={handleRegister}>
            <Input 
              placeholder="e.g., Heirloom Tomato" 
              value={regName}
              onChange={(e) => setRegName(e.target.value)}
              autoFocus
            />
            <Button type="submit">Initialize Care Routine</Button>
          </form>
        </Card>
        <Button variant="secondary" onClick={onGoHome} className="mt-2">Cancel Setup</Button>
        <Toast visible={!!toastMessage}>{toastMessage}</Toast>
      </Container>
    );
  }

  const isOverdue = (() => {
    const today = new Date().getTime();
    const lastWateredTime = new Date(instance.lastWatered).getTime();
    const intervalMs = (archetype?.waterIntervalDays || 1) * 24 * 60 * 60 * 1000;
    return (today - lastWateredTime) > intervalMs;
  })();

  return (
    <Container className="animate-in slide-in-from-right-4 duration-300">
      <header className="mb-6 flex items-center gap-3 pt-6">
        <button onClick={onGoHome} className="text-3xl text-slate-400 hover:text-emerald-700 transition-colors p-2 -ml-2 rounded-full active:bg-slate-200">
          &larr;
        </button>
        <div>
          <Title className="!mb-0">{archetype?.commonName}</Title>
          <p className="text-xs text-slate-500 uppercase tracking-wide font-semibold mt-1">{location?.zone} • {location?.name}</p>
        </div>
      </header>

      <Card className="flex flex-col items-center py-10 mb-6 relative overflow-hidden">
        <div className="absolute top-0 w-full h-1 bg-gradient-to-r from-emerald-400 to-emerald-600"></div>
        <StatusBadge status={isOverdue ? 'overdue' : 'hydrated'} className="mb-5 shadow-sm">
          {isOverdue ? 'Watering Overdue' : 'Optimal Hydration'}
        </StatusBadge>
        <p className="text-sm font-medium text-slate-500 mb-8">Last cared for: {new Date(instance.lastWatered).toLocaleDateString()}</p>
        
        <div className="w-full flex gap-3 px-2">
          <Button onClick={handleManualWater}>💦 Water</Button>
          <Button variant="secondary">🪴 Feed</Button>
        </div>
      </Card>

      <Subtitle>Cultivation Basics</Subtitle>
      <Card>
        <ul className="space-y-5 text-sm">
          <li className="flex gap-4 items-start">
            <span className="text-2xl bg-amber-50 rounded-full p-2">☀️</span>
            <div className="pt-1">
              <strong className="block text-slate-800 font-semibold mb-0.5">Sunlight</strong>
              <span className="text-slate-500 leading-relaxed">{archetype?.sunRequirement}</span>
            </div>
          </li>
          <li className="flex gap-4 items-start">
            <span className="text-2xl bg-blue-50 rounded-full p-2">💧</span>
            <div className="pt-1">
              <strong className="block text-slate-800 font-semibold mb-0.5">Watering Interval</strong>
              <span className="text-slate-500 leading-relaxed">Every {archetype?.waterIntervalDays} days</span>
            </div>
          </li>
          <li className="flex gap-4 items-start">
            <span className="text-2xl bg-emerald-50 rounded-full p-2">✂️</span>
            <div className="pt-1">
              <strong className="block text-slate-800 font-semibold mb-0.5">Pruning Care</strong>
              <span className="text-slate-500 leading-relaxed">{archetype?.pruningTips}</span>
            </div>
          </li>
        </ul>
      </Card>

      <Toast visible={!!toastMessage}>{toastMessage}</Toast>
    </Container>
  );
};