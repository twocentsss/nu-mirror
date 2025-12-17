import { MirrorCard } from "@/ui/MirrorCard";
import { buildFlowSummary } from "@/lib/flow/summary";
import { Activity, Users } from "lucide-react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/authOptions";
import { getAccountSpreadsheetId } from "@/lib/google/accountSpreadsheet";

const formatMinutes = (value: number) => `${Math.round(value)} min`;
const formatDate = (iso: string) => new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });

export default async function SocialPage() {
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
      console.error("SocialPage spreadsheet lookup failed", error);
      return null;
    });
    if (account?.spreadsheetId) {
      spreadsheetId = account.spreadsheetId;
    }
  }

  if (!spreadsheetId) {
    throw new Error("Spreadsheet not initialized; sign in with Google to create it.");
  }

  const userEmail = session?.user?.email ?? undefined;
  const summary = await buildFlowSummary({
    spreadsheetId,
    accessToken,
    refreshToken,
    userEmail,
  });
  const topGroups = Object.entries(summary.totalsByComponentGroup)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3);
  const topActivities = Object.entries(summary.totalsByActivity)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 2);

  return (
    <div className="min-h-screen bg-[var(--app-bg)] px-4 py-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <MirrorCard className="p-6 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm uppercase tracking-[0.4em] text-[var(--text-secondary)]">Social Flow</p>
              <h1 className="text-3xl font-bold tracking-tight text-[var(--text-primary)]">
                Relationships & Community Dashboard
              </h1>
            </div>
            <div className="rounded-2xl bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[var(--text-secondary)]">
              {summary.periodDays} day view
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-6">
            <div>
              <div className="text-xs uppercase text-[var(--text-secondary)] tracking-wide">Tracked Time</div>
              <div className="text-3xl font-black text-[var(--text-primary)]">{formatMinutes(summary.totalMinutes)}</div>
            </div>
            <div>
              <div className="text-xs uppercase text-[var(--text-secondary)] tracking-wide">Events</div>
              <div className="text-3xl font-black text-[var(--accent-color)]">{summary.eventCount}</div>
            </div>
            <div className="ml-auto text-right">
              <div className="text-xs uppercase text-[var(--text-secondary)] tracking-wide">Trend</div>
              <div className="text-lg font-semibold text-[var(--text-primary)]">
                {summary.trend.label}
              </div>
              <div className="text-[var(--text-secondary)] text-xs">{summary.trend.percent >= 0 ? "Improving" : "Needs attention"}</div>
            </div>
          </div>
        </MirrorCard>

        <div className="grid gap-5 md:grid-cols-2">
          <MirrorCard className="p-5 space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
              <Users className="h-4 w-4 text-white" />
              Pillars of Connection
            </div>
            <div className="space-y-2">
              {topGroups.map(([group, minutes]) => (
                <div key={group} className="flex items-center justify-between">
                  <div className="text-sm font-semibold text-[var(--text-primary)]">{group}</div>
                  <div className="text-xs text-[var(--text-secondary)]">{formatMinutes(minutes)}</div>
                </div>
              ))}
              {topGroups.length === 0 && (
                <div className="text-xs text-[var(--text-secondary)]">No social activity recorded yet.</div>
              )}
            </div>
          </MirrorCard>

          <MirrorCard className="p-5 space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
              <Activity className="h-4 w-4 text-white" />
              Activity Types
            </div>
            <div className="space-y-2">
              {topActivities.map(([activity, minutes]) => (
                <div key={activity} className="flex items-center justify-between">
                  <div className="text-sm font-semibold text-[var(--text-primary)]">{activity}</div>
                  <div className="text-xs text-[var(--text-secondary)]">{formatMinutes(minutes)}</div>
                </div>
              ))}
              {topActivities.length === 0 && (
                <div className="text-xs text-[var(--text-secondary)]">No activity breakdown yet.</div>
              )}
            </div>
          </MirrorCard>
        </div>

        <MirrorCard className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-[var(--text-secondary)]">Recent Highlights</p>
              <h2 className="text-xl font-bold text-[var(--text-primary)]">Stories to share</h2>
            </div>
            <div className="text-xs text-[var(--text-secondary)]">
              {formatDate(summary.dateRange.start)} – {formatDate(summary.dateRange.end)}
            </div>
          </div>
          <div className="space-y-3">
            {summary.topEvents.length === 0 && (
              <div className="text-xs text-[var(--text-secondary)]">No FlowEvents recorded yet.</div>
            )}
            {summary.topEvents.map((event) => (
              <div key={event.id} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                <div className="flex items-center justify-between text-sm font-semibold text-[var(--text-primary)]">
                  <span>{event.description}</span>
                  <span className="text-[var(--accent-color)]">{formatMinutes(event.amount)}</span>
                </div>
                <div className="mt-1 flex items-center justify-between text-[var(--text-secondary)] text-xs">
                  <span>{formatDate(event.timestamp)}</span>
                  <span>{event.segments?.component_group ?? event.segments?.activity_type ?? "Social"}</span>
                </div>
              </div>
            ))}
          </div>
        </MirrorCard>
      </div>
    </div>
  );
}
