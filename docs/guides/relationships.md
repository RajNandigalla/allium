# Model Relationships Guide

Allium supports standard relationship types (1:1, 1:n, n:m) and polymorphic relationships.

## 1. One-to-One (1:1)

Use when a record in one model is associated with exactly one record in another.

**Example:** User has one Profile.

```json
// User.json
{
  "name": "User",
  "relations": [
    {
      "name": "profile",
      "model": "Profile",
      "type": "1:1"
    }
  ]
}

// Profile.json
{
  "name": "Profile",
  "relations": [
    {
      "name": "user",
      "model": "User",
      "type": "1:1",
      "foreignKey": "userId" // Optional: defaults to userId
    }
  ]
}
```

## 2. One-to-Many (1:n)

Use when a record in one model is associated with multiple records in another.

**Example:** User has many Posts.

```json
// User.json
{
  "name": "User",
  "relations": [
    {
      "name": "posts",
      "model": "Post",
      "type": "1:n"
    }
  ]
}

// Post.json
{
  "name": "Post",
  "relations": [
    {
      "name": "user",
      "model": "User",
      "type": "1:n",
      "foreignKey": "userId" // Holds the foreign key
    }
  ]
}
```

## 3. Many-to-Many (n:m)

Use when records in both models can be associated with multiple records in the other.

**Example:** Post has many Tags, Tag has many Posts.

```json
// Post.json
{
  "name": "Post",
  "relations": [
    {
      "name": "tags",
      "model": "Tag",
      "type": "n:m"
    }
  ]
}

// Tag.json
{
  "name": "Tag",
  "relations": [
    {
      "name": "posts",
      "model": "Post",
      "type": "n:m"
    }
  ]
}
```

## 4. Polymorphic Relationships

Use when a model can belong to one of multiple other models. Allium uses the **Exclusive BelongsTo** pattern (multiple nullable foreign keys).

**Example:** Comment can belong to either a Post or a Video.

```json
// Comment.json
{
  "name": "Comment",
  "fields": [{ "name": "content", "type": "String" }],
  "relations": [
    {
      "name": "commentable",
      "type": "polymorphic",
      "models": ["Post", "Video"]
    }
  ]
}
```

### How it works

1. **Database Schema:**
   Allium generates nullable foreign keys for each target model:

   - `postId` (String?)
   - `videoId` (String?)

2. **API Validation:**
   When creating a Comment, you must provide **exactly one** of the foreign keys.

   **Correct:**

   ```json
   POST /api/comments
   { "content": "Nice!", "postId": "123" }
   ```

   **Incorrect (Error: Requires exactly one):**

   ```json
   POST /api/comments
   { "content": "Nice!" }
   ```

   **Incorrect (Error: Multiple targets):**

   ```json
   POST /api/comments
   { "content": "Nice!", "postId": "123", "videoId": "456" }
   ```

3. **Parent Models:**
   Ensure parent models have the back-relation defined if you want to access comments from them.

   ```json
   // Post.json
   {
     "relations": [{ "name": "comments", "model": "Comment", "type": "1:n" }]
   }
   ```
