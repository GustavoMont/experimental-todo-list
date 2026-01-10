type UserToAthorize = {
  id?: string;
  features: string[];
};

class AuthorizationService {
  can<T extends { userId: string }>(
    user: UserToAthorize,
    feature: string,
    resource?: T
  ): boolean {
    if (!resource) return user.features.includes(feature);

    return (
      user.id === resource.userId || user.features.includes(`${feature}:others`)
    );
  }
}

export const authorizationService = new AuthorizationService();
