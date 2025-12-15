export function id(prefix = "01") {
  const time = Date.now().toString(36);
  const rand = Math.random().toString(36).slice(2);
  return `${prefix}_${time}_${rand}`.slice(0, 40);
}
