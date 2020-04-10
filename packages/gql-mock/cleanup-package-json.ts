import packageJson from './package.json'
import { Compiler } from 'webpack'
import path from 'path'
import fs from 'fs'

const cleanup = () => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { devDependencies, scripts, ...rest } = packageJson

  return JSON.stringify({ ...rest, typings: './index.d.ts', main: './index.js' }, undefined, '  ')
}

export class CleanupPackageJsonPlugin {
  apply(compiler: Compiler) {
    compiler.hooks.done.tap('CleanupPackageJsonPlugin', () => {
      const outputPath = path.join(compiler.outputPath, 'package.json')

      fs.writeFileSync(outputPath, cleanup())
    })
  }
}
