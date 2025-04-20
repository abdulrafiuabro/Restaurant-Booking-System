import express from "express";
import { createBranch, getBranches, updateBranch, getFilteredBranches, getRecommendedBranches } from "../models/branch.js";

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    // Destructure individual fields from req.body
    const { restaurant_id, city, country, address, location } = req.body;

    // Pass fields individually to the function
    const newBranch = await createBranch(
      restaurant_id,
      city,
      country,
      address,
      location
    );

    res.status(201).json(newBranch);
  } catch (err) {
    if (err.message === "Restaurant not found") {
      return res.status(400).json({ detail: err.message });
    }

    console.error(err);
    res.status(500).json({ detail: "Failed to create branch" });
  }
});

router.get('/', async (req, res) => {
    const { restaurant_id, city, limit = 20, offset = 0 } = req.query;
  
    try {
      const filters = {
        restaurant_id: restaurant_id ? parseInt(restaurant_id) : undefined,
        city,
        limit: parseInt(limit),
        offset: parseInt(offset),
      };
  
      const result = await getBranches(filters);
  
      if (result.branches.length === 0) {
        return res.status(404).json({ detail: "No branches found" });
      }
  
      res.json(result);
    } catch (err) {
      console.error(err);
      res.status(500).json({ detail: "Server error" });
    }
  });

router.patch('/:branch_id', async (req, res) => {
    const branchId = parseInt(req.params.branch_id);
    const updateFields = req.body;
  
    try {
      const updatedBranch = await updateBranch(branchId, updateFields);
      res.json({
        msg: "Branch updated successfully",
        branch: updatedBranch,
      });
    } catch (err) {
      if (err.message === "Branch not found") {
        return res.status(404).json({ detail: err.message });
      }
  
      console.error(err);
      res.status(500).json({ detail: "Failed to update branch" });
    }
  });

  router.get('/list', async (req, res) => {
    try {
      const {
        city,
        cuisine_ids,
        search,
        limit = 20,
        offset = 0,
      } = req.query;
  
      if (!city) {
        return res.status(400).json({ detail: "City is required" });
      }
  
      const cuisineIdsParsed = cuisine_ids
        ? cuisine_ids.split(',').map((id) => parseInt(id.trim())).filter(Boolean)
        : [];
  
      const result = await getFilteredBranches({
        city,
        cuisine_ids: cuisineIdsParsed,
        search,
        limit: parseInt(limit),
        offset: parseInt(offset),
      });
  
      if (result.branches.length === 0) {
        return res.status(404).json({ detail: "No branches found" });
      }
  
      res.json(result);
    } catch (err) {
      console.error(err);
      res.status(500).json({ detail: err.message || "Server error" });
    }
  });

  router.get('/recommendations', async (req, res) => {
    try {
      const { restaurant_id, city, branch_id, limit = 10 } = req.query;
  
      if (!restaurant_id || !city || !branch_id) {
        return res.status(400).json({ detail: "restaurant_id, city, and branch_id are required" });
      }
  
      const recommendations = await getRecommendedBranches({
        restaurant_id: parseInt(restaurant_id),
        city,
        branch_id: parseInt(branch_id),
        limit: parseInt(limit),
      });
  
      if (recommendations.length === 0) {
        return res.status(404).json({ detail: "No recommended branches found" });
      }
  
      res.json(recommendations);
    } catch (err) {
      console.error(err);
      res.status(500).json({ detail: err.message || "Server error" });
    }
  });
  
  export default router;