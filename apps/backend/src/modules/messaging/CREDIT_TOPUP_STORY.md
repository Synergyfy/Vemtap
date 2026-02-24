# The Story of the messaging Credit Top-up System 🚀

This document outlines the workflow and API specifications for the messaging Credit Top-up system. This system ensures that businesses never stop communicating with their customers, even after their monthly plan limits are reached.

---

## 📖 The Storyline: "The Business Growth Journey"

### Act 1: The Administrator's Setup
Our story begins with the **System Administrator**. To provide flexibility for businesses of all sizes, the admin creates various "Top-up Bundles". These are one-time purchase packages that add specific amounts of SMS, Email, or WhatsApp credits to a business's account.

### Act 2: The Business Owner's Need
Meet **Azeem**, a business owner using the platform. His "Pro Plan" includes 500 SMS messages a month. Because of a successful marketing campaign, Azeem uses up all 500 messages by the 15th of the month. Usually,his messaging would stop, but thanks to the **Top-up System**, he has an alternative.

### Act 3: The Purchase
Azeem logs into his dashboard and sees a "Growth Bundle" offering 1,000 extra SMS for ₦5,000. He chooses this bundle and pays securely via **Paystack**.

### Act 4: The Award
Once the payment is successful on Paystack, Azeem's frontend application sends the **Transaction Reference** to our API. The system:
1. Verifies the transaction with Paystack.
2. Checks that the amount paid matches the bundle price.
3. Records the payment in the ledger.
4. Instantly awards the 1,000 SMS credits to Azeem's **"Top-up Bucket"**.

### Act 5: The Intelligent Deduction
Now, when Azeem sends a message:
1. The system checks: *"Does he have remaining Free monthly credits?"* -> **No** (He used all 500).
2. The system then checks: *"Does he have Top-up credits?"* -> **Yes!** (He has 1,000).
3. The system deducts 1 credit from his **Top-up Bucket** and sends the message.

---

## 🛠 API Endpoints & Specifications

### 1. Create a Credit Plan (Admin Only)
Define a new top-up bundle available for purchase.

- **Endpoint**: `POST /api/v1/credit-plans`
- **Auth**: Bearer Token (JWT) + Admin Role

**Payload (`CreateCreditPlanDto`):**
```json
{
  "name": "Growth SMS Bundle",
  "description": "Extra 1000 SMS messages for your campaigns",
  "price": 5000,
  "currency": "NGN",
  "smsAmount": 1000,
  "emailAmount": 0,
  "whatsappAmount": 0,
  "isActive": true
}
```

**Response:**
```json
{
  "id": "c7a8b9d0-...",
  "name": "Growth SMS Bundle",
  "price": "5000.00",
  "smsAmount": 1000,
  "emailAmount": 0,
  "whatsappAmount": 0,
  "isActive": true,
  "createdAt": "2024-02-24T..."
}
```

---

### 2. List Active Credit Plans
View available bundles for purchase.

- **Endpoint**: `GET /api/v1/credit-plans`
- **Auth**: Optional (Publicly viewable or protected depending on UI)

**Response:**
```json
[
  {
    "id": "...",
    "name": "Small Starter",
    "price": 1000,
    "smsAmount": 100
  },
  {
    "id": "...",
    "name": "Growth Bundle",
    "price": 5000,
    "smsAmount": 1000
  }
]
```

---

### 3. Purchase a Credit Plan
Verify a Paystack payment and award credits to a business.

- **Endpoint**: `POST /api/v1/credit-plans/:id/purchase`
- **Auth**: Bearer Token (JWT)

**Payload (`PurchaseCreditPlanDto`):**
```json
{
  "reference": "pstk_val_982347234",
  "businessId": "b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11"
}
```

**Internal Logic:**
1. Calls Paystack API to verify `reference`.
2. Confirms `amountpaid / 100 == plan.price`.
3. Updates/Creates `BusinessCredit` record.

**Response (`BusinessCredit`):**
```json
{
  "businessId": "b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
  "smsBalance": 1000,
  "emailBalance": 0,
  "whatsappBalance": 0,
  "updatedAt": "2024-02-24T..."
}
```

---

### 4. Update a Plan (Admin Only)
Modify bundles (e.g., change price or amount).

- **Endpoint**: `PATCH /api/v1/credit-plans/:id`
- **Auth**: Bearer Token (JWT) + Admin Role

**Payload:**
```json
{
  "price": 4500,
  "isActive": true
}
```

---

### 5. Deactivate a Plan (Admin Only)
Soft delete a plan by setting `isActive` to false.

- **Endpoint**: `DELETE /api/v1/credit-plans/:id`
- **Auth**: Bearer Token (JWT) + Admin Role

---

## 🧠 Logic: The Deduction Priority

The engine uses the following logic when a business attempts to send a message:

```typescript
// Pseudocode of CreditService logic
async function deduct(business, channel, amount) {
    const monthlyLimit = plan.channelCredits;
    const currentUsage = messageRepo.countMonthUsage(business, channel);
    
    const freeRemaining = monthlyLimit - currentUsage;
    
    if (freeRemaining >= amount) {
        // Use free monthly credits (do nothing, just send)
        return;
    } else {
        const topupNeeded = amount - freeRemaining;
        const topupBalance = businessCreditRepo.getBalance(business, channel);
        
        if (topupBalance >= topupNeeded) {
            // Deduct from the purchased Top-up Bucket
            businessCreditRepo.deduct(business, channel, topupNeeded);
        } else {
            throw new Error("Insufficient credits");
        }
    }
}
```

This logic ensures that **Top-up credits are only used as a fallback**, saving the user money by exhausting free credits every month first.
