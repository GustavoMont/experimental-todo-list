import { setupDatabase, waitForAllServices } from "./tests/orchestrator";

export default async function setup() {
  console.log("\n🕐 Aguardando todos serviços");
  await waitForAllServices();
  console.log("\n⚙️ Configurando banco de dados");
  await setupDatabase();

  console.log("😎 Feito! Simbuera");
}
