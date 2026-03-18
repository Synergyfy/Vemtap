export const KNOWLEDGE_BASE = [
  {
    category: "Platform Basics",
    topics: [
      {
        question: "What is VemTap?",
        answer: "VemTap is a visitor engagement platform that uses NFC technology to bridge the offline-to-online gap. It allows businesses to capture visitor data, manage contacts, and run automated communication broadcasts."
      },
      {
        question: "How does NFC capture work?",
        answer: "NFC (Near Field Communication) allows users to tap their smartphone against a VemTap device. This action instantly opens a capture form or landing page without requiring an app. The visitor enters their details, which are immediately saved to your dashboard."
      },
      {
        question: "How do I navigate the dashboard?",
        answer: "The dashboard is divided into key sections: 'Home' for an overview, 'Contacts' for your visitor database, 'Channels' for communication, 'Devices' for managing hardware, and 'Settings' for account configuration. You can access these from the sidebar menu."
      }
    ]
  },
  {
    category: "Messaging Tools",
    topics: [
      {
        question: "How do I send a broadcast?",
        answer: "To send a broadcast: 1. Navigate to the 'Channels' tab. 2. Click 'New Message'. 3. Select your audience (e.g., 'All Visitors' or a specific segment). 4. Draft your SMS or Email message. 5. Schedule it for later or send immediately."
      },
      {
        question: "How do I manage contacts?",
        answer: "Go to the 'Contacts' page to view all captured leads. You can filter them by date, device source, or tags. Click on a contact to view their history, add notes, or edit their details."
      }
    ]
  },
  {
    category: "Surveys and Feedback",
    topics: [
      {
        question: "How do I create a feedback form?",
        answer: "Go to 'Forms & Surveys' in the dashboard. Click 'Create New Form', select the 'Feedback' template, customize your questions (star ratings, text fields), and save. You can then link this form to an NFC device."
      },
      {
        question: "Where can I view survey results?",
        answer: "Survey responses are available in the 'Analytics' section under 'Feedback'. You can see aggregated scores and read individual comments."
      }
    ]
  },
  {
    category: "Account Management",
    topics: [
      {
        question: "How do I set up my account?",
        answer: "After signing up, complete your profile in 'Settings > Business Profile'. Upload your logo, set your brand colors, and configure your timezone. Then, link your first NFC device to start capturing data."
      },
      {
        question: "How does billing work?",
        answer: "We offer Free, Basic, and Premium plans. You can view your current plan and invoices in 'Settings > Billing'. Subscriptions are billed monthly or annually."
      }
    ]
  },
  {
    category: "Troubleshooting",
    topics: [
      {
        question: "My NFC device is not working",
        answer: "1. Ensure the phone's NFC is turned on (usually in Settings > Connections). 2. Make sure the phone is unlocked. 3. Tap the top-center of the phone (iPhone) or center/back (Android) against the device. 4. If it still fails, check if the device URL is correctly configured in your dashboard."
      },
      {
        question: "Messages are failing to send",
        answer: "Check your 'Credits' balance in 'Settings > Billing'. If you have sufficient credits, verify that the recipient numbers are valid and include the country code. If the issue persists, contact support."
      }
    ]
  },
  {
    category: "Privacy and Consent",
    topics: [
      {
        question: "How is data handled?",
        answer: "We prioritize data privacy. All visitor data is encrypted and stored securely. We comply with GDPR and local data protection regulations. You own your data and can export or delete it at any time."
      }
    ]
  }
];

export function searchKnowledgeBase(query: string): string {
  const lowerQuery = query.toLowerCase();
  let results: string[] = [];

  for (const category of KNOWLEDGE_BASE) {
    for (const topic of category.topics) {
      if (topic.question.toLowerCase().includes(lowerQuery) || topic.answer.toLowerCase().includes(lowerQuery)) {
        results.push(`**${topic.question}**\n${topic.answer}`);
      }
    }
  }

  if (results.length > 0) {
    return results.slice(0, 3).join("\n\n");
  }

  return "";
}
