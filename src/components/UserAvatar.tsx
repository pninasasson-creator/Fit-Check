import React, { useState } from 'react';

interface UserAvatarProps {
  avatarUrl?: string | null;
  name?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const UserAvatar: React.FC<UserAvatarProps> = ({
  avatarUrl,
  name,
  size = 'md',
  className = '',
}) => {
  const [imgError, setImgError] = useState(false);

  const sizeClasses = {
    xs: 'w-6 h-6 text-[10px]',
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-16 h-16 text-lg',
    xl: 'w-24 h-24 text-2xl',
  }[size];

  const initial = (name?.[0] || 'F').toUpperCase();

  // If avatar URL is present and has not errored, render the image
  if (avatarUrl && !imgError) {
    return (
      <div className={`relative shrink-0 rounded-full overflow-hidden border border-[#F472B6]/30 bg-[#FFFDFD] shadow-xs ${sizeClasses} ${className}`}>
        <img
          src={avatarUrl}
          alt={name || 'User avatar'}
          onError={() => setImgError(true)}
          className="w-full h-full object-cover"
        />
      </div>
    );
  }

  // Fallback: User's initial on a soft pink circle
  return (
    <div
      className={`relative shrink-0 rounded-full flex items-center justify-center font-bodoni italic font-bold bg-[#FCE7F3] text-[#BE185D] border border-[#F472B6]/40 select-none shadow-xs ${sizeClasses} ${className}`}
      title={name || 'User'}
    >
      <span>{initial}</span>
    </div>
  );
};
