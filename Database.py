import sqlite3
from datetime import datetime


DB_NAME = "database.db"

def init_db():
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS reports (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            issue_type TEXT,
            severity TEXT,
            impact_score INTEGER,
            department TEXT,
            description TEXT,
            recommended_action TEXT,
            timestamp TEXT
        )
    """)
    conn.commit()
    conn.close()

def save_report(data: dict):
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    cursor.execute("""
        INSERT INTO reports (issue_type, severity, impact_score, department, description, recommended_action, timestamp)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    """, (
        data["issue_type"], data["severity"], int(data["impact_score"]),
        data["department"], data["description"], data["recommended_action"],
        timestamp
    ))
    conn.commit()
    conn.close()

def get_all_reports():
    conn = sqlite3.connect(DB_NAME)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM reports ORDER BY id DESC")
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]