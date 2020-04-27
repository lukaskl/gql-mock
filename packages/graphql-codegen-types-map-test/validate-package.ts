/**
 * Because we are using a build system (webpack), then we are packing
 * whole package into `dist` folder which eventually will be published to npm
 * it is possible to introduce errors just in this process, e.g.:
 *  - bundle not exporting functions
 *  - bundle not resolving path names
 *  - misconfigured package.json
 * (note: all of mentioned issues indeed ocurred during the development of this project)
 *
 * So general goal of this file is to ensure that:
 *  - we are able to import functions which live deeper than the root folder
 *  - we are able to import TypeScript types
 *
 * simply importing random elements from the package and validating that they are truthy
 * should be enough to capture these kind of errors in the future.
 */
import {
  plugin,
  OperationsParser,
  PrinterConfig,
  OperationsMapPrinter,
  AllConfigOptions,
} from '@graphql-mock/codegen-types-map/dist'

const validatePackageImports = () => {
  const imports = { plugin, OperationsParser, PrinterConfig, OperationsMapPrinter }

  Object.entries(imports).map(([key, value]) => {
    const type = typeof value

    if (!value || type !== 'function') {
      throw new Error(
        `'import { ${key} } from 'graphql-codegen-types-map'' should return a function, but '${type}' was received`
      )
    }
  })
}

type ConfigKey = AllConfigOptions['importedTypesAlias']

validatePackageImports()
