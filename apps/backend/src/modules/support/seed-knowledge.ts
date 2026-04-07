import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { SupportBotService } from './support-bot.service';

const INITIAL_KNOWLEDGE = [
  {
    question: "What is VemTap?",
    answer: "Hi {{name}}! VemTap is a visitor engagement platform that uses NFC technology to bridge the offline-to-online gap for {{businessName}}. It allows you to capture visitor data, manage contacts, and run automated communication broadcasts.",
    keywords: ["what", "vemtap", "platform", "about"],
    category: "General",
    link: "/dashboard"
  },
  {
    question: "How do I top up credits?",
    answer: "You currently have {{smsCredits}} SMS credits. You can top up by navigating to Settings > Billing. Credits are used for SMS, WhatsApp, and Email broadcasts.",
    keywords: ["topup", "credits", "balance", "billing", "buy", "sms", "whatsapp"],
    category: "Billing",
    link: "/dashboard/settings/billing"
  },
  {
    question: "My NFC device is not working",
    answer: "If your device isn't responding: 1. Ensure NFC is enabled on the phone. 2. Tap the top-center (iPhone) or back-center (Android) against the device. 3. Verify the device is linked in your dashboard.",
    keywords: ["nfc", "working", "tap", "device", "fail", "broken"],
    category: "Troubleshooting",
    link: "/dashboard/devices"
  },
  {
    question: "How do I create a loyalty program?",
    answer: "You can create rewards and loyalty rules in the 'Loyalty' section. Define how many points customers earn per visit or purchase, and what rewards they can redeem.",
    keywords: ["loyalty", "rewards", "points", "redeem", "program"],
    category: "Loyalty",
    link: "/dashboard/loyalty"
  },
  {
    question: "How do I create a survey?",
    answer: "Navigate to 'Forms & Surveys' to create custom feedback forms. You can link these to your NFC devices to collect data instantly when someone taps.",
    keywords: ["survey", "form", "feedback", "questions", "collect"],
    category: "Surveys",
    link: "/dashboard/forms"
  },
  {
    question: "Where can I see my analytics?",
    answer: "Your business analytics are available in the 'Analytics' tab. You can track taps, visitor growth, and messaging performance for {{businessName}}.",
    keywords: ["analytics", "stats", "data", "performance", "track", "reports"],
    category: "Analytics",
    link: "/dashboard/analytics"
  },
  {
    question: "How do I manage my contacts?",
    answer: "Go to the 'Contacts' page to view all visitors. You can segment them by behavior, tags, or the device they used to check in.",
    keywords: ["contacts", "visitors", "segment", "manage", "database", "leads"],
    category: "Contacts",
    link: "/dashboard/contacts"
  },
  {
    question: "How do I set up my digital catalogue?",
    answer: "You can add products and categories in the 'Catalogue' section. This allows visitors to browse your offerings directly on their phones after a tap.",
    keywords: ["catalogue", "products", "menu", "store", "items", "shop"],
    category: "Catalogue",
    link: "/dashboard/catalogue"
  }
];

async function seed() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const botService = app.get(SupportBotService);

  console.log('Seeding expanded support knowledge...');

  for (const item of INITIAL_KNOWLEDGE) {
    try {
      await botService.addKnowledge(item);
      console.log(`Added: ${item.question}`);
    } catch (e) {
      console.error(`Failed to add: ${item.question}`, e.message);
    }
  }

  await app.close();
  console.log('Seeding complete.');
}

seed();
