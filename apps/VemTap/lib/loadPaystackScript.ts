export function loadPaystackScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window !== 'undefined' && (window as any).PaystackPop) {
      resolve();
      return;
    }

    const timer = setTimeout(
      () =>
        reject(
          new Error(
            'Could not load the payment gateway. Check your internet connection or disable ad-blockers, then try again.',
          ),
        ),
      15000,
    );

    const script = document.createElement('script');
    script.src = 'https://js.paystack.co/v1/inline.js';
    script.async = true;
    script.onload = () => {
      clearTimeout(timer);
      resolve();
    };
    script.onerror = () => {
      clearTimeout(timer);
      reject(new Error('Failed to load the payment gateway. Please try again.'));
    };
    document.head.appendChild(script);
  });
}
