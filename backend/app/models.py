from sqlalchemy import Column, Integer, String, Text, DateTime
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime, timezone
from .database import Base

class Report(Base):
    __tablename__ = "reports"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False) 
    author_name = Column(String(100), nullable=False)
    week_number = Column(Integer, nullable=False)
    content = Column(Text, nullable=True)  
    file_path = Column(String(255), nullable=True) 
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    is_delete = Column(Integer, default=0)

class Student(Base):
    __tablename__ = "students"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(String(20), unique=True, index=True)  # 學號
    grade = Column(String(10))  # 年級
    name = Column(String(100))  # 姓名
    email = Column(String(100))  # 信箱
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    is_delete = Column(Integer, default=0)
