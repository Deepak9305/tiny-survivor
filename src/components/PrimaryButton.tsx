import type { ButtonHTMLAttributes } from 'react';

interface PrimaryButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'gold' | 'blue' | 'green' | 'ghost' | 'danger';
  wide?: boolean;
}

export function PrimaryButton({ variant = 'gold', wide = false, className = '', children, ...props }: PrimaryButtonProps) {
  return <button className={`primary-button primary-button--${variant} ${wide ? 'primary-button--wide' : ''} ${className}`} {...props}>{children}</button>;
}
