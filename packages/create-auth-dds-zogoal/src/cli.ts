#!/usr/bin/env node

import { Command } from 'commander'
import { runInitCommand } from './commands/initCommand.js'
import { runDoctorCommand } from './commands/doctorCommand.js'

const program = new Command()

program
  .name('create-auth-dds-zogoal')
  .description('One-command developer integration CLI for DDS Auth — by Zogoal')
  .version('0.1.0')

program
  .option('-y, --yes', 'Skip prompts and accept all defaults', false)
  .option('--frontend <framework>', 'Specify frontend framework (react, next, none)')
  .option('--backend <server>', 'Specify backend framework (express, node, none)')
  .option('--dry-run', 'Inspect project and print setup plan without writing files', false)
  .action(async (options) => {
    try {
      await runInitCommand(process.cwd(), options)
    } catch (err: any) {
      console.error('\n  ✗ An unexpected error occurred:', err.message)
      process.exit(1)
    }
  })

program
  .command('doctor')
  .description('Diagnose and verify local DDS Auth setup and environment health')
  .action(async () => {
    try {
      await runDoctorCommand(process.cwd())
    } catch (err: any) {
      console.error('\n  ✗ Diagnostics error:', err.message)
      process.exit(1)
    }
  })

program.parse(process.argv)
