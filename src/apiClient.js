// src/apiClient.js - EXACTLY like your other project
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export async function fetchPwnedRange(prefix) {
  const url = `${API_BASE_URL}/api/pwned/${prefix}`;
  
  const response = await fetch(url, {
    method: "GET",
    headers: {
      'User-Agent': 'Password-Checker-App'
    }
  });

  if (!response.ok) {
    throw new Error("Failed to fetch breach data");
  }

  return response.text();
}