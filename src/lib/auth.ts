export interface GoogleUser {
  id: string;
  email: string;
  name: string;
  picture: string;
}

export const initAuth = (
  onAuthSuccess: (user: any, token: string) => void,
  onAuthFailure: () => void
) => {
  let isUnsubscribed = false;

  const checkAuth = async () => {
    try {
      const [userRes, tokenRes] = await Promise.all([
        fetch('/oauth/google/userinfo'),
        fetch('/oauth/google/token')
      ]);

      if (userRes.ok && tokenRes.ok) {
        const user = await userRes.json();
        const tokenData = await tokenRes.json();
        if (!isUnsubscribed) {
          // Adapt to Firebase User shape for backward compatibility
          onAuthSuccess({
            uid: user.id,
            displayName: user.name,
            email: user.email,
            photoURL: user.picture
          }, tokenData.accessToken);
        }
      } else {
        if (!isUnsubscribed) onAuthFailure();
      }
    } catch (error) {
      console.error('Auth check error:', error);
      if (!isUnsubscribed) onAuthFailure();
    }
  };

  checkAuth();

  return () => {
    isUnsubscribed = true;
  };
};

export const googleSignIn = () => {
  window.location.href = `/oauth/google/login?redirect_uri=${encodeURIComponent(window.location.origin)}`;
};

export const getAccessToken = async (): Promise<string | null> => {
  try {
    const res = await fetch('/oauth/google/token');
    if (!res.ok) return null;
    const data = await res.json();
    return data.accessToken;
  } catch (error) {
    return null;
  }
};

export const logout = async () => {
  try {
    await fetch('/oauth/google/logout', { method: 'POST' });
    window.location.reload();
  } catch (error) {
    console.error('Logout error:', error);
  }
};
