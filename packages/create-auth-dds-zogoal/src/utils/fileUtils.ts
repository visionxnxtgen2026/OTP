import fs from 'fs'
import path from 'path'

export function safeReadJson(filePath: string): any | null {
  try {
    if (!fs.existsSync(filePath)) return null
    const raw = fs.readFileSync(filePath, 'utf-8')
    return JSON.parse(raw)
  } catch {
    return null
  }
}

export function ensureDir(dirPath: string): void {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true })
  }
}

export function safeWriteFile(filePath: string, content: string, overwrite = false): boolean {
  if (fs.existsSync(filePath) && !overwrite) {
    return false
  }
  ensureDir(path.dirname(filePath))
  fs.writeFileSync(filePath, content, 'utf-8')
  return true
}

export function appendToEnvFile(envPath: string, key: string, defaultValue: string): void {
  ensureDir(path.dirname(envPath))
  let content = ''
  if (fs.existsSync(envPath)) {
    content = fs.readFileSync(envPath, 'utf-8')
    if (new RegExp(`^${key}=`, 'm').test(content)) {
      return // Key already exists, don't overwrite
    }
  }

  const newLine = content.length > 0 && !content.endsWith('\n') ? '\n' : ''
  fs.appendFileSync(envPath, `${newLine}${key}=${defaultValue}\n`, 'utf-8')
}

export function ensureGitIgnoreHasEnv(rootDir: string): boolean {
  const gitIgnorePath = path.join(rootDir, '.gitignore')
  let content = ''
  if (fs.existsSync(gitIgnorePath)) {
    content = fs.readFileSync(gitIgnorePath, 'utf-8')
    if (/\.env/m.test(content)) {
      return true
    }
  }

  const newLine = content.length > 0 && !content.endsWith('\n') ? '\n' : ''
  fs.appendFileSync(gitIgnorePath, `${newLine}# Environment variables\n.env\n.env.*\n*.env\n!.env.example\n`, 'utf-8')
  return true
}
