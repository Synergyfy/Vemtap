import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const PASSWORD_REQUIREMENTS = [
  { label: 'At least 8 characters', regex: /.{8,}/ },
  { label: 'At least one uppercase letter', regex: /[A-Z]/ },
  { label: 'At least one lowercase letter', regex: /[a-z]/ },
  { label: 'At least one number', regex: /[0-9]/ },
  { label: 'At least one special symbol', regex: /[!@#$%^&*(),.?":{}|<>]/ },
];

export const checkRequirement = (password: string, regex: RegExp) => regex.test(password);

export const calculateStrength = (password: string) => {
  const metCount = PASSWORD_REQUIREMENTS.filter(req => checkRequirement(password, req.regex)).length;
  const percentage = (metCount / PASSWORD_REQUIREMENTS.length) * 100;
  let color = 'bg-red-500';
  let label = 'Weak';

  if (percentage > 40 && percentage <= 60) {
      color = 'bg-yellow-500';
      label = 'Medium';
  } else if (percentage > 60 && percentage <= 80) {
      color = 'bg-blue-500';
      label = 'Strong';
  } else if (percentage > 80) {
      color = 'bg-green-500';
      label = 'Very Strong';
  }

  return { percentage, color, label };
};

export const suggestPassword = () => {
  const charset = {
      upper: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
      lower: 'abcdefghijklmnopqrstuvwxyz',
      number: '0123456789',
      special: '!@#$%^&*()_+-=[]{}|;:,.<>?'
  };
  
  let password = '';
  // Ensure at least one of each
  password += charset.upper[Math.floor(Math.random() * charset.upper.length)];
  password += charset.lower[Math.floor(Math.random() * charset.lower.length)];
  password += charset.number[Math.floor(Math.random() * charset.number.length)];
  password += charset.special[Math.floor(Math.random() * charset.special.length)];
  
  // Add more random characters to reach 12
  const allChars = Object.values(charset).join('');
  for (let i = 4; i < 12; i++) {
      password += allChars[Math.floor(Math.random() * allChars.length)];
  }
  
  // Shuffle the password
  return password.split('').sort(() => 0.5 - Math.random()).join('');
};

