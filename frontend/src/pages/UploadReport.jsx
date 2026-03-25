import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { uploadReport } from '../services/api';
import 'bootstrap/dist/css/bootstrap.min.css';

const UploadReport = () => {
  const [title, setTitle] = useState('');
  const [authorName, setAuthorName] = useState('');
  const [weekNumber, setWeekNumber] = useState('');
  const [content, setContent] = useState('');
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  
  // 添加檢查登入狀態的效果
  useEffect(() => {
    const checkLogin = async () => {
      try {
        // 嘗試獲取週報列表，如果失敗就表示未登入
        const response = await fetch('http://163.18.26.141:8000/reports/', {
          credentials: 'include'
        });
        
        if (!response.ok) {
          navigate('/login');
        }
      } catch (err) {
        navigate('/login');
      }
    };
    
    checkLogin();
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!file) {
      setError('請選擇檔案');
      return;
    }

    // 檢查檔案類型
    const allowedTypes = ['.doc', '.docx', '.pptx', '.pdf'];
    const fileExtension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    
    if (!allowedTypes.includes(fileExtension)) {
      setError(`不支援的檔案類型。允許的類型: ${allowedTypes.join(', ')}`);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('author_name', authorName);
      formData.append('week_number', weekNumber);
      formData.append('content', content || '');
      formData.append('file', file);

      await uploadReport(formData);
      navigate('/dashboard');
    } catch (err) {
      setError('上傳失敗: ' + (err.message || '未知錯誤'));
      setLoading(false);
    }
  };

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>上傳週報</h2>
        <button onClick={() => navigate('/dashboard')} className="btn btn-secondary">
          返回列表
        </button>
      </div>
      
      {error && <div className="alert alert-danger">{error}</div>}
      
      <div className="card">
        <div className="card-body">
          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label htmlFor="title" className="form-label">標題</label>
              <input
                type="text"
                className="form-control"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>
            
            <div className="mb-3">
              <label htmlFor="authorName" className="form-label">作者姓名</label>
              <input
                type="text"
                className="form-control"
                id="authorName"
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                required
              />
            </div>
            
            <div className="mb-3">
              <label htmlFor="weekNumber" className="form-label">週次</label>
              <input
                type="number"
                className="form-control"
                id="weekNumber"
                value={weekNumber}
                onChange={(e) => setWeekNumber(e.target.value)}
                min="1"
                required
              />
            </div>
            
            <div className="mb-3">
              <label htmlFor="content" className="form-label">內容摘要 (選填)</label>
              <textarea
                className="form-control"
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows="4"
              />
            </div>
            
            <div className="mb-3">
              <label htmlFor="file" className="form-label">週報檔案 (doc, docx, pptx, pdf)</label>
              <input
                type="file"
                className="form-control"
                id="file"
                onChange={(e) => setFile(e.target.files[0])}
                required
              />
              <div className="form-text">允許的檔案類型: .doc, .docx, .pptx, .pdf</div>
            </div>
            
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? '上傳中...' : '上傳週報'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default UploadReport;
