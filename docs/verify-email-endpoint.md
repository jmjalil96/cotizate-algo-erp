# Verify Email Endpoint Documentation

## Primary Endpoint
```
POST /api/v1/auth/verify-email
```

## Request Body

### Schema
```typescript
{
  email: string;  // Required, valid email address
  otp: string;    // Required, exactly 6 digits
}
```

### Validation Rules
- **email**: Must be valid email format, automatically lowercased and trimmed
- **otp**: Must be exactly 6 numeric digits

### Example Request
```json
{
  "email": "user@example.com",
  "otp": "123456"
}
```

## Response Format

### IMPORTANT: Always Returns HTTP 200
For security reasons (anti-enumeration), this endpoint **ALWAYS** returns HTTP status 200, regardless of success or failure.

### Success Response (200 OK)
```json
{
  "success": true,
  "message": "Email verified successfully"
}
```

### Failure Response (200 OK) 
```json
{
  "success": false,
  "message": "Invalid or expired verification code"
}
```

**Note:** The failure message is always generic. The actual reason (wrong code, expired, user not found, already verified, etc.) is never revealed to prevent information leakage.

## Verification Flow

### After Registration
1. User registers account → receives email with 6-digit OTP
2. User navigates to verification page
3. User enters email and OTP code
4. Submit POST request to `/auth/verify-email`
5. Check `success` field in response:
   - `true` → Email verified, user can now login
   - `false` → Show generic error, allow retry

### Attempt Limits
- Maximum 5 attempts per user
- After 5 failed attempts, user is locked out
- Counter resets on successful verification
- No indication given when limit is reached (same generic error)

### OTP Expiry
- OTP codes expire after 10 minutes
- Expired codes return same generic error
- User must request new code via resend endpoint

## Resend Verification Endpoint

### Endpoint
```
POST /api/v1/auth/resend-verification
```

### Request Body
```typescript
{
  email: string;  // Required, valid email address
}
```

### Response Format

#### Success Response (200 OK)
```json
{
  "success": true,
  "message": "Verification code sent. Please check your email.",
  "data": {
    "email": "user@example.com",
    "cooldownSeconds": 60  // Optional, if within cooldown period
  }
}
```

**Important:** Always returns success even if:
- Email doesn't exist (anti-enumeration)
- Email already verified
- Within cooldown period

### Resend Behavior
- Cooldown: 60 seconds between resend requests
- New OTP invalidates all previous OTPs
- If email already verified, sends "already verified" email instead
- If user doesn't exist, returns success anyway (security)

## Security Considerations

### Anti-Enumeration Protection
- **Always returns HTTP 200** status code
- **Generic messages** for all failure scenarios
- **Consistent timing** for all responses
- Cannot determine if:
  - User exists
  - Email already verified
  - OTP is wrong vs expired
  - Attempt limit reached

### Why This Matters for UI
- Don't rely on HTTP status codes for error handling
- Always check the `success` field in response body
- Show generic error messages to users
- Don't reveal specific failure reasons

## UI Implementation Checklist

### Verification Form
- [ ] Email input field
- [ ] OTP input (6 digits)
- [ ] Submit button
- [ ] Loading state during submission
- [ ] Success/error message display

### OTP Input
- [ ] Exactly 6 digits validation
- [ ] Numeric only
- [ ] Auto-focus for better UX
- [ ] Clear button

### Success Handling
- [ ] Show success message
- [ ] Provide "Go to Login" button
- [ ] Clear form
- [ ] Consider auto-redirect to login

### Error Handling
- [ ] Show generic error message
- [ ] Keep form fields populated
- [ ] Show "Resend Code" option
- [ ] Track attempt count locally (optional)

### Resend Code Feature
- [ ] Resend button/link
- [ ] Disable for 60 seconds after use (client-side timer)
- [ ] Show countdown timer
- [ ] Clear previous OTP input after resend

### Important UX Considerations
- [ ] Don't indicate why verification failed
- [ ] Allow multiple attempts (up to 5)
- [ ] Clear messaging about checking email
- [ ] Handle expired codes gracefully

## Complete User Flow

### Standard Flow
1. User completes registration
2. System sends OTP to email
3. User enters email + OTP on verification page
4. Success → Redirect to login
5. Failure → Show error, allow retry or resend

### Resend Flow
1. User clicks "Resend Code"
2. System sends new OTP (if not in cooldown)
3. Previous OTP becomes invalid
4. User enters new OTP
5. Continue with standard flow

### Edge Cases
- **Already Verified**: Returns failure, user should login
- **No Account**: Returns failure (looks same as wrong OTP)
- **Too Many Attempts**: Returns failure (looks same as wrong OTP)
- **Expired OTP**: Returns failure, suggest resend

## TypeScript Interface Definitions

```typescript
// Verify Email Request
interface VerifyEmailRequest {
  email: string;
  otp: string;
}

// Verify Email Response
interface VerifyEmailResponse {
  success: boolean;
  message: string;
}

// Resend Verification Request
interface ResendVerificationRequest {
  email: string;
}

// Resend Verification Response
interface ResendVerificationResponse {
  success: boolean;
  message: string;
  data?: {
    email: string;
    cooldownSeconds?: number;
  };
}
```

## Example Implementation Notes

```typescript
// Always check success field, not HTTP status
const response = await fetch('/api/v1/auth/verify-email', {
  method: 'POST',
  body: JSON.stringify({ email, otp })
});

const data = await response.json();

if (data.success) {
  // Verification successful
  redirectToLogin();
} else {
  // Verification failed (generic error)
  showError('Invalid or expired verification code');
  // Don't reveal actual reason
}
```