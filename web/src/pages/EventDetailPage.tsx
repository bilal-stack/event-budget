import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import type { Event, BudgetItem } from '../types';
import AiChatPanel from '../components/AiChatPanel';

function formatCurrency(amount: number, currency: string) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);
}

export default function EventDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [showItemForm, setShowItemForm] = useState(false);
  const [itemForm, setItemForm] = useState({ category: '', description: '', amount: '', currency: '' });
  const [editingItem, setEditingItem] = useState<BudgetItem | null>(null);

  const { data: event, isLoading } = useQuery<Event>({
    queryKey: ['event', id],
    queryFn: () => api.get(`/events/${id}`).then((r) => r.data),
  });

  const { data: items = [] } = useQuery<BudgetItem[]>({
    queryKey: ['budget-items', id],
    queryFn: () => api.get(`/events/${id}/budget-items`).then((r) => r.data),
    enabled: !!id,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['budget-items', id] });
    queryClient.invalidateQueries({ queryKey: ['event', id] });
    queryClient.invalidateQueries({ queryKey: ['events'] });
  };

  const addMutation = useMutation({
    mutationFn: (data: typeof itemForm) =>
      api.post(`/events/${id}/budget-items`, {
        ...data,
        amount: parseFloat(data.amount),
        currency: data.currency || event?.currency,
      }),
    onSuccess: () => { invalidate(); setShowItemForm(false); setItemForm({ category: '', description: '', amount: '', currency: '' }); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ itemId, data }: { itemId: string; data: Partial<typeof itemForm> }) =>
      api.patch(`/events/${id}/budget-items/${itemId}`, {
        ...data,
        ...(data.amount ? { amount: parseFloat(data.amount) } : {}),
      }),
    onSuccess: () => { invalidate(); setEditingItem(null); },
  });

  const deleteMutation = useMutation({
    mutationFn: (itemId: string) => api.delete(`/events/${id}/budget-items/${itemId}`),
    onSuccess: invalidate,
  });

  if (isLoading) return <div className="p-8 text-gray-500">Loading...</div>;
  if (!event) return <div className="p-8 text-red-500">Event not found</div>;

  const summary = event.budgetSummary ?? { totalSpend: 0, byCategory: {} };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b px-6 py-4 flex items-center gap-4">
        <button onClick={() => navigate('/')} className="text-gray-400 hover:text-gray-700 text-sm">← Back</button>
        <div>
          <h1 className="text-xl font-bold text-gray-900">{event.title}</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            {new Date(event.date).toLocaleDateString()} · {event.currency}
          </p>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8 space-y-6">
        {/* Summary cards */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white rounded-lg border p-4">
            <p className="text-xs text-gray-500 uppercase tracking-wide">Total Spend</p>
            <p className="text-2xl font-bold mt-1">
              {formatCurrency(summary.totalSpend, event.currency)}
            </p>
          </div>
          <div className="bg-white rounded-lg border p-4">
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-3">By Category</p>
            {Object.keys(summary.byCategory).length === 0 ? (
              <p className="text-sm text-gray-400">No items yet</p>
            ) : (
              <div className="space-y-1">
                {Object.entries(summary.byCategory).map(([cat, amt]) => (
                  <div key={cat} className="flex justify-between text-sm">
                    <span className="text-gray-600">{cat}</span>
                    <span className="font-medium">{formatCurrency(amt, event.currency)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Budget Items table */}
        <div className="bg-white rounded-lg border overflow-hidden">
          <div className="px-4 py-3 border-b flex items-center justify-between">
            <h2 className="font-semibold text-gray-800">Budget Items</h2>
            <button
              onClick={() => { setShowItemForm(true); setItemForm({ category: '', description: '', amount: '', currency: event.currency }); }}
              className="text-sm bg-blue-600 text-white px-3 py-1.5 rounded hover:bg-blue-700"
            >
              + Add Item
            </button>
          </div>

          {showItemForm && (
            <form
              className="px-4 py-3 bg-blue-50 border-b grid grid-cols-4 gap-3 items-end"
              onSubmit={(e) => { e.preventDefault(); addMutation.mutate(itemForm); }}
            >
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Category</label>
                <input required className="w-full border rounded px-2 py-1.5 text-sm" value={itemForm.category} onChange={(e) => setItemForm({ ...itemForm, category: e.target.value })} placeholder="Catering" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
                <input required className="w-full border rounded px-2 py-1.5 text-sm" value={itemForm.description} onChange={(e) => setItemForm({ ...itemForm, description: e.target.value })} placeholder="Dinner for 100 guests" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Amount</label>
                <input required type="number" min="0.01" step="0.01" className="w-full border rounded px-2 py-1.5 text-sm" value={itemForm.amount} onChange={(e) => setItemForm({ ...itemForm, amount: e.target.value })} placeholder="500.00" />
              </div>
              <div className="flex gap-2">
                <button type="submit" disabled={addMutation.isPending} className="bg-blue-600 text-white text-sm px-3 py-1.5 rounded hover:bg-blue-700 disabled:opacity-50">
                  {addMutation.isPending ? '...' : 'Add'}
                </button>
                <button type="button" onClick={() => setShowItemForm(false)} className="text-sm px-3 py-1.5 rounded border hover:bg-white">Cancel</button>
              </div>
            </form>
          )}

          {items.length === 0 ? (
            <div className="px-4 py-8 text-center text-gray-400 text-sm">No budget items yet</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-4 py-2 font-medium text-gray-600">Category</th>
                  <th className="text-left px-4 py-2 font-medium text-gray-600">Description</th>
                  <th className="text-right px-4 py-2 font-medium text-gray-600">Amount</th>
                  <th className="text-right px-4 py-2 font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {items.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    {editingItem?.id === item.id ? (
                      <>
                        <td className="px-4 py-2"><input className="border rounded px-2 py-1 text-sm w-full" defaultValue={item.category} onChange={(e) => setEditingItem({ ...editingItem, category: e.target.value })} /></td>
                        <td className="px-4 py-2"><input className="border rounded px-2 py-1 text-sm w-full" defaultValue={item.description} onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })} /></td>
                        <td className="px-4 py-2"><input type="number" step="0.01" className="border rounded px-2 py-1 text-sm w-24 text-right" defaultValue={Number(item.amount)} onChange={(e) => setEditingItem({ ...editingItem, amount: e.target.value })} /></td>
                        <td className="px-4 py-2 text-right space-x-2">
                          <button onClick={() => updateMutation.mutate({ itemId: item.id, data: { category: editingItem.category, description: editingItem.description, amount: String(editingItem.amount) } })} className="text-xs text-green-600 hover:text-green-800 font-medium">Save</button>
                          <button onClick={() => setEditingItem(null)} className="text-xs text-gray-500 hover:text-gray-700">Cancel</button>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="px-4 py-2">
                          <span className="inline-block bg-gray-100 text-gray-700 text-xs px-2 py-0.5 rounded-full">{item.category}</span>
                        </td>
                        <td className="px-4 py-2 text-gray-600">{item.description}</td>
                        <td className="px-4 py-2 text-right font-medium">{formatCurrency(Number(item.amount), item.currency)}</td>
                        <td className="px-4 py-2 text-right space-x-2">
                          <button onClick={() => setEditingItem(item)} className="text-xs text-blue-500 hover:text-blue-700">Edit</button>
                          <button onClick={() => { if (confirm('Delete?')) deleteMutation.mutate(item.id); }} className="text-xs text-red-500 hover:text-red-700">Delete</button>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        <AiChatPanel eventId={id!} currency={event.currency} />
      </main>
    </div>
  );
}
