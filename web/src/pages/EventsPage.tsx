import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { clearAuth } from '../lib/auth';
import type { Event } from '../types';

function formatCurrency(amount: number, currency: string) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);
}

export default function EventsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', date: '', currency: 'USD' });
  const [formError, setFormError] = useState('');

  const { data: events = [], isLoading } = useQuery<Event[]>({
    queryKey: ['events'],
    queryFn: () => api.get('/events').then((r) => r.data),
  });

  const createMutation = useMutation({
    mutationFn: (data: typeof form) => api.post('/events', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      setShowForm(false);
      setForm({ title: '', date: '', currency: 'USD' });
    },
    onError: (err: any) => setFormError(err.response?.data?.message ?? 'Failed to create event'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/events/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['events'] }),
  });

  const handleLogout = () => {
    clearAuth();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">EventBudget</h1>
        <div className="flex items-center gap-3">
          <button
            onClick={() => { setShowForm(true); setFormError(''); }}
            className="bg-blue-600 text-white text-sm px-4 py-2 rounded hover:bg-blue-700"
          >
            + New Event
          </button>
          <button onClick={handleLogout} className="text-sm text-gray-500 hover:text-gray-800">
            Logout
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        {showForm && (
          <div className="bg-white rounded-lg border p-6 mb-6">
            <h2 className="font-semibold text-gray-800 mb-4">New Event</h2>
            <form
              onSubmit={(e) => { e.preventDefault(); createMutation.mutate(form); }}
              className="grid grid-cols-3 gap-4"
            >
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Title</label>
                <input
                  required
                  className="w-full border rounded px-3 py-2 text-sm"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Date</label>
                <input
                  type="date"
                  required
                  className="w-full border rounded px-3 py-2 text-sm"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Currency</label>
                <select
                  className="w-full border rounded px-3 py-2 text-sm"
                  value={form.currency}
                  onChange={(e) => setForm({ ...form, currency: e.target.value })}
                >
                  {['USD', 'EUR', 'GBP', 'PKR', 'INR', 'AED'].map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </div>
              {formError && <p className="col-span-3 text-sm text-red-600">{formError}</p>}
              <div className="col-span-3 flex gap-2">
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="bg-blue-600 text-white text-sm px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
                >
                  {createMutation.isPending ? 'Creating...' : 'Create Event'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="text-sm px-4 py-2 rounded border hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {isLoading ? (
          <p className="text-gray-500 text-sm">Loading events...</p>
        ) : events.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <p className="text-lg">No events yet</p>
            <p className="text-sm mt-1">Click "New Event" to get started</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Title</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Date</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Currency</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">Total Budget</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {events.map((event) => {
                  const total = (event.budgetItems ?? []).reduce(
                    (s, i) => s + Number(i.amount), 0
                  );
                  return (
                    <tr
                      key={event.id}
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() => navigate(`/events/${event.id}`)}
                    >
                      <td className="px-4 py-3 font-medium text-blue-600">{event.title}</td>
                      <td className="px-4 py-3 text-gray-600">
                        {new Date(event.date).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-gray-600">{event.currency}</td>
                      <td className="px-4 py-3 text-right font-medium">
                        {formatCurrency(total, event.currency)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm('Delete this event?')) deleteMutation.mutate(event.id);
                          }}
                          className="text-red-500 hover:text-red-700 text-xs px-2 py-1 rounded border border-red-200 hover:border-red-400"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
