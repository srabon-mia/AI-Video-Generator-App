import { createClerkClient, verifyToken } from "@clerk/backend";

const clerk = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY!,
});

export async function getUserId(req: Request): Promise<string | null> {
  const token = req.headers.get("Authorization")?.replace("Bearer ", "");
  console.log("token received:", token ? "yes" : "no");
  if (!token) return null;
  try {
    const payload = await verifyToken(token, {
      secretKey: process.env.CLERK_SECRET_KEY!,
    });
    console.log("userId:", payload.sub);
    return payload.sub;
  } catch (e: any) {
    console.log("verify error:", e.message);
    return null;
  }
}