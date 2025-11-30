# Allium Admin UI - Implementation Plan

## Overview

Build a modern, premium admin dashboard for the Allium framework that provides a visual interface for managing models, fields, relationships, data, and system configuration. The UI will consume the Admin API endpoints documented in `ADMIN_API.md`.

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Styling**: Vanilla CSS with modern design patterns (Nunito Sans font)
- **UI Components**: Radix UI (headless, accessible components)
- **Data Tables**: TanStack Table (React Table v8)
- **Forms**: React Hook Form + Zod validation
- **Icons**: Lucide React
- **Animations**: Framer Motion
- **Code Editor**: Monaco Editor (for schema preview)
- **Drag & Drop**: dnd-kit
- **Data Fetching**: Apollo Client (GraphQL) + REST API calls
- **State Management**: React hooks + Apollo Cache

## Design Principles

### Visual Excellence

- **Modern Dark Theme**: Primary dark mode with sleek gradients and glassmorphism
- **Color Palette**:
  - Primary: HSL-based vibrant blues/purples (#6366f1, #8b5cf6)
  - Accent: Cyan/teal for highlights (#06b6d4, #14b8a6)
  - Background: Deep dark (#0a0a0a, #111827)
  - Surface: Elevated cards with subtle borders (#1f2937)
- **Typography**: Inter font family for clean, modern text
- **Animations**: Smooth micro-interactions, hover effects, and transitions
- **Layout**: Responsive grid system with fluid spacing

### User Experience

- **Intuitive Navigation**: Sidebar with clear sections
- **Real-time Feedback**: Loading states, success/error toasts
- **Keyboard Shortcuts**: Power user features
- **Search & Filter**: Quick access to all resources
- **Contextual Actions**: Right-click menus, inline editing

## Application Structure

```
packages/admin/src/
├── app/
│   ├── layout.tsx                 # Root layout with sidebar
│   ├── page.tsx                   # Dashboard home
│   ├── models/
│   │   ├── page.tsx              # Models list
│   │   ├── [name]/
│   │   │   ├── page.tsx          # Model detail/editor
│   │   │   └── data/page.tsx     # Data explorer for model
│   │   └── new/page.tsx          # Create new model
│   ├── data/
│   │   └── page.tsx              # Global data explorer
│   ├── api-keys/
│   │   └── page.tsx              # API key management
│   ├── database/
│   │   └── page.tsx              # Database operations
│   └── settings/
│       └── page.tsx              # System settings
├── components/
│   ├── layout/
│   │   ├── Sidebar.tsx           # Main navigation
│   │   ├── Header.tsx            # Top bar with breadcrumbs
│   │   └── Container.tsx         # Page container wrapper
│   ├── models/
│   │   ├── ModelCard.tsx         # Model preview card
│   │   ├── ModelEditor.tsx       # Visual schema editor
│   │   ├── FieldEditor.tsx       # Field configuration form
│   │   └── RelationEditor.tsx    # Relationship builder
│   ├── data/
│   │   ├── DataTable.tsx         # Generic data table
│   │   ├── DataFilters.tsx       # Advanced filtering UI
│   │   └── RecordEditor.tsx      # CRUD form for records
│   ├── ui/
│   │   ├── Button.tsx            # Primary button component
│   │   ├── Input.tsx             # Form input
│   │   ├── Select.tsx            # Dropdown select
│   │   ├── Modal.tsx             # Modal dialog
│   │   ├── Toast.tsx             # Notification system
│   │   ├── Card.tsx              # Content card
│   │   ├── Badge.tsx             # Status badges
│   │   ├── Tabs.tsx              # Tab navigation
│   │   └── IconButton.tsx        # Icon-only buttons
│   └── common/
│       ├── LoadingSpinner.tsx    # Loading indicator
│       ├── EmptyState.tsx        # No data placeholder
│       └── ErrorBoundary.tsx     # Error handling
├── lib/
│   ├── apollo-wrapper.tsx        # Apollo provider (existing)
│   ├── api-client.ts             # REST API wrapper
│   ├── hooks/
│   │   ├── useModels.ts          # Models data hooks
│   │   ├── useApiKeys.ts         # API keys hooks
│   │   └── useToast.ts           # Toast notifications
│   └── utils.ts                  # Utility functions
└── styles/
    ├── globals.css               # Global styles & design tokens
    ├── components/               # Component-specific styles
    └── themes/                   # Theme definitions
```

## Implementation Phases

### Phase 1: Foundation & Design System (Priority: HIGH)

#### 1.1 Design System Setup

**File**: `src/styles/globals.css`

Create a comprehensive design system with:

- CSS custom properties for colors, spacing, typography
- Utility classes for common patterns
- Animation keyframes
- Responsive breakpoints

**Key Features**:

```css
:root {
  /* Colors */
  --primary-500: #6366f1;
  --primary-600: #4f46e5;
  --accent-500: #06b6d4;

  /* Spacing */
  --space-1: 0.25rem;
  --space-2: 0.5rem;
  /* ... */

  /* Typography */
  --font-sans: 'Inter', sans-serif;
  --text-xs: 0.75rem;
  /* ... */

  /* Shadows */
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
  --shadow-glow: 0 0 20px rgba(99, 102, 241, 0.3);

  /* Animations */
  --transition-fast: 150ms ease;
  --transition-base: 200ms ease;
}
```

#### 1.2 Core UI Components

Build reusable components with consistent styling:

1. **Button** (`components/ui/Button.tsx`)

   - Variants: primary, secondary, danger, ghost
   - Sizes: sm, md, lg
   - States: default, hover, active, disabled, loading
   - Icon support

2. **Input** (`components/ui/Input.tsx`)

   - Text, number, email, password types
   - Label, helper text, error states
   - Prefix/suffix icons
   - Validation feedback

3. **Card** (`components/ui/Card.tsx`)

   - Glassmorphism effect
   - Hover elevation
   - Optional header/footer sections

4. **Modal** (`components/ui/Modal.tsx`)

   - Backdrop blur
   - Smooth enter/exit animations
   - Focus trap
   - ESC to close

5. **Toast** (`components/ui/Toast.tsx`)
   - Success, error, warning, info variants
   - Auto-dismiss with timer
   - Stack multiple toasts
   - Slide-in animation

#### 1.3 Layout Components

1. **Sidebar** (`components/layout/Sidebar.tsx`)

   - Collapsible navigation
   - Active route highlighting
   - Icon + label format
   - Sections: Models, Data, API Keys, Database, Settings
   - Smooth hover effects

2. **Header** (`components/layout/Header.tsx`)

   - Breadcrumb navigation
   - Search bar (global)
   - User menu (future)
   - System status indicator

3. **Container** (`components/layout/Container.tsx`)
   - Consistent padding
   - Max-width constraints
   - Responsive grid

### Phase 2: Dashboard & Models Management (Priority: HIGH)

#### 2.1 Dashboard Home Page

**File**: `src/app/page.tsx`

**Features**:

- Welcome banner with quick actions
- Statistics cards:
  - Total models count
  - Total records across all models
  - API keys count
  - System uptime
- Recent activity feed
- Quick links to common tasks
- Database sync status indicator

**API Calls**:

- `GET /_admin/models` (count)
- `GET /_admin/db/stats` (record counts)
- `GET /_admin/schema/status` (sync status)
- `GET /_admin/system/info` (uptime)

#### 2.2 Models List Page

**File**: `src/app/models/page.tsx`

**Features**:

- Grid of model cards with:
  - Model name
  - Field count
  - Relationship count
  - Record count
  - Quick actions (Edit, View Data, Delete)
- Search/filter models
- "Create New Model" CTA button
- Sort options (name, created date, record count)

**Components**:

- `ModelCard` - Individual model preview
- Search input with debounce
- Grid layout with responsive columns

**API Calls**:

- `GET /_admin/models`
- `GET /_admin/db/stats`

#### 2.3 Model Editor Page

**File**: `src/app/models/[name]/page.tsx`

**Features**:

- **Visual Schema Editor**:
  - Tab navigation: Fields, Relations, API Config, Preview
  - Fields tab:
    - List of fields with inline editing
    - Add new field button
    - Drag-to-reorder (future)
    - Field properties: name, type, required, unique, default, validation
  - Relations tab:
    - Visual relationship builder
    - Select relationship type (1:1, 1:n, n:m, polymorphic)
    - Configure foreign keys and references
  - API Config tab:
    - Enable/disable operations (CRUD)
    - Custom route prefix
  - Preview tab:
    - Generated JSON schema
    - Prisma schema preview
- **Actions**:
  - Save changes
  - Sync schema (triggers `POST /_admin/sync`)
  - Delete model
  - View generated API docs

**Components**:

- `ModelEditor` - Main editor container
- `FieldEditor` - Field configuration form
- `RelationEditor` - Relationship builder
- `Tabs` - Tab navigation
- Code preview with syntax highlighting

**API Calls**:

- `GET /_admin/models/:name`
- `PUT /_admin/models/:name`
- `POST /_admin/models/:name/fields`
- `PUT /_admin/models/:name/fields/:fieldName`
- `DELETE /_admin/models/:name/fields/:fieldName`
- `POST /_admin/models/:name/relations`
- `POST /_admin/sync`

#### 2.4 Create Model Page

**File**: `src/app/models/new/page.tsx`

**Features**:

- Step-by-step wizard:
  1. Basic info (model name)
  2. Add fields
  3. Configure relationships (optional)
  4. Review & create
- Template selection (User, Post, Product, etc.)
- Quick mode: paste JSON definition
- Validation feedback at each step

**API Calls**:

- `POST /_admin/models`
- `GET /_admin/types` (field types)
- `GET /_admin/field-options`

### Phase 3: Data Explorer (Priority: MEDIUM)

#### 3.1 Global Data Explorer

**File**: `src/app/data/page.tsx`

**Features**:

- Model selector dropdown
- Dynamic data table based on selected model
- Advanced filtering UI:
  - Field-specific filters
  - Operators: equals, contains, greater than, etc.
  - Multiple filter conditions
- Sorting (multi-column)
- Pagination (cursor-based)
- Bulk actions (delete, export)
- Create new record button

**Components**:

- `DataTable` - Generic table with sorting/filtering
- `DataFilters` - Advanced filter builder
- `RecordEditor` - Modal form for CRUD

**API Calls**:

- `GET /_admin/data/:model`
- `POST /_admin/data/:model`
- `PUT /_admin/data/:model/:id`
- `DELETE /_admin/data/:model/:id`

#### 3.2 Model-Specific Data Page

**File**: `src/app/models/[name]/data/page.tsx`

Same as global data explorer but pre-filtered to specific model.

### Phase 4: API Keys & Database Management (Priority: MEDIUM)

#### 4.1 API Keys Page

**File**: `src/app/api-keys/page.tsx`

**Features**:

- List of API keys with:
  - Name/description
  - Key (masked, click to reveal)
  - Created date
  - Last used (future)
  - Revoke action
- Generate new key button
- Copy to clipboard functionality
- Warning modal before revocation

**API Calls**:

- `GET /_admin/api-keys`
- `POST /_admin/api-keys`
- `DELETE /_admin/api-keys/:id`

#### 4.2 Database Operations Page

**File**: `src/app/database/page.tsx`

**Features**:

- Database statistics:
  - Total records per model
  - Database size (future)
  - Connection status
- Danger zone:
  - Seed database button
  - Reset database button (with confirmation)
- Schema sync status
- Manual sync trigger

**API Calls**:

- `GET /_admin/db/stats`
- `POST /_admin/db/seed`
- `POST /_admin/db/reset`
- `POST /_admin/sync`
- `GET /_admin/schema/status`

### Phase 5: Settings & System Info (Priority: LOW)

#### 5.1 Settings Page

**File**: `src/app/settings/page.tsx`

**Features**:

- Project configuration display
- System information:
  - Node.js version
  - Memory usage
  - Uptime
  - OS info
- Theme preferences (future)
- Export/import configuration (future)

**API Calls**:

- `GET /_admin/config`
- `GET /_admin/system/info`

### Phase 6: Polish & Advanced Features (Priority: LOW)

#### 6.1 Advanced Features

- **Search**: Global search across models and data
- **Keyboard Shortcuts**: Quick navigation (Cmd+K for search, etc.)
- **Real-time Updates**: WebSocket integration for live data
- **Undo/Redo**: Schema changes history
- **Export**: Download models as JSON
- **Import**: Upload model definitions
- **Dark/Light Theme Toggle**: User preference
- **Responsive Mobile View**: Touch-optimized interface

#### 6.2 Error Handling & Loading States

- Comprehensive error boundaries
- Graceful degradation
- Retry mechanisms
- Skeleton loaders
- Empty states with helpful CTAs

## API Integration Strategy

### REST API Client

**File**: `src/lib/api-client.ts`

```typescript
class AdminApiClient {
  private baseUrl = '/_admin';

  async getModels() {
    /* ... */
  }
  async getModel(name: string) {
    /* ... */
  }
  async createModel(data: ModelDefinition) {
    /* ... */
  }
  async updateModel(name: string, data: Partial<ModelDefinition>) {
    /* ... */
  }
  async deleteModel(name: string) {
    /* ... */
  }

  async syncSchema() {
    /* ... */
  }
  async getSchemaStatus() {
    /* ... */
  }

  async getData(model: string, params: QueryParams) {
    /* ... */
  }
  async createRecord(model: string, data: any) {
    /* ... */
  }
  async updateRecord(model: string, id: string, data: any) {
    /* ... */
  }
  async deleteRecord(model: string, id: string) {
    /* ... */
  }

  async getApiKeys() {
    /* ... */
  }
  async createApiKey(name: string) {
    /* ... */
  }
  async deleteApiKey(id: string) {
    /* ... */
  }

  async seedDatabase() {
    /* ... */
  }
  async resetDatabase() {
    /* ... */
  }
  async getDatabaseStats() {
    /* ... */
  }

  async getSystemInfo() {
    /* ... */
  }
  async getConfig() {
    /* ... */
  }
}
```

### Custom Hooks

**Files**: `src/lib/hooks/*.ts`

```typescript
// useModels.ts
export function useModels() {
  const [models, setModels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refetch = async () => {
    /* ... */
  };
  const createModel = async (data) => {
    /* ... */
  };
  const updateModel = async (name, data) => {
    /* ... */
  };
  const deleteModel = async (name) => {
    /* ... */
  };

  return {
    models,
    loading,
    error,
    refetch,
    createModel,
    updateModel,
    deleteModel,
  };
}

// Similar hooks for: useApiKeys, useData, useDatabase, etc.
```

## Design Mockup Requirements

### Color Scheme

- **Primary Background**: `#0a0a0a` (deep black)
- **Surface**: `#1f2937` (dark gray)
- **Primary**: `#6366f1` (indigo)
- **Accent**: `#06b6d4` (cyan)
- **Success**: `#10b981` (green)
- **Warning**: `#f59e0b` (amber)
- **Danger**: `#ef4444` (red)
- **Text Primary**: `#f9fafb` (near white)
- **Text Secondary**: `#9ca3af` (gray)

### Typography

- **Font Family**: Inter (import from Google Fonts)
- **Headings**:
  - H1: 2.5rem, bold
  - H2: 2rem, semibold
  - H3: 1.5rem, semibold
- **Body**: 1rem, regular
- **Small**: 0.875rem, regular

### Spacing System

- Base unit: 4px
- Scale: 4, 8, 12, 16, 24, 32, 48, 64, 96

### Component Patterns

- **Cards**: Glassmorphism with `backdrop-blur`, subtle border, shadow on hover
- **Buttons**: Gradient backgrounds, smooth transitions, hover lift effect
- **Inputs**: Focused state with glow effect, smooth border transitions
- **Modals**: Backdrop blur, slide-up animation, centered with max-width
- **Toasts**: Slide-in from top-right, auto-dismiss, stacked layout

## Development Workflow

### Step 1: Design System (Week 1)

1. Create `globals.css` with design tokens
2. Build core UI components (Button, Input, Card, Modal, Toast)
3. Create layout components (Sidebar, Header, Container)
4. Test components in isolation

### Step 2: Dashboard & Models (Week 2)

1. Implement dashboard home page
2. Build models list page
3. Create model editor with tabs
4. Add create model wizard
5. Integrate REST API calls

### Step 3: Data Explorer (Week 3)

1. Build generic data table component
2. Implement filtering and sorting
3. Create record editor modal
4. Add pagination
5. Test with multiple models

### Step 4: API Keys & Database (Week 4)

1. Implement API keys management
2. Build database operations page
3. Add confirmation modals for destructive actions
4. Integrate all API endpoints

### Step 5: Polish & Testing (Week 5)

1. Add loading states and error handling
2. Implement toast notifications
3. Responsive design adjustments
4. Accessibility improvements
5. Performance optimization

## Success Criteria

### Functional Requirements

- ✅ All Admin API endpoints integrated
- ✅ CRUD operations for models, fields, relations
- ✅ Data explorer with filtering and sorting
- ✅ API key management
- ✅ Database operations (seed, reset, stats)
- ✅ Schema sync functionality

### Non-Functional Requirements

- ✅ Premium, modern design that "wows" users
- ✅ Smooth animations and micro-interactions
- ✅ Responsive layout (desktop, tablet, mobile)
- ✅ Fast page loads (<1s)
- ✅ Accessible (WCAG 2.1 AA)
- ✅ Error handling with helpful messages
- ✅ Loading states for all async operations

### User Experience

- ✅ Intuitive navigation
- ✅ Clear visual hierarchy
- ✅ Consistent design patterns
- ✅ Helpful empty states
- ✅ Confirmation for destructive actions
- ✅ Real-time feedback (toasts, loading spinners)

## Future Enhancements

- GraphQL integration for data fetching
- Real-time collaboration (multiple users)
- Version control for schema changes
- Advanced permissions and roles
- Custom dashboard widgets
- Data visualization (charts, graphs)
- Automated testing suite
- Storybook for component library
- Performance monitoring
- Audit logs

## Notes

- Start with desktop-first design, then adapt for mobile
- Use semantic HTML for accessibility
- Implement keyboard navigation
- Add proper ARIA labels
- Optimize images and assets
- Use code splitting for better performance
- Document all components with JSDoc
- Write unit tests for critical functionality
