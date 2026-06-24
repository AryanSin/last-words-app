import jwt from "jsonwebtoken";

interface TokenPayload extends jwt.JwtPayload {
  id: number;
  email: string;
  name: string;
  password?: string;
  lastLoginAt: Date;
  createdAt: Date;
}

export default TokenPayload;
