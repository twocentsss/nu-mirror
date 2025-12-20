"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2, UserPlus, Trash2, ArrowLeft, Shield, Send, MessageSquare, CheckCircle, Circle, Plus } from "lucide-react";
import Link from "next/link";
import { useSession } from "next-auth/react";

type Member = {
    group_id: string;
    user_email: string;
    role: "admin" | "member";
    joined_at: string;
};

type GroupDetail = {
    id: string;
    name: string;
    description: string;
    owner_email: string;
    created_at: string;
    role: "admin" | "member";
};

type Message = {
    id: string;
    sender_email: string;
    content: string;
    created_at: string;
};

type Goal = {
    id: string;
    title: string;
    is_completed: boolean;
    created_at: string;
};

export default function GroupDetailsPage() {
    const params = useParams();
    const router = useRouter();
    const { data: session } = useSession();
    const groupId = params.groupId as string;

    const [group, setGroup] = useState<GroupDetail | null>(null);
    const [members, setMembers] = useState<Member[]>([]);
    const [messages, setMessages] = useState<Message[]>([]);
    const [goals, setGoals] = useState<Goal[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<"chat" | "goals" | "members">("chat");

    // Add Member
    const [newMemberEmail, setNewMemberEmail] = useState("");
    const [adding, setAdding] = useState(false);

    // Chat
    const [newMessage, setNewMessage] = useState("");
    const [sending, setSending] = useState(false);
    const chatEndRef = useRef<HTMLDivElement>(null);

    // Goals
    const [newGoal, setNewGoal] = useState("");
    const [addingGoal, setAddingGoal] = useState(false);

    const loadDetails = async () => {
        try {
            const res = await fetch("/api/groups/details", {
                method: "POST",
                body: JSON.stringify({ groupId })
            });
            const data = await res.json();
            if (data.group) {
                setGroup(data.group);
                setMembers(data.members || []);
            } else {
                // alert("Group not found"); // handled by redirect usually
                router.push("/groups");
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const loadMessages = async () => {
        try {
            const res = await fetch("/api/groups/messages/list", {
                method: "POST",
                body: JSON.stringify({ groupId })
            });
            const data = await res.json();
            if (data.messages) setMessages(data.messages);
        } catch (e) {
            console.error("Failed to load messages", e);
        }
    };

    const loadGoals = async () => {
        try {
            const res = await fetch("/api/groups/goals/list", {
                method: "POST",
                body: JSON.stringify({ groupId })
            });
            const data = await res.json();
            if (data.goals) setGoals(data.goals);
        } catch (e) {
            console.error("Failed to load goals", e);
        }
    };

    useEffect(() => {
        if (groupId) {
            loadDetails();
            loadMessages();
            loadGoals();
        }
    }, [groupId]);

    // Polling for messages
    useEffect(() => {
        if (!groupId || activeTab !== "chat") return;
        const interval = setInterval(loadMessages, 3000);
        return () => clearInterval(interval);
    }, [groupId, activeTab]);

    // Scroll to bottom on new messages
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleAddMember = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMemberEmail) return;
        setAdding(true);
        try {
            const res = await fetch("/api/groups/members/add", {
                method: "POST",
                body: JSON.stringify({ groupId, email: newMemberEmail })
            });
            if (res.ok) {
                setNewMemberEmail("");
                loadDetails();
            } else {
                const err = await res.json();
                alert(err.error || "Failed to add member");
            }
        } catch (e) {
            alert("Network error");
        } finally {
            setAdding(false);
        }
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim()) return;
        const tempMsg = newMessage;
        setNewMessage("");
        setSending(true); // Optimistic clear? 

        try {
            const res = await fetch("/api/groups/messages/send", {
                method: "POST",
                body: JSON.stringify({ groupId, content: tempMsg })
            });
            if (res.ok) {
                loadMessages();
            } else {
                setNewMessage(tempMsg); // Restore on fail
            }
        } catch (e) {
            console.error(e);
            setNewMessage(tempMsg);
        } finally {
            setSending(false);
        }
    };

    const handleRemoveMember = async (email: string) => {
        if (!confirm(`Remove ${email} from group?`)) return;
        try {
            await fetch("/api/groups/members/remove", {
                method: "POST",
                body: JSON.stringify({ groupId, email })
            });
            loadDetails();
        } catch (e) {
            alert("Failed to remove member");
        }
    };

    const handleAddGoal = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newGoal.trim()) return;
        setAddingGoal(true);
        try {
            const res = await fetch("/api/groups/goals/add", {
                method: "POST",
                body: JSON.stringify({ groupId, title: newGoal })
            });
            if (res.ok) {
                setNewGoal("");
                loadGoals();
            }
        } catch (e) {
            console.error(e);
        } finally {
            setAddingGoal(false);
        }
    };

    const handleToggleGoal = async (goalId: string, currentStatus: boolean) => {
        // Optimistic update
        setGoals(prev => prev.map(g => g.id === goalId ? { ...g, is_completed: !currentStatus } : g));
        try {
            await fetch("/api/groups/goals/toggle", {
                method: "POST",
                body: JSON.stringify({ goalId, isCompleted: !currentStatus })
            });
            // Ideally reload goals to sync, but optimistic is fine for now
        } catch (e) {
            console.error(e);
            loadGoals(); // Revert on error
        }
    };

    if (loading) return <div className="flex justify-center py-12"><Loader2 className="animate-spin" /></div>;
    if (!group) return null;

    const isAdmin = group.role === 'admin';
    const userEmail = session?.user?.email;

    return (
        <div className="flex flex-col h-[calc(100vh-6rem)] max-w-5xl mx-auto">
            {/* Header */}
            <div className="flex-none p-6 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 z-10">
                <Link href="/groups" className="flex items-center gap-2 text-slate-500 hover:text-primary transition-colors mb-4 text-sm">
                    <ArrowLeft size={16} /> Back to Groups
                </Link>
                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-1">{group.name}</h1>
                        <p className="text-slate-500 text-sm line-clamp-1">{group.description}</p>
                    </div>
                    {isAdmin && (
                        <span className="bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                            <Shield size={12} /> Admin
                        </span>
                    )}
                </div>

                <div className="flex gap-6 mt-6 border-b border-slate-100 dark:border-slate-800">
                    <button
                        onClick={() => setActiveTab("chat")}
                        className={`pb-2 text-sm font-medium transition-colors border-b-2 ${activeTab === 'chat' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                    >
                        Chat Room
                    </button>
                    <button
                        onClick={() => setActiveTab("goals")}
                        className={`pb-2 text-sm font-medium transition-colors border-b-2 ${activeTab === 'goals' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                    >
                        Goals ({goals.filter(g => !g.is_completed).length})
                    </button>
                    <button
                        onClick={() => setActiveTab("members")}
                        className={`pb-2 text-sm font-medium transition-colors border-b-2 ${activeTab === 'members' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                    >
                        Members ({members.length})
                    </button>
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-hidden bg-slate-50 dark:bg-slate-950 relative">

                {/* CHAT TAB */}
                {activeTab === "chat" && (
                    <div className="flex flex-col h-full">
                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                            {messages.length === 0 ? (
                                <div className="text-center py-20 text-slate-400">
                                    <MessageSquare size={48} className="mx-auto mb-4 opacity-50" />
                                    <p>No messages yet. Start the conversation!</p>
                                </div>
                            ) : (
                                messages.map(msg => {
                                    const isMe = msg.sender_email === userEmail;
                                    return (
                                        <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                            <div className={`max-w-[75%] rounded-2xl px-4 py-2 ${isMe
                                                ? 'bg-primary text-primary-foreground rounded-tr-none'
                                                : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-tl-none'
                                                }`}>
                                                {!isMe && <div className="text-[10px] text-slate-500 mb-1 font-bold">{msg.sender_email.split('@')[0]}</div>}
                                                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                                                <div className={`text-[10px] mt-1 text-right ${isMe ? 'opacity-70' : 'text-slate-400'}`}>
                                                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                            <div ref={chatEndRef} />
                        </div>
                        <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
                            <form onSubmit={handleSendMessage} className="flex gap-2">
                                <input
                                    className="flex-1 rounded-full border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                                    placeholder="Type a message..."
                                    value={newMessage}
                                    onChange={e => setNewMessage(e.target.value)}
                                    autoFocus
                                />
                                <button
                                    type="submit"
                                    disabled={!newMessage.trim() || sending}
                                    className="p-2 bg-primary text-primary-foreground rounded-full hover:opacity-90 disabled:opacity-50 transition-opacity"
                                >
                                    <Send size={20} />
                                </button>
                            </form>
                        </div>
                    </div>
                )}

                {/* GOALS TAB */}
                {activeTab === "goals" && (
                    <div className="p-8 overflow-y-auto h-full">
                        <div className="bg-white dark:bg-slate-900 p-8 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm max-w-3xl mx-auto">
                            <h3 className="text-xl font-bold mb-6">Group Goals</h3>

                            <form onSubmit={handleAddGoal} className="flex gap-2 mb-8">
                                <input
                                    value={newGoal}
                                    onChange={e => setNewGoal(e.target.value)}
                                    className="flex-1 p-3 border rounded-lg dark:bg-slate-950 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/50"
                                    placeholder="Add a new goal..."
                                    autoFocus
                                />
                                <button
                                    type="submit"
                                    disabled={!newGoal.trim() || addingGoal}
                                    className="bg-primary text-primary-foreground px-6 py-2 rounded-lg font-medium flex items-center gap-2 hover:opacity-90 disabled:opacity-50"
                                >
                                    {addingGoal ? <Loader2 className="animate-spin" size={20} /> : <Plus size={20} />}
                                    Add
                                </button>
                            </form>

                            <div className="space-y-3">
                                {goals.length === 0 && (
                                    <p className="text-center text-slate-400 py-8">No goals yet. Set one above!</p>
                                )}
                                {goals.map(goal => (
                                    <div
                                        key={goal.id}
                                        className={`flex items-start gap-4 p-4 rounded-lg border transition-all ${goal.is_completed
                                                ? 'bg-slate-50 dark:bg-slate-900/50 border-transparent opacity-60'
                                                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm'
                                            }`}
                                    >
                                        <button
                                            onClick={() => handleToggleGoal(goal.id, goal.is_completed)}
                                            className={`mt-1 flex-none transition-colors ${goal.is_completed ? 'text-green-500' : 'text-slate-300 hover:text-slate-400'
                                                }`}
                                        >
                                            {goal.is_completed ? <CheckCircle size={24} /> : <Circle size={24} />}
                                        </button>
                                        <div className="flex-1">
                                            <p className={`text-lg ${goal.is_completed ? 'line-through text-slate-500' : 'text-slate-800 dark:text-slate-100'}`}>
                                                {goal.title}
                                            </p>
                                            <p className="text-xs text-slate-400 mt-1">
                                                Added {new Date(goal.created_at).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* MEMBERS TAB */}
                {activeTab === "members" && (
                    <div className="p-8 overflow-y-auto h-full">
                        <div className="bg-white dark:bg-slate-900 p-8 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                            <h3 className="text-xl font-bold mb-6 flex items-center justify-between">
                                <span>Group Members</span>
                            </h3>

                            {isAdmin && (
                                <form onSubmit={handleAddMember} className="flex gap-2 mb-6 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                                    <input
                                        value={newMemberEmail}
                                        onChange={e => setNewMemberEmail(e.target.value)}
                                        className="flex-1 p-2 border rounded dark:bg-slate-900 dark:border-slate-700"
                                        placeholder="user@example.com"
                                        type="email"
                                    />
                                    <button
                                        type="submit"
                                        disabled={!newMemberEmail || adding}
                                        className="bg-primary text-primary-foreground px-4 py-2 rounded font-medium flex items-center gap-2 disabled:opacity-50"
                                    >
                                        {adding ? <Loader2 className="animate-spin" size={16} /> : <UserPlus size={16} />}
                                        Add Member
                                    </button>
                                </form>
                            )}

                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="text-slate-500 uppercase font-medium border-b dark:border-slate-800">
                                        <tr>
                                            <th className="px-4 py-3">User</th>
                                            <th className="px-4 py-3">Role</th>
                                            <th className="px-4 py-3">Joined</th>
                                            {isAdmin && <th className="px-4 py-3 text-right">Actions</th>}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {members.map(m => (
                                            <tr key={m.user_email} className="border-b dark:border-slate-800 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                                <td className="px-4 py-3 font-medium">{m.user_email}</td>
                                                <td className="px-4 py-3">
                                                    <span className={`text-xs px-2 py-1 rounded-full ${m.role === 'admin' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30' : 'bg-slate-100 text-slate-600 dark:bg-slate-800'
                                                        }`}>
                                                        {m.role}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-slate-500">{new Date(m.joined_at).toLocaleDateString()}</td>
                                                {isAdmin && (
                                                    <td className="px-4 py-3 text-right">
                                                        {m.role !== 'admin' && ( // Prevent removing admins/self for now
                                                            <button
                                                                onClick={() => handleRemoveMember(m.user_email)}
                                                                className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 p-2 rounded transition-colors"
                                                                title="Remove Member"
                                                            >
                                                                <Trash2 size={16} />
                                                            </button>
                                                        )}
                                                    </td>
                                                )}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
