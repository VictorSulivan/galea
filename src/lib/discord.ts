import { createHmac, timingSafeEqual } from "crypto";

export const DISCORD_STATE_COOKIE = "gaelia_discord_oauth";

export type DiscordProfile = {
  id: string;
  username: string;
  global_name: string | null;
  avatar: string | null;
};

function requireDiscordConfig() {
  const clientId = process.env.DISCORD_CLIENT_ID?.trim();
  const clientSecret = process.env.DISCORD_CLIENT_SECRET?.trim();
  const appUrl = (process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || "").replace(/\/$/, "");
  if (!clientId || !clientSecret || !appUrl) {
    throw new Error("DISCORD_CLIENT_ID, DISCORD_CLIENT_SECRET et APP_URL manquent.");
  }
  return { clientId, clientSecret, appUrl, redirectUri: `${appUrl}/api/auth/discord/callback` };
}

export function discordConfigured() {
  return Boolean(process.env.DISCORD_CLIENT_ID && process.env.DISCORD_CLIENT_SECRET && (process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL));
}

export function signDiscordState(nonce: string) {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET manquant.");
  const stamp = String(Math.floor(Date.now() / 1000));
  const body = `${nonce}.${stamp}`;
  const sig = createHmac("sha256", secret).update(body).digest("base64url");
  return `${body}.${sig}`;
}

export function verifyDiscordState(value: string) {
  const secret = process.env.AUTH_SECRET;
  if (!secret) return false;
  const parts = value.split(".");
  if (parts.length !== 3) return false;
  const [nonce, stamp, sig] = parts;
  if (!nonce || !stamp || !sig) return false;
  const age = Math.floor(Date.now() / 1000) - Number(stamp);
  if (!Number.isFinite(age) || age < 0 || age > 600) return false;
  const body = `${nonce}.${stamp}`;
  const expected = createHmac("sha256", secret).update(body).digest("base64url");
  try {
    return timingSafeEqual(Buffer.from(sig), Buffer.from(expected));
  } catch {
    return false;
  }
}

export function discordAuthorizeUrl(state: string) {
  const { clientId, redirectUri } = requireDiscordConfig();
  const url = new URL("https://discord.com/api/oauth2/authorize");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("scope", "identify");
  url.searchParams.set("state", state);
  return url.toString();
}

export async function exchangeDiscordCode(code: string): Promise<DiscordProfile> {
  const { clientId, clientSecret, redirectUri } = requireDiscordConfig();
  const tokenRes = await fetch("https://discord.com/api/oauth2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
    }),
  });
  if (!tokenRes.ok) throw new Error("Discord a refusé l’échange du code.");
  const token = (await tokenRes.json()) as { access_token?: string };
  if (!token.access_token) throw new Error("Jeton Discord manquant.");

  const meRes = await fetch("https://discord.com/api/users/@me", {
    headers: { Authorization: `Bearer ${token.access_token}` },
  });
  if (!meRes.ok) throw new Error("Impossible de lire le profil Discord.");
  const me = (await meRes.json()) as DiscordProfile;
  if (!me.id || !me.username) throw new Error("Profil Discord incomplet.");
  return me;
}

export function discordAvatarUrl(profile: DiscordProfile) {
  if (!profile.avatar) return null;
  return `https://cdn.discordapp.com/avatars/${profile.id}/${profile.avatar}.png?size=128`;
}

export function discordUsernameSlug(profile: DiscordProfile) {
  const base = profile.username
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "")
    .slice(0, 16);
  const suffix = profile.id.slice(-4);
  return `${base || "discord"}${suffix}`;
}
