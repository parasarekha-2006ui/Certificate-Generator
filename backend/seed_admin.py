import os
import sys
import argparse
import getpass
from werkzeug.security import generate_password_hash
from config import Config
from database import execute_db, query_db, init_db

def seed_admin(name=None, email=None, password=None, run_init_db=True):
    print("=" * 60)
    print("  ONLINE CERTIFICATE GENERATOR - ADMIN SETUP & SEED")
    print("=" * 60)

    if run_init_db:
        print("\n[1/3] Ensuring database schema and tables exist...")
        try:
            init_db()
            print("  [OK] Database schema verified and seeded.")
        except Exception as e:
            print(f"  [NOTE] Database initialization note/error: {e}")

    print("\n[2/3] Admin Account Details:")
    if not name:
        name = input("Enter Admin Full Name [Default: Administrator]: ").strip()
        if not name:
            name = "Administrator"

    if not email:
        email = input("Enter Admin Email [Default: admin@college.edu]: ").strip()
        if not email:
            email = "admin@college.edu"
    email = email.lower()

    if not password:
        while True:
            password = getpass.getpass("Enter Admin Password (hidden): ").strip()
            if not password:
                print("Password cannot be empty. Please enter a valid password.")
                continue
            confirm = getpass.getpass("Confirm Admin Password: ").strip()
            if password != confirm:
                print("Passwords do not match. Please try again.")
                continue
            break

    print("\n[3/3] Saving admin account to database...")
    password_hash = generate_password_hash(password)

    existing = query_db("SELECT id, email FROM admins WHERE email = %s", (email,), one=True)
    if existing:
        execute_db("""
            UPDATE admins 
            SET name = %s, password_hash = %s
            WHERE email = %s
        """, (name, password_hash, email))
        print(f"\n  [OK] Admin account '{email}' was already registered and has been UPDATED with the new password.")
    else:
        execute_db("""
            INSERT INTO admins (name, email, password_hash)
            VALUES (%s, %s, %s)
        """, (name, email, password_hash))
        print(f"\n  [OK] Admin account '{email}' created successfully.")

    print("\nSetup complete! You can now log in with:")
    print(f"  Email:    {email}")
    print(f"  Password: (as specified)")
    print("=" * 60)

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description="Seed initial admin account for Online Certificate Generator.")
    parser.add_argument('--name', help="Admin full name")
    parser.add_argument('--email', help="Admin email address")
    parser.add_argument('--password', help="Admin password")
    parser.add_argument('--no-init', action='store_true', help="Skip running schema.sql init")
    args = parser.parse_args()

    try:
        seed_admin(
            name=args.name,
            email=args.email,
            password=args.password,
            run_init_db=not args.no_init
        )
    except Exception as err:
        print(f"\n[ERROR] Failed to seed admin: {err}")
        sys.exit(1)
