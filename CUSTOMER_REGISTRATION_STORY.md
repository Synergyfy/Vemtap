# 👤 Customer Registration Journey: The Storyline

This storyline guides you through the process of onboarding a new **Customer**. To ensure high-quality leads and security, customers must now verify their email via OTP before their account is fully created.

---

### Phase 1: Requesting Access
**Goal:** The customer provides their email and optional personal details to start the process.

*   **Endpoint:** `POST /api/v1/auth/otp/send`
*   **Payload:**
    ```json
    {
      "email": "alice@gmail.com",
      "firstName": "Alice",
      "lastName": "Johnson",
      "phone": "+2349012345678"
    }
    ```
*   **What happens behind the scenes:**
    1.  The system checks if the email is already registered.
    2.  An OTP record is created, saving the `firstName`, `lastName`, and `phone` in the session metadata.
    3.  A 4-digit code is sent to Alice's email.
*   **Response:**
    ```json
    { "message": "OTP sent successfully" }
    ```

---

### Phase 2: Verifying Identity
**Goal:** Alice proves she has access to the email she provided.

*   **Endpoint:** `POST /api/v1/auth/otp/verify`
*   **Payload:**
    ```json
    {
      "email": "alice@gmail.com",
      "code": "5678"
    }
    ```
*   **What happens behind the scenes:**
    1.  The system verifies the code.
    2.  The session is marked as `isVerified: true`.
*   **Response:**
    ```json
    { "message": "OTP verified successfully" }
    ```

---

### Phase 3: Finalizing the Account
**Goal:** Alice sets her password to complete the registration.

*   **Endpoint:** `POST /api/v1/auth/register`
*   **Payload:**
    ```json
    {
      "email": "alice@gmail.com",
      "password": "secureAlice123!"
    }
    ```
*   **What happens behind the scenes:**
    1.  The system checks for a verified session for `alice@gmail.com`.
    2.  It retrieves the name and phone number from Phase 1's metadata.
    3.  **Account Creation:** The user record is created with the `Customer` role.
    4.  **Auto-Login:** A JWT token is issued.
    5.  **Cleanup:** The verification session is deleted.
*   **Response:**
    ```json
    {
      "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "user": {
        "id": "uuid-string",
        "email": "alice@gmail.com",
        "firstName": "Alice",
        "lastName": "Johnson",
        "role": "Customer"
      }
    }
    ```

---

### Summary of Rules
1.  **Mandatory Verification:** The `register` endpoint will reject any request that hasn't been verified via OTP first.
2.  **Smart Metadata:** If name and phone were provided in Phase 1, they don't need to be sent again in Phase 3 (though they can be overridden if sent again).
3.  **Session Security:** Once the account is created, the OTP session is wiped to prevent reuse.
