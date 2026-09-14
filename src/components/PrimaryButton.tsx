import type { ButtonHTMLAttributes } from 'react';
import { audioService } from '../services/audioService';

interface PrimaryButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'gold' | 'blue' | 'green' | 'ghost' | 'danger';
  wide?: boolean;
}

export function PrimaryButton({ variant = 'gold', wide = false, className = '', children, ...props }: PrimaryButtonProps) {
  const { onClick, disabled, ...buttonProps } = props;
  return <button className={`primary-button primary-button--${variant} ${wide ? 'primary-button--wide' : ''} ${className}`} disabled={disabled} {...buttonProps} onClick={(event) => { if (!disabled) audioService.playUISound(variant === 'ghost' ? 'back' : 'confirm'); onClick?.(event); }}>{children}</button>;
}
