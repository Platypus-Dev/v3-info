import { useGetLatestPricesQuery } from '../../apollo/generated/graphql-codegen-generated';

const WFTM_ADDRESS = '0xd00ae08403B9bbb9124bB305C09058E32C39A48c';
const BEETS_ADDRESS = '0x6451Bf1B139e6FA327d16a38cB2510E9bBD1FedE';

export function useLatestPrices(): { ftm?: number; beets?: number } {
    // eslint-disable-next-line
    const { data } = useGetLatestPricesQuery({ variables: { where: { asset_in: [WFTM_ADDRESS, BEETS_ADDRESS] } } });
    const prices = data?.latestPrices || [];
    const ftm = prices.find((price) => price.asset === WFTM_ADDRESS);
    const beets = prices.find((price) => price.asset === BEETS_ADDRESS);

    return {
        ftm: ftm ? parseFloat(ftm.priceUSD) : undefined,
        beets: beets ? parseFloat(beets.priceUSD) : undefined,
    };
}
