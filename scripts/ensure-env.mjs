import { existsSync, writeFileSync } from "node:fs";
import { randomBytes } from "node:crypto";

const envPath = ".env";

if (!existsSync(envPath)) {
  const secret = randomBytes(32).toString("hex");
  const env = [
    "# Database",
    'DATABASE_URL="file:./dev.db"',
    "",
    "# NextAuth",
    `NEXTAUTH_SECRET="${secret}"`,
    'NEXTAUTH_URL="http://localhost:3000"',
    ""
  ].join("\n");

  writeFileSync(envPath, env);
  console.log("Created .env with local SQLite and NextAuth settings.");
}
