
'use client';

import { useState } from 'react';

export default function LedgerPage() {
    const [formData, setFormData] = useState({
        accountCode: '',
        amount: 0,
        unit: 'min',
        description: '',
        segments: '{}'
    });
    const [status, setStatus] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus('Posting...');
        
        try {
            const res = await fetch('/api/ledger/post', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    segments: JSON.parse(formData.segments)
                })
            });
            
            if (res.ok) {
                setStatus('Success!');
                setFormData({ ...formData, amount: 0, description: '' });
            } else {
                setStatus('Error posting event');
            }
        } catch (err) {
            setStatus('Error: ' + (err as Error).message);
        }
    };

    return (
        <div className="p-8 max-w-2xl mx-auto">
            <h1 className="text-2xl font-bold mb-6">Water-Flow Ledger</h1>
            
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium">Account Code</label>
                    <input 
                        type="text" 
                        value={formData.accountCode}
                        onChange={e => setFormData({...formData, accountCode: e.target.value})}
                        className="mt-1 block w-full border rounded p-2"
                        placeholder="e.g. 5100.01.01"
                        required
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium">Amount</label>
                        <input 
                            type="number" 
                            value={formData.amount}
                            onChange={e => setFormData({...formData, amount: Number(e.target.value)})}
                            className="mt-1 block w-full border rounded p-2"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium">Unit</label>
                        <select 
                            value={formData.unit}
                            onChange={e => setFormData({...formData, unit: e.target.value})}
                            className="mt-1 block w-full border rounded p-2"
                        >
                            <option value="min">Minutes</option>
                            <option value="usd">USD</option>
                            <option value="energy">Energy</option>
                            <option value="points">Points</option>
                        </select>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium">Description</label>
                    <input 
                        type="text" 
                        value={formData.description}
                        onChange={e => setFormData({...formData, description: e.target.value})}
                        className="mt-1 block w-full border rounded p-2"
                        required
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium">Segments (JSON)</label>
                    <textarea 
                        value={formData.segments}
                        onChange={e => setFormData({...formData, segments: e.target.value})}
                        className="mt-1 block w-full border rounded p-2 font-mono text-sm"
                        rows={3}
                    />
                </div>

                <button 
                    type="submit"
                    className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
                >
                    Post Entry
                </button>

                {status && <p className="mt-4 text-center text-sm">{status}</p>}
            </form>
        </div>
    );
}
