# Lummy Frontend

<img src="public/lummy-icon.png" alt="Lummy Logo" width="80px">

A modern React-based decentralized ticketing platform built with TypeScript and Web3 technologies. Lummy provides an intuitive interface for event discovery, NFT ticket management, and blockchain-powered transactions with comprehensive user role management.

## 🚀 Technology Stack

### Core Framework
- **React 19.0.0** with **TypeScript 5.7.2** - Latest React features with full type safety
- **Vite 6.2.0** - Lightning-fast build tool and development server
- **ESLint** - Code quality and consistency

### UI & Styling
- **Chakra UI 2.8.2** - Modern component library with consistent design system
- **Emotion** - CSS-in-JS styling solution
- **Framer Motion 12.9.4** - Smooth animations and transitions
- **React Icons 5.5.0** - Comprehensive icon library

### Web3 Integration
- **Wagmi 2.15.1** - React hooks for Ethereum development
- **Viem 2.28.1** - TypeScript interface for Ethereum
- **Ethers 6.13.5** - Ethereum library for blockchain interactions
- **@xellar/kit 2.0.8** - Email-based wallet integration

### State Management & Routing
- **Zustand 5.0.3** - Lightweight state management
- **@tanstack/react-query 5.74.11** - Server state management and caching
- **React Router DOM 7.5.0** - Client-side routing
- **Recharts 2.15.3** - Data visualization for analytics

## 🏗️ Architecture

### Component Organization
```
src/components/
├── core/           # Basic reusable components (Button, Input, Card)
├── composite/      # Complex composed components (EventDetailInfo, TicketTierCard)
├── common/         # Shared utilities (RoleSwitcher, DevelopmentNoticeModal)
├── layout/         # Layout components (Navbar, Footer)
├── checkout/       # Payment and transaction flow
├── events/         # Event discovery and browsing
├── marketplace/    # Secondary ticket market
├── organizer/      # Event creation and management
├── tickets/        # NFT ticket management
├── wallet/         # Web3 wallet integration
├── profile/        # User profile and history
└── ticketManagement/ # Staff check-in and verification
```

### Service Layer
- **Web3Provider.tsx** - Blockchain connectivity and configuration
- **TransactionService.ts** - Transaction handling and error management
- **XellarIntegration.ts** - Email-based wallet integration
- **IPFSImageService.ts** - Decentralized image storage
- **Contracts/** - Smart contract interfaces and type definitions

## 👥 User Roles & Features

### 🎟️ Customer Features
- **Event Discovery**: Browse events with advanced filtering (category, location, price, date)
- **Secure Payments**: Purchase tickets using IDRX stablecoin with escrow protection
- **NFT Ticket Management**: View, transfer, and manage blockchain-based tickets
- **QR Code Access**: Dynamic QR codes for secure event entry
- **Secondary Market**: Buy and sell tickets with anti-scalping protections
- **Transaction History**: Complete purchase and transfer history

### 🎪 Organizer Features
- **Event Creation**: Create events with dual algorithm support (Pure Web3 vs Traditional)
- **Ticket Tier Management**: Configure multiple pricing tiers with custom metadata
- **Staff Management**: Hierarchical role system (Scanner → Check-in → Manager)
- **Sales Analytics**: Real-time sales tracking and financial reporting
- **Resale Controls**: Configure secondary market rules and fees
- **Attendee Management**: Check-in dashboard and verification tools

### 👨‍💼 Admin Features
- **Platform Analytics**: Revenue tracking and platform-wide statistics
- **Organizer Approval**: Streamlined organizer request management (4-field form)
- **Event Oversight**: Platform-wide event management
- **Financial Reporting**: Platform fee collection and distribution

### 👥 Staff Features
- **QR Scanner**: Mobile-optimized ticket verification
- **Check-in Dashboard**: Real-time attendee management
- **Role-based Access**: Hierarchical permissions system

## 🔧 Setup Instructions

### Prerequisites
- **Node.js 18+** and npm/yarn
- **Modern Web Browser** with Web3 wallet support

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-org/lummy-frontend.git
   cd lummy-frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Environment Configuration:**
   Create `.env` file:
   ```env
   VITE_LISK_SEPOLIA_RPC_URL=https://rpc.sepolia.lisk.com
   VITE_POLYGON_AMOY_RPC_URL=https://rpc-amoy.polygon.technology
   VITE_SEPOLIA_RPC_URL=https://ethereum-sepolia-rpc.publicnode.com
   VITE_WALLETCONNECT_PROJECT_ID=your_project_id
   VITE_XELLAR_APP_ID=your_xellar_app_id
   VITE_EVENT_FACTORY_ADDRESS=0x...
   VITE_IDRX_TOKEN_ADDRESS=0x...
   ```

4. **Start development server:**
   ```bash
   npm run dev
   ```

5. **Open browser to:** `http://localhost:5173`

## 🔗 Web3 Integration

### Supported Networks
- **Lisk Sepolia** (Primary) - 4202
- **Polygon Amoy** - 80002  
- **Ethereum Sepolia** - 11155111

### Smart Contract Integration
- **EventFactory** - Event creation and management
- **Event** - Individual event contracts with escrow
- **TicketNFT** - ERC-721 compliant ticket NFTs
- **IDRX Token** - Indonesian Rupiah stablecoin

### Wallet Connection
- **Primary**: Xellar Kit (email-based Web3 wallet)
- **Fallback**: Standard Web3 wallets via Wagmi
- **Features**: Gasless transactions, multi-network support

## 📦 Development Modes

### 🔌 Connected Mode (Production)
- Full blockchain integration with deployed contracts
- Real IDRX token transactions
- Live NFT minting and transfers
- Ethereum network connectivity

### 🧪 Mock Mode (Development)
- Simulated blockchain functionality
- Faster development iteration
- No gas costs or network dependencies
- Complete feature demonstration

Toggle between modes using the Development Notice Modal in the app.

## 🏗️ Building & Deployment

### Production Build
```bash
npm run build
```

### Type Checking
```bash
npm run type-check
```

### Linting
```bash
npm run lint
```

### Deployment Targets
- **Vercel** (Recommended) - Zero-config deployment
- **Netlify** - Static site hosting
- **Traditional Hosting** - Standard web servers

## 🔐 Security Features

- **Input Validation**: Comprehensive form validation and sanitization
- **Wallet Security**: Secure wallet integration patterns
- **Access Control**: Role-based component rendering
- **Transaction Safety**: Contract interaction safety checks
- **Error Handling**: Graceful error recovery and user feedback

## 🎯 Performance Optimizations

- **Code Splitting**: Automatic route-based splitting
- **React Query**: Intelligent data caching and background updates
- **Image Optimization**: Responsive images and lazy loading
- **Bundle Analysis**: Optimized chunk sizes

## 📱 Mobile Optimization

- **Responsive Design**: Mobile-first approach
- **QR Scanner**: Optimized camera integration
- **Touch Interactions**: Gesture-friendly interface
- **PWA Ready**: Progressive Web App capabilities

## 🔄 Recent Updates

### v2.0.0 (Latest)
- ✅ **Contract Compatibility**: Updated for latest smart contract revisions
- ✅ **Simplified Admin**: Streamlined organizer request management
- ✅ **Enhanced Security**: Improved role-based access control
- ✅ **Staff Management**: Hierarchical role system implementation
- ✅ **Escrow Integration**: Buyer protection mechanisms
- ✅ **Mobile UX**: Enhanced mobile scanning and check-in experience

### Integration Status
- ✅ **Event Creation**: Full integration with EventFactory contract
- ✅ **Ticket Sales**: IDRX token integration with escrow
- ✅ **Staff Roles**: Contract-compatible role management
- ✅ **QR Generation**: Dynamic QR code system
- ⚠️ **Marketplace**: Basic functionality (enhanced features pending)
- 🔄 **Dynamic Metadata**: IPFS integration in progress

> **⚠️ Important Note**: The currently deployed contracts on Lisk Sepolia are from an older version. The frontend has been updated to be compatible with the latest contract revisions, but full integration requires deployment of the updated contracts.

## 🚀 Deployment

### Live Deployments
- **Production**: [https://lummy-ticket.vercel.app/](https://lummy-ticket.vercel.app/)
- **Staging**: [https://lummy-frontend-staging.vercel.app/](https://lummy-frontend-staging.vercel.app/)

### Environment Variables
Ensure all required environment variables are configured in your deployment platform.

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For technical support or questions:
- Create an issue on GitHub
- Contact: support@lummy.com
- Documentation: [docs.lummy.com](https://docs.lummy.com)

---

**Built with ❤️ for the decentralized future of event ticketing**