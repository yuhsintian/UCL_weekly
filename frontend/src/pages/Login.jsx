import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { login, checkStudentExists } from '../services/api';
import 'bootstrap/dist/css/bootstrap.min.css';

const Login = () => {
  const [studentId, setStudentId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  
  useEffect(() => {
    // 檢查是否已經登入
    const checkLogin = async () => {
      try {
        // 嘗試獲取週報列表，如果成功就表示已經登入
        const response = await fetch('http://163.18.26.141:8000/reports/', {
          credentials: 'include'
        });
        
        if (response.ok) {
          navigate('/dashboard');
        }
      } catch (err) {
        // 忽略錯誤，表示未登入
      }
    };
    
    checkLogin();
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      // 先檢查學號是否存在
      const studentExists = await checkStudentExists(studentId);
      
      if (!studentExists) {
        setError('學號不存在，請確認您的學號或聯繫管理員');
        setLoading(false);
        return;
      }
      
      // 學號存在，繼續進行密碼驗證
      await login(password, studentId);
      navigate('/dashboard');
    } catch (err) {
      setError('認證失敗');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-md-6">
          <div className="card">
            <div className="card-header">
              <h3>UCL 週報上傳系統</h3>
            </div>
            <div className="card-body">
              {error && <div className="alert alert-danger">{error}</div>}
              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label htmlFor="studentId" className="form-label">學號</label>
                  <input
                    type="text"
                    className="form-control"
                    id="studentId"
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                    required
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor="password" className="form-label">認證碼</label>
                  <input
                    type="password"
                    className="form-control"
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  disabled={loading}
                >
                  {loading ? '登入中...' : '登入'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
