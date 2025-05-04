import { FusionSDK } from '@1inch/fusion-sdk';
import { Web3ProviderConnector } from '@1inch/fusion-sdk';
import { ethers } from 'ethers';

// Initialize Web3 provider connector
const provider = new ethers.providers.JsonRpcProvider('YOUR_RPC_URL');
const connector = new Web3ProviderConnector(provider as any); // Type assertion needed for compatibility

// Initialize Fusion SDK
const sdk = new FusionSDK({
    url: 'https://api.1inch.dev/fusion', // Fusion API endpoint
    network: 1, // Ethereum Mainnet
    web3Provider: connector
});

// Example function to create a limit order
async function createLimitOrder() {
    try {
        const order = await sdk.createOrder({
            fromTokenAddress: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE', // ETH
            toTokenAddress: '0x6B175474E89094C44Da98b954EedeAC495271d0F', // DAI
            amount: '1000000000000000000', // 1 ETH
            walletAddress: 'YOUR_WALLET_ADDRESS',
            allowPartialFills: true
        });

        console.log('Created order:', order);
        return order;
    } catch (error) {
        console.error('Error creating order:', error);
        throw error;
    }
}

// Example function to get order status
async function getOrderStatus(orderHash: string) {
    try {
        const status = await sdk.getOrderStatus(orderHash);
        console.log('Order status:', status);
        return status;
    } catch (error) {
        console.error('Error getting order status:', error);
        throw error;
    }
}

export { createLimitOrder, getOrderStatus }; 