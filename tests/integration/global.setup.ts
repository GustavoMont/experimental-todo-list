import { waitForAllServices } from "../orchestrator";

export default async function setup() {
  console.log("\n🕐 Aguardando todos serviços");
  await waitForAllServices();
  console.log("😎 Feito! Simbuera");
}
