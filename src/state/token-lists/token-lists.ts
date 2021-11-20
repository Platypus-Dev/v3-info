import { makeVar } from '@apollo/client';

export interface TokenListToken {
    name: string;
    address: string;
    symbol: string;
    decimals: number;
    chain: number;
    logoURI: string;
}

export const tokenListTokens = makeVar<TokenListToken[]>([]);

export async function loadTokenListTokens() {
    try {
        const response = await fetch(
            'https://raw.githubusercontent.com/l0rdicon/offical-token-lists/main/tokens.fuji.json',
        );
        const data = await response.json();
        console.log("got some tokens!", data)
        tokenListTokens(data.result.tokens);
        console.log(tokenListTokens)
    } catch {}
}
