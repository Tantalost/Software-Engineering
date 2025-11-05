export const busSchedules = [
  { id: 1, templateNo: "BT-2024-001", route: "Pagadian", time: "6:00 AM - 12:00 PM",  company: "Dindo", status: "Paid", capacity: 45 },
  { id: 2, templateNo: "BT-2024-002", route: "Dipolog", time: "7:30 AM - 10:00 AM", company: "Dindo", status: "Pending", capacity: 45 },
  { id: 3, templateNo: "BT-2024-003", route: "Pagadian", time: "8:00 AM - 2:30 PM", company: "Alga", status: "Paid", capacity: 40 },
  { id: 4, templateNo: "BT-2024-004", route: "Dipolog", time: "9:00 AM - 11:30 AM", company: "Alga", status: "Paid", capacity: 40 },
  { id: 5, templateNo: "BT-2024-005", route: "Dipolog", time: "10:00 AM - 4:00 PM", company: "Dindo", status: "Pending", capacity: 45 },
  { id: 6, templateNo: "BT-2024-006", route: "Pagadian", time: "7:00 AM - 3:00 PM", company: "Alga", status: "Paid", capacity: 40 },
  { id: 7, templateNo: "BT-2024-007", route: "Cagayan", time: "1:00 PM - 4:00 PM", company: "Ceres", status: "Pending", capacity: 40 },
  { id: 8, templateNo: "BT-2024-008", route: "Siocon", time: "5:00 AM - 8:00 AM", company: "Lizamae", status: "Paid", capacity: 35 },
  { id: 9, templateNo: "BT-2024-009", route: "Bukidnon", time: "8:00 PM - 6:00 AM", company: "Ceres", status: "Paid", capacity: 40 },
  { id: 10, templateNo: "BT-2024-010", route: "Pagadian", time: "6:30 AM - 4:30 PM", company: "Dindo", status: "Pending", capacity: 45 },
];

export const lostFoundItems = [
  { id: 1, trackingNo: "2025-0001", description: "Aqua Flask", dateTime: "2025-09-25 : 01:45 AM", status: "Unclaimed" },
  { id: 2, trackingNo: "2025-0002", description: "Bag", dateTime: "2025-09-25 : 05:00 PM", status: "Unclaimed" },
  { id: 3, trackingNo: "2025-0003", description: "Headphone", dateTime: "2025-09-25 : 03:00 PM", status: "Unclaimed" },
  { id: 4, trackingNo: "2025-0004", description: "iPhone 6 Plus", dateTime: "2025-09-25 : 12:28 PM", status: "Unclaimed" },
  { id: 5, trackingNo: "2025-0005", description: "Wallet", dateTime: "2025-09-25 : 11:58 AM", status: "Claimed" },
  { id: 6, trackingNo: "2025-0006", description: "Tumbler", dateTime: "2025-09-25 : 9:58 AM", status: "Claimed" },
  { id: 7, trackingNo: "2025-0007", description: "Pouch - Pink", dateTime: "2025-09-25 : 8:46 AM", status: "Claimed" },
  { id: 8, trackingNo: "2025-0008", description: "Shoes - Nike", dateTime: "2025-09-25 : 8:06 AM", status: "Unclaimed" },
];

export const parkingTickets = [
  { id: 1, type: "Car", price: 30.0, time: "09:30 AM", status: "Active", duration: "2h 15m" },
  { id: 2, type: "Car", price: 30.0, time: "10:15 AM", status: "Active", duration: "1h 30m" },
  { id: 3, type: "Car", price: 30.0, time: "08:45 AM", status: "Active", duration: "2h 45m" },
  { id: 4, type: "Motorcycle", price: 10.0, time: "11:20 AM", status: "Active", duration: "45m" },
  { id: 5, type: "Motorcycle", price: 10.0, time: "09:00 AM", status: "Active", duration: "2h 30m" },
  { id: 6, type: "Motorcycle", price: 10.0, time: "10:30 AM", status: "Active", duration: "1h 15m" },
  { id: 7, type: "Motorcycle", price: 10.0, time: "08:15 AM", status: "Completed", duration: "3h 0m" },
  { id: 8, type: "Motorcycle", price: 15.0, time: "11:45 AM", status: "Active", duration: "30m" },
  { id: 9, type: "Car", price: 30.0, time: "07:30 AM", status: "Completed", duration: "4h 15m" },
  { id: 10, type: "Car", price: 30.0, time: "10:00 AM", status: "Active", duration: "1h 45m" },
];

export const tenants = [
  { id: 1, slotNo: 1, referenceNo: "PKG2024001", name: "Sarah Johnson", email: "sarah.johnson@gmail.com", contact: "09171234567", status: "Paid", type: "permanent" },
  { id: 2, slotNo: 2, referenceNo: "PKG2024002", name: "Michael Chen", email: "michael.chen@gmail.com", contact: "09182345678", status: "Paid", type: "permanent" },
  { id: 3, slotNo: 3, referenceNo: "PKG2024003", name: "Emma Williams", email: "emma.williams@gmail.com", contact: "09193456789", status: "Pending", type: "permanent" },
  { id: 4, slotNo: 4, referenceNo: "PKG2024004", name: "James Rodriguez", email: "james.rod@gmail.com", contact: "09204567890", status: "Paid", type: "permanent" },
  { id: 5, slotNo: 5, referenceNo: "PKG2024005", name: "Olivia Martinez", email: "olivia.martinez@gmail.com", contact: "09215678901", status: "Paid", type: "permanent" },
  { id: 6, slotNo: 6, referenceNo: "PKG2024006", name: "David Thompson", email: "david.thompson@gmail.com", contact: "09226789012", status: "Overdue", type: "permanent" },
  { id: 7, slotNo: 7, referenceNo: "PKG2024007", name: "Sophia Garcia", email: "sophia.garcia@gmail.com", contact: "09237890123", status: "Paid", type: "night" },
  { id: 8, slotNo: 8, referenceNo: "PKG2024008", name: "Daniel Lee", email: "daniel.lee@gmail.com", contact: "09248901234", status: "Paid", type: "night" },
  { id: 9, slotNo: 9, referenceNo: "PKG2024009", name: "Isabella Brown", email: "isabella.brown@gmail.com", contact: "09259012345", status: "Paid", type: "permanent" },
  { id: 10, slotNo: 10, referenceNo: "PKG2024010", name: "William Davis", email: "william.davis@gmail.com", contact: "09260123456", status: "Pending", type: "permanent" },
];

export const tickets = [
    { id: 1, ticketNo: 1, passengerType: 'Student', price: 10.00, time: '08:30 AM', date: '2024-11-15' },
    { id: 2, ticketNo: 2, passengerType: 'Student', price: 10.00, time: '08:35 AM', date: '2024-11-15' },
    { id: 3, ticketNo: 3, passengerType: 'Student', price: 10.00, time: '08:42 AM', date: '2024-11-15' },
    { id: 4, ticketNo: 4, passengerType: 'Student', price: 10.00, time: '09:15 AM', date: '2024-11-15' },
    { id: 5, ticketNo: 5, passengerType: 'Student', price: 10.00, time: '09:28 AM', date: '2024-11-15' },
    { id: 6, ticketNo: 6, passengerType: 'Senior Citizen / PWD', price: 10.00, time: '09:45 AM', date: '2024-11-15' },
    { id: 7, ticketNo: 7, passengerType: 'Senior Citizen / PWD', price: 10.00, time: '10:10 AM', date: '2024-11-15' },
    { id: 8, ticketNo: 8, passengerType: 'Regular', price: 15.00, time: '10:25 AM', date: '2024-11-15' },
    { id: 9, ticketNo: 9, passengerType: 'Regular', price: 15.00, time: '10:50 AM', date: '2024-11-15' },
    { id: 10, ticketNo: 10, passengerType: 'Student', price: 10.00, time: '11:15 AM', date: '2024-11-15' },
  ];

export const reports = [
    { id: 'RPT-001', type: 'Bus Fee Report', status: 'Completed', date: '2025-11-01', author: 'Robert Tan' },
    { id: 'RPT-002', type: 'PUJ Parking Report', status: 'Pending', date: '2025-11-02', author: 'Alan Smith' },
    { id: 'RPT-003', type: 'Terminal Fee Report', status: 'Completed', date: '2025-11-03', author: 'Analyn Cruz' },
    { id: 'RPT-004', type: 'PUJ Parking Report', status: 'Pending', date: '2025-11-04', author: 'Bryan Garcia' },
    { id: 'RPT-005', type: 'Bus Trip Report', status: 'Completed', date: '2025-11-05', author: 'Analyn Cruz' },
    { id: 'RPT-006', type: 'Lease Report', status: 'Pending', date: '2025-10-28', author: 'Emma Grhams' },
    { id: 'RPT-007', type: 'Terminal Fee Report', status: 'Completed', date: '2025-11-01', author: 'Ricky Dickson' },
    { id: 'RPT-008', type: 'Bus Fee Report', status: 'Completed', date: '2025-11-02', author: 'Robert Tan' },
  ];
