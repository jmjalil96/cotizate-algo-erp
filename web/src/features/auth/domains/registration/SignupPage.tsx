import React, { useEffect } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { Mail, Lock, ArrowRight, Building2, User, AlertCircle, CheckCircle } from 'lucide-react';
import { useForm } from 'react-hook-form';

import { AuthLayout } from '../../../../shared/components/layouts';
import { Button, Input, Logo, PasswordStrengthIndicator } from '../../../../shared/components/ui';

import { registerSchema, type RegisterInput } from './registration.schema';
import { useRegister } from './useRegister';

interface SignupPageProps {
  onSignup?: (data: RegisterInput) => Promise<void>;
  onNavigateToLogin?: () => void;
}

export function SignupPage({ onSignup, onNavigateToLogin }: SignupPageProps): React.JSX.Element {
  const { register: registerUser, isLoading, error, isSuccess, clearError } = useRegister();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: '',
      password: '',
      firstName: '',
      lastName: '',
      organizationName: '',
    },
  });

  const password = watch('password');
  const emailValue = watch('email');

  // Clear error when user starts typing
  useEffect(() => {
    if (error) {
      clearError();
    }
  }, [emailValue, error, clearError]);

  const onSubmit = async (data: RegisterInput): Promise<void> => {
    try {
      // Call the register function from the hook
      const response = await registerUser(data);

      // Call optional onSignup prop if provided for navigation
      if (response.success && onSignup) {
        await onSignup(data);
      }
    } catch {
      // Error is already handled by the hook and displayed via the error state
    }
  };

  return (
    <AuthLayout
      rightPanelContent={{
        title: 'Gestiona tu Organización',
        subtitle: 'de Seguros',
        description:
          'Todo lo que necesitas para administrar pólizas, clientes y agentes en un solo lugar.',
        stats: [
          { value: '100%', label: 'Personalizable' },
          { value: 'Ilimitados', label: 'Usuarios' },
          { value: '30 días', label: 'Prueba gratis' },
        ],
      }}
    >
      {/* Logo and Header */}
      <div className="text-center mb-8">
        <Logo className="mb-6" />

        <div className="space-y-2">
          <h2 className="text-3xl font-bold text-gray-900">Crea tu cuenta empresarial</h2>
          <p className="text-gray-600 text-lg">Configura tu organización de seguros</p>
        </div>
      </div>

      {/* Success Alert */}
      {isSuccess && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start space-x-3">
          <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-green-800">¡Registro exitoso!</p>
            <p className="text-sm text-green-700 mt-1">
              Revisa tu correo electrónico para el código de verificación.
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

      {/* Signup Form */}
      <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
        {/* Organization Name */}
        <Input
          {...register('organizationName')}
          disabled={isSuccess}
          error={errors.organizationName?.message}
          icon={Building2}
          id="organizationName"
          label="Nombre de la organización"
          placeholder="Ej: Seguros ABC"
          type="text"
        />

        {/* Name Fields */}
        <div className="grid grid-cols-2 gap-4">
          <Input
            {...register('firstName')}
            disabled={isSuccess}
            error={errors.firstName?.message}
            icon={User}
            id="firstName"
            label="Nombre"
            placeholder="Juan"
            type="text"
          />
          <Input
            {...register('lastName')}
            disabled={isSuccess}
            error={errors.lastName?.message}
            icon={User}
            id="lastName"
            label="Apellido"
            placeholder="Pérez"
            type="text"
          />
        </div>

        {/* Email */}
        <Input
          {...register('email')}
          autoComplete="email"
          disabled={isSuccess}
          error={errors.email?.message}
          icon={Mail}
          id="email"
          label="Correo electrónico"
          placeholder="juan@ejemplo.com"
          type="email"
        />

        {/* Password */}
        <div className="space-y-2">
          <Input
            {...register('password')}
            autoComplete="new-password"
            disabled={isSuccess}
            error={errors.password?.message}
            icon={Lock}
            id="password"
            label="Contraseña"
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
          loadingText="Creando tu organización..."
          size="lg"
          type="submit"
        >
          {isSuccess ? 'Registro Completado' : 'Crear Organización'}
        </Button>
      </form>

      {/* Sign In Link */}
      <div className="mt-8 text-center">
        <p className="text-gray-600">
          ¿Ya tienes una cuenta?{' '}
          <button
            className="font-medium hover:underline transition-colors duration-200"
            style={{ color: '#093FB4' }}
            type="button"
            onClick={onNavigateToLogin}
          >
            Inicia sesión
          </button>
        </p>
      </div>
    </AuthLayout>
  );
}
