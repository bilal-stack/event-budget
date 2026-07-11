import { useEffect, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import ProposalCard from './ProposalCard';
import type { AiProposal } from '../types';

interface Message {
  role: 'user' | 'assistant' | 'proposal' | 'error';
  text?: string;
  proposal?: AiProposal;
}

interface Props {
  eventId: string;
  currency: string;
}

// Spinner shown while Gemini is generating
function TypingIndicator() {
  return (
    <div className="flex items-center gap-1 px-4 py-3">
      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
    </div>
  );
}

export default function AiChatPanel({ eventId, currency }: Props) {
  const queryClient = useQueryClient();
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      text: `Hi! I can generate a budget proposal for this event. Just describe what you need — e.g. "Plan a gala dinner for 200 people with AV, catering, and photography."`,
    },
  ]);

  // Load any existing pending proposal on mount
  const { data: existingProposal } = useQuery<AiProposal | null>({
    queryKey: ['proposal', eventId],
    queryFn: () => api.get(`/events/${eventId}/ai/proposal`).then((r) => r.data),
  });

  // Inject existing pending proposal into chat once on load
  const injectedRef = useRef(false);
  useEffect(() => {
    if (existingProposal && !injectedRef.current) {
      injectedRef.current = true;
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', text: 'You have a pending proposal waiting for your review:' },
        { role: 'proposal', proposal: existingProposal },
      ]);
    }
  }, [existingProposal]);

  // Scroll to bottom whenever messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const chatMutation = useMutation({
    mutationFn: (message: string) =>
      api.post(`/events/${eventId}/ai/chat`, { message }).then((r) => r.data as AiProposal),
    onSuccess: (proposal) => {
      queryClient.invalidateQueries({ queryKey: ['proposal', eventId] });
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', text: 'Here is your budget proposal. Review and approve or reject it:' },
        { role: 'proposal', proposal },
      ]);
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message ?? 'Something went wrong. Please try again.';
      setMessages((prev) => [...prev, { role: 'error', text: msg }]);
    },
  });

  // Called when user approves or rejects — removes proposal bubble and refreshes budget
  const handleProposalDone = () => {
    setMessages((prev) => prev.filter((m) => m.role !== 'proposal'));
    queryClient.invalidateQueries({ queryKey: ['budget-items', eventId] });
    queryClient.invalidateQueries({ queryKey: ['event', eventId] });
    queryClient.invalidateQueries({ queryKey: ['events'] });
    queryClient.invalidateQueries({ queryKey: ['proposal', eventId] });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || chatMutation.isPending) return;
    setMessages((prev) => [...prev, { role: 'user', text }]);
    setInput('');
    chatMutation.mutate(text);
    inputRef.current?.focus();
  };

  const hasActivePropsal = messages.some((m) => m.role === 'proposal');

  return (
    <div className="bg-white rounded-lg border flex flex-col" style={{ height: '480px' }}>
      {/* Header */}
      <div className="px-4 py-3 border-b flex-shrink-0">
        <h2 className="font-semibold text-gray-800">AI Budget Assistant</h2>
        <p className="text-xs text-gray-400 mt-0.5">Powered by Gemini · All amounts in {currency}</p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.map((msg, i) => {
          if (msg.role === 'proposal' && msg.proposal) {
            return (
              <ProposalCard
                key={i}
                proposal={msg.proposal}
                eventId={eventId}
                currency={currency}
                onDone={handleProposalDone}
              />
            );
          }

          if (msg.role === 'user') {
            return (
              <div key={i} className="flex justify-end">
                <div className="bg-blue-600 text-white text-sm rounded-2xl rounded-br-sm px-4 py-2 max-w-xs lg:max-w-md">
                  {msg.text}
                </div>
              </div>
            );
          }

          if (msg.role === 'error') {
            return (
              <div key={i} className="flex justify-start">
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-2xl rounded-bl-sm px-4 py-2 max-w-xs lg:max-w-md">
                  {msg.text}
                </div>
              </div>
            );
          }

          return (
            <div key={i} className="flex justify-start">
              <div className="bg-gray-100 text-gray-800 text-sm rounded-2xl rounded-bl-sm px-4 py-2 max-w-xs lg:max-w-md">
                {msg.text}
              </div>
            </div>
          );
        })}

        {chatMutation.isPending && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-2xl rounded-bl-sm">
              <TypingIndicator />
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="px-4 py-3 border-t flex-shrink-0 flex gap-2">
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={
            hasActivePropsal
              ? 'Approve or reject the proposal above first...'
              : 'Describe your event needs...'
          }
          disabled={chatMutation.isPending || hasActivePropsal}
          className="flex-1 border rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-400"
        />
        <button
          type="submit"
          disabled={chatMutation.isPending || !input.trim() || hasActivePropsal}
          className="bg-blue-600 text-white w-9 h-9 rounded-full flex items-center justify-center hover:bg-blue-700 disabled:opacity-40 flex-shrink-0"
          aria-label="Send"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
            <path d="M3.105 2.288a.75.75 0 0 0-.826.95l1.414 4.926A1.5 1.5 0 0 0 5.135 9.25h6.115a.75.75 0 0 1 0 1.5H5.135a1.5 1.5 0 0 0-1.442 1.086l-1.414 4.926a.75.75 0 0 0 .826.95 28.897 28.897 0 0 0 15.293-7.155.75.75 0 0 0 0-1.114A28.897 28.897 0 0 0 3.105 2.288Z" />
          </svg>
        </button>
      </form>
    </div>
  );
}
