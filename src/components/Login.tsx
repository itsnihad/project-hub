import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldCheck, User, KeyRound, AlertCircle, Eye, EyeOff, ChevronLeft, ArrowRight } from 'lucide-react';
import { authService } from '../services/authService';
import { AppUser } from '../types';
import { cn } from '../lib/utils';

interface LoginProps {
  onLogin: (user: AppUser) => void;
}

type LoginStep = 'IDENTIFY' | 'PASSWORD' | 'PIN' | 'SETUP_PIN';

export default function Login({ onLogin }: LoginProps) {
  const [step, setStep] = useState<LoginStep>('IDENTIFY');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [pin, setPin] = useState(['', '', '', '']);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [foundUser, setFoundUser] = useState<AppUser | null>(null);

  useEffect(() => {
    const lastUser = localStorage.getItem('last_username');
    if (lastUser) {
      setUsername(lastUser);
      checkUserStatus(lastUser);
    }
  }, []);

  const checkUserStatus = async (userToCheck: string) => {
    setLoading(true);
    try {
      const status = await authService.checkUser(userToCheck);
      if (status?.exists) {
        if (status.hasPin) {
          setStep('PIN');
        } else {
          setStep('PASSWORD');
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleIdentify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return;
    setLoading(true);
    setError('');
    try {
      const status = await authService.checkUser(username);
      
      if (!status?.exists && username.trim().toLowerCase() !== 'nihad') {
        setError('User not found in secure registry');
        setLoading(false);
        return;
      }

      if (status?.hasPin) {
        setStep('PIN');
      } else {
        setStep('PASSWORD');
      }
    } catch (err) {
      setError('System connection failure');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const user = await authService.login(username, password);
      if (user) {
        if (!user.pin) {
          setFoundUser(user);
          setStep('SETUP_PIN');
        } else {
          onLogin(user);
        }
      } else {
        setError('Invalid security phrase');
      }
    } catch (err: any) {
      setError(err.message || 'Authentication error');
    } finally {
      setLoading(false);
    }
  };

  const handlePinSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const pinStr = pin.join('');
    if (pinStr.length !== 4) return;
    
    setLoading(true);
    setError('');
    try {
      const user = await authService.loginWithPin(username, pinStr);
      if (user) {
        onLogin(user);
      } else {
        setError('Incorrect PIN Access Denied');
        setPin(['', '', '', '']);
      }
    } catch (err) {
      setError('Internal security error');
    } finally {
      setLoading(false);
    }
  };

  const handleSetupPin = async (e: React.FormEvent) => {
    e.preventDefault();
    const pinStr = pin.join('');
    if (pinStr.length !== 4) return;
    if (!foundUser) {
        // Find user first if we don't have it (should not happen in this flow usually)
        setError('Session expired. Please re-identify.');
        setStep('IDENTIFY');
        return;
    }

    setLoading(true);
    try {
      await authService.setPin(foundUser.id, pinStr);
      onLogin({ ...foundUser, pin: pinStr });
    } catch (err) {
      setError('Failed to configure PIN');
    } finally {
      setLoading(false);
    }
  };

  const handlePinChange = (idx: number, val: string) => {
    const newVal = val.replace(/[^0-9]/g, '').slice(-1);
    if (!newVal && val !== '') return;
    
    const newPin = [...pin];
    newPin[idx] = newVal;
    setPin(newPin);

    if (newVal && idx < 3) {
      const next = document.getElementById(`pin-${idx + 1}`);
      next?.focus();
    }
  };

  const handleKeyDown = (idx: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !pin[idx] && idx > 0) {
      const prev = document.getElementById(`pin-${idx - 1}`);
      prev?.focus();
    }
  };

  return (
    <div className="min-h-screen bg-[#0c0c0e] flex items-center justify-center p-6 overflow-hidden relative">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-white/[0.01] rounded-full blur-[120px] pointer-events-none" />

      <motion.div 
        layout
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="w-full max-w-[360px] relative z-10"
      >
        <div className="text-center mb-12">
          <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto mb-8">
            <ShieldCheck className="w-6 h-6 text-black" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight mb-2">Terminal Access</h1>
          <p className="text-zinc-600 text-[9px] font-bold uppercase tracking-[0.4em]">Operational Security</p>
        </div>

        <AnimatePresence mode="wait">
          {step === 'IDENTIFY' && (
            <motion.form 
              key="identify"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onSubmit={handleIdentify} 
              className="space-y-6"
            >
              <div className="space-y-3">
                <label className="block text-[9px] font-bold text-zinc-600 uppercase tracking-[0.3em] ml-1">Identity</label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="input-simple w-full"
                  placeholder="Username"
                />
              </div>
              <button
                disabled={loading || !username}
                className="btn-primary w-full"
              >
                {loading ? 'Validating...' : 'Proceed'}
              </button>
            </motion.form>
          )}

          {step === 'PASSWORD' && (
            <motion.form 
              key="password"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onSubmit={handlePasswordLogin} 
              className="space-y-6"
            >
              <button 
                type="button"
                onClick={() => setStep('IDENTIFY')}
                className="flex items-center gap-2 text-zinc-600 hover:text-white text-[9px] font-bold uppercase tracking-widest mb-6 transition-colors"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                Back
              </button>
              <div className="space-y-3">
                <label className="block text-[9px] font-bold text-zinc-600 uppercase tracking-[0.3em] ml-1">Access Hash</label>
                <div className="relative group">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    autoFocus
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input-simple w-full pr-12 font-mono"
                    placeholder="••••••••"
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-700 hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <button
                disabled={loading}
                className="btn-primary w-full"
              >
                {loading ? 'Authorizing...' : 'Initialize'}
              </button>
            </motion.form>
          )}

          {(step === 'PIN' || step === 'SETUP_PIN') && (
            <motion.form 
              key="pin"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onSubmit={step === 'PIN' ? handlePinSubmit : handleSetupPin} 
              className="space-y-10"
            >
              <div className="text-center">
                <h3 className="text-white font-bold text-lg mb-2">
                  {step === 'PIN' ? 'Verify Access' : 'Initial PIN Setup'}
                </h3>
                <p className="text-zinc-600 text-[10px] font-medium leading-relaxed">
                  {step === 'PIN' ? `Enter credential for ${username}` : 'Configure 4-digit security sequence'}
                </p>
                {step === 'PIN' && (
                  <button 
                    type="button"
                    onClick={() => { setStep('PASSWORD'); setPin(['','','','']); }}
                    className="text-white text-[9px] font-bold uppercase tracking-widest mt-4 hover:opacity-70 transition-opacity"
                  >
                    Use Password Instead
                  </button>
                )}
              </div>

              <div className="flex justify-center gap-4">
                  {pin.map((digit, idx) => (
                    <input
                      key={idx}
                      id={`pin-${idx}`}
                      type="password"
                      inputMode="numeric"
                      required
                      autoFocus={idx === 0}
                      value={digit}
                      onChange={(e) => handlePinChange(idx, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(idx, e)}
                      className="w-12 h-16 bg-white/[0.01] border border-white/10 rounded-2xl text-center text-3xl font-bold text-white focus:outline-none focus:border-white/40 transition-all font-mono"
                    />
                  ))}
              </div>

              <button
                disabled={loading || pin.some(p => p === '')}
                className="btn-primary w-full"
              >
                {loading ? 'Verifying...' : 'Authorize'}
              </button>

              <button 
                type="button"
                onClick={() => { setStep('IDENTIFY'); setPin(['','','','']); }}
                className="block w-full text-zinc-700 text-[9px] font-bold uppercase tracking-widest hover:text-white transition-colors"
              >
                Switch Identity
              </button>
            </motion.form>
          )}
        </AnimatePresence>

        {error && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-10 p-4 bg-rose-500/5 border border-rose-500/10 rounded-2xl text-rose-500 text-[9px] font-bold uppercase tracking-widest flex items-center gap-3"
          >
            <AlertCircle className="w-3.5 h-3.5" />
            {error}
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
