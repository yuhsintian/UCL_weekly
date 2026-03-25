const API_URL = 'http://163.18.26.141:8000';

// 登入
export const login = async (password) => {
  const formData = new FormData();
  formData.append('password', password);
  
  const response = await fetch(`${API_URL}/login`, {
    method: 'POST',
    body: formData,
    credentials: 'include'  // 重要：包含 cookies
  });
  
  if (!response.ok) {
    throw new Error(`API 錯誤: ${response.status}`);
  }
  
  return await response.json();
};

// 登出
export const logout = async () => {
  const response = await fetch(`${API_URL}/logout`, {
    method: 'POST',
    credentials: 'include'  // 重要：包含 cookies
  });
  
  if (!response.ok) {
    throw new Error(`API 錯誤: ${response.status}`);
  }
  
  return await response.json();
};

// 獲取週報列表
export const getReports = async () => {
  const response = await fetch(`${API_URL}/reports/`, {
    credentials: 'include'  // 重要：包含 cookies
  });
  
  if (!response.ok) {
    throw new Error(`API 錯誤: ${response.status}`);
  }
  
  return await response.json();
};

// 獲取單個週報
export const getReport = async (id) => {
  const response = await fetch(`${API_URL}/reports/${id}`, {
    credentials: 'include'  // 重要：包含 cookies
  });
  
  if (!response.ok) {
    throw new Error(`API 錯誤: ${response.status}`);
  }
  
  return await response.json();
};

// 上傳週報
export const uploadReport = async (formData) => {
  const response = await fetch(`${API_URL}/reports/`, {
    method: 'POST',
    body: formData,
    credentials: 'include'  // 重要：包含 cookies
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    try {
      const errorData = JSON.parse(errorText);
      throw new Error(errorData.detail || `API 錯誤: ${response.status}`);
    } catch (e) {
      throw new Error(`API 錯誤: ${response.status}`);
    }
  }
  
  return await response.json();
};

// 刪除週報
export const deleteReport = async (id) => {
  const response = await fetch(`${API_URL}/reports/${id}`, {
    method: 'DELETE',
    credentials: 'include'  // 重要：包含 cookies
  });
  
  if (!response.ok) {
    throw new Error(`API 錯誤: ${response.status}`);
  }
  
  return await response.json();
};
