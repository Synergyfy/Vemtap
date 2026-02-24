# Implementation Plan - Admin Product Integration

Currently, the "Add New Product" flow in the Admin dashboard is UI-only. While the form functions, it doesn't actually persist data to the backend. This plan outlines the steps to connect the frontend to the `adminProductsApi`.

## 1. Research & Analysis
- **API Review**: Verify the `adminProductsApi.create` payload requirements in `lib/api/admin.ts`.
- **Form State**: Review `useProductFormStore.ts` to ensure the `formData` structure aligns with the API expectations (including image handling).
- **Component Review**: Identify where the "Publish" action is triggered in `StepPricing.tsx`.

## 2. Infrastructure Updates
- **API Layer**: Check if any additional endpoints are needed (e.g., image upload endpoints if the backend requires separate handling for files).
- **Store Updates**: Ensure the store correctly clears data after a successful creation.

## 3. Component Integration
- **StepPricing.tsx**: 
    - Implement `useMutation` from `@tanstack/react-query`.
    - Replace the direct `nextStep()` call with the mutation trigger.
    - Add loading states to the "Publish" button.
    - Handle success/error notifications.
- **Product List Page**: 
    - Implement "Delete" functionality using `adminProductsApi.delete`.
    - Ensure the list refetches/invalidates after a delete action.

## 4. Verification
- **Testing**:
    - Create a test product with images and volume discounts.
    - Verify the product appears in the main `/admin/products` list.
    - Verify the "Delete" action removes the product from the list.
- **Error Handling**: Test API failure scenarios (e.g., network error, validation error).

## 5. Polish
- Add subtle toast notifications for success/error feedback.
- Ensure smooth transitions between the form steps and the success page.
