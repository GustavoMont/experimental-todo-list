import { setupDatabase } from "./tests/orchestrator";

export default async function setup() {
  console.log("\n⚙️  Configurando banco de dados");
  await setupDatabase();

  console.log("😎 Feito! Simbuera");
}
