import os
from .extensions import db

JWT_ACCESS_TOKEN_EXPIRES = 3600  # 1 hour
class Config:
    SQLALCHEMY_DATABASE_URI = "sqlite:///election.db"

    SQLALCHEMY_TRACK_MODIFICATIONS = False
    JWT_SECRET_KEY = "super-secret-key"
    JWT_ACCESS_TOKEN_EXPIRES = 3600  # 1 hour