export interface JwtPayload {
  user: string;
  walletAddress: string;
  hasMessengerAccess: boolean;
}
