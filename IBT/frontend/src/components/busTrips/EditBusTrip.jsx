import React, { useState, useEffect } from "react";
import Select from "../common/Select";
import { ChevronDown } from "lucide-react";

const EditBusTrip = ({ row, onClose, onSave, companyData = [] }) => {
    const formatDateForInput = (isoDate) => {
        if (!isoDate) return "";
        return new Date(isoDate).toISOString().split('T')[0];
    };

    const calculateExpectedDeparture = (arrivalTime, estimationString) => {
        if (!arrivalTime || !estimationString) return "";
        let minutesToAdd = estimationString === "1 hr" ? 60 : parseInt(estimationString.split(" ")[0]);
        const [hours, minutes] = arrivalTime.split(":").map(Number);
        const date = new Date();
        date.setHours(hours, minutes + minutesToAdd, 0, 0);
        return date.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
    };

    const [form, setForm] = useState({
        id: row.id || row._id,
        templateNo: row.templateno || row.templateNo || "",
        route: row.route || "",
        busType: row.busType || "", 
        stopType: row.stopType || "Regular Trip",
        customStopCount: row.customStopCount || "",
        time: row.rawTime || row.time || "",
        date: formatDateForInput(row.rawDate || row.date),
        company: row.company || "",
        status: row.status || "Scheduled", 
        ticketReferenceNo: row.ticketref === "-" ? "" : (row.ticketReferenceNo || row.ticketref || ""), 
        departureTime: row.rawDepartureTime || row.departureTime || "",
        parkingEstimation: row.parkingEstimation || "10 minutes",
        expectedDeparture: row.expectedDeparture || ""
    });

    useEffect(() => {
        if (form.time && form.parkingEstimation) {
            const expected = calculateExpectedDeparture(form.time, form.parkingEstimation);
            if (expected !== form.expectedDeparture) {
                setForm(prev => ({ ...prev, expectedDeparture: expected }));
            }
        }
    }, [form.time, form.parkingEstimation]);

    const activeCompanyObj = companyData.find(c => c.name === form.company);
    const availableBuses = activeCompanyObj?.buses.filter(b => b.busType === form.busType) || [];

    const handlePlateChange = (e) => {
        const selectedPlate = e.target.value;
        const selectedBus = availableBuses.find(b => b.plateNumber === selectedPlate);
        setForm(prev => ({
            ...prev,
            templateNo: selectedPlate,
            route: selectedBus ? selectedBus.route : "" 
        }));
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-2xl rounded-xl bg-white p-6 shadow-lg overflow-y-auto max-h-[90vh]">
                <h3 className="mb-4 text-xl font-bold text-slate-800">Edit Bus Trip</h3>
                
                <div className="space-y-4">
                    
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Company</label>
                        <div className="relative mt-1">
                            <select
                                value={form.company}
                                onChange={(e) => setForm({ ...form, company: e.target.value, busType: "", templateNo: "", route: "" })}
                                className="w-full rounded-lg border border-slate-300 p-2.5 pr-10 text-sm focus:border-emerald-500 outline-none appearance-none cursor-pointer bg-white"
                            >
                                <option value="">Select Company</option>
                                {companyData.map((comp) => (
                                    <option key={comp._id} value={comp.name}>{comp.name}</option>
                                ))}
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center justify-center w-10 border-l border-slate-200 text-slate-500 my-1.5">
                                <ChevronDown size={16} />
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Bus Type</label>
                            <div className="relative mt-1">
                                <select
                                    value={form.busType}
                                    onChange={(e) => setForm({ ...form, busType: e.target.value, templateNo: "", route: "" })}
                                    disabled={!form.company}
                                    className="w-full rounded-lg border border-slate-300 p-2.5 pr-10 text-sm outline-none appearance-none cursor-pointer bg-white disabled:bg-slate-100 disabled:cursor-not-allowed"
                                >
                                    <option value="">Select Type</option>
                                    <option value="Aircon">Aircon</option>
                                    <option value="Regular">Regular</option>
                                </select>
                                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center justify-center w-10 border-l border-slate-200 text-slate-500 my-1.5">
                                    <ChevronDown size={16} />
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Template No</label>
                            <div className="relative mt-1">
                                <select
                                    value={form.templateNo}
                                    onChange={handlePlateChange}
                                    disabled={!form.busType}
                                    className="w-full rounded-lg border border-slate-300 p-2.5 pr-10 text-sm focus:border-emerald-500 outline-none appearance-none cursor-pointer bg-white disabled:bg-slate-100 disabled:cursor-not-allowed"
                                >
                                    <option value="">Select Template</option>
                                    {availableBuses.map((bus) => (
                                        <option key={bus.plateNumber} value={bus.plateNumber}>{bus.plateNumber}</option>
                                    ))}
                                </select>
                                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center justify-center w-10 border-l border-slate-200 text-slate-500 my-1.5">
                                    <ChevronDown size={16} />
                                </div>
                            </div>
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
                            <label className="block text-sm font-medium text-slate-700 mb-1">Stop Type</label>
                            <div className="relative mt-1">
                                <select
                                    value={form.stopType}
                                    onChange={(e) => setForm({
                                        ...form,
                                        stopType: e.target.value,
                                        customStopCount: e.target.value === "Other" ? form.customStopCount : "",
                                    })}
                                    className="w-full rounded-lg border border-slate-300 p-2.5 pr-10 text-sm outline-none appearance-none cursor-pointer bg-white"
                                >
                                    <option value="Regular Trip">Regular Trip</option>
                                    <option value="1-stop">1-stop</option>
                                    <option value="2-stop">2-stop</option>
                                    <option value="3-stop">3-stop</option>
                                    <option value="4-stop">4-stop</option>
                                    <option value="5-stop">5-stop</option>
                                    <option value="6-stop">6-stop</option>
                                    <option value="7-stop">7-stop</option>
                                    <option value="8-stop">8-stop</option>
                                    <option value="9-stop">9-stop</option>
                                    <option value="10-stop">10-stop</option>
                                    <option value="Other">Other</option>
                                </select>
                                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center justify-center w-10 border-l border-slate-200 text-slate-500 my-1.5">
                                    <ChevronDown size={16} />
                                </div>
                            </div>
                        </div>

                        <div>
                             <label className="block text-sm font-medium text-slate-700 mb-1">Scheduled Time</label>
                             <input 
                                type="time"
                                value={form.time}
                                onChange={(e) => setForm({...form, time: e.target.value})}
                                className="w-full rounded-lg border border-slate-300 p-2.5 text-sm focus:border-emerald-500 outline-none"
                             />
                        </div>

                        {form.stopType === "Other" && (
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Custom Stop Count</label>
                                <input
                                    type="number"
                                    min="1"
                                    step="1"
                                    value={form.customStopCount}
                                    onChange={(e) => setForm({ ...form, customStopCount: e.target.value.replace(/[^0-9]/g, "") })}
                                    className="w-full rounded-lg border border-slate-300 p-2.5 text-sm focus:border-emerald-500 outline-none"
                                    placeholder="Enter number of stops"
                                />
                            </div>
                        )}

                        <div>
                             <label className="block text-sm font-medium text-slate-700 mb-1">Date</label>
                             <input 
                                type="date"
                                value={form.date}
                                onChange={(e) => setForm({...form, date: e.target.value})}
                                className="w-full rounded-lg border border-slate-300 p-2.5 text-sm focus:border-emerald-500 outline-none"
                             />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Parking Est.</label>
                            <div className="relative mt-1">
                                <select
                                    value={form.parkingEstimation}
                                    onChange={(e) => setForm({...form, parkingEstimation: e.target.value})}
                                    className="w-full rounded-lg border border-slate-300 p-2.5 pr-10 text-sm focus:border-emerald-500 outline-none appearance-none cursor-pointer bg-white"
                                >
                                    <option value="10 minutes">10 minutes</option>
                                    <option value="20 minutes">20 minutes</option>
                                    <option value="30 minutes">30 minutes</option>
                                    <option value="40 minutes">40 minutes</option>
                                    <option value="50 minutes">50 minutes</option>
                                    <option value="1 hr">1 hr</option>
                                </select>
                                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center justify-center w-10 border-l border-slate-200 text-slate-500 my-1.5">
                                    <ChevronDown size={16} />
                                </div>
                            </div>
                        </div>

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
                                readOnly
                                placeholder="No reference..."
                                className="w-full rounded-lg border border-slate-200 bg-emerald-50 text-emerald-700 p-2.5 text-sm cursor-not-allowed font-medium outline-none"
                            />
                        </div>

                        <div className="md:col-span-2">
                             <Select 
                                label="Status" 
                                value={form.status} 
                                onChange={(e) => setForm({...form, status: e.target.value})} 
                                          options={["Scheduled", "Arrived", "On Fix","Departed"]} 
                             />
                        </div>
                    </div>
                </div>

                <div className="mt-6 flex justify-end gap-3">
                    <button onClick={onClose} className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
                        Cancel
                    </button>
                    <button
                        onClick={() =>
                            onSave({
                                ...form,
                                customStopCount:
                                    form.stopType === "Other" && form.customStopCount
                                        ? Number(form.customStopCount)
                                        : null,
                            })
                        }
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