import DeletionRequest from "../models/DeletionRequest.js";
import TerminalFee from "../models/TerminalFee.js"; 

export const getRequests = async (req, res) => {
  try {
    const requests = await DeletionRequest.find({ status: "pending" }).sort({ createdAt: -1 });
    res.json(requests);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const createRequest = async (req, res) => {
  try {
    const newReq = new DeletionRequest(req.body);
    await newReq.save();
    res.status(201).json(newReq);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

export const handleRequest = async (req, res) => {
  const { id } = req.params;
  const { action, adminRemarks } = req.body; 

  try {
    const request = await DeletionRequest.findById(id);
    if (!request) return res.status(404).json({ error: "Request not found" });

    if (action === "approve") {
        const itemId = request.originalData._id || request.originalData.id;

        if (request.itemType === "Terminal Fee") {
            await TerminalFee.findByIdAndDelete(itemId);
        } 

        request.status = "approved";
    } else {
        request.status = "denied";
    }

    request.adminRemarks = adminRemarks;
    await request.save();

    res.json({ message: `Request ${action}d successfully`, request });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Processing failed" });
  }
};