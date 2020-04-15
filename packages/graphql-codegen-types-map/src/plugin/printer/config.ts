import {
  validateFieldArgsTemplate,
  validateOperationsTemplate,
  validateTypeAccessorTemplate,
} from './expandTemplate'
import merge from 'lodash.merge'
import { pickKeys, KeysObj } from '~/utils'

export interface OperationsTemplatesConfig {
  operationTypeTemplate: string
  operationDocumentTemplate: string
  variablesTypeTemplate: string
  operationKindTemplate: string
  typeUsagesTemplate: string
}
export interface FieldArgsTemplateConfig {
  fieldArgsTypeTemplate: string
}

export interface TypeAccessorTemplateConfig {
  typeAccessorTypeTemplate: string
}

export type TemplatesConfig = OperationsTemplatesConfig & FieldArgsTemplateConfig & TypeAccessorTemplateConfig

export interface TypesImportConfig {
  importTypesFrom: string | undefined
  importedTypesAlias: string
}

export interface TypeUsagesConfig extends Pick<OperationsTemplatesConfig, 'typeUsagesTemplate'> {
  withTypeUsages: boolean
}

export interface AllConfigOptions extends TemplatesConfig, TypesImportConfig, TypeUsagesConfig {
  withDocumentsMap: boolean
}

export const defaultConfig: AllConfigOptions = {
  operationTypeTemplate: '{OperationName}{OperationKind}',
  variablesTypeTemplate: '{OperationName}{OperationKind}Variables',
  operationDocumentTemplate: '{OperationName}{OperationKind === "Fragment" ? "FragmentDoc" : "Document"}',
  operationKindTemplate: '{operationKind}',
  typeAccessorTypeTemplate: '{typeKind === "scalar" ? `Scalars["{typeName}"]` : TypeName }',
  importedTypesAlias: 'Types',
  importTypesFrom: undefined,
  typeUsagesTemplate: 'TypeUsagesFor{OperationName}{OperationKind}',
  fieldArgsTypeTemplate: '{ParentName}{FieldName}Args',
  withTypeUsages: true,
  withDocumentsMap: true,
}

const operationsTemplatesConfigKeysObs: KeysObj<keyof OperationsTemplatesConfig> = {
  operationKindTemplate: null,
  operationTypeTemplate: null,
  variablesTypeTemplate: null,
  typeUsagesTemplate: null,
  operationDocumentTemplate: null,
}
const fieldArgsTemplatesConfigKeysObs: KeysObj<keyof FieldArgsTemplateConfig> = {
  fieldArgsTypeTemplate: null,
}
const typeAccessorTemplatesConfigKeysObs: KeysObj<keyof TypeAccessorTemplateConfig> = {
  typeAccessorTypeTemplate: null,
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

  get operationTemplates() {
    return this.pickConfigEntries(operationsTemplatesConfigKeysObs)
  }

  get fieldArgsTemplates() {
    return this.pickConfigEntries(fieldArgsTemplatesConfigKeysObs)
  }

  get typeAccessorTemplates() {
    return this.pickConfigEntries(typeAccessorTemplatesConfigKeysObs)
  }

  get importTypes() {
    const config = this.pickConfigEntries(typesImportConfigKeysObs)
    const importRef = config.importTypesFrom ? `${config.importedTypesAlias}.` : ''
    return { ...config, importRef }
  }

  get typeUsages() {
    return this.pickConfigEntries(typeUsagesConfigKeysObs)
  }

  validateConfig() {
    validateOperationsTemplate(...Object.values(this.operationTemplates))
    validateFieldArgsTemplate(...Object.values(this.fieldArgsTemplates))
    validateTypeAccessorTemplate(...Object.values(this.typeAccessorTemplates))
  }

  private pickConfigEntries = <T extends keyof AllConfigOptions>(pick: KeysObj<T>) =>
    pickKeys<T, AllConfigOptions>(this.config, pick)
}
