const API_URL = 'http://163.18.26.141:8000';

// 格式化時間為台灣時間 (UTC+8) 的輔助函數
export const formatToTaiwanTime = (utcTimeString) => {
  if (!utcTimeString) return '';
  
  // 解析時間字符串
  const date = new Date(utcTimeString);
  
  // 檢查日期是否有效
  if (isNaN(date.getTime())) {
    return 'Invalid Date';
  }
  
  // 直接使用 Date 對象的方法獲取本地時間組件
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  
  // 判斷上午/下午
  const ampm = hours >= 12 ? '下午' : '上午';
  const hours12 = hours % 12 || 12;
  const hours12Str = String(hours12).padStart(2, '0');
  
  // 返回格式化後的時間字符串
  return `${year}/${month}/${day} ${ampm}${hours12Str}:${minutes}:${seconds}`;
};



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
  
  const reports = await response.json();
  
  // 轉換每個報告的時間為台灣時間
  return reports.map(report => ({
    ...report,
    // 保留原始 UTC 時間，添加格式化後的台灣時間
    created_at_formatted: formatToTaiwanTime(report.created_at)
  }));
};

// 獲取單個週報
export const getReport = async (id) => {
  const response = await fetch(`${API_URL}/reports/${id}`, {
    credentials: 'include'  // 重要：包含 cookies
  });
  
  if (!response.ok) {
    throw new Error(`API 錯誤: ${response.status}`);
  }
  
  const report = await response.json();
  
  // 轉換時間為台灣時間
  return {
    ...report,
    created_at_formatted: formatToTaiwanTime(report.created_at)
  };
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
  
  const report = await response.json();
  
  // 轉換時間為台灣時間
  return {
    ...report,
    created_at_formatted: formatToTaiwanTime(report.created_at)
  };
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

// 獲取所有學生
export const getStudents = async () => {
  const response = await fetch(`${API_URL}/students/`, {
    credentials: 'include'
  });
  
  if (!response.ok) {
    throw new Error(`API 錯誤: ${response.status}`);
  }
  
  return await response.json();
};

// 獲取單個學生
export const getStudent = async (studentId) => {
  const response = await fetch(`${API_URL}/students/${studentId}`, {
    credentials: 'include'
  });
  
  if (!response.ok) {
    throw new Error(`API 錯誤: ${response.status}`);
  }
  
  return await response.json();
};

// 創建學生資料
export const createStudent = async (studentData) => {
  const formData = new FormData();
  formData.append('student_id', studentData.student_id);
  formData.append('grade', studentData.grade);
  formData.append('name', studentData.name);
  formData.append('email', studentData.email);
  
  const response = await fetch(`${API_URL}/students/`, {
    method: 'POST',
    body: formData,
    credentials: 'include'
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

// 更新學生資料
export const updateStudent = async (studentId, studentData) => {
  const formData = new FormData();
  formData.append('grade', studentData.grade);
  formData.append('name', studentData.name);
  formData.append('email', studentData.email);
  
  const response = await fetch(`${API_URL}/students/${studentId}`, {
    method: 'PUT',
    body: formData,
    credentials: 'include'
  });
  
  if (!response.ok) {
    throw new Error(`API 錯誤: ${response.status}`);
  }
  
  return await response.json();
};

// 刪除學生資料
export const deleteStudent = async (studentId) => {
  const response = await fetch(`${API_URL}/students/${studentId}`, {
    method: 'DELETE',
    credentials: 'include'
  });
  
  if (!response.ok) {
    throw new Error(`API 錯誤: ${response.status}`);
  }
  
  return await response.json();
};
