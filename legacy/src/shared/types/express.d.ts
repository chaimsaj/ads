declare namespace Express {
  interface Request {
    requestId: string;
    user?: {
      sub: string;
      email: string;
      role: string;
      type: 'access' | 'admin_access';
      permissions?: readonly string[];
    };
  }
}
