
import { getSqlClient } from "@/lib/events/client";

export interface DailyMetric {
  day: string; // YYYY-MM-DD
  metric_key: string;
  value: number;
  metadata?: any;
}

export async function trackDailyMetric(day: string, key: string, value: number, metadata?: any) {
  const sql = getSqlClient();
  // Upsert: replace if exists (for snapshot metrics)
  await sql`
    insert into nu.daily_metrics (day, metric_key, value, metadata)
    values (${day}, ${key}, ${value}, ${metadata || null})
    on conflict (day, metric_key)
    do update set value = excluded.value, metadata = excluded.metadata
  `;
}

export async function incrementDailyMetric(day: string, key: string, delta: number = 1) {
  const sql = getSqlClient();
  // Upsert with increment
  await sql`
    insert into nu.daily_metrics (day, metric_key, value)
    values (${day}, ${key}, ${delta})
    on conflict (day, metric_key)
    do update set value = nu.daily_metrics.value + excluded.value
  `;
}

export async function getDailyMetrics(startDay: string, endDay: string): Promise<DailyMetric[]> {
  const sql = getSqlClient();
  // Returns raw rows
  const rows = await sql<DailyMetric[]>`
    select day::text, metric_key, value, metadata
    from nu.daily_metrics
    where day >= ${startDay} and day <= ${endDay}
    order by day asc, metric_key asc
  `;
  return rows;
}

/**
 * Aggregates core platform metrics from the event log for a specific day.
 * This is "re-playable" - it will overwrite the metrics for that day based on actual logs.
 */
export async function aggregatePlatformMetrics(day: string) {
  const sql = getSqlClient();

  console.log(`Aggregating metrics for ${day}...`);

  // 1. DAU: Distinct actors who generated an event
  const [dau] = await sql`
        select count(distinct actor_id) as count
        from nu.event_log
        where date(ts at time zone 'UTC') = ${day}::date
    `;
  await trackDailyMetric(day, 'platform.dau', Number(dau.count));

  // 2. Life: Tasks (Created & Completed)
  const [tasksCreated] = await sql`
        select count(*) as count
        from nu.event_log
        where type = 'task.created'
        and date(ts at time zone 'UTC') = ${day}::date
    `;
  await trackDailyMetric(day, 'life.tasks.created', Number(tasksCreated.count));

  const [tasksCompleted] = await sql`
        select count(*) as count
        from nu.event_log
        where type = 'task.status_set'
        and body->>'status' = 'completed'
        and date(ts at time zone 'UTC') = ${day}::date
    `;
  await trackDailyMetric(day, 'life.tasks.completed', Number(tasksCompleted.count));

  // 3. Life: Projects/Goals Closed (Narrative: "Helped close XXX goals")
  // Approximating by looking for goal/project status updates to 'completed'
  // In a real event sourcing system, this would be looking for 'goal.completed' events.
  // For now we query the state or assume a log event. Let's assume we can query the state for *updated_at* matches (imperfect but works for demo)
  // Or better, let's assume we log 'activity.updated' etc.
  // Let's stick to the SQL projection state for accuracy on 'closed today'
  const [goalsClosed] = await sql`
      select count(*) as count
      from nu.goals
      where status = 'completed'
      and date(updated_at at time zone 'UTC') = ${day}::date
    `;
  await trackDailyMetric(day, 'life.goals.closed', Number(goalsClosed.count));

  const [projectsClosed] = await sql`
      select count(*) as count
      from nu.projects
      where status = 'completed'
      and date(updated_at at time zone 'UTC') = ${day}::date
    `;
  await trackDailyMetric(day, 'life.projects.closed', Number(projectsClosed.count));


  // 4. Story: Detailed Metrics
  // "We create 10M stories, with 4M characters displaying 4M emotions in 3M scenes."
  // We need to parse event bodies if we don't have atomic events for these.
  // Assuming 'story.generated' has metadata about char_count, emotion_count, scene_count.
  // If not, we estimate or mock for the "Narrative" feasibility.

  // Let's assume body structure: { characters: [...], emotions: [...], scenes: [...] }
  const storyMetrics = await sql`
      select 
        coalesce(sum(jsonb_array_length(body->'characters')), 0) as chars,
        coalesce(sum(jsonb_array_length(body->'emotions')), 0) as emotions,
        coalesce(sum(jsonb_array_length(body->'scenes')), 0) as scenes,
        count(*) as stories
      from nu.event_log
      where type = 'story.generated'
      and date(ts at time zone 'UTC') = ${day}::date
    `;

  if (storyMetrics.length > 0) {
    const sm = storyMetrics[0];
    await trackDailyMetric(day, 'story.generated.count', Number(sm.stories));
    await trackDailyMetric(day, 'story.generated.characters', Number(sm.chars));
    await trackDailyMetric(day, 'story.generated.emotions', Number(sm.emotions));
    await trackDailyMetric(day, 'story.generated.scenes', Number(sm.scenes));
  }

  // 5. Social & Games
  // Social: Messages
  // Games: Bingo, etc.
  const [socialActions] = await sql`
       select count(*) as count
       from nu.event_log
       where type like 'social.%'
       and date(ts at time zone 'UTC') = ${day}::date
    `;
  await trackDailyMetric(day, 'social.actions', Number(socialActions.count));

  const [gameActions] = await sql`
       select count(*) as count
       from nu.event_log
       where type like 'game.%'
       and date(ts at time zone 'UTC') = ${day}::date
    `;
  await trackDailyMetric(day, 'game.actions', Number(gameActions.count));

  // 6. Net Closure Rate Calculation (Week over Week) is done at READ time (in the UI/API), not write time.
  // But we can store the "Net tasks" for today.
  const netTasks = Number(tasksCompleted.count) - Number(tasksCreated.count);
  await trackDailyMetric(day, 'life.tasks.net', netTasks);

  console.log(`Aggregation for ${day} complete.`);
}
