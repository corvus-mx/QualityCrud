from fastapi import FastAPI, Request, Form
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from supabase import create_client, Client
from dotenv import load_dotenv
import os
from typing import Optional

load_dotenv()

app = FastAPI()

supabase: Client = create_client(
    os.getenv("VITE_SUPABASE_URL"),
    os.getenv("VITE_SUPABASE_ANON_KEY")
)

templates = Jinja2Templates(directory=".")

@app.get("/", response_class=HTMLResponse)
async def root(request: Request):
    with open("index.html", "r") as f:
        return HTMLResponse(content=f.read())

@app.get("/home", response_class=HTMLResponse)
async def home():
    return """
    <div class="text-center py-12">
      <p class="text-xl text-gray-600">Welcome to the Quality Management System</p>
      <p class="text-gray-500 mt-4">Select an option from the menu above to get started</p>
    </div>
    """

@app.get("/general-info", response_class=HTMLResponse)
async def general_info():
    entities = [
        {"key": "employees", "label": "Employees", "icon": "👤", "color": "blue"},
        {"key": "workcenters", "label": "Workcenters", "icon": "🏢", "color": "green"},
        {"key": "part_numbers", "label": "Part Numbers", "icon": "🔧", "color": "orange"},
        {"key": "customers", "label": "Customers", "icon": "🏪", "color": "red"},
        {"key": "inspection_items", "label": "Inspection Items", "icon": "🔍", "color": "teal"}
    ]

    buttons_html = ""
    for entity in entities:
        buttons_html += f"""
          <button hx-get="/entity/{entity['key']}" hx-target="#main-content" hx-swap="innerHTML"
                  class="bg-gradient-to-br from-{entity['color']}-500 to-{entity['color']}-600 hover:from-{entity['color']}-600 hover:to-{entity['color']}-700 text-white font-semibold py-6 px-4 rounded-xl shadow-lg transition-all transform hover:scale-105">
            <div class="text-3xl mb-2">{entity['icon']}</div>
            {entity['label']}
          </button>
        """

    return f"""
    <div class="bg-white rounded-xl shadow-xl p-6">
      <h2 class="text-3xl font-bold text-gray-800 mb-6">General Information Management</h2>
      <div class="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
        {buttons_html}
      </div>
      <button hx-get="/home" hx-target="#main-content" hx-swap="innerHTML"
              class="bg-gray-500 hover:bg-gray-600 text-white font-semibold py-2 px-6 rounded-lg transition">
        ← Back
      </button>
    </div>
    """

@app.get("/entity/{entity_key}", response_class=HTMLResponse)
async def get_entity(entity_key: str):
    entity_config = {
        "employees": {"label": "Employee", "icon": "👤", "table": "employees", "fields": ["name", "email"]},
        "workcenters": {"label": "Workcenter", "icon": "🏢", "table": "workcenters", "fields": ["name", "code"]},
        "part_numbers": {"label": "Part Number", "icon": "🔧", "table": "part_numbers", "fields": ["part_number", "description"]},
        "customers": {"label": "Customer", "icon": "🏪", "table": "customers", "fields": ["name", "code"]},
        "inspection_items": {"label": "Inspection Item", "icon": "🔍", "table": "inspection_items", "fields": ["name", "description"]}
    }

    config = entity_config.get(entity_key)
    if not config:
        return HTMLResponse(content="<div>Entity not found</div>", status_code=404)

    try:
        response = supabase.table(config["table"]).select("*").eq("is_active", True).order("name").execute()
        items = response.data

        form_fields = ""
        for field in config["fields"]:
            required = 'required' if field in ['name', 'part_number'] else ''
            form_fields += f"""
              <div>
                <label class="block text-sm font-semibold text-gray-700 mb-2 capitalize">{field.replace('_', ' ')}</label>
                <input type="text" name="{field}"
                       class="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                       {required}>
              </div>
            """

        items_html = ""
        if not items:
            items_html = """
            <div class="text-center py-12 text-gray-400">
              <div class="text-4xl mb-2">📭</div>
              <p class="text-lg">No items found</p>
            </div>
            """
        else:
            for item in items:
                item_fields = ""
                for field in config["fields"]:
                    if item.get(field):
                        item_fields += f'<p class="font-bold text-gray-800">{item[field]}</p>'

                items_html += f"""
                <div class="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-5 flex items-center justify-between hover:shadow-lg transition-all border-2 border-transparent hover:border-blue-200">
                  <div class="flex-1">
                    <div class="flex items-center gap-3 mb-2">
                      <span class="font-mono text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded-full font-bold">{item['id'][:8]}</span>
                    </div>
                    {item_fields}
                  </div>
                </div>
                """

        return f"""
        <div class="bg-white rounded-xl shadow-xl p-8">
          <div class="flex items-center gap-3 mb-6">
            <span class="text-4xl">{config['icon']}</span>
            <h3 class="text-3xl font-bold text-gray-800">{config['label']} Management</h3>
          </div>

          <div class="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 mb-6 border-2 border-blue-200">
            <h4 class="font-bold text-gray-800 mb-4 text-lg">➕ Add New {config['label']}</h4>
            <form hx-post="/entity/{entity_key}/create" hx-target="#{entity_key}-list" hx-swap="outerHTML" class="space-y-3">
              {form_fields}
              <div class="flex gap-3">
                <button type="submit"
                        class="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold py-3 px-8 rounded-lg shadow-lg transition-all transform hover:scale-105">
                  ✓ Add
                </button>
                <button type="reset"
                        class="bg-gray-400 hover:bg-gray-500 text-white font-semibold py-3 px-6 rounded-lg transition">
                  ✕ Cancel
                </button>
              </div>
            </form>
          </div>

          <div id="{entity_key}-list" class="space-y-3">
            {items_html}
          </div>

          <button hx-get="/general-info" hx-target="#main-content" hx-swap="innerHTML"
                  class="mt-6 bg-gray-500 hover:bg-gray-600 text-white font-semibold py-2 px-6 rounded-lg transition">
            ← Back
          </button>
        </div>
        """
    except Exception as e:
        return f"""
        <div class="bg-red-50 border-2 border-red-200 rounded-xl p-6 text-center">
          <p class="text-red-700 font-semibold">Error loading {config['label']}s</p>
          <p class="text-sm text-red-600 mt-2">{str(e)}</p>
        </div>
        """

@app.post("/entity/{entity_key}/create", response_class=HTMLResponse)
async def create_entity(
    entity_key: str,
    name: Optional[str] = Form(None),
    email: Optional[str] = Form(None),
    code: Optional[str] = Form(None),
    part_number: Optional[str] = Form(None),
    description: Optional[str] = Form(None)
):
    entity_config = {
        "employees": {"table": "employees", "fields": ["name", "email"]},
        "workcenters": {"table": "workcenters", "fields": ["name", "code"]},
        "part_numbers": {"table": "part_numbers", "fields": ["part_number", "description"]},
        "customers": {"table": "customers", "fields": ["name", "code"]},
        "inspection_items": {"table": "inspection_items", "fields": ["name", "description"]}
    }

    config = entity_config.get(entity_key)
    if not config:
        return HTMLResponse(content="<div>Entity not found</div>", status_code=404)

    try:
        insert_data = {}
        if name:
            insert_data["name"] = name
        if email:
            insert_data["email"] = email
        if code:
            insert_data["code"] = code
        if part_number:
            insert_data["part_number"] = part_number
        if description:
            insert_data["description"] = description

        supabase.table(config["table"]).insert(insert_data).execute()

        response = supabase.table(config["table"]).select("*").eq("is_active", True).order("name").execute()
        items = response.data

        items_html = ""
        for item in items:
            item_fields = ""
            for field in config["fields"]:
                if item.get(field):
                    item_fields += f'<p class="font-bold text-gray-800">{item[field]}</p>'

            items_html += f"""
            <div class="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-5 flex items-center justify-between hover:shadow-lg transition-all border-2 border-transparent hover:border-blue-200">
              <div class="flex-1">
                <div class="flex items-center gap-3 mb-2">
                  <span class="font-mono text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded-full font-bold">{item['id'][:8]}</span>
                </div>
                {item_fields}
              </div>
            </div>
            """

        return f'<div id="{entity_key}-list" class="space-y-3">{items_html}</div>'
    except Exception as e:
        return f"""
        <div class="bg-red-50 border-2 border-red-200 rounded-xl p-6 text-center">
          <p class="text-red-700 font-semibold">Error creating item</p>
          <p class="text-sm text-red-600 mt-2">{str(e)}</p>
        </div>
        """

@app.get("/dmt/list", response_class=HTMLResponse)
async def dmt_list():
    try:
        response = supabase.table("dmt_records").select("""
            *,
            workcenter:workcenters(name),
            part_number:part_numbers(part_number),
            employee:employees(name),
            customer:customers(name),
            inspection_item:inspection_items(name),
            prepared_by:employees!dmt_records_prepared_by_id_fkey(name),
            disposition_approved_by:employees!dmt_records_disposition_approved_by_id_fkey(name)
        """).eq("is_active", True).order("created_at", desc=True).execute()

        records = response.data

        if not records:
            table_html = """
            <div class="text-center py-12 text-gray-400">
              <div class="text-4xl mb-2">📭</div>
              <p class="text-lg">No DMT records found</p>
              <button hx-get="/dmt/create" hx-target="#main-content" hx-swap="innerHTML"
                      class="mt-4 bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-6 rounded-lg transition">
                Create First Record
              </button>
            </div>
            """
        else:
            rows_html = ""
            for record in records:
                status_class = "bg-green-100 text-green-700" if record.get("dmt_closed") else "bg-yellow-100 text-yellow-700"
                status_text = "Closed" if record.get("dmt_closed") else "Open"

                rows_html += f"""
                <tr class="hover:bg-blue-50 transition">
                  <td class="px-6 py-4 text-sm font-mono text-blue-600">{record.get('id', 'N/A')}</td>
                  <td class="px-6 py-4 text-sm text-gray-800">{record.get('part_number', {}).get('part_number', 'N/A')}</td>
                  <td class="px-6 py-4 text-sm text-gray-800">{record.get('customer', {}).get('name', 'N/A')}</td>
                  <td class="px-6 py-4 text-sm text-gray-800">{record.get('employee', {}).get('name', 'N/A')}</td>
                  <td class="px-6 py-4 text-sm text-gray-600">{record.get('date', 'N/A')}</td>
                  <td class="px-6 py-4">
                    <span class="px-3 py-1 rounded-full text-xs font-semibold {status_class}">
                      {status_text}
                    </span>
                  </td>
                  <td class="px-6 py-4">
                    <div class="flex gap-2">
                      <button hx-get="/dmt/view/{record['id']}" hx-target="#main-content" hx-swap="innerHTML"
                              class="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-1 px-3 rounded transition text-xs">
                        View
                      </button>
                      <button hx-get="/dmt/edit/{record['id']}" hx-target="#main-content" hx-swap="innerHTML"
                              class="bg-yellow-500 hover:bg-yellow-600 text-white font-semibold py-1 px-3 rounded transition text-xs">
                        Edit
                      </button>
                      <button hx-delete="/dmt/delete/{record['id']}" hx-target="closest tr" hx-swap="outerHTML" hx-confirm="Are you sure you want to delete this DMT record?"
                              class="bg-red-500 hover:bg-red-600 text-white font-semibold py-1 px-3 rounded transition text-xs">
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
                """

            table_html = f"""
            <div class="overflow-x-auto">
              <table class="min-w-full bg-white rounded-lg overflow-hidden">
                <thead class="bg-gradient-to-r from-gray-100 to-gray-200">
                  <tr>
                    <th class="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">DMT ID</th>
                    <th class="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">Part Number</th>
                    <th class="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">Customer</th>
                    <th class="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">Employee</th>
                    <th class="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">Date</th>
                    <th class="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">Status</th>
                    <th class="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-200">
                  {rows_html}
                </tbody>
              </table>
            </div>
            """

        return f"""
        <div class="bg-white rounded-xl shadow-xl p-8">
          <div class="flex items-center justify-between mb-6">
            <div class="flex items-center gap-3">
              <span class="text-4xl">📈</span>
              <h2 class="text-3xl font-bold text-gray-800">DMT Records</h2>
            </div>
            <button hx-get="/dmt/create" hx-target="#main-content" hx-swap="innerHTML"
                    class="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold py-3 px-6 rounded-xl shadow-lg transition-all transform hover:scale-105">
              ➕ New DMT Record
            </button>
          </div>

          {table_html}

          <button hx-get="/home" hx-target="#main-content" hx-swap="innerHTML"
                  class="mt-6 bg-gray-500 hover:bg-gray-600 text-white font-semibold py-2 px-6 rounded-lg transition">
            ← Back to Home
          </button>
        </div>
        """
    except Exception as e:
        return f"""
        <div class="bg-red-50 border-2 border-red-200 rounded-xl p-6 text-center">
          <p class="text-red-700 font-semibold">Error loading DMT records</p>
          <p class="text-sm text-red-600 mt-2">{str(e)}</p>
        </div>
        """

@app.delete("/dmt/delete/{record_id}", response_class=HTMLResponse)
async def delete_dmt(record_id: str):
    try:
        supabase.table("dmt_records").update({"is_active": False}).eq("id", record_id).execute()
        return ""
    except Exception as e:
        return f"""
        <div class="bg-red-50 border-2 border-red-200 rounded-xl p-6 text-center">
          <p class="text-red-700 font-semibold">Error deleting DMT record</p>
          <p class="text-sm text-red-600 mt-2">{str(e)}</p>
        </div>
        """

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
