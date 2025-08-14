# 🚀 **IPFS Setup Guide - Phase 2.1 Per-Tier NFT System**

## **📋 Quick Setup (5 minutes)**

### **1. Get Pinata Credentials**

1. Visit: **https://pinata.cloud**
2. **Sign up** → Verify email → Login
3. Go to **API Keys** → **New Key**
4. Enable permissions:
   - ✅ `pinFileToIPFS` (upload images)
   - ✅ `pinJSONToIPFS` (upload metadata)
   - ✅ `unpin` (optional - delete files)
5. **Create Key** → Copy all 3 values:
   - 📋 **API Key**
   - 📋 **API Secret** 
   - 📋 **JWT Token**

### **2. Configure Environment**

**Create `.env.local` file** in `lummy-frontend/` folder:

```bash
# Copy from .env.local.example and fill your credentials:
cp .env.local.example .env.local
```

**Edit `.env.local`:**
```bash
# IPFS Configuration - Pinata
VITE_PINATA_API_KEY=6a1b2c3d4e5f...              # Your API Key
VITE_PINATA_API_SECRET=7f8e9d8c7b6a...           # Your API Secret  
VITE_PINATA_JWT=eyJhbGciOiJIUzI1NiIs...          # Your JWT Token

# Phase 2 Feature Flags
VITE_ENABLE_REAL_IPFS=true
VITE_ENABLE_ORGANIZER_BACKEND=false
VITE_ENABLE_DOCUMENT_UPLOAD=false
```

### **3. Test Setup**

**Restart dev server:**
```bash
npm run dev
```

**Test upload in CreateEventForm:**
1. Go to **Create Event** → **Event Images** section
2. Upload **Event Poster** (16:9 image)
3. Upload **Event Banner** (21:9 image) 
4. Add ticket tiers with **NFT Backgrounds** (1:1 images)
5. Click **"Upload Event Images + Tier NFTs to IPFS"**

**Success indicators:**
- ✅ Console shows: `"✅ Real IPFS upload successful!"`
- ✅ Toast: `"Event + Tier Images Uploaded Successfully!"`
- ✅ Metadata hash visible

---

## **🎯 How It Works**

### **Image Upload Flow:**

**1. Event Level (2 images):**
- **Event Poster** (16:9) → Used in event cards
- **Event Banner** (21:9) → Used in event detail hero

**2. Tier Level (N images):**
- **VIP NFT Background** (1:1) → Green theme ✅
- **Regular NFT Background** (1:1) → Red theme ✅
- **VVIP NFT Background** (1:1) → Gold theme ✅

**3. JSON Metadata Creation:**
```json
{
  "posterImage": "QmPosterHash...",
  "bannerImage": "QmBannerHash...", 
  "tierBackgrounds": {
    "tier-1": "QmVIPGreenHash...",    // VIP tier
    "tier-2": "QmRegularRedHash...",  // Regular tier
    "tier-3": "QmVVIPGoldHash..."     // VVIP tier
  }
}
```

**4. Contract Storage:**
- Final JSON metadata uploaded to IPFS → `QmMetadataHash...`
- Stored in contract `ipfsMetadata` field
- Used by NFT generation and display components

---

## **🔧 System Architecture**

### **Frontend Components:**

**CreateEventForm:**
- Event image upload (2 images)
- Integrates with TicketTierCreator for tier NFTs
- Calls `uploadEventWithTierBackgrounds()`

**TicketTierCreator:**
- Per-tier NFT background upload
- Uses existing `NFTImageUpload` component
- Validates 1:1 aspect ratio

**Display Components:**
- **EventCard**: `getPosterImageUrl()` 
- **EventDetailPage**: `getBannerImageUrl()`
- **TicketDetails**: `getNFTBackgroundUrl(metadata, tierId)`

### **IPFS Service Functions:**

**Primary Upload:**
```typescript
uploadEventWithTierBackgrounds(
  posterFile: File,
  bannerFile: File, 
  tierNFTFiles: Record<string, File>
) → IPFSMetadataUploadResult
```

**Metadata Parsing:**
```typescript
// Get tier-specific NFT background
getNFTBackgroundUrl(ipfsMetadata: string, tierId?: string)

// Get event images
getPosterImageUrl(ipfsMetadata: string)
getBannerImageUrl(ipfsMetadata: string)
```

---

## **🧪 Testing Scenarios**

### **1. Complete Event Creation:**
```bash
1. Upload Event Poster (1200×675 recommended)
2. Upload Event Banner (1920×823 recommended)  
3. Create 3 tiers:
   - VIP → Upload green NFT background (1000×1000)
   - Regular → Upload red NFT background (1000×1000)
   - VVIP → Upload gold NFT background (1000×1000)
4. Click "Upload Event Images + Tier NFTs to IPFS"
5. Create Event → Check contract storage
```

**Expected Result:**
- ✅ 5 total files uploaded (2 event + 3 tier)
- ✅ JSON metadata created and uploaded
- ✅ Final hash stored in contract

### **2. NFT Display Testing:**
```bash
1. Purchase tickets from different tiers
2. Go to My Tickets page
3. Check NFT images show correct tier colors:
   - VIP ticket → Green background ✅
   - Regular ticket → Red background ✅
   - VVIP ticket → Gold background ✅
```

### **3. Legacy Compatibility:**
```bash
1. Old events (Phase 1) still display correctly
2. New events show enhanced tier-specific NFTs
3. Mixed environment works smoothly
```

---

## **⚠️ Troubleshooting**

### **Upload Fails:**
```bash
❌ Error: "Upload failed: 401 Unauthorized"
→ Check PINATA_JWT token is correct

❌ Error: "Upload failed: Network error"  
→ Check internet connection
→ Try different image file

❌ Error: "Missing Tier NFT Backgrounds"
→ Ensure all tiers have NFT images uploaded
```

### **Images Not Showing:**
```bash
❌ NFT shows placeholder instead of tier background
→ Check tierId mapping in tierBackgrounds
→ Verify metadata JSON structure

❌ Event images not loading
→ Check Pinata gateway: gateway.pinata.cloud
→ Try different IPFS gateway
```

### **Development Issues:**
```bash
❌ Real upload not working
→ Check ENABLE_REAL_IPFS=true in constants.ts
→ Verify .env.local file loaded properly

❌ Mock upload still running
→ Restart dev server after .env.local changes
→ Check browser console for credential errors
```

---

## **💰 Pinata Pricing**

**Free Tier:**
- ✅ 1GB storage
- ✅ 100 uploads/month
- ✅ Sufficient for testing

**Pro Tier ($20/month):**
- ✅ 1TB storage
- ✅ Unlimited uploads
- ✅ Recommended for production

---

## **🚀 Production Checklist**

**Before Launch:**
- [ ] Pinata Pro account setup
- [ ] Custom domain for IPFS gateway (optional)
- [ ] Image compression pipeline
- [ ] CDN setup for faster loading
- [ ] Backup strategy for important images

**Security:**
- [ ] API keys stored securely (not in client)
- [ ] Rate limiting implemented
- [ ] Image validation on upload
- [ ] Malicious content detection

**Performance:**
- [ ] Image optimization (WebP format)
- [ ] Lazy loading implemented
- [ ] Progressive image loading
- [ ] Multiple gateway fallbacks

---

**🎉 IPFS Setup Complete! Ready for per-tier NFT magic!** ✨