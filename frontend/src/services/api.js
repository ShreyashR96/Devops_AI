export const sendChatMessage = async (prompt) => {
  const apiUrl = import.meta.env?.VITE_API_URL ?? 'http://localhost:3001';
  
  const response = await fetch(`${apiUrl}/api/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ prompt })
  });

  if (!response?.ok) {
    throw new Error(`API Error: ${response?.status}`);
  }

  return response.json();
};