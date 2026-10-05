function AskAI({
  question,
  setQuestion,
  onAsk,
  answer,
  relevantMemories = [],
  loading = false,
}) {
  const handleSubmit = (e) => {
    e.preventDefault();

    if (question.trim()) {
      onAsk();
    }
  };

  return (
    <div className="ask-ai-page">
      <section className="ask-ai-hero">
        <div>
          <p className="eyebrow">AI MEMORY ASSISTANT</p>

          <h1>Ask AI 🤖</h1>

          <p>
            Ask a question and let your AI use relevant stored memories
            to give you a personalized answer.
          </p>
        </div>

        <div className="rag-badge">
          <span className="status-dot"></span>
          RAG Enabled
        </div>
      </section>

      <section className="ask-ai-container">
        <form className="ai-question-box" onSubmit={handleSubmit}>
          <div className="question-icon">✨</div>

          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ask something about your music preferences..."
            rows={4}
          />

          <div className="question-footer">
            <span>
              AI will retrieve relevant memories before answering.
            </span>

            <button
              type="submit"
              className="primary-button"
              disabled={loading || !question.trim()}
            >
              {loading ? "Thinking..." : "Ask AI →"}
            </button>
          </div>
        </form>

        {answer && (
          <section className="ai-answer-card">
            <div className="answer-header">
              <div className="ai-avatar">🤖</div>

              <div>
                <strong>AI Response</strong>
                <span>Generated using retrieved memory</span>
              </div>
            </div>

            <div className="answer-content">
              {answer}
            </div>
          </section>
        )}

        {relevantMemories.length > 0 && (
          <section className="retrieved-section">
            <div className="section-heading">
              <div>
                <p className="eyebrow">RETRIEVED CONTEXT</p>
                <h2>Memories used for this answer</h2>
              </div>

              <span className="memory-count">
                {relevantMemories.length} memories
              </span>
            </div>

            <div className="retrieved-memory-list">
              {relevantMemories.map((memory, index) => (
                <div
                  className="retrieved-memory-card"
                  key={
                    memory.memory_id ||
                    memory.id ||
                    `${memory.fact}-${index}`
                  }
                >
                  <div className="retrieved-number">
                    {index + 1}
                  </div>

                  <div className="retrieved-content">
                    <strong>
                      {memory.fact ||
                        memory.value ||
                        "Retrieved memory"}
                    </strong>

                    <div className="retrieved-meta">
                      {memory.type && (
                        <span>{memory.type}</span>
                      )}

                      {memory.similarity_score !== undefined && (
                        <span>
                          Similarity:{" "}
                          {Math.round(
                            memory.similarity_score * 100
                          )}
                          %
                        </span>
                      )}

                      {memory.confidence !== undefined && (
                        <span>
                          Confidence:{" "}
                          {Math.round(memory.confidence * 100)}%
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {!answer && !loading && (
          <div className="ask-ai-empty">
            <div>🎧</div>
            <h2>Start a conversation</h2>
            <p>
              Try asking:
            </p>

            <div className="example-questions">
              <button
                onClick={() =>
                  setQuestion("Which artists do I listen to most?")
                }
              >
                Which artists do I listen to most?
              </button>

              <button
                onClick={() =>
                  setQuestion(
                    "What kind of music do I usually listen to?"
                  )
                }
              >
                What kind of music do I usually listen to?
              </button>

              <button
                onClick={() =>
                  setQuestion(
                    "What music do I listen to while working out?"
                  )
                }
              >
                What music do I listen to while working out?
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

export default AskAI;