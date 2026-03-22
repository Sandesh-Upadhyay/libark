/**
 * 🏭 Test Factories Index
 *
 * Centralized exports for all test data factories.
 * Provides factory pattern infrastructure for test data generation.
 *
 * @example
 * ```typescript
 * import { UserFactory, PostFactory } from './factories';
 * import { prisma } from '@libark/db';
 *
 * const userFactory = new UserFactory(prisma);
 * const postFactory = new PostFactory(prisma, userFactory);
 *
 * // Create a user
 * const user = await userFactory.create();
 *
 * // Create a post (auto-creates user)
 * const post = await postFactory.create({ visibility: 'PUBLIC' });
 * ```
 */

// Base factory
export { BaseFactory, type FactoryOptions } from './BaseFactory';

// User factory
export { UserFactory, type UserOverride } from './UserFactory';

// Post factory
export { PostFactory, type PostOverride } from './PostFactory';

// Media factory
export { MediaFactory, type MediaOverride, type MediaVariantOverride } from './MediaFactory';

// Comment factory
export { CommentFactory, type CommentOverride } from './CommentFactory';

// Conversation factory
export { ConversationFactory, type ConversationOverride } from './ConversationFactory';

// Message factory
export { MessageFactory, type MessageOverride } from './MessageFactory';
