import { DocumentNode, GraphQLSchema, TypeInfo } from 'graphql'
import { LazyGetter as Lazy } from 'lazy-get-decorator'

import { getFragments, getOperations } from './getDefinitions'
import { getFieldArgsUsageMap } from './getFieldArgsUsage'
import { getTypeUsages } from './getTypeUsages'
import { getTypesMap } from './getOutputTypesMap'

export class OperationsParser {
  readonly typeInfo: TypeInfo
  constructor(readonly allAst: DocumentNode, readonly schema: GraphQLSchema) {
    this.typeInfo = new TypeInfo(schema)
  }

  @Lazy()
  get allFragments() {
    return getFragments(this.allAst)
  }

  @Lazy()
  get allOperations() {
    return getOperations(this.allAst)
  }

  @Lazy()
  get allDefinitions() {
    return [...this.allFragments, ...this.allOperations]
  }

  @Lazy()
  get typeUsages() {
    const { allDefinitions, typeInfo } = this
    return allDefinitions.map(x => getTypeUsages(x.node, typeInfo))
  }

  @Lazy()
  get fieldArgsUsages() {
    const { schema } = this
    return getFieldArgsUsageMap(schema)
  }

  @Lazy()
  get outputTypes() {
    const { schema } = this
    return getTypesMap(schema, 'enum', 'interface', 'object', 'union')
  }

  @Lazy()
  get scalarTypes() {
    const { schema } = this
    return getTypesMap(schema, 'scalar')
  }
}
