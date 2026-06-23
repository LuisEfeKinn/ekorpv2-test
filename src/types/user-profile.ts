// ----------------------------------------------------------------------

export type IUserProfileRole = {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
};

export type IUserProfile = {
  id: string;
  email: string;
  names: string;
  lastnames: string;
  isActive: boolean;
  tel: string;
  documentId: string;
  biometricIsActive: boolean;
  twoFactorAuthIsActive: boolean;
  avatar: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  hasGoogleLinked: boolean;
  hasMicrosoftLinked: boolean;
  roles: IUserProfileRole[];
};

export type IUserProfileUpdate = Pick<IUserProfile, 'names' | 'lastnames' | 'tel'> & {
  avatar: string;
};
