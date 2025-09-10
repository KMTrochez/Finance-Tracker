import axios from 'axios';

const API_URL = 'http://localhost:8080/api/auth';

export const register = async (username, password) => {
  return axios.post(`${API_URL}/register`, { username, password });
};

export const login = async (username, password) => {
  const response = await axios.post(`${API_URL}/login`, { username, password });
  if (response.data.token) {
    localStorage.setItem('token', response.data.token);
  }
  return response;
};

export const logout = async () => {
  const token = localStorage.getItem('token');
  await axios.post(`${API_URL}/logout`, {}, {
    headers: { Authorization: `Bearer ${token}` }
  });
  localStorage.removeItem('token');
};

export const getProfile = async () => {
  const token = localStorage.getItem('token');
  return axios.get('http://localhost:8080/api/profile', {
    headers: { Authorization: `Bearer ${token}` }
  });
};