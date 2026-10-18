import React from 'react';
import { aboutModalStyles } from './DynamicStyles';

const AboutModal = ({ onClose }) => (
  <div style={aboutModalStyles.overlay}>
    <div style={aboutModalStyles.container}>
      <div style={aboutModalStyles.leftContent}>
        <div style={aboutModalStyles.pillBadge}>⚗️ About Lab.Flow</div>
        <h2 style={aboutModalStyles.heading}>
          About <span style={{ color: '#2563eb' }}>Lab.Flow</span>
        </h2>
        <p style={aboutModalStyles.subText}>
          Lab.Flow is a modern, streamlined laboratory resource management system designed to simplify equipment reservations, track usage in real-time, and provide automated asset control for educational institutions.
        </p>
        <div style={aboutModalStyles.miniGrid}>
          <div className="modal-feature-card" style={aboutModalStyles.miniCard}>
            <div style={{ ...aboutModalStyles.iconBoxCircle, backgroundColor: '#2563eb', color: '#ffffff' }}>⚗️</div>
            <div>
              <h5 style={aboutModalStyles.miniCardTitle}>Our Mission</h5>
              <p style={aboutModalStyles.miniCardDesc}>To provide an efficient and reliable platform for managing laboratory resources.</p>
            </div>
          </div>
          <div className="modal-feature-card" style={aboutModalStyles.miniCard}>
            <div style={{ ...aboutModalStyles.iconBoxCircle, backgroundColor: '#9333ea', color: '#ffffff' }}>🎯</div>
            <div>
              <h5 style={aboutModalStyles.miniCardTitle}>Our Vision</h5>
              <p style={aboutModalStyles.miniCardDesc}>To build a smarter, more connected lab environment for future innovators.</p>
            </div>
          </div>
          <div className="modal-feature-card" style={aboutModalStyles.miniCard}>
            <div style={{ ...aboutModalStyles.iconBoxCircle, backgroundColor: '#16a34a', color: '#ffffff' }}>👥</div>
            <div>
              <h5 style={aboutModalStyles.miniCardTitle}>Who We Serve</h5>
              <p style={aboutModalStyles.miniCardDesc}>Students, lecturers, researchers, and laboratory administrators.</p>
            </div>
          </div>
          <div className="modal-feature-card" style={aboutModalStyles.miniCard}>
            <div style={{ ...aboutModalStyles.iconBoxCircle, backgroundColor: '#d97706', color: '#ffffff' }}>⚙️</div>
            <div>
              <h5 style={aboutModalStyles.miniCardTitle}>Our Values</h5>
              <p style={aboutModalStyles.miniCardDesc}>Efficiency, transparency, innovation, and support for education.</p>
            </div>
          </div>
        </div>
        <div style={{ marginTop: '24px', fontSize: '12px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span>🔬</span> <strong>Lab.Flow</strong> | Smarter Labs. Brighter Futures.
        </div>
      </div>
      <div style={aboutModalStyles.rightImageContainer}>
        <button onClick={onClose} style={aboutModalStyles.closeBtn}>✕</button>
        <img src="https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80" alt="Embedded Lab Testing" style={aboutModalStyles.pcbImage} />
        <div style={aboutModalStyles.darkStatsOverlay}>
          <p style={{ margin: '0 0 16px 0', fontSize: '13px', fontStyle: 'italic', opacity: 0.9 }}>
            "Empowering education through better lab management."
          </p>
          <div style={aboutModalStyles.statsRow}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '18px' }}>⚗️</div>
              <div style={{ fontSize: '18px', fontWeight: '900', margin: '2px 0' }}>100+</div>
              <div style={{ fontSize: '10px', opacity: 0.8 }}>Equipment Managed</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '18px' }}>📅</div>
              <div style={{ fontSize: '18px', fontWeight: '900', margin: '2px 0' }}>1K+</div>
              <div style={{ fontSize: '10px', opacity: 0.8 }}>Bookings Processed</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '18px' }}>👥</div>
              <div style={{ fontSize: '18px', fontWeight: '900', margin: '2px 0' }}>500+</div>
              <div style={{ fontSize: '10px', opacity: 0.8 }}>Students & Staff</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default AboutModal;