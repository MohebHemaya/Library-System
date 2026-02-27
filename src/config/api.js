// API Configuration
// Same URLs work for both development and production

const API_BASE_URL = '/api';

export const API_CONFIG = {
  BASE_URL: API_BASE_URL,
  
  // Helper methods for building API URLs
  getResourceUrl: (resource) => `${API_BASE_URL}/db?resource=${resource}`,
  getResourceItemUrl: (resource, id) => `${API_BASE_URL}/db?resource=${resource}&id=${id}`
};

export default API_CONFIG;
