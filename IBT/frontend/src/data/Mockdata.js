export const mockTenants = [
    {
        id: 1,
        slotNo: "A-101",
        referenceNo: "REF0001",
        tenantType: "Permanent",
        tenantName: "Chaeng Moo",
        email: "mysnchyng23@gmail.com",
        contactNo: "09608876630",
        CollectorName: "John Doe",
        rentAmount: 6000,
        utilityAmount: 500,
        totalAmount: 6500,
        StartDateTime: "2025-10-01 7:00 AM",
        DueDateTime: "2025-11-01 11:59 PM",
        status: "Paid"
    },
 
    {
        id: 2,
        slotNo: "A-102", 
        referenceNo: "REF0002",
        tenantType: "Permanent",
        tenantName: "Boy Bawang",
        email: "boybawang@gmail.com",
        contactNo: "09456789010",
        CollectorName: "John Doe",
        rentAmount: 6000,
        utilityAmount: 300,
        totalAmount: 6300,
        StartDateTime: "2025-10-01 7:00 AM",
        DueDateTime: "2025-11-01 11:59 PM",
        status: "Paid"
    },

    {
        id: 3,
        slotNo: "A-103",
        referenceNo: "REF0003",
        tenantType: "Permanent",
        tenantName: "Snow White",
        email: "snowwhite@gmail.com",
        contactNo: "09349012345",
        CollectorName: "John Doe",
        rentAmount: 6000,
        utilityAmount: 345,
        totalAmount: 6345,
        StartDateTime: "2025-10-01 7:00 AM",
        DueDateTime: "2025-11-01 11:59 PM",
        status: "Paid"
    },

    {
        id: 4,
        slotNo: "A-104",
        referenceNo: "REF0004",
        tenantType: "Permanent",
        tenantName: "Sofia Loren",
        email: "sofialoren@gmail.com",
        contactNo: "09789015674",
        CollectorName: "John Doe",
        rentAmount: 6000,
        utilityAmount: 500,
        totalAmount: 6500,
        StartDateTime: "2025-10-01 7:00 AM",
        DueDateTime: "2025-11-01 11:59 PM",
        status: "Overdue"
    },

    {
        id: 5,
        slotNo: "A-105",
        referenceNo: "REF0005",
        tenantType: "Permanent",
        tenantName: "Justin Bieber",
        email: "justinbieber@gmail.com",
        contactNo: "09608876630",
        CollectorName: "John Doe",
        rentAmount: 6000,
        utilityAmount: 500,
        totalAmount: 6500,
        StartDateTime: "2025-10-01 7:00 AM",
        DueDateTime: "2025-11-01 11:59 PM",
        status: "Overdue"
    },

    {
        id: 6,
        slotNo: "NM-01",
        referenceNo: "REF0006",
        tenantType: "Night Market",
        tenantName: "Selena Gomez",
        email: "selenagomez@gmail.com",
        contactNo: "09504321897",
        CollectorName: "John Doe",
        rentAmount: 1120,
        StartDateTime: "2025-10-01 5:00 PM",
        EndDateTime: "2025-10-07  11:00 PM",
        status: "Paid"
    },

    {
        id: 7,
        slotNo: "NM-02",
        referenceNo: "REF0007",
        tenantType: "Night Market",
        tenantName: "Selena Gomez II",
        email: "selenagomez2@gmail.com",
        contactNo: "09504321897",
        CollectorName: "John Doe",
        rentAmount: 1120,
        StartDateTime: "2025-10-01 5:00 PM",
        EndDateTime: "2025-10-07  11:00 PM",
        status: "Paid"
    },

    {
        id: 8,
        slotNo: "NM-03",
        referenceNo: "REF0008",
        tenantType: "Night Market",
        tenantName: "Eric Bahu",
        email: "ericbahu@gmail.com",
        contactNo: "09504321899",
        CollectorName: "John Doe",
        rentAmount: 1120,
        StartDateTime: "2025-10-01 5:00 PM",
        EndDateTime: "2025-10-07  11:00 PM",
        status: "Overdue"
    },

     {
        id: 9,
        slotNo: "NM-04",
        referenceNo: "REF0009",
        tenantType: "Night Market",
        tenantName: "Jolina Sahiblab",
        email: "jolinasahib@gmail.com",
        contactNo: "09504321813",
        CollectorName: "John Doe",
        rentAmount: 1120,
        StartDateTime: "2025-10-01 5:00 PM",
        EndDateTime: "2025-10-07  11:00 PM",
        status: "Overdue"
    },

    {
        id: 10,
        slotNo: "NM-05",
        referenceNo: "REF0010",
        tenantType: "Night Market",
        tenantName: "Uri Posas",
        email: "uriposas@gmail.com",
        contactNo: "09504321823",
        CollectorName: "John Doe",
        rentAmount: 1120,
        StartDateTime: "2025-10-01 5:00 PM",
        EndDateTime: "2025-10-07  11:00 PM",
        status: "Overdue"
    },
    
];

export const mockWaitlist = [
  {
    id: "w1",
    name: "Carlos Mendoza",
    contact: "09172345678",
    email: "carlos.mendoza@example.com",
    preferredType: "Permanent",
    notes: "Looking for a stall near entrance",
    dateRequested: "2025-11-15T12:00:00Z",
    status: "Pending"
  },
  {
    id: "w2",
    name: "Liza Morales",
    contact: "09173456789",
    email: "liza.morales@example.com",
    preferredType: "Night Market",
    notes: "Requires electricity",
    dateRequested: "2025-11-16T12:00:00Z",
    status: "Pending"
  },
  {
    id: "w3",
    name: "Riza Hontiveros",
    contact: "09173456123",
    email: "rizagengs@example.com",
    preferredType: "Night Market",
    notes: "Requires electricity",
    dateRequested: "2025-11-16T12:00:00Z",
    status: "Pending"
  }
];
