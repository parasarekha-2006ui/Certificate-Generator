import os
import pymysql
import pymysql.cursors
from config import Config

def get_db_connection(database=None):
    """
    Establish and return a MySQL connection with PyMySQL.
    Returns dictionaries for row results.
    """
    db_name = database if database is not None else Config.DB_NAME
    return pymysql.connect(
        host=Config.DB_HOST,
        user=Config.DB_USER,
        password=Config.DB_PASSWORD,
        database=db_name,
        port=Config.DB_PORT,
        cursorclass=pymysql.cursors.DictCursor,
        autocommit=True,
        charset='utf8mb4'
    )

def query_db(query, args=(), one=False):
    """
    Execute a parameterized SELECT query and return results as dictionary/list of dictionaries.
    """
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute(query, args)
            rv = cursor.fetchone() if one else cursor.fetchall()
            return rv
    finally:
        conn.close()

def execute_db(query, args=(), return_id=False):
    """
    Execute a parameterized INSERT, UPDATE, or DELETE statement.
    Returns lastrowid if return_id=True, else affected row count.
    """
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute(query, args)
            res = cursor.lastrowid if return_id else cursor.rowcount
            return res
    finally:
        conn.close()

def init_db(schema_path=None):
    """
    Initialize database using schema.sql
    """
    if not schema_path:
        base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        schema_path = os.path.join(base_dir, 'database', 'schema.sql')

    if not os.path.exists(schema_path):
        raise FileNotFoundError(f"Schema file not found at: {schema_path}")

    # First connect without specifying database to allow database creation
    conn = pymysql.connect(
        host=Config.DB_HOST,
        user=Config.DB_USER,
        password=Config.DB_PASSWORD,
        port=Config.DB_PORT,
        autocommit=True,
        charset='utf8mb4'
    )
    try:
        with open(schema_path, 'r', encoding='utf-8') as f:
            sql_content = f.read()

        statements = [s.strip() for s in sql_content.split(';') if s.strip()]
        with conn.cursor() as cursor:
            for statement in statements:
                if statement:
                    cursor.execute(statement)
        print("Database schema initialized and seeded successfully.")
    finally:
        conn.close()
