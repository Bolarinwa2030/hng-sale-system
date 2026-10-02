import { SignJWT, jwtVerify } from "jose";

const secret = new TextEncoder().encode(
  process.env.JWT_SECRET ?? "development-secret-change-me"
);

export type AuthTokenPayload = {
  sub: string;
  email: string;
  roles: string[];
};

export async function signAccessToken(payload: AuthTokenPayload) {
  return new SignJWT({
    sub: payload.sub,
    email: payload.email,
    roles: payload.roles,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret);
}

export async function verifyAccessToken(token: string) {
  const { payload } = await jwtVerify(token, secret);
  return payload as AuthTokenPayload & { iat?: number; exp?: number };
}
