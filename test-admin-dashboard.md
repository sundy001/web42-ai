# Admin Dashboard Test Guide

## Created Components

### Main Dashboard Files:

- `apps/web/app/admin/layout.tsx` - Admin layout with sidebar
- `apps/web/app/admin/page.tsx` - Main dashboard overview
- `apps/web/app/admin/components/AdminSidebar.tsx` - Navigation sidebar

### Users Section (Full API Integration):

- `apps/web/app/admin/users/page.tsx` - Users listing with pagination
- `apps/web/app/admin/users/[id]/page.tsx` - User detail/edit page
- `apps/web/app/admin/users/new/page.tsx` - Create new user page

### Mock Sections:

- `apps/web/app/admin/projects/page.tsx` - Projects overview (mock data)
- `apps/web/app/admin/settings/page.tsx` - Settings page (mock data)

### UI Components Added:

- `packages/ui/src/table.tsx` - Table components
- `packages/ui/src/label.tsx` - Label component
- `packages/ui/src/select.tsx` - Select dropdown
- `packages/ui/src/form.tsx` - Form components
- `packages/ui/src/sheet.tsx` - Sheet/sidebar component

## Features Implemented

### Users Management:

✅ List users with pagination
✅ Search and filter users
✅ View user details
✅ Edit user information
✅ Soft delete users
✅ Restore deleted users
✅ Create new users
✅ Real-time API integration with Site Director

### Projects (Mock):

✅ Projects overview with stats
✅ Project listing table
✅ Status badges and filters

### Settings (Mock):

✅ Tabbed settings interface
✅ General settings
✅ Notification preferences
✅ Security settings
✅ Database configuration
✅ Toggle switches for boolean settings

## How to Test

1. Start the Site Director API:

   ```bash
   cd apps/siteDirector
   bun dev
   ```

2. Start the Web App:

   ```bash
   cd apps/web
   bun dev
   ```

3. Navigate to: http://localhost:3000/admin

4. Test the Users section:
   - View users list
   - Create a new user
   - Edit user details
   - Delete/restore users

## API Integration

The Users section connects to:

- `GET /api/v1/users` - List users with pagination
- `GET /api/v1/users/:id` - Get user by ID
- `POST /api/v1/users` - Create new user
- `PUT /api/v1/users/:id` - Update user
- `DELETE /api/v1/users/:id` - Soft delete user
- `POST /api/v1/users/:id/restore` - Restore deleted user

All API calls use the Site Director service running on localhost:3002.
