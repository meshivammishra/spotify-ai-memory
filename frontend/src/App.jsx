import { useState, useEffect } from 'react'
import './App.css'

import {
  loginUser,
  registerUser,
  logout,
  getCurrentUser,
  saveMemory,
  searchMemory,
  askMemory,
  getMemories,
  updateMemory,
  deleteMemory
} from './api'


function App() {

  // ==========================================
  // AUTH
  // ==========================================

  const [currentUser, setCurrentUser] = useState(
    getCurrentUser()
  )

  const [isRegister, setIsRegister] = useState(false)

  const [authName, setAuthName] = useState('')
  const [authEmail, setAuthEmail] = useState('')
  const [authPassword, setAuthPassword] = useState('')

  const [authLoading, setAuthLoading] = useState(false)
  const [authError, setAuthError] = useState('')


  // ==========================================
  // USER ID
  // ==========================================

  const userId = currentUser?.user_id || ''


  // ==========================================
  // STATES
  // ==========================================

  const [memory, setMemory] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [question, setQuestion] = useState('')

  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState('')

  const [loadingAction, setLoadingAction] = useState('')

  const [searchResults, setSearchResults] = useState([])
  const [memories, setMemories] = useState([])

  const [aiAnswer, setAiAnswer] = useState('')

  const [editingMemory, setEditingMemory] = useState(null)
  const [editText, setEditText] = useState('')


  // ==========================================
  // MESSAGE HELPER
  // ==========================================

  function showMessage(text, type = 'success') {

    setMessage(text)
    setMessageType(type)

  }


  // ==========================================
  // LOGIN
  // ==========================================

  async function handleLogin(e) {

    e.preventDefault()

    if (!authEmail.trim() || !authPassword) {

      setAuthError(
        'Please enter email and password.'
      )

      return
    }

    try {

      setAuthLoading(true)
      setAuthError('')

      const data = await loginUser(
        authEmail.trim(),
        authPassword
      )

      setCurrentUser(data.user)

      setAuthEmail('')
      setAuthPassword('')

    } catch (error) {

      console.error(
        'LOGIN ERROR:',
        error
      )

      setAuthError(
        error.message
      )

    } finally {

      setAuthLoading(false)

    }

  }


  // ==========================================
  // REGISTER
  // ==========================================

  async function handleRegister(e) {

    e.preventDefault()

    if (
      !authName.trim() ||
      !authEmail.trim() ||
      !authPassword
    ) {

      setAuthError(
        'Please fill all fields.'
      )

      return
    }

    try {

      setAuthLoading(true)
      setAuthError('')

      await registerUser(
        authName.trim(),
        authEmail.trim(),
        authPassword
      )

      // Registration successful
      // Switch to login

      setIsRegister(false)

      setAuthName('')
      setAuthPassword('')

      setAuthError('')

      showMessage(
        'Registration successful. Please login.',
        'success'
      )

    } catch (error) {

      console.error(
        'REGISTER ERROR:',
        error
      )

      setAuthError(
        error.message
      )

    } finally {

      setAuthLoading(false)

    }

  }


  // ==========================================
  // LOGOUT
  // ==========================================

  function handleLogout() {

    logout()

    setCurrentUser(null)

    setMemories([])
    setSearchResults([])
    setAiAnswer('')

    setMemory('')
    setSearchQuery('')
    setQuestion('')

    setEditingMemory(null)
    setEditText('')

    setMessage('')
    setMessageType('')

  }


  // ==========================================
  // LOAD MEMORIES
  // ==========================================

  async function loadMemories() {

    if (!userId) {
      return
    }

    try {

      setLoadingAction('load')

      const data =
        await getMemories(userId)

      setMemories(
        data.memories || []
      )

      setLoadingAction('')

    } catch (error) {

      setLoadingAction('')

      console.error(
        'Failed to load memories:',
        error
      )

      showMessage(
        `Failed to load memories: ${error.message}`,
        'error'
      )

    }

  }


  // ==========================================
  // LOAD WHEN USER LOGS IN
  // ==========================================

  useEffect(() => {

    if (currentUser?.user_id) {

      loadMemories()

    }

  }, [currentUser?.user_id])


  // ==========================================
  // START EDIT
  // ==========================================

  function startEdit(memoryItem) {

    setEditingMemory(
      memoryItem.memory_id
    )

    setEditText(
      memoryItem.fact ||
      memoryItem.value ||
      ''
    )

    setMessage('')

  }


  // ==========================================
  // CANCEL EDIT
  // ==========================================

  function cancelEdit() {

    setEditingMemory(null)
    setEditText('')

  }


  // ==========================================
  // UPDATE MEMORY
  // ==========================================

  async function handleUpdateMemory(memoryId) {

    if (!memoryId) {

      showMessage(
        'Memory ID is missing.',
        'error'
      )

      return

    }

    if (!editText.trim()) {

      showMessage(
        'Memory cannot be empty.',
        'error'
      )

      return

    }

    try {

      setLoadingAction('update')

      showMessage(
        'Updating memory...',
        'loading'
      )

      const data =
        await updateMemory(
          userId,
          memoryId,
          {
            fact: editText.trim(),
            value: editText.trim()
          }
        )

      setEditingMemory(null)
      setEditText('')

      await loadMemories()

      setLoadingAction('')

      showMessage(
        data.message ||
        'Memory updated successfully!',
        'success'
      )

    } catch (error) {

      setLoadingAction('')

      console.error(
        'UPDATE ERROR:',
        error
      )

      showMessage(
        `Update failed: ${error.message}`,
        'error'
      )

    }

  }


  // ==========================================
  // DELETE MEMORY
  // ==========================================

  async function handleDeleteMemory(memoryId) {

    if (!memoryId) {

      showMessage(
        'Memory ID is missing.',
        'error'
      )

      return

    }

    const confirmDelete =
      window.confirm(
        'Are you sure you want to delete this memory?'
      )

    if (!confirmDelete) {
      return
    }

    try {

      setLoadingAction('delete')

      showMessage(
        'Deleting memory...',
        'loading'
      )

      await deleteMemory(
        userId,
        memoryId
      )

      setMemories(prev =>
        prev.filter(
          item =>
            item.memory_id !== memoryId
        )
      )

      if (editingMemory === memoryId) {

        setEditingMemory(null)
        setEditText('')

      }

      setLoadingAction('')

      showMessage(
        'Memory deleted successfully!',
        'success'
      )

    } catch (error) {

      setLoadingAction('')

      console.error(
        'DELETE ERROR:',
        error
      )

      showMessage(
        `Delete failed: ${error.message}`,
        'error'
      )

    }

  }


  // ==========================================
  // SAVE MEMORY
  // ==========================================

  async function handleSaveMemory() {

    if (!memory.trim()) {

      showMessage(
        'Please enter a memory first.',
        'error'
      )

      return

    }

    try {

      setLoadingAction('save')

      showMessage(
        'Saving memory...',
        'loading'
      )

      const data =
        await saveMemory(
          userId,
          memory.trim()
        )

      setMemory('')

      await loadMemories()

      setLoadingAction('')

      showMessage(
        data.message ||
        'Memory saved successfully!',
        'success'
      )

    } catch (error) {

      setLoadingAction('')

      console.error(
        'SAVE ERROR:',
        error
      )

      showMessage(
        `Save failed: ${error.message}`,
        'error'
      )

    }

  }


  // ==========================================
  // SEARCH MEMORY
  // ==========================================

  async function handleSearchMemory() {

    if (!searchQuery.trim()) {

      showMessage(
        'Please enter something to search.',
        'error'
      )

      return

    }

    try {

      setLoadingAction('search')

      showMessage(
        'Searching memories...',
        'loading'
      )

      const data =
        await searchMemory(
          userId,
          searchQuery.trim()
        )

      setSearchResults(
        data.relevant_memories || []
      )

      setLoadingAction('')

      if (data.count) {

        showMessage(
          `${data.count} relevant memories found.`,
          'success'
        )

      } else {

        showMessage(
          'No relevant memories found.',
          'success'
        )

      }

    } catch (error) {

      setLoadingAction('')

      console.error(
        'SEARCH ERROR:',
        error
      )

      showMessage(
        `Search failed: ${error.message}`,
        'error'
      )

    }

  }


  // ==========================================
  // ASK MEMORY
  // ==========================================

  async function handleAskMemory() {

    if (!question.trim()) {

      showMessage(
        'Please enter a question first.',
        'error'
      )

      return

    }

    try {

      setLoadingAction('ask')

      setAiAnswer('')

      showMessage(
        'AI is thinking...',
        'loading'
      )

      const data =
        await askMemory(
          userId,
          question.trim()
        )

      setAiAnswer(
        data.answer ||
        data.response ||
        'I could not find enough information in memory.'
      )

      setLoadingAction('')

      showMessage(
        'Answer generated from stored memory.',
        'success'
      )

    } catch (error) {

      setLoadingAction('')

      console.error(
        'ASK ERROR:',
        error
      )

      setAiAnswer('')

      showMessage(
        `Ask Memory failed: ${error.message}`,
        'error'
      )

    }

  }


  // ==========================================
  // RELEVANCE SCORE
  // ==========================================

  function getScorePercent(score) {

    if (typeof score !== 'number') {
      return null
    }

    const percentage =
      Math.max(
        0,
        Math.min(
          100,
          score * 100
        )
      )

    return percentage.toFixed(1)

  }


  // ============================================================
  // LOGIN / REGISTER SCREEN
  // ============================================================

  if (!currentUser) {

    return (

      <div className="app">

        <main className="container">

          <section className="card auth-card">

            <div className="section-header">

              <div>

                <div className="section-title">

                  <span className="section-icon">
                    🧠
                  </span>

                  <h2>
                    Spotify AI Memory
                  </h2>

                </div>

                <p>
                  Personalized memory intelligence
                </p>

              </div>

            </div>


            <form
              onSubmit={
                isRegister
                  ? handleRegister
                  : handleLogin
              }
            >

              {isRegister && (

                <input
                  type="text"
                  placeholder="Your name"
                  value={authName}
                  onChange={(e) =>
                    setAuthName(e.target.value)
                  }
                />

              )}


              <input
                type="email"
                placeholder="Email"
                value={authEmail}
                onChange={(e) =>
                  setAuthEmail(e.target.value)
                }
              />


              <input
                type="password"
                placeholder="Password"
                value={authPassword}
                onChange={(e) =>
                  setAuthPassword(e.target.value)
                }
              />


              {authError && (

                <div className="message message-error">

                  <span className="message-icon">
                    !
                  </span>

                  <span>
                    {authError}
                  </span>

                </div>

              )}


              <button
                type="submit"
                disabled={authLoading}
              >

                {authLoading

                  ? 'Please wait...'

                  : isRegister
                    ? 'Create Account'
                    : 'Login'}

              </button>

            </form>


            <div style={{
              marginTop: '20px',
              textAlign: 'center'
            }}>

              <button
                type="button"
                onClick={() => {

                  setIsRegister(
                    !isRegister
                  )

                  setAuthError('')

                }}
              >

                {isRegister
                  ? 'Already have an account? Login'
                  : "Don't have an account? Register"}

              </button>

            </div>

          </section>

        </main>

      </div>

    )

  }


  // ============================================================
  // MAIN APPLICATION
  // ============================================================

  return (

    <div className="app">


      {/* =====================================
          HEADER
      ===================================== */}

      <header className="header">

        <div className="brand">

          <div className="brand-icon">
            🧠
          </div>

          <div>

            <h1>
              Spotify AI Memory
            </h1>

            <p>
              Personalized memory intelligence
            </p>

          </div>

        </div>


        {/* LOGGED-IN USER */}

        <div className="user">

          <span className="online-dot"></span>

          <div>

            <strong>
              {currentUser.name}
            </strong>

            <small style={{
              display: 'block'
            }}>
              {currentUser.email}
            </small>

          </div>


          <button
            type="button"
            onClick={handleLogout}
          >
            Logout
          </button>

        </div>

      </header>


      <main className="container">


        {/* =====================================
            HERO
        ===================================== */}

        <section className="hero">

          <div>

            <span className="hero-label">
              PERSONALIZED AI
            </span>

            <h2>
              Your AI remembers
              <span> what matters.</span>
            </h2>

            <p>
              Store, search and ask questions
              about your personalized Spotify memories.
            </p>

          </div>


          <div className="hero-stats">

            <div className="stat">

              <strong>
                {memories.length}
              </strong>

              <span>
                Memories
              </span>

            </div>


            <div className="stat">

              <strong>
                AI
              </strong>

              <span>
                Powered
              </span>

            </div>

          </div>

        </section>


        {/* =====================================
            STATUS MESSAGE
        ===================================== */}

        {message && (

          <div
            className={`message message-${messageType}`}
          >

            {messageType === 'loading' && (
              <span className="spinner"></span>
            )}

            {messageType === 'success' && (
              <span className="message-icon">
                ✓
              </span>
            )}

            {messageType === 'error' && (
              <span className="message-icon">
                !
              </span>
            )}

            <span>
              {message}
            </span>

          </div>

        )}


        {/* =====================================
            SAVED MEMORIES
        ===================================== */}

        <section className="card">

          <div className="section-header">

            <div>

              <div className="section-title">

                <span className="section-icon">
                  🧠
                </span>

                <h2>
                  Saved Memories
                </h2>

              </div>

              <p>
                Everything your AI currently remembers.
              </p>

            </div>


            <span className="count-badge">
              {memories.length}
            </span>

          </div>


          {memories.length === 0 ? (

            <div className="empty-state">

              <div className="empty-icon">
                🧠
              </div>

              <h3>
                No memories yet
              </h3>

              <p>
                Add your first memory below
                and your AI will remember it.
              </p>

            </div>

          ) : (

            <div className="memory-list">

              {memories.map(
                (memoryItem) => (

                  <div
                    className="memory-item"
                    key={memoryItem.memory_id}
                  >

                    <div className="memory-top">

                      <div className="memory-main">

                        <span className="memory-type">
                          {memoryItem.type || 'memory'}
                        </span>

                        <h3>
                          {memoryItem.fact ||
                           memoryItem.value}
                        </h3>

                      </div>


                      <div className="memory-confidence">

                        <span>
                          Confidence
                        </span>

                        <strong>

                          {typeof memoryItem.confidence === 'number'
                            ? `${Math.round(
                                memoryItem.confidence * 100
                              )}%`
                            : 'N/A'}

                        </strong>

                      </div>

                    </div>


                    <div className="memory-meta">

                      <span>
                        📌 {memoryItem.source || 'unknown'}
                      </span>

                      {memoryItem.created_at && (

                        <span>

                          🕒 {new Date(
                            memoryItem.created_at
                          ).toLocaleDateString()}

                        </span>

                      )}

                    </div>


                    <div className="memory-actions">

                      <button
                        type="button"
                        className="edit-button"
                        onClick={() =>
                          startEdit(memoryItem)
                        }
                      >
                        ✏️ Edit
                      </button>


                      <button
                        type="button"
                        className="delete-button"
                        onClick={() =>
                          handleDeleteMemory(
                            memoryItem.memory_id
                          )
                        }
                        disabled={
                          loadingAction === 'delete'
                        }
                      >

                        {loadingAction === 'delete'
                          ? 'Deleting...'
                          : '🗑️ Delete'}

                      </button>

                    </div>


                    {editingMemory ===
                      memoryItem.memory_id && (

                      <div className="edit-box">

                        <div className="edit-title">
                          ✏️ Edit Memory
                        </div>


                        <textarea
                          value={editText}
                          onChange={(e) =>
                            setEditText(
                              e.target.value
                            )
                          }
                        />


                        <div className="edit-actions">

                          <button
                            type="button"
                            onClick={() =>
                              handleUpdateMemory(
                                memoryItem.memory_id
                              )
                            }
                            disabled={
                              loadingAction === 'update'
                            }
                          >

                            {loadingAction === 'update'
                              ? 'Updating...'
                              : '💾 Save Changes'}

                          </button>


                          <button
                            type="button"
                            className="cancel-button"
                            onClick={cancelEdit}
                          >

                            Cancel

                          </button>

                        </div>

                      </div>

                    )}

                  </div>

                )
              )}

            </div>

          )}

        </section>


        {/* =====================================
            SAVE MEMORY
        ===================================== */}

        <section className="card">

          <div className="section-header">

            <div>

              <div className="section-title">

                <span className="section-icon">
                  ➕
                </span>

                <h2>
                  Save Memory
                </h2>

              </div>

              <p>
                Tell the AI something important about the user.
              </p>

            </div>

          </div>


          <textarea
            className="main-textarea"
            placeholder="Example: I love listening to Arijit Singh while travelling."
            value={memory}
            onChange={(e) =>
              setMemory(e.target.value)
            }
          />


          <div className="input-footer">

            <span>
              {memory.length} characters
            </span>


            <button
              type="button"
              onClick={handleSaveMemory}
              disabled={
                loadingAction === 'save'
              }
            >

              {loadingAction === 'save'
                ? 'Saving...'
                : '💾 Save Memory'}

            </button>

          </div>

        </section>


        {/* =====================================
            SEARCH
        ===================================== */}

        <section className="card">

          <div className="section-header">

            <div>

              <div className="section-title">

                <span className="section-icon">
                  🔍
                </span>

                <h2>
                  Search Memory
                </h2>

              </div>

              <p>
                Find memories using semantic search.
              </p>

            </div>

          </div>


          <div className="search-row">

            <input
              type="text"
              placeholder="What do you remember about my music?"
              value={searchQuery}
              onChange={(e) =>
                setSearchQuery(
                  e.target.value
                )
              }
              onKeyDown={(e) => {

                if (e.key === 'Enter') {
                  handleSearchMemory()
                }

              }}
            />


            <button
              type="button"
              onClick={handleSearchMemory}
              disabled={
                loadingAction === 'search'
              }
            >

              {loadingAction === 'search'
                ? 'Searching...'
                : '🔍 Search'}

            </button>

          </div>

        </section>


        {/* =====================================
            SEARCH RESULTS
        ===================================== */}

        {searchResults.length > 0 && (

          <section className="card">

            <div className="section-header">

              <div>

                <div className="section-title">

                  <span className="section-icon">
                    📋
                  </span>

                  <h2>
                    Search Results
                  </h2>

                </div>

                <p>
                  Memories ranked by semantic relevance.
                </p>

              </div>


              <span className="count-badge">
                {searchResults.length}
              </span>

            </div>


            <div className="search-results">

              {searchResults.map(
                (result, index) => {

                  const percentage =
                    getScorePercent(
                      result.final_score ??
                      result.similarity_score ??
                      result.score
                    )


                  return (

                    <div
                      className="result"
                      key={
                        result.memory_id ||
                        index
                      }
                    >

                      <div className="result-number">
                        {index + 1}
                      </div>


                      <div className="result-content">

                        <span className="memory-type">
                          {result.type || 'memory'}
                        </span>


                        <strong>
                          {result.fact ||
                           result.value}
                        </strong>


                        <div className="result-meta">

                          {percentage !== null && (

                            <div className="score">

                              <span>
                                Relevance
                              </span>


                              <div className="score-bar">

                                <div
                                  className="score-fill"
                                  style={{
                                    width: `${percentage}%`
                                  }}
                                />

                              </div>


                              <strong>
                                {percentage}%
                              </strong>

                            </div>

                          )}

                        </div>

                      </div>

                    </div>

                  )

                }
              )}

            </div>

          </section>

        )}


        {/* =====================================
            ASK MEMORY
        ===================================== */}

        <section className="card ask-card">

          <div className="section-header">

            <div>

              <div className="section-title">

                <span className="section-icon">
                  ✨
                </span>

                <h2>
                  Ask Memory
                </h2>

              </div>

              <p>
                Ask the AI questions using stored memories.
              </p>

            </div>


            <span className="ai-badge">
              AI
            </span>

          </div>


          <div className="ask-input">

            <input
              type="text"
              placeholder="Example: What kind of music do I like?"
              value={question}
              onChange={(e) =>
                setQuestion(
                  e.target.value
                )
              }
              onKeyDown={(e) => {

                if (e.key === 'Enter') {
                  handleAskMemory()
                }

              }}
            />


            <button
              type="button"
              onClick={handleAskMemory}
              disabled={
                loadingAction === 'ask'
              }
            >

              {loadingAction === 'ask'
                ? 'Thinking...'
                : '✨ Ask AI'}

            </button>

          </div>


          {aiAnswer && (

            <div className="ai-answer">

              <div className="ai-answer-header">

                <div className="ai-avatar">
                  ✨
                </div>


                <div>

                  <strong>
                    AI Memory Assistant
                  </strong>

                  <span>
                    Answer based on stored memories
                  </span>

                </div>

              </div>


              <div className="ai-answer-text">

                {aiAnswer}

              </div>

            </div>

          )}

        </section>


        {/* =====================================
            FOOTER
        ===================================== */}

        <footer className="footer">

          <span>
            🧠 Spotify AI Memory
          </span>

          <span>
            Personalized • Semantic • AI Powered
          </span>

        </footer>


      </main>

    </div>

  )

}


export default App