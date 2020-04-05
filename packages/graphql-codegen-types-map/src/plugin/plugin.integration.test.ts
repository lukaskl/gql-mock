import { gitHuntSchema } from '~/test-support'
import { plugin } from './plugin'
import { AllConfigOptions } from './printer'

const runPlugin = async (config: Partial<AllConfigOptions> = {}) => {
  return await plugin(
    gitHuntSchema.schema,
    gitHuntSchema.documents,
    { operationsMap: config },
    {
      outputFile: '',
    }
  )
}

describe('TypeScript Operations Map Plugin', () => {
  it('Test 1', async () => {
    const result = await runPlugin()

    expect(result).toMatchSnapshot()
  })
})
