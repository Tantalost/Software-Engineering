import React, { useState, useEffect } from "react";
import Select from "../common/Select";
import { busCompanyRoutes } from '../../data/busRoutes.js'; 

const EditBusTrip = ({ row, onClose, onSave }) => {
    const formatDateForInput = (isoDate) => {
        if (!isoDate) return "";
        return new Date(isoDate).toISOString().split('T')[0];
    };

    // Helper function to calculate expected departure
    const calculateExpectedDeparture = (arrivalTime, estimationString) => {
        if (!arrivalTime || !estimationString) return "";
        
        let minutesToAdd = 0;
        if (estimationString === "1 hr") minutesToAdd = 60;
        else minutesToAdd = parseInt(estimationString.split(" ")[0]);

        const [hours, minutes] = arrivalTime.split(":").map(Number);
        const date = new Date();
        date.setHours(hours, minutes + minutesToAdd, 0, 0);

        return date.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
    };

    const [form, setForm] = useState({
        id: row.id || row._id,
        templateNo: row.templateno || row.templateNo || "",
        route: row.route || "",
        time: row.rawTime || row.time || "",
        date: formatDateForInput(row.rawDate || row.date),
        company: row.company || "",
        status: row.status || "Pending",
        ticketReferenceNo: row.ticketref === "-" ? "" : (row.ticketReferenceNo || row.ticketref || ""), 
        departureTime: row.rawDepartureTime || row.departureTime || "",
        parkingEstimation: row.parkingEstimation || "10 minutes",
        expectedDeparture: row.expectedDeparture || ""
    });

    // Automatically recalculate the expected departure whenever time or parking estimation changes
    useEffect(() => {
        if (form.time && form.parkingEstimation) {
            const expected = calculateExpectedDeparture(form.time, form.parkingEstimation);
            if (expected !== form.expectedDeparture) {
                setForm(prev => ({ ...prev, expectedDeparture: expected }));
            }
        }
    }, [form.time, form.parkingEstimation]);

    const getTemplates = (companyName) => {
        if (!companyName) return {};
        const key = companyName.toLowerCase();
        if (busCompanyRoutes[key]) return busCompanyRoutes[key];
        const firstWord = key.split(" ")[0];
        if (busCompanyRoutes[firstWord]) return busCompanyRoutes[firstWord];
        return {}; 
    };

    const currentTemplates = getTemplates(form.company);
    
    const handleTemplateChange = (e) => {
        const selectedTemplate = e.target.value;
        setForm(prev => ({
            ...prev,
            templateNo: selectedTemplate,
            route: currentTemplates[selectedTemplate] || "" 
        }));
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-xl rounded-xl bg-white p-6 shadow-lg overflow-y-auto max-h-[90vh]">
                <h3 className="mb-4 text-xl font-bold text-slate-800">Edit Bus Trip</h3>
                
                <div className="space-y-4">
                    
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Company</label>
                        <div className="flex p-1 bg-slate-100 rounded-lg">
                            {["Dindo", "Alga", "Ceres", "Lizamae"].map((comp) => (
                                <button
                                    type="button"
                                    key={comp}
                                    onClick={() => setForm({ 
                                        ...form, 
                                        company: comp, 
                                        templateNo: "",
                                        route: "" 
                                    })}
                                    className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
                                        form.company === comp
                                            ? "bg-white text-emerald-600 shadow-sm"
                                            : "text-slate-500 hover:text-slate-700"
                                    }`}
                                >
                                    {comp}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
    
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Template No</label>
                            <select
                                value={form.templateNo}
                                onChange={handleTemplateChange}
                                className="w-full rounded-lg border border-slate-300 p-2.5 text-sm focus:border-emerald-500 outline-none"
                            >
                                <option value="">Select Template</option>
                                {Object.keys(currentTemplates).map((key) => (
                                    <option key={key} value={key}>{key}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Route</label>
                            <input
                                type="text"
                                value={form.route}
                                readOnly
                                className="w-full rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-sm text-slate-500 cursor-not-allowed"
                            />
                        </div>

                        <div>
                             <label className="block text-sm font-medium text-slate-700 mb-1">Scheduled Time</label>
                             <input 
                                type="time"
                                value={form.time}
                                readOnly 
                                className="w-full rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-sm text-slate-500 cursor-not-allowed"
                             />
                        </div>

                        <div>
                             <label className="block text-sm font-medium text-slate-700 mb-1">Date</label>
                             <input 
                                type="date"
                                value={form.date}
                                readOnly 
                                className="w-full rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-sm text-slate-500 cursor-not-allowed"
                             />
                        </div>

                        {/* NEW FIELD: Parking Estimation */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Parking Est.</label>
                            <select
                                value={form.parkingEstimation}
                                onChange={(e) => setForm({...form, parkingEstimation: e.target.value})}
                                className="w-full rounded-lg border border-slate-300 p-2.5 text-sm focus:border-emerald-500 outline-none"
                            >
                                <option value="10 minutes">10 minutes</option>
                                <option value="20 minutes">20 minutes</option>
                                <option value="30 minutes">30 minutes</option>
                                <option value="40 minutes">40 minutes</option>
                                <option value="50 minutes">50 minutes</option>
                                <option value="1 hr">1 hr</option>
                            </select>
                        </div>

                        {/* NEW FIELD: Expected Departure */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Expected Departure</label>
                            <input
                                type="time"
                                value={form.expectedDeparture}
                                readOnly
                                className="w-full rounded-lg border border-slate-200 bg-emerald-50 text-emerald-700 p-2.5 text-sm cursor-not-allowed font-medium"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Ticket Reference No.</label>
                            <input
                                type="text"
                                value={form.ticketReferenceNo}
                                onChange={(e) => setForm({...form, ticketReferenceNo: e.target.value})}
                                placeholder="Enter reference..."
                                className="w-full rounded-lg border border-slate-300 p-2.5 text-sm focus:border-emerald-500 outline-none"
                            />
                        </div>

                        <div>
                             <label className="block text-sm font-medium text-slate-700 mb-1">Actual Departure</label>
                             <input 
                                type="time"
                                value={form.departureTime}
                                onChange={(e) => setForm({...form, departureTime: e.target.value})}
                                className="w-full rounded-lg border border-slate-300 p-2.5 text-sm focus:border-emerald-500"
                             />
                        </div>

                        <div className="md:col-span-2">
                             <Select 
                                label="Status" 
                                value={form.status} 
                                onChange={(e) => setForm({...form, status: e.target.value})} 
                                options={["Paid", "Pending", "Arrived", "Inactive", "Active"]} 
                             />
                        </div>
                    </div>
                </div>

                <div className="mt-6 flex justify-end gap-3">
                    <button 
                        onClick={onClose} 
                        className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={() => onSave({
                            ...form
                        })} 
                        className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-emerald-700"
                    >
                        Save Changes
                    </button>
                </div>
            </div>
        </div>
    );
};

export default EditBusTrip;