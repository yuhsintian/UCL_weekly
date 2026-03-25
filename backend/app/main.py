from fastapi import FastAPI, Depends, HTTPException, status, File, UploadFile, Form, Cookie
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from typing import List, Optional
import os
from datetime import datetime, timedelta, timezone
import secrets
import time

from . import models
from .database import engine, SessionLocal
from app.database import engine
from app.models import Base

# 建立資料表
Base.metadata.create_all(bind=engine)

app = FastAPI(title="UCL 週報上傳系統")

# 設定 CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://163.18.26.141:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 確保上傳目錄存在
os.makedirs("app/uploads", exist_ok=True)

# 設定靜態檔案目錄，用於訪問上傳的檔案
app.mount("/uploads", StaticFiles(directory="app/uploads"), name="uploads")

# 簡易的 session 存儲
active_sessions = {}

# 資料庫依賴
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# 驗證 session token
def verify_session(session_token: str = Cookie(None)):
    if not session_token or session_token not in active_sessions:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="請先登入"
        )
    # 檢查 session 是否過期（例如 24 小時）
    session_time = active_sessions[session_token]
    if time.time() - session_time > 86400:  # 24 小時
        del active_sessions[session_token]
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="登入已過期，請重新登入"
        )
    return True

# API 路由
@app.get("/")
def read_root():
    return {"message": "UCL 週報上傳系統 API"}

# 登入 API
@app.post("/login")
def login(password: str = Form(...)):
    if password != "54ucl":
        raise HTTPException(status_code=401, detail="認證失敗")
    
    # 生成 session token
    token = secrets.token_hex(16)
    active_sessions[token] = time.time()
    
    # 返回帶有 session cookie 的回應
    response = JSONResponse(content={"message": "登入成功"})
    response.set_cookie(
        key="session_token", 
        value=token, 
        httponly=True,
        max_age=86400,  # 24 小時
        samesite="lax"
    )
    return response

# 登出 API
@app.post("/logout")
def logout(session_token: str = Cookie(None)):
    if session_token and session_token in active_sessions:
        del active_sessions[session_token]
    
    response = JSONResponse(content={"message": "登出成功"})
    response.delete_cookie(key="session_token")
    return response

# 獲取所有週報
@app.get("/reports/")
def get_reports(
    skip: int = 0, 
    limit: int = 100, 
    db: Session = Depends(get_db),
    authenticated: bool = Depends(verify_session)
):
    reports = db.query(models.Report).order_by(models.Report.created_at.desc()).offset(skip).limit(limit).all()
    
    # 將 SQLAlchemy 模型轉換為字典
    result = []
    for report in reports:
        created_at = report.created_at
        if created_at and not created_at.tzinfo:
            # 如果時間沒有時區信息，添加 UTC 時區
            created_at = created_at.replace(tzinfo=timezone.utc)
            
        result.append({
            "id": report.id,
            "title": report.title,
            "author_name": report.author_name,
            "week_number": report.week_number,
            "content": report.content,
            "file_path": report.file_path,
            "created_at": created_at.isoformat()
        })
    
    return result

# 獲取單個週報
@app.get("/reports/{report_id}")
def get_report(
    report_id: int, 
    db: Session = Depends(get_db),
    authenticated: bool = Depends(verify_session)
):
    report = db.query(models.Report).filter(models.Report.id == report_id).first()
    
    if report is None:
        raise HTTPException(status_code=404, detail="週報不存在")
    
    # 確保時間包含時區信息
    created_at = report.created_at
    if created_at and not created_at.tzinfo:
        created_at = created_at.replace(tzinfo=timezone.utc)
        
    return {
        "id": report.id,
        "title": report.title,
        "author_name": report.author_name,
        "week_number": report.week_number,
        "content": report.content,
        "file_path": report.file_path,
        "created_at": created_at.isoformat()
    }

# 上傳週報
@app.post("/reports/")
async def create_report(
    title: str = Form(...),
    author_name: str = Form(...),
    week_number: int = Form(...),
    content: Optional[str] = Form(None),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    authenticated: bool = Depends(verify_session)
):
    # 檢查檔案類型
    allowed_extensions = [".doc", ".docx", ".pptx", ".pdf"]
    file_ext = os.path.splitext(file.filename)[1].lower()
    
    if file_ext not in allowed_extensions:
        raise HTTPException(
            status_code=400,
            detail=f"不支援的檔案類型。允許的類型: {', '.join(allowed_extensions)}"
        )
    
    # 保存檔案
    timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
    filename = f"{timestamp}_{file.filename}"
    file_path = os.path.join("app/uploads", filename)
    
    with open(file_path, "wb") as buffer:
        content_bytes = await file.read()
        buffer.write(content_bytes)
    
    # 創建週報記錄
    db_report = models.Report(
        title=title,
        author_name=author_name,
        week_number=week_number,
        content=content,
        file_path=filename,
        created_at=datetime.now(timezone.utc)
    )
    
    db.add(db_report)
    db.commit()
    db.refresh(db_report)
    
    # 確保返回的時間包含時區信息
    created_at = db_report.created_at
    if created_at and not created_at.tzinfo:
        created_at = created_at.replace(tzinfo=timezone.utc)
    
    return {
        "id": db_report.id,
        "title": db_report.title,
        "author_name": db_report.author_name,
        "week_number": db_report.week_number,
        "content": db_report.content,
        "file_path": db_report.file_path,
        "created_at": created_at.isoformat()
    }

# 刪除週報
@app.delete("/reports/{report_id}")
def delete_report(
    report_id: int, 
    db: Session = Depends(get_db),
    authenticated: bool = Depends(verify_session)
):
    report = db.query(models.Report).filter(models.Report.id == report_id).first()
    
    if report is None:
        raise HTTPException(status_code=404, detail="週報不存在")
    
    # 刪除檔案
    if report.file_path:
        file_path = os.path.join("app/uploads", report.file_path)
        if os.path.exists(file_path):
            os.remove(file_path)
    
    db.delete(report)
    db.commit()
    
    return {"message": "週報已刪除"}
