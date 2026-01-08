# Workspace Auto-Recovery System

## Overview
This system ensures that every authenticated user always has a workspace (business) available. It implements multiple layers of self-healing to prevent "No workspace selected" errors.

## Recovery Layers

### Layer 1: AuthContext (Primary Auto-Creation)
**Location:** `src/contexts/AuthContext.tsx`

**When:** On SIGNED_IN or TOKEN_REFRESHED events
**What:**
- Checks if user has any businesses
- If none exist, automatically creates:
  - Business named "متجري"
  - Admin membership
  - Default statuses, country, carrier
  - Sets currentBusinessId in localStorage

**Debug Logs (DEV only):**
- `[AuthContext] Auth state changed: {event}`
- `[AuthContext] Ensuring business for user: {userId}`
- `[AuthContext] User has {count} businesses`
- `[AuthContext] Creating new business...`
- `[AuthContext] Business created: {businessId}`

### Layer 2: BusinessContext (Selection Management)
**Location:** `src/contexts/BusinessContext.tsx`

**When:** On user change or manual refresh
**What:**
- Loads all businesses for current user
- Selects saved business or first available
- Exposes `ensureWorkspace()` for manual recovery

**Debug Logs (DEV only):**
- `[BusinessContext] Loading businesses for user: {userId}`
- `[BusinessContext] Found businesses: {count}`
- `[BusinessContext] Current business set: {name}`

### Layer 3: ProtectedRoute (UI Fallback)
**Location:** `src/components/auth/ProtectedRoute.tsx`

**When:** User authenticated but no currentBusiness
**What:** Shows NoWorkspace component with creation button

### Layer 4: NoWorkspace Component (Manual Recovery)
**Location:** `src/components/common/NoWorkspace.tsx`

**What:**
- Friendly Arabic UI
- "إنشاء وورك سبيس الآن" button
- Calls `ensureWorkspace()` from BusinessContext
- Handles errors with Arabic messages
- Redirects to dashboard on success

## Flow After Email Confirmation

1. User clicks email confirmation link → redirected to `/auth/callback`
2. Supabase processes token → fires SIGNED_IN event
3. AuthContext.onAuthStateChange triggered
4. **ensureBusinessForUser** runs BEFORE setUser:
   - Fetches user businesses
   - Creates if none exist
   - Sets currentBusinessId
5. User state updated → BusinessContext reloads
6. BusinessContext finds business and sets currentBusiness
7. ProtectedRoute allows access to dashboard

## Error Handling

### If Business Creation Fails (Layer 1)
- Error logged to console
- User state still set
- Flow continues to Layer 3

### If No Workspace Found (Layer 3)
- NoWorkspace component shown
- User clicks "إنشاء وورك سبيس الآن"
- Layer 4 attempts creation with full error feedback

### Common Error Messages
- "المستخدم غير مسجل الدخول" - Not authenticated
- "فشل في إنشاء وورك سبيس. يرجى المحاولة مرة أخرى." - Creation failed

## Testing the Recovery System

### Test Case 1: New User Registration
1. Register new account
2. Confirm email
3. **Expected:** Automatically redirected to dashboard with workspace

### Test Case 2: Workspace Deleted
1. Manually delete business_members row
2. Refresh page
3. **Expected:** NoWorkspace UI → Click button → Dashboard

### Test Case 3: localStorage Corruption
1. Clear localStorage
2. Refresh page
3. **Expected:** First business auto-selected

## Database Requirements

All operations require:
- Active Supabase session (RLS enforced)
- Proper RLS policies on:
  - `businesses` (insert, select)
  - `business_members` (insert, select)
  - `statuses`, `countries`, `carriers` (insert)

## Configuration

No configuration needed. System works automatically with:
- Environment variables from `window.__APP_CONFIG__`
- localStorage for currentBusinessId
- Supabase auth state
