// API Configuration
// Automatically detects environment and uses appropriate API URL

const isDevelopment = import.meta.env.DEV;
const API_BASE_URL = isDevelopment 
  ? 'http://localhost:5173/api'  // Vite dev server proxy
  : '/api';

export const API_CONFIG = {
  BASE_URL: API_BASE_URL,
  BOOKS: `${API_BASE_URL}/db?resource=books`,
  MEMBERS: `${API_BASE_URL}/db?resource=members`,
  TRANSACTIONS: `${API_BASE_URL}/db?resource=transactions`
};

export default API_CONFIG;
