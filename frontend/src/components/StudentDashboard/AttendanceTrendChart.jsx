import React, { useState, useMemo } from 'react';

/**
 * AttendanceTrendChart — SVG-based line chart showing attendance
 * trends (present / break / absent) over weekly, monthly, or yearly views.
 */
const AttendanceTrendChart = ({ logs }) => {
    // 1. Local State for Filters
    const [timeFilter, setTimeFilter] = useState('MONTHLY');
    const [typeFilter, setTypeFilter] = useState('ALL');
    const [hoveredIndex, setHoveredIndex] = useState(null);

    // 2. Process Data based on Filters (Memoized)
    const chartData = useMemo(() => {
        const safeLogs = logs || [];
        const now = new Date();
        const dataPoints = [];

        if (timeFilter === 'WEEKLY') {
            const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
            for (let i = 6; i >= 0; i--) {
                const d = new Date(now);
                d.setDate(d.getDate() - i);
                const dayStr = days[d.getDay()];
                const dateStr = d.toLocaleDateString();

                const dayLogs = safeLogs.filter(l => new Date(l.timestamp).toLocaleDateString() === dateStr);
                
                dataPoints.push({
                    label: dayStr,
                    present: dayLogs.filter(l => l.action === 'ENTRY' || l.action === 'BREAK_IN').length,
                    absent: 0,
                    break: dayLogs.filter(l => l.action === 'BREAK_OUT').length,
                    total: dayLogs.length
                });
            }

        } else if (timeFilter === 'MONTHLY') {
            const currentMonth = now.getMonth();
            const currentYear = now.getFullYear();
            
            const quarters = [
                { label: 'Week 1', start: 1, end: 7 },
                { label: 'Week 2', start: 8, end: 14 },
                { label: 'Week 3', start: 15, end: 21 },
                { label: 'Week 4', start: 22, end: 31 }
            ];

            quarters.forEach(q => {
                const qLogs = safeLogs.filter(l => {
                    const d = new Date(l.timestamp);
                    return d.getFullYear() === currentYear && 
                           d.getMonth() === currentMonth && 
                           d.getDate() >= q.start && 
                           d.getDate() <= q.end;
                });

                dataPoints.push({
                    label: q.label,
                    present: qLogs.filter(l => l.action === 'ENTRY' || l.action === 'BREAK_IN').length,
                    absent: 0,
                    break: qLogs.filter(l => l.action === 'BREAK_OUT').length,
                    total: qLogs.length
                });
            });

        } else if (timeFilter === 'YEARLY') {
            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            const currentYear = now.getFullYear();

            months.forEach((m, idx) => {
                const mLogs = safeLogs.filter(l => {
                    const d = new Date(l.timestamp);
                    return d.getFullYear() === currentYear && d.getMonth() === idx;
                });

                dataPoints.push({
                    label: m,
                    present: mLogs.filter(l => l.action === 'ENTRY' || l.action === 'BREAK_IN').length,
                    absent: 0,
                    break: mLogs.filter(l => l.action === 'BREAK_OUT').length,
                    total: mLogs.length
                });
            });
        }
        
        // Fallback: show empty-state placeholders when no real logs exist
        if (safeLogs.length === 0) {
            return dataPoints.map(d => ({ ...d, present: 0, break: 0, absent: 0 }));
        }

        return dataPoints;
    }, [logs, timeFilter]);

    // 3. Determine Insight Text
    const insightText = useMemo(() => {
        const total = chartData.reduce((acc, curr) => acc + curr.present, 0);
        if (timeFilter === 'YEARLY') return `Total ${total} attendances recorded this year.`;
        if (timeFilter === 'MONTHLY') return `You have attended ${total} classes this month.`;
        return `Performance for the last 7 days: ${total} present.`;
    }, [chartData, timeFilter]);

    // 4. Chart Rendering Config
    const height = 300; 
    const width = 800;
    const padding = 50; 
    
    const rawMax = Math.max(...chartData.map(d => Math.max(d.present, d.break, d.absent)), 5); 
    const maxVal = Math.ceil(rawMax / 5) * 5; 

    const getCoords = (val, idx) => {
        const x = (idx / (chartData.length - 1 || 1)) * (width - 2 * padding) + padding; 
        const y = height - padding - (val / maxVal) * (height - 2 * padding);
        return { x, y };
    };

    const makePath = (key) => chartData.map((d, i) => {
        const { x, y } = getCoords(d[key], i);
        return (i === 0 ? `M ${x},${y}` : `L ${x},${y}`);
    }).join(' ');

    const colors = {
        present: '#2E7D32',
        break: '#F9A825',
        absent: '#C62828'
    };

    return (
        <div className="card attendance-trend-chart-card">
            {/* TOP BAR: Title + Filters */}
            <div className="trend-chart-header">
                <h3><i className="fas fa-chart-line"></i> Attendance Trends</h3>
                
                <div className="chart-filters-group">
                    <div className="filter-pill-group">
                        {['WEEKLY', 'MONTHLY', 'YEARLY'].map(t => (
                            <button 
                                key={t} 
                                className={`filter-pill ${timeFilter === t ? 'active' : ''}`}
                                onClick={() => setTimeFilter(t)}
                            >
                                {t}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* SECONDARY FILTER: TYPE */}
            <div className="type-filter-bar">
                {['ALL', 'PRESENT', 'ABSENT', 'BREAK'].map(t => (
                    <button 
                         key={t}
                         className={`type-text-btn ${typeFilter === t ? 'active-type' : ''}`}
                         onClick={() => setTypeFilter(t)}
                    >
                        {t}
                    </button>
                ))}
            </div>

            {/* CHART AREA */}
            <div className="svg-chart-container" style={{ height: '250px' }}>
                <svg viewBox={`0 0 ${width} ${height}`} className="trend-svg">
                    <defs>
                        {/* Gradients for Area Fills */}
                        <linearGradient id="gradPresent" x1="0" x2="0" y1="0" y2="1">
                            <stop offset="0%" stopColor={colors.present} stopOpacity="0.4" />
                            <stop offset="100%" stopColor={colors.present} stopOpacity="0" />
                        </linearGradient>
                        <linearGradient id="gradBreak" x1="0" x2="0" y1="0" y2="1">
                            <stop offset="0%" stopColor={colors.break} stopOpacity="0.4" />
                            <stop offset="100%" stopColor={colors.break} stopOpacity="0" />
                        </linearGradient>
                        <linearGradient id="gradAbsent" x1="0" x2="0" y1="0" y2="1">
                            <stop offset="0%" stopColor={colors.absent} stopOpacity="0.4" />
                            <stop offset="100%" stopColor={colors.absent} stopOpacity="0" />
                        </linearGradient>
                        
                        {/* Drop Shadow for Lines */}
                        <filter id="lineShadow" x="-20%" y="-20%" width="140%" height="140%">
                            <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#000" floodOpacity="0.2" />
                        </filter>
                    </defs>

                    {/* Y-Axis Labels & Horizontal Grid Lines */}
                    {[0, 0.25, 0.5, 0.75, 1].map((t, i) => {
                         const val = Math.round(maxVal * t);
                         const y = height - padding - (t * (height - 2 * padding));
                         return (
                            <g key={i}>
                                <line x1={padding} y1={y} x2={width - padding} y2={y} stroke="#f5f5f5" strokeDasharray="5,5" />
                                <text x={padding - 10} y={y + 5} textAnchor="end" fontSize="11" fill="#999" fontWeight="500">{val}</text>
                            </g>
                         );
                    })}
                    
                    {/* Base Axis Line */}
                    <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#ddd" strokeWidth="2" strokeLinecap="round" />

                    {/* PATHS - Render Areas First */}
                    {(typeFilter === 'ALL' || typeFilter === 'ABSENT') && 
                        <path d={`${makePath('absent')} L ${width-padding},${height-padding} L ${padding},${height-padding} Z`} fill="url(#gradAbsent)" stroke="none" />
                    }
                    {(typeFilter === 'ALL' || typeFilter === 'BREAK') && 
                        <path d={`${makePath('break')} L ${width-padding},${height-padding} L ${padding},${height-padding} Z`} fill="url(#gradBreak)" stroke="none" />
                    }
                    {(typeFilter === 'ALL' || typeFilter === 'PRESENT') && 
                        <path d={`${makePath('present')} L ${width-padding},${height-padding} L ${padding},${height-padding} Z`} fill="url(#gradPresent)" stroke="none" />
                    }

                    {/* PATHS - Render Lines on Top */}
                    {(typeFilter === 'ALL' || typeFilter === 'ABSENT') && 
                        <path d={makePath('absent')} fill="none" stroke={colors.absent} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" filter="url(#lineShadow)" />
                    }
                    {(typeFilter === 'ALL' || typeFilter === 'BREAK') && 
                        <path d={makePath('break')} fill="none" stroke={colors.break} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="6,4" />
                    }
                    {(typeFilter === 'ALL' || typeFilter === 'PRESENT') && 
                        <path d={makePath('present')} fill="none" stroke={colors.present} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" filter="url(#lineShadow)" />
                    }

                    {/* POINTS (Hover Layer) */}
                    {chartData.map((d, i) => {
                        const { x: xp, y: yp } = getCoords(d.present, i);
                        const { x: xb, y: yb } = getCoords(d.break, i);
                        const { x: xa, y: ya } = getCoords(d.absent, i);

                        return (
                            <g key={i} onMouseEnter={() => setHoveredIndex(i)} onMouseLeave={() => setHoveredIndex(null)}>
                                {/* Hit Area vertical stripe */}
                                <rect x={xp - (width / chartData.length / 2)} y={0} width={width / chartData.length} height={height} fill="transparent" />
                                
                                {/* X-Axis Label */}
                                <text x={xp} y={height - 15} textAnchor="middle" fill="#777" fontSize="12" fontWeight="500">{d.label}</text>

                                {/* Visible Dots */}
                                {(typeFilter === 'ALL' || typeFilter === 'PRESENT') && <circle cx={xp} cy={yp} r="4" fill={colors.present} stroke="#fff" strokeWidth="2" />}
                                {(typeFilter === 'ALL' || typeFilter === 'BREAK') && <circle cx={xb} cy={yb} r="4" fill={colors.break} stroke="#fff" strokeWidth="2" />}
                                {(typeFilter === 'ALL' || typeFilter === 'ABSENT') && <circle cx={xa} cy={ya} r="4" fill={colors.absent} stroke="#fff" strokeWidth="2" />}

                                {/* TOOLTIP */}
                                {hoveredIndex === i && (
                                    <g transform={`translate(${xp}, 20)`}>
                                        <rect x="-60" y="-10" width="120" height="70" rx="5" fill="rgba(255,255,255,0.95)" filter="url(#shadow)" stroke="#eee" />
                                        <text x="0" y="10" textAnchor="middle" fontSize="12" fontWeight="bold" fill="#333">{d.label}</text>
                                        <rect x="-50" y="18" width="8" height="8" rx="2" fill={colors.present} />
                                        <text x="-38" y="26" textAnchor="start" fontSize="10" fill="#555">Present: {d.present}</text>
                                        
                                        <rect x="10" y="18" width="8" height="8" rx="2" fill={colors.break} />
                                        <text x="22" y="26" textAnchor="start" fontSize="10" fill="#555">Break: {d.break}</text>

                                        <rect x="-50" y="32" width="8" height="8" rx="2" fill={colors.absent} />
                                        <text x="-38" y="40" textAnchor="start" fontSize="10" fill="#555">Absent: {d.absent}</text>
                                    </g>
                                )}
                            </g>
                        );
                    })}

                    <defs>
                        <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
                            <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#000" floodOpacity="0.15" />
                        </filter>
                    </defs>
                </svg>
            </div>

            {/* BOTTOM: INSIGHTS & LEGEND */}
            <div className="chart-footer">
                <div className="chart-insight">
                    <i className="fas fa-lightbulb"></i> {insightText}
                </div>
                <div className="chart-legends">
                    <div className="legend-item"><span className="dot" style={{background: colors.present}}></span> Present</div>
                    <div className="legend-item"><span className="dot" style={{background: colors.break}}></span> Break</div>
                    <div className="legend-item"><span className="dot" style={{background: colors.absent}}></span> Absent</div>
                </div>
            </div>
        </div>
    );
};

export default AttendanceTrendChart;
