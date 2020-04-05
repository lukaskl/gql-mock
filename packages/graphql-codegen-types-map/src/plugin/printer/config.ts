import { validateTemplate } from './expandTemplate'
import merge from 'lodash.merge'
import { pickKeys, KeysObj } from '~/utils'

export interface TemplatesConfig {
  operationTypeTemplate: string
  variablesTypeTemplate: string
  operationKindTemplate: string
  typeUsagesTemplate: string
}

export interface TypesImportConfig {
  importTypesFrom: string | undefined
  importedTypesAlias: string
}

export interface TypeUsagesConfig extends Pick<TemplatesConfig, 'typeUsagesTemplate'> {
  withTypeUsages: boolean
}

export interface AllConfigOptions extends TemplatesConfig, TypesImportConfig, TypeUsagesConfig {}

export const defaultConfig: AllConfigOptions = {
  operationTypeTemplate: '{OperationName}{OperationKind}',
  variablesTypeTemplate: '{OperationName}{OperationKind}Variables',
  operationKindTemplate: '{operationKind}',
  importedTypesAlias: 'Types',
  importTypesFrom: undefined,
  typeUsagesTemplate: 'TypeUsagesFor{OperationName}{OperationKind}',
  withTypeUsages: true,
}

const templatesConfigKeysObs: KeysObj<keyof TemplatesConfig> = {
  operationKindTemplate: null,
  operationTypeTemplate: null,
  variablesTypeTemplate: null,
  typeUsagesTemplate: null,
}
const typesImportConfigKeysObs: KeysObj<keyof TypesImportConfig> = {
  importTypesFrom: null,
  importedTypesAlias: null,
}
const typeUsagesConfigKeysObs: KeysObj<keyof TypeUsagesConfig> = {
  withTypeUsages: null,
  typeUsagesTemplate: null,
}

export class PrinterConfig {
  private readonly config: AllConfigOptions

  constructor(rawConfig: Partial<AllConfigOptions> = {}) {
    this.config = merge(defaultConfig, rawConfig)
  }

  get allOptions() {
    return this.config
  }

  get templates() {
    return this.pickConfigEntries(templatesConfigKeysObs)
  }
  get importTypes() {
    const config = this.pickConfigEntries(typesImportConfigKeysObs)
    const importRef = config.importTypesFrom ? `${config.importedTypesAlias}.` : ''
    return { ...config, importRef }
  }
  get typeUsages() {
    return this.pickConfigEntries(typeUsagesConfigKeysObs)
  }

  get templateValues() {
    return Object.values(this.templates)
  }

  validateConfig() {
    validateTemplate(...this.templateValues)
  }

  private pickConfigEntries = <T extends keyof AllConfigOptions>(pick: KeysObj<T>) =>
    pickKeys<T, AllConfigOptions>(this.config, pick)
}
