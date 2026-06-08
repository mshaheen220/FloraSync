// plugins/health-and-pruning/execute.js
// TODO: include pruning under routine care
// TODO: use user image and name not username
// TODO: add last pruned date in edit screen and add warning if pruning is overdue
export const execute = async (db, gardenId, actionId, contextData, user) => {
  if (actionId === 'log-pruning') {
    const { qrId } = contextData;
    
    // 1. Fetch current plant instance from DB
    const garden = db.prepare('SELECT instances FROM gardens WHERE id = ?').get(gardenId);
    const instances = JSON.parse(garden.instances || '[]');
    const instance = instances.find(i => i.qrId === qrId);
    
    if (instance) {
      // 2. Do whatever data manipulation you want!
      const newEntry = {
        id: `j-${Date.now()}`,
        timestamp: new Date().toISOString(),
        activityType: 'Pruning',
        note: 'Routine pruning and maintenance logged via Health & Pruning Tracker Add-on',
        authorName: user.name || user.username,
        authorImageUrl: user.imageUrl || ''
      };
      
      instance.journal = [newEntry, ...(instance.journal || [])];
      db.prepare('UPDATE gardens SET instances = ? WHERE id = ?').run(JSON.stringify(instances), gardenId);
      
      // 3. Return a payload telling the React frontend what to do next
      return {
        message: '✂️ Pruning logged  via Health & Pruning Tracker Add-on',
        clientAction: {
          type: 'UPDATE_INSTANCE',
          qrId: qrId,
          updates: { journal: instance.journal }
        }
      };
    }
  }
  throw new Error('Unknown action');
};
