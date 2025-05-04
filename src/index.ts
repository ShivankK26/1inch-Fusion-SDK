import { 
    SDK, 
    NetworkEnum, 
    PrivateKeyProviderConnector, 
    HashLock, 
} from "@1inch/cross-chain-sdk";
import { ethers } from 'ethers';

// Initialize SDK with private key provider
const makerPrivateKey = process.env.PRIVATE_KEY;
const makerAddress = process.env.WALLET_ADDRESS;
const nodeUrl = process.env.RPC_URL;

if (!makerPrivateKey || !makerAddress || !nodeUrl) {
    throw new Error("Missing environment variables");
}

const provider = new ethers.providers.JsonRpcProvider(nodeUrl);
const wallet = new ethers.Wallet(makerPrivateKey, provider);

// Create a Web3-like provider for the SDK
const web3Provider = {
    eth: {
        getChainId: async () => (await provider.getNetwork()).chainId,
        getAccounts: async () => [wallet.address],
        sign: async (data: string) => wallet.signMessage(data),
        sendTransaction: async (tx: any) => {
            const txResponse = await wallet.sendTransaction(tx);
            return txResponse.hash;
        },
        call: async (tx: any) => {
            return provider.call(tx);
        }
    }
} as any;

const blockchainProvider = new PrivateKeyProviderConnector(
    makerPrivateKey,
    web3Provider
);

// Initialize SDK
const sdk = new SDK({
    url: "https://api.1inch.dev/fusion-plus",
    authKey: process.env.AUTH_KEY,
    blockchainProvider
});

// Example function to get active orders
async function getActiveOrders(page: number = 1, limit: number = 2) {
    try {
        const orders = await sdk.getActiveOrders({ page, limit });
        console.log('Active orders:', orders);
        return orders;
    } catch (error) {
        console.error('Error getting active orders:', error);
        throw error;
    }
}

// Example function to get quote
async function getQuote(params: {
    srcChainId: number,
    dstChainId: number,
    srcTokenAddress: string,
    dstTokenAddress: string,
    amount: string
}) {
    try {
        const quote = await sdk.getQuote(params);
        console.log('Quote:', quote);
        return quote;
    } catch (error) {
        console.error('Error getting quote:', error);
        throw error;
    }
}

// Example function to place order
async function placeOrder(params: {
    srcChainId: number,
    dstChainId: number,
    srcTokenAddress: string,
    dstTokenAddress: string,
    amount: string,
    walletAddress: string
}) {
    try {
        const quote = await sdk.getQuote(params);
        const secretsCount = quote.getPreset().secretsCount;

        const secrets = Array.from({ length: secretsCount }).map(() => 
            ethers.utils.keccak256(ethers.utils.randomBytes(32))
        );
        const secretHashes = secrets.map((x) => HashLock.hashSecret(x));

        const hashLock =
            secretsCount === 1
                ? HashLock.forSingleFill(secrets[0])
                : HashLock.forMultipleFills(
                    secretHashes.map((secretHash, i) =>
                    ethers.utils.solidityKeccak256(["uint64", "bytes32"], [i, secretHash.toString()])
                    ) as (string & {
                    _tag: "MerkleLeaf";
                    })[]
        );

        const order = await sdk.placeOrder(quote, {
            walletAddress: params.walletAddress,
            hashLock,
            secretHashes,
            fee: {
                takingFeeBps: 100, // 1%
                takingFeeReceiver: "0x0000000000000000000000000000000000000000"
            }
        });

        console.log('Placed order:', order);
        return order;
    } catch (error) {
        console.error('Error placing order:', error);
        throw error;
    }
}
