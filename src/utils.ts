export function uuid(): string {
  return crypto.randomUUID();
}

// Debounce an async function by waiting for `wait` milliseconds before resolving.
// If a new request is made before the timeout, the previous request is cancelled.
/* eslint-disable @typescript-eslint/no-explicit-any */
export function debounceAsyncFunc<T>(
  func: (...args: any[]) => Promise<T>,
  wait: number,
): {
  debounced: (...args: any[]) => Promise<T | undefined>;
  cancel: () => void;
  force: () => void;
} {
  // Put these default functions in an object
  // to prevent stale closure of the return values.
  const previous = {
    cancel: () => {},
    force: () => {},
  };

  function debounced(...args: any[]): Promise<T | undefined> {
    return new Promise((resolve) => {
      previous.cancel();
      const timer = setTimeout(() => func(...args).then(resolve), wait);
      previous.cancel = () => {
        clearTimeout(timer);
        resolve(undefined);
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

export function getTodayAsString(): string {
  return new Date().toISOString().split('T')[0];
}

export function getThisMonthAsString(): string {
  return new Date().toISOString().split('-').slice(0, 2).join('-');
}

export function getDaysInCurrentMonth(): Date[] {
  const today = new Date();
  const date = new Date(today.getFullYear(), today.getMonth(), 1);
  const dates = [];
  while (date.getMonth() === today.getMonth()) {
    dates.push(new Date(date));
    date.setDate(date.getDate() + 1);
  }
  return dates;
}
