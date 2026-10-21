export async function simulatePayment(method: 'WALLET' | 'CARD', card?: string): Promise<'SUCCESS' | 'DECLINED' | 'UNAVAILABLE'> {
  if (method === 'CARD' && card?.endsWith('0119')) {
    await new Promise((resolve) => setTimeout(resolve, 5100));
    return 'UNAVAILABLE';
  }
  return method === 'CARD' && card?.endsWith('0002') ? 'DECLINED' : 'SUCCESS';
}