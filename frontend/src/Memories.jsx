function Memories({
  memories = [],
  searchQuery,
  setSearchQuery,
  onSearch,
  onAddMemory,
  memory,
  setMemory,
  showAddMemory,
  setShowAddMemory,
  onSaveMemory,
  saving = false,
  onEditMemory,
  onDeleteMemory,

  // EDIT PROPS
  editingMemory,
  editText,
  setEditText,
  onUpdateMemory,
  onCancelEdit,
  updating = false,
}) {
  return (
    <div className="memories-page">

      {/* =========================
          PAGE HEADER
      ========================= */}

      <section className="page-header">

        <div>
          <p className="eyebrow">MEMORY CONSOLE</p>

          <h1>My Memories 🧠</h1>

          <p>
            View and manage the preferences and experiences your AI has
            remembered.
          </p>
        </div>

        <button
          className="primary-button"
          onClick={() => {
            setMemory('')
            setShowAddMemory(true)
          }}
        >
          + Add Memory
        </button>


        {/* =========================
            ADD MEMORY
        ========================= */}

        {showAddMemory && (
          <section className="add-memory-box">

            <div className="add-memory-header">
              <div>
                <p className="eyebrow">NEW MEMORY</p>
                <h2>Add a memory</h2>
              </div>
            </div>

            <textarea
              value={memory}
              onChange={(e) => setMemory(e.target.value)}
              placeholder="Example: I love listening to Arijit Singh while travelling."
              rows={4}
            />

            <div className="add-memory-footer">

              <span>
                {memory.length} characters
              </span>

              <div className="memory-form-actions">

                <button
                  className="secondary-button"
                  onClick={() => setShowAddMemory(false)}
                >
                  Cancel
                </button>

                <button
                  className="primary-button"
                  onClick={async () => {
                    const result = await onSaveMemory()

                    if (result === true) {
                      setShowAddMemory(false)
                    }
                  }}
                  disabled={saving || !memory.trim()}
                >
                  {saving ? 'Saving...' : 'Save Memory →'}
                </button>

              </div>

            </div>

          </section>
        )}

      </section>


      {/* =========================
          SEARCH
      ========================= */}

      <section className="memory-toolbar">

        <div className="search-box">

          <span>⌕</span>

          <input
            type="text"
            placeholder="Search your memories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                onSearch()
              }
            }}
          />

          {searchQuery && (
            <button
              className="clear-search"
              onClick={() => setSearchQuery("")}
            >
              ×
            </button>
          )}

        </div>

        <button
          className="secondary-button"
          onClick={onSearch}
        >
          Search
        </button>

      </section>


      {/* =========================
          SUMMARY
      ========================= */}

      <section className="memory-summary">

        <div>
          <strong>{memories.length}</strong>
          <span>Total memories</span>
        </div>

        <div>
          <strong>
            {
              memories.filter(
                (memory) => memory.type === "preference"
              ).length
            }
          </strong>

          <span>Preferences</span>
        </div>

        <div>
          <strong>
            {
              memories.filter(
                (memory) => memory.type === "episodic"
              ).length
            }
          </strong>

          <span>Episodes</span>
        </div>

      </section>


      {/* =========================
          MEMORY CARDS
      ========================= */}

      <section className="memory-grid">

        {memories.length === 0 ? (

          <div className="memory-empty-state">

            <div className="empty-icon">
              🧠
            </div>

            <h2>No memories found</h2>

            <p>
              Add a memory or search for something you have previously
              stored.
            </p>

            <button
              className="primary-button"
              onClick={onAddMemory}
            >
              + Add your first memory
            </button>

          </div>

        ) : (

          memories.map((memoryItem) => (

            <article
              className="memory-card"
              key={
                memoryItem.memory_id ||
                memoryItem.id
              }
            >

              {/* =========================
                  CARD HEADER
              ========================= */}

              <div className="memory-card-top">

                <span className="memory-type">
                  {memoryItem.type || "memory"}
                </span>

                {memoryItem.confidence !== undefined && (

                  <span className="confidence">
                    {Math.round(
                      memoryItem.confidence * 100
                    )}%
                  </span>

                )}

              </div>


              {/* =========================
                  MEMORY CONTENT
              ========================= */}

              <h3>
                {memoryItem.fact ||
                  memoryItem.value ||
                  "Stored memory"}
              </h3>

              {memoryItem.value &&
                memoryItem.fact &&
                memoryItem.value !== memoryItem.fact && (

                  <p className="memory-value">
                    {memoryItem.value}
                  </p>

                )}


              {/* =========================
                  META
              ========================= */}

              <div className="memory-meta">

                {memoryItem.source && (
                  <span>
                    Source: {memoryItem.source}
                  </span>
                )}

                {memoryItem.created_at && (
                  <span>
                    {new Date(
                      memoryItem.created_at
                    ).toLocaleDateString()}
                  </span>
                )}

              </div>


              {/* =========================
                  ACTIONS
              ========================= */}

              {editingMemory ===
              memoryItem.memory_id ? (

                /* =========================
                   EDIT MODE
                ========================= */

                <div className="edit-box">

                  <div className="edit-title">
                    ✏️ Edit Memory
                  </div>

                  <textarea
                    value={editText}
                    onChange={(e) =>
                      setEditText(e.target.value)
                    }
                    autoFocus
                    rows={5}
                    placeholder="Edit your memory..."
                  />

                  <div className="edit-actions">

                    <button
                      type="button"
                      className="primary-button"
                      onClick={() =>
                        onUpdateMemory(
                          memoryItem.memory_id
                        )
                      }
                      disabled={
                        updating ||
                        !editText.trim()
                      }
                    >
                      {updating
                        ? 'Updating...'
                        : '💾 Save Changes'}
                    </button>

                    <button
                      type="button"
                      className="secondary-button"
                      onClick={onCancelEdit}
                      disabled={updating}
                    >
                      Cancel
                    </button>

                  </div>

                </div>

              ) : (

                /* =========================
                   NORMAL MODE
                ========================= */

                <div className="memory-actions">

                  <button
                    type="button"
                    className="secondary-button small"
                    onClick={() => {
                      console.log(
                        "EDIT CLICKED:",
                        memoryItem
                      )

                      onEditMemory(memoryItem)
                    }}
                  >
                    ✏️ Edit
                  </button>

                  <button
                    type="button"
                    className="danger-button"
                    onClick={() =>
                      onDeleteMemory(memoryItem)
                    }
                  >
                    🗑️ Delete
                  </button>

                </div>

              )}

            </article>

          ))

        )}

      </section>

    </div>
  )
}

export default Memories