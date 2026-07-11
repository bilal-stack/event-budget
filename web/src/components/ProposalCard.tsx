import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import type { AiProposal } from '../types';

function formatCurrency(amount: number, currency: string) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);
}

interface Props {
  proposal: AiProposal;
  eventId: string;
  currency: string;
  onDone: () => void;
}

export default function ProposalCard({ proposal, eventId, currency, onDone }: Props) {
  const queryClient = useQueryClient();

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ['budget-items', eventId] });
    queryClient.invalidateQueries({ queryKey: ['event', eventId] });
    queryClient.invalidateQueries({ queryKey: ['events'] });
    queryClient.invalidateQueries({ queryKey: ['proposal', eventId] });
  };

  const approveMutation = useMutation({
    mutationFn: () => api.post(`/events/${eventId}/ai/approve`),
    onSuccess: () => { invalidateAll(); onDone(); },
  });

  const rejectMutation = useMutation({
    mutationFn: () => api.post(`/events/${eventId}/ai/reject`),
    onSuccess: () => { invalidateAll(); onDone(); },
  });

  const total = proposal.items.reduce((s, i) => s + i.amount, 0);
  const isPending = approveMutation.isPending || rejectMutation.isPending;

  return (
    <div className="border border-blue-200 rounded-lg bg-blue-50 overflow-hidden">
      <div className="px-4 py-3 bg-blue-100 border-b border-blue-200 flex items-center justify-between">
        <div>
          <span className="text-sm font-semibold text-blue-800">AI Budget Proposal</span>
          <span className="ml-2 text-xs text-blue-600 bg-blue-200 px-2 py-0.5 rounded-full">Pending Review</span>
        </div>
        <span className="text-sm font-bold text-blue-900">{formatCurrency(total, currency)} total</span>
      </div>

      <table className="w-full text-sm">
        <thead className="bg-blue-50 border-b border-blue-200">
          <tr>
            <th className="text-left px-4 py-2 font-medium text-blue-700">Category</th>
            <th className="text-left px-4 py-2 font-medium text-blue-700">Description</th>
            <th className="text-right px-4 py-2 font-medium text-blue-700">Amount</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-blue-100">
          {proposal.items.map((item, i) => (
            <tr key={i} className="hover:bg-blue-50/50">
              <td className="px-4 py-2">
                <span className="inline-block bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full">{item.category}</span>
              </td>
              <td className="px-4 py-2 text-gray-700">{item.description}</td>
              <td className="px-4 py-2 text-right font-medium text-gray-800">
                {formatCurrency(item.amount, item.currency)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="px-4 py-3 bg-blue-50 border-t border-blue-200 flex gap-3">
        <button
          onClick={() => approveMutation.mutate()}
          disabled={isPending}
          className="flex-1 bg-green-600 text-white text-sm py-2 rounded font-medium hover:bg-green-700 disabled:opacity-50"
        >
          {approveMutation.isPending ? 'Approving...' : 'Approve — Add to Budget'}
        </button>
        <button
          onClick={() => rejectMutation.mutate()}
          disabled={isPending}
          className="flex-1 bg-white text-red-600 border border-red-300 text-sm py-2 rounded font-medium hover:bg-red-50 disabled:opacity-50"
        >
          {rejectMutation.isPending ? 'Rejecting...' : 'Reject'}
        </button>
      </div>

      {(approveMutation.isError || rejectMutation.isError) && (
        <p className="px-4 pb-3 text-sm text-red-600">
          {(approveMutation.error as any)?.response?.data?.message ?? (rejectMutation.error as any)?.response?.data?.message ?? 'Something went wrong'}
        </p>
      )}
    </div>
  );
}
