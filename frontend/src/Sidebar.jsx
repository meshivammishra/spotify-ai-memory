function Sidebar({ currentPage, onNavigate, user, onLogout }) {
  return (
    <aside className="app-sidebar">
      <div className="sidebar-brand">
        <div className="sidebar-logo">🧠</div>

        <div>
          <strong>Spotify AI</strong>
          <span>Memory</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        <p className="sidebar-label">WORKSPACE</p>

        <button
          className={currentPage === 'dashboard' ? 'active' : ''}
          onClick={() => onNavigate('dashboard')}
        >
          <span>▣</span>
          Dashboard
        </button>

        <button
          className={currentPage === 'memories' ? 'active' : ''}
          onClick={() => onNavigate('memories')}
        >
          <span>🧠</span>
          My Memories
        </button>

        <button
          className={currentPage === 'ask-ai' ? 'active' : ''}
          onClick={() => onNavigate('ask-ai')}
        >
          <span>🤖</span>
          Ask AI
        </button>
      </nav>

      <div className="sidebar-bottom">
        <div className="sidebar-user">
          <div className="user-avatar">
            {(user?.name || 'U').charAt(0).toUpperCase()}
          </div>

          <div className="user-details">
            <strong>{user?.name || 'User'}</strong>
            <span>{user?.email || ''}</span>
          </div>
        </div>

        <button className="sidebar-logout" onClick={onLogout}>
          ↪ Logout
        </button>
      </div>
    </aside>
  )
}

export default Sidebar