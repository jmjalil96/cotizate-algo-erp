import React, { useState, useEffect } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { Mail, ArrowRight, CheckCircle, ArrowLeft, AlertCircle } from 'lucide-react';
import { useForm } from 'react-hook-form';

import { AuthLayout } from '../../../../shared/components/layouts';
import { Button, Input, Logo } from '../../../../shared/components/ui';

import { forgotPasswordSchema, type ForgotPasswordInput } from './password-recovery.schema';
import { useForgotPassword } from './useForgotPassword';

interface ForgotPasswordPageProps {
  onSubmit?: (data: ForgotPasswordInput) => Promise<void>;
  onBackToLogin?: () => void;
  onContinueToReset?: () => void;
}

export function ForgotPasswordPage({
  onSubmit,
  onBackToLogin,
  onContinueToReset,
}: ForgotPasswordPageProps): React.JSX.Element {
  // Hook for API call
  const { forgotPassword, isLoading, error, isSuccess, clearError, reset } = useForgotPassword();

  // Local state for display
  const [submittedEmail, setSubmittedEmail] = useState('');

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  });

  const emailValue = watch('email');

  // Clear error when user starts typing
  useEffect(() => {
    if (error) {
      clearError();
    }
  }, [emailValue, error, clearError]);

  const onFormSubmit = async (data: ForgotPasswordInput): Promise<void> => {
    try {
      // Call the forgot password function from the hook
      await forgotPassword(data.email);

      // Store email for display in success screen
      setSubmittedEmail(data.email);

      // Call optional onSubmit prop if provided
      if (onSubmit) {
        await onSubmit(data);
      }
    } catch {
      // Error is already handled by the hook and displayed via the error state
      // Don't log sensitive data
    }
  };

  if (isSuccess) {
    return (
      <AuthLayout
        rightPanelContent={{
          title: 'Código',
          subtitle: 'Enviado',
          description: 'Revisa tu correo electrónico para continuar con el proceso.',
          stats: [
            { value: '✉️', label: 'Email enviado' },
            { value: '6', label: 'Dígitos' },
            { value: '15min', label: 'Validez' },
          ],
        }}
      >
        <div className="text-center">
          <Logo className="mb-8" />
          <CheckCircle className="h-20 w-20 text-green-500 mx-auto mb-6" />
          <h2 className="text-3xl font-bold text-gray-900 mb-4">¡Código enviado!</h2>
          <p className="text-gray-600 mb-2">Hemos enviado un código de verificación a:</p>
          <p className="font-semibold text-gray-900 mb-8">{submittedEmail}</p>
          <Button
            fullWidth
            icon={ArrowRight}
            size="lg"
            variant="primary"
            onClick={onContinueToReset}
          >
            Continuar a Restablecer Contraseña
          </Button>
          <button
            className="mt-4 text-sm text-gray-600 hover:text-gray-900 transition-colors"
            type="button"
            onClick={() => {
              reset();
              setSubmittedEmail('');
            }}
          >
            ¿Email incorrecto? Intenta de nuevo
          </button>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      rightPanelContent={{
        title: 'Recupera tu',
        subtitle: 'Acceso',
        description: 'No te preocupes, te ayudaremos a recuperar el acceso a tu cuenta.',
        stats: [
          { value: '🔐', label: 'Seguro' },
          { value: '⚡', label: 'Rápido' },
          { value: '24/7', label: 'Soporte' },
        ],
      }}
    >
      {/* Logo and Header */}
      <div className="text-center mb-8">
        <Logo className="mb-6" />

        <div className="space-y-2">
          <h2 className="text-3xl font-bold text-gray-900">¿Olvidaste tu contraseña?</h2>
          <p className="text-gray-600 text-lg">Te enviaremos un código de verificación</p>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-3">
          <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Forgot Password Form */}
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

        {/* Submit Button */}
        <Button
          fullWidth
          disabled={isLoading}
          icon={ArrowRight}
          isLoading={isLoading}
          loadingText="Enviando código..."
          size="lg"
          type="submit"
        >
          Enviar Código
        </Button>
      </form>

      {/* Back to Login Link */}
      <div className="mt-8 text-center">
        <p className="text-gray-600 mb-2">¿Recordaste tu contraseña?</p>
        <button
          className="inline-flex items-center text-sm font-medium hover:underline transition-colors duration-200"
          style={{ color: '#093FB4' }}
          type="button"
          onClick={onBackToLogin}
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Volver a Iniciar Sesión
        </button>
      </div>
    </AuthLayout>
  );
}
