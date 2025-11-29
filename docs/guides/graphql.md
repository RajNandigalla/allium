# GraphQL Guide

Allium provides built-in support for GraphQL using **Apollo Server**. It automatically generates a GraphQL schema and resolvers based on your model definitions.

## Enabling GraphQL

To enable GraphQL, pass `graphql: true` to the Allium plugin options in your application setup.

```typescript
// src/app.ts
import alliumPlugin from '@allium/fastify';

await app.register(alliumPlugin, {
  models,
  graphql: true, // Enable Apollo Server
});
```

Once enabled, the GraphQL API is available at `/graphql`.

## Apollo Sandbox

You can access the interactive Apollo Sandbox to explore your schema and run queries at:

```
http://localhost:3000/graphql
```

## Generated Schema

Allium automatically maps your models to GraphQL types.

**Model Definition:**

```json
{
  "name": "User",
  "fields": [
    { "name": "name", "type": "String" },
    { "name": "email", "type": "String" }
  ]
}
```

**Generated GraphQL Type:**

```graphql
type User {
  id: ID!
  uuid: String!
  createdAt: String!
  updatedAt: String!
  name: String!
  email: String!
}
```

## Operations

### Queries

- `user(id: ID!)`: Fetch a single record by ID.
- `users(limit: Int, offset: Int)`: List records with pagination.

```graphql
query {
  users(limit: 10) {
    id
    name
    email
  }
}
```

### Mutations

- `createUser(data: UserCreateInput!)`: Create a new record.
- `updateUser(id: ID!, data: UserUpdateInput!)`: Update a record.
- `deleteUser(id: ID!)`: Delete a record.

```graphql
mutation {
  createUser(data: { name: "Alice", email: "alice@example.com" }) {
    id
    name
  }
}
```

## Relationships

Relationships are automatically resolved. If your models have relations, you can fetch nested data.

```graphql
query {
  users {
    name
    posts {
      title
      content
    }
  }
}
```
