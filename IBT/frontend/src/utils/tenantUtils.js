import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export const calculateGridPosition = (slotName) => {
  if (!slotName) return { row: 0, col: 0 };
  
  const numPart = parseInt(slotName.split('-')[1]); 
  const index = numPart > 100 ? numPart - 101 : numPart - 1; 

  const row = Math.floor(index / 5) + 1;
  const col = (index % 5) + 1;
  
  return { row, col };
};

export const calculateDueAmount = (tenant) => {
  if (tenant.totalAmount !== undefined && tenant.totalAmount !== null) {
    return parseFloat(tenant.totalAmount);
  }

  const rent = parseFloat(tenant.rentAmount) || 0;
  const util = parseFloat(tenant.utilityAmount) || 0;
  const charge = parseFloat(tenant.chargeAmount) || 0;
  const interest = parseFloat(tenant.interestAmount) || 0;

  return rent + util + charge + interest;
};

export const generateRentStatementPDF = (mockTenant) => {
  const doc = new jsPDF();
  const themeColor = [16, 185, 129]; 
  

  doc.setFontSize(22); doc.setTextColor(...themeColor); doc.setFont("helvetica", "bold"); doc.text("IBT MANAGEMENT", 14, 20);
  doc.setFontSize(10); doc.setTextColor(100); doc.setFont("helvetica", "normal");
  doc.text("Integrated Bus Terminal, Zamboanga City", 14, 26); doc.text("admin@ibt.gov.ph | (062) 991-0000", 14, 31);
  doc.setFillColor(...themeColor); doc.rect(140, 10, 55, 22, 'F');
  doc.setTextColor(255); doc.setFontSize(14); doc.setFont("helvetica", "bold"); doc.text("RENT STATEMENT", 145, 23);
  doc.setTextColor(0); doc.setFontSize(11);
  
 
  doc.text(`Bill To: ${mockTenant.tenantName || mockTenant.name}`, 14, 50); 
  doc.text(`Slot: ${mockTenant.slotNo}`, 14, 56);
  const dateObj = new Date(); 
  doc.text(`Date: ${dateObj.toLocaleDateString()}`, 140, 50);
  
 
  const rent = parseFloat(mockTenant.rentAmount) || 0;
  const util = parseFloat(mockTenant.utilityAmount) || 0;
  const charge = parseFloat(mockTenant.chargeAmount) || 0;
  const interest = parseFloat(mockTenant.interestAmount) || 0;
  const total = calculateDueAmount(mockTenant);
  
  const isPermanentTenant = (mockTenant.tenantType || mockTenant.floor || "Permanent") === "Permanent";
  const utilityLabel = isPermanentTenant ? "Utility - Electricity" : "Additional Fees";
  
  
  const tableBody = [
    ['Rent Fee', `Slot ${mockTenant.slotNo}`, `PHP ${rent.toLocaleString(undefined, { minimumFractionDigits: 2 })}`],
    [utilityLabel, 'Fixed Rate', `PHP ${util.toLocaleString(undefined, { minimumFractionDigits: 2 })}`],
  ];

  if (mockTenant.status === 'Overdue' || charge > 0 || interest > 0) {
    if (charge > 0) tableBody.push(['Penalty Charge', 'Overdue Surcharge', `PHP ${charge.toLocaleString(undefined, { minimumFractionDigits: 2 })}`]);
    if (interest > 0) tableBody.push(['Interest Fee', 'Accumulated Interest', `PHP ${interest.toLocaleString(undefined, { minimumFractionDigits: 2 })}`]);
  }
  
  autoTable(doc, {
    startY: 70,
    head: [['Description', 'Reference', 'Amount']],
    body: tableBody,
    theme: 'grid',
    headStyles: { fillColor: themeColor, textColor: 255, fontStyle: 'bold' },
    foot: [['', 'TOTAL DUE', `PHP ${total.toLocaleString(undefined, { minimumFractionDigits: 2 })}`]],
  });
  
  doc.save(`Statement_${mockTenant.slotNo}_${(mockTenant.tenantName || mockTenant.name).replace(/\s+/g, '_')}.pdf`);
};