import React from 'react';
import { UserProfile } from './UserProfile';
import { GoogleDriveManager } from './GoogleDriveManager';

export const SyncTab: React.FC<{ lang: 'bn' | 'en' }> = ({ lang }) => {
  return (
    <div className="w-full max-w-4xl mx-auto space-y-12 py-6">
      <UserProfile lang={lang} />
      <div className="h-px bg-white/10 mx-auto w-1/2" />
      <GoogleDriveManager lang={lang} />
    </div>
  );
};
