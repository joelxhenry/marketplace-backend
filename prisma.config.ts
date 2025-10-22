import { defineConfig, env } from "prisma/config";
import "dotenv/config";

type Env = {
  DATABASE_URL: string
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  engine: "classic",
  datasource: {
    url: env<Env>("DATABASE_URL"),
  },
});
