import { DatabaseCommand } from "./infra/database/database-commands";

afterAll(DatabaseCommand.flushDatabase);
