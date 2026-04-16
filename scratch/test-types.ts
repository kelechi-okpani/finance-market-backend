import yahooFinance from 'yahoo-finance2';

async function test() {
    const chunk: string[] = ['AAPL'];
    // Try to see if this matches an overload
    const result = yahooFinance.quote(chunk, { validateResult: false } as any);
    console.log(typeof result);
}
