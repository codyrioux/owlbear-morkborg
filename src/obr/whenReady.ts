import OBR from '@owlbear-rodeo/sdk';

/**
 * Defers an Owlbear subscription until the SDK handshake has completed.
 *
 * `OBR.isAvailable` is true the moment the page loads inside Owlbear, but the
 * message bus is not connected until `OBR.onReady` fires. Calling any
 * `onChange`-style API before that throws "Unable to send message: not ready".
 * Thrown during React's commit phase, that unmounts the whole tree and leaves
 * the extension panel blank.
 *
 * `whenReady` registers the subscription only once the SDK is ready, swallows a
 * failed registration into a warning, and returns an unsubscribe function that
 * is safe to call at any point, including before the subscription exists.
 */
export function whenReady(start: () => (() => void) | void): () => void {
  if (!OBR.isAvailable) {
    return () => {};
  }

  let inner: (() => void) | null = null;
  let cancelled = false;

  const run = () => {
    if (cancelled) return;
    try {
      const unsubscribe = start();
      if (typeof unsubscribe === 'function') {
        inner = unsubscribe;
      }
    } catch (err) {
      console.warn('Owlbear subscription failed to start:', err);
    }
  };

  if (OBR.isReady) {
    run();
  } else {
    OBR.onReady(run);
  }

  return () => {
    cancelled = true;
    if (inner) {
      try {
        inner();
      } catch (err) {
        console.warn('Owlbear unsubscribe failed:', err);
      }
      inner = null;
    }
  };
}
