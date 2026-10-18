import React from 'react';
import { styles } from '../components/DynamicStyles';

const EquipmentTab = ({
  isAdmin,
  eqName,
  setEqName,
  eqCategory,
  setEqCategory,
  eqSerial,
  setEqSerial,
  handleAddEquipment,
  eqSearch,
  setEqSearch,
  eqCategoryFilter,
  setEqCategoryFilter,
  filteredEquipment,
  getCategoryBadgeStyle,
  errorMsg,
  successMsg
}) => (
  <>
    {isAdmin && (
      <div style={styles.lightTechCardSection}>
        <h3 style={styles.cardTitleLight}>➕ Add New Equipment</h3>
        {errorMsg && <div style={styles.errorAlert}>{errorMsg}</div>}
        {successMsg && <div style={styles.successAlert}>{successMsg}</div>}
        <form onSubmit={handleAddEquipment} style={{ display: 'grid', gridTemplateColumns: '2fr 1.5fr 2fr 1fr', gap: '15px' }}>
          <input type="text" placeholder="Equipment Name (e.g. Oscilloscope)" value={eqName} onChange={(e) => setEqName(e.target.value)} required style={styles.lightInputField} />
          <select value={eqCategory} onChange={(e) => setEqCategory(e.target.value)} style={styles.lightInputField}>
            <option value="Electronics">Electronics</option>
            <option value="Measurement">Measurement</option>
            <option value="Signal Source">Signal Source</option>
            <option value="Power Supply">Power Supply</option>
            <option value="PLC & Automation">PLC & Automation</option>
            <option value="Sensors">Sensors</option>
          </select>
          <input type="text" placeholder="Serial Number (e.g. TEK-90082)" value={eqSerial} onChange={(e) => setEqSerial(e.target.value)} required style={styles.lightInputField} />
          <button type="submit" style={styles.primaryBtn}>Add Equipment</button>
        </form>
      </div>
    )}

    <div style={styles.lightTechCardSection}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div>
          <h3 style={{ ...styles.cardTitleLight, margin: 0 }}>🔬 Lab Equipment Inventory</h3>
          <p style={{ margin: '4px 0 0 0', color: '#64748b', fontSize: '13px' }}>Browse, search, and verify real-time status of lab hardware assets.</p>
        </div>
        <span style={{ backgroundColor: '#e0f2fe', color: '#0284c7', border: '1px solid #bae6fd', padding: '6px 14px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold' }}>
          Available Assets: {filteredEquipment.length}
        </span>
      </div>

      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', background: '#f1f5f9', padding: '12px', borderRadius: '12px', border: '1px solid #cbd5e1' }}>
        <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center' }}>
          <span style={{ position: 'absolute', left: '12px', color: '#0284c7' }}>🔍</span>
          <input type="text" placeholder="Search equipment by name or serial..." value={eqSearch} onChange={(e) => setEqSearch(e.target.value)} style={{ ...styles.lightInputField, paddingLeft: '36px' }} />
        </div>
        <select value={eqCategoryFilter} onChange={(e) => setEqCategoryFilter(e.target.value)} style={{ ...styles.lightInputField, width: '180px' }}>
          <option value="ALL">All Categories</option>
          <option value="Electronics">Electronics</option>
          <option value="Measurement">Measurement</option>
          <option value="Signal Source">Signal Source</option>
          <option value="Power Supply">Power Supply</option>
          <option value="PLC & Automation">PLC & Automation</option>
          <option value="Sensors">Sensors</option>
        </select>
      </div>

      <table style={styles.table}>
        <thead>
          <tr style={styles.tableHeaderRowLight}>
            <th style={styles.thLight}>ID</th>
            <th style={styles.thLight}>EQUIPMENT NAME</th>
            <th style={styles.thLight}>CATEGORY</th>
            <th style={styles.thLight}>SERIAL NUMBER</th>
            <th style={styles.thLight}>BENCH LOCATION</th>
            <th style={styles.thLight}>AVAILABLE / TOTAL</th>
            <th style={styles.thLight}>STATUS</th>
          </tr>
        </thead>
        <tbody>
          {filteredEquipment.length === 0 ? (
            <tr>
              <td colSpan="7" style={{ ...styles.tdLight, textAlign: 'center' }}>No equipment matched your criteria.</td>
            </tr>
          ) : (
            filteredEquipment.map(eq => (
              <tr key={eq.id} style={styles.tableRowLight}>
                <td style={styles.tdLight}>#{eq.id}</td>
                <td style={styles.tdLight}><strong style={{ color: '#0f172a' }}>{eq.name}</strong></td>
                <td style={styles.tdLight}>
                  <span style={{ ...styles.categoryBadge, ...getCategoryBadgeStyle(eq.category) }}>{eq.category}</span>
                </td>
                <td style={styles.tdLight}>{eq.serial_number}</td>
                <td style={styles.tdLight}><span style={{ color: '#0284c7', fontSize: '12px', fontWeight: 'bold' }}>Bench 0{eq.id % 4 + 1}</span></td>
                
                {/* මෙතැනින් Available සහ Total ප්‍රමාණය පෙන්වයි */}
                <td style={styles.tdLight}>
                  <span style={{ fontWeight: 'bold', color: eq.available_quantity > 0 ? '#16a34a' : '#dc2626' }}>
                    {eq.available_quantity !== undefined ? eq.available_quantity : (eq.quantity || 5)} / {eq.quantity || 5}
                  </span>
                </td>

                <td style={styles.tdLight}>
                  <span style={eq.available_quantity > 0 ? styles.statusAvailableLight : { color: '#dc2626', fontWeight: 'bold' }}>
                    {eq.available_quantity > 0 ? '🟢 Available' : '🔴 Out of Stock'}
                  </span>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  </>
);

export default EquipmentTab;