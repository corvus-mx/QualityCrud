import { initDatabase } from './config/supabase.js';
import { Router } from './lib/router.js';
import { api } from './lib/api.js';
import { renderGeneralInfo, renderEntityManager } from './routes/generalInfo.js';
import { renderDMTList, renderDMTView } from './routes/dmt.js';
import { GeneralInfoForm } from './components/GeneralInfoForm.js';
import { DefectDescriptionForm } from './components/DefectDescriptionForm.js';
import { QualityForm } from './components/QualityForm.js';
import { generateDMTId } from './types/dmt.js';

function showToast(message, type = 'success') {
  const colors = {
    success: 'bg-green-500',
    error: 'bg-red-500',
    info: 'bg-blue-500'
  };

  const toast = document.createElement('div');
  toast.className = `${colors[type]} text-white px-6 py-3 rounded-lg shadow-lg mb-2`;
  toast.textContent = message;

  const container = document.getElementById('toast-container');
  container.appendChild(toast);

  setTimeout(() => toast.remove(), 3000);
}

async function renderDMTForm(id = null) {
  try {
    const [employees, workcenters, partNumbers, customers, inspectionItems, existingRecord] = await Promise.all([
      api.employees.getAll(),
      api.workcenters.getAll(),
      api.partNumbers.getAll(),
      api.customers.getAll(),
      api.inspectionItems.getAll(),
      id ? api.dmtRecords.getById(id) : Promise.resolve(null)
    ]);

    const data = existingRecord || {};

    return `
      <div class="bg-white rounded-xl shadow-xl p-8">
        <div class="flex items-center justify-between mb-6">
          <h2 class="text-3xl font-bold text-gray-800">${id ? 'Edit' : 'Create'} DMT Record</h2>
          <button onclick="window.router.navigate('dmt-list')"
                  class="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-6 rounded-lg transition">
            ← Cancel
          </button>
        </div>

        <div class="space-y-6">
          <div id="general-info-container"></div>
          <div id="defect-description-container"></div>
          <div id="quality-container"></div>

          <div class="flex gap-4 pt-6 border-t-2 border-gray-200">
            <button onclick="window.dmtHandlers.save()"
                    class="flex-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold py-4 rounded-xl shadow-lg transition-all transform hover:scale-105">
              💾 ${id ? 'Update' : 'Create'} DMT Record
            </button>
          </div>
        </div>
      </div>
    `;
  } catch (error) {
    console.error('Error rendering DMT form:', error);
    return `
      <div class="bg-red-50 border-2 border-red-200 rounded-xl p-6 text-center">
        <p class="text-red-700 font-semibold">Error loading form</p>
        <p class="text-sm text-red-600 mt-2">${error.message}</p>
      </div>
    `;
  }
}

const routes = {
  home: async () => {
    return `
      <div class="text-center py-12">
        <p class="text-xl text-gray-600">Welcome to the Quality Management System</p>
        <p class="text-gray-500 mt-4">Select an option from the menu above to get started</p>
      </div>
    `;
  },
  'general-info': renderGeneralInfo,
  employees: () => renderEntityManager('employees'),
  workcenters: () => renderEntityManager('workcenters'),
  part_numbers: () => renderEntityManager('part_numbers'),
  customers: () => renderEntityManager('customers'),
  inspection_items: () => renderEntityManager('inspection_items'),
  'dmt-list': renderDMTList,
  'dmt-view': renderDMTView,
  'dmt-create': () => renderDMTForm(),
  'dmt-edit': (id) => renderDMTForm(id)
};

const container = document.getElementById('main-content');
const router = new Router(routes, container);

window.router = router;

let generalInfoForm, defectDescriptionForm, qualityForm;

window.dmtHandlers = {
  async initForms() {
    const [employees, workcenters, partNumbers, customers, inspectionItems] = await Promise.all([
      api.employees.getAll(),
      api.workcenters.getAll(),
      api.partNumbers.getAll(),
      api.customers.getAll(),
      api.inspectionItems.getAll()
    ]);

    const currentId = router.params;
    const existingRecord = currentId ? await api.dmtRecords.getById(currentId) : null;

    generalInfoForm = new GeneralInfoForm(
      document.getElementById('general-info-container'),
      {
        data: existingRecord || {},
        employees,
        workcenters,
        partNumbers,
        customers,
        inspectionItems
      }
    );

    defectDescriptionForm = new DefectDescriptionForm(
      document.getElementById('defect-description-container'),
      { data: existingRecord || {} }
    );

    qualityForm = new QualityForm(
      document.getElementById('quality-container'),
      { data: existingRecord || {}, employees }
    );

    generalInfoForm.render();
    defectDescriptionForm.render();
    qualityForm.render();
  },

  async save() {
    try {
      if (!generalInfoForm || !defectDescriptionForm || !qualityForm) {
        showToast('Forms not initialized', 'error');
        return;
      }

      if (!generalInfoForm.validate()) {
        showToast('Please fill in all required fields in General Information', 'error');
        return;
      }

      if (!defectDescriptionForm.validate()) {
        showToast('Please fill in all required fields in Defect Description', 'error');
        return;
      }

      const generalData = generalInfoForm.getData();
      const defectData = defectDescriptionForm.getData();
      const qualityData = qualityForm.getData();

      const recordData = {
        ...generalData,
        ...defectData,
        ...qualityData
      };

      Object.keys(recordData).forEach(key => {
        if (recordData[key] === '' || recordData[key] === null) {
          delete recordData[key];
        }
      });

      const currentId = router.params;

      if (currentId) {
        await api.dmtRecords.update(currentId, recordData);
        showToast('DMT Record updated successfully!', 'success');
      } else {
        await api.dmtRecords.create(recordData);
        showToast('DMT Record created successfully!', 'success');
      }

      setTimeout(() => router.navigate('dmt-list'), 1000);
    } catch (error) {
      console.error('Error saving DMT record:', error);
      showToast(`Error: ${error.message}`, 'error');
    }
  },

  async delete(id) {
    if (!confirm('Are you sure you want to delete this DMT record?')) {
      return;
    }

    try {
      await api.dmtRecords.delete(id);
      showToast('DMT Record deleted successfully!', 'success');
      router.refresh();
    } catch (error) {
      console.error('Error deleting DMT record:', error);
      showToast(`Error: ${error.message}`, 'error');
    }
  }
};

document.addEventListener('submit', async (e) => {
  if (e.target.id && e.target.id.startsWith('create-')) {
    e.preventDefault();

    const entityKey = e.target.id.replace('create-', '').replace('-form', '');
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());

    const entityMap = {
      employees: 'employees',
      workcenters: 'workcenters',
      part_numbers: 'partNumbers',
      customers: 'customers',
      inspection_items: 'inspectionItems'
    };

    try {
      const apiKey = entityMap[entityKey];
      if (apiKey === 'employees') {
        await api[apiKey].create(data.name, data.email || null);
      } else if (apiKey === 'workcenters' || apiKey === 'customers') {
        await api[apiKey].create(data.name, data.code);
      } else if (apiKey === 'partNumbers') {
        await api[apiKey].create(data.part_number, data.description || '');
      } else if (apiKey === 'inspectionItems') {
        await api[apiKey].create(data.name, data.description || '');
      }

      showToast('Item created successfully!', 'success');
      e.target.reset();
      router.refresh();
    } catch (error) {
      console.error('Error creating item:', error);
      showToast(`Error: ${error.message}`, 'error');
    }
  }
});

(async () => {
  await initDatabase();
  router.navigate('home');
})();

let lastRoute = null;
setInterval(() => {
  if (router.currentRoute !== lastRoute) {
    lastRoute = router.currentRoute;
    if (router.currentRoute === 'dmt-create' || router.currentRoute === 'dmt-edit') {
      setTimeout(() => {
        window.dmtHandlers.initForms();
      }, 100);
    }
  }
}, 200);
