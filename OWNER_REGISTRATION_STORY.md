# 🚀 Owner Registration Journey: The Storyline

This storyline guides you through the process of onboarding a new **Business Owner**. The flow is split into three distinct steps to ensure security, identity verification, and a smooth user experience.

---

### Phase 1: The Initial Contact
**Goal:** The user provides their basic personal details to start the onboarding process and receives a verification code.

*   **Endpoint:** `POST /api/v1/auth/register/owner/request-otp`
*   **Payload:**
    ```json
    {
      "firstName": "Daniel",
      "lastName": "Smith",
      "email": "daniel@greenterrace.com",
      "phone": "+2348012345678",
      "role": "Owner"
    }
    ```
*   **What happens behind the scenes:**
    1.  The system checks if the email is already in use.
    2.  An OTP record is created. It stores the personal details (`firstName`, `lastName`, `phone`) inside a `metadata` field.
    3.  A 4-digit code is sent to Daniel's email.
*   **Response (Status 201):**
    ```json
    { "message": "OTP sent successfully" }
    ```

---

### Phase 2: Identity Verification
**Goal:** Daniel proves he owns the email address provided.

*   **Endpoint:** `POST /api/v1/auth/otp/verify`
*   **Payload:**
    ```json
    {
      "email": "daniel@greenterrace.com",
      "code": "1234"
    }
    ```
*   **What happens behind the scenes:**
    1.  The system locates the OTP record for this email.
    2.  It verifies the code and checks if it has expired.
    3.  Instead of deleting the session, it marks it as `isVerified: true`. This "unlocks" the next stage of registration.
*   **Response (Status 200):**
    ```json
    { "message": "OTP verified successfully" }
    ```

---

### Phase 3: Building the Business Profile
**Goal:** Daniel completes his registration by setting a password and providing his business details. Note that he **does not** need to provide his name or phone number again.

*   **Endpoint:** `POST /api/v1/auth/register/owner`
*   **Payload:**
    ```json
    {
      "email": "daniel@greenterrace.com",
      "password": "securePass123!",
      "businessName": "Green Terrace Cafe",
      "businessLogo": "https://cdn.example.com/logo.png",
      "category": "Hospitality",
      "visitors": "501-2000",
      "goals": ["Capture Leads", "Digital Loyalty"],
      "whatsappNumber": "+2348012345678",
      "officialEmail": "hello@greenterrace.com",
      "businessAddress": "123 Business Ave, Lagos",
      "businessWebsite": "https://greenterrace.com"
    }
    ```
*   **What happens behind the scenes:**
    1.  The system checks for a verified session (`isVerified: true`) for `daniel@greenterrace.com`.
    2.  It retrieves the `firstName`, `lastName`, and `phone` from the session saved in Phase 1.
    3.  **Account Creation:** It creates the User account with the role `Owner`.
    4.  **Business Creation:** It creates a Business entity and links Daniel as the owner.
    5.  **Provisioning:** It automatically generates an initial device for the business.
    6.  **Cleanup:** The temporary session record is deleted.
*   **Response (Status 201):**
    ```json
    {
      "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "user": {
        "id": "uuid-string",
        "email": "daniel@greenterrace.com",
        "firstName": "Daniel",
        "lastName": "Smith",
        "role": "Owner",
        "status": "Invited",
        "businessId": "uuid-business-id"
      }
    }
    ```

---

### Summary of Rules
1.  **Safety:** You cannot call Phase 3 without successfully completing Phase 2.
2.  **Efficiency:** The user provides personal info once (Phase 1) and business info once (Phase 3).
3.  **Consistency:** The email used across all three phases must match.
