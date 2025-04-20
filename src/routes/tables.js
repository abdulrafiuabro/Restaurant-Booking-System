import express from 'express';
import { createTable,getTablesByBranch,updateTable,getAvailableTables } from '../models/tables.js';

const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const table = await createTable(req.body);
    res.status(201).json(table);
  } catch (err) {
    const status = err.message === 'Branch not found' || err.message.includes('already exists') ? 400 : 500;
    res.status(status).json({ detail: err.message });
  }
});

router.get('/by-branch', async (req, res) => {
    const branch_id = parseInt(req.query.branch_id);
    const limit = parseInt(req.query.limit) || 20;
    const offset = parseInt(req.query.offset) || 0;
  
    try {
      if (isNaN(branch_id)) {
        return res.status(400).json({ detail: "Invalid or missing branch_id" });
      }
  
      const result = await getTablesByBranch(branch_id, limit, offset);
      res.json(result);
    } catch (err) {
      const status = err.message.includes("not found") ? 400 :
                     err.message.includes("No tables") ? 404 : 500;
      res.status(status).json({ detail: err.message });
    }
  });

router.patch('/:table_id', async (req, res) => {
  const table_id = parseInt(req.params.table_id);
  const updateData = req.body;

  if (isNaN(table_id)) {
    return res.status(400).json({ detail: 'Invalid table_id' });
  }

  try {
    const updated = await updateTable(table_id, updateData);
    res.json(updated);
  } catch (err) {
    const status = err.message.includes("not found") ? 404 :
                   err.message.includes("already exists") ? 400 : 500;
    res.status(status).json({ detail: err.message });
  }
});

router.get('/available-tables', async (req, res) => {
    const { branch_id, number_of_persons, start_time, end_time } = req.query;
  
    if (!branch_id || !number_of_persons || !start_time || !end_time) {
      return res.status(400).json({ detail: 'Missing required query parameters' });
    }
  
    try {
      const tables = await getAvailableTables(
        parseInt(branch_id),
        parseInt(number_of_persons),
        start_time,
        end_time
      );
  
      if (tables.length === 0) {
        return res.status(404).json({ detail: 'No available tables found' });
      }
  
      res.json(tables);
    } catch (err) {
      console.error('Error fetching available tables:', err);
      res.status(500).json({ detail: 'Internal server error' });
    }
  });


export default router;
