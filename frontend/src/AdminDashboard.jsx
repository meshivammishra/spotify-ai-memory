import { useEffect, useState } from 'react';
import './App.css';
import {
  getAdminUsers,
  getAdminInteractions,
} from './api';

function AdminDashboard({ user }) {
  const [activeSection, setActiveSection] = useState('');
  const [users, setUsers] = useState([]);
  const [interactions, setInteractions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function openSection(section) {
    setActiveSection(section);
    setError('');
    setLoading(true);

    try {
      if (section === 'users') {
        const data = await getAdminUsers();
        setUsers(data.users || []);
      } else if (section === 'interactions') {
        const data = await getAdminInteractions();
        setInteractions(data.interactions || []);
      }
    } catch (err) {
      console.error('Admin dashboard error:', err);
      setError(err.message || 'Failed to load data.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (user?.is_admin !== true) {
      setError('Administrator access is required.');
    }
  }, [user]);

  if (user?.is_admin !== true) {
    return (
      <section className="card">
        <h2>Access Denied</h2>
        <p>Administrator privileges are required.</p>
      </section>
    );
  }

  return (
    <section className="card">
      <div className="section-header">
        <div>
          <div className="section-title">
            <span className="section-icon">🛡️</span>
            <h2>Admin Dashboard</h2>
          </div>
          <p>Spotify AI Memory — Administration Panel</p>
        </div>
      </div>

      <div style={{ marginTop: '24px' }}>
        <h3>Welcome, {user?.name || 'Admin'}!</h3>
        <p>Administrator privileges verified.</p>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '16px',
            marginTop: '24px',
          }}
        >
          <button
            type="button"
            className="card"
            onClick={() => openSection('users')}
            style={{ cursor: 'pointer', textAlign: 'left' }}
          >
            <h3>👥 User Management</h3>
            <p>View registered users.</p>
          </button>

          <button
            type="button"
            className="card"
            onClick={() => openSection('interactions')}
            style={{ cursor: 'pointer', textAlign: 'left' }}
          >
            <h3>📊 Interaction Monitoring</h3>
            <p>Review recorded interactions.</p>
          </button>

          <div className="card">
            <h3>🔐 Access Control</h3>
            <p>
              Current role: {user?.is_admin ? 'Administrator' : 'User'}
            </p>
          </div>
        </div>

        {loading && <p>Loading data...</p>}

        {error && (
          <div className="message message-error" role="alert">
            {error}
          </div>
        )}

        {!loading && !error && activeSection === 'users' && (
          <div style={{ marginTop: '28px', overflowX: 'auto' }}>
            <h3>Registered Users ({users.length})</h3>

            {users.length === 0 ? (
              <p>No users found.</p>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th align="left">Name</th>
                    <th align="left">Email</th>
                    <th align="left">User ID</th>
                    <th align="left">Created At</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((item) => (
                    <tr key={item.user_id}>
                      <td>{item.name || '—'}</td>
                      <td>{item.email || '—'}</td>
                      <td>{item.user_id || '—'}</td>
                      <td>{item.created_at || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {!loading && !error && activeSection === 'interactions' && (
          <div style={{ marginTop: '28px', overflowX: 'auto' }}>
            <h3>Interactions ({interactions.length})</h3>

            {interactions.length === 0 ? (
              <p>No interactions found.</p>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th align="left">User ID</th>
                    <th align="left">Type</th>
                    <th align="left">Artist</th>
                    <th align="left">Track</th>
                    <th align="left">Timestamp</th>
                  </tr>
                </thead>
                <tbody>
                  {interactions.map((item) => (
                    <tr key={item.id}>
                      <td>{item.user_id || '—'}</td>
                      <td>{item.type || '—'}</td>
                      <td>{item.artist || '—'}</td>
                      <td>{item.track || '—'}</td>
                      <td>{item.timestamp || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {activeSection && (
          <button
            type="button"
            onClick={() => {
              setActiveSection('');
              setError('');
            }}
            style={{ marginTop: '20px' }}
          >
            Back to Admin Dashboard
          </button>
        )}
      </div>
    </section>
  );
}

export default AdminDashboard;