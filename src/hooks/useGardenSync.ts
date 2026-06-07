import { useState, useEffect, useRef } from 'react';
import { User, GardenProfile, Workspace, PlantInstance, PlantArchetype, Location, Zone, PrintQueueItem } from '../../types';

export function useGardenSync(
  token: string | null,
  currentUser: User | null,
  setCurrentUser: React.Dispatch<React.SetStateAction<User | null>>,
  instances: PlantInstance[], setInstances: React.Dispatch<React.SetStateAction<PlantInstance[]>>,
  archetypes: PlantArchetype[], setArchetypes: React.Dispatch<React.SetStateAction<PlantArchetype[]>>,
  locations: Location[], setLocations: React.Dispatch<React.SetStateAction<Location[]>>,
  zones: Zone[], setZones: React.Dispatch<React.SetStateAction<Zone[]>>,
  printQueue: PrintQueueItem[], setPrintQueue: React.Dispatch<React.SetStateAction<PrintQueueItem[]>>
) {
  const [isDbLoaded, setIsDbLoaded] = useState(false);
  const [initialLoadSuccess, setInitialLoadSuccess] = useState<boolean | null>(null);
  const [syncStatus, setSyncStatus] = useState<'synced' | 'syncing' | 'error'>('synced');
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [gardenProfile, setGardenProfile] = useState<GardenProfile | null>(null);

  const skipNextSync = useRef(false);

  useEffect(() => {
    if (!currentUser || !token) {
      setInstances([]);
      setArchetypes([]);
      setLocations([]);
      setZones([]);
      setIsDbLoaded(false);
      setGardenProfile(null);
      setInitialLoadSuccess(null);
      setSyncStatus('synced');
      setWorkspaces([]);
      return;
    }

    const host = window.location.hostname === 'localhost' ? '127.0.0.1' : window.location.hostname;
    const apiBase = ['5173', '5174', '5175'].includes(window.location.port) ? `${window.location.protocol}//${host}:5050` : '';

    fetch(`${apiBase}/api/state`, { 
      cache: 'no-store',
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(async res => {
        if (!res.ok) {
          const errBody = await res.text().catch(() => 'no body');
          throw new Error(`Server responded with HTTP ${res.status}: ${errBody}`);
        }
        const text = await res.text();
        if (!text) return {};
        try {
          return JSON.parse(text);
        } catch (e) {
          throw new Error('Invalid JSON payload');
        }
      })
      .then(data => {
        skipNextSync.current = true;
        
        if (data.user) {
          setCurrentUser(prev => {
            if (!prev || JSON.stringify(prev) !== JSON.stringify(data.user)) {
              localStorage.setItem('florasync_user', JSON.stringify(data.user));
              return data.user;
            }
            return prev;
          });
        }

        setGardenProfile(data.garden || null);
        setInstances(data.instances || []);
        setArchetypes(data.archetypes || []);
        
        let loadedZones: Zone[] = data.zones || [];
        let loadedLocations: Location[] = data.locations || [];

        loadedLocations = loadedLocations.map((loc: any) => {
          if (loc.zone && !loc.zoneId) {
            let existingZone = loadedZones.find((z) => z.name === loc.zone);
            if (!existingZone) {
              existingZone = { id: `zn-${Date.now()}-${Math.floor(Math.random()*1000)}`, name: loc.zone };
              loadedZones.push(existingZone);
            }
            loc.zoneId = existingZone.id;
            delete loc.zone;
          }
          return loc;
        });

        setZones(loadedZones);
        setLocations(loadedLocations);
        setPrintQueue(data.printQueue || []);
        
        setIsDbLoaded(true);
        setInitialLoadSuccess(true);
        setSyncStatus('synced');

        fetch(`${apiBase}/api/workspaces`, { headers: { 'Authorization': `Bearer ${token}` } })
          .then(res => res.json())
          .then(wData => {
            if (wData.success) setWorkspaces(wData.workspaces);
          }).catch(err => console.error('Failed to load workspaces:', err));
      })
      .catch(err => {
        console.error('[Frontend] Database connection failed completely. Trace:', err);
        setIsDbLoaded(true);
        setInitialLoadSuccess(false);
        setSyncStatus('error');
      });
  }, [currentUser?.id, token]); // Only fetch when auth user/token actually changes

  useEffect(() => {
    if (!isDbLoaded || !currentUser || !token || !initialLoadSuccess) return;

    if (skipNextSync.current) {
      skipNextSync.current = false;
      return;
    }

    setSyncStatus('syncing');

    const syncTimeout = setTimeout(() => {
      const host = window.location.hostname === 'localhost' ? '127.0.0.1' : window.location.hostname;
      const apiBase = ['5173', '5174', '5175'].includes(window.location.port) ? `${window.location.protocol}//${host}:5050` : '';

      fetch(`${apiBase}/api/state`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ instances, archetypes, locations, zones, printQueue })
      })
      .then(res => {
        if (!res.ok) {
          setSyncStatus('error');
        } else {
          setSyncStatus('synced');
        }
      })
      .catch(err => { console.error('Failed to sync state to database:', err); setSyncStatus('error'); });
    }, 1500);

    return () => clearTimeout(syncTimeout);
  }, [instances, archetypes, locations, zones, printQueue, isDbLoaded, currentUser, token, initialLoadSuccess]);

  const handleSwitchGarden = (gardenId: string) => {
    if (!token) return;
    setIsDbLoaded(false);
    const host = window.location.hostname === 'localhost' ? '127.0.0.1' : window.location.hostname;
    const apiBase = ['5173', '5174', '5175'].includes(window.location.port) ? `${window.location.protocol}//${host}:5050` : '';

    fetch(`${apiBase}/api/state?gardenId=${gardenId}`, { 
      cache: 'no-store',
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        skipNextSync.current = true;
        if (data.user) setCurrentUser(prev => prev ? { ...prev, workspaceRole: data.user.workspaceRole } : data.user);
        setGardenProfile(data.garden || null);
        setInstances(data.instances || []);
        setArchetypes(data.archetypes || []);
        setZones(data.zones || []);
        setLocations(data.locations || []);
        setPrintQueue(data.printQueue || []);
        setIsDbLoaded(true);
        setSyncStatus('synced');
      })
      .catch(err => {
        console.error('Failed to switch garden', err);
        setIsDbLoaded(true);
        setSyncStatus('error');
      });
  };

  const handleUpdateGarden = (name: string, imageUrl: string) => {
    if (!gardenProfile) return;
    const updated = { ...gardenProfile, name, imageUrl };
    setGardenProfile(updated);
    if (token) {
      const host = window.location.hostname === 'localhost' ? '127.0.0.1' : window.location.hostname;
      const apiBase = ['5173', '5174', '5175'].includes(window.location.port) ? `${window.location.protocol}//${host}:5050` : '';
      fetch(`${apiBase}/api/garden/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ name, imageUrl })
      }).catch(err => console.error('Failed to sync garden profile update:', err));
    }
  };

  return {
    isDbLoaded,
    initialLoadSuccess,
    syncStatus,
    workspaces,
    gardenProfile,
    handleSwitchGarden,
    handleUpdateGarden
  };
}
