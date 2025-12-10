import { describe, it } from 'node:test';
import assert from 'node:assert';
import { ModelDefinition } from '@allium/core';
import { buildPrismaQuery } from '../src/generators/crud-routes';

describe('Draft & Publish Workflow - buildPrismaQuery', () => {
  it('should add status=PUBLISHED and publishedAt filters when draftPublish is true', () => {
    const model: ModelDefinition = {
      name: 'BlogPost',
      fields: [
        { name: 'title', type: 'String' },
        { name: 'content', type: 'String' },
      ],
      draftPublish: true,
    };

    const params = {};
    const query = buildPrismaQuery(model, params);

    assert.ok(query.where, 'Query should have where clause');
    assert.strictEqual(
      query.where.status,
      'PUBLISHED',
      'Status must be PUBLISHED'
    );
    assert.ok(query.where.publishedAt, 'Should have publishedAt filter');
    assert.ok(
      query.where.publishedAt.lte instanceof Date,
      'publishedAt.lte must be a Date'
    );
  });

  it('should NOT add status filters when draftPublish is false', () => {
    const model: ModelDefinition = {
      name: 'BlogPost',
      fields: [{ name: 'title', type: 'String' }],
      draftPublish: false,
    };

    const params = {};
    const query = buildPrismaQuery(model, params);

    // where might exist for other reasons, but status/publishedAt should not
    if (query.where) {
      assert.strictEqual(
        query.where.status,
        undefined,
        'Status should not be set'
      );
      assert.strictEqual(
        query.where.publishedAt,
        undefined,
        'publishedAt should not be set'
      );
    }
  });

  it('should NOT add status filters when draftPublish is undefined', () => {
    const model: ModelDefinition = {
      name: 'Product',
      fields: [{ name: 'name', type: 'String' }],
      // draftPublish not set
    };

    const params = {};
    const query = buildPrismaQuery(model, params);

    if (query.where) {
      assert.strictEqual(query.where.status, undefined);
      assert.strictEqual(query.where.publishedAt, undefined);
    }
  });

  it('should combine draftPublish filters with user-provided filters', () => {
    const model: ModelDefinition = {
      name: 'Article',
      fields: [
        { name: 'title', type: 'String' },
        { name: 'category', type: 'String' },
      ],
      draftPublish: true,
    };

    // User filtering by category
    const params = {
      'filters[category]': 'tech',
    };

    const query = buildPrismaQuery(model, params);

    assert.ok(query.where, 'Should have where clause');
    assert.strictEqual(
      query.where.category,
      'tech',
      'User filter should be preserved'
    );
    assert.strictEqual(
      query.where.status,
      'PUBLISHED',
      'Draft/publish filter should be added'
    );
    assert.ok(query.where.publishedAt, 'publishedAt filter should be added');
  });

  it('should apply draftPublish filters even with sorting and pagination', () => {
    const model: ModelDefinition = {
      name: 'Post',
      fields: [{ name: 'title', type: 'String' }],
      draftPublish: true,
    };

    const params = {
      sort: 'title:desc',
      pagination: { limit: 10, start: 0 },
    };

    const query = buildPrismaQuery(model, params);

    // Verify draft/publish filters are still applied
    assert.strictEqual(query.where.status, 'PUBLISHED');
    assert.ok(query.where.publishedAt);

    // Verify sorting is also applied
    assert.ok(query.orderBy, 'Should have orderBy');
  });
});
