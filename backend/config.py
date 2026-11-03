import os
from datetime import timedelta
from dotenv import load_dotenv

# Load .env file from the backend directory
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
load_dotenv(os.path.join(BASE_DIR, '.env'))

class Config:
    # MySQL Database Settings
    DB_HOST = os.getenv('DB_HOST', 'localhost')
    DB_USER = os.getenv('DB_USER', 'root')
    DB_PASSWORD = os.getenv('DB_PASSWORD', '')
    DB_NAME = os.getenv('DB_NAME', 'online_certificate_db')
    DB_PORT = int(os.getenv('DB_PORT', 3306))

    # JWT Settings
    JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY', 'default-jwt-secret-online-cert-gen')
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(seconds=int(os.getenv('JWT_ACCESS_TOKEN_EXPIRES', 86400))) # 24 hours

    # Frontend Settings
    FRONTEND_BASE_URL = os.getenv('FRONTEND_BASE_URL', 'http://localhost:5173')

    # File Folders
    UPLOAD_FOLDER = os.path.join(BASE_DIR, 'uploads')
    GENERATED_FOLDER = os.path.join(BASE_DIR, 'generated_certificates')

    # Security & Upload Limits
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16 MB max request payload
    MAX_IMAGE_SIZE = 5 * 1024 * 1024       # 5 MB max image
    ALLOWED_IMAGE_EXTENSIONS = {'png', 'jpg', 'jpeg'}
    ALLOWED_BULK_EXTENSIONS = {'xlsx', 'csv'}
