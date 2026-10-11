import { useState } from 'react';
import {
  getAdminUsers,
  getAdminInteractions,
  getAdminAuditLogs,
} from './api';

  const auditCellStyle = {
  padding: '14px 12px',
  borderBottom: '1px solid #303030',
  verticalAlign: 'top',
  fontSize: '13px',
  lineHeight: 1.6,
};
function AdminDashboard({ user }) {
  const [activeSection, setActiveSection] = useState('');
  const [users, setUsers] = useState([]);
  const [interactions, setInteractions] = useState([]);
  const [userSearch, setUserSearch] = useState('');
  const [interactionSearch, setInteractionSearch] = useState('');
  const [interactionType, setInteractionType] = useState('all');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [auditLogs, setAuditLogs] = useState([]);
  const [auditTotal, setAuditTotal] = useState(0);
  const [auditOffset, setAuditOffset] = useState(0);

  if (user?.is_admin !== true) {
    return (
      <section className="card">
        <h2>Access Denied</h2>
        <p>Administrator privileges are required.</p>
      </section>
    );
  }

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
  } else if (section === 'audit-logs') {
    const data = await getAdminAuditLogs(50, 0);

    setAuditLogs(data.audit_logs || []);
    setAuditTotal(data.total || 0);
    setAuditOffset(0);
  }
} catch (err) {
  console.error('Admin dashboard error:', err);
  setError(err.message || 'Failed to load data.');
} finally {
  setLoading(false);
}
  }

  const filteredUsers = users.filter((item) => {
    const query = userSearch.trim().toLowerCase();

    return [
      item.name,
      item.email,
      item.user_id,
    ].some((value) =>
      String(value || '').toLowerCase().includes(query)
    );
  });

  const interactionTypes = [
    ...new Set(
      interactions
        .map((item) => item.type)
        .filter(Boolean)
    ),
  ];

  const filteredInteractions = interactions.filter((item) => {
    const query = interactionSearch.trim().toLowerCase();

    const matchesSearch = [
      item.user_id,
      item.type,
      item.artist,
      item.track,
      item.timestamp,
    ].some((value) =>
      String(value || '').toLowerCase().includes(query)
    );

    const matchesType =
      interactionType === 'all' || item.type === interactionType;

    return matchesSearch && matchesType;
  });

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
        <p>Administrator access verified.</p>

        {!activeSection && (
          <>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: '16px',
                marginTop: '24px',
              }}
            >
              <div className="card">
                <h3>Total Users</h3>
                <p style={{ fontSize: '28px', fontWeight: 'bold' }}>
                  {users.length}
                </p>
                <button
                  type="button"
                  onClick={() => openSection('users')}
                >
                  View Users
                </button>
              </div>

              <div className="card">
                <h3>Total Interactions</h3>
                <p style={{ fontSize: '28px', fontWeight: 'bold' }}>
                  {interactions.length}
                </p>
                <button
                  type="button"
                  onClick={() => openSection('interactions')}
                >
                  View Interactions
                </button>
              </div>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '16px',
                marginTop: '20px',
              }}
            >
              <button
                type="button"
                className="card"
                onClick={() => openSection('users')}
                style={{ cursor: 'pointer', textAlign: 'left' }}
              >
                <h3>👥 User Management</h3>
                <p>Search and view registered users.</p>
              </button>

              <button
                type="button"
                className="card"
                onClick={() => openSection('interactions')}
                style={{ cursor: 'pointer', textAlign: 'left' }}
              >
                <h3>📊 Interaction Monitoring</h3>
                <p>Search and filter recorded interactions.</p>
              </button>
              <button
  type="button"
  className="card"
  onClick={() => openSection('audit-logs')}
  style={{ cursor: 'pointer', textAlign: 'left' }}
>
  <h3>🔐 Audit Logs</h3>
  <p>Review recorded administrative and user activities.</p>
</button>
            </div>
          </>
        )}

        {loading && (
          <p role="status" style={{ marginTop: '24px' }}>
            Loading data...
          </p>
        )}

        {error && (
          <div
            className="message message-error"
            role="alert"
            style={{ marginTop: '20px' }}
          >
            {error}
            <button
              type="button"
              onClick={() => openSection(activeSection)}
              style={{ marginLeft: '12px' }}
            >
              Retry
            </button>
          </div>
        )}

        {!loading && !error && activeSection === 'users' && (
          <div style={{ marginTop: '28px', overflowX: 'auto' }}>
            <h3>Registered Users ({filteredUsers.length})</h3>

            <input
              type="search"
              value={userSearch}
              onChange={(event) => setUserSearch(event.target.value)}
              placeholder="Search name, email or user ID..."
              aria-label="Search users"
              style={{
                width: '100%',
                maxWidth: '450px',
                padding: '10px',
                margin: '12px 0 20px',
              }}
            />

            {filteredUsers.length === 0 ? (
              <p>No matching users found.</p>
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
                  {filteredUsers.map((item) => (
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
            <h3>Interactions ({filteredInteractions.length})</h3>

            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '12px',
                margin: '12px 0 20px',
              }}
            >
              <input
                type="search"
                value={interactionSearch}
                onChange={(event) =>
                  setInteractionSearch(event.target.value)
                }
                placeholder="Search user, artist or track..."
                aria-label="Search interactions"
                style={{
                  flex: '1',
                  minWidth: '220px',
                  padding: '10px',
                }}
              />

              <select
                value={interactionType}
                onChange={(event) => setInteractionType(event.target.value)}
                aria-label="Filter interaction type"
                style={{ padding: '10px' }}
              >
                <option value="all">All interaction types</option>
                {interactionTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            {filteredInteractions.length === 0 ? (
              <p>No matching interactions found.</p>
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
                  {filteredInteractions.map((item, index) => (
                    <tr key={item.id ?? `${item.user_id}-${item.timestamp}-${index}`}>
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
                        {!loading && !error && activeSection === 'audit-logs' && (
          <div style={{ marginTop: '28px' }}>
            {/* Header */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '12px',
                marginBottom: '20px',
              }}
            >
              <div>
                <h3 style={{ margin: 0 }}>🔐 Audit Logs</h3>
                <p style={{ margin: '6px 0 0', opacity: 0.7 }}>
                  Total recorded activities: {auditTotal}
                </p>
              </div>

              <button
                type="button"
                onClick={() => openSection('audit-logs')}
                disabled={loading}
              >
                🔄 Refresh Logs
              </button>
            </div>

            {/* Empty state */}
            {auditLogs.length === 0 ? (
              <div
                style={{
                  padding: '28px 16px',
                  textAlign: 'center',
                  border: '1px solid #333',
                  borderRadius: '12px',
                }}
              >
                <p>No audit logs found.</p>
                <p style={{ opacity: 0.7, fontSize: '14px' }}>
                  Recorded activities will appear here.
                </p>
              </div>
            ) : (
              /* Scrollable table */
              <div
                style={{
                  width: '100%',
                  overflowX: 'auto',
                  border: '1px solid #333',
                  borderRadius: '12px',
                }}
              >
                <table
  style={{
    width: '100%',
    minWidth: 0,
    borderCollapse: 'collapse',
    tableLayout: 'fixed',
    textAlign: 'left',
  }}
>
  <colgroup>
  <col style={{ width: '6%' }} />
  <col style={{ width: '15%' }} />
  <col style={{ width: '16%' }} />
  <col style={{ width: '21%' }} />
  <col style={{ width: '22%' }} />
  <col style={{ width: '20%' }} />
</colgroup>

                  <thead>
                    <tr>
                      {[
                        'ID',
                        'User ID',
                        'Action',
                        'Memory ID',
                        'Details',
                        'Created At',
                      ].map((heading) => (
                        <th
                          key={heading}
                          style={{
                            padding: '14px 12px',
                            borderBottom: '1px solid #444',
                            background: '#202020',
                            fontSize: '13px',
                            fontWeight: 600,
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {heading}
                        </th>
                      ))}
                    </tr>
                  </thead>

                  <tbody>
                    {auditLogs.map((item) => (
                      <tr key={item.id}>
                        <td style={auditCellStyle}>
                          {item.id}
                        </td>

                        <td
                          style={{
                            ...auditCellStyle,
                            overflowWrap: 'anywhere',
                          }}
                        >
                          {item.user_id || '—'}
                        </td>

                        <td style={auditCellStyle}>
                          <span
                            style={{
                              display: 'inline-block',
padding: '5px 7px',
borderRadius: '6px',
background: '#173c2b',
color: '#65e6a0',
fontSize: '10px',
whiteSpace: 'nowrap',
overflowWrap: 'normal',
maxWidth: '100%',
                            }}
                          >
                            {item.action || '—'}
                          </span>
                        </td>

                        <td
                          style={{
                            ...auditCellStyle,
                            overflowWrap: 'anywhere',
                          }}
                        >
                          {item.memory_id || '—'}
                        </td>

                        <td
                          style={{
                            ...auditCellStyle,
                            overflowWrap: 'anywhere',
                            wordBreak: 'break-word',
                            whiteSpace: 'normal',
                          }}
                        >
                          {item.details || '—'}
                        </td>

                        <td
                          style={{
                            ...auditCellStyle,
                            whiteSpace: 'normal',
                          }}
                        >
                          {item.created_at
                            ? new Date(item.created_at).toLocaleString()
                            : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeSection && (
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '10px',
              marginTop: '20px',
            }}
          >
            <button
              type="button"
              onClick={() => openSection(activeSection)}
              disabled={loading}
            >
              🔄 Refresh Data
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveSection('');
                setError('');
                setUserSearch('');
                setInteractionSearch('');
                setInteractionType('all');
              }}
            >
              Back to Admin Dashboard
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

export default AdminDashboard;