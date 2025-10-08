import { generateDMTId } from '../types/dmt.js';

export class GeneralInfoForm {
  constructor(container, options = {}) {
    this.container = container;
    this.data = options.data || {};
    this.onSubmit = options.onSubmit || (() => {});
    this.employees = options.employees || [];
    this.workcenters = options.workcenters || [];
    this.partNumbers = options.partNumbers || [];
    this.customers = options.customers || [];
    this.inspectionItems = options.inspectionItems || [];
  }

  render() {
    const dmtId = this.data.id || generateDMTId();

    this.container.innerHTML = `
      <div class="bg-white rounded-xl shadow-lg p-6">
        <div class="flex items-center gap-3 mb-6">
          <span class="text-3xl">📋</span>
          <h3 class="text-2xl font-bold text-gray-800">General Information</h3>
        </div>

        <form id="general-info-form" class="space-y-6">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <!-- DMT ID -->
            <div>
              <label class="block text-sm font-semibold text-gray-700 mb-2">DMT ID</label>
              <input type="text" name="id" value="${dmtId}"
                     class="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                     required>
              <p class="text-xs text-gray-500 mt-1">Auto-generated, but editable</p>
            </div>

            <!-- Workcenter -->
            <div>
              <label class="block text-sm font-semibold text-gray-700 mb-2">Workcenter *</label>
              <select name="workcenter_id"
                      class="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required>
                <option value="">Select Workcenter</option>
                ${this.workcenters.map(w => `
                  <option value="${w.id}" ${this.data.workcenter_id === w.id ? 'selected' : ''}>
                    ${w.name} (${w.code})
                  </option>
                `).join('')}
              </select>
            </div>

            <!-- Part Number -->
            <div>
              <label class="block text-sm font-semibold text-gray-700 mb-2">Part Number *</label>
              <select name="part_number_id"
                      class="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required>
                <option value="">Select Part Number</option>
                ${this.partNumbers.map(p => `
                  <option value="${p.id}" ${this.data.part_number_id === p.id ? 'selected' : ''}>
                    ${p.part_number}
                  </option>
                `).join('')}
              </select>
            </div>

            <!-- Operation -->
            <div>
              <label class="block text-sm font-semibold text-gray-700 mb-2">Operation</label>
              <input type="text" name="operation" value="${this.data.operation || ''}"
                     class="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
            </div>

            <!-- Employee Name -->
            <div>
              <label class="block text-sm font-semibold text-gray-700 mb-2">Employee Name *</label>
              <select name="employee_id"
                      class="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required>
                <option value="">Select Employee</option>
                ${this.employees.map(e => `
                  <option value="${e.id}" ${this.data.employee_id === e.id ? 'selected' : ''}>
                    ${e.name}
                  </option>
                `).join('')}
              </select>
            </div>

            <!-- Quantity -->
            <div>
              <label class="block text-sm font-semibold text-gray-700 mb-2">Quantity</label>
              <input type="number" name="qty" value="${this.data.qty || 0}" min="0"
                     class="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
            </div>

            <!-- Customer -->
            <div>
              <label class="block text-sm font-semibold text-gray-700 mb-2">Customer *</label>
              <select name="customer_id"
                      class="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required>
                <option value="">Select Customer</option>
                ${this.customers.map(c => `
                  <option value="${c.id}" ${this.data.customer_id === c.id ? 'selected' : ''}>
                    ${c.name} (${c.code})
                  </option>
                `).join('')}
              </select>
            </div>

            <!-- Shop Order -->
            <div>
              <label class="block text-sm font-semibold text-gray-700 mb-2">Shop Order</label>
              <input type="text" name="shop_order" value="${this.data.shop_order || ''}"
                     class="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
            </div>

            <!-- Serial Number -->
            <div>
              <label class="block text-sm font-semibold text-gray-700 mb-2">Serial Number</label>
              <input type="text" name="serial_number" value="${this.data.serial_number || ''}"
                     class="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
            </div>

            <!-- Inspection Item -->
            <div>
              <label class="block text-sm font-semibold text-gray-700 mb-2">Inspection Item *</label>
              <select name="inspection_item_id"
                      class="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required>
                <option value="">Select Inspection Item</option>
                ${this.inspectionItems.map(i => `
                  <option value="${i.id}" ${this.data.inspection_item_id === i.id ? 'selected' : ''}>
                    ${i.name}
                  </option>
                `).join('')}
              </select>
            </div>

            <!-- Date -->
            <div>
              <label class="block text-sm font-semibold text-gray-700 mb-2">Date *</label>
              <input type="date" name="date" value="${this.data.date || new Date().toISOString().split('T')[0]}"
                     class="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                     required>
            </div>

            <!-- Prepared By -->
            <div>
              <label class="block text-sm font-semibold text-gray-700 mb-2">Prepared By *</label>
              <select name="prepared_by_id"
                      class="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required>
                <option value="">Select Employee</option>
                ${this.employees.map(e => `
                  <option value="${e.id}" ${this.data.prepared_by_id === e.id ? 'selected' : ''}>
                    ${e.name}
                  </option>
                `).join('')}
              </select>
            </div>
          </div>
        </form>
      </div>
    `;

    return this.getData();
  }

  getData() {
    const form = this.container.querySelector('#general-info-form');
    const formData = new FormData(form);
    return Object.fromEntries(formData.entries());
  }

  validate() {
    const form = this.container.querySelector('#general-info-form');
    return form.checkValidity();
  }
}
