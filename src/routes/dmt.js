import { api } from '../lib/api.js';

export async function renderDMTList() {
  try {
    const records = await api.dmtRecords.getAll();

    return `
      <div class="bg-white rounded-xl shadow-xl p-8">
        <div class="flex items-center justify-between mb-6">
          <div class="flex items-center gap-3">
            <span class="text-4xl">📈</span>
            <h2 class="text-3xl font-bold text-gray-800">DMT Records</h2>
          </div>
          <button onclick="window.router.navigate('dmt-create')"
                  class="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold py-3 px-6 rounded-xl shadow-lg transition-all transform hover:scale-105">
            ➕ New DMT Record
          </button>
        </div>

        ${records.length === 0 ? `
          <div class="text-center py-12 text-gray-400">
            <div class="text-4xl mb-2">📭</div>
            <p class="text-lg">No DMT records found</p>
            <button onclick="window.router.navigate('dmt-create')"
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
                        <button onclick="window.router.navigate('dmt-view', '${record.id}')"
                                class="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-1 px-3 rounded transition text-xs">
                          View
                        </button>
                        <button onclick="window.router.navigate('dmt-edit', '${record.id}')"
                                class="bg-yellow-500 hover:bg-yellow-600 text-white font-semibold py-1 px-3 rounded transition text-xs">
                          Edit
                        </button>
                        <button onclick="window.dmtHandlers.delete('${record.id}')"
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

        <button onclick="window.router.navigate('home')"
                class="mt-6 bg-gray-500 hover:bg-gray-600 text-white font-semibold py-2 px-6 rounded-lg transition">
          ← Back to Home
        </button>
      </div>
    `;
  } catch (error) {
    console.error('Error loading DMT records:', error);
    return `
      <div class="bg-red-50 border-2 border-red-200 rounded-xl p-6 text-center">
        <p class="text-red-700 font-semibold">Error loading DMT records</p>
        <p class="text-sm text-red-600 mt-2">${error.message}</p>
      </div>
    `;
  }
}

export async function renderDMTView(id) {
  try {
    const record = await api.dmtRecords.getById(id);

    if (!record) {
      return `
        <div class="bg-red-50 border-2 border-red-200 rounded-xl p-6 text-center">
          <p class="text-red-700 font-semibold">DMT Record not found</p>
          <button onclick="window.router.navigate('dmt-list')"
                  class="mt-4 bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-6 rounded-lg transition">
            Back to List
          </button>
        </div>
      `;
    }

    return `
      <div class="bg-white rounded-xl shadow-xl p-8">
        <div class="flex items-center justify-between mb-6">
          <div class="flex items-center gap-3">
            <span class="text-4xl">📋</span>
            <h2 class="text-3xl font-bold text-gray-800">DMT Record: ${record.id}</h2>
          </div>
          <div class="flex gap-2">
            <button onclick="window.router.navigate('dmt-edit', '${record.id}')"
                    class="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-2 px-6 rounded-lg transition">
              ✏️ Edit
            </button>
            <button onclick="window.router.navigate('dmt-list')"
                    class="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-6 rounded-lg transition">
              ← Back
            </button>
          </div>
        </div>

        <div class="space-y-6">
          <!-- General Information -->
          <div class="bg-blue-50 rounded-lg p-6">
            <h3 class="text-xl font-bold text-gray-800 mb-4">📋 General Information</h3>
            <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div><span class="font-semibold">Workcenter:</span> ${record.workcenter?.name || 'N/A'}</div>
              <div><span class="font-semibold">Part Number:</span> ${record.part_number?.part_number || 'N/A'}</div>
              <div><span class="font-semibold">Operation:</span> ${record.operation || 'N/A'}</div>
              <div><span class="font-semibold">Employee:</span> ${record.employee?.name || 'N/A'}</div>
              <div><span class="font-semibold">Quantity:</span> ${record.qty}</div>
              <div><span class="font-semibold">Customer:</span> ${record.customer?.name || 'N/A'}</div>
              <div><span class="font-semibold">Shop Order:</span> ${record.shop_order || 'N/A'}</div>
              <div><span class="font-semibold">Serial Number:</span> ${record.serial_number || 'N/A'}</div>
              <div><span class="font-semibold">Inspection Item:</span> ${record.inspection_item?.name || 'N/A'}</div>
              <div><span class="font-semibold">Date:</span> ${record.date || 'N/A'}</div>
              <div><span class="font-semibold">Prepared By:</span> ${record.prepared_by?.name || 'N/A'}</div>
            </div>
          </div>

          <!-- Defect Description -->
          <div class="bg-yellow-50 rounded-lg p-6">
            <h3 class="text-xl font-bold text-gray-800 mb-4">📝 Defect Description</h3>
            <div class="mb-4">
              <p class="whitespace-pre-wrap text-gray-700">${record.defect_description || 'No description provided'}</p>
            </div>
            <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div><span class="font-semibold">CAR Type:</span> ${record.car_type?.toUpperCase() || 'N/A'}</div>
              <div><span class="font-semibold">CAR Cycle:</span> ${record.car_cycle || 'N/A'}</div>
              <div><span class="font-semibold">CAR Second Cycle Date:</span> ${record.car_second_cycle_date || 'N/A'}</div>
            </div>
          </div>

          <!-- Quality -->
          <div class="bg-green-50 rounded-lg p-6">
            <h3 class="text-xl font-bold text-gray-800 mb-4">✅ Quality</h3>
            <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div><span class="font-semibold">Disposition Approved Date:</span> ${record.disposition_approved_date || 'N/A'}</div>
              <div><span class="font-semibold">Disposition Approved By:</span> ${record.disposition_approved_by?.name || 'N/A'}</div>
              <div><span class="font-semibold">SDR Number:</span> ${record.sdr_number || 'N/A'}</div>
              <div><span class="font-semibold">SDR Approve Date:</span> ${record.sdr_approve_date || 'N/A'}</div>
              <div><span class="font-semibold">CAR Closed Date:</span> ${record.car_closed_date || 'N/A'}</div>
              <div>
                <span class="font-semibold">DMT Closed:</span>
                <span class="ml-2 px-2 py-1 rounded text-xs ${record.dmt_closed ? 'bg-green-200 text-green-800' : 'bg-gray-200 text-gray-800'}">
                  ${record.dmt_closed ? 'Yes' : 'No'}
                </span>
              </div>
              <div>
                <span class="font-semibold">Return:</span>
                <span class="ml-2 px-2 py-1 rounded text-xs ${record.is_return ? 'bg-orange-200 text-orange-800' : 'bg-gray-200 text-gray-800'}">
                  ${record.is_return ? 'Yes' : 'No'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  } catch (error) {
    console.error('Error loading DMT record:', error);
    return `
      <div class="bg-red-50 border-2 border-red-200 rounded-xl p-6 text-center">
        <p class="text-red-700 font-semibold">Error loading DMT record</p>
        <p class="text-sm text-red-600 mt-2">${error.message}</p>
      </div>
    `;
  }
}
