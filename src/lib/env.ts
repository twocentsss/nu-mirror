export function mustGetEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing env var: ${name}`);
  }
  return value;
}

export function readPrivateKeyFromEnv(name: string): string {
  return mustGetEnv(name).replace(/\\n/g, "\n");
}
