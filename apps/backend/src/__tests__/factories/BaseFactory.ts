/**
 * 🏭 Base Factory Class
 *
 * Abstract base class for all test data factories.
 * Provides common functionality for creating, building, and managing test entities.
 */

import type { PrismaClient, Prisma } from '@libark/db';

/**
 * Base factory options interface
 */
export interface FactoryOptions {
  /** Skip auto-creating related entities */
  skipRelations?: boolean;
  /** Custom transaction client */
  tx?: Prisma.TransactionClient;
}

/**
 * Abstract base factory class with generic type parameter
 *
 * @template TModel - The model type (e.g., User, Post)
 * @template TCreateInput - The Prisma create input type
 * @template TOverride - The override interface type
 * @template TDefaultsExcludes - Additional fields to exclude from defaults (e.g., 'userId')
 */
export abstract class BaseFactory<
  TModel,
  TCreateInput,
  TOverride = Partial<TCreateInput>,
  TDefaultsExcludes extends string = never,
> {
  constructor(protected readonly prisma: PrismaClient) {}

  /**
   * Generate default data for the model
   * Must be implemented by concrete factories
   */
  protected abstract generateDefaults(): Promise<Omit<TCreateInput, 'id' | TDefaultsExcludes>>;

  /**
   * Build data object without persisting to database
   * Useful for testing validation or preparing data
   */
  async build(override: TOverride = {} as TOverride): Promise<TCreateInput> {
    const defaults = await this.generateDefaults();
    return {
      ...defaults,
      ...override,
    } as TCreateInput;
  }

  /**
   * Create a single entity in the database
   * Uses transaction for test isolation
   */
  async create(
    override: TOverride = {} as TOverride,
    options: FactoryOptions = {}
  ): Promise<TModel> {
    const data = await this.build(override);

    if (options.tx) {
      return this.persist(data, options.tx);
    }

    // Use transaction for test isolation
    return this.prisma.$transaction(async tx => {
      return this.persist(data, tx);
    });
  }

  /**
   * Create multiple entities in the database
   */
  async createMany(
    count: number,
    override: TOverride = {} as TOverride,
    options: FactoryOptions = {}
  ): Promise<TModel[]> {
    const results: TModel[] = [];

    if (options.tx) {
      for (let i = 0; i < count; i++) {
        const data = await this.build(override);
        const entity = await this.persist(data, options.tx);
        results.push(entity);
      }
      return results;
    }

    // Use transaction for test isolation
    return this.prisma.$transaction(async tx => {
      for (let i = 0; i < count; i++) {
        const data = await this.build(override);
        const entity = await this.persist(data, tx);
        results.push(entity);
      }
      return results;
    });
  }

  /**
   * Persist the data to database
   * Must be implemented by concrete factories
   */
  protected abstract persist(data: TCreateInput, tx: Prisma.TransactionClient): Promise<TModel>;

  /**
   * Generate unique identifier using timestamp and random
   */
  protected generateUnique(prefix: string): string {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 10000);
    return `${prefix}_${timestamp}_${random}`;
  }

  /**
   * Generate unique email address
   */
  protected generateUniqueEmail(prefix = 'test'): string {
    return `${prefix}_${this.generateUnique('')}@test.com`.toLowerCase();
  }

  /**
   * Generate unique username
   */
  protected generateUniqueUsername(prefix = 'user'): string {
    return `${prefix}_${this.generateUnique('')}`.toLowerCase().replace(/[^a-z0-9_]/g, '');
  }
}
