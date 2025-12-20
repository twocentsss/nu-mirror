
"use client";

import { useState, useEffect } from "react";
import { Loader2, Plus, Users } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Group = {
    id: string;
    name: string;
    description: string;
    role: string;
    created_at: string;
};

export default function GroupsPage() {
    const [groups, setGroups] = useState<Group[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreate, setShowCreate] = useState(false);

    // Create Form
    const [newName, setNewName] = useState("");
    const [newDesc, setNewDesc] = useState("");
    const [creating, setCreating] = useState(false);

    const router = useRouter();

    const loadGroups = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/groups/list");
            const data = await res.json();
            if (data.groups) setGroups(data.groups);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadGroups(); }, []);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newName) return;
        setCreating(true);
        try {
            const res = await fetch("/api/groups/create", {
                method: "POST",
                body: JSON.stringify({ name: newName, description: newDesc })
            });
            const data = await res.json();
            if (data.ok) {
                setNewName("");
                setNewDesc("");
                setShowCreate(false);
                loadGroups();
                router.push(`/groups/${data.id}`);
            } else {
                alert(data.error);
            }
        } catch (e) {
            alert("Failed to create group");
        } finally {
            setCreating(false);
        }
    };

    return (
        <div className="p-8 max-w-4xl mx-auto space-y-8">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-3">
                    <Users className="text-primary" /> My Groups
                </h1>
                <button
                    onClick={() => setShowCreate(!showCreate)}
                    className="bg-primary text-primary-foreground px-4 py-2 rounded-lg font-medium flex items-center gap-2 hover:opacity-90"
                >
                    <Plus size={18} /> New Group
                </button>
            </div>

            {showCreate && (
                <form onSubmit={handleCreate} className="bg-slate-50 dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 animate-in fade-in slide-in-from-top-4">
                    <h3 className="font-semibold mb-4 text-lg">Create New Group</h3>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Group Name</label>
                            <input
                                value={newName}
                                onChange={e => setNewName(e.target.value)}
                                className="w-full p-2 border rounded dark:bg-slate-900 dark:border-slate-700"
                                placeholder="e.g. Engineering Team"
                                autoFocus
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Description</label>
                            <input
                                value={newDesc}
                                onChange={e => setNewDesc(e.target.value)}
                                className="w-full p-2 border rounded dark:bg-slate-900 dark:border-slate-700"
                                placeholder="What's this group for?"
                            />
                        </div>
                        <div className="flex justify-end gap-2 pt-2">
                            <button
                                type="button"
                                onClick={() => setShowCreate(false)}
                                className="px-4 py-2 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={!newName || creating}
                                className="bg-primary text-primary-foreground px-6 py-2 rounded-lg font-medium disabled:opacity-50 flex items-center gap-2"
                            >
                                {creating && <Loader2 className="animate-spin" size={16} />}
                                Create Group
                            </button>
                        </div>
                    </div>
                </form>
            )}

            {loading ? (
                <div className="flex justify-center py-12"><Loader2 className="animate-spin text-slate-400" size={32} /></div>
            ) : groups.length === 0 ? (
                <div className="text-center py-12 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
                    <div className="inline-flex p-4 bg-slate-100 dark:bg-slate-800 rounded-full mb-4">
                        <Users className="text-slate-400" size={32} />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300">No groups yet</h3>
                    <p className="text-slate-500 max-w-sm mx-auto mt-2">Create a group to share tasks, manage projects, and collaborate with your team.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {groups.map(g => (
                        <Link
                            key={g.id}
                            href={`/groups/${g.id}`}
                            className="block bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-primary/50 hover:shadow-md transition-all group"
                        >
                            <div className="flex justify-between items-start mb-2">
                                <h3 className="font-bold text-lg group-hover:text-primary transition-colors">{g.name}</h3>
                                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${g.role === 'admin' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                                    }`}>
                                    {g.role}
                                </span>
                            </div>
                            <p className="text-slate-500 text-sm line-clamp-2">{g.description || "No description"}</p>
                            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-400 flex justify-between">
                                <span>Created {new Date(g.created_at).toLocaleDateString()}</span>
                                <span className="flex items-center gap-1 group-hover:translate-x-1 transition-transform">View Details &rarr;</span>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}
