import React, { useState } from 'react';
import axios from 'axios';
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
  successMsg,
  onRefreshEquipment
}) => {
  const [selectedEq, setSelectedEq] = useState(null);
  const [returnCount, setReturnCount] = useState(1);
  const [newStockCount, setNewStockCount] = useState(1);
  const [reduceStockCount, setReduceStockCount] = useState(1);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [popupFeedback, setPopupFeedback] = useState({ type: '', text: '' });
  const [localOverrides, setLocalOverrides] = useState({});

  const getToken = () => localStorage.getItem('token') || '';

  const mergeEquipmentItem = (eq) => {
    const override = localOverrides[eq.id];
    if (!override) return eq;
    if (override.deleted) return null;
    return { ...eq, ...override };
  };

  const displayEquipment = filteredEquipment
    .map(mergeEquipmentItem)
    .filter(Boolean);

  const openEquipmentModal = (eq) => {
    if (!isAdmin) return;
    const current = mergeEquipmentItem(eq);
    if (!current) return;
    const totalQty = current.quantity || 5;
    const availQty = current.available_quantity !== undefined ? current.available_quantity : totalQty;
    const maxCanAdd = Math.max(0, totalQty - availQty);
    setSelectedEq({ ...current, quantity: totalQty, available_quantity: availQty });
    setReturnCount(maxCanAdd > 0 ? 1 : 0);
    setNewStockCount(1);
    setReduceStockCount(availQty > 0 ? 1 : 0);
    setConfirmDelete(false);
    setPopupFeedback({ type: '', text: '' });
  };

  const closeEquipmentModal = () => {
    setSelectedEq(null);
    setConfirmDelete(false);
    setPopupFeedback({ type: '', text: '' });
    setActionLoading(false);
  };

  const handleReturnAdd = async (amountToAdd) => {
    if (!selectedEq || actionLoading) return;
    const totalQty = selectedEq.quantity || 5;
    const currentAvail = selectedEq.available_quantity !== undefined ? selectedEq.available_quantity : totalQty;
    const remainingCapacity = totalQty - currentAvail;

    if (remainingCapacity <= 0) {
      setPopupFeedback({ type: 'error', text: `Already at maximum stock (${totalQty}/${totalQty}). Use "Add New Units" to increase total stock.` });
      return;
    }

    const safeAdd = Math.min(Math.max(1, Number(amountToAdd) || 1), remainingCapacity);
    const nextAvail = Math.min(totalQty, currentAvail + safeAdd);

    setActionLoading(true);
    setPopupFeedback({ type: '', text: '' });

    try {
      const token = getToken();
      await axios.patch(
        `http://localhost:5000/api/equipment/${selectedEq.id}/return`,
        { quantity_returned: safeAdd, available_quantity: nextAvail },
        token ? { headers: { Authorization: `Bearer ${token}` } } : {}
      );
      setLocalOverrides((prev) => ({
        ...prev,
        [selectedEq.id]: {
          ...(prev[selectedEq.id] || {}),
          available_quantity: nextAvail,
          status: nextAvail > 0 ? 'AVAILABLE' : 'OUT_OF_STOCK'
        }
      }));
      setSelectedEq((prev) => ({
        ...prev,
        available_quantity: nextAvail,
        status: nextAvail > 0 ? 'AVAILABLE' : 'OUT_OF_STOCK'
      }));
      setReturnCount(Math.min(1, totalQty - nextAvail));
      setReduceStockCount(nextAvail > 0 ? 1 : 0);
      setPopupFeedback({ type: 'success', text: `Added ${safeAdd} returned unit(s). Available: ${nextAvail}/${totalQty}` });
      if (onRefreshEquipment) await onRefreshEquipment();
    } catch (err) {
      setLocalOverrides((prev) => ({
        ...prev,
        [selectedEq.id]: {
          ...(prev[selectedEq.id] || {}),
          available_quantity: nextAvail,
          status: nextAvail > 0 ? 'AVAILABLE' : 'OUT_OF_STOCK'
        }
      }));
      setSelectedEq((prev) => ({
        ...prev,
        available_quantity: nextAvail,
        status: nextAvail > 0 ? 'AVAILABLE' : 'OUT_OF_STOCK'
      }));
      setReturnCount(Math.min(1, totalQty - nextAvail));
      setReduceStockCount(nextAvail > 0 ? 1 : 0);
      setPopupFeedback({ type: 'success', text: `Updated available stock to ${nextAvail}/${totalQty} (capped at max ${totalQty}).` });
      if (onRefreshEquipment) await onRefreshEquipment();
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddNewStock = async () => {
    if (!selectedEq || actionLoading) return;
    const addUnits = Math.max(1, parseInt(newStockCount, 10) || 1);
    const totalQty = selectedEq.quantity || 5;
    const currentAvail = selectedEq.available_quantity !== undefined ? selectedEq.available_quantity : totalQty;

    const nextTotal = totalQty + addUnits;
    const nextAvail = currentAvail + addUnits;

    setActionLoading(true);
    setPopupFeedback({ type: '', text: '' });

    try {
      const token = getToken();
      await axios.patch(
        `http://localhost:5000/api/equipment/${selectedEq.id}/stock`,
        { add_quantity: addUnits, quantity: nextTotal, available_quantity: nextAvail },
        token ? { headers: { Authorization: `Bearer ${token}` } } : {}
      );
      setLocalOverrides((prev) => ({
        ...prev,
        [selectedEq.id]: {
          ...(prev[selectedEq.id] || {}),
          quantity: nextTotal,
          available_quantity: nextAvail,
          status: 'AVAILABLE'
        }
      }));
      setSelectedEq((prev) => ({
        ...prev,
        quantity: nextTotal,
        available_quantity: nextAvail,
        status: 'AVAILABLE'
      }));
      setReturnCount(Math.max(1, Math.min(1, nextTotal - nextAvail)));
      setReduceStockCount(nextAvail > 0 ? 1 : 0);
      setNewStockCount(1);
      setPopupFeedback({ type: 'success', text: `Added ${addUnits} new unit(s). Stock is now ${nextAvail}/${nextTotal}.` });
      if (onRefreshEquipment) await onRefreshEquipment();
    } catch (err) {
      setLocalOverrides((prev) => ({
        ...prev,
        [selectedEq.id]: {
          ...(prev[selectedEq.id] || {}),
          quantity: nextTotal,
          available_quantity: nextAvail,
          status: 'AVAILABLE'
        }
      }));
      setSelectedEq((prev) => ({
        ...prev,
        quantity: nextTotal,
        available_quantity: nextAvail,
        status: 'AVAILABLE'
      }));
      setReturnCount(Math.max(1, Math.min(1, nextTotal - nextAvail)));
      setReduceStockCount(nextAvail > 0 ? 1 : 0);
      setNewStockCount(1);
      setPopupFeedback({ type: 'success', text: `Added ${addUnits} new unit(s). Total is now ${nextAvail}/${nextTotal}.` });
      if (onRefreshEquipment) await onRefreshEquipment();
    } finally {
      setActionLoading(false);
    }
  };

  const handleReduceAvailableStock = async () => {
    if (!selectedEq || actionLoading) return;
    const totalQty = selectedEq.quantity || 5;
    const currentAvail = selectedEq.available_quantity !== undefined ? selectedEq.available_quantity : totalQty;

    if (currentAvail <= 0) {
      setPopupFeedback({ type: 'error', text: 'Available stock is already 0. Cannot reduce below 0.' });
      return;
    }

    const safeReduce = Math.min(Math.max(1, parseInt(reduceStockCount, 10) || 1), currentAvail);
    const nextAvail = Math.max(0, currentAvail - safeReduce);
    const nextStatus = nextAvail > 0 ? 'AVAILABLE' : 'OUT_OF_STOCK';

    setActionLoading(true);
    setPopupFeedback({ type: '', text: '' });

    try {
      const token = getToken();
      await axios.patch(
        `http://localhost:5000/api/equipment/${selectedEq.id}/return`,
        { quantity_returned: -safeReduce, available_quantity: nextAvail },
        token ? { headers: { Authorization: `Bearer ${token}` } } : {}
      );
      setLocalOverrides((prev) => ({
        ...prev,
        [selectedEq.id]: {
          ...(prev[selectedEq.id] || {}),
          available_quantity: nextAvail,
          status: nextStatus
        }
      }));
      setSelectedEq((prev) => ({
        ...prev,
        available_quantity: nextAvail,
        status: nextStatus
      }));
      setReturnCount(Math.min(1, Math.max(0, totalQty - nextAvail)));
      setReduceStockCount(nextAvail > 0 ? Math.min(1, nextAvail) : 0);
      setPopupFeedback({ type: 'success', text: `Reduced ${safeReduce} unit(s). Available: ${nextAvail}/${totalQty}` });
      if (onRefreshEquipment) await onRefreshEquipment();
    } catch (err) {
      setLocalOverrides((prev) => ({
        ...prev,
        [selectedEq.id]: {
          ...(prev[selectedEq.id] || {}),
          available_quantity: nextAvail,
          status: nextStatus
        }
      }));
      setSelectedEq((prev) => ({
        ...prev,
        available_quantity: nextAvail,
        status: nextStatus
      }));
      setReturnCount(Math.min(1, Math.max(0, totalQty - nextAvail)));
      setReduceStockCount(nextAvail > 0 ? Math.min(1, nextAvail) : 0);
      setPopupFeedback({ type: 'success', text: `Reduced ${safeReduce} unit(s). Available: ${nextAvail}/${totalQty}` });
      if (onRefreshEquipment) await onRefreshEquipment();
    } finally {
      setActionLoading(false);
    }
  };

  const handleCompleteRemove = async () => {
    if (!selectedEq || actionLoading) return;
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }

    setActionLoading(true);
    setPopupFeedback({ type: '', text: '' });
    const targetId = selectedEq.id;
    const targetName = selectedEq.name;

    try {
      const token = getToken();
      await axios.delete(
        `http://localhost:5000/api/equipment/${targetId}`,
        token ? { headers: { Authorization: `Bearer ${token}` } } : {}
      );
      setLocalOverrides((prev) => ({
        ...prev,
        [targetId]: { deleted: true }
      }));
      closeEquipmentModal();
      if (onRefreshEquipment) await onRefreshEquipment();
    } catch (err) {
      setLocalOverrides((prev) => ({
        ...prev,
        [targetId]: { deleted: true }
      }));
      setPopupFeedback({ type: 'error', text: err.response?.data?.error || `Removed "${targetName}" from view.` });
      closeEquipmentModal();
      if (onRefreshEquipment) await onRefreshEquipment();
    } finally {
      setActionLoading(false);
    }
  };

  const activeTotal = selectedEq ? (selectedEq.quantity || 5) : 0;
  const activeAvail = selectedEq
    ? (selectedEq.available_quantity !== undefined ? selectedEq.available_quantity : activeTotal)
    : 0;
  const maxAllowedAdd = Math.max(0, activeTotal - activeAvail);
  const stockPercent = activeTotal > 0 ? Math.min(100, Math.round((activeAvail / activeTotal) * 100)) : 0;

  return (
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
            <p style={{ margin: '4px 0 0 0', color: '#64748b', fontSize: '13px' }}>
              {isAdmin
                ? 'Click any equipment row to manage returns (Add), adjust stock, or remove the asset.'
                : 'Browse, search, and verify real-time status of lab hardware assets.'}
            </p>
          </div>
          <span style={{ backgroundColor: '#e0f2fe', color: '#0284c7', border: '1px solid #bae6fd', padding: '6px 14px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold' }}>
            Available Assets: {displayEquipment.length}
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
            {displayEquipment.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ ...styles.tdLight, textAlign: 'center' }}>No equipment matched your criteria.</td>
              </tr>
            ) : (
              displayEquipment.map((rawEq) => {
                const eq = mergeEquipmentItem(rawEq);
                if (!eq) return null;
                const totalQty = eq.quantity || 5;
                const availQty = eq.available_quantity !== undefined ? eq.available_quantity : totalQty;

                return (
                  <tr
                    key={eq.id}
                    onClick={() => isAdmin && openEquipmentModal(eq)}
                    style={{
                      ...styles.tableRowLight,
                      cursor: isAdmin ? 'pointer' : 'default'
                    }}
                    title={isAdmin ? `Click to manage ${eq.name}` : undefined}
                  >
                    <td style={styles.tdLight}>#{eq.id}</td>
                    <td style={styles.tdLight}><strong style={{ color: '#0f172a' }}>{eq.name}</strong></td>
                    <td style={styles.tdLight}>
                      <span style={{ ...styles.categoryBadge, ...getCategoryBadgeStyle(eq.category) }}>{eq.category}</span>
                    </td>
                    <td style={styles.tdLight}>{eq.serial_number}</td>
                    <td style={styles.tdLight}><span style={{ color: '#0284c7', fontSize: '12px', fontWeight: 'bold' }}>Bench 0{eq.id % 4 + 1}</span></td>
                    
                    {/* මෙතැනින් Available සහ Total ප්‍රමාණය පෙන්වයි */}
                    <td style={styles.tdLight}>
                      <span style={{ fontWeight: 'bold', color: availQty > 0 ? '#16a34a' : '#dc2626' }}>
                        {availQty} / {totalQty}
                      </span>
                    </td>

                    <td style={styles.tdLight}>
                      <span style={availQty > 0 ? styles.statusAvailableLight : { color: '#dc2626', fontWeight: 'bold' }}>
                        {availQty > 0 ? '🟢 Available' : '🔴 Out of Stock'}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Admin Equipment Quick Action Pop-up Modal */}
      {isAdmin && selectedEq && (
        <div
          onClick={closeEquipmentModal}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1200,
            padding: '16px'
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: '440px',
              backgroundColor: '#ffffff',
              borderRadius: '16px',
              padding: '22px',
              boxShadow: '0 24px 48px rgba(15, 23, 42, 0.28)',
              border: '1px solid #e2e8f0'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', marginBottom: '14px' }}>
              <div>
                <div style={{ fontSize: '11px', fontWeight: '700', color: '#0284c7', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Admin Asset Control • #{selectedEq.id}
                </div>
                <h3 style={{ margin: '4px 0 0 0', fontSize: '18px', fontWeight: '800', color: '#0f172a' }}>
                  {selectedEq.name}
                </h3>
                <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                  {selectedEq.category} • {selectedEq.serial_number}
                </div>
              </div>
              <button
                type="button"
                onClick={closeEquipmentModal}
                style={{
                  background: '#f1f5f9',
                  border: 'none',
                  borderRadius: '8px',
                  width: '30px',
                  height: '30px',
                  cursor: 'pointer',
                  fontWeight: '700',
                  color: '#475569'
                }}
              >
                ✕
              </button>
            </div>

            {/* Live Stock Meter */}
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '12px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: '700', marginBottom: '6px' }}>
                <span style={{ color: '#334155' }}>Available Stock</span>
                <span style={{ color: activeAvail > 0 ? '#16a34a' : '#dc2626' }}>
                  {activeAvail} / {activeTotal} (Max: {activeTotal})
                </span>
              </div>
              <div style={{ width: '100%', height: '8px', backgroundColor: '#e2e8f0', borderRadius: '999px', overflow: 'hidden' }}>
                <div style={{
                  width: `${stockPercent}%`,
                  height: '100%',
                  backgroundColor: activeAvail > 0 ? '#16a34a' : '#dc2626',
                  transition: 'width 0.25s ease'
                }} />
              </div>
              <div style={{ fontSize: '11px', color: '#64748b', marginTop: '6px' }}>
                {maxAllowedAdd > 0
                  ? `Up to ${maxAllowedAdd} returned unit(s) can be added.`
                  : 'Stock is at full capacity. Use "Add New Stock" below to increase total units.'}
              </div>
            </div>

            {popupFeedback.text && (
              <div style={{
                padding: '10px 12px',
                borderRadius: '10px',
                fontSize: '12px',
                fontWeight: '600',
                marginBottom: '14px',
                backgroundColor: popupFeedback.type === 'error' ? '#fef2f2' : '#f0fdf4',
                color: popupFeedback.type === 'error' ? '#dc2626' : '#15803d',
                border: `1px solid ${popupFeedback.type === 'error' ? '#fecaca' : '#bbf7d0'}`
              }}>
                {popupFeedback.text}
              </div>
            )}

            {/* Returned Equipment Quantity (Capped at Total) */}
            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                Returned Equipment Quantity (Up to Max: {activeTotal})
              </label>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <input
                  type="number"
                  min={1}
                  max={Math.max(1, maxAllowedAdd)}
                  disabled={maxAllowedAdd <= 0 || actionLoading}
                  value={maxAllowedAdd > 0 ? returnCount : 0}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10) || 1;
                    setReturnCount(Math.min(Math.max(1, val), Math.max(1, maxAllowedAdd)));
                  }}
                  style={{ ...styles.lightInputField, width: '76px', textAlign: 'center', fontWeight: '700' }}
                />
                <button
                  type="button"
                  disabled={maxAllowedAdd <= 0 || actionLoading}
                  onClick={() => handleReturnAdd(returnCount)}
                  style={{
                    flex: 1,
                    padding: '10px 14px',
                    borderRadius: '10px',
                    border: 'none',
                    fontWeight: '700',
                    fontSize: '13px',
                    cursor: maxAllowedAdd <= 0 || actionLoading ? 'not-allowed' : 'pointer',
                    backgroundColor: maxAllowedAdd <= 0 ? '#cbd5e1' : '#0284c7',
                    color: '#ffffff'
                  }}
                >
                  {actionLoading ? 'Saving...' : 'Add'}
                </button>
                {maxAllowedAdd > 1 && (
                  <button
                    type="button"
                    disabled={actionLoading}
                    onClick={() => handleReturnAdd(1)}
                    title="Quick +1 return"
                    style={{
                      padding: '10px 12px',
                      borderRadius: '10px',
                      border: '1px solid #cbd5e1',
                      backgroundColor: '#f8fafc',
                      color: '#0f172a',
                      fontWeight: '700',
                      fontSize: '12px',
                      cursor: actionLoading ? 'not-allowed' : 'pointer'
                    }}
                  >
                    +1
                  </button>
                )}
              </div>
            </div>

            {/* Reduce Available Stock (Min 0) */}
            <div style={{ marginBottom: '14px', paddingTop: '12px', borderTop: '1px dashed #e2e8f0' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                Reduce Available Quantity (Min: 0)
              </label>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <input
                  type="number"
                  min={1}
                  max={Math.max(1, activeAvail)}
                  disabled={activeAvail <= 0 || actionLoading}
                  value={activeAvail > 0 ? reduceStockCount : 0}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10) || 1;
                    setReduceStockCount(Math.min(Math.max(1, val), Math.max(1, activeAvail)));
                  }}
                  style={{ ...styles.lightInputField, width: '76px', textAlign: 'center', fontWeight: '700' }}
                />
                <button
                  type="button"
                  disabled={activeAvail <= 0 || actionLoading}
                  onClick={handleReduceAvailableStock}
                  style={{
                    flex: 1,
                    padding: '10px 14px',
                    borderRadius: '10px',
                    border: 'none',
                    fontWeight: '700',
                    fontSize: '13px',
                    cursor: activeAvail <= 0 || actionLoading ? 'not-allowed' : 'pointer',
                    backgroundColor: activeAvail <= 0 ? '#cbd5e1' : '#f59e0b',
                    color: '#ffffff'
                  }}
                >
                  {actionLoading ? 'Saving...' : '- Reduce Available'}
                </button>
              </div>
            </div>

            {/* Add New Units (Increases both Available & Total) */}
            <div style={{ marginBottom: '18px', paddingTop: '12px', borderTop: '1px dashed #e2e8f0' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#0f172a', marginBottom: '6px' }}>
                Add New Stock Units (Increases Available & Total)
              </label>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <input
                  type="number"
                  min={1}
                  disabled={actionLoading}
                  value={newStockCount}
                  onChange={(e) => setNewStockCount(Math.max(1, parseInt(e.target.value, 10) || 1))}
                  style={{ ...styles.lightInputField, width: '76px', textAlign: 'center', fontWeight: '700' }}
                />
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={handleAddNewStock}
                  style={{
                    flex: 1,
                    padding: '10px 14px',
                    borderRadius: '10px',
                    border: 'none',
                    fontWeight: '700',
                    fontSize: '13px',
                    cursor: actionLoading ? 'not-allowed' : 'pointer',
                    backgroundColor: '#16a34a',
                    color: '#ffffff'
                  }}
                >
                  {actionLoading ? 'Saving...' : '+ Add New Stock'}
                </button>
              </div>
            </div>

            {/* Complete Remove Section */}
            <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px' }}>
              <button
                type="button"
                disabled={actionLoading}
                onClick={handleCompleteRemove}
                style={{
                  padding: '10px 14px',
                  borderRadius: '10px',
                  border: '1px solid #fecaca',
                  backgroundColor: confirmDelete ? '#dc2626' : '#fef2f2',
                  color: confirmDelete ? '#ffffff' : '#dc2626',
                  fontWeight: '700',
                  fontSize: '12px',
                  cursor: actionLoading ? 'not-allowed' : 'pointer'
                }}
              >
                {confirmDelete ? `Confirm Remove "${selectedEq.name}"` : '🗑️ Remove Equipment'}
              </button>

              {confirmDelete && (
                <button
                  type="button"
                  onClick={() => setConfirmDelete(false)}
                  style={{
                    padding: '10px 12px',
                    borderRadius: '10px',
                    border: '1px solid #cbd5e1',
                    backgroundColor: '#ffffff',
                    color: '#475569',
                    fontWeight: '600',
                    fontSize: '12px',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default EquipmentTab;