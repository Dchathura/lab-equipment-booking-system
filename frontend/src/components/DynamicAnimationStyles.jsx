import React from 'react';

const DynamicAnimationStyles = () => (
  <style>{`
    @keyframes gradientBG {
      0% { background-position: 0% 50%; }
      50% { background-position: 100% 50%; }
      100% { background-position: 0% 50%; }
    }
    @keyframes bannerShimmer {
      0% { background-position: 0% 50%; }
      50% { background-position: 100% 50%; }
      100% { background-position: 0% 50%; }
    }
    @keyframes slideInHorizontal {
      0% { transform: translateX(-80px); opacity: 0; }
      100% { transform: translateX(0); opacity: 1; }
    }
    @keyframes colorShiftGradient {
      0% { background-position: 0% 50%; }
      50% { background-position: 100% 50%; }
      100% { background-position: 0% 50%; }
    }
    @keyframes pulseGlow {
      0% { box-shadow: 0 0 15px rgba(56, 189, 248, 0.3); }
      50% { box-shadow: 0 0 35px rgba(56, 189, 248, 0.75); }
      100% { box-shadow: 0 0 15px rgba(56, 189, 248, 0.3); }
    }
    @keyframes modalPopIn {
      0% { opacity: 0; transform: scale(0.85) translateY(20px); }
      100% { opacity: 1; transform: scale(1) translateY(0); }
    }
    .metric-card-hover { transition: all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) !important; cursor: pointer; }
    .metric-card-hover:hover { transform: translateY(-8px) scale(1.02) !important; box-shadow: 0 16px 32px rgba(15, 23, 42, 0.15), 0 0 20px rgba(56, 189, 248, 0.3) !important; }
    .mini-card-hover { transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) !important; cursor: pointer; }
    .mini-card-hover:hover { transform: translateY(-6px) scale(1.02) !important; box-shadow: 0 14px 30px rgba(15, 23, 42, 0.12) !important; }
    .modal-feature-card { transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) !important; cursor: pointer; }
    .modal-feature-card:hover { transform: translateY(-6px) scale(1.02) !important; box-shadow: 0 12px 25px rgba(37, 99, 235, 0.15) !important; }
    .photo-module-hover { transition: all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) !important; }
    .photo-module-hover:hover { transform: translateY(-6px) scale(1.01) !important; box-shadow: 0 16px 30px rgba(15, 23, 42, 0.1), 0 0 15px rgba(56, 189, 248, 0.2) !important; }
  `}</style>
);

export default DynamicAnimationStyles;