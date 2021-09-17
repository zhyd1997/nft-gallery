export const tokenIdToRoute = (tokenId: string): object => {
  const [collection, item] = tokenId.split('-');
  return {
    id: collection,
    item
  }
}
