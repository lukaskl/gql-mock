import schema from './schema.json'
import fs from 'fs'
import path from 'path'
import glob from 'glob'
import { Types } from '@graphql-codegen/plugin-helpers'
import { parse, buildClientSchema, IntrospectionQuery } from 'graphql'

const documents = glob
  .sync(path.join(__dirname, '*.graphql'))
  .map<Types.DocumentFile>(p => ({ location: p, document: parse(fs.readFileSync(p, 'utf8')) }))

export const gitHuntSchema = { schema: buildClientSchema((schema as any) as IntrospectionQuery), documents }
