// Utility function to get the keys of an object
// that provides more informative typing on the return value than `Object.keys`.
export function getObjectKeys<T extends Record<string, unknown>>(
  obj: T,
): (keyof T)[] {
  return Object.keys(obj);
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
/* eslint-enable @typescript-eslint/no-explicit-any */

// Debounce an async generator by waiting for `wait` milliseconds before resolving.
// If a new request is made before the timeout, the previous request is cancelled.
/* eslint-disable @typescript-eslint/no-explicit-any */
export function debounceAsyncGenerator<T>(
  func: (...args: any[]) => AsyncGenerator<T>,
  wait: number,
): {
  debounced: (...args: any[]) => AsyncGenerator<T | undefined>;
  cancel: () => void;
  force: () => void;
} {
  const previous = {
    cancel: () => {},
    force: () => {},
  };

  let lastId = 0;

  async function* debounced(...args: any[]): AsyncGenerator<T | undefined> {
    previous.cancel();
    const id = lastId; // Must be after `previous.cancel()`.
    try {
      await new Promise<void>((resolve, reject) => {
        const timer = setTimeout(() => resolve(), wait);
        previous.cancel = () => {
          ++lastId;
          clearTimeout(timer);
          reject();
        };
        previous.force = () => {
          clearTimeout(timer);
          resolve();
        };
      });
    } catch (error) {
      return;
    }
    for await (const chunk of func(...args)) {
      console.log('id', id, 'lastId', lastId);
      if (id !== lastId) break;
      yield chunk;
    }
  }

  return {
    debounced,
    cancel: () => previous.cancel(),
    force: () => previous.force(),
  };
}
/* eslint-enable @typescript-eslint/no-explicit-any */

// Utility function to validate the given string is a valid URL or not.
export function validateURL(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
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
