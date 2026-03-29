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

// ===========================================
// HELPER: Draw a section heading
// ===========================================
const _drawSectionHeading = (doc, y, title, pageWidth) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(...COLORS.primary);
    doc.text(title, 14, y);
    // Draw a thin line under the heading
    doc.setDrawColor(...COLORS.primary);
    doc.setLineWidth(0.3);
    doc.line(14, y + 1.5, pageWidth - 14, y + 1.5);
    return y + 6;
};

// ===========================================
// HELPER: Check if we need a page break
// ===========================================
const _ensureSpace = (doc, y, neededHeight) => {
    const pageHeight = doc.internal.pageSize.height;
    if (y + neededHeight > pageHeight - 20) {
        doc.addPage();
        return 20; // top margin of new page
    }
    return y;
};

/**
 * Generates a branded PDF report for the FRAMES system.
 * 
 * @param {Object} reportInfo - Metadata about the report
 * @param {Array} tableData - Array of objects for the table
 * @param {string} action - 'download' (default) or 'view' (returns blob URL)
 * @param {Object} enrichment - Optional enrichment data { summaryMetrics, insights, sessionCountReference, statusDistribution, filters }
 */
export const generateFramesPDF = async (reportInfo, tableData, action = 'download', enrichment = {}) => {
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

    let currentY = boxTop + boxHeight + 8;

    // --- FILTER METADATA (4.3) ---
    if (enrichment.filters) {
        const f = enrichment.filters;
        doc.setFontSize(8);
        doc.setTextColor(120, 120, 120);
        const filterParts = [];
        if (f.reportType) filterParts.push(`Report: ${f.reportType}`);
        if (f.subject) filterParts.push(`Subject: ${f.subject}`);
        if (f.semester) filterParts.push(`Semester: ${f.semester}`);
        if (f.totalRows != null) filterParts.push(`Records: ${f.totalRows}`);
        if (filterParts.length > 0) {
            doc.text(`Filters: ${filterParts.join(' | ')}`, 14, currentY);
            currentY += 5;
        }
    }

    // --- SUMMARY METRICS SECTION (1.3) ---
    const { summaryMetrics, sessionCountReference, insights, statusDistribution } = enrichment;

    if (summaryMetrics && summaryMetrics.length > 0) {
        currentY = _ensureSpace(doc, currentY, 35);
        currentY = _drawSectionHeading(doc, currentY, 'Performance Metrics', pageWidth);

        // Draw metric cards as a compact grid (2 columns)
        doc.setFontSize(9);
        const colWidth = (pageWidth - 28) / 2;

        summaryMetrics.forEach((metric, i) => {
            const col = i % 2;
            if (i > 0 && col === 0) currentY += 14;
            currentY = _ensureSpace(doc, currentY, 14);
            
            const x = 14 + col * colWidth;
            const label = metric.label || metric.name || '';
            const value = metric.display_value || `${parseFloat(metric.value || 0).toFixed(1)}%`;

            doc.setFont("helvetica", "bold");
            doc.setTextColor(...COLORS.text);
            doc.text(`${label}:`, x, currentY);
            const labelW = doc.getTextWidth(`${label}: `);

            // Color code the value
            const numVal = parseFloat(metric.value || 0);
            if (numVal >= 85) doc.setTextColor(...COLORS.secondary);
            else if (numVal >= 70) doc.setTextColor(249, 168, 37); // amber
            else doc.setTextColor(...COLORS.accent);
            
            doc.setFont("helvetica", "bold");
            doc.text(value, x + labelW, currentY);

            // Formula/explanation in small text
            if (metric.formula) {
                doc.setFont("helvetica", "normal");
                doc.setFontSize(7);
                doc.setTextColor(150);
                doc.text(metric.formula, x, currentY + 4);
                doc.setFontSize(9);
            }
        });

        currentY += 18;
    }

    // --- SESSION COUNT REFERENCE ---
    if (sessionCountReference) {
        currentY = _ensureSpace(doc, currentY, 20);
        currentY = _drawSectionHeading(doc, currentY, 'Session Count Reference', pageWidth);

        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.setTextColor(...COLORS.text);

        const ref = sessionCountReference;
        const refLines = [];
        if (ref.report_window) {
            const rw = ref.report_window;
            refLines.push(`Report Window — Attended: ${rw.attended || 0} | Conducted: ${rw.conducted || 0} | Expected: ${rw.expected || 0}`);
        }
        if (ref.semester) {
            const sm = ref.semester;
            refLines.push(`Semester — Attended: ${sm.attended || 0} | Conducted: ${sm.conducted || 0} | Expected: ${sm.expected || 0}`);
        }
        refLines.forEach(line => {
            currentY = _ensureSpace(doc, currentY, 6);
            doc.text(line, 14, currentY);
            currentY += 5;
        });
        currentY += 4;
    }

    // --- STATUS DISTRIBUTION ---
    if (statusDistribution && Object.keys(statusDistribution).length > 0) {
        currentY = _ensureSpace(doc, currentY, 20);
        currentY = _drawSectionHeading(doc, currentY, 'Status Distribution', pageWidth);

        doc.setFontSize(9);
        doc.setTextColor(...COLORS.text);
        doc.setFont("helvetica", "normal");

        const statusEntries = Object.entries(statusDistribution);
        const statusText = statusEntries.map(([k, v]) => `${k}: ${v}`).join('  |  ');
        doc.text(statusText, 14, currentY);
        currentY += 8;
    }

    // --- TABLE ---
    if (tableData && tableData.length > 0) {
        currentY = _ensureSpace(doc, currentY, 30);

        // Dynamic Headers
        const columns = Object.keys(tableData[0]).map(key => ({
            header: key.replace(/_/g, ' ').toUpperCase(),
            dataKey: key
        }));

        autoTable(doc, {
            columns: columns,
            body: tableData,
            startY: currentY,
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

        currentY = doc.lastAutoTable.finalY + 8;
    } else {
        doc.setTextColor(...COLORS.accent);
        doc.text("No data available for this report.", 105, currentY + 10, { align: 'center' });
        currentY += 20;
    }

    // --- INSIGHTS SECTION (1.3) ---
    if (insights && insights.length > 0) {
        currentY = _ensureSpace(doc, currentY, 30);
        currentY = _drawSectionHeading(doc, currentY, 'AI-Generated Insights', pageWidth);

        doc.setFontSize(8);

        insights.forEach((insight, idx) => {
            currentY = _ensureSpace(doc, currentY, 18);
            const title = insight.title || insight.type || `Insight ${idx + 1}`;

            // Title
            doc.setFont("helvetica", "bold");
            doc.setTextColor(...COLORS.primary);
            doc.text(`${idx + 1}. ${title}`, 14, currentY);
            currentY += 4;

            // Analysis text (wrapped)
            const analysisText = insight.analysis || insight.description || '';
            if (analysisText) {
                doc.setFont("helvetica", "normal");
                doc.setTextColor(...COLORS.text);
                const lines = doc.splitTextToSize(analysisText, pageWidth - 32);
                lines.forEach(line => {
                    currentY = _ensureSpace(doc, currentY, 5);
                    doc.text(line, 18, currentY);
                    currentY += 3.5;
                });
            }

            // Confidence level
            if (insight.confidence) {
                doc.setFont("helvetica", "italic");
                doc.setTextColor(150);
                doc.text(`Confidence: ${insight.confidence}`, 18, currentY + 1);
                currentY += 4;
            }

            currentY += 3;
        });
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
 * Generates a clean CSV report with optional enrichment data.
 * 
 * @param {Object} reportInfo - Metadata about the report
 * @param {Array} tableData - Array of objects for the table
 * @param {Object} enrichment - Optional enrichment data { summaryMetrics, insights, sessionCountReference, statusDistribution, filters }
 */
export const generateCSV = (reportInfo, tableData, enrichment = {}) => {
    if (!tableData || tableData.length === 0) {
        alert("No data available to export.");
        return;
    }

    const csvLines = [];

    // Report metadata header
    csvLines.push(`"FRAMES Report: ${reportInfo.title}"`);
    csvLines.push(`"Generated: ${new Date().toLocaleString()}"`);
    csvLines.push(`"Date Range: ${reportInfo.dateRange}"`);
    if (enrichment.filters) {
        const f = enrichment.filters;
        if (f.reportType) csvLines.push(`"Report Type: ${f.reportType}"`);
        if (f.subject) csvLines.push(`"Subject: ${f.subject}"`);
        if (f.semester) csvLines.push(`"Semester: ${f.semester}"`);
    }
    csvLines.push(''); // blank line

    // Summary metrics
    const { summaryMetrics, sessionCountReference, insights, statusDistribution } = enrichment;
    if (summaryMetrics && summaryMetrics.length > 0) {
        csvLines.push('"=== Performance Metrics ==="');
        summaryMetrics.forEach(m => {
            const label = m.label || m.name || '';
            const value = m.display_value || `${parseFloat(m.value || 0).toFixed(1)}%`;
            csvLines.push(`"${label}","${value}"`);
        });
        csvLines.push('');
    }

    // Session count reference
    if (sessionCountReference) {
        csvLines.push('"=== Session Count Reference ==="');
        if (sessionCountReference.report_window) {
            const rw = sessionCountReference.report_window;
            csvLines.push(`"Report Window","Attended: ${rw.attended || 0}","Conducted: ${rw.conducted || 0}","Expected: ${rw.expected || 0}"`);
        }
        if (sessionCountReference.semester) {
            const sm = sessionCountReference.semester;
            csvLines.push(`"Semester","Attended: ${sm.attended || 0}","Conducted: ${sm.conducted || 0}","Expected: ${sm.expected || 0}"`);
        }
        csvLines.push('');
    }

    // Status distribution
    if (statusDistribution && Object.keys(statusDistribution).length > 0) {
        csvLines.push('"=== Status Distribution ==="');
        Object.entries(statusDistribution).forEach(([k, v]) => {
            csvLines.push(`"${k}","${v}"`);
        });
        csvLines.push('');
    }

    // Table data
    csvLines.push('"=== Attendance Records ==="');
    const headers = Object.keys(tableData[0]);
    csvLines.push(headers.join(","));

    tableData.forEach(row => {
        const rowStr = headers.map(fieldName => {
            const data = row[fieldName] ? row[fieldName].toString().replace(/"/g, '""') : '';
            return `"${data}"`;
        }).join(",");
        csvLines.push(rowStr);
    });

    // Insights
    if (insights && insights.length > 0) {
        csvLines.push('');
        csvLines.push('"=== AI-Generated Insights ==="');
        insights.forEach((insight, idx) => {
            const title = insight.title || insight.type || `Insight ${idx + 1}`;
            const analysis = (insight.analysis || '').replace(/"/g, '""');
            csvLines.push(`"${idx + 1}. ${title}","${analysis}"`);
        });
    }

    // Create Blob and Download
    const csvContent = csvLines.join("\n");
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
