import React, { useState } from 'react';
import { useI18n } from '../../i18n/I18nContext';
import { User, UserRole, Language } from '../../types';
import { api } from '../../services/api';
import { Globe, CheckCircle2, AlertCircle, ShieldCheck, Sparkles, Store, ShoppingBag, Users, ArrowRight, Upload, Lock, Check } from 'lucide-react';

interface StartupFlowProps {
  onComplete: (user: User) => void;
}

const CITIES_PAKISTAN = [
  "Lahore", "Karachi", "Islamabad", "Rawalpindi", "Faisalabad",
  "Peshawar", "Multan", "Quetta", "Sialkot", "Gujranwala", "Hyderabad"
];

const PRESET_AVATARS = [
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&auto=format&fit=crop&q=80",
];

export const StartupFlow: React.FC<StartupFlowProps> = ({ onComplete }) => {
  const { t, language, setLanguage } = useI18n();
  const [screen, setScreen] = useState<number>(1); // 1: Language, 2: Welcome, 3: Account, 4: Profile, 5: Role, 6: SellerRules, 7: Login

  // Form states
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Username check
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [usernameStatus, setUsernameStatus] = useState<{ available: boolean; message: string } | null>(null);

  // Profile states
  const [avatar, setAvatar] = useState(PRESET_AVATARS[0]);
  const [bio, setBio] = useState('');
  const [description, setDescription] = useState('');
  const [country] = useState('Pakistan');
  const [city, setCity] = useState('Lahore');

  // Role
  const [selectedRole, setSelectedRole] = useState<UserRole>('BUYER');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Login state
  const [loginInput, setLoginInput] = useState('');

  // Handle Username availability check with debounce
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

  // Screen 3 validation
  const validateAccount = () => {
    if (!firstName.trim() || !lastName.trim() || !username.trim() || !email.trim() || !password) {
      setError(t('required_field'));
      return false;
    }
    if (!email.includes('@') || !email.includes('.')) {
      setError(t('valid_email_req'));
      return false;
    }
    if (password.length < 6) {
      setError(t('strong_pwd_req'));
      return false;
    }
    if (password !== confirmPassword) {
      setError(t('password_mismatch'));
      return false;
    }
    if (usernameStatus && !usernameStatus.available) {
      setError(t('username_taken'));
      return false;
    }
    setError(null);
    return true;
  };

  const handleFinishSignup = async (role: UserRole) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.register({
        firstName,
        lastName,
        username,
        email,
        password,
        role,
        avatar,
        bio,
        description,
        country,
        city,
        agreeSellerRules: role === 'SELLER',
      });
      onComplete(res.user);
    } catch (err: any) {
      setError(err.message || t('error_occurred'));
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (loginId: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.login(loginId);
      onComplete(res.user);
    } catch (err: any) {
      setError(err.message || t('error_occurred'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-slate-900/90 border border-slate-800 backdrop-blur-xl rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        
        {/* Glow accent */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-violet-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />

        {/* Header Branding */}
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-800/80">
          <div className="flex items-center space-x-3 rtl:space-x-reverse">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-violet-500/25">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                MARKETLY
              </h1>
              <p className="text-xs text-violet-400 font-medium tracking-wide">
                {t('brand_tagline')}
              </p>
            </div>
          </div>

          {/* Language selector toggle */}
          <div className="flex items-center gap-1 bg-slate-800/80 p-1 rounded-full text-xs font-semibold">
            <button
              onClick={() => setLanguage('en')}
              className={`px-2.5 py-1 rounded-full transition-all ${
                language === 'en' ? 'bg-violet-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              EN
            </button>
            <button
              onClick={() => setLanguage('ur')}
              className={`px-2.5 py-1 rounded-full transition-all font-urdu ${
                language === 'ur' ? 'bg-violet-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              اردو
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* SCREEN 1: LANGUAGE */}
        {screen === 1 && (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold text-white">{t('choose_language')}</h2>
              <p className="text-sm text-slate-400">{t('select_language_desc')}</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
              <button
                type="button"
                onClick={() => setLanguage('en')}
                className={`p-4 rounded-2xl border text-left transition-all flex items-center justify-between ${
                  language === 'en'
                    ? 'border-violet-500 bg-violet-600/15 ring-2 ring-violet-500/30'
                    : 'border-slate-800 bg-slate-800/40 hover:border-slate-700'
                }`}
              >
                <div>
                  <p className="font-bold text-white text-base">English</p>
                  <p className="text-xs text-slate-400">Discover. Connect. Sell.</p>
                </div>
                {language === 'en' && <CheckCircle2 className="w-5 h-5 text-violet-400" />}
              </button>

              <button
                type="button"
                onClick={() => setLanguage('ur')}
                className={`p-4 rounded-2xl border text-right font-urdu transition-all flex items-center justify-between ${
                  language === 'ur'
                    ? 'border-violet-500 bg-violet-600/15 ring-2 ring-violet-500/30'
                    : 'border-slate-800 bg-slate-800/40 hover:border-slate-700'
                }`}
              >
                {language === 'ur' && <CheckCircle2 className="w-5 h-5 text-violet-400" />}
                <div>
                  <p className="font-bold text-white text-lg">اردو</p>
                  <p className="text-xs text-slate-400 font-urdu">تلاش کریں۔ جڑیں۔ فروخت کریں۔</p>
                </div>
              </button>
            </div>

            <button
              onClick={() => setScreen(2)}
              className="w-full mt-4 py-3.5 px-4 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold rounded-2xl shadow-lg shadow-violet-600/30 transition-all flex items-center justify-center gap-2 group"
            >
              <span>{t('continue_btn')}</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition-transform" />
            </button>
          </div>
        )}

        {/* SCREEN 2: WELCOME */}
        {screen === 2 && (
          <div className="space-y-6 text-center">
            <div className="space-y-2">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
                {t('welcome_to_marketly')}
              </h2>
              <p className="text-sm text-slate-400 max-w-sm mx-auto">
                {t('welcome_sub')}
              </p>
            </div>

            <div className="py-6 flex justify-center">
              <div className="grid grid-cols-3 gap-3 w-full max-w-sm">
                <div className="p-3.5 bg-slate-800/50 border border-slate-700/50 rounded-2xl text-center space-y-1">
                  <Store className="w-6 h-6 text-violet-400 mx-auto" />
                  <p className="text-xs font-bold text-white">{t('tab_seller')}</p>
                </div>
                <div className="p-3.5 bg-slate-800/50 border border-slate-700/50 rounded-2xl text-center space-y-1">
                  <ShoppingBag className="w-6 h-6 text-indigo-400 mx-auto" />
                  <p className="text-xs font-bold text-white">{t('tab_buyer')}</p>
                </div>
                <div className="p-3.5 bg-slate-800/50 border border-slate-700/50 rounded-2xl text-center space-y-1">
                  <Users className="w-6 h-6 text-sky-400 mx-auto" />
                  <p className="text-xs font-bold text-white">{t('tab_social')}</p>
                </div>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <button
                onClick={() => setScreen(3)}
                className="w-full py-3.5 px-4 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold rounded-2xl shadow-lg shadow-violet-600/30 transition-all flex items-center justify-center gap-2"
              >
                <span>{t('create_account')}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => setScreen(7)}
                className="w-full py-3.5 px-4 bg-slate-800/80 hover:bg-slate-800 text-slate-200 font-semibold rounded-2xl border border-slate-700 transition-all"
              >
                {t('login')}
              </button>
            </div>
          </div>
        )}

        {/* SCREEN 3: CREATE ACCOUNT */}
        {screen === 3 && (
          <div className="space-y-4">
            <div className="space-y-1">
              <h2 className="text-xl sm:text-2xl font-bold text-white">{t('create_account')}</h2>
              <p className="text-xs text-slate-400">Step 1 of 3: Credentials & identity</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">{t('first_name')} *</label>
                <input
                  type="text"
                  value={firstName}
                  onChange={e => setFirstName(e.target.value)}
                  placeholder="e.g. Tariq"
                  className="w-full px-3.5 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-violet-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">{t('last_name')} *</label>
                <input
                  type="text"
                  value={lastName}
                  onChange={e => setLastName(e.target.value)}
                  placeholder="e.g. Javed"
                  className="w-full px-3.5 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-violet-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">{t('username')} *</label>
              <div className="relative">
                <span className="absolute left-3.5 rtl:right-3.5 rtl:left-auto top-2.5 text-slate-500 text-sm">@</span>
                <input
                  type="text"
                  value={username}
                  onChange={e => handleUsernameChange(e.target.value)}
                  placeholder="unique_username"
                  className="w-full pl-8 rtl:pr-8 rtl:pl-3.5 pr-3.5 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-violet-500"
                />
              </div>
              {checkingUsername && (
                <p className="text-[11px] text-slate-400 mt-1">{t('checking_username')}</p>
              )}
              {usernameStatus && (
                <p className={`text-[11px] mt-1 flex items-center gap-1 ${usernameStatus.available ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {usernameStatus.available ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                  <span>{usernameStatus.available ? t('username_available') : t('username_taken')}</span>
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">{t('email_label')} *</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@gmail.com"
                className="w-full px-3.5 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-violet-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">{t('password')} *</label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-violet-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">{t('confirm_password')} *</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-violet-500"
                />
              </div>
            </div>

            <div className="pt-2 flex items-center gap-3">
              <button
                onClick={() => setScreen(2)}
                className="py-3 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium rounded-xl text-sm"
              >
                {t('cancel')}
              </button>
              <button
                onClick={() => {
                  if (validateAccount()) setScreen(4);
                }}
                className="flex-1 py-3 px-4 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold rounded-xl text-sm shadow-md transition-all flex items-center justify-center gap-2"
              >
                <span>{t('continue_btn')}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* SCREEN 4: CREATE PROFILE */}
        {screen === 4 && (
          <div className="space-y-4">
            <div className="space-y-1">
              <h2 className="text-xl sm:text-2xl font-bold text-white">{t('create_profile_title')}</h2>
              <p className="text-xs text-slate-400">{t('create_profile_sub')}</p>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-2">{t('profile_photo')}</label>
              <div className="flex items-center gap-3">
                <img
                  src={avatar}
                  alt="Avatar"
                  className="w-14 h-14 rounded-2xl object-cover border-2 border-violet-500 shadow-md"
                />
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  {PRESET_AVATARS.map((url, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setAvatar(url)}
                      className={`w-9 h-9 rounded-xl overflow-hidden border transition-all ${
                        avatar === url ? 'border-violet-500 ring-2 ring-violet-500/50' : 'border-slate-700 opacity-60 hover:opacity-100'
                      }`}
                    >
                      <img src={url} alt="Preset" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">{t('bio')}</label>
              <input
                type="text"
                value={bio}
                onChange={e => setBio(e.target.value)}
                placeholder={t('bio_placeholder')}
                className="w-full px-3.5 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-violet-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">{t('description')}</label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                rows={2}
                placeholder={t('description_placeholder')}
                className="w-full px-3.5 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-violet-500 resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">{t('country')}</label>
                <input
                  type="text"
                  disabled
                  value={t('pakistan')}
                  className="w-full px-3.5 py-2 bg-slate-800/40 border border-slate-800 rounded-xl text-slate-400 text-sm cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">{t('city')}</label>
                <select
                  value={city}
                  onChange={e => setCity(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-violet-500"
                >
                  {CITIES_PAKISTAN.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="pt-2 flex items-center gap-3">
              <button
                onClick={() => setScreen(3)}
                className="py-3 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium rounded-xl text-sm"
              >
                Back
              </button>
              <button
                onClick={() => setScreen(5)}
                className="flex-1 py-3 px-4 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold rounded-xl text-sm shadow-md transition-all flex items-center justify-center gap-2"
              >
                <span>{t('continue_btn')}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* SCREEN 5: CHOOSE USER TYPE */}
        {screen === 5 && (
          <div className="space-y-4">
            <div className="space-y-1 text-center">
              <h2 className="text-xl sm:text-2xl font-bold text-white">{t('choose_user_type_title')}</h2>
              <p className="text-xs text-slate-400">{t('choose_user_type_sub')}</p>
            </div>

            <div className="space-y-3 pt-2">
              {/* SELLER */}
              <button
                type="button"
                onClick={() => setSelectedRole('SELLER')}
                className={`w-full p-4 rounded-2xl border text-left rtl:text-right transition-all flex items-start gap-3.5 ${
                  selectedRole === 'SELLER'
                    ? 'border-violet-500 bg-violet-600/15 ring-2 ring-violet-500/30'
                    : 'border-slate-800 bg-slate-800/40 hover:border-slate-700'
                }`}
              >
                <div className="w-10 h-10 rounded-xl bg-violet-600/20 text-violet-400 flex items-center justify-center shrink-0 mt-0.5">
                  <Store className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="font-bold text-white text-base">{t('role_seller_title')}</p>
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/30">
                      7-Day Trial
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">{t('role_seller_desc')}</p>
                </div>
              </button>

              {/* BUYER */}
              <button
                type="button"
                onClick={() => setSelectedRole('BUYER')}
                className={`w-full p-4 rounded-2xl border text-left rtl:text-right transition-all flex items-start gap-3.5 ${
                  selectedRole === 'BUYER'
                    ? 'border-indigo-500 bg-indigo-600/15 ring-2 ring-indigo-500/30'
                    : 'border-slate-800 bg-slate-800/40 hover:border-slate-700'
                }`}
              >
                <div className="w-10 h-10 rounded-xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center shrink-0 mt-0.5">
                  <ShoppingBag className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="font-bold text-white text-base">{t('role_buyer_title')}</p>
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      Free
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">{t('role_buyer_desc')}</p>
                </div>
              </button>

              {/* SOCIAL */}
              <button
                type="button"
                onClick={() => setSelectedRole('SOCIAL')}
                className={`w-full p-4 rounded-2xl border text-left rtl:text-right transition-all flex items-start gap-3.5 ${
                  selectedRole === 'SOCIAL'
                    ? 'border-sky-500 bg-sky-600/15 ring-2 ring-sky-500/30'
                    : 'border-slate-800 bg-slate-800/40 hover:border-slate-700'
                }`}
              >
                <div className="w-10 h-10 rounded-xl bg-sky-600/20 text-sky-400 flex items-center justify-center shrink-0 mt-0.5">
                  <Users className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="font-bold text-white text-base">{t('role_social_title')}</p>
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/30">
                      Free
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">{t('role_social_desc')}</p>
                </div>
              </button>
            </div>

            <div className="pt-3 flex items-center gap-3">
              <button
                onClick={() => setScreen(4)}
                className="py-3 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium rounded-xl text-sm"
              >
                Back
              </button>
              <button
                disabled={loading}
                onClick={() => {
                  if (selectedRole === 'SELLER') {
                    setScreen(6); // Go to Seller Rules
                  } else {
                    handleFinishSignup(selectedRole);
                  }
                }}
                className="flex-1 py-3.5 px-4 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold rounded-xl text-sm shadow-lg shadow-violet-600/30 transition-all flex items-center justify-center gap-2"
              >
                {loading ? (
                  <span>{t('loading')}</span>
                ) : (
                  <>
                    <span>{selectedRole === 'SELLER' ? 'Review Seller Rules' : t('continue_btn')}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* SCREEN 6: SELLER RULES */}
        {screen === 6 && (
          <div className="space-y-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-violet-400">
                <ShieldCheck className="w-5 h-5" />
                <h2 className="text-xl font-bold text-white">{t('seller_rules_title')}</h2>
              </div>
              <p className="text-xs text-slate-400">{t('seller_rules_sub')}</p>
            </div>

            <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-4 space-y-2.5 max-h-60 overflow-y-auto text-xs text-slate-300 leading-relaxed">
              <div className="flex items-start gap-2">
                <span className="text-violet-400 font-bold">•</span>
                <p>{t('seller_rule_1')}</p>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-violet-400 font-bold">•</span>
                <p>{t('seller_rule_2')}</p>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-violet-400 font-bold">•</span>
                <p>{t('seller_rule_3')}</p>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-violet-400 font-bold">•</span>
                <p>{t('seller_rule_4')}</p>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-violet-400 font-bold">•</span>
                <p>{t('seller_rule_5')}</p>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-violet-400 font-bold">•</span>
                <p>{t('seller_rule_6')}</p>
              </div>
            </div>

            <div className="p-3 bg-violet-600/10 border border-violet-500/20 rounded-xl flex items-center gap-3">
              <Sparkles className="w-5 h-5 text-violet-400 shrink-0" />
              <p className="text-xs text-violet-300">
                Agreeing activates your <strong>7-Day Free Trial</strong> with full Seller Center, unlimited product listings, and COD order inquiries!
              </p>
            </div>

            <div className="pt-2 flex items-center gap-3">
              <button
                type="button"
                onClick={() => setScreen(5)}
                className="py-3 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium rounded-xl text-sm"
              >
                {t('i_dont_agree')}
              </button>
              <button
                disabled={loading}
                onClick={() => handleFinishSignup('SELLER')}
                className="flex-1 py-3.5 px-4 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold rounded-xl text-sm shadow-lg shadow-violet-600/30 transition-all flex items-center justify-center gap-2"
              >
                {loading ? <span>{t('loading')}</span> : <span>{t('i_agree')} & Activate Trial</span>}
              </button>
            </div>
          </div>
        )}

        {/* SCREEN 7: LOGIN */}
        {screen === 7 && (
          <div className="space-y-4">
            <div className="space-y-1">
              <h2 className="text-xl sm:text-2xl font-bold text-white">{t('login')}</h2>
              <p className="text-xs text-slate-400">Sign in with your Marketly username or email</p>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">{t('email_label')} / {t('username')}</label>
              <input
                type="text"
                value={loginInput}
                onChange={e => setLoginInput(e.target.value)}
                placeholder="e.g. zayd_gadgets or bilal@gmail.com"
                className="w-full px-3.5 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-violet-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">{t('password')}</label>
              <input
                type="password"
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-violet-500"
              />
            </div>

            <div className="pt-2 flex items-center gap-3">
              <button
                onClick={() => setScreen(2)}
                className="py-3 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium rounded-xl text-sm"
              >
                Back
              </button>
              <button
                disabled={loading || !loginInput.trim()}
                onClick={() => handleQuickLogin(loginInput)}
                className="flex-1 py-3 px-4 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:opacity-50 text-white font-semibold rounded-xl text-sm shadow-md transition-all flex items-center justify-center gap-2"
              >
                {loading ? <span>{t('loading')}</span> : <span>{t('login_btn')}</span>}
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
