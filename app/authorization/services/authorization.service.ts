type UserToAthorize = {
  features: string[];
};

class AuthorizationService {
  can(user: UserToAthorize, feature: string): boolean {
    return user.features.includes(feature);
  }
}

export const authorizationService = new AuthorizationService();
