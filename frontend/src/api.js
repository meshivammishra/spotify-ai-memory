// ============================================================
// API CONFIGURATION
// ============================================================

// Local:
// VITE_API_URL=http://127.0.0.1:8000
//
// Production:
// VITE_API_URL=https://your-backend.onrender.com

const API_URL = import.meta.env.DEV
  ? "http://127.0.0.1:8000"
  : "";


// ============================================================
// AUTH STORAGE
// ============================================================

const USER_STORAGE_KEY = "spotify_ai_current_user";
const TOKEN_STORAGE_KEY = "spotify_ai_access_token";


// ============================================================
// COMMON RESPONSE HANDLER
// ============================================================

async function handleResponse(response) {

  let data = {};

  try {
    data = await response.json();
  } catch (error) {
    data = {};
  }

  if (!response.ok) {

    throw new Error(
      data.detail ||
      data.message ||
      `Request failed with status ${response.status}`
    );
  }

  return data;
}


// ============================================================
// AUTH HEADERS
// ============================================================

function getAuthHeaders() {

  const token =
    localStorage.getItem(TOKEN_STORAGE_KEY);

  const headers = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
}


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

  localStorage.removeItem(
    TOKEN_STORAGE_KEY
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
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password: password,
      }),
    }
  );

  return await handleResponse(response);
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
        email: email.trim().toLowerCase(),
        password: password,
      }),
    }
  );

  const data =
    await handleResponse(response);


  // ----------------------------------------------------------
  // SAVE USER
  // ----------------------------------------------------------

  if (data.user) {

    localStorage.setItem(
      USER_STORAGE_KEY,
      JSON.stringify(data.user)
    );
  }


  // ----------------------------------------------------------
  // SAVE JWT
  // ----------------------------------------------------------

  if (data.access_token) {

    localStorage.setItem(
      TOKEN_STORAGE_KEY,
      data.access_token
    );
  }


  return data;
}

// ============================================================
// GET MEMORIES
// ============================================================

export async function getMemories(
  userId
) {

  const response = await fetch(
    `${API_URL}/memory/${userId}`,
    {
      method: "GET",
      headers: getAuthHeaders(),
    }
  );

  return await handleResponse(response);
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

      headers: getAuthHeaders(),

      body: JSON.stringify({
        text: text.trim(),
      }),
    }
  );

  return await handleResponse(response);
}


// ============================================================
// GENERATE MEMORY
// ============================================================

export async function generateMemory(
  userId
) {

  const response = await fetch(
    `${API_URL}/memory/${userId}/generate`,
    {
      method: "POST",

      headers: getAuthHeaders(),
    }
  );

  return await handleResponse(response);
}


// ============================================================
// SEARCH MEMORY
// ============================================================

export async function searchMemory(
  userId,
  query,
  topK = 3
) {

  const response = await fetch(
    `${API_URL}/memory/${userId}/search`,
    {
      method: "POST",

      headers: getAuthHeaders(),

      body: JSON.stringify({
        query: query.trim(),
        top_k: topK,
      }),
    }
  );

  return await handleResponse(response);
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

      headers: getAuthHeaders(),

      body: JSON.stringify({
        question: question.trim(),
      }),
    }
  );

  return await handleResponse(response);
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

      headers: getAuthHeaders(),

      body: JSON.stringify({
        fact: data.fact,
        value: data.value,
      }),
    }
  );

  return await handleResponse(response);
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

      headers: getAuthHeaders(),
    }
  );

  return await handleResponse(response);
}