import { Command } from "commander"
const program = new Command()

program.option("--mode <mode>", "work mode", "production")
program.parse()
export default program