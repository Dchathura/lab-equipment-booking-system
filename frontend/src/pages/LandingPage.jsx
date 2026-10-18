import React, { useState } from 'react';
import { useGoogleLogin } from '@react-oauth/google';
import DynamicAnimationStyles from '../components/DynamicAnimationStyles';
import { landingStyles } from '../components/DynamicStyles';

const LandingPage = ({
  isLoginView,
  setIsLoginView,
  fullName,
  setFullName,
  email,
  setEmail,
  password,
  setPassword,
  role,
  setRole,
  handleLogin,
  handleRegister,
  errorMsg,
  successMsg,
  setErrorMsg,
  setSuccessMsg,
  setShowFeaturesModal,
  setShowAboutModal,
  loginSectionRef
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetMsg, setResetMsg] = useState('');

  // Sereal Google Login Handler using @react-oauth/google
  const loginWithGoogle = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
        });
        const userData = await res.json();
        
        console.log('Google User Data:', userData);
        if (setSuccessMsg) {
          setSuccessMsg(`Welcome, ${userData.name}! Logged in via Google.`);
        }
      } catch (err) {
        if (setErrorMsg) setErrorMsg('Failed to fetch user details from Google.');
      }
    },
    onError: () => {
      if (setErrorMsg) setErrorMsg('Google Login Failed. Please try again.');
    }
  });

  const scrollToLogin = () => {
    setIsLoginView(true);
    if (loginSectionRef.current) {
      loginSectionRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleSocialLogin = (provider) => {
    if (provider === 'Google') {
      loginWithGoogle();
    } else if (setSuccessMsg) {
      setSuccessMsg(`Connecting to ${provider} authentication...`);
    }
  };

  const handleForgotPassword = (e) => {
    e.preventDefault();
    if (!resetEmail) return;
    setResetMsg(`Password reset link sent to ${resetEmail}! Please check your email.`);
    setTimeout(() => {
      setShowForgotModal(false);
      setResetMsg('');
      setResetEmail('');
    }, 3000);
  };

  return (
    <div style={landingStyles.landingWrapper}>
      <DynamicAnimationStyles />
      <header style={landingStyles.topNav}>
        <div style={landingStyles.navBrand}>
          <span style={{ fontSize: '24px' }}>🔬</span>
          <strong style={{ fontSize: '22px', fontWeight: '800' }}>
            Lab<span style={{ color: '#38bdf8' }}>.Flow</span>
          </strong>
        </div>
        <nav style={landingStyles.navMenu}>
          <button style={landingStyles.navLinkActive}>🏠 Home</button>
          <button onClick={() => setShowFeaturesModal(true)} style={landingStyles.navLink}>⚙️ Features</button>
          <button onClick={() => setShowAboutModal(true)} style={landingStyles.navLink}>ⓘ About</button>
          <span style={{ color: '#334155', margin: '0 8px' }}>|</span>
          <button onClick={scrollToLogin} style={landingStyles.highlightLoginBtn}>👤 Login</button>
        </nav>
      </header>

      <main style={landingStyles.mainContainer}>
        <div style={landingStyles.heroBanner}>
          <div style={landingStyles.heroTextContent}>
            <div style={landingStyles.heroPillBadge}>⚗️ Equipment Management System</div>
            <h1 style={landingStyles.heroHeading}>
              Welcome to <span style={landingStyles.heroGradientText}>Lab Flow</span>
            </h1>
            <p style={landingStyles.heroSubHeading}>
              Streamlined laboratory resource scheduling, real-time availability tracking, and automated asset control.
            </p>
            <div style={landingStyles.quickBadgesRow}>
              <div style={landingStyles.quickBadgeItem}>
                <div style={{ ...landingStyles.badgeIconCircle, backgroundColor: '#dbeafe', color: '#1d4ed8' }}>📅</div>
                <div>
                  <div style={landingStyles.badgeTitle}>Book Equipment</div>
                  <div style={landingStyles.badgeSubtitle}>Quick & Easy</div>
                </div>
              </div>
              <div style={landingStyles.quickBadgeItem}>
                <div style={{ ...landingStyles.badgeIconCircle, backgroundColor: '#f3e8ff', color: '#7e22ce' }}>🕒</div>
                <div>
                  <div style={landingStyles.badgeTitle}>Real-time Availability</div>
                  <div style={landingStyles.badgeSubtitle}>Live Updates</div>
                </div>
              </div>
              <div style={landingStyles.quickBadgeItem}>
                <div style={{ ...landingStyles.badgeIconCircle, backgroundColor: '#dcfce7', color: '#15803d' }}>🛡️</div>
                <div>
                  <div style={landingStyles.badgeTitle}>Automated Control</div>
                  <div style={landingStyles.badgeSubtitle}>Smarter Lab</div>
                </div>
              </div>
            </div>
          </div>
          <div style={landingStyles.slantedImageWrapper}>
            <img src="https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=1000&q=80" alt="University Lab Engineering" style={landingStyles.slantedImage} />
            <div style={landingStyles.universityOverlayBadge}>🏛️ University Engineering</div>
          </div>
        </div>

        <div style={landingStyles.lowerGrid}>
          <div style={landingStyles.featuresSectionCard}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={landingStyles.gearIconCircle}>⚙️</div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '20px', color: '#0f172a', fontWeight: '800' }}>System Features</h3>
                  <p style={{ margin: 0, color: '#475569', fontSize: '13px', fontWeight: '500' }}>
                    Manage instrument reservations, check real-time availability, and view daily usage metrics effortlessly.
                  </p>
                </div>
              </div>
              <button onClick={() => setShowFeaturesModal(true)} style={{ background: 'none', border: 'none', color: '#2563eb', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px' }}>
                Explore Features →
              </button>
            </div>
            <div style={landingStyles.miniCardsGrid}>
              <div onClick={() => setShowFeaturesModal(true)} className="mini-card-hover" style={{ ...landingStyles.miniFeatureCard, background: 'linear-gradient(135deg, #e0f2fe 0%, #f0f9ff 100%)', border: '1px solid #bae6fd' }}>
                <div style={{ ...landingStyles.miniIconCircle, backgroundColor: '#0284c7', color: '#ffffff' }}>📅</div>
                <h5 style={landingStyles.miniCardTitle}>Reservations</h5>
                <p style={landingStyles.miniCardDesc}>Book & manage equipment easily</p>
                <div style={{ ...landingStyles.miniArrowCircle, backgroundColor: '#0284c7', color: '#ffffff' }}>→</div>
              </div>
              <div onClick={() => setShowFeaturesModal(true)} className="mini-card-hover" style={{ ...landingStyles.miniFeatureCard, background: 'linear-gradient(135deg, #f3e8ff 0%, #faf5ff 100%)', border: '1px solid #e9d5ff' }}>
                <div style={{ ...landingStyles.miniIconCircle, backgroundColor: '#9333ea', color: '#ffffff' }}>🕒</div>
                <h5 style={landingStyles.miniCardTitle}>Real-time Tracking</h5>
                <p style={landingStyles.miniCardDesc}>Live availability and status</p>
                <div style={{ ...landingStyles.miniArrowCircle, backgroundColor: '#9333ea', color: '#ffffff' }}>→</div>
              </div>
              <div onClick={() => setShowFeaturesModal(true)} className="mini-card-hover" style={{ ...landingStyles.miniFeatureCard, background: 'linear-gradient(135deg, #dcfce7 0%, #f0fdf4 100%)', border: '1px solid #bbf7d0' }}>
                <div style={{ ...landingStyles.miniIconCircle, backgroundColor: '#16a34a', color: '#ffffff' }}>📊</div>
                <h5 style={landingStyles.miniCardTitle}>Usage Metrics</h5>
                <p style={landingStyles.miniCardDesc}>View daily & weekly reports</p>
                <div style={{ ...landingStyles.miniArrowCircle, backgroundColor: '#16a34a', color: '#ffffff' }}>→</div>
              </div>
              <div onClick={() => setShowFeaturesModal(true)} className="mini-card-hover" style={{ ...landingStyles.miniFeatureCard, background: 'linear-gradient(135deg, #fef3c7 0%, #fffbeb 100%)', border: '1px solid #fde68a' }}>
                <div style={{ ...landingStyles.miniIconCircle, backgroundColor: '#d97706', color: '#ffffff' }}>🎛️</div>
                <h5 style={landingStyles.miniCardTitle}>Asset Control</h5>
                <p style={landingStyles.miniCardDesc}>Automated & organized</p>
                <div style={{ ...landingStyles.miniArrowCircle, backgroundColor: '#d97706', color: '#ffffff' }}>→</div>
              </div>
            </div>
          </div>

          <div ref={loginSectionRef} style={landingStyles.darkLoginCard}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '20px' }}>
              <div style={landingStyles.lockIconCircle}>🔒</div>
              <div>
                <h3 style={{ margin: 0, fontSize: '22px', color: '#ffffff', fontWeight: '800', letterSpacing: '-0.3px' }}>
                  {isLoginView ? 'Account Login' : 'Create Account'}
                </h3>
                <p style={{ margin: 0, color: '#38bdf8', fontSize: '13px', fontWeight: '500' }}>
                  {isLoginView ? 'Enter your credentials to access your portal' : 'Fill in details below to register'}
                </p>
              </div>
            </div>

            {errorMsg && <div style={{ backgroundColor: '#ef444422', border: '1px solid #ef4444', color: '#fca5a5', padding: '10px 14px', borderRadius: '10px', fontSize: '13px', marginBottom: '14px' }}>{errorMsg}</div>}
            {successMsg && <div style={{ backgroundColor: '#10b98122', border: '1px solid #10b981', color: '#6ee7b7', padding: '10px 14px', borderRadius: '10px', fontSize: '13px', marginBottom: '14px' }}>{successMsg}</div>}

            <form onSubmit={isLoginView ? handleLogin : handleRegister} style={{ width: '100%' }}>
              {!isLoginView && (
                <>
                  <div style={landingStyles.inputGroup}>
                    <span style={landingStyles.inputIcon}>👤</span>
                    <input type="text" placeholder="Full Name" value={fullName} onChange={(e) => setFullName(e.target.value)} required style={landingStyles.darkInputField} />
                  </div>
                  <div style={landingStyles.inputGroup}>
                    <span style={landingStyles.inputIcon}>🛡️</span>
                    <select value={role} onChange={(e) => setRole(e.target.value)} style={landingStyles.darkInputField}>
                      <option value="STUDENT">Student Account</option>
                      <option value="ADMIN">Lab Technical Officer (Admin)</option>
                    </select>
                  </div>
                </>
              )}
              <div style={landingStyles.inputGroup}>
                <span style={landingStyles.inputIcon}>✉️</span>
                <input type="email" placeholder="Email Address" value={email} onChange={(e) => setEmail(e.target.value)} required style={landingStyles.darkInputField} />
              </div>

              <div style={landingStyles.inputGroup}>
                <span style={landingStyles.inputIcon}>🔒</span>
                <input 
                  type={showPassword ? "text" : "password"} 
                  placeholder="Password" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  required 
                  style={{ ...landingStyles.darkInputField, paddingRight: '40px' }} 
                />
                <span 
                  onClick={() => setShowPassword(!showPassword)} 
                  style={{ 
                    position: 'absolute', 
                    right: '14px', 
                    color: '#38bdf8', 
                    cursor: 'pointer', 
                    fontSize: '16px',
                    userSelect: 'none' 
                  }}
                  title={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? "👁️" : "👁️‍🗨️"}
                </span>
              </div>

              {/* Forgot Password Link (Login View එකේදී පමණක් පෙන්වයි) */}
              {isLoginView && (
                <div style={{ textAlign: 'right', marginTop: '-6px', marginBottom: '14px' }}>
                  <button 
                    type="button" 
                    onClick={() => setShowForgotModal(true)} 
                    style={{ background: 'none', border: 'none', color: '#38bdf8', fontSize: '12px', cursor: 'pointer', fontWeight: '500' }}
                  >
                    Forgot Password?
                  </button>
                </div>
              )}

              <button type="submit" style={landingStyles.brightBlueBtn}>
                {isLoginView ? 'Login →' : 'Register Account →'}
              </button>
            </form>

            {/* Social Logins Divider & Buttons Section */}
            <div style={{ margin: '20px 0 15px 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ flex: 1, height: '1px', backgroundColor: '#334155' }}></div>
              <span style={{ color: '#94a3b8', fontSize: '11px', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '0.5px' }}>
                OR CONTINUE WITH
              </span>
              <div style={{ flex: 1, height: '1px', backgroundColor: '#334155' }}></div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '15px' }}>
              <button 
                type="button" 
                onClick={() => handleSocialLogin('Google')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  padding: '9px 12px',
                  backgroundColor: '#1e293b',
                  border: '1px solid #334155',
                  borderRadius: '10px',
                  color: '#f8fafc',
                  fontSize: '12px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24">
                  <path fill="#ea4335" d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.3 9 5 12 5z"/>
                  <path fill="#4285f4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.6h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.9z"/>
                  <path fill="#fbbc05" d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 12.3 0 15s.7 5.3 1.9 7.7l3.7-2.9z"/>
                  <path fill="#34a853" d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.3-6.4-5.2L1.9 16c1.8 3.7 5.6 7 10.1 7z"/>
                </svg>
                Google
              </button>

              <button 
                type="button" 
                onClick={() => handleSocialLogin('Facebook')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  padding: '9px 12px',
                  backgroundColor: '#1e293b',
                  border: '1px solid #334155',
                  borderRadius: '10px',
                  color: '#f8fafc',
                  fontSize: '12px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                <svg width="16" height="16" fill="#1877f2" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
                Facebook
              </button>

              <button 
                type="button" 
                onClick={() => handleSocialLogin('GitHub')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  padding: '9px 12px',
                  backgroundColor: '#1e293b',
                  border: '1px solid #334155',
                  borderRadius: '10px',
                  color: '#f8fafc',
                  fontSize: '12px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                <svg width="16" height="16" fill="#ffffff" viewBox="0 0 24 24">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
                </svg>
                GitHub
              </button>
            </div>

            <div style={{ textAlign: 'center', fontSize: '13px' }}>
              <span style={{ color: '#94a3b8' }}>
                {isLoginView ? "Don't have an account? " : "Already have an account? "}
              </span>
              <button onClick={() => { setIsLoginView(!isLoginView); setErrorMsg(''); setSuccessMsg(''); }} style={{ background: 'none', border: 'none', color: '#38bdf8', cursor: 'pointer', fontWeight: 'bold', textDecoration: 'underline' }}>
                {isLoginView ? 'Sign up' : 'Log in'}
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.75)',
          backdropFilter: 'blur(5px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: '#0f172a',
            border: '1px solid #334155',
            borderRadius: '16px',
            padding: '28px',
            width: '90%',
            maxWidth: '400px',
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.5)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, color: '#f8fafc', fontSize: '18px', fontWeight: '700' }}>🔑 Reset Password</h3>
              <button 
                onClick={() => { setShowForgotModal(false); setResetMsg(''); }}
                style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '18px', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>
            
            <p style={{ color: '#94a3b8', fontSize: '13px', marginBottom: '18px' }}>
              Enter your registered email address below and we will send you a password reset link.
            </p>

            {resetMsg && (
              <div style={{ backgroundColor: '#10b98122', border: '1px solid #10b981', color: '#6ee7b7', padding: '10px', borderRadius: '8px', fontSize: '12px', marginBottom: '14px' }}>
                {resetMsg}
              </div>
            )}

            <form onSubmit={handleForgotPassword}>
              <div style={landingStyles.inputGroup}>
                <span style={landingStyles.inputIcon}>✉️</span>
                <input 
                  type="email" 
                  placeholder="Enter your email" 
                  value={resetEmail} 
                  onChange={(e) => setResetEmail(e.target.value)} 
                  required 
                  style={landingStyles.darkInputField} 
                />
              </div>
              <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
                <button 
                  type="button" 
                  onClick={() => { setShowForgotModal(false); setResetMsg(''); }} 
                  style={{ flex: 1, padding: '10px', backgroundColor: '#334155', border: 'none', borderRadius: '10px', color: '#f8fafc', cursor: 'pointer', fontWeight: '600', fontSize: '13px' }}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  style={{ flex: 1, padding: '10px', backgroundColor: '#0284c7', border: 'none', borderRadius: '10px', color: '#ffffff', cursor: 'pointer', fontWeight: '600', fontSize: '13px' }}
                >
                  Send Reset Link
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default LandingPage;