import chalk from 'chalk'

export const logger = {
  success(msg: string): void {
    console.log(chalk.bold.hex('#2F8F6B')('  ✓ ') + chalk.hex('#102F2A')(msg))
  },
  info(msg: string): void {
    console.log(chalk.hex('#64746E')('  ℹ ') + chalk.hex('#102F2A')(msg))
  },
  step(title: string): void {
    console.log('')
    console.log(chalk.bold.hex('#123C35')(`  ${title}`))
  },
  warn(msg: string): void {
    console.log(chalk.bold.hex('#C48A32')('  ⚠ ') + chalk.hex('#854D0E')(msg))
  },
  error(msg: string): void {
    console.log(chalk.bold.hex('#C95A5A')('  ✗ ') + chalk.hex('#991B1B')(msg))
  },
  dim(msg: string): void {
    console.log(chalk.hex('#64746E')(`    ${msg}`))
  }
}
