import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { SupportBotService } from './support-bot.service';

const INITIAL_KNOWLEDGE = [
  {
    question: 'What is VemTap?',
    answer:
      'Hi {{name}}! VemTap is a visitor engagement platform that uses NFC technology and QR codes to bridge the offline-to-online gap for {{businessName}}. It allows you to capture visitor data, manage contacts, and run automated communication broadcasts.',
    keywords: [
      'what',
      'vemtap',
      'platform',
      'about',
      'visitor engagement',
      'nfc',
      'qr',
    ],
    category: 'general',
    link: '/dashboard',
    buttons: [
      { label: 'Get Started', action: 'url', value: '/auth/signup' },
      { label: 'Learn More', action: 'url', value: '/features' },
    ],
  },
  {
    question: 'How do I top up credits?',
    answer:
      'You currently have {{smsCredits}} SMS credits. You can top up by navigating to Settings > Billing. Credits are used for SMS, WhatsApp, and Email broadcasts.',
    keywords: [
      'topup',
      'credits',
      'balance',
      'billing',
      'buy',
      'sms',
      'whatsapp',
      'payment',
    ],
    category: 'billing',
    link: '/dashboard/settings/billing',
    buttons: [
      { label: 'View Pricing', action: 'url', value: '/pricing' },
      { label: 'Talk to Human', action: 'action', value: 'human_agent' },
    ],
  },
  {
    question: 'My NFC device is not working',
    answer:
      "If your device isn't responding: 1. Ensure NFC is enabled on the phone. 2. Tap the top-center (iPhone) or back-center (Android) against the device. 3. Verify the device is linked in your dashboard. 4. Try restarting your phone.",
    keywords: [
      'nfc',
      'working',
      'tap',
      'device',
      'fail',
      'broken',
      'not responding',
      'nfc issues',
    ],
    category: 'technical',
    link: '/dashboard/devices',
    buttons: [
      { label: 'View Devices', action: 'url', value: '/dashboard/devices' },
      { label: 'Talk to Human', action: 'action', value: 'human_agent' },
    ],
  },
  {
    question: 'How do I create a loyalty program?',
    answer:
      "You can create rewards and loyalty rules in the 'Loyalty' section. Define how many points customers earn per visit or purchase, and what rewards they can redeem. This helps increase customer retention!",
    keywords: [
      'loyalty',
      'rewards',
      'points',
      'redeem',
      'program',
      'loyalty program',
      'customer retention',
    ],
    category: 'features',
    link: '/dashboard/loyalty',
    buttons: [
      {
        label: 'Create Loyalty Program',
        action: 'url',
        value: '/dashboard/loyalty',
      },
      { label: 'Talk to Human', action: 'action', value: 'human_agent' },
    ],
  },
  {
    question: 'How do I create a survey?',
    answer:
      "Navigate to 'Forms & Surveys' to create custom feedback forms. You can link these to your NFC devices to collect data instantly when someone taps. Great for gathering customer insights!",
    keywords: [
      'survey',
      'form',
      'feedback',
      'questions',
      'collect',
      'polls',
      'questionnaire',
    ],
    category: 'features',
    link: '/dashboard/forms',
    buttons: [
      { label: 'Create Survey', action: 'url', value: '/dashboard/forms' },
      { label: 'Learn More', action: 'action', value: 'learn_surveys' },
    ],
  },
  {
    question: 'Where can I see my analytics?',
    answer:
      "Your business analytics are available in the 'Analytics' tab. You can track taps, visitor growth, and messaging performance for {{businessName}}.",
    keywords: [
      'analytics',
      'stats',
      'data',
      'performance',
      'track',
      'reports',
      'dashboard',
      'insights',
    ],
    category: 'features',
    link: '/dashboard/analytics',
    buttons: [
      { label: 'View Analytics', action: 'url', value: '/dashboard/analytics' },
      { label: 'Talk to Human', action: 'action', value: 'human_agent' },
    ],
  },
  {
    question: 'How do I manage my contacts?',
    answer:
      "Go to the 'Contacts' page to view all visitors. You can segment them by behavior, tags, or the device they used to check in. This helps you send targeted messages!",
    keywords: [
      'contacts',
      'visitors',
      'segment',
      'manage',
      'database',
      'leads',
      'customers',
      'address book',
    ],
    category: 'features',
    link: '/dashboard/contacts',
    buttons: [
      { label: 'Manage Contacts', action: 'url', value: '/dashboard/contacts' },
      {
        label: 'Learn About Segmentation',
        action: 'action',
        value: 'learn_segmentation',
      },
    ],
  },
  {
    question: 'How do I set up my digital catalogue?',
    answer:
      "You can add products and categories in the 'Catalogue' section. This allows visitors to browse your offerings directly on their phones after a tap. Perfect for restaurants, retail, and service businesses!",
    keywords: [
      'catalogue',
      'products',
      'menu',
      'store',
      'items',
      'shop',
      'catalog',
      'inventory',
    ],
    category: 'features',
    link: '/dashboard/catalogue',
    buttons: [
      {
        label: 'Set Up Catalogue',
        action: 'url',
        value: '/dashboard/catalogue',
      },
      { label: 'See Demo', action: 'action', value: 'see_demo' },
    ],
  },
  {
    question: 'What is visitor tracking?',
    answer:
      'Visitor tracking allows you to see who visited your business and capture their contact details automatically. When customers tap your NFC device or scan your QR code, their information is saved to your dashboard for follow-up.',
    keywords: [
      'visitor tracking',
      'track visitors',
      'capture',
      'customer data',
      'check-in',
    ],
    category: 'features',
    buttons: [
      { label: 'See How It Works', action: 'url', value: '/features' },
      { label: 'Get Started', action: 'url', value: '/auth/signup' },
    ],
  },
  {
    question: 'What is the messaging feature?',
    answer:
      'The messaging feature lets you chat with your customers directly from your dashboard. You can also set up automated broadcasts to send SMS, WhatsApp, or email messages to your contacts.',
    keywords: [
      'messaging',
      'chat',
      'broadcast',
      'sms',
      'whatsapp',
      'email',
      'communicate',
    ],
    category: 'features',
    buttons: [
      { label: 'View Messaging', action: 'url', value: '/dashboard/messaging' },
      { label: 'Talk to Human', action: 'action', value: 'human_agent' },
    ],
  },
  {
    question: 'How much does VemTap cost?',
    answer:
      'VemTap offers flexible pricing plans for all business sizes. We have a free plan to get started, and you can upgrade as your business grows. Visit our pricing page for details!',
    keywords: [
      'cost',
      'price',
      'pricing',
      'plan',
      'subscription',
      'fees',
      'how much',
      'expensive',
    ],
    category: 'sales',
    buttons: [
      { label: 'View Pricing', action: 'url', value: '/pricing' },
      { label: 'Talk to Human', action: 'action', value: 'human_agent' },
    ],
  },
  {
    question: 'Is there a free plan?',
    answer:
      'Yes! We offer a free plan to help you get started. You can use basic features and test VemTap with your business before upgrading to a paid plan.',
    keywords: [
      'free',
      'free plan',
      'trial',
      'no cost',
      'free trial',
      'starter',
    ],
    category: 'sales',
    buttons: [
      { label: 'Get Started Free', action: 'url', value: '/auth/signup' },
      { label: 'View Pricing', action: 'url', value: '/pricing' },
    ],
  },
  {
    question: 'Can I upgrade later?',
    answer:
      "Absolutely! You can upgrade your plan at any time as your business needs grow. There's no lock-in, and you can scale up or down as needed.",
    keywords: ['upgrade', 'change plan', 'switch', 'upgrade later', 'scale'],
    category: 'billing',
    buttons: [
      { label: 'View Pricing', action: 'url', value: '/pricing' },
      { label: 'Talk to Human', action: 'action', value: 'human_agent' },
    ],
  },
  {
    question: 'Can customers place orders?',
    answer:
      'Yes! Customers can select products or services and submit orders through QR codes or NFC taps. You can then manage these orders from your dashboard.',
    keywords: [
      'order',
      'place order',
      'ordering',
      'purchase',
      'buy',
      'checkout',
    ],
    category: 'features',
    buttons: [
      {
        label: 'Set Up Ordering',
        action: 'url',
        value: '/dashboard/catalogue',
      },
      { label: 'See Demo', action: 'action', value: 'see_demo' },
    ],
  },
  {
    question: 'Do customers pay through VemTap?',
    answer:
      'Currently, VemTap focuses on capturing orders and customer details. Payment integration is handled separately. You can share payment links or handle transactions through your preferred payment method.',
    keywords: ['payment', 'pay', 'transaction', 'flutterwave', 'stripe', 'pos'],
    category: 'features',
    buttons: [
      { label: 'Learn More', action: 'action', value: 'learn_more' },
      { label: 'Talk to Human', action: 'action', value: 'human_agent' },
    ],
  },
  {
    question: 'How do I create an NFC device?',
    answer:
      "Go to your dashboard and navigate to 'Devices'. Click 'Add Device' and follow the instructions to create and link your NFC tags or cards to your business profile.",
    keywords: ['create nfc', 'add nfc', 'nfc device', 'link nfc', 'setup nfc'],
    category: 'technical',
    link: '/dashboard/devices',
    buttons: [
      { label: 'Add Device', action: 'url', value: '/dashboard/devices/new' },
      { label: 'Watch Tutorial', action: 'action', value: 'watch_tutorial' },
    ],
  },
  {
    question: 'How do I send a broadcast message?',
    answer:
      "Navigate to 'Messaging' > 'Broadcasts'. Create a new broadcast, select your contacts (or create a segment), write your message, and choose your channel (SMS, WhatsApp, or Email).",
    keywords: [
      'broadcast',
      'send message',
      'bulk message',
      'mass message',
      'announcement',
    ],
    category: 'features',
    link: '/dashboard/messaging/broadcasts',
    buttons: [
      {
        label: 'Create Broadcast',
        action: 'url',
        value: '/dashboard/messaging/broadcasts/new',
      },
      { label: 'Learn More', action: 'action', value: 'learn_broadcast' },
    ],
  },
  {
    question: 'How do I create a segment?',
    answer:
      "Go to 'Contacts' and click 'Create Segment'. You can segment contacts based on tags, visit frequency, device used, or custom criteria you've set up. This helps you send targeted messages!",
    keywords: [
      'segment',
      'segmentation',
      'target',
      'group',
      'filter',
      'contacts group',
    ],
    category: 'features',
    link: '/dashboard/contacts/segments',
    buttons: [
      {
        label: 'Create Segment',
        action: 'url',
        value: '/dashboard/contacts/segments/new',
      },
      { label: 'Talk to Human', action: 'action', value: 'human_agent' },
    ],
  },
  {
    question: 'Can I use VemTap without internet?',
    answer:
      "Some features require internet, but NFC taps work offline and queue data for sync. We're also exploring USSD options for areas with limited connectivity.",
    keywords: ['offline', 'no internet', 'without internet', 'ussd', 'no data'],
    category: 'general',
    buttons: [
      { label: 'Learn More', action: 'action', value: 'learn_more' },
      { label: 'Talk to Human', action: 'action', value: 'human_agent' },
    ],
  },
  {
    question: 'Can I use my own branding?',
    answer:
      'Yes! Higher plans allow branding customization. You can add your logo, customize colors, and create branded pages for your business.',
    keywords: [
      'branding',
      'custom branding',
      'logo',
      'customize',
      'white label',
    ],
    category: 'features',
    buttons: [
      { label: 'View Pricing', action: 'url', value: '/pricing' },
      { label: 'Talk to Human', action: 'action', value: 'human_agent' },
    ],
  },
  {
    question: 'Can I manage multiple branches?',
    answer:
      'Yes! VemTap supports multiple branches. You can manage all your locations from one dashboard and track performance across branches.',
    keywords: [
      'multiple branches',
      'multi-location',
      'branches',
      'locations',
      'stores',
    ],
    category: 'features',
    buttons: [
      {
        label: 'Set Up Branches',
        action: 'url',
        value: '/dashboard/settings/branches',
      },
      { label: 'Talk to Human', action: 'action', value: 'human_agent' },
    ],
  },
  {
    question: 'Can I make money with VemTap?',
    answer:
      "Yes! You can join our affiliate program and earn commissions by referring businesses to VemTap. It's a great way to earn extra income while helping businesses grow!",
    keywords: [
      'affiliate',
      'earn money',
      'commission',
      'referral',
      'partner',
      'reseller',
    ],
    category: 'sales',
    buttons: [
      {
        label: 'Join Affiliate Program',
        action: 'url',
        value: '/dashboard/affiliate',
      },
      { label: 'Learn More', action: 'action', value: 'learn_affiliate' },
    ],
  },
  {
    question: 'How do I become an affiliate?',
    answer:
      "Sign up for a VemTap account and apply for the affiliate program from your dashboard. Once approved, you'll get a unique referral link to share with businesses!",
    keywords: [
      'become affiliate',
      'join affiliate',
      'affiliate signup',
      'register affiliate',
    ],
    category: 'sales',
    buttons: [
      { label: 'Join Now', action: 'url', value: '/dashboard/affiliate' },
      { label: 'Talk to Human', action: 'action', value: 'human_agent' },
    ],
  },
  {
    question: 'How do I get paid as an affiliate?',
    answer:
      "Affiliates earn commissions based on successful referrals. You'll receive payments directly to your bank account or mobile wallet once you reach the minimum payout threshold.",
    keywords: [
      'get paid',
      'payout',
      'withdraw',
      'commission',
      'earnings',
      'affiliate payment',
    ],
    category: 'sales',
    buttons: [
      {
        label: 'View Earnings',
        action: 'url',
        value: '/dashboard/affiliate/earnings',
      },
      { label: 'Talk to Human', action: 'action', value: 'human_agent' },
    ],
  },
  {
    question: "I don't have money",
    answer:
      'No problem at all! You can start with our free plan and upgrade only when you start seeing results. Zero risk, all reward!',
    keywords: [
      'no money',
      'expensive',
      "can't afford",
      'budget',
      'free',
      'free plan',
    ],
    category: 'sales',
    buttons: [
      { label: 'Get Started Free', action: 'url', value: '/auth/signup' },
      { label: 'View Free Plan', action: 'url', value: '/pricing' },
    ],
  },
  {
    question: "My customers don't use QR codes",
    answer:
      "That's okay! VemTap also works with NFC tags that just require a tap - no app or internet needed for the customer. We also support links that work on any phone browser.",
    keywords: ['customers', 'qr code', 'nfc', 'tap', 'mobile', 'smartphone'],
    category: 'general',
    buttons: [
      { label: 'Learn About NFC', action: 'url', value: '/features/nfc' },
      { label: 'Talk to Human', action: 'action', value: 'human_agent' },
    ],
  },
  {
    question: 'I already use WhatsApp',
    answer:
      "That's great! VemTap actually works alongside WhatsApp by helping you capture and organize customer data automatically. You can use VemTap for data and WhatsApp for communication!",
    keywords: [
      'whatsapp',
      'already use',
      'existing',
      'integration',
      'together',
    ],
    category: 'general',
    buttons: [
      { label: 'See How It Works', action: 'url', value: '/features' },
      {
        label: 'Chat on WhatsApp',
        action: 'url',
        value: 'https://wa.me/234XXXXXXXXXX',
      },
    ],
  },
  {
    question: "I don't understand technology",
    answer:
      'No worries! VemTap is designed to be very simple, and we can guide you step by step. Our team is also available to help you get set up.',
    keywords: [
      'technology',
      'complicated',
      'confused',
      'understand',
      'tech savvy',
      'simple',
    ],
    category: 'support',
    buttons: [
      { label: 'Talk to Human', action: 'action', value: 'human_agent' },
      { label: 'Watch Demo', action: 'url', value: '/demo' },
    ],
  },
  {
    question: 'Why should I use VemTap?',
    answer:
      'VemTap helps you capture customers, increase engagement, and grow your business without stress. Turn every visitor into a potential customer with automated follow-ups and loyalty programs!',
    keywords: [
      'why',
      'benefits',
      'advantages',
      'why use',
      'worth it',
      'should i',
    ],
    category: 'sales',
    buttons: [
      { label: 'See Benefits', action: 'url', value: '/features' },
      { label: 'Get Started', action: 'url', value: '/auth/signup' },
    ],
  },
  {
    question: 'Is it worth it?',
    answer:
      'Yes! Businesses use VemTap to turn visitors into paying customers and build long-term relationships. Our customers see increased repeat visits and better customer retention.',
    keywords: ['worth it', 'value', 'roi', 'return', 'worth', 'results'],
    category: 'sales',
    buttons: [
      { label: 'View Case Studies', action: 'url', value: '/case-studies' },
      { label: 'Talk to Human', action: 'action', value: 'human_agent' },
    ],
  },
  {
    question: 'What makes VemTap different?',
    answer:
      'VemTap focuses on simplicity, data capture, and real business growth - not just tools. We help you actually understand and reach your customers, not just give you software.',
    keywords: [
      'different',
      'competition',
      'vs',
      'compared',
      'unique',
      'special',
    ],
    category: 'sales',
    buttons: [
      { label: 'Compare Plans', action: 'url', value: '/pricing' },
      { label: 'Talk to Human', action: 'action', value: 'human_agent' },
    ],
  },
  {
    question: "I'm ready to get started",
    answer:
      "That's great! Let's get you started immediately. Creating your account takes just a few minutes!",
    keywords: [
      'ready',
      'start now',
      'get started',
      'signup',
      'sign up',
      'begin',
      "let's go",
    ],
    category: 'sales',
    buttons: [
      { label: 'Get Started Now', action: 'url', value: '/auth/signup' },
      { label: 'Talk to Human', action: 'action', value: 'human_agent' },
    ],
  },
  {
    question: 'How do I register my business?',
    answer:
      "Click on 'Get Started' or 'Sign Up', fill in your business details, and create your account. Setup takes just a few minutes!",
    keywords: [
      'register',
      'sign up',
      'create account',
      'business registration',
      'signup',
    ],
    category: 'sales',
    buttons: [
      { label: 'Get Started', action: 'url', value: '/auth/signup' },
      { label: 'Talk to Human', action: 'action', value: 'human_agent' },
    ],
  },
  {
    question: 'What do I need to sign up?',
    answer:
      "You need your business name, phone number, email address, and basic business details. That's it! You can add more later.",
    keywords: [
      'need',
      'requirements',
      'what to prepare',
      'sign up requirements',
    ],
    category: 'sales',
    buttons: [
      { label: 'Sign Up Now', action: 'url', value: '/auth/signup' },
      { label: 'Learn More', action: 'action', value: 'learn_more' },
    ],
  },
  {
    question: 'Is registration free?',
    answer:
      'Yes! VemTap offers a free plan to get started. You can use basic features without any payment.',
    keywords: [
      'free registration',
      'free signup',
      'no cost signup',
      'free account',
    ],
    category: 'sales',
    buttons: [
      { label: 'Create Free Account', action: 'url', value: '/auth/signup' },
      { label: 'View Pricing', action: 'url', value: '/pricing' },
    ],
  },
  {
    question: 'How long does setup take?',
    answer:
      'Setup takes just a few minutes! Create your account, add your NFC devices or QR codes, and start capturing customers right away.',
    keywords: [
      'setup time',
      'how long',
      'quick',
      'fast',
      'time to setup',
      'duration',
    ],
    category: 'general',
    buttons: [
      { label: 'Get Started', action: 'url', value: '/auth/signup' },
      { label: 'Watch Quick Setup', action: 'action', value: 'watch_setup' },
    ],
  },
  {
    question: 'How does VemTap work?',
    answer:
      'VemTap allows businesses to connect with customers through QR codes, NFC taps, or links. Customers interact, and their details are captured for follow-up and engagement.',
    keywords: ['how it works', 'how does', 'process', 'workflow', 'explained'],
    category: 'general',
    buttons: [
      { label: 'See How It Works', action: 'url', value: '/how-it-works' },
      { label: 'Watch Demo', action: 'url', value: '/demo' },
    ],
  },
  {
    question: 'Who can use VemTap?',
    answer:
      'Any business - small, medium, or large - can use VemTap. It works great for retail stores, restaurants, service providers, events, and more!',
    keywords: [
      'who',
      'who can use',
      'business types',
      'target audience',
      '适用对象',
    ],
    category: 'general',
    buttons: [
      { label: 'See Use Cases', action: 'url', value: '/use-cases' },
      { label: 'Get Started', action: 'url', value: '/auth/signup' },
    ],
  },
  {
    question: 'Is VemTap only for Nigeria?',
    answer:
      "VemTap is built for Nigeria but can be used anywhere in the world. We're expanding our features for international use!",
    keywords: [
      'nigeria',
      'location',
      'country',
      'international',
      'global',
      'worldwide',
    ],
    category: 'general',
    buttons: [
      { label: 'Contact Us', action: 'action', value: 'contact' },
      { label: 'Talk to Human', action: 'action', value: 'human_agent' },
    ],
  },
  {
    question: 'What happens when I scan a QR code?',
    answer:
      "You will be directed to the business page where you can interact, place orders, or submit your details. It's quick and easy!",
    keywords: ['scan', 'qr code', 'what happens', 'process', 'tap qr'],
    category: 'general',
    buttons: [
      { label: 'Try It Now', action: 'url', value: '/demo' },
      { label: 'Learn More', action: 'action', value: 'learn_more' },
    ],
  },
  {
    question: 'Is my data safe?',
    answer:
      'Yes! Your data is securely stored and only shared with the business you interacted with. We take data privacy seriously and follow best practices.',
    keywords: [
      'data safety',
      'privacy',
      'security',
      'safe',
      'protect',
      'data protection',
    ],
    category: 'general',
    buttons: [
      { label: 'Read Privacy Policy', action: 'url', value: '/privacy' },
      { label: 'Talk to Human', action: 'action', value: 'human_agent' },
    ],
  },
  {
    question: 'Do I need to download anything?',
    answer:
      'No! Everything works directly from your browser. No app downloads required for businesses or customers!',
    keywords: [
      'download',
      'app',
      'application',
      'install',
      'no app',
      'browser',
    ],
    category: 'general',
    buttons: [
      { label: 'Get Started', action: 'url', value: '/auth/signup' },
      { label: 'Learn More', action: 'action', value: 'learn_more' },
    ],
  },
  {
    question: 'My account is not working',
    answer:
      "Sorry about that! Let me help you troubleshoot. Can you describe the issue you're experiencing? (e.g., can't login, features not working, error messages)",
    keywords: [
      'account',
      'not working',
      'error',
      'issue',
      'problem',
      'login',
      'access',
    ],
    category: 'support',
    buttons: [
      {
        label: 'Reset Password',
        action: 'url',
        value: '/auth/forgot-password',
      },
      { label: 'Talk to Human', action: 'action', value: 'human_agent' },
    ],
  },
  {
    question: 'Thank you',
    answer:
      "You're welcome! 😊 If you need anything else, feel free to ask. I'm here to help!",
    keywords: ['thank', 'thanks', 'appreciate', 'grateful', 'ty'],
    category: 'general',
    buttons: [
      { label: 'Get Started', action: 'url', value: '/auth/signup' },
      { label: 'Talk to Human', action: 'action', value: 'human_agent' },
    ],
  },
  {
    question: 'Bye',
    answer:
      'Goodbye! 👋 Have a great day! Feel free to come back if you need any help.',
    keywords: ['bye', 'goodbye', 'see you', 'later', 'goodnight'],
    category: 'general',
    buttons: [{ label: 'Get Started', action: 'url', value: '/auth/signup' }],
  },
  // Identity & Meta Questions
  {
    question: 'Who are you?',
    answer:
      "I am VemTap's virtual assistant 🤖 I'm here to help you understand how VemTap works and assist you with anything you need.",
    keywords: ['who', 'name', 'identity', 'bot', 'assistant'],
    category: 'general',
    buttons: [
      { label: 'Learn About VemTap', action: 'url', value: '/features' },
      { label: 'Talk to Human', action: 'action', value: 'human_agent' },
    ],
  },
  {
    question: 'Are you a human?',
    answer:
      "I'm an AI assistant created to help you quickly 🤖 But if you need a human, I can connect you right away!",
    keywords: ['human', 'real', 'robot', 'bot', 'ai', 'artificial'],
    category: 'general',
    buttons: [
      { label: 'Talk to Human Agent', action: 'action', value: 'human_agent' },
      {
        label: 'Chat on WhatsApp',
        action: 'url',
        value: 'https://wa.me/234XXXXXXXXXX',
      },
    ],
  },
  {
    question: 'Can I speak to a human?',
    answer:
      'Yes, I can connect you to a human support agent. Please hold on while I arrange that for you.',
    keywords: [
      'speak',
      'human',
      'agent',
      'real person',
      'live support',
      'connect',
    ],
    category: 'support',
    buttons: [
      { label: 'Talk to Human Agent', action: 'action', value: 'human_agent' },
      {
        label: 'Chat on WhatsApp',
        action: 'url',
        value: 'https://wa.me/234XXXXXXXXXX',
      },
    ],
  },
  // High-Intent Detection
  {
    question: 'How do I pay?',
    answer:
      "That's great! Let's get you started immediately. You can sign up and choose a plan from our pricing page 🚀",
    keywords: ['pay', 'payment', 'how to pay', 'start', 'ready', 'begin'],
    category: 'sales',
    buttons: [
      { label: 'Get Started Now', action: 'url', value: '/auth/signup' },
      { label: 'View Pricing', action: 'url', value: '/pricing' },
    ],
  },
  {
    question: 'I want to start now',
    answer:
      "That's great! 🚀 Let's get you started immediately. Creating your account takes just a few minutes!",
    keywords: [
      'start now',
      'ready',
      'begin',
      'lets go',
      'sign me up',
      'i want this',
    ],
    category: 'sales',
    buttons: [
      { label: 'Get Started Now', action: 'url', value: '/auth/signup' },
      { label: 'Talk to Human', action: 'action', value: 'human_agent' },
    ],
  },
  // Objection Handling (Nigerian Market)
  {
    question: "It's too expensive",
    answer:
      'No worries 😊 You can start for free and upgrade only when you see results. VemTap pays for itself by helping you capture more customers!',
    keywords: ['expensive', 'too much', 'costly', 'overpriced', 'price high'],
    category: 'sales',
    buttons: [
      { label: 'Start Free', action: 'url', value: '/auth/signup' },
      { label: 'View Pricing', action: 'url', value: '/pricing' },
    ],
  },
  {
    question: 'I want to grow my business',
    answer:
      "That's great! 🚀 What type of business do you run? VemTap helps businesses capture customers, increase engagement, and grow sales.",
    keywords: [
      'grow',
      'business growth',
      'more customers',
      'increase sales',
      'expand',
    ],
    category: 'sales',
    buttons: [
      { label: 'Fashion', action: 'action', value: 'fashion' },
      { label: 'Restaurant', action: 'action', value: 'restaurant' },
      { label: 'Service', action: 'action', value: 'service' },
      { label: 'Other', action: 'action', value: 'other' },
    ],
  },
];

async function seed() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const botService = app.get(SupportBotService);

  console.log('Seeding comprehensive support knowledge...');

  let added = 0;
  let skipped = 0;

  for (const item of INITIAL_KNOWLEDGE) {
    try {
      await botService.addKnowledge(item);
      added++;
      console.log(`✓ Added: ${item.question}`);
    } catch (e) {
      if (e.code === '23505') {
        skipped++;
        console.log(`○ Skipped (exists): ${item.question}`);
      } else {
        console.error(`✗ Failed: ${item.question}`, e.message);
      }
    }
  }

  console.log(`\nSeeding complete: ${added} added, ${skipped} skipped`);
  await app.close();
}

seed();
