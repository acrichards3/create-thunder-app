import { encryptString, getEncryptionKeyFromEnv, hashToken } from "./crypto";
import type { Adapter, AdapterAccount, AdapterSession, VerificationToken } from "@auth/core/adapters";

type SecureAdapterOptions = {
  oauthEncryptionKey: string | undefined;
};

export function createSecureAdapter(base: Adapter, opts: SecureAdapterOptions): Adapter {
  const encKey = getEncryptionKeyFromEnv(opts.oauthEncryptionKey);

  function encryptAccountTokens(account: AdapterAccount): AdapterAccount {
    const overridden = {
      ...account,
      ...(account.access_token ? { access_token: encryptString(String(account.access_token), encKey) } : {}),
      ...(account.refresh_token ? { refresh_token: encryptString(String(account.refresh_token), encKey) } : {}),
      ...(account.id_token ? { id_token: encryptString(String(account.id_token), encKey) } : {}),
    } satisfies AdapterAccount;
    return overridden;
  }

  const adapter: Adapter = { ...base };

  if (base.linkAccount) {
    const baseLink = base.linkAccount;
    const linkAccount: NonNullable<Adapter["linkAccount"]> = (account) => {
      const enc = encryptAccountTokens(account);
      return baseLink(enc);
    };
    adapter.linkAccount = linkAccount;
  }

  if (base.createSession) {
    const baseCreate = base.createSession;
    const createSession: NonNullable<Adapter["createSession"]> = async (session) => {
      const toStore: AdapterSession = {
        ...session,
        sessionToken: hashToken(session.sessionToken),
      };
      const stored = await baseCreate(toStore);
      return { ...stored, sessionToken: session.sessionToken };
    };
    adapter.createSession = createSession;
  }

  if (base.getSessionAndUser) {
    const baseGet = base.getSessionAndUser;
    const getSessionAndUser: NonNullable<Adapter["getSessionAndUser"]> = (sessionToken) =>
      baseGet(hashToken(sessionToken));
    adapter.getSessionAndUser = getSessionAndUser;
  }

  if (base.updateSession) {
    const baseUpdate = base.updateSession;
    const updateSession: NonNullable<Adapter["updateSession"]> = async (session) => {
      const updated = session.sessionToken
        ? { ...session, sessionToken: hashToken(session.sessionToken) }
        : { ...session };
      const result = await baseUpdate(updated);
      return session.sessionToken && result ? { ...result, sessionToken: session.sessionToken } : result;
    };
    adapter.updateSession = updateSession;
  }

  if (base.deleteSession) {
    const baseDelete = base.deleteSession;
    const deleteSession: NonNullable<Adapter["deleteSession"]> = (sessionToken) => baseDelete(hashToken(sessionToken));
    adapter.deleteSession = deleteSession;
  }

  if (base.createVerificationToken) {
    const baseCreateVT = base.createVerificationToken;
    const createVerificationToken: NonNullable<Adapter["createVerificationToken"]> = (vt) => {
      const toStore: VerificationToken = { ...vt, token: hashToken(vt.token) };
      return baseCreateVT(toStore);
    };
    adapter.createVerificationToken = createVerificationToken;
  }

  if (base.useVerificationToken) {
    const baseUseVT = base.useVerificationToken;
    const useVerificationToken: NonNullable<Adapter["useVerificationToken"]> = (params) => {
      return baseUseVT({ ...params, token: hashToken(params.token) });
    };
    adapter.useVerificationToken = useVerificationToken;
  }

  return adapter;
}
