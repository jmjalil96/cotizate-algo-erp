/**
 * Registration DTOs
 */

// Request DTO - what the client sends
export interface RegisterRequestDto {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  organizationName: string;
}

// Response DTO - what we send back
export interface RegisterResponseDto {
  success: boolean;
  message: string;
  data: {
    userId: string;
    organizationId: string;
    email: string;
  };
}

/**
 * Email Verification DTOs
 */

// Request DTO - what the client sends
export interface VerifyEmailRequestDto {
  email: string;
  otp: string;
}

// Response DTO - what we send back
export interface VerifyEmailResponseDto {
  success: boolean;
  message: string;
}
