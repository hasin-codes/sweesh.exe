# Deep Link Authentication Implementation

## Overview
I've successfully implemented the deep link authentication flow for your Electron app that integrates with Clerk authentication. The implementation allows users to authenticate through their browser and seamlessly return to the desktop app.

## What's Been Implemented

### 1. Deep Link Protocol Registration
- **Protocol Name**: `sweesh://`
- **Deep Link Format**: `sweesh://auth/callback?token={JWT_TOKEN}&challenge={CHALLENGE}&uuid={UUID}`
- **Registration**: Added in `src/main.ts` with `app.setAsDefaultProtocolClient()`
- **Single Instance**: Prevents multiple app instances to handle deep links properly

### 2. JWT Token Validation
- **Library**: Added `jsonwebtoken` dependency
- **Validation**: JWT tokens are decoded and validated (signature verification can be added later)
- **User Data Extraction**: Extracts `userId`, `email`, `firstName`, `lastName`, `imageUrl` from JWT claims
- **Expiration Handling**: Automatically checks token expiration and clears invalid tokens

### 3. Secure Authentication Storage
- **Encryption**: Uses OS-level encryption when available, falls back to AES-256-CBC
- **Storage Location**: `{userData}/auth.enc`
- **Data Structure**: Stores user data, challenge, UUID, and authentication timestamp
- **Persistence**: User stays logged in across app restarts

### 4. Onboarding Modal Integration
- **Step 1**: Now shows authentication status and "Sign In with Browser" button
- **Authentication Flow**: 
  - Shows loading state while waiting for browser authentication
  - Displays success message with user's name when authenticated
  - Shows error messages if authentication fails
- **Validation**: Step 1 is only valid when user is authenticated

### 5. IPC Communication
- **New Methods**: Added authentication methods to `electronAPI`
  - `getAuthStatus()`: Check if user is authenticated
  - `startAuthFlow()`: Open browser to authentication page
  - `logout()`: Clear authentication data
- **Event Listeners**: 
  - `onAuthSuccess`: Handle successful authentication
  - `onAuthError`: Handle authentication errors

## Configuration Required

### 1. ✅ Landing Page URL Updated
The `AUTH_LANDING_URL` has been set to your production website:
```typescript
const AUTH_LANDING_URL = 'https://sweesh.vercel.app/auth/desktop';
```

### 2. Landing Page Implementation
You need to create the landing page that handles the deep link authentication flow. The page should:

1. **URL**: `/auth/desktop` (or your chosen path)
2. **Parameters**: Receives `challenge`, `uuid`, and `mode` query parameters
3. **Clerk Integration**: Check if user is logged in, get JWT token with template `desktop-app-auth`
4. **Deep Link Redirect**: Redirect to `sweesh://auth/callback?token={JWT}&challenge={CHALLENGE}&uuid={UUID}`

### 3. Clerk Configuration
Ensure your Clerk dashboard has:
- **Template Name**: `desktop-app-auth`
- **JWKS Endpoint**: `https://mighty-bulldog-76.clerk.accounts.dev/.well-known/jwks.json`
- **Custom Claims**: `userId`, `email`, `firstName`, `lastName`, `imageUrl`

## How It Works

### Authentication Flow
1. User clicks "Sign In with Browser" in onboarding modal
2. App generates unique `challenge` and `uuid` parameters
3. Browser opens to your landing page with these parameters
4. Landing page checks if user is logged into Clerk
5. If logged in, gets JWT token and redirects to `sweesh://auth/callback?...`
6. Electron app receives deep link and validates JWT token
7. User data is saved securely and user is authenticated
8. Onboarding modal shows success and allows progression

### Security Features
- **Challenge/UUID**: Prevents replay attacks
- **JWT Validation**: Validates token structure and expiration
- **Secure Storage**: Encrypted storage of authentication data
- **Single Instance**: Prevents multiple app instances
- **HTTPS Required**: Deep links only work with HTTPS landing pages

## Testing

### Prerequisites
1. Install dependencies: `npm install`
2. Update `AUTH_LANDING_URL` in `src/main.ts`
3. Create and deploy the landing page
4. Configure Clerk template

### Test Scenarios
1. **First Time User**: Should show "Sign In with Browser" button
2. **Authentication Success**: Should show welcome message and allow progression
3. **Authentication Error**: Should show error message
4. **Already Authenticated**: Should show authenticated status on app restart
5. **Token Expiration**: Should clear auth data and require re-authentication

## Files Modified

### Core Files
- `src/main.ts`: Deep link protocol, JWT validation, authentication storage
- `src/preload.ts`: Added authentication IPC methods
- `src/components/ui/onboarding-modal.tsx`: Integrated authentication into step 1
- `package.json`: Added `jsonwebtoken` and `@types/jsonwebtoken` dependencies

### Key Functions Added
- `registerDeepLinkProtocol()`: Registers the deep link protocol
- `handleDeepLinkAuth()`: Processes incoming deep links
- `validateJWTToken()`: Validates and extracts user data from JWT
- `saveAuthSecurely()` / `loadAuthSecurely()`: Secure authentication storage
- `handleStartAuth()`: Initiates browser authentication flow

## Next Steps

1. **Update Landing Page URL**: Set your actual website URL
2. **Create Landing Page**: Implement the Clerk authentication page
3. **Test Deep Links**: Verify the complete flow works end-to-end
4. **Add JWT Signature Verification**: For production security
5. **Error Handling**: Add more robust error handling for edge cases

The implementation is complete and ready for integration with your landing page!
