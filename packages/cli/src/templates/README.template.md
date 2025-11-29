# {projectName}

A REST API built with [Allium](https://github.com/your-name/allium) - a powerful framework for building type-safe APIs with auto-generated CRUD operations.

## 🚀 Tech Stack

- **Allium** - API framework with auto-generated CRUD
- **Fastify** - Fast and low overhead web framework
- **Prisma** - Next-generation ORM
- **TypeScript** - Type-safe development
- **{databaseName}** - Database

## 📦 Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Environment

Copy the `.env` file and configure your database:

```bash
DATABASE_URL="{databaseUrl}"
PORT=3000
NODE_ENV=development
```

### 3. Push Database Schema

```bash
npm run db:push
```

### 4. Start Development Server

```bash
npm run dev
```

Your API will be running at:

- **API**: http://localhost:3000/api
- **Swagger Docs**: http://localhost:3000/documentation

## 📜 Available Scripts

| Script                | Description                              |
| --------------------- | ---------------------------------------- |
| `npm run dev`         | Start development server with hot reload |
| `npm run build`       | Build for production                     |
| `npm start`           | Start production server                  |
| `npm run db:push`     | Push schema changes to database (dev)    |
| `npm run db:generate` | Generate Prisma Client                   |
| `npm run db:studio`   | Open Prisma Studio (database GUI)        |

## 🏗️ Project Structure

```
{projectName}/
├── .allium/
│   ├── models/              # JSON model definitions
│   │   └── user.json        # Example User model
│   ├── generated/           # Auto-generated code (do not edit)
│   └── prisma/
│       └── schema.prisma    # Generated Prisma schema
├── src/
│   ├── models/              # Model hooks and custom logic
│   │   └── user.model.ts    # User model with hooks
│   └── app.ts               # Application entry point
├── .env                     # Environment variables
├── package.json
├── prisma.config.js         # Prisma configuration
└── tsconfig.json
```

## 🎯 API Endpoints

For each model (e.g., `User`), the following REST endpoints are automatically generated:

| Method   | Endpoint        | Description                |
| -------- | --------------- | -------------------------- |
| `POST`   | `/api/user`     | Create new user            |
| `GET`    | `/api/user`     | List all users (paginated) |
| `GET`    | `/api/user/:id` | Get user by ID             |
| `PATCH`  | `/api/user/:id` | Update user                |
| `DELETE` | `/api/user/:id` | Delete user                |

### Query Parameters

The list endpoint supports:

- `page` - Page number (default: 1)
- `limit` - Items per page (default: 10)
- `cursor` - Cursor for cursor-based pagination
- `sort[0]=field:order` - Multi-field sorting
- `filters[field][$op]=value` - Advanced filtering

**Example:**

```bash
GET /api/user?limit=20&sort[0]=createdAt:desc&filters[email][$contains]=@example.com
```

## 🔧 Development Workflow

### Adding a New Model

1. **Generate the model:**

   ```bash
   allium generate model
   ```

2. **Define fields interactively or use quick syntax:**

   ```
   ? Model Name: Product
   ? Quick Fields: name:String price:Float stock:Int
   ```

3. **Sync to generate code:**

   ```bash
   allium sync
   ```

4. **Update database:**
   ```bash
   npm run db:push
   ```

### Customizing Models

Edit model files in `src/models/*.model.ts` to add hooks:

```typescript
import { registerModel } from '@allium/core';

export const User = registerModel('User', {
  beforeCreate: async (data, context) => {
    // Hash password, validate, etc.
    return data;
  },

  afterCreate: async (record, context) => {
    // Send welcome email, log, etc.
  },
});
```

### Overriding Generated Code

Create custom implementations for specific layers:

```bash
allium override User service
allium override User controller
allium override User routes
```

## 🔐 Environment Variables

| Variable       | Description                | Example         |
| -------------- | -------------------------- | --------------- |
| `DATABASE_URL` | Database connection string | `{databaseUrl}` |
| `PORT`         | Server port                | `3000`          |
| `NODE_ENV`     | Environment                | `development`   |

## 📚 Resources

- [Allium Documentation](https://github.com/RajNandigalla/allium/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Fastify Documentation](https://fastify.dev)

## 🤝 Contributing

This project was generated with Allium. To contribute:

1. Make your changes
2. Test thoroughly
3. Submit a pull request

## 📄 License

MIT
