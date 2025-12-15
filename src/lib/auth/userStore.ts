type UserRecord = {
  id: string;
  email: string;
  username: string;
  password?: string;
  twoPart?: { keyId: string; pin: string };
};

function loadUsers(): UserRecord[] {
  const raw = process.env.STREAMFORGE_USERS;
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed
        .map((item, idx) => ({
          id: String(item.id ?? idx),
          email: String(item.email ?? ""),
          username: String(item.username ?? item.email ?? `user-${idx}`),
          password: item.password ? String(item.password) : undefined,
          twoPart: item.twoPart && typeof item.twoPart === "object"
            ? {
                keyId: String(item.twoPart.keyId ?? ""),
                pin: String(item.twoPart.pin ?? ""),
              }
            : undefined,
        }))
        .filter((u) => u.email);
    }
  } catch (err) {
    console.warn("STREAMFORGE_USERS env parse error", err);
  }
  return [];
}

const users = loadUsers();

export function verifyPassword(email: string, password: string) {
  const user = users.find((u) => u.email === email && u.password);
  if (!user) return null;
  if (user.password !== password) return null;
  return { id: user.id, email: user.email, username: user.username };
}

export function verifyTwoPart(keyId: string, pin: string) {
  const user = users.find((u) => u.twoPart && u.twoPart.keyId === keyId);
  if (!user?.twoPart) return null;
  if (user.twoPart.pin !== pin) return null;
  return { id: user.id, email: user.email, username: user.username };
}
