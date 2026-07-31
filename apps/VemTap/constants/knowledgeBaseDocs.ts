export type ContentBlock =
    | { type: 'heading'; text: string }
    | { type: 'text'; text: string }
    | { type: 'steps'; items: string[] }
    | { type: 'image'; url: string; caption?: string };

export interface KBPage {
    id: string;
    title: string;
    path: string;
    summary: string;
    thumbnail?: string;
    blocks: ContentBlock[];
    tips?: string[];
}

export interface KBSection {
    id: string;
    title: string;
    pages: KBPage[];
}

export interface KBCategory {
    id: string;
    title: string;
    sections: KBSection[];
}

export interface LegacyPage {
    id: string;
    title: string;
    path: string;
    summary: string;
    content: string;
    tips?: string[];
}

export interface LegacySection {
    id: string;
    title: string;
    pages: LegacyPage[];
}

export interface LegacyCategory {
    id: string;
    title: string;
    sections: LegacySection[];
}

export function parseLegacyContent(content: string): ContentBlock[] {
    const blocks: ContentBlock[] = [];
    const lines = content.split('\n').map((l) => l.trim());
    let steps: string[] = [];
    const flushSteps = () => {
        if (steps.length) {
            blocks.push({ type: 'steps', items: steps });
            steps = [];
        }
    };
    for (const line of lines) {
        if (!line) {
            flushSteps();
            continue;
        }
        if (line.startsWith('**') && line.endsWith('**')) {
            flushSteps();
            blocks.push({ type: 'heading', text: line.replace(/\*\*/g, '') });
            continue;
        }
        if (/^\d+\.\s/.test(line)) {
            steps.push(line.replace(/^\d+\.\s/, ''));
            continue;
        }
        flushSteps();
        blocks.push({ type: 'text', text: line });
    }
    flushSteps();
    return blocks;
}

export const LEGACY_DOCS: LegacyCategory[] = [
  {
    id: 'cat-dashboard',
    title: 'Dashboard',
    sections: [
      {
        id: 'sec-main',
        title: 'Overview',
        pages: [
          {
            id: 'dashboard-home',
            title: 'Dashboard',
            path: '/dashboard',
            summary: 'Your home base. See how your business is doing at a glance.',
            content: 'The Dashboard is the first thing you see when you log in. It gives you a quick snapshot of how your business is performing so you always know what\'s happening.\n\nKey numbers are shown at the top — total customers who visited today, sales made, new leads collected, and active visitors right now. Below that, simple charts show your trends over time so you can spot if business is picking up or slowing down.\n\nYou will also see recent orders that need your attention, quick links to your most-used features, and any important notifications from the platform.\n\nTip: Use this page as your morning check-in. A quick scan tells you if anything needs your attention before you start your day.',
            tips: ['Check your Dashboard first thing each day for a quick health check', 'Use the notification bell to stay on top of orders and updates']
          }
        ]
      }
    ]
  },
  {
    id: 'cat-store',
    title: 'My Store',
    sections: [
      {
        id: 'sec-sales',
        title: 'Sales',
        pages: [
          {
            id: 'sales-dashboard',
            title: 'Sales Dashboard',
            path: '/dashboard/sales',
            summary: 'See all your sales activity in one place — totals, trends, and what needs attention.',
            content: 'The Sales Dashboard is where you get the full picture of everything coming through your register. It shows total sales for today, this week, and this month so you can track how business is doing.\n\nYou will see a list of recent transactions, any orders that still need processing, and a breakdown of payment methods used (cash, card, etc.). Charts help you spot busy days and slow days so you can plan your staffing and inventory better.\n\nYou can also filter by date range to compare different periods — useful for seeing if a promotion or change actually helped increase sales.',
            tips: ['Review your sales dashboard at the end of each day to spot trends', 'Use the date filter to compare week-over-week performance']
          },
          {
            id: 'pos-home',
            title: 'POS Home',
            path: '/dashboard/pos',
            summary: 'The main screen where you ring up customer purchases.',
            content: 'The POS (Point of Sale) Home is your digital cash register. This is where you create new sales for customers who are buying from you.\n\nTo make a sale, simply search for the products the customer wants and add them to the cart. You can adjust quantities, apply discounts, and see the total in real time. When ready, choose a payment method (cash, card, or other) and complete the sale.\n\nThe POS also shows your active register status, quick-access product categories, and recent transactions in case you need to look something up.\n\nEvery sale you make here is automatically recorded in your inventory, so stock levels update without you having to think about it.',
            tips: ['Set up your most-sold items as favorites for faster checkout', 'Always verify the payment amount before completing a sale']
          },
          {
            id: 'pos-orders',
            title: 'Orders',
            path: '/dashboard/pos/orders',
            summary: 'View and manage all customer orders, including pending and completed ones.',
            content: 'The Orders page keeps track of every order placed through your business — whether it was rung up at the counter or placed through your online catalogue.\n\nOrders are shown in a simple list with their status (new, processing, completed, cancelled). You can click any order to see the full details — what was bought, how much it cost, and who the customer is.\n\nFor new orders, you can mark them as processing when you start working on them, and completed once they are ready. This helps you stay organized and makes sure no order falls through the cracks.',
            tips: ['Check for new orders first thing in the morning', 'Mark orders as completed promptly to keep your list clean']
          },
          {
            id: 'pos-settings',
            title: 'POS Settings',
            path: '/dashboard/pos/settings',
            summary: 'Configure how your point of sale works — receipts, payments, and more.',
            content: 'POS Settings lets you customize how your register works so it fits your business perfectly.\n\nYou can set up receipt preferences (what appears on printed or emailed receipts), configure payment methods you accept, set tax rates, and choose how your product catalog is displayed at checkout.\n\nYou can also manage your registers here — if you have multiple registers at different counters or locations, you can set them up individually.',
            tips: ['Set up your tax rate correctly from day one to avoid issues later', 'Customize your receipt to include your business logo and contact info']
          },
          {
            id: 'pos-help',
            title: 'POS Help',
            path: '/dashboard/pos/support',
            summary: 'Get help with your POS — FAQ, live chat, and contact options.',
            content: 'The POS Help page is your support hub for anything related to using the register. It has three ways to get assistance:\n\n1. **Live Chat** — Opens the VemTap Support chatbot where you can type your question and get an instant answer from our bot or a real person.\n2. **Email Support** — Send us a detailed message and our team will get back to you within 24 hours.\n3. **Knowledge Base** — Opens this documentation library where you can browse guides for every feature.\n\nThere is also a Frequently Asked Questions section with answers to common questions about using the POS.',
            tips: ['Try the FAQ first — your question may already be answered', 'Live Chat is the fastest way to get help during business hours']
          }
        ]
      },
      {
        id: 'sec-products',
        title: 'Products & Stock',
        pages: [
          {
            id: 'products-overview',
            title: 'Overview',
            path: '/dashboard/products-stock',
            summary: 'The hub for everything related to your products and stock levels.',
            content: 'Products & Stock Overview is your starting point for managing what you sell. From here, you can jump to your product catalogue, check stock levels, and see which items are running low.\n\nThe page shows a summary of your total products, items that are low in stock, and any recent changes to your inventory. Quick-action buttons let you add new products or receive stock from a supplier without navigating through multiple pages.\n\nThink of this as mission control for your merchandise — everything starts here.',
            tips: ['Keep an eye on the low-stock alerts so you never run out of best-sellers', 'Use the quick-add button when you get new products in']
          },
          {
            id: 'catalogue',
            title: 'Catalogue',
            path: '/dashboard/catalogue',
            summary: 'Your product catalog — add, edit, and organize everything you sell.',
            content: 'The Catalogue is where you manage your complete list of products. You can add new items, update prices, upload photos, organize products into categories, and decide which items are available for sale.\n\nEach product entry includes the name, price, description, category, and an image. You can also set options like whether the product can be sold online or only in-store.\n\nThe catalogue connects directly to your POS and inventory — when you add a product here, it is ready to sell at the register and its stock can be tracked automatically.',
            tips: ['Use clear, descriptive names and categories so your staff can find products quickly', 'Add photos for every product — it helps at checkout and looks professional']
          },
          {
            id: 'inventory',
            title: 'Inventory',
            path: '/dashboard/inventory',
            summary: 'Track how much stock you have and manage incoming supplies.',
            content: 'The Inventory page shows you exactly how much of each product you have in stock. You can see quantities, reorder levels, and the total value of your stock.\n\nWhen you sell items through the POS, inventory numbers go down automatically. When you receive new stock from a supplier, you can log it here and the numbers go back up.\n\nThis page helps you answer important questions like "Do I need to reorder?" and "Which products are my best-sellers by volume?" without having to count everything by hand.',
            tips: ['Set reorder alerts for your top-selling items so you never run out', 'Do a physical count regularly and adjust inventory if needed']
          }
        ]
      },
      {
        id: 'sec-customers',
        title: 'Customers',
        pages: [
          {
            id: 'customers-overview',
            title: 'Overview',
            path: '/dashboard/customers',
            summary: 'See your customer base at a glance — who they are and how they engage.',
            content: 'The Customers Overview gives you a bird\'s-eye view of everyone who interacts with your business. You can see how many customers you have, how many are new versus returning, and how they are engaging with your loyalty program.\n\nKey metrics show your total customer count, new customers added recently, and engagement rates. Quick links let you jump to your full customer list, loyalty program, and visitor tracking.\n\nThis is where you get to know your audience without digging through multiple screens.',
            tips: ['Check which customers are returning often — they are your most valuable', 'Use the data here to decide what promotions might work best']
          },
          {
            id: 'customer-list',
            title: 'Customer List',
            path: '/dashboard/pos/customers',
            summary: 'Your full customer directory — search, view, and manage every contact.',
            content: 'The Customer List is a complete directory of everyone who has visited your business or made a purchase. You can search for any customer by name, phone number, or email.\n\nEach customer record shows their contact details, total visits, how much they have spent, and their loyalty points. You can click into any customer to see their full history — every visit, purchase, and interaction.\n\nThis is perfect for looking up a customer\'s details when they call or visit, or for understanding your best customers better.',
            tips: ['Use the search bar to quickly find a customer when they are at your counter', 'Review high-spending customers and consider sending them a thank-you offer']
          },
          {
            id: 'loyalty',
            title: 'Loyalty Program',
            path: '/dashboard/loyalty',
            summary: 'Set up and manage a rewards program to keep customers coming back.',
            content: 'The Loyalty page lets you create a rewards program that encourages customers to keep choosing your business. You decide how it works — for example, give one point for every dollar spent, and let customers redeem 100 points for a free item or discount.\n\nYou can set up different reward tiers, decide what actions earn points (like making a purchase or referring a friend), and choose what rewards are available.\n\nThe page shows how many customers are enrolled, points earned and redeemed, and the overall impact of your program on repeat business.\n\nA good loyalty program turns occasional visitors into regulars.',
            tips: ['Start simple — one point per dollar and one free reward is enough to begin', 'Promote your loyalty program at the register so customers know to sign up']
          },
          {
            id: 'visitors',
            title: 'Visitors',
            path: '/dashboard/visitors',
            summary: 'Track everyone who walks through your door — new and returning visitors.',
            content: 'The Visitors page lets you see every person who has visited your business, whether they made a purchase or not. Visitors are captured when they tap your NFC device or scan your QR code.\n\nYou can see which visitors are new (first time) versus returning, look at visit frequency, and view detailed profiles for each visitor including their visit history.\n\nThis is especially useful for businesses that want to understand foot traffic patterns — like how many people come in on weekends versus weekdays, and how many first-time visitors turn into regulars.',
            tips: ['Encourage every visitor to tap or scan so you get accurate foot traffic data', 'Use the returning vs. new visitor data to measure if your marketing is working']
          }
        ]
      }
    ]
  },
  {
    id: 'cat-engagement',
    title: 'Customer Engagement',
    sections: [
      {
        id: 'sec-chat',
        title: 'Messaging',
        pages: [
          {
            id: 'in-app-chat',
            title: 'In-App Chat',
            path: '/dashboard/messaging/chat',
            summary: 'Chat directly with customers one-on-one, right from your dashboard.',
            content: 'In-App Chat is your private messaging tool for talking directly with customers. When a customer reaches out to you through your business profile, their messages appear here.\n\nYou can have real-time conversations, send photos, and reply at your convenience. Each conversation shows the customer\'s name and when they last messaged so you can prioritize who needs a response.\n\nThis is perfect for answering questions about products, helping customers with orders, or just building a stronger relationship with the people who support your business.',
            tips: ['Try to respond to customer messages within a few hours for the best experience', 'Use chat to follow up with customers after they make a purchase']
          }
        ]
      },
      {
        id: 'sec-channels',
        title: 'Campaigns',
        pages: [
          {
            id: 'channels',
            title: 'Channels',
            path: '/dashboard/messaging',
            summary: 'Send broadcast messages to your customers via SMS, WhatsApp, or Email.',
            content: 'The Channels page is your command center for sending messages to multiple customers at once. You can create campaigns that go out as SMS text messages, WhatsApp messages, or emails.\n\nTo send a campaign, choose your channel (SMS, WhatsApp, or Email), pick your audience (all customers, a specific group, or only loyal customers), write your message, and send it. You can also schedule messages to go out at a later date and time.\n\nThe page also shows your messaging balance — how many SMS credits you have left — and your sending history so you can see what has been sent and how many people received it.\n\nBroadcast messaging is a powerful way to announce sales, send reminders, or share news with everyone at once.',
            tips: ['Personalize messages with the customer\'s name for better responses', 'Send campaigns during business hours for the best open rates']
          },
          {
            id: 'messaging-compose',
            title: 'Compose Campaign',
            path: '/dashboard/messaging/compose',
            summary: 'Create and send a new broadcast campaign step by step.',
            content: 'The Compose page walks you through creating a new message campaign from start to finish.\n\nFirst, choose what channel to send through (SMS, WhatsApp, or Email). Then pick who should receive the message — you can send to everyone, or target specific customer groups. Write your message, add any links or attachments, and review everything before sending.\n\nYou can also include a link to a form in your message, which is great for collecting feedback or sign-ups.\n\nOnce you are happy with your campaign, send it immediately or schedule it for later.',
            tips: ['Preview your message before sending to catch any mistakes', 'Schedule campaigns for times when customers are most likely to read them']
          },
          {
            id: 'messaging-history',
            title: 'Campaign History',
            path: '/dashboard/messaging/history',
            summary: 'See all the campaigns you have sent and how they performed.',
            content: 'Campaign History shows every message you have ever sent through the platform. You can see what was sent, when, to how many people, and how many were successfully delivered.\n\nFor each campaign, you can view details like the number of people who opened the message, clicked on links, or replied. This helps you understand what kind of messages your customers actually want to receive.\n\nUse this data to improve your future campaigns — if one message got lots of opens, try a similar approach next time.',
            tips: ['Compare different campaigns to see what messaging style works best', 'Check delivery rates to make sure your messages are reaching customers']
          },
          {
            id: 'messaging-sms',
            title: 'SMS Settings',
            path: '/dashboard/messaging/sms',
            summary: 'Set up and manage your SMS messaging — templates, credits, and settings.',
            content: 'The SMS page is where you manage everything related to text message campaigns. You can create and save message templates so you don\'t have to write the same message from scratch every time.\n\nYou can also buy SMS credits here if you are running low, view your current balance, and see your SMS sending history with delivery status for each message.\n\nSMS settings let you configure your sender name (the name that appears as the sender on customers\' phones) and other preferences.',
            tips: ['Save your most-used messages as templates to save time', 'Buy credits before you run out so there is no gap in your campaigns']
          },
          {
            id: 'messaging-whatsapp',
            title: 'WhatsApp Settings',
            path: '/dashboard/messaging/whatsapp',
            summary: 'Manage WhatsApp campaigns — templates, setup, and sending.',
            content: 'The WhatsApp page lets you send broadcast messages through WhatsApp to customers who have opted in. You can create message templates that are pre-approved so your messages always go through smoothly.\n\nSee your sending history, delivery rates, and manage your WhatsApp sender settings. WhatsApp messages tend to have very high open rates, making this a great channel for important announcements.\n\nNote that customers need to have opted in to receive WhatsApp messages from your business.',
            tips: ['Use WhatsApp for urgent or time-sensitive announcements', 'Keep messages short and include a clear call to action']
          },
          {
            id: 'messaging-email',
            title: 'Email Settings',
            path: '/dashboard/messaging/email',
            summary: 'Set up email campaigns — design templates, send, and track opens.',
            content: 'The Email page lets you create and send email campaigns to your customer list. You can design professional-looking emails with your business branding, images, and links.\n\nCreate reusable email templates so your campaigns always look consistent. Track how many people opened your email and clicked on links so you know what works.\n\nEmail is great for longer messages, newsletters, promotions with images, and detailed updates about your business.',
            tips: ['Use images in your emails to make them more engaging', 'Write clear subject lines so customers know what the email is about']
          }
        ]
      },
      {
        id: 'sec-forms',
        title: 'Data Collection',
        pages: [
          {
            id: 'forms',
            title: 'Forms Hub',
            path: '/dashboard/forms',
            summary: 'Create and manage forms to collect information from your customers.',
            content: 'The Forms Hub is where you manage all the forms your business uses to collect information from customers. This could be a feedback form, a sign-up form, a survey, or any other type of data collection.\n\nYou can see all your forms in one place, check how many responses each one has received, and share links to your forms with customers. The default form is already set up and ready to use — just share the link.\n\nForms are a simple way to gather feedback, learn what customers want, and grow your contact list.',
            tips: ['Start with the default form — it works right out of the box', 'Share your form link on social media and in your messages']
          },
          {
            id: 'form-builder',
            title: 'Form Creator',
            path: '/dashboard/engagement/forms',
            summary: 'Build custom forms with the questions you want to ask.',
            content: 'The Form Creator lets you build your own forms from scratch. You can add different types of questions — multiple choice, text answers, ratings, and more.\n\nCustomize the design to match your brand, add your logo, and choose what happens after someone submits the form (like showing a thank-you message or redirecting to your website).\n\nEach form can be linked to specific branches, so you can have different forms for different locations if needed.\n\nOnce published, you get a shareable link that you can send to customers through messages, social media, or your website.',
            tips: ['Keep forms short — customers are more likely to complete them', 'Add a mix of question types to keep it interesting']
          },
          {
            id: 'form-responses',
            title: 'Form Responses',
            path: '/dashboard/engagement/forms/responses',
            summary: 'View and analyze responses collected from your forms.',
            content: 'The Form Responses page shows you all the answers customers have submitted through your forms. You can see response counts, charts showing popular answers, and individual submissions.\n\nFilter responses by form, date range, or branch to find exactly what you are looking for. You can also export responses to a spreadsheet for further analysis.\n\nUse this data to make informed decisions — if customers consistently say they want longer hours or a specific product, you can act on that feedback.',
            tips: ['Review new responses regularly to stay on top of customer feedback', 'Export data to a spreadsheet for deeper analysis']
          }
        ]
      }
    ]
  },
  {
    id: 'cat-experience',
    title: 'Customer Experience',
    sections: [
      {
        id: 'sec-qr',
        title: 'QR & Branding',
        pages: [
          {
            id: 'my-business-qr',
            title: 'My Business QR',
            path: '/dashboard/customer-experience',
            summary: 'Your business QR code — the main way customers find and interact with you.',
            content: 'My Business QR is the digital doorway to your business. When customers scan this QR code, they land on your business profile where they can tap to register their visit, leave feedback, browse your products, and more.\n\nYou can customize what happens when someone scans your QR code — for example, send them to your main profile, a specific branch page, or a promotion. You can download your QR code as a high-quality image to print on flyers, posters, stickers, or display it at your counter.\n\nThis single QR code replaces paper forms and manual sign-ins, making it effortless for customers to engage with you.',
            tips: ['Display your QR code prominently at your entrance and counter', 'Download and print the code on table tents, business cards, and windows']
          }
        ]
      },
      {
        id: 'sec-marketing',
        title: 'Promotional Materials',
        pages: [
          {
            id: 'marketing-assets',
            title: 'Marketing Kit',
            path: '/dashboard/marketing-assets',
            summary: 'Ready-to-use printable materials to promote your business.',
            content: 'The Marketing Kit gives you professionally designed printable materials that you can customize with your business details and use right away.\n\nYou can create flyers, posters, stickers, table tents, and social media graphics — all pre-designed and ready for you to add your business name, logo, and QR code.\n\nSimply pick a design, customize the text and colors to match your brand, download the file, and print it or share it online. No design skills needed.',
            tips: ['Print stickers with your QR code and place them on takeaway bags', 'Create seasonal posters to promote special offers']
          }
        ]
      }
    ]
  },
  {
    id: 'cat-discovery',
    title: 'Get Customers',
    sections: [
      {
        id: 'sec-discovery',
        title: 'Growth Tools',
        pages: [
          {
            id: 'get-customers',
            title: 'Get Customers',
            path: '/dashboard/discovery',
            summary: 'Tools and features to help new customers find your business.',
            content: 'Get Customers is your growth hub. It shows you all the ways VemTap can help bring new people through your door.\n\nYou can see how customers are finding your business, manage your business listing, and access features that make your business more discoverable to people looking for what you offer.\n\nThe more complete your business profile is — with photos, accurate hours, and a description of what you offer — the easier it is for potential customers to find and choose you.',
            tips: ['Keep your business profile complete and up to date', 'Add photos of your products and location to attract more customers']
          },
          {
            id: 'business-partnership',
            title: 'Business Partnership',
            path: '/dashboard/business-partnership',
            summary: 'Partner with other businesses to reach new customers.',
            content: 'Business Partnership lets you connect with other businesses in your area to cross-promote and share customers.\n\nFor example, a coffee shop and a bookstore could partner so that customers who visit one get a special offer at the other. This helps both businesses reach new people who are already in the neighborhood.\n\nYou can view available partnership opportunities, see active partnerships, and track how many new customers came through your partnerships.',
            tips: ['Partner with businesses that complement yours, not direct competitors', 'Start with one partnership and expand as you see results']
          }
        ]
      }
    ]
  },
  {
    id: 'cat-analytics',
    title: 'Analytics',
    sections: [
      {
        id: 'sec-analytics',
        title: 'Reports & Insights',
        pages: [
          {
            id: 'analytics-overview',
            title: 'Overview',
            path: '/dashboard/analytics',
            summary: 'High-level view of your business performance across all areas.',
            content: 'The Analytics Overview brings together key numbers from across your business so you can see the big picture. It shows visitor trends, sales performance, customer growth, and engagement metrics all in one place.\n\nUse the date range picker to look at different periods — compare this month to last month, or see how your business is doing year-over-year. Charts make it easy to spot trends at a glance.\n\nThis is your go-to page for understanding if your business is heading in the right direction.',
            tips: ['Review your analytics weekly to stay on top of trends', 'Compare the same period last month to account for seasonal changes']
          },
          {
            id: 'analytics-ai',
            title: 'AI Reports',
            path: '/dashboard/analytics/ai-reports',
            summary: 'Smart summaries and insights generated automatically from your data.',
            content: 'AI Reports uses smart technology to analyze your business data and give you simple, easy-to-understand summaries. Instead of looking at raw numbers, you get plain-language insights about what is working and what could be better.\n\nThe AI can tell you things like "Your foot traffic has increased by 20% on weekends" or "Customers who visit on Tuesdays tend to spend more." These insights help you make better decisions without needing to be a data expert.\n\nNew AI reports are generated automatically based on your recent data.',
            tips: ['Check AI reports weekly for insights you might miss in raw data', 'Use the AI suggestions to try new strategies and see if they work']
          },
          {
            id: 'analytics-sales',
            title: 'Sales Reports',
            path: '/dashboard/analytics/sales',
            summary: 'Detailed breakdown of your sales — by product, time, and payment method.',
            content: 'Sales Reports give you a deep look into your sales data. You can see which products sell the most, which days of the week are busiest, and how customers prefer to pay.\n\nFilter by date range, product category, or payment method to answer specific questions like "How much did I make from coffee sales this month?" or "Are more customers paying by card or cash?"\n\nExport any report to a spreadsheet if you need to share it with your accountant or business partner.',
            tips: ['Use product-level reports to decide which items to promote', 'Compare sales before and after a promotion to see if it was effective']
          },
          {
            id: 'analytics-inventory',
            title: 'Inventory Reports',
            path: '/dashboard/analytics/inventory',
            summary: 'Understand your stock movement — what sells fast and what sits on the shelf.',
            content: 'Inventory Reports help you understand how your stock is moving. You can see which products sell fastest, which ones are slow-moving, and the total value of inventory you are holding.\n\nThis information helps you make smarter buying decisions — stock up on fast-selling items and avoid over-ordering products that don\'t move. It also helps you identify when it is time to run a promotion on slow-moving stock.\n\nKeeping the right amount of stock means you have what customers want without tying up too much money in inventory.',
            tips: ['Run this report monthly to fine-tune your ordering', 'Focus on promoting slow-moving items before they go out of season']
          },
          {
            id: 'analytics-customers',
            title: 'Customer Reports',
            path: '/dashboard/analytics/customers',
            summary: 'Understand your customer base — who they are and how they behave.',
            content: 'Customer Reports show you detailed information about the people who visit your business. You can see how many new customers you are gaining, how often existing customers return, and how much different customer groups spend.\n\nSegment your customers by how often they visit, how much they spend, or when they last came in. This helps you identify your most valuable customers and create offers that bring back customers who haven\'t visited in a while.\n\nA business that knows its customers well is a business that grows.',
            tips: ['Identify your top 10% of customers and find ways to reward them', 'Create a re-engagement offer for customers who have not visited in 30+ days']
          },
          {
            id: 'analytics-discovery',
            title: 'Discovery Reports',
            path: '/dashboard/analytics/discovery',
            summary: 'See how customers are finding your business through the platform.',
            content: 'Discovery Reports show you how new customers are discovering your business. You can see which channels bring the most visitors — whether they found you through search, partner referrals, or direct visits.\n\nThis data helps you focus your marketing efforts on the channels that actually work. If most customers find you through partner referrals, you might want to build more partnerships. If search brings the most traffic, you should keep your business profile complete and up to date.',
            tips: ['Focus your energy on the channels that bring the most customers', 'Experiment with different approaches and compare results']
          },
          {
            id: 'analytics-footfall',
            title: 'Footfall Analytics',
            path: '/dashboard/analytics/footfall',
            summary: 'Track how many people visit your business and when they come.',
            content: 'Footfall Analytics shows you the traffic patterns of your business — how many people come in each day, which days are busiest, and what times of day see the most visitors.\n\nThis is incredibly useful for staffing decisions. If you know Tuesday afternoons are always quiet, you can schedule fewer staff. If Friday evenings are packed, you can make sure you have enough people on the floor.\n\nYou can also compare footfall from different periods to see if your marketing efforts are actually bringing more people through the door.',
            tips: ['Use footfall data to create your staff schedule', 'Compare footfall before and after promotions to measure their impact']
          },
          {
            id: 'analytics-marketing',
            title: 'Marketing Reports',
            path: '/dashboard/analytics/marketing',
            summary: 'Measure how well your campaigns and marketing efforts are performing.',
            content: 'Marketing Reports show you the impact of your campaigns and promotional efforts. You can see how many people received your messages, how many opened them, and how many took action — like visiting your business or redeeming an offer.\n\nCompare different campaigns side by side to see what messaging style, channel, and timing works best. This takes the guesswork out of marketing and lets you focus on what actually gets results.\n\nGood marketing is not about sending more messages — it is about sending the right messages.',
            tips: ['Track which campaigns lead to actual visits, not just opens', 'A/B test different message styles and compare the results']
          },
          {
            id: 'analytics-peak-times',
            title: 'Peak Times',
            path: '/dashboard/analytics/peak-times',
            summary: 'Know exactly when your business is busiest and quietest.',
            content: 'Peak Times gives you a clear picture of your busy periods. A simple heatmap shows which days and hours see the most foot traffic, so you can plan accordingly.\n\nUse this information to schedule staff when you need them most, plan promotions during slow periods to bring in more customers, and make sure you are fully stocked for your busiest times.\n\nKnowing your peak times turns guesswork into a reliable schedule that saves you money and keeps customers happy.',
            tips: ['Schedule your best staff during peak hours', 'Run happy-hour style promotions during slow periods to boost traffic']
          }
        ]
      }
    ]
  },
  {
    id: 'cat-management',
    title: 'Manage Location',
    sections: [
      {
        id: 'sec-team',
        title: 'Team & Locations',
        pages: [
          {
            id: 'staff',
            title: 'Staff',
            path: '/dashboard/staff',
            summary: 'Manage your team — add staff, set roles, and control permissions.',
            content: 'The Staff page lets you manage everyone who works with your business on the platform. You can add new team members, assign them roles (like manager, cashier, or inventory manager), and control what each person can access.\n\nEach staff member gets their own login, and you decide what they can see and do. For example, a cashier might only need access to the POS, while a manager can see reports and manage products.\n\nYou can also view staff activity logs to see what changes each person made and when.',
            tips: ['Only give staff the access they need to do their job', 'Review your staff list regularly and remove anyone who no longer works with you']
          },
          {
            id: 'locations',
            title: 'Locations',
            path: '/dashboard/settings/branches',
            summary: 'Manage different branches or locations of your business.',
            content: 'The Locations page lets you manage all the different branches or outlets of your business. If you have more than one location, you can set up each one separately with its own address, contact details, settings, and staff.\n\nYou can also set one location as your main or default branch. Each branch can have its own products, pricing, and inventory if needed.\n\nHaving multiple locations set up correctly ensures that customer data and sales are tracked to the right place.',
            tips: ['Set up each branch with accurate address and contact information', 'Use the branch switcher in the sidebar to quickly move between locations']
          }
        ]
      }
    ]
  },
  {
    id: 'cat-qrthrive',
    title: 'QRThrive',
    sections: [
      {
        id: 'sec-qrthrive',
        title: 'Integration',
        pages: [
          {
            id: 'explore-qrthrive',
            title: 'Explore QRThrive',
            path: '/dashboard/explore-qrthrive',
            summary: 'Discover how QRThrive works with VemTap to give you even more tools.',
            content: 'QRThrive is a powerful tool that combines with VemTap to help you capture more customer information and create smarter marketing campaigns.\n\nWith QRThrive, you can create custom QR codes that do more than just point to your profile — they can trigger specific actions like sending a welcome message, applying a discount, or directing customers to a specific page based on the time of day or location.\n\nExplore the features, see how the integration works, and decide if QRThrive is right for your business.',
            tips: ['QRThrive is great for advanced marketing campaigns', 'Start with one campaign and expand once you see results']
          }
        ]
      }
    ]
  },
  {
    id: 'cat-settings',
    title: 'Settings',
    sections: [
      {
        id: 'sec-settings',
        title: 'Account & Configuration',
        pages: [
          {
            id: 'settings-profile',
            title: 'Profile',
            path: '/dashboard/settings/profile',
            summary: 'Update your business name, logo, contact details, and public profile.',
            content: 'The Profile page is where you set up how your business appears to customers. You can update your business name, upload your logo, set your business hours, add a description, and provide contact information.\n\nThis information appears on your public business profile that customers see when they scan your QR code or search for your business. A complete, professional profile makes customers more likely to visit and engage.\n\nYou can also update your personal account details here, like your name, email, and phone number.',
            tips: ['Use a high-quality logo image for the best professional appearance', 'Keep your business hours up to date so customers know when to visit']
          },
          {
            id: 'settings-subscription',
            title: 'Subscription',
            path: '/dashboard/settings/subscription',
            summary: 'View and manage your plan, billing, and payment information.',
            content: 'The Subscription page shows you what plan you are currently on, what features are included, and when your next payment is due. You can upgrade or downgrade your plan at any time.\n\nYou can also update your payment method, view your billing history, and download invoices. If you ever need to change or cancel your plan, this is where you do it.\n\nYour subscription determines which features are available to you — upgrading gives you access to more tools and higher limits.',
            tips: ['Review your plan regularly to make sure it still fits your needs', 'Upgrade before you hit any limits to avoid interruptions']
          },
          {
            id: 'settings-support',
            title: 'Support',
            path: '/dashboard/support',
            summary: 'Get help, create support tickets, and track responses from the VemTap team.',
            content: 'The Support page is where you can get help directly from the VemTap team. You can create a support ticket describing any issue you are facing, attach screenshots, and track the status of your request.\n\nAll your past tickets are saved so you can refer back to previous conversations. The page also shows response times and lets you see when a team member is working on your issue.\n\nFor urgent issues, use the Live Chat option instead — it connects you with our support team in real time.',
            tips: ['Include screenshots in your ticket to help us understand the issue faster', 'Check your existing tickets before creating a new one in case it has already been answered']
          },
          {
            id: 'settings-compliance',
            title: 'Compliance',
            path: '/dashboard/compliance',
            summary: 'Manage privacy settings, consent preferences, and data policies.',
            content: 'The Compliance page helps you manage the legal and privacy aspects of your business. You can set up consent preferences for how you collect and use customer data, review your privacy policies, and configure data retention settings.\n\nThis is especially important if you operate in regions with specific privacy laws. The page guides you through what you need to do to stay compliant while still getting the most out of the platform.\n\nVemTap is designed with privacy in mind — this page helps you make sure your setup matches your local requirements.',
            tips: ['Review your compliance settings regularly, especially if laws change', 'When in doubt, keep more consent options turned on — it is better to have permission']
          }
        ]
      }
    ]
  }
];

export function buildSeedDocs(): KBCategory[] {
    return LEGACY_DOCS.map((cat) => ({
        id: cat.id,
        title: cat.title,
        sections: cat.sections.map((sec) => ({
            id: sec.id,
            title: sec.title,
            pages: sec.pages.map((p) => ({
                id: p.id,
                title: p.title,
                path: p.path,
                summary: p.summary,
                thumbnail: undefined,
                blocks: parseLegacyContent(p.content),
                tips: p.tips,
            })),
        })),
    }));
}
