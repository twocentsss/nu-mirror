import postgres from "postgres";

const GAMES_SCHEMA = process.env.GAMES_SCHEMA || "public";
const RESULTS_SCHEMA = process.env.RESULTS_SCHEMA || "scratch";
const DATABASE_URL = process.env.GAMES_DB_URL || process.env.DATABASE_URL;
const ensured = { games: false, results: false };

type GameType = "wordle" | "polygonle" | "crossword" | "sudoku" | "mao" | "hybrid";

export type AdminGameRecord = {
    id: string;
    type: GameType;
    date: string;
    label: string;
    payload?: string | null;
    created_at?: string;
};

export type GameResultRecord = {
    id: string;
    type: GameType;
    date: string;
    score: number;
    label?: string | null;
    user_id?: string | null;
    created_at?: string;
};

function getClient() {
    if (!DATABASE_URL) return null;
    return postgres(DATABASE_URL, { max: 1 });
}

async function ensureGameTables(client: postgres.Sql) {
    if (ensured.games) return;
    await client.unsafe(`
        create schema if not exists ${GAMES_SCHEMA};
        create table if not exists ${GAMES_SCHEMA}.games (
          id uuid primary key,
          type text not null,
          date date not null,
          label text not null,
          payload text,
          created_at timestamptz not null default now()
        );
        create index if not exists games_date_idx on ${GAMES_SCHEMA}.games(date, type);
    `);
    ensured.games = true;
}

async function ensureResultTables(client: postgres.Sql) {
    if (ensured.results) return;
    await client.unsafe(`
        create schema if not exists ${RESULTS_SCHEMA};
        create table if not exists ${RESULTS_SCHEMA}.game_results (
          id uuid primary key,
          type text not null,
          date date not null,
          score int not null,
          label text,
          user_id text,
          created_at timestamptz not null default now()
        );
        create index if not exists game_results_date_idx on ${RESULTS_SCHEMA}.game_results(date, type);
        create index if not exists game_results_user_idx on ${RESULTS_SCHEMA}.game_results(user_id, date);
    `);
    ensured.results = true;
}

export async function fetchAdminGames(date: string): Promise<AdminGameRecord[]> {
    const client = getClient();
    if (!client) return [];
    await ensureGameTables(client);
    const rows =
        await client`select id, type, date, label, payload, created_at from ${client(GAMES_SCHEMA)}.games where date = ${date} order by created_at asc`;
    return rows as unknown as AdminGameRecord[];
}

export async function insertAdminGame(entry: AdminGameRecord): Promise<AdminGameRecord | null> {
    const client = getClient();
    if (!client) return null;
    await ensureGameTables(client);
    const payload = entry.payload ?? null;
    const rows =
        await client`insert into ${client(GAMES_SCHEMA)}.games (id, type, date, label, payload) values (${entry.id}, ${entry.type}, ${entry.date}, ${entry.label}, ${payload}) returning id, type, date, label, payload, created_at`;
    return rows[0] as unknown as AdminGameRecord;
}

export async function fetchResults(date: string): Promise<GameResultRecord[]> {
    const client = getClient();
    if (!client) return [];
    await ensureResultTables(client);
    const rows =
        await client`select id, type, date, score, label, user_id, created_at from ${client(RESULTS_SCHEMA)}.game_results where date = ${date} order by created_at asc`;
    return rows as unknown as GameResultRecord[];
}

export async function insertResult(entry: GameResultRecord): Promise<GameResultRecord | null> {
    const client = getClient();
    if (!client) return null;
    await ensureResultTables(client);
    const label = entry.label ?? null;
    const user = entry.user_id ?? null;
    const rows =
        await client`insert into ${client(RESULTS_SCHEMA)}.game_results (id, type, date, score, label, user_id) values (${entry.id}, ${entry.type}, ${entry.date}, ${entry.score}, ${label}, ${user}) returning id, type, date, score, label, user_id, created_at`;
    return rows[0] as unknown as GameResultRecord;
}
