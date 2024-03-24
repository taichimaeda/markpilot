// Debounce an async function by waiting for `wait` milliseconds before resolving.
// If a new request is made before the timeout, the previous request is cancelled.
/* eslint-disable @typescript-eslint/no-explicit-any */
export function debounceAsyncFunc<T>(
  func: (...args: any[]) => Promise<T>,
  wait: number,
): {
  debounced: (...args: any[]) => Promise<T>;
  cancel: () => void;
  force: () => void;
} {
  // Put these default functions in an object
  // to prevent stale closure of the return values.
  const previous = {
    cancel: () => {},
    force: () => {},
  };

  function debounced(...args: any[]): Promise<T> {
    return new Promise((resolve, reject) => {
      previous.cancel();
      const timer = setTimeout(() => func(...args).then(resolve), wait);
      previous.cancel = () => {
        clearTimeout(timer);
        reject();
      };
      previous.force = () => {
        clearTimeout(timer);
        func(...args).then(resolve);
      };
    });
  }

  return {
    debounced,
    cancel: () => previous.cancel(),
    force: () => previous.force(),
  };
}
