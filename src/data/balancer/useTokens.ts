import { useDeltaTimestamps } from '../../utils/queries';
import { useBlocksFromTimestamps } from '../../hooks/useBlocksFromTimestamps';
import {
    BalancerTokenFragment,
    BalancerTokenPriceFragment,
    BalancerTokenPricesQuery,
    BalancerTokenPricesQueryVariables,
    LatestPriceFragment,
    useGetTokenDataLazyQuery,
    useGetTokenSnapshotsQuery,
} from '../../apollo/generated/graphql-codegen-generated';
import { useEffect, useState } from 'react';
import { TokenChartEntry, TokenData } from '../../state/tokens/reducer';
import { unixToDate } from '../../utils/date';
import { tokenListTokens } from '../../state/token-lists/token-lists';
import { client } from '../../apollo/client';
import { BalancerTokenPrices } from '../../apollo/generated/operations';

function getTokenValues(
    tokenAddress: string,
    tokens: BalancerTokenFragment[],
): { tvl: number; volume: number; swapCount: number; tvlToken: number } {
    const token = tokens.find((token24) => tokenAddress === token24.address);

    if (!token) {
        return { tvl: 0, volume: 0, swapCount: 0, tvlToken: 0 };
    }

    return {
        tvl: parseFloat(token.totalBalanceUSD),
        volume: parseFloat(token.totalVolumeUSD),
        swapCount: parseFloat(token.totalSwapCount),
        tvlToken: parseFloat(token.totalBalanceNotional),
    };
}

function getTokenPriceValues(tokenAddress: string, prices: LatestPriceFragment[]): { price: number } {
    const price = prices.find((prices) => prices.asset === tokenAddress);
    const priceUSD = price ? parseFloat(price.priceUsd) : 0;

    return { price: priceUSD };
}

export function useBalancerTokens(): TokenData[] {
    const [t24, t48, tWeek] = useDeltaTimestamps();
    const { blocks, error: blockError } = useBlocksFromTimestamps([t24, t48, tWeek]);
    const [block24, block48, blockWeek] = blocks ?? [];
    const [getTokenData, { data }] = useGetTokenDataLazyQuery();

    useEffect(() => {
        if (block24) {
            //TODO: replace this once the graph has caught up
            getTokenData({
                variables: {
                    block24: { number: parseInt(block24.number) },
                    //block48: { number: parseInt(block48.number) },
                    blockWeek: { number: parseInt(blockWeek.number) },
                },
            });
        }
    }, [block24]);

    if (!data) {
        return [];
    }

    const { tokens, prices, tokens24, prices24, tokensWeek, pricesWeek } = data;

    return tokens.map((token) => {
        const tokenData = getTokenValues(token.address, tokens);
        const tokenData24 = getTokenValues(token.address, tokens24);
        //const tokenData48 = getTokenValues(token.address, tokens48);
        const tokenDataWeek = getTokenValues(token.address, tokensWeek);
        const priceData = getTokenPriceValues(token.address, prices);
        const priceData24 = getTokenPriceValues(token.address, prices24);
        //const priceData48 = getTokenPriceValues(token.address, prices48);
        const priceDataWeek = getTokenPriceValues(token.address, pricesWeek);

        return {
            ...token,
            name: token.name || '',
            symbol: token.symbol || '',
            exists: true,
            volumeUSD: tokenData.volume - tokenData24.volume,
            volumeUSDChange: (tokenData.volume - tokenData24.volume) / tokenData24.volume,
            volumeUSDWeek: tokenData.volume - tokenDataWeek.volume,
            txCount: parseFloat(token.totalSwapCount),
            feesUSD: 0,
            tvlToken: tokenData.tvlToken,
            tvlUSD: tokenData.tvl,
            tvlUSDChange: (tokenData.tvl - tokenData24.tvl) / tokenData24.tvl,
            priceUSD: priceData.price,
            priceUSDChange:
                priceData.price && priceData24.price ? (priceData.price - priceData24.price) / priceData24.price : 0,
            priceUSDChangeWeek:
                priceData.price && priceDataWeek.price
                    ? (priceData.price - priceDataWeek.price) / priceDataWeek.price
                    : 0,
        };
    });
}

export function useBalancerTokenData(address: string): TokenData | null {
    const tokens = useBalancerTokens();
    const token = tokens.find((token) => token.address === address);

    return token || null;
}

export function useBalancerTokenPageData(address: string): {
    tvlData: { value: number; time: string }[];
    volumeData: { value: number; time: string }[];
    priceData: { value: number; time: string }[];
} {
    const { data } = useGetTokenSnapshotsQuery({ variables: { address } });
    const snapshots = data?.tokenSnapshots || [];
    const [tokenPrices, setTokenPrices] = useState<BalancerTokenPriceFragment[]>([]);

    /*useEffect(() => {
        async function load() {
            console.log('inside load');
            const tokenPrices = await loadAllTokenPrices(address);
            console.log('after');

            console.log('token prices', tokenPrices);
            setTokenPrices(tokenPrices);
        }

        load().catch();
    }, []);*/

    const tvlData = snapshots.map((snapshot) => {
        const value = parseFloat(snapshot.totalBalanceUSD);

        return {
            value: value > 0 ? value : 0,
            time: unixToDate(snapshot.timestamp),
        };
    });

    const volumeData = snapshots.map((snapshot, idx) => {
        const prevValue = idx === 0 ? 0 : parseFloat(snapshots[idx - 1].totalVolumeUSD);
        const value = parseFloat(snapshot.totalVolumeUSD);

        return {
            value: value - prevValue > 0 ? value - prevValue : 0,
            time: unixToDate(snapshot.timestamp),
        };
    });

    const priceData = snapshots.map((snapshot) => {
        return {
            value: parseFloat(snapshot.totalBalanceUSD) / parseFloat(snapshot.totalBalanceNotional),
            time: unixToDate(snapshot.timestamp),
        };
    });

    return {
        tvlData,
        volumeData,
        priceData,
    };
}