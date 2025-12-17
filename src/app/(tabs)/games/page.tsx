
import { Gamepad2, Puzzle } from "lucide-react";

export default function GamesPage() {
    return (
        <div className="min-h-screen bg-white p-6 pb-32 flex flex-col items-center justify-center text-center space-y-6">
            <div className="p-8 bg-orange-50 rounded-3xl shadow-inner relative overflow-hidden">
                <div className="absolute top-0 right-0 p-2 opacity-10">
                    <Puzzle className="w-24 h-24 text-orange-400" />
                </div>
                <div className="p-6 bg-gradient-to-br from-orange-400 to-red-500 rounded-2xl shadow-xl text-white transform -rotate-3 transition-transform hover:rotate-0">
                    <Gamepad2 className="w-12 h-12" />
                </div>
            </div>

            <div className="space-y-2 max-w-sm">
                <h1 className="text-3xl font-black text-gray-900 tracking-tight">The Arcade</h1>
                <p className="text-gray-500 font-medium">
                    Gamify your productivity. Challenge yourself with Quests, Boss Battles (Hard Tasks), and Skill Trees.
                </p>
                <div className="pt-4">
                    <span className="px-4 py-2 bg-gray-100 text-gray-600 rounded-full text-xs font-bold uppercase tracking-widest">
                        Coming Soon
                    </span>
                </div>
            </div>
        </div>
    )
}
