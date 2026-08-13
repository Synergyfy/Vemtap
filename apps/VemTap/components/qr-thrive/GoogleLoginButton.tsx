import React from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { authApi } from '../services/api';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { getDashboardPath } from '../utils/auth';

interface GoogleLoginButtonProps {
  onSuccess: (user: any) => void;
  onError?: (error: any) => void;
}

const GoogleLoginButton: React.FC<GoogleLoginButtonProps> = ({ onSuccess, onError }) => {
  const router = useRouter();

  const handleSuccess = async (credentialResponse: any) => {
    try {
      const res = await authApi.googleLogin(credentialResponse.credential);
      onSuccess(res.user);
      toast.success(`Welcome, ${res.user.firstName}!`);
      router.push(getDashboardPath(res.user.role));
    } catch (err: any) {
      const message = err?.response?.data?.message || 'Google authentication failed';
      toast.error(message);
      if (onError) onError(message);
    }
  };

  return (
    <div className="w-full flex justify-center">
      <GoogleLogin
        onSuccess={handleSuccess}
        onError={() => {
          toast.error('Login Failed');
          if (onError) onError('Login Failed');
        }}
        useOneTap={false}
        theme="outline"
        shape="pill"
        width="100%"
      />
    </div>
  );
};

export default GoogleLoginButton;
