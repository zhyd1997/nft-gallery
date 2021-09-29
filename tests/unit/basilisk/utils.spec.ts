import NFTUtils, { NFTAction } from '@/components/bsx/NftUtils'
import { Keyring } from '@polkadot/api'
import { KeyringPair } from '@polkadot/keyring/types'
import { expect } from 'chai'

const CANARY_IPFS = 'ipfs://ipfs/QmaCWgK91teVsQuwLDt56m2xaUfBCCJLeCsPeJyHEenoES'


describe('NFTUtils', (): void => {
  const keyring = new Keyring({ type: 'sr25519' })
  let alice: KeyringPair

  before(() => {
    alice = keyring.createFromUri('//Alice')
  })

  it('can create collection params', () => {
    const [id, admin, metadata] = NFTUtils.createCollection(0, alice.address, CANARY_IPFS)
    expect(id).to.be.equal('0')
    expect(admin).to.be.equal(alice.address)
    expect(metadata).to.be.equal(CANARY_IPFS)
  })

  it('can create token params', () => {
    const [collectionId, id, owner, royalty, metadata] = NFTUtils.createNFT(0, 0, alice.address, 10, CANARY_IPFS)
    expect(collectionId).to.be.equal('0')
    expect(id).to.be.equal('0')
    expect(owner).to.be.equal(alice.address)
    expect(royalty).to.be.equal(10)
    expect(metadata).to.be.equal(CANARY_IPFS)
  })

  it('can correctly choose meta', async () => {
    const bob = keyring.createFromUri('//Bob')
    const send = NFTUtils.correctMeta(NFTAction.SEND, bob.address, alice.address)
    expect(send).to.be.equal(bob.address)
    const buy = NFTUtils.correctMeta(NFTAction.BUY, bob.address, alice.address)
    expect(buy).to.be.equal(alice.address)
  })
})
