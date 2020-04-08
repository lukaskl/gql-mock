import { Types } from '@graphql-codegen/plugin-helpers'
import fs from 'fs'
import glob from 'glob'
import { parse } from 'graphql'
import path from 'path'

import { schema } from './schema'

const documents = glob
  .sync(path.join(__dirname, '*.graphql'))
  .map<Types.DocumentFile>(p => ({ location: p, document: parse(fs.readFileSync(p, 'utf8')) }))

export const gitHuntSchema = { schema, documents }
