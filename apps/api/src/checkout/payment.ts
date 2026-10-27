export async function simulatePayment(method: 'WALLET' | 'CARD', card?: string): Promise<'SUCCESS' | 'DECLINED'> {
  return method === 'CARD' && card?.endsWith('0002') ? 'DECLINED' : 'SUCCESS';
}
