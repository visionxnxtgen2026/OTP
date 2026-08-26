import chalk from 'chalk'

export function printBanner(): void {
  console.log('')
  console.log(chalk.bold.hex('#123C35')('  ╔══════════════════════════════════════════════════════╗'))
  console.log(chalk.bold.hex('#123C35')('  ║') + chalk.bold.hex('#2F8F6B')('  DDS Auth                                            ') + chalk.bold.hex('#123C35')('║'))
  console.log(chalk.bold.hex('#123C35')('  ║') + chalk.italic.hex('#6F9584')('  Secure. Verify. Trust.                              ') + chalk.bold.hex('#123C35')('║'))
  console.log(chalk.bold.hex('#123C35')('  ║') + chalk.hex('#102F2A')('                                                      ') + chalk.bold.hex('#123C35')('║'))
  console.log(chalk.bold.hex('#123C35')('  ║') + chalk.hex('#64746E')('  by ') + chalk.bold.hex('#123C35')('Zogoal                                           ') + chalk.bold.hex('#123C35')('║'))
  console.log(chalk.bold.hex('#123C35')('  ╚══════════════════════════════════════════════════════╝'))
  console.log('')
  console.log(chalk.bold.hex('#102F2A')('  Welcome to DDS Auth Setup.'))
  console.log(chalk.hex('#64746E')('  Inspecting your project architecture...'))
  console.log('')
}
