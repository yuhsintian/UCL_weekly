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
from app.models import Base, Report, Student

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

def create_session_token():
    token = secrets.token_urlsafe(32)
    active_sessions[token] = time.time()
    return token


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


# 登入端點
@app.post("/login/")
def login(password: str = Form(...), student_id: str = Form(...), db: Session = Depends(get_db)):
    from app.models import Student
    
    # 先檢查學生是否存在
    student = db.query(Student).filter(Student.student_id == student_id).first()
    if not student:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # 然後檢查密碼 (使用固定密碼 54ucl)
    if password != "54ucl":
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # 創建會話
    session_token = secrets.token_urlsafe(32)
    active_sessions[session_token] = time.time()
    
    response = JSONResponse(content={"message": "Login successful"})
    response.set_cookie(key="session_token", value=session_token)
    # 添加學號到 cookie
    response.set_cookie(key="student_id", value=student_id)
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
async def get_reports(db: Session = Depends(get_db), authenticated: bool = Depends(verify_session)):
    # 添加 is_delete = 0 的條件
    reports = db.query(Report).filter(Report.is_delete == 0).all()
    return reports

# 獲取單個週報
@app.get("/reports/{report_id}")
async def get_report(report_id: int, db: Session = Depends(get_db), authenticated: bool = Depends(verify_session)):
    # 添加 is_delete = 0 的條件
    report = db.query(Report).filter(Report.id == report_id, Report.is_delete == 0).first()
    if not report:
        raise HTTPException(status_code=404, detail="週報不存在")
    return report

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
        created_at=datetime.now(timezone.utc),
        is_delete=0
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
        "created_at": created_at.isoformat(),
        "is_delete": db_report.is_delete
    }

# 刪除週報
@app.delete("/reports/{report_id}")
async def delete_report(report_id: int, db: Session = Depends(get_db), authenticated: bool = Depends(verify_session)):
    # 修改為軟刪除
    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="週報不存在")
    
    # 將 is_delete 設為 1，而不是實際刪除
    report.is_delete = 1
    db.commit()
    
    return {"message": "週報已刪除"}

# 獲取所有學生
@app.get("/students/")
async def get_students(db: Session = Depends(get_db), authenticated: bool = Depends(verify_session)):
    # 添加 is_delete = 0 的條件
    students = db.query(Student).filter(Student.is_delete == 0).all()
    return students

# 檢查學生是否存在
@app.get("/students/{student_id}")
async def get_student(student_id: str, db: Session = Depends(get_db)):
    # 添加 is_delete = 0 的條件
    student = db.query(Student).filter(Student.student_id == student_id, Student.is_delete == 0).first()
    if not student:
        raise HTTPException(status_code=404, detail="學生不存在")
    return student

# 創建學生資料
@app.post("/students/")
def create_student(
    student_id: str = Form(...),
    grade: str = Form(...),
    name: str = Form(...),
    email: str = Form(...),
    db: Session = Depends(get_db),
    authenticated: bool = Depends(verify_session)
):
    # 檢查學號是否已存在
    db_student = db.query(models.Student).filter(models.Student.student_id == student_id).first()
    if db_student:
        raise HTTPException(status_code=400, detail="學號已存在")
    
    # 創建學生記錄
    db_student = models.Student(
        student_id=student_id,
        grade=grade,
        name=name,
        email=email,
        created_at=datetime.now(timezone.utc),
        is_delete=0
    )
    
    db.add(db_student)
    db.commit()
    db.refresh(db_student)
    
    created_at = db_student.created_at
    if created_at and not created_at.tzinfo:
        created_at = created_at.replace(tzinfo=timezone.utc)
    
    return {
        "id": db_student.id,
        "student_id": db_student.student_id,
        "grade": db_student.grade,
        "name": db_student.name,
        "email": db_student.email,
        "created_at": created_at.isoformat(),
        "is_delete": db_student.is_delete
    }

# 更新學生資料
@app.put("/students/{student_id}")
def update_student(
    student_id: str,
    grade: str = Form(...),
    name: str = Form(...),
    email: str = Form(...),
    db: Session = Depends(get_db),
    authenticated: bool = Depends(verify_session)
):
    db_student = db.query(models.Student).filter(models.Student.student_id == student_id).first()
    if db_student is None:
        raise HTTPException(status_code=404, detail="學生資料不存在")
    
    db_student.grade = grade
    db_student.name = name
    db_student.email = email
    
    db.commit()
    db.refresh(db_student)
    
    created_at = db_student.created_at
    if created_at and not created_at.tzinfo:
        created_at = created_at.replace(tzinfo=timezone.utc)
    
    return {
        "id": db_student.id,
        "student_id": db_student.student_id,
        "grade": db_student.grade,
        "name": db_student.name,
        "email": db_student.email,
        "created_at": created_at.isoformat()
    }

# 刪除學生資料
@app.delete("/students/{student_id}")
async def delete_student(student_id: str, db: Session = Depends(get_db), authenticated: bool = Depends(verify_session)):
    # 修改為軟刪除
    student = db.query(Student).filter(Student.student_id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="學生不存在")
    
    # 將 is_delete 設為 1，而不是實際刪除
    student.is_delete = 1
    db.commit()
    
    return {"message": "學生已刪除"}