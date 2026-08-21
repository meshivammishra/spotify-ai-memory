import { useState, useEffect } from 'react'
import './App.css'

import {
  saveMemory,
  searchMemory,
  askMemory,
  getMemories,
  updateMemory,
  deleteMemory
} from './api'

function App() {

  // ==============================
  // STATES
  // ==============================

  const [memory, setMemory] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [question, setQuestion] = useState('')
  const [message, setMessage] = useState('')

  const [searchResults, setSearchResults] = useState([])
  const [memories, setMemories] = useState([])

  // Edit states
  const [editingMemory, setEditingMemory] = useState(null)
  const [editText, setEditText] = useState('')

  const userId = 'user_001'


  // ==============================
  // LOAD MEMORIES
  // ==============================

  async function loadMemories() {

    try {

      console.log('Loading memories...')

      const data = await getMemories()

      console.log('MEMORIES FROM BACKEND:', data)

      setMemories(data.memories || [])

    } catch (error) {

      console.error(
        'Failed to load memories:',
        error
      )

      setMessage(
        `Error: ${error.message}`
      )
    }
  }


  // Load memories when page opens
  useEffect(() => {

    loadMemories()

  }, [])


  // ==============================
  // START EDIT
  // ==============================

  function startEdit(memoryItem) {

    console.log(
      'EDIT CLICKED:',
      memoryItem
    )

    console.log(
      'MEMORY ID:',
      memoryItem.memory_id
    )

    setEditingMemory(
      memoryItem.memory_id
    )

    setEditText(
      memoryItem.fact ||
      memoryItem.value ||
      ''
    )
  }


  // ==============================
  // CANCEL EDIT
  // ==============================

  function cancelEdit() {

    setEditingMemory(null)

    setEditText('')

    setMessage('')
  }


  // ==============================
  // UPDATE MEMORY
  // ==============================

  async function handleUpdateMemory(memoryId) {

    console.log(
      'UPDATE FUNCTION CALLED'
    )

    console.log(
      'MEMORY ID:',
      memoryId
    )

    console.log(
      'EDIT TEXT:',
      editText
    )


    // Check memory ID
    if (!memoryId) {

      setMessage(
        'Error: Memory ID is missing.'
      )

      console.error(
        'Memory ID is undefined!'
      )

      return
    }


    // Check text
    if (!editText.trim()) {

      setMessage(
        'Memory cannot be empty.'
      )

      return
    }


    try {

      setMessage(
        'Updating memory...'
      )


      // ==============================
      // SEND UPDATE TO BACKEND
      // ==============================

      // IMPORTANT:
      // Backend MemoryUpdateRequest requires
      // BOTH "fact" and "value"

      const updateData = {

        fact: editText.trim(),

        value: editText.trim()

      }


      console.log(
        'SENDING UPDATE:',
        updateData
      )

      console.log(
        'PUT MEMORY ID:',
        memoryId
      )


      const data = await updateMemory(
        memoryId,
        updateData
      )


      console.log(
        'UPDATE RESPONSE:',
        data
      )


      // ==============================
      // CLOSE EDIT BOX
      // ==============================

      setEditingMemory(null)

      setEditText('')


      // ==============================
      // RELOAD FROM BACKEND
      // ==============================

      await loadMemories()


      setMessage(
        data.message ||
        'Memory updated successfully!'
      )


    } catch (error) {

      console.error(
        'UPDATE ERROR:',
        error
      )

      setMessage(
        `Error: ${error.message}`
      )
    }
  }


  // ==============================
  // DELETE MEMORY
  // ==============================

  async function handleDeleteMemory(memoryId) {

    console.log(
      'DELETE MEMORY:',
      memoryId
    )


    if (!memoryId) {

      setMessage(
        'Error: Memory ID is missing.'
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

      setMessage(
        'Deleting memory...'
      )


      await deleteMemory(
        memoryId
      )


      // Remove from UI
      setMemories(
        (prev) =>
          prev.filter(
            (item) =>
              item.memory_id !== memoryId
          )
      )


      // If currently editing this memory
      if (
        editingMemory === memoryId
      ) {

        setEditingMemory(null)

        setEditText('')
      }


      setMessage(
        'Memory deleted successfully!'
      )


    } catch (error) {

      console.error(
        'DELETE ERROR:',
        error
      )

      setMessage(
        `Error: ${error.message}`
      )
    }
  }


  // ==============================
  // SAVE NEW MEMORY
  // ==============================

  async function handleSaveMemory() {

    if (!memory.trim()) {

      setMessage(
        'Please enter a memory.'
      )

      return
    }


    try {

      setMessage(
        'Saving memory...'
      )


      console.log(
        'SAVING MEMORY:',
        memory.trim()
      )


      const data =
        await saveMemory(
          memory.trim()
        )


      console.log(
        'SAVE RESPONSE:',
        data
      )


      setMemory('')


      setMessage(
        data.message ||
        'Memory saved successfully!'
      )


      // Reload memories
      await loadMemories()


    } catch (error) {

      console.error(
        'SAVE ERROR:',
        error
      )

      setMessage(
        `Error: ${error.message}`
      )
    }
  }


  // ==============================
  // SEARCH MEMORY
  // ==============================

  async function handleSearchMemory() {

    if (!searchQuery.trim()) {

      setMessage(
        'Please enter a search query.'
      )

      return
    }


    try {

      setMessage(
        'Searching memories...'
      )


      console.log(
        'SEARCH QUERY:',
        searchQuery.trim()
      )


      const data =
        await searchMemory(
          searchQuery.trim()
        )


      console.log(
        'SEARCH RESPONSE:',
        data
      )


      setSearchResults(
        data.relevant_memories || []
      )


      setMessage(
        data.count
          ? `${data.count} relevant memories found.`
          : 'No relevant memories found.'
      )


    } catch (error) {

      console.error(
        'SEARCH ERROR:',
        error
      )

      setMessage(
        `Error: ${error.message}`
      )
    }
  }


  // ==============================
  // ASK MEMORY
  // ==============================

  async function handleAskMemory() {

    if (!question.trim()) {

      setMessage(
        'Please enter a question.'
      )

      return
    }


    try {

      setMessage(
        'Thinking...'
      )


      console.log(
        'QUESTION:',
        question.trim()
      )


      const data =
        await askMemory(
          question.trim()
        )


      console.log(
        'ASK RESPONSE:',
        data
      )


      setMessage(
        data.answer ||
        data.response ||
        data.message ||
        JSON.stringify(data)
      )


    } catch (error) {

      console.error(
        'ASK ERROR:',
        error
      )

      setMessage(
        `Error: ${error.message}`
      )
    }
  }


  // ==============================
  // UI
  // ==============================

  return (

    <div className="app">


      {/* ================= HEADER ================= */}

      <header className="header">

        <div>

          <h1>
            🧠 Spotify AI Memory
          </h1>

          <p>
            Personalized memory system
          </p>

        </div>


        <div className="user">

          👤 {userId}

        </div>

      </header>


      <main className="container">


        {/* ================= SAVED MEMORIES ================= */}

        <section className="card">

          <h2>
            🧠 Saved Memories
          </h2>


          <p>
            What the AI remembers about the user.
          </p>


          {memories.length === 0 ? (

            <p>
              No memories found.
            </p>

          ) : (

            memories.map(
              (memoryItem) => (

                <div
                  className="memory-item"
                  key={memoryItem.memory_id}
                >


                  {/* MEMORY TEXT */}

                  <h3>

                    {memoryItem.fact ||
                     memoryItem.value}

                  </h3>


                  {/* TYPE */}

                  <p>

                    <strong>
                      Type:
                    </strong>{' '}

                    {memoryItem.type}

                  </p>


                  {/* CONFIDENCE */}

                  <p>

                    <strong>
                      Confidence:
                    </strong>{' '}

                    {memoryItem.confidence}

                  </p>


                  {/* SOURCE */}

                  <p>

                    <strong>
                      Source:
                    </strong>{' '}

                    {memoryItem.source}

                  </p>


                  {/* ================= BUTTONS ================= */}

                  <div className="memory-actions">


                    {/* EDIT BUTTON */}

                    <button
                      type="button"
                      onClick={() =>
                        startEdit(
                          memoryItem
                        )
                      }
                    >

                      ✏️ Edit

                    </button>


                    {/* DELETE BUTTON */}

                    <button
                      type="button"
                      onClick={() =>
                        handleDeleteMemory(
                          memoryItem.memory_id
                        )
                      }
                    >

                      🗑️ Delete

                    </button>


                  </div>


                  {/* ================= EDIT BOX ================= */}

                  {editingMemory ===
                    memoryItem.memory_id && (

                    <div className="edit-box">


                      <h4>
                        ✏️ Edit Memory
                      </h4>


                      <textarea
                        value={editText}
                        onChange={(e) =>
                          setEditText(
                            e.target.value
                          )
                        }
                      />


                      <div className="edit-actions">


                        {/* SAVE CHANGES */}

                        <button
                          type="button"
                          onClick={() =>
                            handleUpdateMemory(
                              memoryItem.memory_id
                            )
                          }
                        >

                          💾 Save Changes

                        </button>


                        {/* CANCEL */}

                        <button
                          type="button"
                          onClick={
                            cancelEdit
                          }
                        >

                          ❌ Cancel

                        </button>


                      </div>


                    </div>

                  )}


                </div>

              )
            )

          )}

        </section>


        {/* ================= SAVE MEMORY ================= */}

        <section className="card">


          <h2>
            ➕ Save Memory
          </h2>


          <p>
            Save something important about the user.
          </p>


          <textarea
            placeholder="Example: I love listening to Arijit Singh while travelling."
            value={memory}
            onChange={(e) =>
              setMemory(
                e.target.value
              )
            }
          />


          <button
            type="button"
            onClick={
              handleSaveMemory
            }
          >

            Save Memory

          </button>


        </section>


        {/* ================= SEARCH MEMORY ================= */}

        <section className="card">


          <h2>
            🔍 Search Memory
          </h2>


          <p>
            Search the user's saved memories.
          </p>


          <input
            type="text"
            placeholder="What do you remember about my music?"
            value={searchQuery}
            onChange={(e) =>
              setSearchQuery(
                e.target.value
              )
            }
          />


          <button
            type="button"
            onClick={
              handleSearchMemory
            }
          >

            Search Memory

          </button>


        </section>


        {/* ================= SEARCH RESULTS ================= */}

        {searchResults.length > 0 && (

          <section className="card">


            <h2>
              📋 Search Results
            </h2>


            {searchResults.map(
              (result, index) => (

                <div
                  key={index}
                  className="result"
                >


                  <strong>
                    {result.fact ||
                     result.value}
                  </strong>


                  <p>

                    Type: {result.type}

                    {' | '}

                    Score:{' '}

                    {typeof result.score ===
                      'number'
                      ? result.score.toFixed(3)
                      : 'N/A'}

                  </p>


                </div>

              )
            )}


          </section>

        )}


        {/* ================= ASK MEMORY ================= */}

        <section className="card">


          <h2>
            💬 Ask Memory
          </h2>


          <p>
            Ask a question using the user's memories.
          </p>


          <input
            type="text"
            placeholder="Example: What kind of music do I like?"
            value={question}
            onChange={(e) =>
              setQuestion(
                e.target.value
              )
            }
          />


          <button
            type="button"
            onClick={
              handleAskMemory
            }
          >

            Ask Memory

          </button>


        </section>


        {/* ================= STATUS ================= */}

        {message && (

          <div className="message">

            {message}

          </div>

        )}


      </main>

    </div>

  )
}


export default App