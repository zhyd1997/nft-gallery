import { SkynetClient } from 'skynet-js'
import { expect } from 'chai'
import axios from 'axios'

const SKY_URL = 'https://siasky.net'

describe('SKYNET TEST', (): void => {
  let client: SkynetClient

  before(async () => {
    client = new SkynetClient(SKY_URL)
  })

  it.skip('can retrieve metadata ', async () => {
    const link = 'IAAKQ6Un_ze_NJHYju75HroS9abthubAdQody3KD_fxd6Q'
    try {
      const { metadata, skylink } = await client.getMetadata(link)
      console.log(metadata, skylink)
      expect(skylink).to.be.equal(`sia://${link}`)
      expect(metadata).to.be.an('object')
      expect(metadata.filename).to.be.equal('koda.png')
    } catch (error) {
      console.log(error)
    }
  })

  it('can retrieve data', async () => {
    const link = 'AAC_fhNs9iO9kvVcIwkFMkMAEPiZ_lEb5HskoBVmygcAzA'
    try {
      const { data, skylink } = await client.getFileContent(link)
      expect(skylink).to.be.equal(`sia://${link}`)
      expect(data).to.be.an('object')
      expect((data as any).external_url).to.be.equal('https://nft.kodadot.xyz')
      expect((data as any).image).to.be.equal('ipfs://ipfs/QmaEDEt31XNtEff6wr9bQUSU2nZKznVcqgxPqiFjyLsGCR')
    } catch (error) {
      console.log(error)
    }
  })

  it.skip('can upload', async () => {
    try {
      const blob = await axios.get(
        'https://gateway.pinata.cloud/ipfs/QmSyouRZYEfYLmPaFT3PyH7WtLdsecgjxwJcnSCSYL1k1x', {
          responseType: 'blob'
        }
      ).then((response) => response.data)
      const file = new File([blob], 'kodadot.svg')
      const { skylink } = await client.uploadFile(file)
      expect(skylink).to.match(/^sia:\/\/[a-zA-Z0-9-_]+/)
    } catch (error) {
      console.log(error)
    }
  }).timeout(10000)
})
