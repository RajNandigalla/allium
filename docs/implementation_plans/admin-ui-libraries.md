# Allium Admin UI - Component Libraries & Dependencies

## Overview

This document outlines the npm libraries we'll use to build the Allium Admin UI quickly and professionally. These components will serve as the foundation for our future custom UI library.

## Core UI Component Libraries

### 1. **Radix UI** (Recommended Primary Choice)

**Why**: Unstyled, accessible components that we can customize with our design system.

```bash
npm install @radix-ui/react-dialog @radix-ui/react-dropdown-menu @radix-ui/react-select @radix-ui/react-tabs @radix-ui/react-toast @radix-ui/react-tooltip @radix-ui/react-switch @radix-ui/react-checkbox @radix-ui/react-radio-group @radix-ui/react-popover @radix-ui/react-accordion
```

**Components to use**:

- `@radix-ui/react-dialog` - Modals and dialogs
- `@radix-ui/react-dropdown-menu` - Dropdown menus
- `@radix-ui/react-select` - Select dropdowns
- `@radix-ui/react-tabs` - Tab navigation
- `@radix-ui/react-toast` - Toast notifications
- `@radix-ui/react-tooltip` - Tooltips
- `@radix-ui/react-switch` - Toggle switches
- `@radix-ui/react-checkbox` - Checkboxes
- `@radix-ui/react-popover` - Popovers
- `@radix-ui/react-accordion` - Accordions

### 2. **Headless UI** (Alternative/Complementary)

**Why**: Another excellent headless component library from Tailwind team.

```bash
npm install @headlessui/react
```

**Components to use**:

- `Listbox` - Custom select dropdowns
- `Combobox` - Autocomplete/searchable selects
- `Menu` - Dropdown menus
- `Dialog` - Modals
- `Disclosure` - Accordions/collapsible sections

## Data Table Library

### **TanStack Table (React Table v8)**

**Why**: Most powerful and flexible table library for React.

```bash
npm install @tanstack/react-table
```

**Features**:

- Sorting, filtering, pagination
- Column resizing and reordering
- Row selection
- Virtualization support
- Fully typed with TypeScript

## Form Management

### **React Hook Form**

**Why**: Best performance, minimal re-renders, great DX.

```bash
npm install react-hook-form
```

**Features**:

- Simple API
- Built-in validation
- TypeScript support
- Works great with Zod for schema validation

### **Zod** (Schema Validation)

```bash
npm install zod @hookform/resolvers
```

**Use for**:

- Form validation schemas
- Type-safe form data
- Integration with React Hook Form

## Icons

### **Lucide React**

**Why**: Beautiful, consistent icon set with React components.

```bash
npm install lucide-react
```

**Examples**:

```tsx
import { Home, Settings, Database, Key, Table } from 'lucide-react';
```

## Code Editor

### **Monaco Editor** (VS Code Editor)

**Why**: Full-featured code editor for JSON/Prisma schema preview.

```bash
npm install @monaco-editor/react
```

**Use for**:

- JSON schema preview
- Prisma schema preview
- Code editing in admin

## Drag and Drop

### **dnd-kit**

**Why**: Modern, accessible drag-and-drop toolkit.

```bash
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

**Use for**:

- Reordering fields in model editor
- Drag-to-reorder in lists
- Future dashboard customization

## Date/Time

### **date-fns**

**Why**: Lightweight, modular date utility library.

```bash
npm install date-fns
```

**Use for**:

- Formatting dates in tables
- Relative time (e.g., "2 hours ago")
- Date calculations

## Utilities

### **clsx** (Already installed)

**Why**: Conditional className utility.

### **tailwind-merge** (Already installed)

**Why**: Merge Tailwind classes intelligently.

### **react-hot-toast** (Alternative to Radix Toast)

**Why**: Simple, beautiful toast notifications.

```bash
npm install react-hot-toast
```

## Animation

### **Framer Motion**

**Why**: Production-ready animation library for React.

```bash
npm install framer-motion
```

**Use for**:

- Page transitions
- Modal animations
- Micro-interactions
- List animations

## Complete Installation Command

```bash
cd packages/admin

npm install \
  @radix-ui/react-dialog \
  @radix-ui/react-dropdown-menu \
  @radix-ui/react-select \
  @radix-ui/react-tabs \
  @radix-ui/react-tooltip \
  @radix-ui/react-switch \
  @radix-ui/react-checkbox \
  @radix-ui/react-popover \
  @radix-ui/react-accordion \
  @headlessui/react \
  @tanstack/react-table \
  react-hook-form \
  zod \
  @hookform/resolvers \
  lucide-react \
  @monaco-editor/react \
  @dnd-kit/core \
  @dnd-kit/sortable \
  @dnd-kit/utilities \
  date-fns \
  react-hot-toast \
  framer-motion
```

## Component Architecture

### Wrapper Components

We'll create thin wrapper components around these libraries that apply our design system:

```
src/components/ui/
├── Button.tsx              # Custom styled button
├── Input.tsx               # Custom styled input
├── Select.tsx              # Radix Select + our styles
├── Dialog.tsx              # Radix Dialog + our styles
├── Tabs.tsx                # Radix Tabs + our styles
├── Toast.tsx               # react-hot-toast + our styles
├── Tooltip.tsx             # Radix Tooltip + our styles
├── Switch.tsx              # Radix Switch + our styles
├── Checkbox.tsx            # Radix Checkbox + our styles
├── Dropdown.tsx            # Radix Dropdown + our styles
├── Popover.tsx             # Radix Popover + our styles
├── Accordion.tsx           # Radix Accordion + our styles
└── Card.tsx                # Custom card component
```

### Example: Button Component

```tsx
// src/components/ui/Button.tsx
import { forwardRef } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      isLoading,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        className={twMerge(
          clsx(
            'btn',
            `btn-${variant}`,
            `btn-${size}`,
            isLoading && 'btn-loading',
            className
          )
        )}
        disabled={isLoading || props.disabled}
        {...props}
      >
        {isLoading ? 'Loading...' : children}
      </button>
    );
  }
);

Button.displayName = 'Button';
```

### Example: Dialog Component

```tsx
// src/components/ui/Dialog.tsx
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';

export function Dialog({ children, ...props }: DialogPrimitive.DialogProps) {
  return <DialogPrimitive.Root {...props}>{children}</DialogPrimitive.Root>;
}

export function DialogTrigger({ children }: { children: React.ReactNode }) {
  return <DialogPrimitive.Trigger asChild>{children}</DialogPrimitive.Trigger>;
}

export function DialogContent({
  children,
  title,
}: {
  children: React.ReactNode;
  title?: string;
}) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className='dialog-overlay' />
      <DialogPrimitive.Content className='dialog-content'>
        {title && (
          <DialogPrimitive.Title className='dialog-title'>
            {title}
          </DialogPrimitive.Title>
        )}
        {children}
        <DialogPrimitive.Close className='dialog-close'>
          <X size={20} />
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}
```

### Example: Data Table Component

```tsx
// src/components/data/DataTable.tsx
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
} from '@tanstack/react-table';

interface DataTableProps<T> {
  data: T[];
  columns: any[];
  onRowClick?: (row: T) => void;
}

export function DataTable<T>({ data, columns, onRowClick }: DataTableProps<T>) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  return (
    <div className='data-table'>
      <table>
        <thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <th key={header.id}>
                  {flexRender(
                    header.column.columnDef.header,
                    header.getContext()
                  )}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => (
            <tr key={row.id} onClick={() => onRowClick?.(row.original)}>
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

## Styling Strategy

### CSS Modules + Design Tokens

Each component will have its own CSS module that uses our design tokens:

```css
/* src/components/ui/Button.module.css */
.btn {
  font-family: var(--font-sans);
  font-weight: var(--font-medium);
  border-radius: var(--radius-lg);
  transition: all var(--transition-base);
  cursor: pointer;
  border: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
}

.btn-primary {
  background: var(--primary-600);
  color: var(--text-primary);
}

.btn-primary:hover {
  background: var(--primary-500);
  box-shadow: var(--shadow-glow-primary);
  transform: translateY(-1px);
}

.btn-sm {
  padding: var(--space-2) var(--space-4);
  font-size: var(--text-sm);
}

.btn-md {
  padding: var(--space-3) var(--space-6);
  font-size: var(--text-base);
}

.btn-lg {
  padding: var(--space-4) var(--space-8);
  font-size: var(--text-lg);
}
```

## Benefits of This Approach

### 1. **Speed**

- Pre-built, tested components
- Focus on business logic, not reinventing the wheel
- Faster time to market

### 2. **Accessibility**

- Radix UI and Headless UI are built with accessibility in mind
- ARIA attributes handled automatically
- Keyboard navigation out of the box

### 3. **Customization**

- Unstyled components = full design control
- Apply our design system consistently
- Easy to extract into a separate UI library later

### 4. **Type Safety**

- All libraries have excellent TypeScript support
- Better DX with autocomplete and type checking

### 5. **Future-Proof**

- Well-maintained libraries with active communities
- Easy to migrate to our own UI library later
- Can replace components incrementally

## Migration Path to Custom UI Library

When we're ready to create `@allium/ui`:

1. **Extract wrapper components** to new package
2. **Add Storybook** for component documentation
3. **Write tests** for each component
4. **Publish to npm** for reuse across projects
5. **Gradually replace** library dependencies with custom implementations

## Component Priority List

### Phase 1: Essential Components (Week 1)

- [ ] Button
- [ ] Input
- [ ] Card
- [ ] Dialog/Modal
- [ ] Toast notifications

### Phase 2: Form Components (Week 1-2)

- [ ] Select/Dropdown
- [ ] Checkbox
- [ ] Switch/Toggle
- [ ] Form wrapper with React Hook Form

### Phase 3: Navigation (Week 2)

- [ ] Tabs
- [ ] Dropdown Menu
- [ ] Tooltip

### Phase 4: Data Display (Week 2-3)

- [ ] Data Table (TanStack Table)
- [ ] Badge
- [ ] Accordion
- [ ] Popover

### Phase 5: Advanced (Week 3-4)

- [ ] Code Editor (Monaco)
- [ ] Drag and Drop
- [ ] Date Picker
- [ ] Combobox/Autocomplete

## Resources

- **Radix UI**: https://www.radix-ui.com/
- **Headless UI**: https://headlessui.com/
- **TanStack Table**: https://tanstack.com/table/
- **React Hook Form**: https://react-hook-form.com/
- **Lucide Icons**: https://lucide.dev/
- **Framer Motion**: https://www.framer.com/motion/
- **Monaco Editor**: https://microsoft.github.io/monaco-editor/

## Next Steps

1. **Install all dependencies** (run the complete installation command)
2. **Create wrapper components** starting with Button, Input, Card
3. **Build the layout** (Sidebar, Header, Container)
4. **Implement first page** (Dashboard) using these components
5. **Iterate and refine** the design system as we build
