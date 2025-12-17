
import { generateDepartmentReports } from "@/lib/reporting/aggregator";
import { getFlowEvents } from "@/lib/features/ledger/accounting";
import { DepartmentReport, ReportMetric } from "@/lib/reporting/types";
import { Activity, Users, Zap, Briefcase, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/authOptions";
import { getAccountSpreadsheetId } from "@/lib/google/accountSpreadsheet";
import ReportControls from "@/components/ReportControls";

export const dynamic = 'force-dynamic'; // Ensure we always fetch fresh data

export default async function ReportsPage() {
    const session = await getServerSession(authOptions);
    const accessToken = (session as any)?.accessToken;
    const refreshToken = (session as any)?.refreshToken;
    let spreadsheetId = process.env.SHEETS_ID;

    if (session?.user?.email) {
        const account = await getAccountSpreadsheetId({
            accessToken,
            refreshToken,
            userEmail: session.user.email,
        }).catch((error) => {
            console.error("Failed to resolve spreadsheet ID on Reports page", error);
            return null;
        });
        if (account?.spreadsheetId) {
            spreadsheetId = account.spreadsheetId;
        }
    }

    if (!spreadsheetId) {
        throw new Error("Spreadsheet not initialized; sign in with Google to create it.");
    }
    const now = new Date();

    // Current Month
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const endOfMonth = now.toISOString();

    // Previous Month
    const startOfPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
    // Last day of previous month
    const endOfPrevMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59).toISOString();

    const userEmail = session?.user?.email ?? undefined;
    const fetchOpts = { spreadsheetId, accessToken, refreshToken, userEmail };
    const currentEvents = await getFlowEvents(startOfMonth, endOfMonth, fetchOpts);
    const prevEvents = await getFlowEvents(startOfPrevMonth, endOfPrevMonth, fetchOpts);

    const reports = generateDepartmentReports(currentEvents, prevEvents);

    return (
        <div className="min-h-screen bg-gray-50/50 p-6 space-y-8 pb-32">
            <div className="flex flex-col gap-2">
                <h1 className="text-4xl font-black text-gray-900 tracking-tight">CEO Dashboard</h1>
                <p className="text-gray-500 font-medium">Monthly Performance Review</p>
            </div>
            <ReportControls />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <DepartmentCard
                    report={reports.OPERATIONS}
                    icon={<Zap className="w-6 h-6 text-blue-500" />}
                    color="bg-blue-50/50 border-blue-100"
                />
                <DepartmentCard
                    report={reports.HR}
                    icon={<Users className="w-6 h-6 text-pink-500" />}
                    color="bg-pink-50/50 border-pink-100"
                />
                <DepartmentCard
                    report={reports.R_AND_D}
                    icon={<Activity className="w-6 h-6 text-purple-500" />}
                    color="bg-purple-50/50 border-purple-100"
                />
                <DepartmentCard
                    report={reports.FINANCE}
                    icon={<Briefcase className="w-6 h-6 text-emerald-500" />}
                    color="bg-emerald-50/50 border-emerald-100"
                />
            </div>
        </div>
    );
}

function DepartmentCard({ report, icon, color }: { report: DepartmentReport, icon: React.ReactNode, color: string }) {
    if (!report) return null; // Safety

    return (
        <div className={`rounded-3xl border p-6 flex flex-col gap-6 backdrop-blur-xl ${color}`}>
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-white rounded-2xl shadow-sm">
                        {icon}
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-gray-900">{report.name}</h2>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${report.overallStatus === 'green' ? 'bg-green-100 text-green-700' :
                                report.overallStatus === 'yellow' ? 'bg-yellow-100 text-yellow-700' :
                                    'bg-red-100 text-red-700'
                            }`}>
                            Header Status: {report.overallStatus}
                        </span>
                    </div>
                </div>
            </div>

            <div className="space-y-4">
                {report.metrics.length === 0 ? (
                    <div className="text-sm text-gray-400 italic">No metrics tracked yet.</div>
                ) : (
                    report.metrics.map(metric => (
                        <MetricRow key={metric.id} metric={metric} />
                    ))
                )}
            </div>
        </div>
    );
}

function MetricRow({ metric }: { metric: ReportMetric }) {
    const isPositive = metric.trendPercent > 0;
    const isNeutral = metric.trendPercent === 0;

    return (
        <div className="bg-white/60 rounded-xl p-4 shadow-sm border border-white/50">
            <div className="flex justify-between items-start mb-2">
                <span className="text-sm font-semibold text-gray-700">{metric.label}</span>
                <div className={`flex items-center gap-1 text-xs font-bold px-1.5 py-0.5 rounded-md ${metric.isCrisis ? 'bg-red-100 text-red-700' :
                        isPositive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                    }`}>
                    {isPositive && <TrendingUp size={12} />}
                    {!isPositive && !isNeutral && <TrendingDown size={12} />}
                    {isNeutral && <Minus size={12} />}
                    {Math.abs(metric.trendPercent)}%
                </div>
            </div>

            <div className="flex items-baseline gap-1 mb-2">
                <span className="text-2xl font-black text-gray-900">{metric.total.toLocaleString()}</span>
                <span className="text-xs text-gray-500 font-medium uppercase">{metric.unit}</span>
            </div>

            <div className="text-xs text-gray-500 leading-relaxed border-t border-gray-100 pt-2">
                "{metric.narrative}"
            </div>
        </div>
    );
}
