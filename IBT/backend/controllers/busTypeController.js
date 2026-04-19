import BusType from "../models/BusType.js";

const normalizeName = (value = "") => String(value).trim();

const escapeRegExp = (value = "") =>
  String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export const getBusTypes = async (req, res) => {
  try {
    const activeOnly = String(req.query.active || "true") !== "false";

    const query = activeOnly ? { isActive: true } : {};

    const busTypes = await BusType.find(query)
      .sort({ name: 1 })
      .select("name description isActive");

    res.status(200).json(busTypes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createBusType = async (req, res) => {
  try {
    const name = normalizeName(req.body.name);
    const description = String(req.body.description || "").trim();

    if (!name) {
      return res.status(400).json({ message: "Bus type name is required." });
    }

    const existing = await BusType.findOne({
      name: new RegExp(`^${escapeRegExp(name)}$`, "i"),
    }).select("_id");

    if (existing) {
      return res.status(409).json({ message: "Bus type already exists." });
    }

    const created = await BusType.create({
      name,
      description,
      isActive: req.body.isActive !== undefined ? Boolean(req.body.isActive) : true,
    });

    res.status(201).json(created);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateBusType = async (req, res) => {
  try {
    const { id } = req.params;
    const current = await BusType.findById(id);

    if (!current) {
      return res.status(404).json({ message: "Bus type not found." });
    }

    const nextName =
      req.body.name !== undefined
        ? normalizeName(req.body.name)
        : current.name;

    if (!nextName) {
      return res.status(400).json({ message: "Bus type name is required." });
    }

    const duplicate = await BusType.findOne({
      _id: { $ne: id },
      name: new RegExp(`^${escapeRegExp(nextName)}$`, "i"),
    }).select("_id");

    if (duplicate) {
      return res.status(409).json({ message: "Bus type already exists." });
    }

    current.name = nextName;
    if (req.body.description !== undefined) {
      current.description = String(req.body.description || "").trim();
    }
    if (req.body.isActive !== undefined) {
      current.isActive = Boolean(req.body.isActive);
    }

    const updated = await current.save();
    res.status(200).json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
