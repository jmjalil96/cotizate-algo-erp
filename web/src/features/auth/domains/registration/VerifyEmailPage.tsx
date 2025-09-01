import React, { useState, useEffect, useRef } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { Mail, ArrowRight, CheckCircle, AlertCircle, Info } from 'lucide-react';
import { useForm } from 'react-hook-form';

import { AuthLayout } from '../../../../shared/components/layouts';
import { Button, Input, Logo, OTPInput } from '../../../../shared/components/ui';

import { useResendVerification } from './useResendVerification';
import { useVerifyEmail } from './useVerifyEmail';
import { verifyEmailSchema, type VerifyEmailInput } from './verify-email.schema';

interface VerifyEmailPageProps {
  onVerify?: (data: VerifyEmailInput) => Promise<void>;
  onResend?: (email: string) => Promise<void>;
  defaultEmail?: string;
}

export function VerifyEmailPage({
  onVerify,
  onResend,
  defaultEmail = '',
}: VerifyEmailPageProps): React.JSX.Element {
  // Hooks for API calls
  const {
    verifyEmail,
    isLoading: isVerifying,
    error: verifyError,
    isSuccess: isVerified,
    clearError: clearVerifyError,
  } = useVerifyEmail();

  const {
    resendVerification,
    isLoading: isResending,
    error: resendError,
    isSuccess: resendSuccess,
    cooldownSeconds,
    clearError: clearResendError,
  } = useResendVerification();

  // Local state
  const [cooldown, setCooldown] = useState(0);
  const [attemptCount, setAttemptCount] = useState(0); // Optional: client-side attempt tracking (visual only)
  const otpRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<VerifyEmailInput>({
    resolver: zodResolver(verifyEmailSchema),
    defaultValues: {
      email: defaultEmail ?? '', // Can be pre-filled from URL params later
      otp: '',
    },
  });

  const otpValue = watch('otp');
  const emailValue = watch('email');

  // Combine errors from both hooks
  const error = verifyError ?? resendError;

  // Update cooldown when resend response includes cooldownSeconds
  useEffect(() => {
    if (cooldownSeconds) {
      setCooldown(cooldownSeconds);
    }
  }, [cooldownSeconds]);

  // Cooldown timer effect
  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  // Auto-focus OTP input on mount
  useEffect(() => {
    otpRef.current?.focus();
  }, []);

  // Clear errors when user starts typing OTP
  useEffect(() => {
    if (error) {
      clearVerifyError();
      clearResendError();
    }
  }, [otpValue, emailValue, error, clearVerifyError, clearResendError]);

  const onSubmit = async (data: VerifyEmailInput): Promise<void> => {
    try {
      // Call the verify function from the hook
      const response = await verifyEmail(data);

      // Track attempts client-side (optional, visual only)
      if (!response.success) {
        setAttemptCount((prev) => prev + 1);
      }

      // Call optional onVerify prop if provided
      if (response.success && onVerify) {
        await onVerify(data);
      }
    } catch {
      // Error is already handled by the hook and displayed via the error state
      // Don't log sensitive data
    }
  };

  const handleResend = async (): Promise<void> => {
    if (cooldown > 0) return;

    try {
      // Call the resend function from the hook
      const response = await resendVerification(emailValue);

      // Clear OTP field after resend (new OTP invalidates old ones)
      setValue('otp', '');

      // Reset attempt counter on successful resend
      if (response.success) {
        setAttemptCount(0);
        // Start 60 second cooldown if not provided by server
        if (!cooldownSeconds) {
          setCooldown(60);
        }
      }

      // Call optional onResend prop if provided
      if (onResend) {
        await onResend(emailValue);
      }
    } catch {
      // Error is already handled by the hook and displayed via the error state
      // Don't log sensitive data
    }
  };

  const handleOTPChange = (value: string): void => {
    setValue('otp', value, { shouldValidate: true });
  };

  if (isVerified) {
    return (
      <AuthLayout
        rightPanelContent={{
          title: 'Cuenta',
          subtitle: 'Verificada',
          description: 'Tu cuenta ha sido verificada exitosamente. Ya puedes iniciar sesión.',
          stats: [
            { value: '✓', label: 'Email verificado' },
            { value: '✓', label: 'Cuenta activa' },
            { value: '✓', label: 'Listo para usar' },
          ],
        }}
      >
        <div className="text-center">
          <Logo className="mb-8" />
          <CheckCircle className="h-20 w-20 text-green-500 mx-auto mb-6" />
          <h2 className="text-3xl font-bold text-gray-900 mb-4">¡Cuenta verificada!</h2>
          <p className="text-gray-600 mb-8">Tu cuenta ha sido verificada exitosamente.</p>
          <Button fullWidth icon={ArrowRight} size="lg" variant="primary">
            Ir a Iniciar Sesión
          </Button>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      rightPanelContent={{
        title: 'Un paso más',
        subtitle: 'para completar',
        description: 'Verifica tu correo electrónico para acceder a todas las funcionalidades.',
        stats: [
          { value: '🔒', label: 'Seguridad' },
          { value: '✉️', label: 'Verificación' },
          { value: '🚀', label: 'Acceso total' },
        ],
      }}
    >
      {/* Logo and Header */}
      <div className="text-center mb-8">
        <Logo className="mb-6" />

        <div className="space-y-2">
          <h2 className="text-3xl font-bold text-gray-900">Verifica tu cuenta</h2>
          <p className="text-gray-600 text-lg">
            Ingresa el código de 6 dígitos enviado a tu correo
          </p>
        </div>
      </div>

      {/* Success Alert for Resend */}
      {resendSuccess && !error && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start space-x-3">
          <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-green-800">Código enviado</p>
            <p className="text-sm text-green-700 mt-1">
              Revisa tu correo electrónico para el nuevo código de verificación.
            </p>
          </div>
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-3">
          <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Optional: Attempt Warning (client-side only) */}
      {attemptCount >= 3 && attemptCount < 5 && !error && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start space-x-3">
          <Info className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-yellow-800">
            Has usado {attemptCount} de 5 intentos. Después de 5 intentos fallidos, necesitarás
            solicitar un nuevo código.
          </p>
        </div>
      )}

      {/* Verification Form */}
      <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
        {/* Email Field */}
        <Input
          {...register('email')}
          autoComplete="email"
          error={errors.email?.message}
          icon={Mail}
          id="email"
          label="Correo electrónico"
          placeholder="Ingresa tu correo electrónico"
          type="email"
        />

        {/* OTP Input */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 text-center">
            Código de verificación
          </label>
          <OTPInput
            ref={otpRef}
            disabled={isVerifying ?? isVerified}
            error={errors.otp?.message}
            value={otpValue}
            onChange={handleOTPChange}
          />
        </div>

        {/* Submit Button */}
        <Button
          fullWidth
          disabled={isVerifying ?? isVerified}
          icon={ArrowRight}
          isLoading={isVerifying}
          loadingText="Verificando..."
          size="lg"
          type="submit"
        >
          Verificar Cuenta
        </Button>
      </form>

      {/* Resend Code */}
      <div className="mt-8 text-center">
        <p className="text-gray-600 mb-2">¿No recibiste el código?</p>
        {cooldown > 0 ? (
          <p className="text-sm text-gray-500">
            Reenviar código en <span className="font-semibold">{cooldown}s</span>
          </p>
        ) : (
          <button
            className="text-sm font-medium hover:underline transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isResending}
            style={{ color: '#093FB4' }}
            type="button"
            onClick={handleResend}
          >
            {isResending ? 'Enviando...' : 'Reenviar código'}
          </button>
        )}
      </div>
    </AuthLayout>
  );
}
