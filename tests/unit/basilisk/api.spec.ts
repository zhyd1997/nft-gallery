import { ApiPromise, WsProvider, Keyring } from '@polkadot/api'
import { expect } from 'chai'

import { KeyringPair } from '@polkadot/keyring/types'
import basilisk from '@/components/nft/basilisk'
import NFTUtils, { NFTAction } from '@/components/bsx/NftUtils'
import { SubmittableExtrinsic } from '@polkadot/api/types'

const WS_URL = 'ws://127.0.0.1:9988'
const CANARY_IPFS =
  'ipfs://ipfs/QmaCWgK91teVsQuwLDt56m2xaUfBCCJLeCsPeJyHEenoES'

describe('Basilisk NFT pallet', (): void => {
  let api: ApiPromise
  const keyring = new Keyring({ type: 'sr25519' })
  let alice: KeyringPair

  before(async () => {
    const provider = new WsProvider(WS_URL)
    api = await ApiPromise.create({ provider, types: basilisk })
    alice = keyring.createFromUri('//Alice')
  })

  after(async () => {
    await api.disconnect()
  })

  it.skip('can connect', async () => {
    const { chainSS58, chainDecimals, chainTokens } = api.registry
    expect(chainSS58).to.be.equal(10041)
    expect(chainDecimals[0]).to.be.equal(12)
    expect(chainTokens[0]).to.be.equal('BSX')
  })

  it.skip('Alice can have a balance', async () => {
    const cb = api.query.system.account
    const arg = alice.address
    const result = await cb(arg)
    expect(result.data.free.toString()).not.to.be.equal('0')
  })

  const build = (cb: (...params: any) => SubmittableExtrinsic<'promise'>, params: any[]) => {
    const tx = cb(...params)
    expect(tx.hash.toHex()).to.match(/^0x/)
  }

  const getApiCall = (args: [string, string]) => {
    const [section, method] = args
    // expect(api.tx[section]).not.to.be.undefined;
    expect(api.tx[section][method]).to.be.a('function')
    return api.tx[section][method]
  }

  it('Can construct collection', async () => {
    const cb = api.tx.nft.createClass

    const args = NFTUtils.createCollection(0, alice.address, CANARY_IPFS)
    expect(() => build(cb, args)).to.not.throw()
  })

  it('Can construct NFT', async () => {
    const cb = api.tx.nft.mint
    const args = NFTUtils.createNFT(0, 0, alice.address, 10, CANARY_IPFS)
    expect(() => build(cb, args)).to.not.throw()
  })

  it('Can construct TRANSFER', async () => {
    const cb = api.tx.nft.transfer
    const bob = keyring.createFromUri('//Bob')
    const args = NFTUtils.getActionParams(NFTAction.SEND, 0, 0, bob.address)
    expect(() =>  build(cb, args)).to.not.throw()
  })

  it('Can construct BUY', async () => {
    const cb = getApiCall(NFTUtils.apiCall(NFTAction.BUY))
    const bob = keyring.createFromUri('//Bob')
    const args = NFTUtils.getActionParams(NFTAction.BUY, 0, 0, bob.address)
    expect(() =>  build(cb, args)).to.not.throw()
  })

})
