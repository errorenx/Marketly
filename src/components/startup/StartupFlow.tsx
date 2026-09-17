import React, { useState } from 'react';
import { useI18n } from '../../i18n/I18nContext';
import { User, UserRole } from '../../types';
import { api } from '../../services/api';
import { saveUserToSupabase } from '../../services/supabase';
import {
  Sparkles,
  Store,
  Users,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  Phone,
  Mail,
  Lock,
  User as UserIcon,
  MapPin,
  Camera,
  LogIn,
  UserPlus
} from 'lucide-react';

interface StartupFlowProps {
  onComplete: (user: User) => void;
}

const CITIES_PAKISTAN = [
  'Lahore', 'Karachi', 'Islamabad', 'Rawalpindi', 'Faisalabad',
  'Peshawar', 'Multan', 'Quetta', 'Sialkot', 'Gujranwala', 'Hyderabad'
];

const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&auto=format&fit=crop&q=80',
];

export const StartupFlow: React.FC<StartupFlowProps> = ({ onComplete }) => {
  const { t, language, setLanguage } = useI18n();
  const [mode, setMode] = useState<'register' | 'login'>('register');

  // Registration states
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [city, setCity] = useState('Lahore');
  const [role, setRole] = useState<UserRole>('SELLER'); // Only SELLER or SOCIAL
  const [businessName, setBusinessName] = useState('');
  const [bio, setBio] = useState('');
  const [avatar, setAvatar] = useState(PRESET_AVATARS[0]);

  // Username validation
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [usernameStatus, setUsernameStatus] = useState<{ available: boolean; message: string } | null>(null);

  // Login states
  const [loginId, setLoginId] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Status & Error
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Debounced username checker
  const handleUsernameChange = async (val: string) => {
    const clean = val.toLowerCase().replace(/[^a-z0-9_]/g, '');
    setUsername(clean);
    setUsernameStatus(null);
    if (clean.length < 3) return;

    setCheckingUsername(true);
    try {
      const res = await api.checkUsername(clean);
      setUsernameStatus(res);
    } catch {
      // ignore
    } finally {
      setCheckingUsername(false);
    }
  };

  // Handle Create Account submit
  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    // Form validations
    if (!firstName.trim() || !lastName.trim()) {
      setError('Please enter your First and Last Name');
      return;
    }
    if (!username.trim() || username.length < 3) {
      setError('Username must be at least 3 characters');
      return;
    }
    if (!email.trim() || !email.includes('@') || !email.includes('.')) {
      setError('Please provide a valid email address');
      return;
    }
    if (!password || password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (usernameStatus && !usernameStatus.available) {
      setError('This username is already taken. Please choose another.');
      return;
    }

    setLoading(true);

    try {
      const registerData = {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        username: username.trim(),
        email: email.trim(),
        phone: phone.trim(),
        password,
        role, // Strictly SELLER or SOCIAL
        avatar,
        bio: bio.trim() || (role === 'SELLER' ? `${businessName || firstName}'s Official Store` : `Hey, I am on Marketly!`),
        description: role === 'SELLER' && businessName ? `Store: ${businessName}` : '',
        country: 'Pakistan',
        city,
        sellerSettings: role === 'SELLER' ? {
          businessName: businessName.trim() || `${firstName} Store`,
          welcomeMessage: 'Welcome to our verified shop! COD available on all orders.',
          completeAddress: `${city}, Pakistan`,
        } : undefined,
        agreeSellerRules: role === 'SELLER',
      };

      // 1. Register with backend API / local database
      const res = await api.register(registerData);
      const newUser = res.user;

      // 2. Persist to Supabase if configured
      try {
        await saveUserToSupabase({
          ...newUser,
          phone: phone.trim(),
        });
      } catch (sbErr) {
        console.warn('Supabase sync notice:', sbErr);
      }

      setSuccessMsg('Account created successfully! Loading your feed...');
      setTimeout(() => {
        onComplete(newUser);
      }, 400);
    } catch (err: any) {
      console.error('Account creation error:', err);
      setError(err.message || 'Failed to create account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginId.trim()) {
      setError('Please enter your username or email');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await api.login(loginId.trim());
      onComplete(res.user);
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-slate-100 flex items-center justify-center p-3 sm:p-6 py-8">
      <div className="w-full max-w-xl bg-slate-900/95 border border-slate-800 backdrop-blur-2xl rounded-3xl p-5 sm:p-8 shadow-2xl relative overflow-hidden my-auto">
        {/* Glow accents */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-violet-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />

        {/* Top Header & Branding */}
        <div className="flex items-center justify-between mb-5 pb-4 border-b border-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-violet-500/30">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
                MARKETLY
              </h1>
              <p className="text-xs text-violet-400 font-medium">
                {language === 'ur' ? 'تلاش کریں۔ جڑیں۔ فروخت کریں۔' : 'Discover. Connect. Sell.'}
              </p>
            </div>
          </div>

          {/* Language Toggle */}
          <div className="flex items-center gap-1 bg-slate-800/90 p-1 rounded-full text-xs font-semibold border border-slate-700/50">
            <button
              type="button"
              onClick={() => setLanguage('en')}
              className={`px-2.5 py-1 rounded-full transition-all ${
                language === 'en' ? 'bg-violet-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              EN
            </button>
            <button
              type="button"
              onClick={() => setLanguage('ur')}
              className={`px-2.5 py-1 rounded-full transition-all font-urdu ${
                language === 'ur' ? 'bg-violet-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              اردو
            </button>
          </div>
        </div>

        {/* Mode Switcher: Create Account vs Sign In */}
        <div className="grid grid-cols-2 gap-2 p-1 bg-slate-950/60 rounded-2xl border border-slate-800 mb-5">
          <button
            type="button"
            onClick={() => {
              setMode('register');
              setError(null);
            }}
            className={`py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all ${
              mode === 'register'
                ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <UserPlus className="w-4 h-4" />
            <span>{language === 'ur' ? 'نیا اکاؤنٹ بنائیں' : 'Create Account'}</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setError(null);
            }}
            className={`py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all ${
              mode === 'login'
                ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <LogIn className="w-4 h-4" />
            <span>{language === 'ur' ? 'لاگ ان کریں' : 'Sign In'}</span>
          </button>
        </div>

        {/* Error / Success Notifications */}
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* MODE 1: CREATE ACCOUNT FORM */}
        {mode === 'register' && (
          <form onSubmit={handleCreateAccount} className="space-y-4 max-h-[68vh] overflow-y-auto pr-1">
            {/* Account Type Selection: Only SELLER and SOCIAL */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-2">
                {language === 'ur' ? 'اکاؤنٹ کی قسم منتخب کریں' : 'Select Account Type *'}
              </label>
              <div className="grid grid-cols-2 gap-3">
                {/* SELLER ROLE */}
                <button
                  type="button"
                  onClick={() => setRole('SELLER')}
                  className={`p-3 rounded-2xl border text-left rtl:text-right transition-all flex flex-col justify-between ${
                    role === 'SELLER'
                      ? 'border-violet-500 bg-violet-600/15 ring-2 ring-violet-500/30'
                      : 'border-slate-800 bg-slate-800/40 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-1">
                    <Store className={`w-5 h-5 ${role === 'SELLER' ? 'text-violet-400' : 'text-slate-400'}`} />
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300">
                      Seller
                    </span>
                  </div>
                  <p className="font-bold text-sm text-white">{language === 'ur' ? 'سیلر اکاؤنٹ' : 'Seller Account'}</p>
                  <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                    {language === 'ur' ? 'پروڈکٹس بیچیں، آرڈرز اور پوسٹس شامل کریں' : 'Sell items, list products & post reels'}
                  </p>
                </button>

                {/* SOCIAL ROLE */}
                <button
                  type="button"
                  onClick={() => setRole('SOCIAL')}
                  className={`p-3 rounded-2xl border text-left rtl:text-right transition-all flex flex-col justify-between ${
                    role === 'SOCIAL'
                      ? 'border-indigo-500 bg-indigo-600/15 ring-2 ring-indigo-500/30'
                      : 'border-slate-800 bg-slate-800/40 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-1">
                    <Users className={`w-5 h-5 ${role === 'SOCIAL' ? 'text-indigo-400' : 'text-slate-400'}`} />
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300">
                      Social
                    </span>
                  </div>
                  <p className="font-bold text-sm text-white">{language === 'ur' ? 'سوشل اکاؤنٹ' : 'Social Account'}</p>
                  <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                    {language === 'ur' ? 'فوٹو، ویڈیوز شیئر کریں اور چیٹ کریں' : 'Share photos, videos, stories & chat'}
                  </p>
                </button>
              </div>
            </div>

            {/* Profile Avatar Selection */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-2">
                {language === 'ur' ? 'پروفائل تصویر منتخب کریں' : 'Choose Profile Picture'}
              </label>
              <div className="flex items-center gap-3">
                <img
                  src={avatar}
                  alt="Selected Avatar"
                  className="w-14 h-14 rounded-2xl object-cover border-2 border-violet-500 shadow-md shrink-0"
                />
                <div className="flex items-center gap-2 overflow-x-auto pb-1 flex-1">
                  {PRESET_AVATARS.map((url, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setAvatar(url)}
                      className={`w-10 h-10 rounded-xl overflow-hidden border shrink-0 transition-all ${
                        avatar === url ? 'border-violet-500 ring-2 ring-violet-500/50' : 'border-slate-700 opacity-60 hover:opacity-100'
                      }`}
                    >
                      <img src={url} alt={`Preset ${i}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Full Name: First & Last */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  {language === 'ur' ? 'پہلا نام' : 'First Name'} *
                </label>
                <input
                  type="text"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="e.g. Tariq"
                  className="w-full px-3.5 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-violet-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  {language === 'ur' ? 'آخری نام' : 'Last Name'} *
                </label>
                <input
                  type="text"
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="e.g. Javed"
                  className="w-full px-3.5 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-violet-500"
                />
              </div>
            </div>

            {/* Username */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                {language === 'ur' ? 'یوزر نیم' : 'Username'} *
              </label>
              <div className="relative">
                <span className="absolute left-3.5 rtl:right-3.5 rtl:left-auto top-2.5 text-slate-500 text-sm">@</span>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => handleUsernameChange(e.target.value)}
                  placeholder="unique_username"
                  className="w-full pl-8 rtl:pr-8 rtl:pl-3.5 pr-3.5 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-violet-500"
                />
              </div>
              {checkingUsername && (
                <p className="text-[11px] text-slate-400 mt-1">Checking username availability...</p>
              )}
              {usernameStatus && (
                <p className={`text-[11px] mt-1 flex items-center gap-1 ${usernameStatus.available ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {usernameStatus.available ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                  <span>{usernameStatus.available ? 'Username available' : 'Username already taken'}</span>
                </p>
              )}
            </div>

            {/* Email & Phone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  {language === 'ur' ? 'ای میل ایڈریس' : 'Email Address'} *
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3 rtl:right-3 rtl:left-auto top-3" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="user@example.com"
                    className="w-full pl-9 rtl:pr-9 rtl:pl-3.5 pr-3.5 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-violet-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  {language === 'ur' ? 'فون نمبر / واٹس ایپ' : 'Phone / WhatsApp'}
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-500 absolute left-3 rtl:right-3 rtl:left-auto top-3" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="0300-1234567"
                    className="w-full pl-9 rtl:pr-9 rtl:pl-3.5 pr-3.5 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-violet-500"
                  />
                </div>
              </div>
            </div>

            {/* City Selection */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                {language === 'ur' ? 'شہر' : 'City (Pakistan)'} *
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-slate-500 absolute left-3 rtl:right-3 rtl:left-auto top-3" />
                <select
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full pl-9 rtl:pr-9 rtl:pl-3.5 pr-3.5 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-violet-500"
                >
                  {CITIES_PAKISTAN.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* If Seller: Business / Store Name */}
            {role === 'SELLER' && (
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  {language === 'ur' ? 'دکان یا برانڈ کا نام' : 'Shop / Business Name'}
                </label>
                <input
                  type="text"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="e.g. Lahore Trends or Smart Electronics"
                  className="w-full px-3.5 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-violet-500"
                />
              </div>
            )}

            {/* Bio */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                {language === 'ur' ? 'مختصر تفصیل (Bio)' : 'Bio / About You'}
              </label>
              <input
                type="text"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder={role === 'SELLER' ? 'Verified seller in Pakistan' : 'Creating content & connecting'}
                className="w-full px-3.5 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-violet-500"
              />
            </div>

            {/* Password & Confirm Password */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  {language === 'ur' ? 'پاس ورڈ' : 'Password'} *
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3 rtl:right-3 rtl:left-auto top-3" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 rtl:pr-9 rtl:pl-3.5 pr-3.5 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-violet-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  {language === 'ur' ? 'پاس ورڈ کی تصدیق' : 'Confirm Password'} *
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3 rtl:right-3 rtl:left-auto top-3" />
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 rtl:pr-9 rtl:pl-3.5 pr-3.5 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-violet-500"
                  />
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-3">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-4 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-extrabold rounded-2xl shadow-xl shadow-violet-600/30 transition-all flex items-center justify-center gap-2 active:scale-98 disabled:opacity-50"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Creating Account & Saving...</span>
                  </div>
                ) : (
                  <>
                    <span>{language === 'ur' ? 'اکاؤنٹ بنائیں' : 'Create Account & Start'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* MODE 2: SIGN IN FORM */}
        {mode === 'login' && (
          <form onSubmit={handleLogin} className="space-y-4 pt-2">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                {language === 'ur' ? 'یوزر نیم یا ای میل' : 'Username or Email'}
              </label>
              <div className="relative">
                <UserIcon className="w-4 h-4 text-slate-500 absolute left-3 rtl:right-3 rtl:left-auto top-3" />
                <input
                  type="text"
                  required
                  value={loginId}
                  onChange={(e) => setLoginId(e.target.value)}
                  placeholder="e.g. tariq_seller or your email"
                  className="w-full pl-9 rtl:pr-9 rtl:pl-3.5 pr-3.5 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-violet-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                {language === 'ur' ? 'پاس ورڈ' : 'Password'}
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3 rtl:right-3 rtl:left-auto top-3" />
                <input
                  type="password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 rtl:pr-9 rtl:pl-3.5 pr-3.5 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-violet-500"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading || !loginId.trim()}
                className="w-full py-3.5 px-4 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-extrabold rounded-2xl shadow-xl shadow-violet-600/30 transition-all flex items-center justify-center gap-2 active:scale-98 disabled:opacity-50"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Signing in...</span>
                  </div>
                ) : (
                  <>
                    <span>{language === 'ur' ? 'لاگ ان کریں' : 'Sign In'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>

            {/* Quick Demo Login shortcuts */}
            <div className="pt-4 border-t border-slate-800/80 text-center">
              <p className="text-xs text-slate-400 mb-2">Or quick-start as existing account:</p>
              <div className="flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setLoginId('zayd_gadgets');
                    api.login('zayd_gadgets').then((res) => onComplete(res.user));
                  }}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-violet-300 border border-slate-700 flex items-center gap-1.5"
                >
                  <Store className="w-3.5 h-3.5" />
                  <span>Seller Demo</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setLoginId('sara_social');
                    api.login('sara_social').then((res) => onComplete(res.user));
                  }}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-indigo-300 border border-slate-700 flex items-center gap-1.5"
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>Social Demo</span>
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
