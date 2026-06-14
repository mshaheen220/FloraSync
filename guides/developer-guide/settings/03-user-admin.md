---
id: "dev-user-admin"
title: "User Administration"
category: "Settings"
tags: ["user-management", "admin", "roles", "permissions", "garden-access", "dev"]
---

# User Administration (Developer Guide)

The **User Administration** module provides God-Admin level system management for FloraSync. It enables creation of new user accounts, management of garden access across the multi-garden workspace, and role-based permission configuration.

## Architecture Overview

### Frontend Components
- **Main Component:** [`UserAdministration.tsx`](../../src/components/core/settings/UserAdministration.tsx)
- **Sub-Component:** [`UserCard.tsx`](../../src/components/core/settings/UserCard.tsx)
- **Parent:** `SettingsManager.tsx` (Settings & Administration)
- **Permissions:** `manage_system_users` (God-Admin only)

### Backend APIs
All endpoints require `authenticateToken` middleware and `god-admin` role.

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/users` | POST | Create new user account |
| `/api/users` | GET | List all system users with garden access |
| `/api/users/:id` | DELETE | Delete user and cleanup garden memberships |
| `/api/users/:id` | PUT | Reset user password |
| `/api/users/:id/gardens` | GET | Fetch user's garden access list |
| `/api/users/:id/gardens` | POST | Grant user access to a garden with a role |
| `/api/users/:id/gardens/:gardenId` | DELETE | Revoke user's access to a specific garden |
| `/api/gardens` | GET | List all active gardens in the system |
| `/api/gardens/:id` | PUT | Rename a garden |

## Role Hierarchy & Permissions

### System-Level Roles
```typescript
type SystemRole = 'god-admin' | 'garden-owner' | 'demo';
```

- **`god-admin`:** System administrator with unlimited access across all workspaces
- **`garden-owner`:** Standard account type (can own one or more gardens)
- **`demo`:** Special read-only account for sandboxing

### Workspace-Level Roles
Applied per garden via `garden_members` junction table:

```typescript
type WorkspaceRole = 'owner' | 'admin' | 'helper' | 'viewer';
```

| Role | Manage Users | Manage Dictionary | Manage Spaces | Perform Actions | View Only |
|------|:----:|:----:|:----:|:----:|:----:|
| **Owner** | ✅ | ✅ | ✅ | ✅ | N/A |
| **Admin** | ❌ | ✅ | ✅ | ✅ | N/A |
| **Helper** | ❌ | ❌ | ❌ | ✅ | N/A |
| **Viewer** | ❌ | ❌ | ❌ | ❌ | ✅ |

**Permission Details:**
- **Manage Users:** Invite new users, change roles, revoke access
- **Manage Dictionary:** Add/edit/delete plant archetypes globally
- **Manage Spaces:** Create/edit/delete zones and locations
- **Perform Actions:** Log watering, feeding, journal entries
- **View Only:** Explore garden, read journal, view plants (no modifications)

## Frontend Implementation

### UserAdministration Component Structure

```tsx
export const UserAdministration: FC<UserAdministrationProps> = ({ 
  currentUser, 
  showToast 
}) => {
  // State Management
  const [usersList, setUsersList] = useState<User[]>([]);
  const [gardensList, setGardensList] = useState<{id: string, name: string}[]>([]);
  const [managingAccessUserId, setManagingAccessUserId] = useState<string | null>(null);
  
  // Form fields for new user creation
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newFullName, setNewFullName] = useState('');
  const [selectedGardenId, setSelectedGardenId] = useState('');
  
  // Form fields for granting access
  const [grantGardenId, setGrantGardenId] = useState('');
  const [grantRole, setGrantRole] = useState('helper');
  
  // ... handlers and render logic
};
```

### Key Workflows

#### 1. Create New User Account

```tsx
const handleCreateUser = async (e: FormEvent) => {
  e.preventDefault();
  if (!newUsername || !newPassword) return;
  
  setIsCreatingUser(true);
  try {
    const res = await apiFetch('/api/users', {
      method: 'POST',
      body: JSON.stringify({ 
        username: newUsername, 
        password: newPassword, 
        name: newFullName, 
        gardenId: selectedGardenId  // Optional: share existing garden
      })
    });
    const data = await res.json();
    
    if (data.success) {
      // Success: data.user contains new user ID and access info
      // data.newGarden contains details if a new garden was created
      setUsersList(prev => [...prev, data.user]);
      if (data.newGarden) {
        setGardensList(prev => [...prev, data.newGarden]);
      }
      showToast(`✅ User ${data.user.username} created successfully!`);
      resetForm();
    } else {
      showToast(`❌ Error: ${data.error}`);
    }
  } catch (err) {
    showToast('❌ Failed to create user.');
  }
  setIsCreatingUser(false);
};
```

**Options:**
- **No `gardenId`:** Creates a new private garden for the user (Garden Owner role)
- **With `gardenId`:** Adds user to existing garden with specified access role

#### 2. Manage User Access

```tsx
const handleManageAccess = async (userId: string) => {
  // Toggle access panel
  if (managingAccessUserId === userId) {
    setManagingAccessUserId(null);
    return;
  }
  
  // Fetch user's current garden access
  try {
    const res = await apiFetch(`/api/users/${userId}/gardens`);
    const data = await res.json();
    if (data.success) {
      setUserAccessList(data.access);  // Array of {gardenId, gardenName, role}
      setManagingAccessUserId(userId);
    }
  } catch (e) {
    showToast('❌ Failed to load access list.');
  }
};
```

#### 3. Grant Garden Access

```tsx
const handleGrantAccess = async (userId: string) => {
  if (!grantGardenId) return;
  
  try {
    const res = await apiFetch(`/api/users/${userId}/gardens`, {
      method: 'POST',
      body: JSON.stringify({ 
        gardenId: grantGardenId, 
        role: grantRole  // 'owner', 'admin', 'helper', 'viewer'
      })
    });
    const data = await res.json();
    
    if (data.success) {
      showToast('✅ Access granted!');
      // Update UI to reflect new access
      const garden = gardensList.find(g => g.id === grantGardenId);
      if (garden) {
        setUserAccessList(prev => [...prev, {
          gardenId: grantGardenId,
          gardenName: garden.name,
          role: grantRole
        }]);
      }
      setGrantGardenId('');
    }
  } catch (e) {
    showToast('❌ Failed to grant access.');
  }
};
```

#### 4. Revoke Garden Access

```tsx
const handleRevokeAccess = async (userId: string, gardenId: string) => {
  if (!window.confirm('Revoke this access?')) return;
  
  try {
    const res = await apiFetch(`/api/users/${userId}/gardens/${gardenId}`, {
      method: 'DELETE'
    });
    const data = await res.json();
    
    if (data.success) {
      showToast('🗑️ Access revoked!');
      setUserAccessList(prev => 
        prev.filter(a => a.gardenId !== gardenId)
      );
    }
  } catch (e) {
    showToast('❌ Failed to revoke access.');
  }
};
```

#### 5. Reset User Password

```tsx
const handleResetPassword = async (userId: string, username: string) => {
  const newPass = window.prompt(`Enter new password for ${username}:`);
  if (!newPass) return;
  
  try {
    const res = await apiFetch(`/api/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify({ password: newPass })
    });
    const data = await res.json();
    
    if (data.success) {
      showToast(`✅ Password updated for ${username}.`);
    }
  } catch (err) {
    showToast('❌ Failed to update user.');
  }
};
```

#### 6. Delete User

```tsx
const handleDeleteUser = async (userId: string, username: string) => {
  if (!window.confirm(
    `Are you sure you want to permanently delete user '${username}' and all their garden data?`
  )) return;
  
  try {
    const res = await apiFetch(`/api/users/${userId}`, {
      method: 'DELETE'
    });
    const data = await res.json();
    
    if (data.success) {
      showToast(`🗑️ User ${username} deleted.`);
      setUsersList(prev => prev.filter(u => u.id !== userId));
    }
  } catch (err) {
    showToast('❌ Failed to delete user.');
  }
};
```

### UserCard Component

The `UserCard` sub-component displays individual user information and provides inline access controls:

```tsx
export const UserCard: FC<UserCardProps> = ({
  user,
  currentUser,
  isManagingAccess,
  userAccessList,
  gardensList,
  grantGardenId,
  grantRole,
  onManageAccess,
  onResetPassword,
  onDeleteUser,
  onRevokeAccess,
  onGrantAccess,
  setGrantGardenId,
  setGrantRole
}) => {
  // Renders:
  // 1. User name and system role (if god-admin)
  // 2. Garden access badges (sorted by role: admin > owner > helper > viewer)
  // 3. Action buttons: Manage Access, Reset Password (if not self), Delete (if not self)
  // 4. Expandable access management section (if isManagingAccess)
  //    - List current access per garden with "Revoke" button
  //    - Dropdowns to select garden and role
  //    - "Add" button to grant access
};
```

## Backend Implementation

### POST /api/users — Create New User

```javascript
router.post('/api/users', authenticateToken, (req, res) => {
  if (req.user.role !== 'god-admin') {
    return res.status(403).json({ error: 'Only admins can create new users.' });
  }

  const { username, password, name = '', gardenId, role = 'garden-owner' } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required.' });
  }

  try {
    // Check for duplicate username
    const existing = db.prepare('SELECT id FROM users WHERE username = ?')
      .get(username.toLowerCase());
    if (existing) {
      return res.status(400).json({ error: 'Username already exists.' });
    }

    // Generate unique user ID and hash password
    const userId = `usr-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const passwordHash = bcrypt.hashSync(password, 10);
    const targetGardenId = gardenId || `gdn-${userId}`;
    let createdGardenName = null;

    // Create garden if not provided
    if (!gardenId) {
      createdGardenName = `${name || username}'s Garden`;
      db.prepare(
        'INSERT INTO gardens (id, name, instances, locations, zones) VALUES (?, ?, ?, ?, ?)'
      ).run(targetGardenId, createdGardenName, '[]', '[]', '[]');
    } else {
      createdGardenName = db.prepare(
        'SELECT name FROM gardens WHERE id = ?'
      ).get(targetGardenId)?.name || 'Unknown Garden';
    }

    // Insert user and grant initial garden access (always 'owner')
    db.prepare(
      'INSERT INTO users (id, username, password_hash, role, name, garden_id) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(userId, username.toLowerCase(), passwordHash, role, name, targetGardenId);
    
    db.prepare(
      'INSERT INTO garden_members (user_id, garden_id, role) VALUES (?, ?, ?)'
    ).run(userId, targetGardenId, 'owner');

    res.json({ 
      success: true, 
      user: { 
        id: userId, 
        username: username.toLowerCase(), 
        role, 
        name, 
        accesses: [{ id: targetGardenId, name: createdGardenName, role: 'owner' }] 
      },
      newGarden: !gardenId ? { id: targetGardenId, name: createdGardenName } : null
    });
  } catch (err) {
    console.error('Error creating user:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});
```

### GET /api/users — List All Users

```javascript
router.get('/api/users', authenticateToken, (req, res) => {
  if (req.user.role !== 'god-admin') {
    return res.status(403).json({ error: 'Only admins can view users.' });
  }

  try {
    // Fetch users with aggregate garden access using JSON subquery
    const users = db.prepare(`
      SELECT u.id, u.username, u.role, u.name, u.image_url as imageUrl,
      (
        SELECT json_group_array(json_object('id', g.id, 'name', g.name, 'role', gm.role))
        FROM garden_members gm
        JOIN gardens g ON gm.garden_id = g.id
        WHERE gm.user_id = u.id
      ) as accesses
      FROM users u
    `).all();

    // Parse JSON accesses for each user
    users.forEach(u => {
      try { u.accesses = JSON.parse(u.accesses); } 
      catch (e) { u.accesses = []; }
    });

    res.json({ success: true, users });
  } catch (err) {
    console.error('Error fetching users:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});
```

### GET /api/users/:id/gardens — Fetch User Garden Access

```javascript
router.get('/api/users/:id/gardens', authenticateToken, (req, res) => {
  if (req.user.role !== 'god-admin') {
    return res.status(403).json({ error: 'Only admins can view user gardens.' });
  }

  try {
    const access = db.prepare(`
      SELECT gm.garden_id as gardenId, g.name as gardenName, gm.role 
      FROM garden_members gm
      JOIN gardens g ON gm.garden_id = g.id
      WHERE gm.user_id = ?
    `).all(req.params.id);

    res.json({ success: true, access });
  } catch (err) {
    console.error('Error fetching user garden access:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});
```

### POST /api/users/:id/gardens — Grant Garden Access

```javascript
router.post('/api/users/:id/gardens', authenticateToken, (req, res) => {
  if (req.user.role !== 'god-admin') {
    return res.status(403).json({ error: 'Only admins can grant garden access.' });
  }

  const { gardenId, role } = req.body;
  if (!gardenId || !role) {
    return res.status(400).json({ error: 'Garden ID and role are required.' });
  }

  try {
    // Insert or update garden membership
    db.prepare(`
      INSERT INTO garden_members (user_id, garden_id, role) 
      VALUES (?, ?, ?) 
      ON CONFLICT(user_id, garden_id) 
      DO UPDATE SET role = excluded.role
    `).run(req.params.id, gardenId, role);

    res.json({ success: true });
  } catch (err) {
    console.error('Error granting garden access:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});
```

### DELETE /api/users/:id/gardens/:gardenId — Revoke Access

```javascript
router.delete('/api/users/:id/gardens/:gardenId', authenticateToken, (req, res) => {
  if (req.user.role !== 'god-admin') {
    return res.status(403).json({ error: 'Only admins can revoke garden access.' });
  }

  try {
    // Remove garden membership
    db.prepare('DELETE FROM garden_members WHERE user_id = ? AND garden_id = ?')
      .run(req.params.id, req.params.gardenId);

    // If this was the user's primary garden, reassign to another
    const user = db.prepare('SELECT garden_id FROM users WHERE id = ?')
      .get(req.params.id);
    
    if (user && user.garden_id === req.params.gardenId) {
      const otherGarden = db.prepare(
        'SELECT garden_id FROM garden_members WHERE user_id = ? LIMIT 1'
      ).get(req.params.id);
      
      db.prepare('UPDATE users SET garden_id = ? WHERE id = ?')
        .run(otherGarden ? otherGarden.garden_id : null, req.params.id);
    }

    res.json({ success: true });
  } catch (err) {
    console.error('Error revoking garden access:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});
```

### DELETE /api/users/:id — Delete User

```javascript
router.delete('/api/users/:id', authenticateToken, (req, res) => {
  if (req.user.role !== 'god-admin') {
    return res.status(403).json({ error: 'Only admins can delete users.' });
  }
  
  if (req.params.id === req.user.id) {
    return res.status(400).json({ error: 'Cannot delete yourself.' });
  }

  try {
    const user = db.prepare('SELECT garden_id FROM users WHERE id = ?')
      .get(req.params.id);

    // Clean up legacy backup tables
    try { db.prepare('DELETE FROM user_gardens_legacy_backup WHERE user_id = ?').run(req.params.id); } 
    catch (e) {}
    try { db.prepare('DELETE FROM user_gardens WHERE user_id = ?').run(req.params.id); } 
    catch (e) {}

    // Remove garden memberships and delete user
    db.prepare('DELETE FROM garden_members WHERE user_id = ?').run(req.params.id);
    db.prepare('DELETE FROM users WHERE id = ?').run(req.params.id);

    // If no other users in that garden, delete the garden too
    const remaining = db.prepare(
      'SELECT count(*) as count FROM users WHERE garden_id = ?'
    ).get(user.garden_id);
    
    if (remaining.count === 0) {
      db.prepare('DELETE FROM gardens WHERE id = ?').run(user.garden_id);
    }

    res.json({ success: true });
  } catch (err) {
    console.error('Error deleting user:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});
```

## Database Schema

### Users Table
```sql
CREATE TABLE users (
  id TEXT PRIMARY KEY,              -- usr-{timestamp}-{random}
  username TEXT UNIQUE NOT NULL,    -- lowercase
  password_hash TEXT NOT NULL,      -- bcrypt hashed
  role TEXT NOT NULL,               -- 'god-admin', 'garden-owner', 'demo'
  name TEXT,                        -- Display name
  image_url TEXT,                   -- Profile picture URL
  garden_id TEXT,                   -- User's primary garden
  theme TEXT,                       -- UI theme preference
  color_theme TEXT,                 -- Color theme preference
  icon_theme TEXT,                  -- Icon theme preference
  installed_addons TEXT,            -- JSON array of addon IDs
  active_addons TEXT,               -- JSON array of active addon IDs
  addon_settings TEXT               -- JSON object of addon settings
);
```

### Garden Members Junction Table
```sql
CREATE TABLE garden_members (
  user_id TEXT,
  garden_id TEXT,
  role TEXT,                        -- 'owner', 'admin', 'helper', 'viewer'
  PRIMARY KEY (user_id, garden_id),
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (garden_id) REFERENCES gardens(id)
);
```

### Gardens Table
```sql
CREATE TABLE gardens (
  id TEXT PRIMARY KEY,              -- gdn-{timestamp}-{random}
  name TEXT,                        -- Garden display name
  image_url TEXT,                   -- Garden cover image
  instances TEXT,                   -- JSON array of plant instances
  locations TEXT,                   -- JSON array of locations
  zones TEXT,                       -- JSON array of zones
  print_queue TEXT,                 -- JSON array of QR codes to print
  journal TEXT                      -- JSON array of garden-level events
);
```

## Permission Model

### Visibility & Access Control

**Only God-Admins can:**
- View all users in the system
- Create new user accounts
- Delete users and their gardens
- Reset passwords
- Manage garden access across workspaces
- Rename gardens globally

**Users cannot:**
- View other users in User Administration (only God-Admins)
- Self-delete (confirmation in UI prevents accidents)
- Change their own system role (God-Admin reassigns only)
- Access gardens they don't have membership in

### Garden Access Logic

When a user logs in:
1. **Fetch primary garden:** `users.garden_id` (most recently accessed garden)
2. **Load all accessible gardens:** Join `garden_members` where `user_id = current_user`
3. **Filter workspace role:** Check `garden_members.role` for the current garden
4. **Derive permissions:** Use `workspaceRole` to determine what actions are allowed

## Error Handling

### Common Scenarios

| Error | Cause | Response |
|-------|-------|----------|
| "Username already exists" | POST /api/users with duplicate username | 400 Bad Request |
| "Only admins can..." | Non-God-Admin attempts protected endpoint | 403 Forbidden |
| "Cannot delete yourself" | User attempts to delete their own account | 400 Bad Request |
| "Garden ID and role are required" | Missing fields in access grant request | 400 Bad Request |

### Data Integrity

- **Cascade Deletion:** When a user is deleted, all `garden_members` rows are removed
- **Orphan Garden Cleanup:** If last user is deleted, their personal garden is also deleted
- **Garden Reassignment:** If user's primary garden is revoked, system auto-assigns another garden if available

## UI Flow & User Experience

### User Creation Flow
```
God-Admin clicks "+ Add New Account"
    ↓
Opens form with Username, Password, Full Name, Garden selector
    ↓
Admin enters details and selects garden or "Create New Private Garden"
    ↓
System creates user and initializes membership (always as 'owner' of assigned garden)
    ↓
User appears in "Existing Accounts" section with access badges
```

### Access Management Flow
```
Admin clicks shield icon on user card
    ↓
Access panel expands showing current garden memberships
    ↓
Admin selects garden from dropdown (filtered to gardens user doesn't access)
    ↓
Admin selects role: Owner, Admin, Helper, or Viewer
    ↓
Admin clicks "Add" button
    ↓
User immediately gains access; garden appears in their role selector on login
```

### Delete User Flow
```
Admin clicks delete button on user card
    ↓
Confirmation modal: "Delete user 'username' and all their garden data?"
    ↓
If confirmed:
  - Remove all garden_members rows for this user
  - Delete user from users table
  - If user owned a private garden with no other members, delete that garden too
  - UI removes user card from list
```

## Performance Considerations

- **User Listing:** O(n) where n = total users (includes JSON aggregation per user)
- **Garden Access:** O(m) where m = gardens the user accesses (typically < 10)
- **Database Constraints:** SQLite handles thousands of users efficiently
- **N+1 Prevention:** Aggregate garden access via subquery in single SELECT

## Integration Points

### With Plant Dictionary
- Garden owners who import bulk data must first be provisioned via User Administration
- All users in a garden share the global `shared_dictionary`

### With Permissions System
- `manage_system_users` permission gates entire User Administration UI
- Individual actions (create, delete, reset password) require God-Admin role

### With Workspace/Garden Context
- User's `garden_id` determines which garden they're currently viewing
- User can switch between gardens via workspace selector dropdown
- Role changes take effect on next page reload or automatic sync

## Common Development Tasks

### Adding a New User Role
1. Update database schema (e.g., `garden_members.role` constraint)
2. Add permission logic to `permissions.ts`
3. Update UserCard role dropdowns
4. Add backend validation in grant/revoke endpoints

### Implementing User Invitations
Currently: Admin manually creates users (synchronous)
Future: Could add email invitations with one-time signup links

### Audit Logging
Currently: Not implemented
Future: Could log user creation, deletion, password resets for compliance

## Related Documentation
- [Settings & Administration](../07-Settings.md)
- [Permission System](../../src/utils/permissions.ts)
- [Plant Dictionary Management](../04-Plant-Dictionary.md)
- [User Guide: User Administration](../../user-guide/settings/03-user-admin.md)
