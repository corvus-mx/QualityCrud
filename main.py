# main.py
from fastapi import FastAPI, HTTPException, Request, Form
from fastapi.responses import HTMLResponse, StreamingResponse
from fastapi.templating import Jinja2Templates
from contextlib import asynccontextmanager
from typing import Optional
import sqlite3
import uuid
import io
import csv
import json
from datetime import datetime, timedelta
from enum import Enum
from pydantic import BaseModel, Field, validator

# ==================== CONFIGURATION ====================
class Config:
    DATABASE_PATH = 'qms.db'
    PAGE_SIZE = 20

# ==================== ENUMS ====================
class EntityType(str, Enum):
    EMPLOYEES = "employees"
    LEVELS = "levels"
    AREAS = "areas"
    PARTNUMBERS = "partnumbers"
    CALIBRATIONS = "calibrations"

# ==================== DATABASE ====================
class Database:
    def __init__(self, db_path: str):
        self.db_path = db_path
        self.init_db()
    
    def get_connection(self):
        conn = sqlite3.connect(self.db_path, check_same_thread=False)
        conn.row_factory = sqlite3.Row
        return conn
    
    def init_db(self):
        conn = self.get_connection()
        c = conn.cursor()
        
        for entity in EntityType:
            c.execute(f'''
                CREATE TABLE IF NOT EXISTS {entity.value} (
                    id TEXT PRIMARY KEY,
                    name TEXT NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    is_active BOOLEAN DEFAULT 1
                )
            ''')
            c.execute(f'CREATE INDEX IF NOT EXISTS idx_{entity.value}_name ON {entity.value}(name)')
            c.execute(f'CREATE INDEX IF NOT EXISTS idx_{entity.value}_created ON {entity.value}(created_at)')
        
        c.execute('''
            CREATE TABLE IF NOT EXISTS audit_log (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                entity_type TEXT NOT NULL,
                entity_id TEXT NOT NULL,
                action TEXT NOT NULL,
                changes TEXT,
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        conn.commit()
        conn.close()

db = Database(Config.DATABASE_PATH)

# ==================== REPOSITORY ====================
class Repository:
    def __init__(self, entity_type: EntityType):
        self.entity_type = entity_type
        self.table = entity_type.value
    
    def get_all(self, days: Optional[int] = None, page: int = 1, search: Optional[str] = None):
        conn = db.get_connection()
        c = conn.cursor()
        
        query = f"SELECT * FROM {self.table} WHERE is_active = 1"
        params = []
        
        if days:
            date_filter = datetime.now() - timedelta(days=days)
            query += " AND created_at >= ?"
            params.append(date_filter)
        
        if search:
            query += " AND name LIKE ?"
            params.append(f"%{search}%")
        
        count_query = query.replace("SELECT *", "SELECT COUNT(*)")
        c.execute(count_query, params)
        total = c.fetchone()[0]
        
        query += " ORDER BY created_at DESC LIMIT ? OFFSET ?"
        params.extend([Config.PAGE_SIZE, (page - 1) * Config.PAGE_SIZE])
        
        c.execute(query, params)
        items = [dict(row) for row in c.fetchall()]
        conn.close()
        
        return items, total
    
    def get_by_id(self, item_id: str):
        conn = db.get_connection()
        c = conn.cursor()
        c.execute(f"SELECT * FROM {self.table} WHERE id = ? AND is_active = 1", (item_id,))
        row = c.fetchone()
        conn.close()
        return dict(row) if row else None
    
    def create(self, name: str):
        conn = db.get_connection()
        c = conn.cursor()
        
        item_id = str(uuid.uuid4())[:8]
        c.execute(f"INSERT INTO {self.table} (id, name) VALUES (?, ?)", (item_id, name))
        c.execute("INSERT INTO audit_log (entity_type, entity_id, action, changes) VALUES (?, ?, ?, ?)",
                  (self.entity_type.value, item_id, "CREATE", json.dumps({"name": name})))
        
        conn.commit()
        c.execute(f"SELECT * FROM {self.table} WHERE id = ?", (item_id,))
        new_item = dict(c.fetchone())
        conn.close()
        
        return new_item
    
    def update(self, item_id: str, name: str):
        conn = db.get_connection()
        c = conn.cursor()
        
        c.execute(f"SELECT name FROM {self.table} WHERE id = ?", (item_id,))
        old_item = c.fetchone()
        if not old_item:
            conn.close()
            return None
        
        c.execute(f"UPDATE {self.table} SET name = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?", (name, item_id))
        c.execute("INSERT INTO audit_log (entity_type, entity_id, action, changes) VALUES (?, ?, ?, ?)",
                  (self.entity_type.value, item_id, "UPDATE", json.dumps({"old": old_item['name'], "new": name})))
        
        conn.commit()
        c.execute(f"SELECT * FROM {self.table} WHERE id = ?", (item_id,))
        updated_item = dict(c.fetchone())
        conn.close()
        
        return updated_item
    
    def delete(self, item_id: str):
        conn = db.get_connection()
        c = conn.cursor()
        
        c.execute(f"UPDATE {self.table} SET is_active = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?", (item_id,))
        affected = c.rowcount
        
        if affected > 0:
            c.execute("INSERT INTO audit_log (entity_type, entity_id, action) VALUES (?, ?, ?)",
                      (self.entity_type.value, item_id, "DELETE"))
        
        conn.commit()
        conn.close()
        return affected > 0

# ==================== FASTAPI APP ====================
@asynccontextmanager
async def lifespan(app: FastAPI):
    print("🚀 Starting Quality Management System...")
    yield
    print("👋 Shutting down...")

app = FastAPI(title="Quality Management System", version="2.0.0", lifespan=lifespan)

# ==================== HELPER FUNCTIONS ====================
def get_entity_info(entity: str):
    info = {
        "employees": {"label": "Employee", "icon": "👤", "color": "purple"},
        "levels": {"label": "Level", "icon": "📊", "color": "indigo"},
        "areas": {"label": "Area", "icon": "🏢", "color": "pink"},
        "partnumbers": {"label": "Part Number", "icon": "🔧", "color": "orange"},
        "calibrations": {"label": "Calibration", "icon": "⚙️", "color": "teal"}
    }
    return info.get(entity, {"label": entity, "icon": "📄", "color": "gray"})

# ==================== HTML TEMPLATES ====================
def render_toast(message: str, type: str = "success"):
    colors = {"success": "green", "error": "red", "info": "blue"}
    color = colors.get(type, "blue")
    return f"""
        <div id="toast" class="fixed top-4 right-4 bg-{color}-500 text-white px-6 py-3 rounded-lg shadow-lg z-50"
             hx-swap-oob="true">
            {message}
        </div>
        <script>setTimeout(() => document.getElementById('toast')?.remove(), 3000)</script>
    """

def render_items_list(items, total, entity, page, search=""):
    info = get_entity_info(entity)
    total_pages = (total + Config.PAGE_SIZE - 1) // Config.PAGE_SIZE
    
    if not items:
        return """
            <div class="text-center py-12 text-gray-400">
                <div class="text-4xl mb-2">📭</div>
                <p class="text-lg">No items found</p>
            </div>
        """
    
    html = f"""
        <div class="mb-4 text-sm text-gray-600 font-semibold">
            Showing {len(items)} of {total} total records
        </div>
        <div class="space-y-3">
    """
    
    for item in items:
        updated_info = ""
        if item['updated_at'] != item['created_at']:
            updated_info = f"<p class='text-xs text-gray-500 mt-1'>Updated: {item['updated_at']}</p>"
        
        html += f"""
            <div class="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-5 flex items-center justify-between hover:shadow-lg transition-all border-2 border-transparent hover:border-blue-200">
                <div class="flex-1">
                    <div class="flex items-center gap-3 mb-2">
                        <span class="font-mono text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded-full font-bold">{item['id']}</span>
                        <span class="text-xs text-gray-400">{item['created_at']}</span>
                    </div>
                    <p class="font-bold text-gray-800 text-lg">{item['name']}</p>
                    {updated_info}
                </div>
                <div class="flex gap-2">
                    <button hx-get="/entity/{entity}/edit/{item['id']}" 
                            hx-target="#edit-modal"
                            class="bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-white font-semibold py-2 px-5 rounded-lg transition-all transform hover:scale-105 shadow-md">
                        ✏️ Edit
                    </button>
                    <button hx-delete="/entity/{entity}/delete/{item['id']}" 
                            hx-target="#items-list"
                            hx-confirm="Are you sure you want to delete this {info['label'].lower()}?"
                            class="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-semibold py-2 px-5 rounded-lg transition-all transform hover:scale-105 shadow-md">
                        🗑️ Delete
                    </button>
                </div>
            </div>
        """
    
    html += "</div>"
    
    # Pagination
    if total_pages > 1:
        html += '<div class="flex justify-center items-center gap-2 mt-6">'
        
        # Previous button
        if page > 1:
            html += f"""
                <button hx-get="/entity/{entity}/items?page={page-1}&search={search}" 
                        hx-target="#items-list"
                        class="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 transition">
                    ← Prev
                </button>
            """
        else:
            html += '<button disabled class="px-4 py-2 rounded-lg bg-gray-200 opacity-50 cursor-not-allowed">← Prev</button>'
        
        # Page numbers
        for p in range(1, total_pages + 1):
            if p == 1 or p == total_pages or (p >= page - 2 and p <= page + 2):
                active_class = "bg-blue-500 text-white font-bold" if p == page else "bg-gray-200 hover:bg-gray-300"
                html += f"""
                    <button hx-get="/entity/{entity}/items?page={p}&search={search}" 
                            hx-target="#items-list"
                            class="px-4 py-2 rounded-lg transition {active_class}">
                        {p}
                    </button>
                """
            elif (p == page - 3 or p == page + 3) and total_pages > 7:
                html += '<span class="px-3 py-2">...</span>'
        
        # Next button
        if page < total_pages:
            html += f"""
                <button hx-get="/entity/{entity}/items?page={page+1}&search={search}" 
                        hx-target="#items-list"
                        class="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 transition">
                    Next →
                </button>
            """
        else:
            html += '<button disabled class="px-4 py-2 rounded-lg bg-gray-200 opacity-50 cursor-not-allowed">Next →</button>'
        
        html += '</div>'
    
    return html

# ==================== ROUTES ====================
@app.get("/", response_class=HTMLResponse)
async def root():
    return """
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Quality Management System</title>
    <script src="https://unpkg.com/htmx.org@1.9.10"></script>
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen">
    <div id="toast-container"></div>
    <div id="edit-modal"></div>

    <div class="container mx-auto px-4 py-8">
        <!-- Header -->
        <div class="bg-white rounded-xl shadow-xl p-8 mb-8 border-t-4 border-blue-500">
            <h1 class="text-5xl font-bold bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent mb-6 text-center">
                Quality Management System
            </h1>
            <div class="flex justify-center gap-4">
                <button hx-get="/general-info" 
                        hx-target="#main-content"
                        hx-swap="innerHTML"
                        class="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold py-4 px-10 rounded-xl shadow-lg transition-all transform hover:scale-105">
                    📊 General Info
                </button>
                <button hx-get="/dmt" 
                        hx-target="#main-content"
                        hx-swap="innerHTML"
                        class="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold py-4 px-10 rounded-xl shadow-lg transition-all transform hover:scale-105">
                    📈 DMT
                </button>
                <button hx-get="/audit" 
                        hx-target="#main-content"
                        hx-swap="innerHTML"
                        class="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white font-bold py-4 px-10 rounded-xl shadow-lg transition-all transform hover:scale-105">
                    📋 Audit Log
                </button>
            </div>
        </div>

        <!-- Main Content -->
        <div id="main-content"></div>
    </div>
</body>
</html>
    """

@app.get("/general-info", response_class=HTMLResponse)
async def general_info():
    entities = [
        {"key": "employees", "label": "Employees", "icon": "👤", "color": "purple"},
        {"key": "levels", "label": "Levels", "icon": "📊", "color": "indigo"},
        {"key": "areas", "label": "Areas", "icon": "🏢", "color": "pink"},
        {"key": "partnumbers", "label": "Part Numbers", "icon": "🔧", "color": "orange"},
        {"key": "calibrations", "label": "Calibrations", "icon": "⚙️", "color": "teal"}
    ]
    
    html = """
        <div class="bg-white rounded-xl shadow-xl p-6 mb-6">
            <h2 class="text-3xl font-bold text-gray-800 mb-6">General Information Management</h2>
            <div class="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
    """
    
    for entity in entities:
        html += f"""
            <button hx-get="/entity/{entity['key']}" 
                    hx-target="#main-content"
                    class="bg-gradient-to-br from-{entity['color']}-500 to-{entity['color']}-600 hover:from-{entity['color']}-600 hover:to-{entity['color']}-700 text-white font-semibold py-4 px-4 rounded-xl shadow-lg transition-all transform hover:scale-105">
                <div class="text-2xl mb-1">{entity['icon']}</div>
                {entity['label']}
            </button>
        """
    
    html += """
            </div>
            <button hx-get="/" 
                    hx-target="body"
                    hx-swap="innerHTML"
                    class="bg-gray-500 hover:bg-gray-600 text-white font-semibold py-2 px-6 rounded-lg transition">
                ← Back
            </button>
        </div>
    """
    
    return html

@app.get("/entity/{entity}", response_class=HTMLResponse)
async def entity_page(entity: str):
    info = get_entity_info(entity)
    repo = Repository(EntityType(entity))
    items, total = repo.get_all(page=1)
    
    html = f"""
        <div class="bg-white rounded-xl shadow-xl p-8">
            <div class="flex items-center gap-3 mb-6">
                <span class="text-4xl">{info['icon']}</span>
                <h3 class="text-3xl font-bold text-gray-800">{info['label']} Management</h3>
            </div>
            
            <!-- Search Bar -->
            <div class="mb-6">
                <input type="text" 
                       name="search"
                       placeholder="🔍 Search {info['label'].lower()}s..."
                       hx-get="/entity/{entity}/items"
                       hx-trigger="keyup changed delay:500ms"
                       hx-target="#items-list"
                       hx-include="this"
                       class="w-full px-6 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition">
            </div>

            <!-- Create Form -->
            <div class="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 mb-6 border-2 border-blue-200">
                <h4 class="font-bold text-gray-800 mb-4 text-lg">➕ Add New {info['label']}</h4>
                <form hx-post="/entity/{entity}/create" 
                      hx-target="#items-list"
                      hx-swap="innerHTML"
                      class="flex gap-3">
                    <input type="text" 
                           name="name" 
                           placeholder="Enter {info['label'].lower()} name" 
                           class="flex-1 px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                           required>
                    <button type="submit" 
                            class="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold py-3 px-8 rounded-lg shadow-lg transition-all transform hover:scale-105">
                        ✓ Add
                    </button>
                    <button type="reset" 
                            class="bg-gray-400 hover:bg-gray-500 text-white font-semibold py-3 px-6 rounded-lg transition">
                        ✕ Cancel
                    </button>
                </form>
            </div>

            <!-- Export Options -->
            <div class="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 mb-6 border-2 border-purple-200">
                <h4 class="font-bold text-gray-800 mb-4 text-lg">📥 Export Data</h4>
                <div class="flex flex-wrap gap-2">
                    <a href="/entity/{entity}/export/json?days=1" 
                       class="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg transition inline-block">
                        JSON - Last Day
                    </a>
                    <a href="/entity/{entity}/export/json?days=7" 
                       class="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg transition inline-block">
                        JSON - Last 7 Days
                    </a>
                    <a href="/entity/{entity}/export/json" 
                       class="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg transition inline-block">
                        JSON - All
                    </a>
                    <a href="/entity/{entity}/export/csv" 
                       class="bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded-lg transition inline-block">
                        CSV - All
                    </a>
                </div>
            </div>

            <!-- Items List -->
            <div id="items-list">
                {render_items_list(items, total, entity, 1)}
            </div>

            <button hx-get="/general-info" 
                    hx-target="#main-content"
                    class="mt-6 bg-gray-500 hover:bg-gray-600 text-white font-semibold py-2 px-6 rounded-lg transition">
                ← Back
            </button>
        </div>
    """
    
    return html

@app.get("/entity/{entity}/items", response_class=HTMLResponse)
async def get_items(entity: str, page: int = 1, search: str = ""):
    repo = Repository(EntityType(entity))
    items, total = repo.get_all(page=page, search=search if search else None)
    return render_items_list(items, total, entity, page, search)

@app.post("/entity/{entity}/create", response_class=HTMLResponse)
async def create_item(entity: str, name: str = Form(...)):
    repo = Repository(EntityType(entity))
    repo.create(name.strip())
    
    items, total = repo.get_all(page=1)
    html = render_items_list(items, total, entity, 1)
    html += render_toast(f"{get_entity_info(entity)['label']} created successfully!", "success")
    return html

@app.get("/entity/{entity}/edit/{item_id}", response_class=HTMLResponse)
async def edit_form(entity: str, item_id: str):
    repo = Repository(EntityType(entity))
    item = repo.get_by_id(item_id)
    info = get_entity_info(entity)
    
    if not item:
        return render_toast("Item not found", "error")
    
    return f"""
        <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" id="edit-modal">
            <div class="bg-white rounded-xl p-8 max-w-md w-full mx-4 shadow-2xl">
                <h3 class="text-2xl font-bold mb-4">Edit {info['label']}</h3>
                <form hx-put="/entity/{entity}/update/{item_id}" 
                      hx-target="#items-list"
                      class="space-y-4">
                    <div>
                        <label class="block text-sm font-semibold text-gray-700 mb-2">Name</label>
                        <input type="text" 
                               name="name" 
                               value="{item['name']}" 
                               class="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
                               required>
                    </div>
                    <div class="flex gap-3">
                        <button type="submit" 
                                class="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 rounded-lg transition">
                            ✓ Save
                        </button>
                        <button type="button" 
                                onclick="document.getElementById('edit-modal').remove()"
                                class="flex-1 bg-gray-400 hover:bg-gray-500 text-white font-semibold py-3 rounded-lg transition">
                            ✕ Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>
    """

@app.put("/entity/{entity}/update/{item_id}", response_class=HTMLResponse)
async def update_item(entity: str, item_id: str, name: str = Form(...)):
    repo = Repository(EntityType(entity))
    updated = repo.update(item_id, name.strip())
    
    if not updated:
        return render_toast("Item not found", "error")
    
    items, total = repo.get_all(page=1)
    html = render_items_list(items, total, entity, 1)
    html += render_toast(f"{get_entity_info(entity)['label']} updated successfully!", "success")
    html += '<div hx-swap-oob="true" id="edit-modal"></div>'
    return html

@app.delete("/entity/{entity}/delete/{item_id}", response_class=HTMLResponse)
async def delete_item(entity: str, item_id: str):
    repo = Repository(EntityType(entity))
    success = repo.delete(item_id)
    
    if not success:
        return render_toast("Item not found", "error")
    
    items, total = repo.get_all(page=1)
    html = render_items_list(items, total, entity, 1)
    html += render_toast(f"{get_entity_info(entity)['label']} deleted successfully!", "success")
    return html

@app.get("/entity/{entity}/export/{format}")
async def export_data(entity: str, format: str, days: Optional[int] = None):
    repo = Repository(EntityType(entity))
    items, _ = repo.get_all(days=days, page=1)
    
    for item in items:
        item.pop('is_active', None)
    
    if format == "csv":
        output = io.StringIO()
        if items:
            writer = csv.DictWriter(output, fieldnames=items[0].keys())
            writer.writeheader()
            writer.writerows(items)
        
        return StreamingResponse(
            io.BytesIO(output.getvalue().encode()),
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename={entity}_{datetime.now().strftime('%Y%m%d')}.csv"}
        )
    else:
        json_str = json.dumps(items, indent=2, default=str)
        return StreamingResponse(
            io.BytesIO(json_str.encode()),
            media_type="application/json",
            headers={"Content-Disposition": f"attachment; filename={entity}_{datetime.now().strftime('%Y%m%d')}.json"}
        )

@app.get("/dmt", response_class=HTMLResponse)
async def dmt_page():
    conn = db.get_connection()
    c = conn.cursor()
    
    stats = {}
    for entity in EntityType:
        c.execute(f"SELECT COUNT(*) as count FROM {entity.value} WHERE is_active = 1")
        stats[entity.value] = c.fetchone()[0]
    
    c.execute("SELECT * FROM audit_log ORDER BY timestamp DESC LIMIT 10")
    recent_logs = [dict(row) for row in c.fetchall()]
    conn.close()
    
    stats_html = ""
    for key, value in stats.items():
        stats_html += f"""
            <div class="bg-white p-4 rounded-lg shadow">
                <div class="text-3xl font-bold text-blue-600">{value}</div>
                <div class="text-sm text-gray-600">{key.capitalize()}</div>
            </div>
        """
    
    logs_html = ""
    for log in recent_logs:
        action_color = {
            "CREATE": "bg-green-100 text-green-700",
            "UPDATE": "bg-yellow-100 text-yellow-700",
            "DELETE": "bg-red-100 text-red-700"
        }.get(log['action'], "bg-gray-100 text-gray-700")
        
        logs_html += f"""
            <div class="bg-white p-3 rounded-lg shadow-sm">
                <div class="flex items-center justify-between">
                    <span class="px-2 py-1 rounded text-xs font-semibold {action_color}">{log['action']}</span>
                    <span class="text-xs text-gray-500">{log['timestamp']}</span>
                </div>
                <div class="text-sm text-gray-700 mt-1">{log['entity_type']}: {log['entity_id']}</div>
            </div>
        """
    
    return f"""
        <div class="bg-white rounded-xl shadow-xl p-8">
            <h2 class="text-3xl font-bold text-gray-800 mb-6">📈 DMT Analytics Dashboard</h2>
            
            <div class="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                {stats_html}
            </div>
            
            <div class="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6">
                <h3 class="text-xl font-semibold mb-4">Recent Activity</h3>
                <div class="space-y-2">
                    {logs_html}
                </div>
            </div>
            
            <button hx-get="/" 
                    hx-target="body"
                    hx-swap="innerHTML"
                    class="mt-6 bg-gray-500 hover:bg-gray-600 text-white font-semibold py-2 px-6 rounded-lg transition">
                ← Back
            </button>
        </div>
    """

@app.get("/audit", response_class=HTMLResponse)
async def audit_page():
    conn = db.get_connection()
    c = conn.cursor()
    c.execute("SELECT * FROM audit_log ORDER BY timestamp DESC LIMIT 100")
    logs = [dict(row) for row in c.fetchall()]
    conn.close()
    
    logs_html = ""
    for log in logs:
        action_color = {
            "CREATE": "bg-green-100 text-green-700",
            "UPDATE": "bg-yellow-100 text-yellow-700",
            "DELETE": "bg-red-100 text-red-700"
        }.get(log['action'], "bg-gray-100 text-gray-700")
        
        changes = log.get('changes', '{}')
        
        logs_html += f"""
            <tr class="hover:bg-blue-50 transition">
                <td class="px-6 py-4 text-sm text-gray-600">{log['timestamp']}</td>
                <td class="px-6 py-4 text-sm font-semibold text-gray-800">{log['entity_type']}</td>
                <td class="px-6 py-4 text-sm font-mono text-blue-600">{log['entity_id']}</td>
                <td class="px-6 py-4">
                    <span class="px-3 py-1 rounded-full text-xs font-semibold {action_color}">
                        {log['action']}
                    </span>
                </td>
                <td class="px-6 py-4 text-sm text-gray-600">
                    <pre class="text-xs bg-gray-100 p-2 rounded max-w-xs overflow-x-auto">{changes}</pre>
                </td>
            </tr>
        """
    
    return f"""
        <div class="bg-white rounded-xl shadow-xl p-8">
            <h2 class="text-3xl font-bold text-gray-800 mb-6">📋 Audit Log</h2>
            
            <div class="overflow-x-auto">
                <table class="min-w-full bg-white rounded-lg overflow-hidden">
                    <thead class="bg-gradient-to-r from-gray-100 to-gray-200">
                        <tr>
                            <th class="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">Timestamp</th>
                            <th class="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">Entity Type</th>
                            <th class="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">Entity ID</th>
                            <th class="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">Action</th>
                            <th class="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">Changes</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-gray-200">
                        {logs_html}
                    </tbody>
                </table>
            </div>
            
            <button hx-get="/" 
                    hx-target="body"
                    hx-swap="innerHTML"
                    class="mt-6 bg-gray-500 hover:bg-gray-600 text-white font-semibold py-2 px-6 rounded-lg transition">
                ← Back
            </button>
        </div>
    """

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)