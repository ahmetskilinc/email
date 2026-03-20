'use client';

import { authClient, useSession } from '@/lib/auth-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useState } from 'react';
import { toast } from 'sonner';

export default function GeneralSettingsPage() {
  const { data: session, isPending } = useSession();
  const [name, setName] = useState('');
  const [nameLoaded, setNameLoaded] = useState(false);
  const [isSavingName, setIsSavingName] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  if (!nameLoaded && session?.user?.name) {
    setName(session.user.name);
    setNameLoaded(true);
  }

  const handleUpdateName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Name cannot be empty');
      return;
    }

    setIsSavingName(true);
    try {
      await authClient.updateUser({ name: name.trim() });
      toast.success('Name updated');
    } catch {
      toast.error('Failed to update name');
    } finally {
      setIsSavingName(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword.length < 8) {
      toast.error('New password must be at least 8 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setIsChangingPassword(true);
    try {
      const result = await authClient.changePassword({
        currentPassword,
        newPassword,
        revokeOtherSessions: false,
      });

      if (result.error) {
        toast.error(result.error.message ?? 'Failed to change password');
        return;
      }

      toast.success('Password changed');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch {
      toast.error('Failed to change password');
    } finally {
      setIsChangingPassword(false);
    }
  };

  if (isPending) return null;

  return (
    <div className="space-y-10">
      <div>
        <h2 className="text-lg font-semibold">General</h2>
        <p className="text-muted-foreground text-sm">Manage your account details.</p>
      </div>

      <div className="space-y-4">
        <div>
          <h3 className="text-sm font-medium">Email</h3>
          <p className="text-muted-foreground mt-1 text-sm">{session?.user?.email}</p>
        </div>

        <form onSubmit={handleUpdateName} className="space-y-3">
          <div className="space-y-2">
            <label htmlFor="name" className="text-sm font-medium">
              Name
            </label>
            <Input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              required
            />
          </div>
          <Button type="submit" size="sm" disabled={isSavingName}>
            {isSavingName ? 'Saving...' : 'Update Name'}
          </Button>
        </form>
      </div>

      <div className="border-t pt-8">
        <h3 className="text-sm font-medium">Change Password</h3>
        <p className="text-muted-foreground mb-4 text-sm">
          Update the password you use to log in.
        </p>

        <form onSubmit={handleChangePassword} className="space-y-3">
          <div className="space-y-2">
            <label htmlFor="current-password" className="text-sm font-medium">
              Current Password
            </label>
            <Input
              id="current-password"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Your current password"
              required
              autoComplete="current-password"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="new-password" className="text-sm font-medium">
              New Password
            </label>
            <Input
              id="new-password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Min. 8 characters"
              required
              minLength={8}
              autoComplete="new-password"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="confirm-password" className="text-sm font-medium">
              Confirm New Password
            </label>
            <Input
              id="confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter new password"
              required
              minLength={8}
              autoComplete="new-password"
            />
          </div>
          <Button type="submit" size="sm" disabled={isChangingPassword}>
            {isChangingPassword ? 'Changing...' : 'Change Password'}
          </Button>
        </form>
      </div>
    </div>
  );
}
