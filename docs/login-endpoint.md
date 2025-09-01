# Login Endpoint Documentation

## Endpoint
```
POST /api/v1/auth/login
```

## Request Body

### Schema
```typescript
{
  email: string;       // Required, valid email, max 320 chars
  password: string;    // Required, min 1 char, max 255 chars
  otp?: string;       // Optional, exactly 6 digits (required after 5 failed attempts)
  deviceName?: string; // Optional, max 100 chars (auto-detected if not provided)
}
```

### Validation Rules
- **email**: Must be valid email format, automatically lowercased and trimmed
- **password**: Required field, no minimum length validation at endpoint level
- **otp**: When provided, must be exactly 6 numeric digits
- **deviceName**: Optional custom device name, auto-parsed from User-Agent if not provided

### Example Request
```json
{
  "email": "user@example.com",
  "password": "securePassword123",
  "otp": "123456",
  "deviceName": "Chrome on MacOS"
}
```

## Response Formats

### Success Response (200 OK)
```typescript
{
  success: true;
  message: "Login successful";
  data: {
    userId: string;
    email: string;
    organizationId: string;
    firstName: string;
    lastName: string;
    role: {
      id: string;
      name: string;
      description: string;
    };
    permissions: Array<{
      resource: string;
      action: string;
      scope: string;
    }>;
  }
}
```

### OTP Required Response (200 OK)
```typescript
{
  success: false;
  message: "Additional verification required";
  requiresOtp: true;
}
```
**Note:** When this response is received, an OTP code is sent to the user's email. The client should prompt for OTP input and retry the login with the OTP included.

## Error Responses

### Invalid Credentials (401)
```json
{
  "success": false,
  "message": "Invalid email or password",
  "error": "INVALID_CREDENTIALS"
}
```

### Email Not Verified (403)
```json
{
  "success": false,
  "message": "Please verify your email to continue",
  "error": "EMAIL_NOT_VERIFIED"
}
```

### Account Inactive (403)
```json
{
  "success": false,
  "message": "Account access restricted",
  "error": "ACCOUNT_INACTIVE"
}
```

### Invalid OTP (401)
```json
{
  "success": false,
  "message": "Invalid or expired verification code",
  "error": "INVALID_OTP"
}
```

### Server Error (500)
```json
{
  "success": false,
  "message": "Unable to process login request",
  "error": "LOGIN_FAILED"
}
```

## Authentication Flow

### Standard Login Flow
1. User submits email and password
2. Server validates credentials
3. If successful, server returns user data and sets HTTP-only cookies
4. Client stores user data in state/context

### OTP Verification Flow
1. After 5 failed login attempts, OTP is required for that account
2. First login attempt without OTP returns `requiresOtp: true`
3. Server sends 6-digit OTP to user's email (valid for 10 minutes)
4. User submits login request again with email, password, AND otp
5. Server validates all three fields
6. If successful, proceeds with standard success flow

### Cookie Management
The server automatically sets two HTTP-only cookies on successful login:

#### Access Token Cookie
- Name: `access_token`
- Duration: 15 minutes
- Properties: httpOnly, secure (in production), sameSite: lax
- Path: `/`

#### Refresh Token Cookie  
- Name: `refresh_token`
- Duration: 30 days
- Properties: httpOnly, secure (in production), sameSite: lax
- Path: `/api/v1/auth/refresh` (only sent to refresh endpoint)

**Important:** Cookies are managed automatically by the browser. The client does NOT need to handle tokens manually.

## Security Considerations

### Rate Limiting
- After 5 failed password attempts, OTP verification becomes mandatory
- OTP codes expire after 10 minutes
- Maximum 5 OTP attempts allowed
- 60-second cooldown between OTP resend requests

### Login Security Checks (in order)
1. User exists validation (with timing-safe password check if not)
2. User account is active
3. Organization is active
4. Password is correct
5. Email is verified
6. OTP validation (if required)

### Best Practices for UI
1. **Never store passwords** in local storage or session storage
2. **Clear form data** after submission
3. **Show generic error messages** for security (don't reveal if email exists)
4. **Implement exponential backoff** for failed attempts
5. **Handle OTP flow gracefully** with clear user instructions
6. **Redirect to email verification** if EMAIL_NOT_VERIFIED error

## UI Implementation Checklist

### Login Form
- [ ] Email input with validation
- [ ] Password input with secure type
- [ ] Optional device name input
- [ ] OTP input field (shown conditionally)
- [ ] Loading state during submission
- [ ] Error message display

### OTP Handling
- [ ] Detect `requiresOtp: true` response
- [ ] Show OTP input field
- [ ] Display countdown timer (10 minutes)
- [ ] Resend OTP option (after 60 seconds)
- [ ] Clear messaging about email delivery

### Success Handling
- [ ] Store user data in global state/context
- [ ] Redirect to dashboard/home
- [ ] Update navigation with user info
- [ ] Handle role-based access

### Error Handling
- [ ] Map error codes to user-friendly messages
- [ ] Special handling for EMAIL_NOT_VERIFIED
- [ ] Retry mechanism for network errors
- [ ] Clear previous errors on new attempt

## TypeScript Interface Definitions

```typescript
interface LoginRequest {
  email: string;
  password: string;
  otp?: string;
  deviceName?: string;
}

interface LoginSuccessResponse {
  success: true;
  message: string;
  data: {
    userId: string;
    email: string;
    organizationId: string;
    firstName: string;
    lastName: string;
    role: {
      id: string;
      name: string;
      description: string;
    };
    permissions: Permission[];
  };
}

interface Permission {
  resource: string;
  action: string;
  scope: string;
}

interface OtpRequiredResponse {
  success: false;
  message: string;
  requiresOtp: true;
}

interface ErrorResponse {
  success: false;
  message: string;
  error: string;
}

type LoginResponse = LoginSuccessResponse | OtpRequiredResponse | ErrorResponse;
```