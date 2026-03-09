/**
 * Parallel execution utilities
 */

import { logger } from './logger';

export interface ParallelOptions {
  concurrency: number;
  continueOnError?: boolean;
}

export async function parallelMap<T, R>(
  items: T[],
  fn: (item: T, index: number) => Promise<R>,
  options: ParallelOptions
): Promise<R[]> {
  const results: R[] = [];
  const errors: Error[] = [];
  let currentIndex = 0;

  async function worker(): Promise<void> {
    while (currentIndex < items.length) {
      const index = currentIndex++;
      const item = items[index];

      try {
        const result = await fn(item, index);
        results[index] = result;
      } catch (error) {
        errors.push(error as Error);
        logger.error(`Parallel execution error at index ${index}`, error);
        
        if (!options.continueOnError) {
          throw error;
        }
      }
    }
  }

  // Create worker pool
  const workers = Array(Math.min(options.concurrency, items.length))
    .fill(null)
    .map(() => worker());

  await Promise.all(workers);

  if (errors.length > 0 && !options.continueOnError) {
    throw errors[0];
  }

  return results.filter((r) => r !== undefined);
}

export async function parallelLimit<T>(
  tasks: (() => Promise<T>)[],
  limit: number
): Promise<T[]> {
  const results: T[] = [];
  const executing: Promise<void>[] = [];

  for (const [index, task] of tasks.entries()) {
    const promise = task().then((result) => {
      results[index] = result;
    });

    executing.push(promise);

    if (executing.length >= limit) {
      await Promise.race(executing);
      executing.splice(
        executing.findIndex((p) => p === promise),
        1
      );
    }
  }

  await Promise.all(executing);
  return results;
}
