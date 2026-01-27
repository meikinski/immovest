'use client';

import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { useState, useRef, useEffect, useMemo, FormEvent } from 'react';
import { MessageCircle, X, Send, Bot, User } from 'lucide-react';
import { useImmoStore } from '@/store/useImmoStore';

export function ChatAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Get user context from Zustand store
  const {
    kaufpreis,
    miete,
    ek,
    zins,
    tilgung,
    objekttyp,
    flaeche,
    adresse,
    cashflow_operativ,
    nettorendite,
  } = useImmoStore();

  // Calculate derived values for context
  const anschaffungskosten = kaufpreis > 0 ? kaufpreis * 1.12 : 0;
  const darlehensSumme = anschaffungskosten - ek;
  const jahresRate = darlehensSumme > 0 ? darlehensSumme * ((zins + tilgung) / 100) : 0;
  const monatsMieteNetto = miete > 0 ? miete * 0.85 : 0;
  const dscr = jahresRate > 0 ? (monatsMieteNetto * 12) / jahresRate : 0;
  const ekRendite = ek > 0 ? ((cashflow_operativ * 12) / ek) * 100 : 0;

  const userContext = useMemo(() => ({
    kaufpreis,
    miete,
    eigenkapital: ek,
    zins,
    tilgung,
    objekttyp,
    flaeche,
    adresse,
    cashflow: cashflow_operativ,
    nettomietrendite: nettorendite,
    ekRendite: ekRendite,
    dscr: dscr,
  }), [kaufpreis, miete, ek, zins, tilgung, objekttyp, flaeche, adresse, cashflow_operativ, nettorendite, ekRendite, dscr]);

  // Create transport with memoization to avoid recreating on every render
  const transport = useMemo(() => new DefaultChatTransport({
    api: '/api/chat',
    body: {
      userContext,
    },
  }), [userContext]);

  const { messages, sendMessage, status, error } = useChat({
    transport,
  });

  const isLoading = status === 'submitted' || status === 'streaming';

  // Handle form submission
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const messageText = input.trim();
    setInput('');

    await sendMessage({ text: messageText });
  };

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  };

  // Auto-scroll to new messages
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen]);

  // Helper to get message text content
  const getMessageText = (message: typeof messages[0]): string => {
    if (!message.parts || message.parts.length === 0) {
      return '';
    }
    return message.parts
      .filter((part): part is { type: 'text'; text: string } => part.type === 'text')
      .map(part => part.text)
      .join('');
  };

  // Handle clicking example questions
  const handleExampleClick = (question: string) => {
    setInput(question);
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 bg-[#ff6b00] text-white p-4 rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300"
        aria-label={isOpen ? 'Chat schließen' : 'Chat öffnen'}
      >
        {isOpen ? <X size={24} /> : <MessageCircle size={24} />}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-40 w-[400px] h-[600px] max-md:w-full max-md:h-full max-md:bottom-0 max-md:right-0 max-md:rounded-none bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden border-2 border-gray-100 animate-fade-in">
          {/* Header */}
          <div className="bg-[#001d3d] text-white p-4 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                <Bot size={20} />
              </div>
              <div>
                <h3 className="font-bold text-base">Immobilien-Berater</h3>
                <p className="text-xs text-white/70">Frag mich zur Analyse</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="hover:bg-white/10 p-2 rounded-lg transition-colors"
              aria-label="Chat schließen"
            >
              <X size={20} />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
            {messages.length === 0 && (
              <div className="text-sm text-gray-600 space-y-3 p-4 bg-white rounded-xl border border-gray-100">
                <div className="flex items-center gap-2 text-[#001d3d] font-semibold">
                  <Bot size={18} className="text-[#ff6b00]" />
                  <span>Hallo! Ich helfe dir bei deiner Immobilien-Analyse.</span>
                </div>
                <p className="text-gray-500">Beispiel-Fragen:</p>
                <ul className="space-y-2">
                  {[
                    'Ist meine Rendite gut?',
                    'Was bedeutet DSCR?',
                    'Sollte ich diese Immobilie kaufen?',
                    'Wie kann ich den Cashflow verbessern?',
                  ].map((question) => (
                    <li key={question}>
                      <button
                        onClick={() => handleExampleClick(question)}
                        className="w-full text-left px-3 py-2 rounded-lg bg-gray-50 hover:bg-[#ff6b00]/10 hover:text-[#ff6b00] transition-colors text-sm border border-gray-100"
                      >
                        {question}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {messages.map((msg) => {
              const text = getMessageText(msg);
              if (!text) return null;

              return (
                <div
                  key={msg.id}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`flex items-start gap-2 max-w-[85%] ${
                      msg.role === 'user' ? 'flex-row-reverse' : ''
                    }`}
                  >
                    {/* Avatar */}
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                        msg.role === 'user'
                          ? 'bg-[#ff6b00] text-white'
                          : 'bg-[#001d3d] text-white'
                      }`}
                    >
                      {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
                    </div>
                    {/* Message Bubble */}
                    <div
                      className={`px-4 py-3 rounded-2xl ${
                        msg.role === 'user'
                          ? 'bg-[#ff6b00] text-white rounded-tr-sm'
                          : 'bg-white border border-gray-200 text-gray-800 rounded-tl-sm shadow-sm'
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap leading-relaxed">{text}</p>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Loading Indicator */}
            {isLoading && (
              <div className="flex justify-start">
                <div className="flex items-start gap-2">
                  <div className="w-8 h-8 rounded-full bg-[#001d3d] text-white flex items-center justify-center">
                    <Bot size={16} />
                  </div>
                  <div className="bg-white border border-gray-200 px-4 py-3 rounded-2xl rounded-tl-sm shadow-sm">
                    <div className="flex items-center space-x-1.5">
                      <div
                        className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                        style={{ animationDelay: '0ms' }}
                      />
                      <div
                        className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                        style={{ animationDelay: '150ms' }}
                      />
                      <div
                        className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                        style={{ animationDelay: '300ms' }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Error Display */}
            {error && (
              <div className="flex justify-center">
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-lg text-sm">
                  Fehler: {error.message || 'Etwas ist schiefgelaufen. Bitte versuche es erneut.'}
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Form */}
          <form onSubmit={handleSubmit} className="p-4 border-t border-gray-100 bg-white shrink-0">
            <div className="flex gap-2">
              <input
                value={input}
                onChange={handleInputChange}
                placeholder="Frag mich etwas..."
                className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#ff6b00]/30 focus:border-[#ff6b00] transition-all text-sm"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="px-4 py-3 bg-[#ff6b00] text-white rounded-xl hover:bg-[#e55f00] disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:shadow-lg disabled:hover:shadow-none"
              >
                <Send size={18} />
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-2 text-center">
              Powered by Claude AI
            </p>
          </form>
        </div>
      )}
    </>
  );
}
