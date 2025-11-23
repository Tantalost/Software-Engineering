import jsPDF from "jspdf";
import autoTable from "jspdf-autotable"; 

export const generateStatementPDF = (tenant) => {
  const doc = new jsPDF();

  doc.setFontSize(18);
  doc.text("Monthly Rent Statement", 14, 22);

  doc.setFontSize(12);
  doc.text(`Tenant: ${tenant.name}`, 14, 40);
  doc.text(`Slot: ${tenant.slotno}`, 14, 48);
  doc.text(`Date: ${new Date().toLocaleDateString()}`, 14, 56);

  const tableColumn = ["Description", "Due Date", "Amount"];
  const currentMonth = new Date().getMonth() + 1; 
  const tableRows = [
    ["Monthly Rent", `01/${currentMonth}/2025`, "P 5,000.00"],
    ["Utility Fee", `01/${currentMonth}/2025`, "P 500.00"],
  ];

  autoTable(doc, {
    head: [tableColumn],
    body: tableRows,
    startY: 70,
  });
  const finalY = doc.lastAutoTable ? doc.lastAutoTable.finalY : 100;
  
  doc.text("Please pay before the due date to avoid penalties.", 14, finalY + 20);

  doc.save(`${tenant.name}_statement.pdf`);
};