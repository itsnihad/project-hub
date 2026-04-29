import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShieldCheck, 
  Plus, 
  Lock, 
  Check, 
  AlertCircle,
  Eye,
  EyeOff,
  X
} from 'lucide-react';
import { authService } from '../services/authService';
import { AppUser } from '../types';
import { cn } from '../lib/utils';

interface SettingsProps {
  currentUser: AppUser;
  onUserUpdate: (user: AppUser) => void;
}

export default function Settings({ currentUser, onUserUpdate }: SettingsProps) {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddUser, setShowAddUser] = useState(false);
  const [newUserData, setNewUserData] = useState<{ username: string; password: string; role: 'user' | 'admin' }>({ username: '', password: '', role: 'user' });
  const [pin, setPin] = useState(['', '', '', '']);
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState({ text: '', type: 'success' as 'success' | 'error' });

  const fetchUsers = async () => {
    if (currentUser.role === 'admin') {
      const data = await authService.getUsers();
      setUsers(data);
    }
  };

  useEffect(() => {
    fetchUsers();
    if (currentUser.pin) {
      setPin(currentUser.pin.split(''));
    }
  }, []);

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await authService.createUser(newUserData);
      setMessage({ text: 'User entity successfully registered in database', type: 'success' });
      setShowAddUser(false);
      setNewUserData({ username: '', password: '', role: 'user' });
      fetchUsers();
    } catch (err: any) {
      setMessage({ text: err.message || 'Error executing user registry', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleSetPin = async () => {
    if (pin.some(p => p === '')) {
      setMessage({ text: 'PIN sequence incomplete', type: 'error' });
      return;
    }
    setLoading(true);
    try {
      const pinStr = pin.join('');
      await authService.setPin(currentUser.id, pinStr);
      setMessage({ text: 'Biometric/PIN sync successful', type: 'success' });
      onUserUpdate({ ...currentUser, pin: pinStr });
    } catch (err: any) {
      setMessage({ text: 'Cryptographic sync failed', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordData, setPasswordData] = useState({ current: '', new: '', confirm: '' });

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordData.new !== passwordData.confirm) {
      setMessage({ text: 'Passwords do not match', type: 'error' });
      return;
    }
    setLoading(true);
    try {
      await authService.updatePassword(currentUser.id, passwordData.new);
      setMessage({ text: 'Security hash updated successfully', type: 'success' });
      setIsChangingPassword(false);
      setPasswordData({ current: '', new: '', confirm: '' });
      onUserUpdate({ ...currentUser, password: passwordData.new });
    } catch (err: any) {
      setMessage({ text: 'Update failed: System rejection', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-12 animate-in fade-in duration-700">
      <header className="mb-12">
        <h1 className="text-3xl font-bold text-white tracking-tight">Configuration</h1>
        <p className="text-sm text-zinc-500 font-medium mt-1">Operational security and access control.</p>
      </header>

      {message.text && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            "p-6 rounded-[24px] flex items-center gap-4 text-sm font-bold tracking-tight border",
            message.type === 'success' 
              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" 
              : "bg-rose-500/10 text-rose-400 border-rose-500/20"
          )}
        >
          {message.text}
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <div className="space-y-10">
          <section className="glass-pane group">
            <div className="flex items-center gap-4 mb-12">
              <div className="w-10 h-10 bg-white/[0.02] rounded-full flex items-center justify-center border border-white/10">
                <ShieldCheck className="w-4 h-4 text-white" />
              </div>
              <h3 className="text-[10px] font-bold text-white uppercase tracking-[0.4em]">Security Node</h3>
            </div>

            <div className="space-y-12">
              <div className="space-y-8">
                <div className="flex flex-col items-center gap-8">
                  <p className="text-[9px] font-bold text-zinc-600 uppercase tracking-[0.4em]">Access PIN</p>
                  <div className="flex justify-center gap-4">
                    {pin.map((digit, idx) => (
                      <input
                        key={idx}
                        type="password"
                        maxLength={1}
                        value={digit}
                        onKeyDown={(e) => {
                          if (e.key === 'Backspace') {
                            const newPin = [...pin];
                            if (!pin[idx] && idx > 0) {
                              const prevInput = (e.target as HTMLInputElement).previousElementSibling as HTMLInputElement;
                              prevInput?.focus();
                              newPin[idx-1] = '';
                            } else {
                              newPin[idx] = '';
                            }
                            setPin(newPin);
                          }
                        }}
                        onChange={(e) => {
                          const val = e.target.value.replace(/[^0-9]/g, '');
                          if (!val && e.target.value !== '') return;
                          const newPin = [...pin];
                          newPin[idx] = val.slice(-1);
                          setPin(newPin);
                          if (val && idx < 3) {
                            const nextInput = (e.target as HTMLInputElement).nextElementSibling as HTMLInputElement;
                            nextInput?.focus();
                          }
                        }}
                        className="w-12 h-16 bg-white/[0.01] border border-white/10 rounded-2xl text-center text-3xl font-mono text-white focus:outline-none focus:border-white/40 transition-all"
                      />
                    ))}
                  </div>
                </div>
                <button
                  onClick={handleSetPin}
                  disabled={loading || pin.some(p => p === '')}
                  className="btn-primary w-full"
                >
                  {loading ? 'Encrypting...' : 'Sync PIN'}
                </button>
              </div>

              <div className="pt-12 border-t border-white/5 space-y-6">
                <div className="flex items-center justify-between p-6 bg-white/[0.01] rounded-3xl border border-white/5">
                  <div>
                    <p className="text-[8px] uppercase font-bold text-zinc-700 mb-2 tracking-widest">Authentication ID</p>
                    <p className="text-xl font-bold text-white tracking-tight leading-none">{currentUser.username}</p>
                  </div>
                  <div className="w-10 h-10 bg-white/[0.02] rounded-full flex items-center justify-center text-zinc-700">
                    <Lock className="w-4 h-4" />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-6 bg-white/[0.01] rounded-3xl border border-white/5">
                    <div className="flex-1">
                      <p className="text-[8px] uppercase font-bold text-zinc-700 mb-2 tracking-widest">Access Hash</p>
                      <p className="font-mono text-white text-lg tracking-[0.2em]">
                        {showPassword ? currentUser.password : '••••••••'}
                      </p>
                    </div>
                    <div className="flex gap-2">
                       <button 
                        onClick={() => setShowPassword(!showPassword)}
                        className="p-3 text-zinc-700 hover:text-white transition-colors"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                      <button 
                        onClick={() => setIsChangingPassword(!isChangingPassword)}
                        className="p-3 bg-white text-black rounded-full text-[9px] font-bold uppercase tracking-widest px-4"
                      >
                        Change
                      </button>
                    </div>
                  </div>

                  <AnimatePresence>
                    {isChangingPassword && (
                      <motion.form 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        onSubmit={handleUpdatePassword}
                        className="overflow-hidden space-y-4 bg-white/[0.02] p-6 rounded-3xl border border-white/5"
                      >
                        <input 
                          type="password"
                          required
                          placeholder="New security hash"
                          value={passwordData.new}
                          onChange={(e) => setPasswordData({...passwordData, new: e.target.value})}
                          className="input-simple w-full bg-transparent"
                        />
                        <input 
                          type="password"
                          required
                          placeholder="Confirm hash"
                          value={passwordData.confirm}
                          onChange={(e) => setPasswordData({...passwordData, confirm: e.target.value})}
                          className="input-simple w-full bg-transparent"
                        />
                        <button type="submit" disabled={loading} className="btn-primary w-full">
                          {loading ? 'Processing...' : 'Confirm Update'}
                        </button>
                      </motion.form>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </section>

          {currentUser.role === 'admin' && showAddUser && (
            <motion.section 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="glass-pane border-white/10"
            >
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-[10px] font-bold text-white uppercase tracking-[0.4em]">Register Node</h3>
                <button onClick={() => setShowAddUser(false)} className="text-zinc-700 hover:text-white transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAddUser} className="space-y-6">
                <input
                  type="text"
                  required
                  value={newUserData.username}
                  onChange={(e) => setNewUserData({ ...newUserData, username: e.target.value })}
                  className="input-simple w-full"
                  placeholder="Username"
                />
                <input
                  type="password"
                  required
                  value={newUserData.password}
                  onChange={(e) => setNewUserData({ ...newUserData, password: e.target.value })}
                  className="input-simple w-full"
                  placeholder="Password"
                />
                <div className="flex gap-2 p-1 bg-white/[0.02] rounded-full border border-white/5">
                  {(['user', 'admin'] as const).map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setNewUserData({ ...newUserData, role: r })}
                      className={cn(
                        "flex-1 py-3 rounded-full text-[9px] font-bold uppercase tracking-widest transition-all",
                        newUserData.role === r 
                          ? "bg-white text-black shadow-lg" 
                          : "text-zinc-600 hover:text-white"
                      )}
                    >
                      {r} Tier
                    </button>
                  ))}
                </div>
                <button type="submit" disabled={loading} className="btn-primary w-full">
                  Authorize Node
                </button>
              </form>
            </motion.section>
          )}
        </div>

        {currentUser.role === 'admin' && (
          <div className="h-full">
            <section className="glass-pane h-full !p-0 overflow-hidden flex flex-col">
              <div className="p-8 border-b border-white/5 flex items-center justify-between">
                <div>
                  <h3 className="text-[10px] font-bold text-white uppercase tracking-[0.4em]">Node Registry</h3>
                  <p className="text-[9px] font-bold text-zinc-700 uppercase tracking-widest mt-1">{users.length} units active</p>
                </div>
                {!showAddUser && (
                  <button 
                    onClick={() => setShowAddUser(true)}
                    className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-black"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                )}
              </div>
              
              <div className="overflow-y-auto flex-1">
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead>
                    <tr className="bg-white/[0.01] text-zinc-700 text-[9px] font-bold uppercase tracking-[0.3em] border-b border-white/5">
                      <th className="px-8 py-5">Node</th>
                      <th className="px-8 py-5">Tier</th>
                      <th className="px-8 py-5 text-right">Ops</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {users.map((u: AppUser) => (
                      <tr key={u.id} className="hover:bg-white/[0.01] transition-colors group">
                        <td className="px-8 py-6">
                           <div className="font-bold text-white tracking-tight">{u.username}</div>
                        </td>
                        <td className="px-8 py-6">
                          <span className={cn(
                            "px-2 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-widest border border-white/5",
                            u.role === 'admin' ? "bg-white text-black" : "text-zinc-700"
                          )}>
                            {u.role}
                          </span>
                        </td>
                        <td className="px-8 py-6 text-right">
                          {u.id !== currentUser.id && (
                            <button 
                              onClick={async () => {
                                if (window.confirm(`Purge node "${u.username}"?`)) {
                                  try {
                                    await authService.deleteUser(u.id);
                                    fetchUsers();
                                  } catch (err: any) {}
                                }
                              }}
                              className="text-rose-500/40 hover:text-rose-500 p-2 transition-opacity opacity-0 group-hover:opacity-100"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
