export class QualityForm {
  constructor(container, options = {}) {
    this.container = container;
    this.data = options.data || {};
    this.onSubmit = options.onSubmit || (() => {});
    this.employees = options.employees || [];
  }

  render() {
    this.container.innerHTML = `
      <div class="bg-white rounded-xl shadow-lg p-6">
        <div class="flex items-center gap-3 mb-6">
          <span class="text-3xl">✅</span>
          <h3 class="text-2xl font-bold text-gray-800">Quality</h3>
        </div>

        <form id="quality-form" class="space-y-6">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <!-- Disposition Approved Date -->
            <div>
              <label class="block text-sm font-semibold text-gray-700 mb-2">Disposition Approved Date</label>
              <input type="date" name="disposition_approved_date" value="${this.data.disposition_approved_date || ''}"
                     class="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
            </div>

            <!-- Disposition Approved By -->
            <div>
              <label class="block text-sm font-semibold text-gray-700 mb-2">Disposition Approved By</label>
              <select name="disposition_approved_by_id"
                      class="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Select Employee</option>
                ${this.employees.map(e => `
                  <option value="${e.id}" ${this.data.disposition_approved_by_id === e.id ? 'selected' : ''}>
                    ${e.name}
                  </option>
                `).join('')}
              </select>
            </div>

            <!-- SDR Number -->
            <div>
              <label class="block text-sm font-semibold text-gray-700 mb-2">SDR Number</label>
              <input type="text" name="sdr_number" value="${this.data.sdr_number || ''}"
                     class="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                     placeholder="Enter SDR number">
            </div>

            <!-- SDR Approve Date -->
            <div>
              <label class="block text-sm font-semibold text-gray-700 mb-2">SDR Approve Date</label>
              <input type="date" name="sdr_approve_date" value="${this.data.sdr_approve_date || ''}"
                     class="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
            </div>

            <!-- CAR Closed Date -->
            <div>
              <label class="block text-sm font-semibold text-gray-700 mb-2">CAR Closed Date</label>
              <input type="date" name="car_closed_date" value="${this.data.car_closed_date || ''}"
                     class="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
            </div>
          </div>

          <!-- Checkboxes -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t-2 border-gray-200">
            <!-- DMT Closed -->
            <div class="flex items-center gap-3 p-4 bg-blue-50 rounded-lg">
              <input type="checkbox" name="dmt_closed" id="dmt_closed"
                     ${this.data.dmt_closed ? 'checked' : ''}
                     class="w-5 h-5 text-blue-600 border-2 border-gray-300 rounded focus:ring-2 focus:ring-blue-500">
              <label for="dmt_closed" class="text-sm font-semibold text-gray-800 cursor-pointer">
                DMT Closed
              </label>
            </div>

            <!-- Return -->
            <div class="flex items-center gap-3 p-4 bg-orange-50 rounded-lg">
              <input type="checkbox" name="is_return" id="is_return"
                     ${this.data.is_return ? 'checked' : ''}
                     class="w-5 h-5 text-orange-600 border-2 border-gray-300 rounded focus:ring-2 focus:ring-orange-500">
              <label for="is_return" class="text-sm font-semibold text-gray-800 cursor-pointer">
                Return
              </label>
            </div>
          </div>
        </form>
      </div>
    `;

    return this.getData();
  }

  getData() {
    const form = this.container.querySelector('#quality-form');
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());

    data.dmt_closed = form.querySelector('[name="dmt_closed"]').checked;
    data.is_return = form.querySelector('[name="is_return"]').checked;

    return data;
  }

  validate() {
    const form = this.container.querySelector('#quality-form');
    return form.checkValidity();
  }
}
