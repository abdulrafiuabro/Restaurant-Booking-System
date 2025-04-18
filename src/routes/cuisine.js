import express from "express";
import { getAllCuisines } from "../models/cuisine.js";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const cuisines = await getAllCuisines();

    if (cuisines.length === 0) {
      return res.status(404).json({ message: "No cuisines found" });
    }

    return res.json(cuisines); // Return all cuisines
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ message: "Error fetching cuisines", error: error.message });
  }
});

export default router;
