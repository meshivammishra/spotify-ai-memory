const API_URL = "http://127.0.0.1:8000";
const USER_ID = "user_001";

export async function getMemories() {
  const response = await fetch(
    `${API_URL}/memory/${USER_ID}`
  );

  if (!response.ok) {
    throw new Error("Failed to load memories");
  }

  return response.json();
}

export async function saveMemory(text) {
  const response = await fetch(
    `${API_URL}/memory/${USER_ID}/save`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text: text,
      }),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.detail || "Failed to save memory");
  }

  return data;
}

export async function searchMemory(query) {
  const response = await fetch(
    `${API_URL}/memory/${USER_ID}/search`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: query,
      }),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.detail || "Failed to search memory");
  }

  return data;
}

export async function askMemory(question) {
  const response = await fetch(
    `${API_URL}/memory/${USER_ID}/ask`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        question: question,
      }),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.detail || "Failed to ask memory");
  }

  return data;
}
export async function updateMemory(memoryId, data) {
  const response = await fetch(
    `${API_URL}/memory/${USER_ID}/${memoryId}`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    }
  );

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.detail || "Failed to update memory");
  }

  return result;
}


export async function deleteMemory(memoryId) {
  const response = await fetch(
    `${API_URL}/memory/${USER_ID}/${memoryId}`,
    {
      method: "DELETE",
    }
  );

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.detail || "Failed to delete memory");
  }

  return result;
}