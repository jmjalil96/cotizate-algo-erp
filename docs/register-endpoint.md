# Register Endpoint Documentation

## Endpoint
```
POST /api/v1/auth/register
```

## Request Body

### Schema
```typescript
{
  email: string;           // Required, valid email, max 320 chars
  password: string;        // Required, min 8 chars, complex requirements
  firstName: string;       // Required, min 2 chars, max 50 chars
  lastName: string;        // Required, min 2 chars, max 50 chars  
  organizationName: string; // Required, min 3 chars, max 100 chars
}
```

### Validation Rules

#### Email
- Must be valid email format
- Maximum 320 characters
- Automatically lowercased and trimmed
- Must be unique (but always returns success for security)

#### Password
- Minimum 8 characters
- Must contain at least one uppercase letter (A-Z)
- Must contain at least one lowercase letter (a-z)
- Must contain at least one number (0-9)
- Must contain at least one special character (!@#$%^&* etc.)

#### First Name
- Minimum 2 characters
- Maximum 50 characters
- Only letters, spaces, hyphens, and apostrophes allowed
- Automatically trimmed

#### Last Name
- Minimum 2 characters
- Maximum 50 characters
- Only letters, spaces, hyphens, and apostrophes allowed
- Automatically trimmed

#### Organization Name
- Minimum 3 characters
- Maximum 100 characters
- Automatically trimmed
- Used to generate unique organization slug

### Example Request
```json
{
  "email": "user@example.com",
  "password": "SecureP@ss123",
  "firstName": "John",
  "lastName": "Doe",
  "organizationName": "Acme Insurance Co"
}
```

## Response Format

### Success Response (201 Created)
```typescript
{
  success: true;
  message: "Registration successful. Please check your email for verification code.";
  data: {
    userId: string;
    organizationId: string;
    email: string;
  }
}
```

**Important Security Note:** The endpoint ALWAYS returns a success response, even if the email already exists. This prevents email enumeration attacks. If the email exists:
- Returns HTTP 201 with fake (but consistent) IDs
- Sends an "already registered" email to the address
- Client cannot distinguish between new and existing accounts

## Error Responses

### Validation Error (400)
```json
{
  "success": false,
  "message": "Validation failed",
  "error": "VALIDATION_ERROR",
  "details": [
    {
      "path": "password",
      "message": "Password must contain at least one uppercase letter"
    }
  ]
}
```

### Organization Name Reserved (400)
```json
{
  "success": false,
  "message": "This organization name is reserved",
  "error": "RESERVED_SLUG"
}
```

### Unable to Generate Unique Slug (409)
```json
{
  "success": false,
  "message": "Unable to create a unique organization identifier",
  "error": "ORG_SLUG_EXISTS"
}
```

### Server Error (500)
```json
{
  "success": false,
  "message": "Registration failed. Please try again",
  "error": "REGISTRATION_FAILED"
}
```

## Registration Flow

### Success Flow
1. User fills out registration form
2. Client validates fields locally
3. Submit POST request to `/api/v1/auth/register`
4. Server validates all fields
5. If email doesn't exist:
   - Creates organization with unique slug
   - Creates user account (unverified)
   - Creates user profile
   - Assigns "owner" role
   - Sends verification email with 6-digit OTP
6. Returns success response with IDs
7. Client shows success message
8. User must verify email to login

### Email Already Exists Flow
1. Same steps 1-4 as above
2. Server detects existing email
3. Sends "already registered" email with login/reset links
4. Returns success response with fake (but deterministic) IDs
5. Client shows same success message (indistinguishable)

## Post-Registration

### What Happens Next
- User receives email with 6-digit verification code
- Code expires in 10 minutes
- User must verify email before they can login
- After verification, user can login with credentials

### Email Templates Sent
1. **New Registration**: Verification code email
2. **Existing Email**: Already registered notification with links

## Security Considerations

### Anti-Enumeration Protection
- Always returns HTTP 201 success
- Fake IDs are deterministic (same email = same fake IDs)
- Timing is consistent for both paths
- Different emails sent but same API response

### Organization Slug
- Auto-generated from organization name
- Must be unique across system
- Reserved slugs: 'api', 'app', 'admin', 'dashboard', 'auth', 'settings'
- If slug generation fails after retries, registration fails

### Password Storage
- Passwords are hashed using bcrypt with 12 rounds
- Never stored or logged in plain text
- Cannot be retrieved, only reset

## UI Implementation Checklist

### Registration Form
- [ ] Email input with validation
- [ ] Password input with strength indicator
- [ ] Password requirements displayed
- [ ] First name input
- [ ] Last name input
- [ ] Organization name input
- [ ] Loading state during submission
- [ ] Success message display

### Password Strength Indicator
- [ ] Check minimum length (8)
- [ ] Check for uppercase letter
- [ ] Check for lowercase letter
- [ ] Check for number
- [ ] Check for special character
- [ ] Visual feedback for each requirement

### Success Handling
- [ ] Show success message
- [ ] Inform user to check email
- [ ] Do NOT auto-redirect (they can't login yet)
- [ ] Provide link to resend verification
- [ ] Clear form or disable inputs

### Error Handling
- [ ] Display validation errors per field
- [ ] Show server errors appropriately
- [ ] Handle network errors
- [ ] Retry mechanism

### Important UX Notes
- [ ] Always show same success message (security)
- [ ] Don't indicate if email exists
- [ ] Make password requirements clear upfront
- [ ] Consider inline validation for better UX

## TypeScript Interface Definitions

```typescript
interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  organizationName: string;
}

interface RegisterResponse {
  success: boolean;
  message: string;
  data: {
    userId: string;
    organizationId: string;
    email: string;
  };
}

interface ValidationError {
  success: false;
  message: string;
  error: string;
  details?: Array<{
    path: string;
    message: string;
  }>;
}

type RegisterApiResponse = RegisterResponse | ValidationError;
```