import { CAR_TYPES } from '../types/dmt.js';

export class DefectDescriptionForm {
  constructor(container, options = {}) {
    this.container = container;
    this.data = options.data || {};
    this.onSubmit = options.onSubmit || (() => {});
  }

  render() {
    this.container.innerHTML = `
      <div class="bg-white rounded-xl shadow-lg p-6">
        <div class="flex items-center gap-3 mb-6">
          <span class="text-3xl">📝</span>
          <h3 class="text-2xl font-bold text-gray-800">Defect Description</h3>
        </div>

        <form id="defect-description-form" class="space-y-6">
          <!-- Defect Description -->
          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-2">Defect Description *</label>
            <textarea name="defect_description" rows="6"
                      class="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
                      placeholder="Enter detailed defect description..."
                      required>${this.data.defect_description || ''}</textarea>
            <p class="text-xs text-gray-500 mt-1">Provide comprehensive details about the defect</p>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <!-- CAR Type -->
            <div>
              <label class="block text-sm font-semibold text-gray-700 mb-2">CAR Type *</label>
              <select name="car_type"
                      class="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required>
                <option value="${CAR_TYPES.DMT}" ${this.data.car_type === CAR_TYPES.DMT ? 'selected' : ''}>DMT</option>
                <option value="${CAR_TYPES.NDMT}" ${this.data.car_type === CAR_TYPES.NDMT ? 'selected' : ''}>NDMT</option>
              </select>
            </div>

            <!-- CAR Cycle -->
            <div>
              <label class="block text-sm font-semibold text-gray-700 mb-2">CAR Cycle</label>
              <input type="number" name="car_cycle" value="${this.data.car_cycle || 1}" min="1"
                     class="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
              <p class="text-xs text-gray-500 mt-1">Current cycle number</p>
            </div>

            <!-- CAR Second Cycle Date -->
            <div class="md:col-span-2">
              <label class="block text-sm font-semibold text-gray-700 mb-2">CAR Second Cycle Date</label>
              <input type="date" name="car_second_cycle_date" value="${this.data.car_second_cycle_date || ''}"
                     class="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
            </div>
          </div>
        </form>
      </div>
    `;

    return this.getData();
  }

  getData() {
    const form = this.container.querySelector('#defect-description-form');
    const formData = new FormData(form);
    return Object.fromEntries(formData.entries());
  }

  validate() {
    const form = this.container.querySelector('#defect-description-form');
    return form.checkValidity();
  }
}
