// src/utils/tenantUtils.js
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

export const generateRentStatementPDF = (mockTenant) => {
  const doc = new jsPDF();
  const themeColor = [16, 185, 129]; 
  
  doc.setFontSize(22); doc.setTextColor(...themeColor); doc.setFont("helvetica", "bold"); doc.text("IBT MANAGEMENT", 14, 20);
  doc.setFontSize(10); doc.setTextColor(100); doc.setFont("helvetica", "normal");
  doc.text("Integrated Bus Terminal, Zamboanga City", 14, 26); doc.text("admin@ibt.gov.ph | (062) 991-0000", 14, 31);
  doc.setFillColor(...themeColor); doc.rect(140, 10, 55, 22, 'F');
  doc.setTextColor(255); doc.setFontSize(14); doc.setFont("helvetica", "bold"); doc.text("RENT STATEMENT", 145, 23);
  doc.setTextColor(0); doc.setFontSize(11);
  
  doc.text(`Bill To: ${mockTenant.tenantName || mockTenant.name}`, 14, 50); doc.text(`Slot: ${mockTenant.slotNo}`, 14, 56);
  const dateObj = new Date(); doc.text(`Date: ${dateObj.toLocaleDateString()}`, 140, 50);
  
  const rent = mockTenant.rentAmount || 0; const util = mockTenant.utilityAmount || 0; const total = rent + util;
  
  autoTable(doc, {
    startY: 70,
    head: [['Description', 'Reference', 'Amount']],
    body: [
      ['Rent Fee', `Slot ${mockTenant.slotNo}`, rent.toLocaleString('en-PH')],
      ['Utility - Electricity', 'Fixed Rate', util.toLocaleString('en-PH')],
    ],
    theme: 'grid',
    headStyles: { fillColor: themeColor, textColor: 255, fontStyle: 'bold' },
    foot: [['', 'TOTAL DUE', total.toLocaleString('en-PH')]],
  });
  
  doc.save(`Statement_${mockTenant.tenantName || mockTenant.name}.pdf`);
};