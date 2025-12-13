import { DatabaseCommand } from "infra/database/database-commands";
console.log("🤓☝️  Criando banco de dados de Teste");

await DatabaseCommand.createDatabase("test_db");

console.log("🤙 Banco de teste criado");
