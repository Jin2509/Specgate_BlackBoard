// Names and options of the session cookies shared by the proxy, server actions and the backend client.
const THIRTY_DAYS_SECONDS = 60 * 60 * 24 * 30;

/** Same name the backend sets itself, so either side can read the token. */
export const SESSION_COOKIE = "sg_session";

/** Last workspace opened, so the proxy reports it to the backend once per change. */
export const LAST_WORKSPACE_COOKIE = "sg_last";

export const SESSION_MAX_AGE_SECONDS = THIRTY_DAYS_SECONDS;

const BASE_OPTIONS = { path: "/", httpOnly: true, sameSite: "lax" as const };

export const SESSION_COOKIE_OPTIONS = { ...BASE_OPTIONS, maxAge: SESSION_MAX_AGE_SECONDS };

export const LAST_WORKSPACE_COOKIE_OPTIONS = { ...BASE_OPTIONS, maxAge: THIRTY_DAYS_SECONDS };
