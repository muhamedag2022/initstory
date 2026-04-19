import { Buffer } from 'buffer'
window.Buffer = Buffer
window.process = { env: { NODE_ENV: 'development' } }

import React from 'react'
import ReactDOM from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { WagmiProvider, createConfig, http } from 'wagmi'
import { mainnet } from 'wagmi/chains'
import {
  InterwovenKitProvider,
  TESTNET,
  injectStyles,
} from '@initia/interwovenkit-react'
import '@initia/interwovenkit-react/styles.css'
import InterwovenKitStyles from '@initia/interwovenkit-react/styles.js'
import App from './App.jsx'
import './index.css'

injectStyles(InterwovenKitStyles)

const queryClient = new QueryClient()
const wagmiConfig = createConfig({
  chains: [mainnet],
  transports: { [mainnet.id]: http() },
})

const customChain = {
  chain_id:      'initstory-1',
  chain_name:    'initstory',
  pretty_name:   'InitStory',
  network_type:  'testnet',
  bech32_prefix: 'init',
  apis: {
    rpc:     [{ address: 'http://localhost:26657' }],
    rest:    [{ address: 'http://localhost:1317' }],
    indexer: [{ address: 'http://localhost:8080' }],
  },
  fees: {
    fee_tokens: [{
      denom:               'uinit',
      fixed_min_gas_price: 0,
      low_gas_price:       0,
      average_gas_price:   0,
      high_gas_price:      0,
    }],
  },
  staking: {
    staking_tokens: [{ denom: 'uinit' }],
  },
  metadata: {
    is_l1:   false,
    minitia: { type: 'minimove' },
  },
  native_assets: [{
    denom:    'uinit',
    name:     'Native Token',
    symbol:   'INIT',
    decimals: 6,
  }],
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <InterwovenKitProvider
          {...TESTNET}
          defaultChainId="initstory-1"
          enableAutoSign={true}
          customChain={customChain}
          customChains={[customChain]}
        >
          <App />
        </InterwovenKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  </React.StrictMode>,
)