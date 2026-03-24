export const sendBroadcast = async (apiUrl, notifyDraft, targetTenants) => {
    const formData = new FormData();
    formData.append("title", notifyDraft.title);
    formData.append("message", notifyDraft.message);
    formData.append("targetGroup", notifyDraft.targetGroup);
    formData.append("source", "Tenant Lease");

    if (notifyDraft.dueDate) {
        formData.append("dueDate", notifyDraft.dueDate);
    }

    if (notifyDraft.isScheduled && notifyDraft.scheduleTime) {
        formData.append("scheduleTime", notifyDraft.scheduleTime);
    }

    if (notifyDraft.attachment) {
        formData.append("file", notifyDraft.attachment);
    }

    const recipientIds = targetTenants.map(t => t.id || t._id);
    formData.append("recipientIds", JSON.stringify(recipientIds));

    const response = await fetch(`${apiUrl}/notifications/broadcast`, {
        method: 'POST',
        body: formData
    });

    if (!response.ok) throw new Error("Failed to send broadcast");
    return response;
};

export const archiveTenantRecord = async (apiUrl, archiveUrl, rowToArchive, role) => {
    const idToDelete = rowToArchive._id || rowToArchive.id;
    if (!idToDelete) throw new Error("Record ID is missing.");

    const archiveRes = await fetch(archiveUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            type: "Tenant Lease",
            description: `Slot ${rowToArchive.slotNo} - ${rowToArchive.tenantName || rowToArchive.name}`,
            originalData: rowToArchive,
            archivedBy: role
        })
    });
    
    if (!archiveRes.ok) throw new Error("Failed to save to archive");

    const deleteRes = await fetch(`${apiUrl}/tenants/${idToDelete}`, { method: "DELETE" });
    if (!deleteRes.ok) throw new Error("Failed to remove from active list");

    return { success: true };
};

export const requestBulkDeletion = async (apiUrl, selectedIds, records) => {
    const requestPromises = selectedIds.map(async (id) => {
        const item = records.find(r => r.id === id);
        if (!item) return;

        return fetch(`${apiUrl}/deletion-requests`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                itemType: "Tenant Lease",
                itemDescription: `Slot ${item.slotNo} - ${item.tenantName || item.name}`,
                requestedBy: "Tenant Admin",
                originalData: item,
                reason: "Bulk deletion request"
            })
        });
    });

    await Promise.all(requestPromises);
    return { success: true };
};