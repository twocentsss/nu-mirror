import { MirrorCard } from "@/ui/MirrorCard";
import { buildFlowSummary } from "@/lib/flow/summary";
import { Activity, Users, Plus, ArrowRight } from "lucide-react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/authOptions";
import { getAccountSpreadsheetId } from "@/lib/google/accountSpreadsheet";
import { listUserGroups } from "@/lib/groups/groupStore";
import Link from "next/link";

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

  const userEmail = session?.user?.email ?? undefined;

  // Parallel fetch: Summary + Groups
  const [summary, groups] = await Promise.all([
    spreadsheetId ? buildFlowSummary({
      spreadsheetId,
      accessToken,
      refreshToken,
      userEmail,
    }) : Promise.reject("No spreadsheet"),
    userEmail ? listUserGroups(userEmail) : []
  ]).catch(e => {
    console.error("Data fetch failed", e);
    return [{
      periodDays: 0, totalMinutes: 0, eventCount: 0,
      trend: { label: "-", percent: 0 },
      totalsByComponentGroup: {}, totalsByActivity: {},
      topEvents: [], dateRange: { start: "", end: "" }
    }, []] as const;
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
              {summary.periodDays || 7} day view
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

        {/* GROUPS CARD */}
        <MirrorCard className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
              <Users className="h-4 w-4 text-white" />
              My Groups
            </div>
            <Link href="/groups" className="text-xs flex items-center gap-1 text-[var(--accent-color)] hover:underline">
              Manage Groups <ArrowRight size={12} />
            </Link>
          </div>

          {groups.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-sm text-[var(--text-secondary)] mb-3">You typically haven't joined any groups yet.</p>
              <Link href="/groups" className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg text-sm transition-colors">
                <Plus size={16} /> Create or Join a Group
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {groups.slice(0, 3).map(g => (
                <Link key={g.id} href={`/groups/${g.id}`} className="block p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 transition-colors">
                  <h3 className="font-bold text-[var(--text-primary)] mb-1">{g.name}</h3>
                  <div className="text-xs text-[var(--text-secondary)] line-clamp-1">{g.description || "No description"}</div>
                  <div className="mt-2 text-[10px] uppercase tracking-wider text-[var(--text-secondary)] opacity-70">
                    {g.role}
                  </div>
                </Link>
              ))}
              {groups.length > 3 && (
                <Link href="/groups" className="flex items-center justify-center p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 text-sm text-[var(--text-secondary)]">
                  +{groups.length - 3} more
                </Link>
              )}
            </div>
          )}
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
