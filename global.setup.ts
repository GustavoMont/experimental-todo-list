import { setupDatabase } from "./tests/orchestrator";

export default async function setup() {
  console.log("\n⚙️\tConfigurando banco de dados");
  await setupDatabase();

  console.log("😎 Feito! Simbuera");
}
