import React, { useEffect } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { Mail, Lock, ArrowRight, Info, AlertCircle } from 'lucide-react';
import { useForm } from 'react-hook-form';

import { AuthLayout } from '../../../../shared/components/layouts';
import { Button, Input, Logo, OTPInput } from '../../../../shared/components/ui';

import { loginSchema, type LoginInput } from './session.schema';
import { useLogin } from './useLogin';

interface LoginPageProps {
  onLogin?: (data: LoginInput) => Promise<void>;
  onNavigateToSignup?: () => void;
  onNavigateToForgotPassword?: () => void;
}

export function LoginPage({
  onLogin,
  onNavigateToSignup,
  onNavigateToForgotPassword,
}: LoginPageProps): React.JSX.Element {
  const { login, isLoading, error, requiresOtp, clearError } = useLogin();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      otp: undefined,
    },
  });

  const otpValue = watch('otp');
  const emailValue = watch('email');
  const passwordValue = watch('password');

  // Clear error when user starts typing
  useEffect(() => {
    if (error) {
      clearError();
    }
  }, [otpValue, error, clearError]);

  // Clear OTP field when email or password changes (new login attempt)
  useEffect(() => {
    setValue('otp', undefined);
  }, [emailValue, passwordValue, setValue]);

  const onSubmit = async (data: LoginInput): Promise<void> => {
    try {
      // Call the login function from the hook
      const response = await login(data);

      if (response.success) {
        // Login successful - log user data for now (no state management yet)
        console.info('Login successful!', response.data);

        // Call optional onLogin prop if provided
        if (onLogin) {
          await onLogin(data);
        }
      }
      // If OTP is required, the form stays open and requiresOtp will be true
      // The user will see the OTP field and can enter the code
    } catch (error) {
      // Error is already handled by the hook and displayed via the error state
      console.error('Login error:', error);
    }
  };

  const handleOTPChange = (value: string): void => {
    setValue('otp', value, { shouldValidate: true });
  };

  return (
    <AuthLayout>
      {/* Logo and Header */}
      <div className="text-center mb-12">
        <Logo className="mb-8" />

        <div className="space-y-2">
          <h2 className="text-3xl font-bold text-gray-900">Bienvenido de vuelta</h2>
          <p className="text-gray-600 text-lg">Inicia sesión en tu cuenta</p>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-3">
          <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Login Form */}
      <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
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

        {/* Password Field */}
        <Input
          {...register('password')}
          autoComplete="current-password"
          error={errors.password?.message}
          icon={Lock}
          id="password"
          label="Contraseña"
          placeholder="Ingresa tu contraseña"
          type="password"
        />

        {/* Forgot Password Link */}
        <div className="flex items-center justify-end">
          <button
            className="text-sm font-medium hover:underline transition-colors duration-200"
            style={{ color: '#093FB4' }}
            type="button"
            onClick={onNavigateToForgotPassword}
          >
            ¿Olvidaste tu contraseña?
          </button>
        </div>

        {/* OTP Section - Shows when API requires it */}
        {requiresOtp && (
          <div className="space-y-4 transition-all duration-300 ease-in-out">
            {/* Info Message */}
            <div className="flex items-start space-x-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <Info className="h-5 w-5 text-[#093FB4] mt-0.5 flex-shrink-0" />
              <p className="text-sm text-gray-700">
                Ingresa el código de 6 dígitos enviado a tu correo electrónico
              </p>
            </div>

            {/* OTP Input */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 text-center">
                Código de verificación
              </label>
              <OTPInput
                disabled={isLoading}
                error={errors.otp?.message}
                value={otpValue}
                onChange={handleOTPChange}
              />
            </div>
          </div>
        )}

        {/* Sign In Button */}
        <Button
          fullWidth
          disabled={isLoading}
          icon={ArrowRight}
          isLoading={isLoading}
          loadingText={requiresOtp ? 'Verificando...' : 'Iniciando sesión...'}
          size="lg"
          type="submit"
        >
          {requiresOtp ? 'Verificar e Iniciar Sesión' : 'Iniciar Sesión'}
        </Button>
      </form>

      {/* Sign Up Link */}
      <div className="mt-8 text-center">
        <p className="text-gray-600">
          ¿No tienes una cuenta?{' '}
          <button
            className="font-medium hover:underline transition-colors duration-200"
            style={{ color: '#093FB4' }}
            type="button"
            onClick={onNavigateToSignup}
          >
            Regístrate
          </button>
        </p>
      </div>
    </AuthLayout>
  );
}
