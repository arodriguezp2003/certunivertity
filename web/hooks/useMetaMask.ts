import { useState, useEffect } from "react";
import { BrowserProvider, Eip1193Provider } from "ethers";

interface MetaMaskState {
  isInstalled: boolean;
  isConnected: boolean;
  account: string | null;
  chainId: number | null;
  provider: BrowserProvider | null;
}

export function useMetaMask() {
  const [state, setState] = useState<MetaMaskState>({
    isInstalled: false,
    isConnected: false,
    account: null,
    chainId: null,
    provider: null,
  });

  useEffect(() => {
    if (typeof window !== "undefined" && window.ethereum) {
      setState((prev) => ({ ...prev, isInstalled: true }));
      checkConnection();
    }
  }, []);

  const checkConnection = async () => {
    try {
      if (!window.ethereum) return;

      const provider = new BrowserProvider(window.ethereum as Eip1193Provider);
      const accounts = await provider.listAccounts();
      const network = await provider.getNetwork();

      if (accounts.length > 0) {
        setState({
          isInstalled: true,
          isConnected: true,
          account: accounts[0].address,
          chainId: Number(network.chainId),
          provider,
        });
      }
    } catch (error) {
      console.error("Error checking connection:", error);
    }
  };

  const connect = async () => {
    try {
      if (!window.ethereum) {
        throw new Error("MetaMask is not installed");
      }

      const provider = new BrowserProvider(window.ethereum as Eip1193Provider);
      const accounts = await provider.send("eth_requestAccounts", []);
      const network = await provider.getNetwork();

      setState({
        isInstalled: true,
        isConnected: true,
        account: accounts[0],
        chainId: Number(network.chainId),
        provider,
      });

      return accounts[0];
    } catch (error: any) {
      console.error("Error connecting to MetaMask:", error);
      throw error;
    }
  };

  const switchToSepolia = async () => {
    try {
      if (!window.ethereum) {
        throw new Error("MetaMask is not installed");
      }

      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: "0xaa36a7" }], // Sepolia chainId in hex
      });

      // Refresh connection state
      await checkConnection();
    } catch (error: any) {
      // Chain not added, try to add it
      if (error.code === 4902) {
        try {
          await window.ethereum.request({
            method: "wallet_addEthereumChain",
            params: [
              {
                chainId: "0xaa36a7",
                chainName: "Sepolia Testnet",
                nativeCurrency: {
                  name: "Sepolia ETH",
                  symbol: "ETH",
                  decimals: 18,
                },
                rpcUrls: ["https://sepolia.infura.io/v3/"],
                blockExplorerUrls: ["https://sepolia.etherscan.io"],
              },
            ],
          });
          await checkConnection();
        } catch (addError) {
          console.error("Error adding Sepolia network:", addError);
          throw addError;
        }
      } else {
        console.error("Error switching to Sepolia:", error);
        throw error;
      }
    }
  };

  return {
    ...state,
    connect,
    switchToSepolia,
    checkConnection,
  };
}

// Extend Window interface for TypeScript
declare global {
  interface Window {
    ethereum?: any;
  }
}
