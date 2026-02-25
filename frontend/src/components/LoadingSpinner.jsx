import React from 'react';

const LoadingSpinner = ({ fullPage = false }) => {
    return (
        <div className={`d-flex flex-column align-items-center justify-content-center ${fullPage ? 'min-vh-100' : 'p-5'}`}>
            <div className="spinner-border text-primary" role="status" style={{ width: '3rem', height: '3rem' }}>
                <span className="visually-hidden">Loading...</span>
            </div>
            <p className="mt-3 text-muted fw-bold font-outfit" style={{ letterSpacing: '1px' }}>
                LGU FYP Portal
            </p>
        </div>
    );
};

export default LoadingSpinner;
