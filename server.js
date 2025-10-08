import express from 'express';
import { createClient } from '@supabase/supabase-js';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname)));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/home', (req, res) => {
  res.send(`
    <div class="text-center py-12">
      <p class="text-xl text-gray-600">Welcome to the Quality Management System</p>
      <p class="text-gray-500 mt-4">Select an option from the menu above to get started</p>
    </div>
  `);
});

app.get('/general-info', async (req, res) => {
  const entities = [
    { key: 'employees', label: 'Employees', icon: '👤', color: 'blue' },
    { key: 'workcenters', label: 'Workcenters', icon: '🏢', color: 'green' },
    { key: 'part_numbers', label: 'Part Numbers', icon: '🔧', color: 'orange' },
    { key: 'customers', label: 'Customers', icon: '🏪', color: 'red' },
    { key: 'inspection_items', label: 'Inspection Items', icon: '🔍', color: 'teal' }
  ];

  res.send(`
    <div class="bg-white rounded-xl shadow-xl p-6">
      <h2 class="text-3xl font-bold text-gray-800 mb-6">General Information Management</h2>
      <div class="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
        ${entities.map(entity => `
          <button hx-get="/entity/${entity.key}" hx-target="#main-content" hx-swap="innerHTML"
                  class="bg-gradient-to-br from-${entity.color}-500 to-${entity.color}-600 hover:from-${entity.color}-600 hover:to-${entity.color}-700 text-white font-semibold py-6 px-4 rounded-xl shadow-lg transition-all transform hover:scale-105">
            <div class="text-3xl mb-2">${entity.icon}</div>
            ${entity.label}
          </button>
        `).join('')}
      </div>
      <button hx-get="/home" hx-target="#main-content" hx-swap="innerHTML"
              class="bg-gray-500 hover:bg-gray-600 text-white font-semibold py-2 px-6 rounded-lg transition">
        ← Back
      </button>
    </div>
  `);
});

app.get('/entity/:entityKey', async (req, res) => {
  const { entityKey } = req.params;

  const entityConfig = {
    employees: { label: 'Employee', icon: '👤', table: 'employees', fields: ['name', 'email'] },
    workcenters: { label: 'Workcenter', icon: '🏢', table: 'workcenters', fields: ['name', 'code'] },
    part_numbers: { label: 'Part Number', icon: '🔧', table: 'part_numbers', fields: ['part_number', 'description'] },
    customers: { label: 'Customer', icon: '🏪', table: 'customers', fields: ['name', 'code'] },
    inspection_items: { label: 'Inspection Item', icon: '🔍', table: 'inspection_items', fields: ['name', 'description'] }
  };

  const config = entityConfig[entityKey];
  if (!config) {
    return res.status(404).send('<div>Entity not found</div>');
  }

  try {
    const { data: items, error } = await supabase
      .from(config.table)
      .select('*')
      .eq('is_active', true)
      .order('name');

    if (error) throw error;

    res.send(`
      <div class="bg-white rounded-xl shadow-xl p-8">
        <div class="flex items-center gap-3 mb-6">
          <span class="text-4xl">${config.icon}</span>
          <h3 class="text-3xl font-bold text-gray-800">${config.label} Management</h3>
        </div>

        <div class="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 mb-6 border-2 border-blue-200">
          <h4 class="font-bold text-gray-800 mb-4 text-lg">➕ Add New ${config.label}</h4>
          <form hx-post="/entity/${entityKey}/create" hx-target="#${entityKey}-list" hx-swap="outerHTML" class="space-y-3">
            ${config.fields.map(field => `
              <div>
                <label class="block text-sm font-semibold text-gray-700 mb-2 capitalize">${field.replace('_', ' ')}</label>
                <input type="text" name="${field}"
                       class="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                       ${field === 'name' || field === 'part_number' ? 'required' : ''}>
              </div>
            `).join('')}
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

        <div id="${entityKey}-list" class="space-y-3">
          ${items.length === 0 ? `
            <div class="text-center py-12 text-gray-400">
              <div class="text-4xl mb-2">📭</div>
              <p class="text-lg">No items found</p>
            </div>
          ` : items.map(item => `
            <div class="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-5 flex items-center justify-between hover:shadow-lg transition-all border-2 border-transparent hover:border-blue-200">
              <div class="flex-1">
                <div class="flex items-center gap-3 mb-2">
                  <span class="font-mono text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded-full font-bold">${item.id.substring(0, 8)}</span>
                </div>
                ${config.fields.map(field => item[field] ? `<p class="font-bold text-gray-800">${item[field]}</p>` : '').join('')}
              </div>
            </div>
          `).join('')}
        </div>

        <button hx-get="/general-info" hx-target="#main-content" hx-swap="innerHTML"
                class="mt-6 bg-gray-500 hover:bg-gray-600 text-white font-semibold py-2 px-6 rounded-lg transition">
          ← Back
        </button>
      </div>
    `);
  } catch (error) {
    console.error('Error loading entity:', error);
    res.status(500).send(`
      <div class="bg-red-50 border-2 border-red-200 rounded-xl p-6 text-center">
        <p class="text-red-700 font-semibold">Error loading ${config.label}s</p>
        <p class="text-sm text-red-600 mt-2">${error.message}</p>
      </div>
    `);
  }
});

app.post('/entity/:entityKey/create', async (req, res) => {
  const { entityKey } = req.params;

  const entityConfig = {
    employees: { table: 'employees', fields: ['name', 'email'] },
    workcenters: { table: 'workcenters', fields: ['name', 'code'] },
    part_numbers: { table: 'part_numbers', fields: ['part_number', 'description'] },
    customers: { table: 'customers', fields: ['name', 'code'] },
    inspection_items: { table: 'inspection_items', fields: ['name', 'description'] }
  };

  const config = entityConfig[entityKey];
  if (!config) {
    return res.status(404).send('<div>Entity not found</div>');
  }

  try {
    const insertData = {};
    config.fields.forEach(field => {
      if (req.body[field]) {
        insertData[field] = req.body[field];
      }
    });

    const { error: insertError } = await supabase
      .from(config.table)
      .insert([insertData]);

    if (insertError) throw insertError;

    const { data: items, error: fetchError } = await supabase
      .from(config.table)
      .select('*')
      .eq('is_active', true)
      .order('name');

    if (fetchError) throw fetchError;

    res.send(`
      <div id="${entityKey}-list" class="space-y-3">
        ${items.map(item => `
          <div class="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-5 flex items-center justify-between hover:shadow-lg transition-all border-2 border-transparent hover:border-blue-200">
            <div class="flex-1">
              <div class="flex items-center gap-3 mb-2">
                <span class="font-mono text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded-full font-bold">${item.id.substring(0, 8)}</span>
              </div>
              ${config.fields.map(field => item[field] ? `<p class="font-bold text-gray-800">${item[field]}</p>` : '').join('')}
            </div>
          </div>
        `).join('')}
      </div>
    `);
  } catch (error) {
    console.error('Error creating entity:', error);
    res.status(500).send(`
      <div class="bg-red-50 border-2 border-red-200 rounded-xl p-6 text-center">
        <p class="text-red-700 font-semibold">Error creating item</p>
        <p class="text-sm text-red-600 mt-2">${error.message}</p>
      </div>
    `);
  }
});

app.get('/dmt/list', async (req, res) => {
  try {
    const { data: records, error } = await supabase
      .from('dmt_records')
      .select(`
        *,
        workcenter:workcenters(name),
        part_number:part_numbers(part_number),
        employee:employees(name),
        customer:customers(name),
        inspection_item:inspection_items(name),
        prepared_by:employees!dmt_records_prepared_by_id_fkey(name),
        disposition_approved_by:employees!dmt_records_disposition_approved_by_id_fkey(name)
      `)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.send(`
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

        ${records.length === 0 ? `
          <div class="text-center py-12 text-gray-400">
            <div class="text-4xl mb-2">📭</div>
            <p class="text-lg">No DMT records found</p>
            <button hx-get="/dmt/create" hx-target="#main-content" hx-swap="innerHTML"
                    class="mt-4 bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-6 rounded-lg transition">
              Create First Record
            </button>
          </div>
        ` : `
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
                ${records.map(record => `
                  <tr class="hover:bg-blue-50 transition">
                    <td class="px-6 py-4 text-sm font-mono text-blue-600">${record.id}</td>
                    <td class="px-6 py-4 text-sm text-gray-800">${record.part_number?.part_number || 'N/A'}</td>
                    <td class="px-6 py-4 text-sm text-gray-800">${record.customer?.name || 'N/A'}</td>
                    <td class="px-6 py-4 text-sm text-gray-800">${record.employee?.name || 'N/A'}</td>
                    <td class="px-6 py-4 text-sm text-gray-600">${record.date || 'N/A'}</td>
                    <td class="px-6 py-4">
                      <span class="px-3 py-1 rounded-full text-xs font-semibold ${record.dmt_closed ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}">
                        ${record.dmt_closed ? 'Closed' : 'Open'}
                      </span>
                    </td>
                    <td class="px-6 py-4">
                      <div class="flex gap-2">
                        <button hx-get="/dmt/view/${record.id}" hx-target="#main-content" hx-swap="innerHTML"
                                class="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-1 px-3 rounded transition text-xs">
                          View
                        </button>
                        <button hx-get="/dmt/edit/${record.id}" hx-target="#main-content" hx-swap="innerHTML"
                                class="bg-yellow-500 hover:bg-yellow-600 text-white font-semibold py-1 px-3 rounded transition text-xs">
                          Edit
                        </button>
                        <button hx-delete="/dmt/delete/${record.id}" hx-target="closest tr" hx-swap="outerHTML" hx-confirm="Are you sure you want to delete this DMT record?"
                                class="bg-red-500 hover:bg-red-600 text-white font-semibold py-1 px-3 rounded transition text-xs">
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        `}

        <button hx-get="/home" hx-target="#main-content" hx-swap="innerHTML"
                class="mt-6 bg-gray-500 hover:bg-gray-600 text-white font-semibold py-2 px-6 rounded-lg transition">
          ← Back to Home
        </button>
      </div>
    `);
  } catch (error) {
    console.error('Error loading DMT records:', error);
    res.status(500).send(`
      <div class="bg-red-50 border-2 border-red-200 rounded-xl p-6 text-center">
        <p class="text-red-700 font-semibold">Error loading DMT records</p>
        <p class="text-sm text-red-600 mt-2">${error.message}</p>
      </div>
    `);
  }
});

app.delete('/dmt/delete/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const { error } = await supabase
      .from('dmt_records')
      .update({ is_active: false })
      .eq('id', id);

    if (error) throw error;

    res.send('');
  } catch (error) {
    console.error('Error deleting DMT record:', error);
    res.status(500).send(`
      <div class="bg-red-50 border-2 border-red-200 rounded-xl p-6 text-center">
        <p class="text-red-700 font-semibold">Error deleting DMT record</p>
        <p class="text-sm text-red-600 mt-2">${error.message}</p>
      </div>
    `);
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
