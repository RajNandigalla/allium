# Allium Admin UI - Quick Start Guide

## 🎯 Project Goal

Build a **premium, modern admin dashboard** for the Allium framework that provides visual management of models, data, API keys, and database operations.

## 📋 Implementation Checklist

### Phase 1: Foundation (Start Here!) ⭐

- [ ] **Design System Setup**

  - [ ] Create `src/styles/globals.css` with design tokens
  - [ ] Define color palette (dark theme with vibrant accents)
  - [ ] Set up typography system (Inter font)
  - [ ] Create spacing and animation utilities

- [ ] **Core UI Components** (in `src/components/ui/`)

  - [ ] `Button.tsx` - Primary, secondary, danger variants
  - [ ] `Input.tsx` - Text inputs with validation states
  - [ ] `Card.tsx` - Glassmorphism cards
  - [ ] `Modal.tsx` - Dialog system
  - [ ] `Toast.tsx` - Notification system
  - [ ] `Select.tsx` - Dropdown component
  - [ ] `Badge.tsx` - Status indicators
  - [ ] `Tabs.tsx` - Tab navigation

- [ ] **Layout Components** (in `src/components/layout/`)
  - [ ] `Sidebar.tsx` - Main navigation
  - [ ] `Header.tsx` - Top bar with breadcrumbs
  - [ ] `Container.tsx` - Page wrapper

### Phase 2: Dashboard & Models

- [ ] **Dashboard Home** (`src/app/page.tsx`)

  - [ ] Statistics cards (models count, records, API keys)
  - [ ] System status indicators
  - [ ] Quick action buttons
  - [ ] Recent activity feed

- [ ] **Models List** (`src/app/models/page.tsx`)

  - [ ] Grid of model cards
  - [ ] Search and filter
  - [ ] Create new model button
  - [ ] Quick actions per model

- [ ] **Model Editor** (`src/app/models/[name]/page.tsx`)

  - [ ] Tabbed interface (Fields, Relations, API Config)
  - [ ] Field editor with inline editing
  - [ ] Relationship builder
  - [ ] API configuration panel
  - [ ] Save and sync actions

- [ ] **Create Model** (`src/app/models/new/page.tsx`)
  - [ ] Step-by-step wizard
  - [ ] Template selection
  - [ ] Field configuration
  - [ ] Review and create

### Phase 3: Data Explorer

- [ ] **Data Explorer** (`src/app/data/page.tsx`)

  - [ ] Model selector
  - [ ] Dynamic data table
  - [ ] Advanced filtering UI
  - [ ] Sorting and pagination
  - [ ] CRUD operations

- [ ] **Data Components** (in `src/components/data/`)
  - [ ] `DataTable.tsx` - Generic table
  - [ ] `DataFilters.tsx` - Filter builder
  - [ ] `RecordEditor.tsx` - CRUD modal

### Phase 4: API Keys & Database

- [ ] **API Keys** (`src/app/api-keys/page.tsx`)

  - [ ] List of keys with masked values
  - [ ] Generate new key
  - [ ] Revoke key with confirmation
  - [ ] Copy to clipboard

- [ ] **Database** (`src/app/database/page.tsx`)
  - [ ] Database statistics
  - [ ] Seed database action
  - [ ] Reset database (with warning)
  - [ ] Schema sync status

### Phase 5: Integration & Polish

- [ ] **API Client** (`src/lib/api-client.ts`)

  - [ ] REST API wrapper for all endpoints
  - [ ] Error handling
  - [ ] Request/response interceptors

- [ ] **Custom Hooks** (`src/lib/hooks/`)

  - [ ] `useModels.ts`
  - [ ] `useApiKeys.ts`
  - [ ] `useData.ts`
  - [ ] `useToast.ts`

- [ ] **Polish**
  - [ ] Loading states everywhere
  - [ ] Error boundaries
  - [ ] Toast notifications
  - [ ] Responsive design
  - [ ] Accessibility (ARIA labels, keyboard nav)

## 🎨 Design Guidelines

### Color Palette

```css
Primary Background: #0a0a0a
Surface: #1f2937
Primary: #6366f1 (Indigo)
Accent: #06b6d4 (Cyan)
Success: #10b981
Warning: #f59e0b
Danger: #ef4444
```

### Key Design Patterns

- **Glassmorphism**: Cards with `backdrop-blur` and subtle borders
- **Smooth Animations**: 200ms transitions on hover/focus
- **Glow Effects**: Subtle shadows on primary actions
- **Micro-interactions**: Button lifts, input focus rings
- **Responsive Grid**: Fluid layouts that adapt to screen size

## 🚀 Getting Started

### 1. Start the Admin UI

```bash
cd packages/admin
npm run dev
```

### 2. Start the Backend API

```bash
cd packages/my-allium-api  # or your test project
npm run dev
```

### 3. Begin Implementation

Start with **Phase 1** - the design system and core components. These are the foundation for everything else.

**Recommended Order**:

1. `src/styles/globals.css` - Design tokens
2. `src/components/ui/Button.tsx` - First component
3. `src/components/ui/Card.tsx` - Second component
4. `src/components/layout/Sidebar.tsx` - Navigation
5. `src/app/page.tsx` - Dashboard home

## 📚 Key Files to Reference

- **Admin API Docs**: `/docs/ADMIN_API.md`
- **Full Implementation Plan**: `/docs/implementation_plans/admin-ui-implementation.md`
- **Model Schema**: `/packages/core/src/schemas/model.schema.json`

## 🔗 Admin API Endpoints

### Models

- `GET /_admin/models` - List all models
- `GET /_admin/models/:name` - Get model details
- `POST /_admin/models` - Create model
- `PUT /_admin/models/:name` - Update model
- `DELETE /_admin/models/:name` - Delete model

### Data Explorer

- `GET /_admin/data/:model` - List records
- `POST /_admin/data/:model` - Create record
- `PUT /_admin/data/:model/:id` - Update record
- `DELETE /_admin/data/:model/:id` - Delete record

### API Keys

- `GET /_admin/api-keys` - List keys
- `POST /_admin/api-keys` - Generate key
- `DELETE /_admin/api-keys/:id` - Revoke key

### Database

- `GET /_admin/db/stats` - Get statistics
- `POST /_admin/db/seed` - Seed database
- `POST /_admin/db/reset` - Reset database

### Schema

- `POST /_admin/sync` - Sync schema
- `GET /_admin/schema/status` - Check sync status

## 💡 Pro Tips

1. **Start Simple**: Build one component at a time, test it, then move on
2. **Use the Design System**: Always reference your CSS custom properties
3. **Mobile-First**: Design for mobile, then enhance for desktop
4. **Accessibility**: Add ARIA labels and keyboard navigation from the start
5. **Error Handling**: Every API call should have loading and error states
6. **User Feedback**: Use toasts for success/error messages
7. **Confirmation Dialogs**: Always confirm destructive actions (delete, reset)

## 🎯 Success Metrics

- [ ] All pages load in < 1 second
- [ ] Design looks premium and modern
- [ ] All CRUD operations work smoothly
- [ ] Responsive on mobile, tablet, desktop
- [ ] No console errors or warnings
- [ ] Accessible (keyboard navigation works)
- [ ] User gets clear feedback for all actions

## 🐛 Common Pitfalls to Avoid

1. **Don't skip the design system** - It saves time later
2. **Don't hardcode colors** - Use CSS custom properties
3. **Don't forget loading states** - Every async operation needs one
4. **Don't skip error handling** - Show helpful error messages
5. **Don't ignore mobile** - Test on small screens early
6. **Don't forget confirmations** - Especially for delete actions

## 📞 Need Help?

- Check the full implementation plan for detailed specs
- Reference the Admin API docs for endpoint details
- Look at existing Next.js examples for patterns
- Test API endpoints with Swagger UI at `/documentation`

---

**Ready to build something amazing? Start with Phase 1! 🚀**
