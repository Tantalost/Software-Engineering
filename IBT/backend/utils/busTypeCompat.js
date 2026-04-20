import mongoose from "mongoose";
import BusType from "../models/BusType.js";

export const DEFAULT_BUS_TYPE_NAME = "Regular";

const escapeRegExp = (value = "") =>
  String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const asString = (value) =>
  typeof value === "string" ? value.trim() : "";

export const normalizeBusTypeForResponse = (value) => {
  if (!value) return DEFAULT_BUS_TYPE_NAME;

  if (typeof value === "object") {
    const rawName = asString(value.name);
    if (rawName) return rawName;

    const rawLegacy = asString(value.busType);
    if (rawLegacy) return rawLegacy;

    return DEFAULT_BUS_TYPE_NAME;
  }

  const raw = asString(value);
  if (!raw) return DEFAULT_BUS_TYPE_NAME;

  // Legacy documents may still contain string names directly.
  if (!mongoose.Types.ObjectId.isValid(raw)) {
    return raw;
  }

  return DEFAULT_BUS_TYPE_NAME;
};

export const normalizeBusTripForResponse = (trip) => {
  const payload = trip?.toObject ? trip.toObject() : trip;
  if (!payload || typeof payload !== "object") return payload;

  return {
    ...payload,
    busType: normalizeBusTypeForResponse(payload.busType),
  };
};

export const normalizeCompanyForResponse = (company) => {
  const payload = company?.toObject ? company.toObject() : company;
  if (!payload || typeof payload !== "object") return payload;

  const buses = Array.isArray(payload.buses)
    ? payload.buses.map((bus) => ({
        ...bus,
        busType: normalizeBusTypeForResponse(bus?.busType),
      }))
    : [];

  return {
    ...payload,
    buses,
  };
};

export const resolveBusTypeId = async (rawValue) => {
  if (rawValue === undefined || rawValue === null) return null;

  if (typeof rawValue === "object") {
    if (rawValue?._id) {
      return resolveBusTypeId(rawValue._id);
    }
    if (rawValue?.name) {
      return resolveBusTypeId(rawValue.name);
    }
  }

  const raw = asString(rawValue);
  if (!raw) return null;

  if (mongoose.Types.ObjectId.isValid(raw)) {
    const byId = await BusType.findById(raw).select("_id").lean();
    if (byId?._id) return byId._id;
  }

  const byName = await BusType.findOne({
    name: new RegExp(`^${escapeRegExp(raw)}$`, "i"),
  })
    .select("_id")
    .lean();

  if (byName?._id) return byName._id;

  // Compatibility fallback: bootstrap missing legacy names into BusType collection.
  try {
    const created = await BusType.create({
      name: raw,
      description: "Auto-created from legacy bus data",
      isActive: true,
    });
    return created._id;
  } catch (_error) {
    const retry = await BusType.findOne({
      name: new RegExp(`^${escapeRegExp(raw)}$`, "i"),
    })
      .select("_id")
      .lean();

    return retry?._id || null;
  }
};
