from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# 使用 MySQL 資料庫
SQLALCHEMY_DATABASE_URL = "mysql+pymysql://ucl_user:Nkustucl520.@localhost/ucl_weekly"

engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()
