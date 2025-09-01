# Password Reset Endpoints Documentation

## Overview
Two-step password reset flow with OTP verification for enhanced security. All endpoints implement anti-enumeration protection.

## 1. Forgot Password Endpoint

### Endpoint
```
POST /api/v1/auth/forgot-password
```

### Request Body

#### Schema
```typescript
{
  email: string;  // Required, valid email address
}
```

#### Validation Rules
- **email**: Must be valid email format, automatically lowercased and trimmed

#### Example Request
```json
{
  "email": "user@example.com"
}
```

### Response Format

#### IMPORTANT: Always Returns HTTP 200
For security reasons (anti-enumeration), this endpoint **ALWAYS** returns HTTP status 200, regardless of whether the email exists or not.

#### Success Response (200 OK)
```json
{
  "success": true,
  "message": "Password reset code sent. Please check your email.",
  "data": {
    "email": "user@example.com",
    "cooldownSeconds": 60  // Optional, if within cooldown period
  }
}
```

**Note:** Returns success even if:
- Email doesn't exist in system (anti-enumeration)
- User account is inactive/locked
- Within rate limit cooldown period
- Previous reset OTP still valid

### Behavior Details

#### OTP Generation
- 6-digit numeric code
- Valid for 15 minutes (longer than email verification due to email delivery delays)
- New OTP invalidates ALL previous password reset OTPs for that user
- Different from email verification OTPs (separate system)

#### Rate Limiting
- Maximum 3 requests per email per hour
- Maximum 10 requests per IP per hour
- Cooldown: 60 seconds between requests for same email
- Returns success even when rate limited (security)

#### Email Sending
- If user exists: sends password reset OTP
- If user doesn't exist: no email sent (but returns success)
- If account locked: sends "account locked" notification instead
- If within cooldown: no email sent (but returns success with cooldownSeconds)

## 2. Reset Password Endpoint

### Endpoint
```
POST /api/v1/auth/reset-password
```

### Request Body

#### Schema
```typescript
{
  email: string;       // Required, valid email address
  otp: string;        // Required, exactly 6 digits
  newPassword: string; // Required, must meet password policy
}
```

#### Validation Rules
- **email**: Must be valid email format, automatically lowercased and trimmed
- **otp**: Must be exactly 6 numeric digits
- **newPassword**: 
  - Minimum 8 characters
  - At least one uppercase letter (A-Z)
  - At least one lowercase letter (a-z)
  - At least one number (0-9)
  - At least one special character
  - Cannot be same as current password
  - Cannot match last 3 used passwords

#### Example Request
```json
{
  "email": "user@example.com",
  "otp": "123456",
  "newPassword": "MyNewP@ssw0rd!"
}
```

### Response Format

#### IMPORTANT: Always Returns HTTP 200
For security reasons (anti-enumeration), this endpoint **ALWAYS** returns HTTP status 200, regardless of success or failure.

#### Success Response (200 OK)
```json
{
  "success": true,
  "message": "Password reset successfully"
}
```

#### Failure Response (200 OK)
```json
{
  "success": false,
  "message": "Invalid or expired reset code"
}
```

**Note:** The failure message is always generic. The actual reason is never revealed:
- Wrong OTP code
- Expired OTP (after 15 minutes)
- User not found
- Too many attempts
- Password doesn't meet requirements
- Password matches recent password
- Account locked/inactive

### Reset Flow Details

#### Attempt Limits
- Maximum 5 attempts per OTP
- After 5 failed attempts, OTP is permanently invalidated
- Counter resets when new OTP is requested
- No indication given when limit is reached (same generic error)

#### OTP Expiry
- OTP codes expire after 15 minutes
- Expired codes return same generic error
- User must request new code via forgot-password endpoint

#### Password History
- System tracks last 3 passwords
- New password cannot match any of the last 3
- Returns generic error if password was recently used

#### Success Actions
- Password is updated
- All password reset OTPs for user are invalidated
- All active sessions are terminated (force re-login)
- Password change audit log created
- Confirmation email sent to user

## Security Considerations

### Anti-Enumeration Protection
- **Always returns HTTP 200** status code
- **Generic messages** for all failure scenarios
- **Consistent timing** for all responses
- Cannot determine if:
  - User exists
  - OTP is wrong vs expired
  - Attempt limit reached
  - Password was recently used
  - Account is locked

### Additional Security Measures
- **OTP Complexity**: 6 random digits (1 million combinations)
- **Time-based Expiry**: 15 minutes for password reset
- **Attempt Limiting**: 5 attempts max per OTP
- **Rate Limiting**: Prevents brute force attacks
- **Password History**: Prevents password reuse
- **Session Invalidation**: Forces re-authentication after reset
- **Audit Logging**: All password changes are logged
- **Email Notifications**: User notified of password changes

### Why This Matters for UI
- Don't rely on HTTP status codes for error handling
- Always check the `success` field in response body
- Show generic error messages to users
- Don't reveal specific failure reasons
- Implement client-side password strength validation

## UI Implementation Checklist

### Forgot Password Page
- [ ] Email input field
- [ ] Submit button
- [ ] Loading state during submission
- [ ] Success message (always show on 200 response)
- [ ] Link back to login
- [ ] Clear form after submission

### Reset Password Page
- [ ] Email input field (can be pre-filled)
- [ ] OTP input (6 digits)
- [ ] New password field
- [ ] Password strength indicator
- [ ] Show/hide password toggle
- [ ] Submit button
- [ ] Loading state during submission
- [ ] Success/error message display

### OTP Input
- [ ] Exactly 6 digits validation
- [ ] Numeric only
- [ ] Auto-focus for better UX
- [ ] Clear button
- [ ] Paste support

### Password Field
- [ ] Real-time strength indicator
- [ ] Show validation requirements
- [ ] Show/hide toggle
- [ ] Clear messaging about requirements

### Success Handling
- [ ] Show success message
- [ ] Provide "Go to Login" button
- [ ] Clear all form fields
- [ ] Consider auto-redirect to login

### Error Handling
- [ ] Show generic error message
- [ ] Keep form fields populated (except password)
- [ ] Show "Request New Code" option
- [ ] Track attempt count locally (optional)

### Request New Code Feature
- [ ] Link/button to go back to forgot-password
- [ ] Clear messaging about requesting new code
- [ ] Preserve email between pages

### Important UX Considerations
- [ ] Don't indicate why reset failed
- [ ] Allow multiple attempts (up to 5)
- [ ] Clear messaging about checking email
- [ ] Handle expired codes gracefully
- [ ] Password requirements clearly visible
- [ ] Confirm password field (optional but recommended)

## Complete User Flow

### Standard Flow
1. User clicks "Forgot Password" on login page
2. User enters email on forgot-password page
3. System sends OTP to email (if account exists)
4. User receives email with 6-digit code
5. User navigates to reset-password page
6. User enters email, OTP, and new password
7. Success → Password updated, redirect to login
8. Failure → Show error, allow retry or request new code

### Request New Code Flow
1. User's OTP expired or too many attempts
2. User clicks "Request New Code"
3. User redirected to forgot-password page
4. Email pre-filled (if passed via state)
5. Continue with standard flow

### Edge Cases
- **Email Not Found**: Shows success anyway (security)
- **Account Locked**: Shows success, sends different email
- **Rate Limited**: Shows success with cooldown timer
- **Password Too Weak**: Generic error, keep form populated
- **Password Recently Used**: Generic error, suggest different password
- **OTP Expired**: Generic error, suggest requesting new code
- **Too Many Attempts**: Generic error, must request new code

## TypeScript Interface Definitions

```typescript
// Forgot Password Request
interface ForgotPasswordRequest {
  email: string;
}

// Forgot Password Response
interface ForgotPasswordResponse {
  success: boolean;
  message: string;
  data?: {
    email: string;
    cooldownSeconds?: number;
  };
}

// Reset Password Request
interface ResetPasswordRequest {
  email: string;
  otp: string;
  newPassword: string;
}

// Reset Password Response
interface ResetPasswordResponse {
  success: boolean;
  message: string;
}
```

## Example Implementation Notes

### Forgot Password
```typescript
// Always check success field, not HTTP status
const response = await fetch('/api/v1/auth/forgot-password', {
  method: 'POST',
  body: JSON.stringify({ email })
});

const data = await response.json();

// Always show success to user (anti-enumeration)
showSuccessMessage('Check your email for reset instructions');
navigateToResetPassword(email); // Pass email to next page
```

### Reset Password
```typescript
// Always check success field, not HTTP status
const response = await fetch('/api/v1/auth/reset-password', {
  method: 'POST',
  body: JSON.stringify({ email, otp, newPassword })
});

const data = await response.json();

if (data.success) {
  // Password reset successful
  showSuccessMessage('Password updated successfully');
  redirectToLogin();
} else {
  // Reset failed (generic error)
  showError('Invalid or expired reset code');
  // Don't reveal actual reason
}
```

## Password Policy Enforcement

### Client-Side Validation
Implement real-time password validation to improve UX:

```typescript
const passwordPolicy = {
  minLength: 8,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: true,
};

function validatePassword(password: string): string[] {
  const errors: string[] = [];
  
  if (password.length < passwordPolicy.minLength) {
    errors.push('At least 8 characters required');
  }
  if (passwordPolicy.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('At least one uppercase letter required');
  }
  if (passwordPolicy.requireLowercase && !/[a-z]/.test(password)) {
    errors.push('At least one lowercase letter required');
  }
  if (passwordPolicy.requireNumbers && !/\d/.test(password)) {
    errors.push('At least one number required');
  }
  if (passwordPolicy.requireSpecialChars && !/[^\dA-Za-z]/.test(password)) {
    errors.push('At least one special character required');
  }
  
  return errors;
}
```

## Security Best Practices Summary

1. **Never reveal user existence** - Always return success for forgot-password
2. **Use generic error messages** - Don't specify why reset failed
3. **Implement rate limiting** - Prevent brute force attacks
4. **Enforce strong passwords** - Clear requirements and validation
5. **Track password history** - Prevent password reuse
6. **Invalidate sessions** - Force re-login after password change
7. **Audit all changes** - Log password reset attempts and successes
8. **Notify users** - Send email confirmation of password changes
9. **Time-based expiry** - OTPs expire after reasonable time
10. **Attempt limiting** - Prevent OTP guessing attacks