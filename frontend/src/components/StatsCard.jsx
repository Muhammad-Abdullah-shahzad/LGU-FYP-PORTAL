import React from 'react';
import './StatsCard.css';

const StatsCard = ({ title, value, icon, color = 'primary', subtitle }) => {
    return (
        <div className={`stats-card h-100 p-0`}>
            <div className="card border-0 shadow-sm rounded-4 overflow-hidden h-100">
                <div className="card-body p-3 position-relative">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                        <div className={`stats-icon-wrapper bg-${color} bg-opacity-10 text-${color} rounded-3 d-flex align-items-center justify-content-center shadow-sm`}>
                            {React.cloneElement(icon, { size: 20 })}
                        </div>
                        {subtitle && <span className="badge bg-light text-secondary border rounded-pill px-2 py-1 fs-8" style={{ fontSize: '0.65rem' }}>{subtitle}</span>}
                    </div>
                    <div>
                        <h6 className="text-secondary fw-semibold mb-1 card-title text-uppercase tracking-wider">{title}</h6>
                        <h4 className="mb-0 fw-bold font-outfit text-dark card-value">{value}</h4>
                    </div>
                    {/* Decorative Background Element */}
                    <div className={`position-absolute bottom-0 end-0 p-2 opacity-05 text-${color}`} style={{ marginBottom: '-10px', marginRight: '-10px', fontSize: '3.5rem', opacity: 0.1, transform: 'rotate(-15deg)' }}>
                        {React.cloneElement(icon, { size: 50 })}
                    </div>
                </div>
                <div className={`stats-accent-bar bg-${color}`}></div>
            </div>
        </div>
    );
};

export default StatsCard;
