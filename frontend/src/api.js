const API_URL = "http://127.0.0.1:8000";


// ============================================================
// AUTH STORAGE
// ============================================================

const USER_STORAGE_KEY = "spotify_ai_current_user";


// ============================================================
// GET CURRENT USER
// ============================================================

export function getCurrentUser() {

  try {

    const storedUser =
      localStorage.getItem(USER_STORAGE_KEY);

    if (!storedUser) {
      return null;
    }

    return JSON.parse(storedUser);

  } catch (error) {

    console.error(
      "Failed to read current user:",
      error
    );

    localStorage.removeItem(
      USER_STORAGE_KEY
    );

    return null;
  }
}


// ============================================================
// LOGOUT
// ============================================================

export function logout() {

  localStorage.removeItem(
    USER_STORAGE_KEY
  );

}


// ============================================================
// REGISTER USER
// ============================================================

export async function registerUser(
  name,
  email,
  password
) {

  const response = await fetch(
    `${API_URL}/auth/register`,
    {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify({
        name: name,
        email: email,
        password: password,
      }),
    }
  );

  const data = await response.json();

  if (!response.ok) {

    throw new Error(
      data.detail ||
      "Registration failed"
    );

  }

  return data;
}


// ============================================================
// LOGIN USER
// ============================================================

export async function loginUser(
  email,
  password
) {

  const response = await fetch(
    `${API_URL}/auth/login`,
    {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify({
        email: email,
        password: password,
      }),
    }
  );

  const data = await response.json();

  if (!response.ok) {

    throw new Error(
      data.detail ||
      "Login failed"
    );

  }


  // Save logged-in user
  if (data.user) {

    localStorage.setItem(
      USER_STORAGE_KEY,
      JSON.stringify(data.user)
    );

  }


  return data;
}


// ============================================================
// GET ALL USERS
// ============================================================

export async function getUsers() {

  const response = await fetch(
    `${API_URL}/users`
  );

  const data = await response.json();

  if (!response.ok) {

    throw new Error(
      data.detail ||
      "Failed to load users"
    );

  }

  return data;
}


// ============================================================
// CREATE USER
// ============================================================

export async function createUser(name) {

  const response = await fetch(
    `${API_URL}/users`,
    {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify({
        name: name,
      }),
    }
  );

  const data = await response.json();

  if (!response.ok) {

    throw new Error(
      data.detail ||
      "Failed to create user"
    );

  }

  return data;
}


// ============================================================
// GET MEMORIES
// ============================================================

export async function getMemories(userId) {

  const response = await fetch(
    `${API_URL}/memory/${userId}`
  );

  const data = await response.json();

  if (!response.ok) {

    throw new Error(
      data.detail ||
      "Failed to load memories"
    );

  }

  return data;
}


// ============================================================
// SAVE MEMORY
// ============================================================

export async function saveMemory(
  userId,
  text
) {

  const response = await fetch(
    `${API_URL}/memory/${userId}/save`,
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

    throw new Error(
      data.detail ||
      "Failed to save memory"
    );

  }

  return data;
}


// ============================================================
// SEARCH MEMORY
// ============================================================

export async function searchMemory(
  userId,
  query
) {

  const response = await fetch(
    `${API_URL}/memory/${userId}/search`,
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

    throw new Error(
      data.detail ||
      "Failed to search memory"
    );

  }

  return data;
}


// ============================================================
// ASK MEMORY
// ============================================================

export async function askMemory(
  userId,
  question
) {

  const response = await fetch(
    `${API_URL}/memory/${userId}/ask`,
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

    throw new Error(
      data.detail ||
      "Failed to ask memory"
    );

  }

  return data;
}


// ============================================================
// UPDATE MEMORY
// ============================================================

export async function updateMemory(
  userId,
  memoryId,
  data
) {

  const response = await fetch(
    `${API_URL}/memory/${userId}/${memoryId}`,
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

    throw new Error(
      result.detail ||
      "Failed to update memory"
    );

  }

  return result;
}


// ============================================================
// DELETE MEMORY
// ============================================================

export async function deleteMemory(
  userId,
  memoryId
) {

  const response = await fetch(
    `${API_URL}/memory/${userId}/${memoryId}`,
    {
      method: "DELETE",
    }
  );

  const result = await response.json();

  if (!response.ok) {

    throw new Error(
      result.detail ||
      "Failed to delete memory"
    );

  }

  return result;
}