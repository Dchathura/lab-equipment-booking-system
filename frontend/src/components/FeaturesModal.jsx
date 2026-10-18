import React from 'react';
import { modalStyles } from './DynamicStyles';

const FeaturesModal = ({ onClose }) => (
  <div style={modalStyles.overlay}>
    <div style={modalStyles.container}>
      <div style={modalStyles.headerBanner}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', width: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={modalStyles.microscopeIconCircle}>🔬</div>
            <div>
              <div style={{ fontSize: '11px', fontWeight: '800', color: '#38bdf8', letterSpacing: '1px' }}>LAB.FLOW</div>
              <h2 style={{ margin: '2px 0 6px 0', fontSize: '26px', color: '#ffffff', fontWeight: '900' }}>System Features</h2>
              <p style={{ margin: 0, color: '#94a3b8', fontSize: '13px' }}>
                Everything you need to efficiently manage laboratory equipment, reservations, users and daily operations.
              </p>
            </div>
          </div>
          <button onClick={onClose} style={modalStyles.closeBtn}>✕</button>
        </div>
      </div>
      <div style={modalStyles.grid}>
        <div className="modal-feature-card" style={modalStyles.card}>
          <div style={{ ...modalStyles.iconBox, backgroundColor: '#2563eb' }}>🔬</div>
          <h4 style={modalStyles.cardTitle}>Equipment Management</h4>
          <p style={modalStyles.cardDesc}>View laboratory equipment, categories, serial numbers and availability.</p>
          <div style={{ ...modalStyles.accentBar, backgroundColor: '#2563eb' }}></div>
        </div>
        <div className="modal-feature-card" style={modalStyles.card}>
          <div style={{ ...modalStyles.iconBox, backgroundColor: '#10b981' }}>📅</div>
          <h4 style={modalStyles.cardTitle}>Smart Reservations</h4>
          <p style={modalStyles.cardDesc}>Reserve equipment by selecting the required date and time with ease.</p>
          <div style={{ ...modalStyles.accentBar, backgroundColor: '#10b981' }}></div>
        </div>
        <div className="modal-feature-card" style={modalStyles.card}>
          <div style={{ ...modalStyles.iconBox, backgroundColor: '#8b5cf6' }}>⚡</div>
          <h4 style={modalStyles.cardTitle}>Real-Time Availability</h4>
          <p style={modalStyles.cardDesc}>Quickly identify available, approved and currently reserved equipment.</p>
          <div style={{ ...modalStyles.accentBar, backgroundColor: '#8b5cf6' }}></div>
        </div>
        <div className="modal-feature-card" style={modalStyles.card}>
          <div style={{ ...modalStyles.iconBox, backgroundColor: '#f59e0b' }}>📊</div>
          <h4 style={modalStyles.cardTitle}>Usage Dashboard</h4>
          <p style={modalStyles.cardDesc}>Monitor bookings, pending requests and equipment usage metrics.</p>
          <div style={{ ...modalStyles.accentBar, backgroundColor: '#f59e0b' }}></div>
        </div>
        <div className="modal-feature-card" style={modalStyles.card}>
          <div style={{ ...modalStyles.iconBox, backgroundColor: '#0284c7' }}>🛡️</div>
          <h4 style={modalStyles.cardTitle}>Secure Access</h4>
          <p style={modalStyles.cardDesc}>Separate Student and Admin access with account authentication.</p>
          <div style={{ ...modalStyles.accentBar, backgroundColor: '#0284c7' }}></div>
        </div>
        <div className="modal-feature-card" style={modalStyles.card}>
          <div style={{ ...modalStyles.iconBox, backgroundColor: '#ec4899' }}>📄</div>
          <h4 style={modalStyles.cardTitle}>Reports & Management</h4>
          <p style={modalStyles.cardDesc}>Admins can manage users, equipment and download daily reports.</p>
          <div style={{ ...modalStyles.accentBar, backgroundColor: '#ec4899' }}></div>
        </div>
      </div>
      <div style={modalStyles.footer}>
        <button onClick={onClose} style={modalStyles.gotItBtn}>Got it →</button>
      </div>
    </div>
  </div>
);

export default FeaturesModal;