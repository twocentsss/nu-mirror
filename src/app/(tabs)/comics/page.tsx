
import { BookOpen, Layers } from "lucide-react";

export default function ComicsPage() {
    return (
        <div className="min-h-screen bg-white p-6 pb-32 flex flex-col items-center justify-center text-center space-y-6">
            <div className="p-8 bg-indigo-50 rounded-3xl shadow-inner">
                <div className="p-6 bg-white rounded-2xl shadow-xl transform rotate-3 transition-transform hover:rotate-6">
                    <BookOpen className="w-12 h-12 text-indigo-600" />
                </div>
            </div>

            <div className="space-y-2 max-w-sm">
                <h1 className="text-3xl font-black text-gray-900 tracking-tight">Comic Studio</h1>
                <p className="text-gray-500 font-medium">
                    The auto-generated visual history of your journey.
                    Nu Flow detects "Episodes" in your day and generates comic strips.
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
