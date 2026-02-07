import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// ===========================================
// CONFIGURATION
// ===========================================
const COLORS = {
    primary: [0, 51, 102], // #003366 (Dark Navy Blue - from Logo)
    secondary: [0, 168, 89], // #00A859 (Green - from Checkmark)
    accent: [220, 53, 69], // #DC3545 (Red - Alerts)
    text: [33, 37, 41], // #212529 (Dark Gray)
    lightGray: [240, 240, 240], // #F0F0F0
    white: [255, 255, 255]
};

/**
 * Generates a branded PDF report for the FRAMES system.
 * 
 * @param {Object} reportInfo - Metadata about the report
 * @param {Array} tableData - Array of objects for the table
 * @param {string} action - 'download' (default) or 'view' (returns blob URL)
 */
export const generateFramesPDF = async (reportInfo, tableData, action = 'download') => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;

    // --- BRANDING STRIP ---
    // Top Strip (Brand Blue)
    doc.setFillColor(...COLORS.primary);
    doc.rect(0, 0, pageWidth, 15, 'F'); // Thin top bar instead of logo area

    // --- HEADER DESIGN ---
    // 2. Title Section (Centered)
    const titleY = 30; // Moved down slightly below the strip
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.setTextColor(...COLORS.primary);
    doc.text("FRAMES REPORT", 105, titleY, { align: "center" });

    // 3. Report Specifics (Centered below title)
    doc.setFontSize(14);
    doc.setTextColor(...COLORS.secondary);
    doc.text(reportInfo.title.toUpperCase(), 105, titleY + 8, { align: "center" });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(reportInfo.type || "System Generated Report", 105, titleY + 14, { align: "center" });


    // --- CONTEXT BOX (Personal vs Class vs details) ---
    const boxTop = 45;
    const boxHeight = 25;

    // Background for context box
    doc.setFillColor(...COLORS.lightGray);
    doc.roundedRect(14, boxTop, pageWidth - 28, boxHeight, 3, 3, 'F');
    
    // Helper to draw Label (Bold) + Value (Normal)
    const drawField = (label, value, x, y) => {
        doc.setFont("helvetica", "bold");
        doc.text(label, x, y);
        const labelWidth = doc.getTextWidth(label);
        
        doc.setFont("helvetica", "normal");
        doc.text(value || 'N/A', x + labelWidth, y);
    };

    doc.setTextColor(...COLORS.text);
    doc.setFontSize(10);

    // Left Column: Context specific (Name / ID / Class / Scope)
    // Fixed X = 20
    if (reportInfo.category === 'personal') {
        drawField("Name: ", reportInfo.context?.name, 20, boxTop + 10);
        drawField("ID: ", reportInfo.context?.id, 20, boxTop + 18);
    } else if (reportInfo.category === 'class') {
        drawField("Class Code: ", reportInfo.context?.classCode, 20, boxTop + 10);
        drawField("Section: ", reportInfo.context?.section || 'All', 20, boxTop + 18);
    } else {
        drawField("Scope: ", reportInfo.context?.scope || 'System-wide', 20, boxTop + 10);
    }

    // Right Column: Date & Generator Info
    // Dynamic X for Right Alignment of the Block
    const rightEdge = pageWidth - 20;

    // Prepare content
    const dateLabel = "Date Range: ";
    const dateValue = reportInfo.dateRange;
    const genLabel = "Generated: ";
    const genValue = new Date().toLocaleString();

    // Measure widths to find the widest line
    doc.setFont("helvetica", "bold");
    const dateLabelW = doc.getTextWidth(dateLabel);
    const genLabelW = doc.getTextWidth(genLabel);

    doc.setFont("helvetica", "normal");
    const dateValueW = doc.getTextWidth(dateValue);
    const genValueW = doc.getTextWidth(genValue);

    const dateTotalW = dateLabelW + dateValueW;
    const genTotalW = genLabelW + genValueW;

    // Use the max width to determine a common Start X for the block
    const maxBlockW = Math.max(dateTotalW, genTotalW);
    const startX = rightEdge - maxBlockW;

    // Draw Function
    const drawRow = (label, value, y) => {
        doc.setFont("helvetica", "bold");
        doc.text(label, startX, y);
        const lW = doc.getTextWidth(label);
        
        doc.setFont("helvetica", "normal");
        doc.text(value, startX + lW, y);
    };

    drawRow(dateLabel, dateValue, boxTop + 10);
    drawRow(genLabel, genValue, boxTop + 18);


    // --- TABLE ---
    if (tableData && tableData.length > 0) {
        // Dynamic Headers
        const columns = Object.keys(tableData[0]).map(key => ({
            header: key.replace(/_/g, ' ').toUpperCase(),
            dataKey: key
        }));

        autoTable(doc, {
            columns: columns,
            body: tableData,
            startY: boxTop + boxHeight + 10,
            theme: 'grid',
            headStyles: {
                fillColor: COLORS.primary,
                textColor: COLORS.white,
                fontStyle: 'bold',
                halign: 'center'
            },
            alternateRowStyles: {
                fillColor: [248, 249, 250] // Very light gray
            },
            styles: {
                fontSize: 9,
                cellPadding: 3,
                valign: 'middle'
            },
            didParseCell: function (data) {
                // Conditional Formatting for Status
                if (data.section === 'body' && data.column.dataKey.toLowerCase().includes('status')) {
                    const val = data.cell.raw.toLowerCase();
                    if (val.includes('late') || val.includes('risk') || val.includes('absent')) {
                        data.cell.styles.textColor = COLORS.accent;
                        data.cell.styles.fontStyle = 'bold';
                    } else if (val.includes('present') || val.includes('good')) {
                        data.cell.styles.textColor = COLORS.secondary;
                    }
                }
            }
        });
    } else {
        doc.setTextColor(...COLORS.accent);
        doc.text("No data available for this report.", 105, boxTop + boxHeight + 20, { align: 'center' });
    }

    // --- FOOTER ---
    const footerY = pageHeight - 10;
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text("Generated by FRAMES - Facial Recognition Attendance Management Educational System", pageWidth / 2, footerY, { align: 'center' });

    // Output
    if (action === 'view') {
        return doc.output('bloburl'); // Returns a blob URI that can be used in an iframe
    } else {
        const filename = `${reportInfo.title.replace(/\s+/g, '_')}_${Date.now()}.pdf`;
        doc.save(filename);
    }
};

/**
 * Generates a clean CSV report.
 * 
 * @param {Object} reportInfo - Metadata about the report
 * @param {Array} tableData - Array of objects for the table
 */
export const generateCSV = (reportInfo, tableData) => {
    if (!tableData || tableData.length === 0) {
        alert("No data available to export.");
        return;
    }

    // 1. Create Header Row
    const headers = Object.keys(tableData[0]);
    const headerRow = headers.join(",");

    // 2. Create Data Rows
    const rows = tableData.map(row => {
        return headers.map(fieldName => {
            const data = row[fieldName] ? row[fieldName].toString().replace(/"/g, '""') : ''; // Escape double quotes
            return `"${data}"`; // Wrap in quotes to handle commas/newlines
        }).join(",");
    });

    // 3. Combine
    const csvContent = [headerRow, ...rows].join("\n");

    // 4. Create Blob and Download
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    
    link.setAttribute("href", url);
    link.setAttribute("download", `${reportInfo.title.replace(/\s+/g, '_')}_${Date.now()}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};
