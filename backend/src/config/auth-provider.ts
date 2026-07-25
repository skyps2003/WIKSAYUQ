export interface AuthProvider {
  validateToken(token: string): Promise<any>;
  login(credentials: any): Promise<any>;
  register(data: any): Promise<any>;
  refreshToken(token: string): Promise<any>;
  logout(token: string): Promise<any>;
}

export const getAuthProvider = (providerType: string): AuthProvider => {
  // Aquí instanciaremos LocalAuthProvider o SupabaseAuthProvider basado en el ENV
  if (providerType === 'supabase') {
    // return new SupabaseAuthProvider();
    throw new Error('Supabase Auth no está completamente configurado aún.');
  }
  
  // Por defecto retorna LocalAuthProvider
  // return new LocalAuthProvider();
  return {} as AuthProvider; // Temporal hasta crear las clases
};
