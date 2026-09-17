import React, { useState } from 'react';
import { useI18n } from '../../i18n/I18nContext';
import { api } from '../../services/api';
import { Sparkles, Send, Bot, Trash2, Copy, Check, HelpCircle, Loader2, ArrowLeft } from 'lucide-react';
import { User } from '../../types';

interface MarketlyAIChatProps {
  currentUser?: User;
  onClose?: () => void;
  onBack?: () => void;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
}

export const MarketlyAIChat: React.FC<MarketlyAIChatProps> = ({ onClose, onBack }) => {
  const { t, language } = useI18n();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'model',
      text: language === 'ur'
        ? '**Marketly AI اسسٹنٹ میں خوش آمدید!**\n\nمیں آپ کی کس طرح مدد کر سکتا ہوں؟\n- مارکیٹ پلیس اور کیش آن ڈیلیوری (COD) رہنمائی\n- مصنوعات فروخت کرنے کے بہترین طریقے\n- اکاؤنٹ سیٹنگز اور رازداری کے اصول\n- خریدار اور بیچنے والے کے حقوق'
        : '### Welcome to Marketly AI Assistant & Help Center\n\nI am your dedicated Marketly AI Assistant. How can I help you today?\n\n- **For Sellers:** Tips on product photography, pricing strategies, and maximizing COD sales.\n- **For Buyers:** Finding verified sellers, checking COD safety, and tracking inquiries.\n- **For Creators:** Growing your followers, optimizing reels, and engaging your audience.\n- **Help Center:** Inquiries regarding Pakistan payment gateways (Easypaisa, JazzCash, 1Link) or seller subscriptions.',
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleSend = async () => {
    if (!inputText.trim() || loading) return;

    const userMsg: ChatMessage = {
      id: String(Date.now()),
      role: 'user',
      text: inputText.trim(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setLoading(true);

    try {
      const history = messages.map((m) => ({
        role: m.role,
        parts: [{ text: m.text }],
      }));

      const res = await api.askAI(userMsg.text, history, language);
      const aiMsg: ChatMessage = {
        id: String(Date.now() + 1),
        role: 'model',
        text: res.text || 'I could not generate a response. Please try again.',
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: String(Date.now() + 1),
          role: 'model',
          text: `Error connecting to Marketly AI: ${err.message || 'Please check your connection and retry.'}`,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleClear = () => {
    setMessages([
      {
        id: 'reset',
        role: 'model',
        text: 'Chat cleared. Tell me what help you need with Marketly!',
      },
    ]);
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
      {/* Header */}
      <div className="p-3.5 sm:p-4 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="p-1.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white shrink-0"
              title="Back to chats list"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}
          <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-rose-600 via-pink-600 to-amber-500 flex items-center justify-center shadow-lg shadow-rose-500/25 shrink-0">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-white flex items-center gap-1.5">
              <span>MARKETLY AI</span>
              <span className="text-[10px] bg-rose-500/20 text-rose-300 px-1.5 py-0.5 rounded border border-rose-500/30">
                Official AI
              </span>
            </h3>
            <p className="text-[11px] text-slate-400">{t('ai_help_desc')}</p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={handleClear}
            className="p-2 text-slate-400 hover:text-rose-400 transition-colors rounded-lg hover:bg-slate-800"
            title="Clear conversation"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Suggested prompts bar */}
      <div className="px-4 py-2 bg-slate-950/40 border-b border-slate-800/60 flex gap-2 overflow-x-auto no-scrollbar text-xs">
        <button
          onClick={() => setInputText('How do I list my first product on Marketly?')}
          className="px-2.5 py-1 rounded-full bg-slate-800 hover:bg-violet-950/40 hover:border-violet-500/50 text-slate-300 border border-slate-700 whitespace-nowrap transition-colors"
        >
          📦 Listing a product
        </button>
        <button
          onClick={() => setInputText('How does Cash on Delivery (COD) work for buyers?')}
          className="px-2.5 py-1 rounded-full bg-slate-800 hover:bg-violet-950/40 hover:border-violet-500/50 text-slate-300 border border-slate-700 whitespace-nowrap transition-colors"
        >
          🛡️ Cash on Delivery safety
        </button>
        <button
          onClick={() => setInputText('What payment methods are supported in Pakistan for seller plans?')}
          className="px-2.5 py-1 rounded-full bg-slate-800 hover:bg-violet-950/40 hover:border-violet-500/50 text-slate-300 border border-slate-700 whitespace-nowrap transition-colors"
        >
          💳 Seller plans & Easypaisa/JazzCash
        </button>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex items-start gap-3 ${
              m.role === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            {m.role === 'model' && (
              <div className="w-7 h-7 rounded-xl bg-violet-600/30 text-violet-300 border border-violet-500/40 flex items-center justify-center shrink-0 mt-1">
                <Bot className="w-4 h-4" />
              </div>
            )}

            <div
              className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-3.5 text-xs sm:text-sm leading-relaxed relative group ${
                m.role === 'user'
                  ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-br-none shadow-md shadow-violet-900/30'
                  : 'bg-slate-800/90 text-slate-100 border border-slate-700/70 rounded-bl-none shadow'
              }`}
            >
              <div className="whitespace-pre-wrap font-sans space-y-2">
                {m.text}
              </div>

              {m.role === 'model' && (
                <button
                  onClick={() => handleCopy(m.id, m.text)}
                  className="absolute top-2 right-2 rtl:left-2 rtl:right-auto opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-white transition-opacity"
                  title="Copy message"
                >
                  {copiedId === m.id ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex items-start gap-3">
            <div className="w-7 h-7 rounded-xl bg-violet-600/30 text-violet-300 border border-violet-500/40 flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4" />
            </div>
            <div className="p-3 bg-slate-800/80 rounded-2xl rounded-bl-none border border-slate-700 flex items-center gap-2 text-xs text-slate-400">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-violet-400" />
              <span>Marketly AI is thinking...</span>
            </div>
          </div>
        )}
      </div>

      {/* Input Form */}
      <div className="p-3.5 bg-slate-950/80 border-t border-slate-800 flex items-center gap-2">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder={t('ask_ai_placeholder')}
          className="flex-1 px-4 py-2.5 bg-slate-800/80 border border-slate-700 rounded-2xl text-xs sm:text-sm text-white focus:outline-none focus:border-violet-500 transition-colors"
        />
        <button
          onClick={handleSend}
          disabled={!inputText.trim() || loading}
          className="px-4 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:opacity-50 text-white font-semibold rounded-2xl transition-all shadow-md flex items-center gap-1.5"
        >
          <Send className="w-4 h-4" />
          <span className="hidden sm:inline text-xs">{t('send_btn')}</span>
        </button>
      </div>
    </div>
  );
};
