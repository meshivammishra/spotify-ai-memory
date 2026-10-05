function Dashboard({ user, memories = [], onNavigate }) {
  const totalMemories = memories.length;

  const preferenceCount = memories.filter(
    (memory) => memory.type === "preference"
  ).length;

  const episodicCount = memories.filter(
    (memory) => memory.type === "episodic"
  ).length;

  const recentMemories = [...memories]
    .sort(
      (a, b) =>
        new Date(b.created_at || 0) - new Date(a.created_at || 0)
    )
    .slice(0, 4);

  return (
    <div className="dashboard-page">
      <section className="dashboard-hero">
        <div>
          <p className="eyebrow">SPOTIFY AI MEMORY</p>

          <h1>
            Welcome back{user?.name ? `, ${user.name}` : ""} 👋
          </h1>

          <p className="hero-description">
            Your personal AI memory layer for smarter, more relevant
            conversations.
          </p>
        </div>

        <div className="ai-status-card">
          <span className="status-dot"></span>
          <div>
            <strong>AI Memory Active</strong>
            <small>Your memories are ready for retrieval</small>
          </div>
        </div>
      </section>

      <section className="dashboard-stats">
        <div className="stat-card">
          <div className="stat-icon">🧠</div>
          <div>
            <span>Total Memories</span>
            <strong>{totalMemories}</strong>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">⭐</div>
          <div>
            <span>Preferences</span>
            <strong>{preferenceCount}</strong>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">🎵</div>
          <div>
            <span>Episodes</span>
            <strong>{episodicCount}</strong>
          </div>
        </div>
      </section>

      <section className="dashboard-grid">
        <div className="dashboard-panel quick-actions">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">QUICK ACTIONS</p>
              <h2>What would you like to do?</h2>
            </div>
          </div>

          <div className="action-grid">
            <button
              className="action-card"
              onClick={() => onNavigate("memories")}
            >
              <span className="action-icon">🧠</span>
              <span>
                <strong>Manage Memories</strong>
                <small>View, edit and delete memories</small>
              </span>
              <span className="arrow">→</span>
            </button>

            <button
              className="action-card"
              onClick={() => onNavigate("ask-ai")}
            >
              <span className="action-icon">🤖</span>
              <span>
                <strong>Ask AI</strong>
                <small>Ask questions using your memory</small>
              </span>
              <span className="arrow">→</span>
            </button>
          </div>
        </div>

        <div className="dashboard-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">RECENT</p>
              <h2>Recent Memories</h2>
            </div>

            <button
              className="text-button"
              onClick={() => onNavigate("memories")}
            >
              View all →
            </button>
          </div>

          {recentMemories.length === 0 ? (
            <div className="empty-state">
              <div>🧠</div>
              <p>No memories yet</p>
              <small>
                Start adding memories to personalize your AI experience.
              </small>
            </div>
          ) : (
            <div className="recent-memory-list">
              {recentMemories.map((memory) => (
                <div
                  className="recent-memory-item"
                  key={memory.memory_id || memory.id}
                >
                  <div className="memory-mini-icon">♪</div>

                  <div className="recent-memory-content">
                    <strong>
                      {memory.fact || memory.value || "Memory"}
                    </strong>

                    <span>
                      {memory.type || "memory"}{" "}
                      {memory.confidence
                        ? `• ${Math.round(memory.confidence * 100)}% confidence`
                        : ""}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="dashboard-info">
        <div>
          <span className="info-icon">✨</span>

          <div>
            <strong>Personalized AI</strong>
            <p>
              Ask AI questions and receive responses based on the memories
              relevant to your current request.
            </p>
          </div>
        </div>

        <button
          className="primary-button"
          onClick={() => onNavigate("ask-ai")}
        >
          Ask AI →
        </button>
      </section>
    </div>
  );
}

export default Dashboard;