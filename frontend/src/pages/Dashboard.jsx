import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getReports, logout } from '../services/api';
import 'bootstrap/dist/css/bootstrap.min.css';

const Dashboard = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  
  useEffect(() => {
    const fetchReports = async () => {
      try {
        const data = await getReports();
        setReports(data);
        setLoading(false);
      } catch (err) {
        if (err.message.includes('401')) {
          navigate('/login');
        } else {
          setError('無法載入週報列表');
          setLoading(false);
        }
      }
    };

    fetchReports();
  }, [navigate]);
  
  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (err) {
      setError('登出失敗');
    }
  };

  if (loading) {
    return (
      <div className="container mt-5">
        <div className="text-center">載入中...</div>
      </div>
    );
  }

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>UCL 週報列表</h2>
        <div>
          <Link to="/upload" className="btn btn-primary me-2">
            上傳新週報
          </Link>
          <button onClick={handleLogout} className="btn btn-secondary">
            登出
          </button>
        </div>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {reports.length === 0 ? (
        <div className="alert alert-info">目前沒有週報</div>
      ) : (
        <div className="table-responsive">
          <table className="table table-striped">
            <thead>
              <tr>
                <th>標題</th>
                <th>作者</th>
                <th>週次</th>
                <th>上傳時間</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {reports.map((report) => (
                <tr key={report.id}>
                  <td>{report.title}</td>
                  <td>{report.author_name}</td>
                  <td>第 {report.week_number} 週</td>
                  <td>{report.created_at_formatted}</td>
                  <td>
                    <Link to={`/report/${report.id}`} className="btn btn-sm btn-info me-2">
                      查看
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
