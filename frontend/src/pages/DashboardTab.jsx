import React, { useState } from 'react';
import { styles } from '../components/DynamicStyles';

const DashboardTab = ({ isAdmin, setActiveTab, handleDownloadReport }) => {
  const [selectedModule, setSelectedModule] = useState(null);

  const moduleDetails = [
    {
      id: 1,
      title: 'Equipment Usage Tips',
      badge: '📈 Signal Analysis',
      img: 'https://i.postimg.cc/xCpwr26b/Equipment-Usage-Tips.jpg',
      description: 'Essential guidelines for handling oscilloscopes, meters, and power supplies correctly to ensure accuracy and prevent hardware damage.',
      details: [
        'Always check probe attenuation (1X / 10X) before taking voltage readings.',
        'Calibrate DSO probes using the 1kHz reference square wave signal.',
        'Never exceed maximum voltage limits specified on input channels.',
        'Ensure proper grounding between oscilloscope probes and test circuits.'
      ]
    },
    {
      id: 2,
      title: 'Laboratory Safety',
      badge: '🌊 Safety',
      img: 'https://i.postimg.cc/TY2XKtD3/safty.jpg',
      description: 'Standard safety protocols, ground isolation checks, and ESD precautions to maintain a secure lab environment during experiments.',
      details: [
        'Wear anti-static ESD wrist straps when handling sensitive semiconductor ICs.',
        'Verify ground isolation prior to powering up high-voltage supply lines.',
        'Keep liquids, conductive items, and loose wire strands away from active test benches.',
        'Locate emergency power cut-off buttons before starting experiments.'
      ]
    },
    {
      id: 3,
      title: 'Before You Start Your Lab',
      badge: '⚙️ Preparation',
      img: 'https://i.postimg.cc/J7vFbmtt/before-u-start-u-lab.jpg',
      description: 'Pre-lab checklist covering circuit verification, component testing, and workspace setup before turning on power sources.',
      details: [
        'Inspect all connection cables, BNC leads, and breadboards for physical wear.',
        'Double-check circuit wiring against schematic diagrams before powering on.',
        'Preset DC power supply voltage limits to match circuit ratings.',
        'Verify component values using a digital multimeter before insertion.'
      ]
    },
    {
      id: 4,
      title: 'Common Lab Mistakes',
      badge: '⚡ Understanding',
      img: 'https://i.postimg.cc/FKHpMn1D/Common-Lab-mis.jpg',
      description: 'Overview of frequent student errors in wiring, grounding, and probe connections, along with quick troubleshooting steps.',
      details: [
        'Short-circuiting DC power supplies by connecting outputs directly to ground.',
        'Connecting oscilloscope ground clips across active non-zero voltage points.',
        'Setting current meters in parallel across voltage sources causing fuse blown errors.',
        'Ignoring floating ground potentials in dual-trace differential measurements.'
      ]
    },
    {
      id: 5,
      title: 'Improve Your Practical Results',
      badge: '📟 Education',
      img: 'https://i.postimg.cc/v8VhwnHd/Improve-your-prac.jpg',
      description: 'Best techniques for noise reduction, probe calibration, and proper signal measurement to achieve precise experimental data.',
      details: [
        'Keep lead wires as short as possible to minimize stray capacitance and RF noise.',
        'Use twisted pair wires for differential signal measurements.',
        'Allow test instruments 5-10 minutes to warm up for thermal stability.',
        'Log data digitally using built-in USB export capabilities for higher precision.'
      ]
    },
    {
      id: 6,
      title: 'Equipment Care & Booking Etiquette',
      badge: '📡 Managing',
      img: 'https://i.postimg.cc/VkDBWB45/Handover.jpg',
      description: 'Rules for returning hardware on time, storing components neatly, and reporting faulty instruments to keep the lab organized.',
      details: [
        'Return all reserved equipment to its designated bench location on or before deadline.',
        'Coil BNC probes and power cords neatly without creating sharp bends.',
        'Immediately notify lab technicians if an instrument malfunctions or blows a fuse.',
        'Leave the lab bench clean and power down all instruments before departure.'
      ]
    }
  ];

  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px', marginBottom: '24px' }}>
        <div style={styles.lightTechCardSection}>
          <h3 style={styles.cardTitleLight}>⚙️ Laboratory Operations & Rules</h3>
          <p style={{ color: '#475569', fontSize: '14px', lineHeight: '1.6', marginBottom: '15px', fontWeight: '500' }}>
            Welcome to the Instrumentation & Automation Tech Lab Management System. Please follow standard operating procedures when handling high-precision equipment.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginTop: '15px' }}>
            <div style={{ padding: '16px', background: 'linear-gradient(135deg, #e0f2fe 0%, #f0f9ff 100%)', borderRadius: '12px', borderLeft: '4px solid #0284c7', border: '1px solid #bae6fd', borderLeftWidth: '4px' }}>
              <h5 style={{ margin: '0 0 5px 0', color: '#0369a1', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '800' }}>
                <span>🛡️</span> Safety Protocols
              </h5>
              <p style={{ margin: 0, color: '#334155', fontSize: '12px', fontWeight: '500' }}>Check ground isolation before powering high-voltage supplies and DSO probes.</p>
            </div>
            <div style={{ padding: '16px', background: 'linear-gradient(135deg, #dcfce7 0%, #f0fdf4 100%)', borderRadius: '12px', borderLeft: '4px solid #16a34a', border: '1px solid #bbf7d0', borderLeftWidth: '4px' }}>
              <h5 style={{ margin: '0 0 5px 0', color: '#15803d', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '800' }}>
                <span>⏱️</span> Calibration Standard
              </h5>
              <p style={{ margin: 0, color: '#334155', fontSize: '12px', fontWeight: '500' }}>All oscilloscopes and signal generators are auto-calibrated monthly.</p>
            </div>
          </div>
        </div>

        <div style={styles.lightTechCardSection}>
          <h3 style={styles.cardTitleLight}>⚡ Quick Actions</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <button onClick={() => setActiveTab('Equipment')} style={{ ...styles.primaryBtn, width: '100%', textAlign: 'left', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'linear-gradient(90deg, #2563eb, #3b82f6)', boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)' }}>
              <span>🔍 Browse Equipment Catalog</span>
              <span>→</span>
            </button>
            <button onClick={() => setActiveTab('Reservations')} style={{ ...styles.primaryBtn, backgroundColor: '#0f172a', width: '100%', textAlign: 'left', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>📅 Reserve / Manage Bookings</span>
              <span>→</span>
            </button>
            {isAdmin && (
              <button onClick={handleDownloadReport} style={{ ...styles.primaryBtn, backgroundColor: '#059669', width: '100%', textAlign: 'left', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>📊 Generate Daily Report</span>
                <span>↓</span>
              </button>
            )}
          </div>
        </div>
      </div>

      <div style={styles.lightTechCardSection}>
        <h3 style={styles.cardTitleLight}>🛠️ Core Instrumentation Modules</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
          {moduleDetails.map((item) => (
            <div
              key={item.id}
              className="photo-module-hover"
              style={{ ...styles.photoModuleCardLight, cursor: 'pointer' }}
              onClick={() => setSelectedModule(item)}
            >
              <div style={styles.photoCardHeader}>
                <img src={item.img} alt={item.title} style={styles.moduleImg} />
                <span style={styles.moduleBadgePill}>{item.badge}</span>
              </div>
              <div style={{ padding: '16px' }}>
                <h4 style={{ margin: '0 0 6px 0', color: '#0f172a', fontSize: '15px', fontWeight: '800' }}>{item.title}</h4>
                <p style={{ margin: 0, color: '#475569', fontSize: '12px', lineHeight: '1.5', fontWeight: '500' }}>{item.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pop-up Details Modal */}
      {selectedModule && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', width: '600px', maxWidth: '90%', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>
            <div style={{ position: 'relative', height: '200px' }}>
              <img src={selectedModule.img} alt={selectedModule.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              <button
                onClick={() => setSelectedModule(null)}
                style={{ position: 'absolute', top: '12px', right: '12px', background: 'rgba(255,255,255,0.85)', border: 'none', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', fontWeight: 'bold', fontSize: '16px', color: '#0f172a' }}
              >
                ✕
              </button>
              <span style={{ position: 'absolute', bottom: '12px', left: '16px', backgroundColor: '#0284c7', color: '#fff', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold' }}>
                {selectedModule.badge}
              </span>
            </div>

            <div style={{ padding: '24px' }}>
              <h3 style={{ margin: '0 0 8px 0', color: '#0f172a', fontSize: '20px', fontWeight: '800' }}>{selectedModule.title}</h3>
              <p style={{ color: '#64748b', fontSize: '13px', lineHeight: '1.5', marginBottom: '20px' }}>{selectedModule.description}</p>

              <h5 style={{ margin: '0 0 10px 0', color: '#0369a1', fontSize: '14px', fontWeight: '700' }}>📋 Key Operating Guidelines:</h5>
              <ul style={{ margin: 0, paddingLeft: '20px', color: '#334155', fontSize: '13px', lineHeight: '1.7' }}>
                {selectedModule.details.map((detail, index) => (
                  <li key={index} style={{ marginBottom: '6px' }}>{detail}</li>
                ))}
              </ul>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '24px' }}>
                <button
                  onClick={() => setSelectedModule(null)}
                  style={{ backgroundColor: '#0284c7', color: '#ffffff', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' }}
                >
                  Close & Continue
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default DashboardTab;