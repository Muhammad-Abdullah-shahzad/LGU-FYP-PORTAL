import React from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { developers } from '../../config/developerConfig';
import { FaGithub, FaLinkedin, FaInstagram, FaCode, FaEnvelope } from 'react-icons/fa';
import './Developers.css';

const Developers = () => {
    return (
        <DashboardLayout title="Development Team">
            <div className="developers-page-container">
                <div className="developers-header-section text-center mb-5">
                    <div className="dev-icon-badge mb-3">
                        <FaCode size={30} />
                    </div>
                    <h2 className="fw-bold font-outfit">The Minds Behind LGU FYP Portal</h2>
                    <p className="text-muted mx-auto" style={{ maxWidth: '600px' }}>
                        This platform was conceptualized, designed, and developed by a dedicated team of student developers
                        striving to streamline the Final Year Project management process.
                    </p>
                </div>

                <div className="row g-4 justify-content-center">
                    {developers.map((dev, index) => (
                        <div key={index} className="col-12 col-md-6 col-lg-3">
                            <div className="dev-premium-card">
                                <div className="dev-card-inner">
                                    <div className="dev-image-wrapper">
                                        <img src={dev.image} alt={dev.name} className="dev-profile-img" />
                                        <div className="dev-social-overlay">
                                            <a href={dev.github} target="_blank" rel="noopener noreferrer" title="GitHub">
                                                <FaGithub />
                                            </a>
                                            <a href={dev.linkedin} target="_blank" rel="noopener noreferrer" title="LinkedIn">
                                                <FaLinkedin />
                                            </a>
                                            <a href={dev.instagram} target="_blank" rel="noopener noreferrer" title="Instagram">
                                                <FaInstagram />
                                            </a>
                                        </div>
                                    </div>
                                    <div className="dev-content text-center mt-4">
                                        <h4 className="dev-fullname fw-bold mb-1">{dev.name}</h4>
                                        <p className="dev-role-title text-primary small fw-bold text-uppercase tracking-wider mb-1">{dev.role}</p>
                                        {dev.rollNo && (
                                            <p className="text-muted mb-2" style={{ fontSize: '0.7rem', fontWeight: '500', letterSpacing: '0.5px' }}>{dev.rollNo}</p>
                                        )}
                                        <div className="dev-divider mb-3"></div>
                                        <p className="dev-bio text-muted x-small">
                                            Passionate developer focused on creating intuitive digital experiences.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="developers-footer-note mt-5 pt-4 text-center">
                    <div className="note-card p-4 rounded-4 bg-white border shadow-sm">
                        <h6 className="fw-bold mb-2">Technical Queries & Collaboration</h6>
                        <p className="text-muted small mb-0">
                            For technical queries, bug reports, or collaboration opportunities, feel free to contact the team
                            members through their respective social profiles. We value your feedback and contribution to
                            making this system better.
                        </p>
                        <div className="mt-3">
                            <span className="badge bg-light text-muted border px-2 py-1" style={{ fontSize: '0.65rem' }}>v2.1.0 - STABLE RELEASE</span>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default Developers;
