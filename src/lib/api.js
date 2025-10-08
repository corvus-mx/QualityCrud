import { getDatabase, saveDatabase, generateId } from '../db/schema.js';

function toBoolean(value) {
  return value === 1 || value === true;
}

function fromBoolean(value) {
  return value ? 1 : 0;
}

function exec(query, params = []) {
  const db = getDatabase();
  db.run(query, params);
  saveDatabase();
}

function queryOne(query, params = []) {
  const db = getDatabase();
  const stmt = db.prepare(query);
  stmt.bind(params);
  if (stmt.step()) {
    const row = stmt.getAsObject();
    stmt.free();
    return row;
  }
  stmt.free();
  return null;
}

function queryAll(query, params = []) {
  const db = getDatabase();
  const stmt = db.prepare(query);
  stmt.bind(params);
  const rows = [];
  while (stmt.step()) {
    rows.push(stmt.getAsObject());
  }
  stmt.free();
  return rows;
}

export const api = {
  employees: {
    getAll() {
      const rows = queryAll('SELECT * FROM employees WHERE is_active = 1 ORDER BY name');
      return rows.map(row => ({ ...row, is_active: toBoolean(row.is_active) }));
    },
    create(name, email = null) {
      const id = generateId();
      exec('INSERT INTO employees (id, name, email) VALUES (?, ?, ?)', [id, name, email]);
      const row = queryOne('SELECT * FROM employees WHERE id = ?', [id]);
      return { ...row, is_active: toBoolean(row.is_active) };
    },
    update(id, updates) {
      const fields = [];
      const values = [];

      Object.keys(updates).forEach(key => {
        if (key !== 'id') {
          fields.push(`${key} = ?`);
          values.push(key === 'is_active' ? fromBoolean(updates[key]) : updates[key]);
        }
      });

      fields.push('updated_at = datetime(\'now\')');
      values.push(id);

      exec(`UPDATE employees SET ${fields.join(', ')} WHERE id = ?`, values);

      const row = queryOne('SELECT * FROM employees WHERE id = ?', [id]);
      return { ...row, is_active: toBoolean(row.is_active) };
    },
    delete(id) {
      exec('UPDATE employees SET is_active = 0 WHERE id = ?', [id]);
    }
  },

  workcenters: {
    getAll() {
      const rows = queryAll('SELECT * FROM workcenters WHERE is_active = 1 ORDER BY name');
      return rows.map(row => ({ ...row, is_active: toBoolean(row.is_active) }));
    },
    create(name, code) {
      const id = generateId();
      exec('INSERT INTO workcenters (id, name, code) VALUES (?, ?, ?)', [id, name, code]);
      const row = queryOne('SELECT * FROM workcenters WHERE id = ?', [id]);
      return { ...row, is_active: toBoolean(row.is_active) };
    }
  },

  partNumbers: {
    getAll() {
      const rows = queryAll('SELECT * FROM part_numbers WHERE is_active = 1 ORDER BY part_number');
      return rows.map(row => ({ ...row, is_active: toBoolean(row.is_active) }));
    },
    create(partNumber, description = '') {
      const id = generateId();
      exec('INSERT INTO part_numbers (id, part_number, description) VALUES (?, ?, ?)', [id, partNumber, description]);
      const row = queryOne('SELECT * FROM part_numbers WHERE id = ?', [id]);
      return { ...row, is_active: toBoolean(row.is_active) };
    }
  },

  customers: {
    getAll() {
      const rows = queryAll('SELECT * FROM customers WHERE is_active = 1 ORDER BY name');
      return rows.map(row => ({ ...row, is_active: toBoolean(row.is_active) }));
    },
    create(name, code) {
      const id = generateId();
      exec('INSERT INTO customers (id, name, code) VALUES (?, ?, ?)', [id, name, code]);
      const row = queryOne('SELECT * FROM customers WHERE id = ?', [id]);
      return { ...row, is_active: toBoolean(row.is_active) };
    }
  },

  inspectionItems: {
    getAll() {
      const rows = queryAll('SELECT * FROM inspection_items WHERE is_active = 1 ORDER BY name');
      return rows.map(row => ({ ...row, is_active: toBoolean(row.is_active) }));
    },
    create(name, description = '') {
      const id = generateId();
      exec('INSERT INTO inspection_items (id, name, description) VALUES (?, ?, ?)', [id, name, description]);
      const row = queryOne('SELECT * FROM inspection_items WHERE id = ?', [id]);
      return { ...row, is_active: toBoolean(row.is_active) };
    }
  },

  dmtRecords: {
    getAll() {
      const rows = queryAll(`
        SELECT
          d.*,
          w.name as workcenter_name,
          p.part_number as part_number_value,
          e.name as employee_name,
          c.name as customer_name,
          i.name as inspection_item_name,
          pb.name as prepared_by_name,
          da.name as disposition_approved_by_name
        FROM dmt_records d
        LEFT JOIN workcenters w ON d.workcenter_id = w.id
        LEFT JOIN part_numbers p ON d.part_number_id = p.id
        LEFT JOIN employees e ON d.employee_id = e.id
        LEFT JOIN customers c ON d.customer_id = c.id
        LEFT JOIN inspection_items i ON d.inspection_item_id = i.id
        LEFT JOIN employees pb ON d.prepared_by_id = pb.id
        LEFT JOIN employees da ON d.disposition_approved_by_id = da.id
        WHERE d.is_active = 1
        ORDER BY d.created_at DESC
      `);
      return rows.map(row => ({
        ...row,
        is_active: toBoolean(row.is_active),
        is_return: toBoolean(row.is_return),
        dmt_closed: toBoolean(row.dmt_closed),
        workcenter: row.workcenter_name ? { name: row.workcenter_name } : null,
        part_number: row.part_number_value ? { part_number: row.part_number_value } : null,
        employee: row.employee_name ? { name: row.employee_name } : null,
        customer: row.customer_name ? { name: row.customer_name } : null,
        inspection_item: row.inspection_item_name ? { name: row.inspection_item_name } : null,
        prepared_by: row.prepared_by_name ? { name: row.prepared_by_name } : null,
        disposition_approved_by: row.disposition_approved_by_name ? { name: row.disposition_approved_by_name } : null
      }));
    },
    getById(id) {
      const row = queryOne(`
        SELECT
          d.*,
          w.name as workcenter_name,
          p.part_number as part_number_value,
          e.name as employee_name,
          c.name as customer_name,
          i.name as inspection_item_name,
          pb.name as prepared_by_name,
          da.name as disposition_approved_by_name
        FROM dmt_records d
        LEFT JOIN workcenters w ON d.workcenter_id = w.id
        LEFT JOIN part_numbers p ON d.part_number_id = p.id
        LEFT JOIN employees e ON d.employee_id = e.id
        LEFT JOIN customers c ON d.customer_id = c.id
        LEFT JOIN inspection_items i ON d.inspection_item_id = i.id
        LEFT JOIN employees pb ON d.prepared_by_id = pb.id
        LEFT JOIN employees da ON d.disposition_approved_by_id = da.id
        WHERE d.id = ? AND d.is_active = 1
      `, [id]);

      if (!row) return null;

      return {
        ...row,
        is_active: toBoolean(row.is_active),
        is_return: toBoolean(row.is_return),
        dmt_closed: toBoolean(row.dmt_closed),
        workcenter: row.workcenter_name ? { name: row.workcenter_name } : null,
        part_number: row.part_number_value ? { part_number: row.part_number_value } : null,
        employee: row.employee_name ? { name: row.employee_name } : null,
        customer: row.customer_name ? { name: row.customer_name } : null,
        inspection_item: row.inspection_item_name ? { name: row.inspection_item_name } : null,
        prepared_by: row.prepared_by_name ? { name: row.prepared_by_name } : null,
        disposition_approved_by: row.disposition_approved_by_name ? { name: row.disposition_approved_by_name } : null
      };
    },
    create(record) {
      const fields = Object.keys(record);
      const values = fields.map(f => {
        if (f === 'is_active' || f === 'is_return' || f === 'dmt_closed') {
          return fromBoolean(record[f]);
        }
        return record[f] !== undefined ? record[f] : null;
      });

      const placeholders = fields.map(() => '?').join(', ');
      exec(`INSERT INTO dmt_records (${fields.join(', ')}) VALUES (${placeholders})`, values);

      const row = queryOne('SELECT * FROM dmt_records WHERE id = ?', [record.id]);
      return {
        ...row,
        is_active: toBoolean(row.is_active),
        is_return: toBoolean(row.is_return),
        dmt_closed: toBoolean(row.dmt_closed)
      };
    },
    update(id, updates) {
      const fields = [];
      const values = [];

      Object.keys(updates).forEach(key => {
        if (key !== 'id') {
          fields.push(`${key} = ?`);
          if (key === 'is_active' || key === 'is_return' || key === 'dmt_closed') {
            values.push(fromBoolean(updates[key]));
          } else {
            values.push(updates[key]);
          }
        }
      });

      fields.push('updated_at = datetime(\'now\')');
      values.push(id);

      exec(`UPDATE dmt_records SET ${fields.join(', ')} WHERE id = ?`, values);

      const row = queryOne('SELECT * FROM dmt_records WHERE id = ?', [id]);
      return {
        ...row,
        is_active: toBoolean(row.is_active),
        is_return: toBoolean(row.is_return),
        dmt_closed: toBoolean(row.dmt_closed)
      };
    },
    delete(id) {
      exec('UPDATE dmt_records SET is_active = 0 WHERE id = ?', [id]);
    }
  }
};
