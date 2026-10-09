import { useState, useEffect } from 'react'
import './App.css'
import Dashboard from './Dashboard'
import Memories from './Memories'
import AskAI from './AskAI'
import Sidebar from './Sidebar'
import AdminDashboard from './AdminDashboard';
import {
  loginUser,
  registerUser,
  logout,
  getCurrentUser,
  fetchCurrentUser,
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
  const [currentPage, setCurrentPage] = useState('dashboard')

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
  const [showAddMemory, setShowAddMemory] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [question, setQuestion] = useState('')

  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState('')

  const [loadingAction, setLoadingAction] = useState('')

  const [searchResults, setSearchResults] = useState([])
  const [isSearching, setIsSearching] = useState(false)
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

      const verifiedUser = await fetchCurrentUser();
      console.log("VERIFIED USER:", verifiedUser);

      setCurrentUser(verifiedUser);
      setCurrentPage('dashboard');

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
    setCurrentPage('dashboard')

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
  function navigateTo(page) {
  setCurrentPage(page)
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

  useEffect(() => {
  if (!currentUser?.user_id) return;

  let cancelled = false;

  async function verifyUser() {
    try {
      const verifiedUser = await fetchCurrentUser();

      if (!cancelled) {
        setCurrentUser(verifiedUser);
      }
    } catch (error) {
      if (!cancelled) {
        logout();
        setCurrentUser(null);
        setCurrentPage('dashboard');
      }
    }
  }

  verifyUser();

  return () => {
    cancelled = true;
  };
}, []);


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

    return false

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

    console.log(
      'SAVE MEMORY RESPONSE:',
      data
    )

    setMemory('')

    await loadMemories()

    setLoadingAction('')

    showMessage(
      data.message ||
      'Memory saved successfully!',
      'success'
    )

    return true

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

    return false

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

setIsSearching(true)

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

  if (currentPage === 'admin') {
  if (!currentUser?.is_admin) {
    setCurrentPage('dashboard');
    return null;
  }

  return (
    <div className="app-shell">
      <Sidebar
        currentPage={currentPage}
        onNavigate={navigateTo}
        user={currentUser}
        onLogout={handleLogout}
      />

      <main className="app-main">
        <AdminDashboard user={currentUser} />
      </main>
    </div>
  );
}
  if (currentPage === 'dashboard') {
  return (
    <div className="app-shell">
      <Sidebar
        currentPage={currentPage}
        onNavigate={navigateTo}
        user={currentUser}
        onLogout={handleLogout}
      />

      <main className="app-main">
        <Dashboard
          user={currentUser}
          memories={memories}
          onNavigate={navigateTo}
        />
      </main>
    </div>
  )
}

if (currentPage === 'memories') {
  return (
    <div className="app-shell">
      <Sidebar
        currentPage={currentPage}
        onNavigate={navigateTo}
        user={currentUser}
        onLogout={handleLogout}
      />

      <main className="app-main">
        <Memories
  memories={isSearching ? searchResults : memories}

  searchQuery={searchQuery}
  setSearchQuery={setSearchQuery}
  onSearch={handleSearchMemory}

  onAddMemory={() => {
    setMemory('')
    setShowAddMemory(true)
  }}

  memory={memory}
  showAddMemory={showAddMemory}
  setShowAddMemory={setShowAddMemory}
  setMemory={setMemory}

  onSaveMemory={handleSaveMemory}
  saving={loadingAction === 'save'}

  onEditMemory={startEdit}

  onDeleteMemory={(memory) =>
    handleDeleteMemory(memory.memory_id)
  }

  /* EDIT */
  editingMemory={editingMemory}
  editText={editText}
  setEditText={setEditText}

  onUpdateMemory={handleUpdateMemory}
  onCancelEdit={cancelEdit}

  updating={loadingAction === 'update'}
/>
      </main>
    </div>
  )
}

if (currentPage === 'ask-ai') {
  return (
    <div className="app-shell">
      <Sidebar
        currentPage={currentPage}
        onNavigate={navigateTo}
        user={currentUser}
        onLogout={handleLogout}
      />

      <main className="app-main">
        <AskAI
          question={question}
          setQuestion={setQuestion}
          onAsk={handleAskMemory}
          answer={aiAnswer}
          relevantMemories={searchResults}
          loading={loadingAction === 'ask'}
        />
      </main>
    </div>
  )
}
}


export default App