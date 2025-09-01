import React, { useEffect, useRef } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { Mail, Lock, ArrowRight, CheckCircle, RefreshCw, AlertCircle, Info } from 'lucide-react';
import { useForm } from 'react-hook-form';

import { AuthLayout } from '../../../../shared/components/layouts';
import {
  Button,
  Input,
  Logo,
  OTPInput,
  PasswordStrengthIndicator,
} from '../../../../shared/components/ui';

import { resetPasswordSchema, type ResetPasswordInput } from './password-recovery.schema';
import { useResetPassword } from './useResetPassword';

interface ResetPasswordPageProps {
  onSubmit?: (data: ResetPasswordInput) => Promise<void>;
  onRequestNewCode?: () => void;
  onBackToLogin?: () => void;
  defaultEmail?: string;
}

export function ResetPasswordPage({
  onSubmit,
  onRequestNewCode,
  onBackToLogin,
  defaultEmail = '',
}: ResetPasswordPageProps): React.JSX.Element {
  // Hook for API call
  const { resetPassword, isLoading, error, isSuccess, attemptCount, clearError } =
    useResetPassword();

  const otpRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      email: defaultEmail ?? '', // Can be pre-filled from forgot password flow
      otp: '',
      newPassword: '',
    },
  });

  const otpValue = watch('otp');
  const password = watch('newPassword');
  const emailValue = watch('email');

  // Auto-focus OTP input on mount
  useEffect(() => {
    otpRef.current?.focus();
  }, []);

  // Clear errors when user starts typing
  useEffect(() => {
    if (error) {
      clearError();
    }
  }, [otpValue, password, emailValue, error, clearError]);

  const onFormSubmit = async (data: ResetPasswordInput): Promise<void> => {
    try {
      // Call the reset password function from the hook
      const response = await resetPassword(data);

      // Call optional onSubmit prop if provided and successful
      if (response.success && onSubmit) {
        await onSubmit(data);
      }
    } catch {
      // Error is already handled by the hook and displayed via the error state
      // Don't log sensitive data
    }
  };

  const handleOTPChange = (value: string): void => {
    setValue('otp', value, { shouldValidate: true });
  };

  if (isSuccess) {
    return (
      <AuthLayout
        rightPanelContent={{
          title: 'Contraseña',
          subtitle: 'Actualizada',
          description: 'Tu contraseña ha sido actualizada exitosamente.',
          stats: [
            { value: '✓', label: 'Contraseña nueva' },
            { value: '🔒', label: 'Cuenta segura' },
            { value: '✓', label: 'Listo para usar' },
          ],
        }}
      >
        <div className="text-center">
          <Logo className="mb-8" />
          <CheckCircle className="h-20 w-20 text-green-500 mx-auto mb-6" />
          <h2 className="text-3xl font-bold text-gray-900 mb-4">¡Contraseña actualizada!</h2>
          <p className="text-gray-600 mb-8">
            Tu contraseña ha sido cambiada exitosamente. Ya puedes iniciar sesión con tu nueva
            contraseña.
          </p>
          <Button fullWidth icon={ArrowRight} size="lg" variant="primary" onClick={onBackToLogin}>
            Ir a Iniciar Sesión
          </Button>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      rightPanelContent={{
        title: 'Nueva',
        subtitle: 'Contraseña',
        description: 'Crea una contraseña segura para proteger tu cuenta.',
        stats: [
          { value: '8+', label: 'Caracteres' },
          { value: 'A-Z', label: 'Mayúsculas' },
          { value: '!@#', label: 'Especiales' },
        ],
      }}
    >
      {/* Logo and Header */}
      <div className="text-center mb-8">
        <Logo className="mb-6" />

        <div className="space-y-2">
          <h2 className="text-3xl font-bold text-gray-900">Restablecer contraseña</h2>
          <p className="text-gray-600 text-lg">Ingresa el código y tu nueva contraseña</p>
        </div>
      </div>

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

      {/* Reset Password Form */}
      <form className="space-y-5" onSubmit={handleSubmit(onFormSubmit)}>
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
            disabled={isLoading || isSuccess}
            error={errors.otp?.message}
            value={otpValue}
            onChange={handleOTPChange}
          />
        </div>

        {/* New Password Field */}
        <div className="space-y-2">
          <Input
            {...register('newPassword')}
            autoComplete="new-password"
            disabled={isLoading || isSuccess}
            error={errors.newPassword?.message}
            icon={Lock}
            id="newPassword"
            label="Nueva contraseña"
            placeholder="Mínimo 8 caracteres"
            type="password"
          />
          {password && !isSuccess && <PasswordStrengthIndicator password={password} />}
        </div>

        {/* Submit Button */}
        <Button
          fullWidth
          disabled={isLoading ?? isSuccess}
          icon={ArrowRight}
          isLoading={isLoading}
          loadingText="Cambiando contraseña..."
          size="lg"
          type="submit"
        >
          Cambiar Contraseña
        </Button>
      </form>

      {/* Request New Code Link */}
      <div className="mt-8 text-center">
        <p className="text-gray-600 mb-2">¿Código expirado o incorrecto?</p>
        <button
          className="inline-flex items-center text-sm font-medium hover:underline transition-colors duration-200"
          style={{ color: '#093FB4' }}
          type="button"
          onClick={onRequestNewCode}
        >
          <RefreshCw className="h-4 w-4 mr-1" />
          Solicitar nuevo código
        </button>
        <p className="text-xs text-gray-500 mt-2">Serás redirigido a la página de recuperación</p>
      </div>
    </AuthLayout>
  );
}
