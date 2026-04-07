import Collector from "../models/Collector.js";

const normalizeCollectorName = (value = "") =>
  String(value).trim().replace(/\s+/g, " ");

export const listCollectors = async (req, res) => {
  try {
    const activeOnly = req.query.active === "true";
    const query = activeOnly ? { isActive: true } : {};
    const collectors = await Collector.find(query).sort({ name: 1 });
    return res.json(collectors);
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch collectors." });
  }
};

export const createCollector = async (req, res) => {
  try {
    const name = normalizeCollectorName(req.body.name);
    if (!name) {
      return res.status(400).json({ message: "Collector name is required." });
    }

    const duplicate = await Collector.findOne({
      name: { $regex: `^${name}$`, $options: "i" },
    });
    if (duplicate) {
      return res.status(409).json({ message: "Collector already exists." });
    }

    const collector = await Collector.create({ name, isActive: true });
    return res.status(201).json({ message: "Collector created.", collector });
  } catch (error) {
    return res.status(500).json({ message: "Failed to create collector." });
  }
};

export const updateCollector = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = {};

    if (req.body.name !== undefined) {
      const name = normalizeCollectorName(req.body.name);
      if (!name) {
        return res.status(400).json({ message: "Collector name is required." });
      }
      const duplicate = await Collector.findOne({
        _id: { $ne: id },
        name: { $regex: `^${name}$`, $options: "i" },
      });
      if (duplicate) {
        return res.status(409).json({ message: "Collector already exists." });
      }
      updates.name = name;
    }

    if (req.body.isActive !== undefined) {
      updates.isActive = Boolean(req.body.isActive);
    }

    const collector = await Collector.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    });

    if (!collector) {
      return res.status(404).json({ message: "Collector not found." });
    }

    return res.json({ message: "Collector updated.", collector });
  } catch (error) {
    return res.status(500).json({ message: "Failed to update collector." });
  }
};

export const deleteCollector = async (req, res) => {
  try {
    const collector = await Collector.findByIdAndDelete(req.params.id);
    if (!collector) {
      return res.status(404).json({ message: "Collector not found." });
    }
    return res.json({ message: "Collector deleted." });
  } catch (error) {
    return res.status(500).json({ message: "Failed to delete collector." });
  }
};
