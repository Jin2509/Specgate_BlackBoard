// Starts a request before the awaits it does not depend on, so independent backend calls run at the same time.

/** Mark the promise as handled now; the caller awaits it later and still sees its error then. */
export function startEarly<T>(promise: Promise<T>): Promise<T> {
  // Without this, a rejection that lands before the caller reaches its await is reported as unhandled.
  promise.catch(() => undefined);
  return promise;
}
