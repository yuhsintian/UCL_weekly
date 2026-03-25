import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getReport, deleteReport } from '../services/api';
import 'bootstrap/dist/css/bootstrap.min.css';

const ViewReport = () => {
  const { id } = useParams();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  
  useEffect(() => {
    const fetchReport = async () => {
      try {
        const data = await getReport(id);
        setReport(data);
        setLoading(false);
      } catch (err) {
        if (err.message.includes('401')) {
          navigate('/login');
        } else {
          setError('無法載入週報');
          setLoading(false);
        }
      }
    };

    fetchReport();
  }, [id, navigate]);

  const handleDelete = async () => {
    if (window.confirm('確定要刪除此週報嗎？')) {
      try {
        await deleteReport(id);
        navigate('/dashboard');
      } catch (err) {
        setError('刪除失敗');
      }
    }
  };

  if (loading) {
    return (
      <div className="container mt-5">
        <div className="text-center">載入中...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mt-5">
        <div className="alert alert-danger">{error}</div>
        <button onClick={() => navigate('/dashboard')} className="btn btn-secondary">
          返回列表
        </button>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="container mt-5">
        <div className="alert alert-warning">找不到週報</div>
        <button onClick={() => navigate('/dashboard')} className="btn btn-secondary">
          返回列表
        </button>
      </div>
    );
  }

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2>{report.title}</h2>
        <div>
          <button onClick={() => navigate('/dashboard')} className="btn btn-secondary me-2">
            返回列表
          </button>
          <button onClick={handleDelete} className="btn btn-danger">
            刪除週報
          </button>
        </div>
      </div>

      <div className="card mb-4">
        <div className="card-body">
          <div className="row mb-3">
            <div className="col-md-6">
              <strong>作者:</strong> {report.author_name}
            </div>
            <div className="col-md-6">
              <strong>週次:</strong> 第 {report.week_number} 週
            </div>
          </div>
          
          <div className="row mb-3">
            <div className="col-12">
              <strong>上傳時間:</strong> {new Date(report.created_at).toLocaleString()}
            </div>
          </div>

          {report.content && (
            <div className="mb-4">
              <strong>內容摘要:</strong>
              <p className="mt-2">{report.content}</p>
            </div>
          )}

          {report.file_path && (
            <div>
              <strong>檔案:</strong>
              <div className="mt-2">
                <a
                  href={`http://163.18.26.141:8000/uploads/${report.file_path}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-primary"
                >
                  下載檔案
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ViewReport;
