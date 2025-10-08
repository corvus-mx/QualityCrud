import { api } from '../lib/api.js';

export async function renderGeneralInfo() {
  const entities = [
    { key: 'employees', label: 'Employees', icon: '👤', color: 'blue' },
    { key: 'workcenters', label: 'Workcenters', icon: '🏢', color: 'green' },
    { key: 'part_numbers', label: 'Part Numbers', icon: '🔧', color: 'orange' },
    { key: 'customers', label: 'Customers', icon: '🏪', color: 'red' },
    { key: 'inspection_items', label: 'Inspection Items', icon: '🔍', color: 'teal' }
  ];

  return `
    <div class="bg-white rounded-xl shadow-xl p-6">
      <h2 class="text-3xl font-bold text-gray-800 mb-6">General Information Management</h2>
      <div class="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
        ${entities.map(entity => `
          <button onclick="window.router.navigate('${entity.key}')"
                  class="bg-gradient-to-br from-${entity.color}-500 to-${entity.color}-600 hover:from-${entity.color}-600 hover:to-${entity.color}-700 text-white font-semibold py-6 px-4 rounded-xl shadow-lg transition-all transform hover:scale-105">
            <div class="text-3xl mb-2">${entity.icon}</div>
            ${entity.label}
          </button>
        `).join('')}
      </div>
      <button onclick="window.router.navigate('home')"
              class="bg-gray-500 hover:bg-gray-600 text-white font-semibold py-2 px-6 rounded-lg transition">
        ← Back
      </button>
    </div>
  `;
}

export async function renderEntityManager(entityKey) {
  const entityConfig = {
    employees: { label: 'Employee', icon: '👤', apiKey: 'employees', fields: ['name', 'email'] },
    workcenters: { label: 'Workcenter', icon: '🏢', apiKey: 'workcenters', fields: ['name', 'code'] },
    part_numbers: { label: 'Part Number', icon: '🔧', apiKey: 'partNumbers', fields: ['part_number', 'description'] },
    customers: { label: 'Customer', icon: '🏪', apiKey: 'customers', fields: ['name', 'code'] },
    inspection_items: { label: 'Inspection Item', icon: '🔍', apiKey: 'inspectionItems', fields: ['name', 'description'] }
  };

  const config = entityConfig[entityKey];
  if (!config) return '<div>Entity not found</div>';

  try {
    const items = await api[config.apiKey].getAll();

    return `
      <div class="bg-white rounded-xl shadow-xl p-8">
        <div class="flex items-center gap-3 mb-6">
          <span class="text-4xl">${config.icon}</span>
          <h3 class="text-3xl font-bold text-gray-800">${config.label} Management</h3>
        </div>

        <!-- Create Form -->
        <div class="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 mb-6 border-2 border-blue-200">
          <h4 class="font-bold text-gray-800 mb-4 text-lg">➕ Add New ${config.label}</h4>
          <form id="create-${entityKey}-form" class="space-y-3">
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

        <!-- Items List -->
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

        <button onclick="window.router.navigate('general-info')"
                class="mt-6 bg-gray-500 hover:bg-gray-600 text-white font-semibold py-2 px-6 rounded-lg transition">
          ← Back
        </button>
      </div>
    `;
  } catch (error) {
    console.error('Error loading entity:', error);
    return `
      <div class="bg-red-50 border-2 border-red-200 rounded-xl p-6 text-center">
        <p class="text-red-700 font-semibold">Error loading ${config.label}s</p>
        <p class="text-sm text-red-600 mt-2">${error.message}</p>
      </div>
    `;
  }
}
