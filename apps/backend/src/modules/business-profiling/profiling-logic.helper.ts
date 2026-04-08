import { BusinessInsights, ProfilePriority } from './entities/business-profile.entity';

export class ProfilingLogicHelper {
  static calculateRetail(data: Record<string, any>): { score: number; priority: ProfilePriority; insights: BusinessInsights } {
    if (!data) data = {};
    const problems: string[] = [];
    const recommendations: string[] = [];
    const qrStrategy: string[] = [];
    
    // Scoring
    let totalScore = 0;
    
    // Low=1, Medium=2, High=3
    const getVal = (val: string) => val === 'High' ? 3 : val === 'Medium' ? 2 : 1;
    const getYesNo = (val: string) => val === 'Yes' ? 1 : (val === 'Partially' || val === 'Sometimes') ? 2 : 3;

    // SECTION 2 & 3 & 4 & 5 & 6 & 8
    const q4 = data.productDiscovery; // How do customers find products
    const q5 = data.customerQuestions; // Do customers ask many questions
    const q6 = data.waitingTime; // Do customers wait
    const q8 = data.outOfStockLoss; // Lose customers because items not available
    const q9 = data.purchaseAbandonment; // Abandon purchase before paying
    const q10 = data.productKnowledge; // Do customers know all products
    const q11 = data.hasCatalog; // Do you have product catalog
    const q12 = data.collectsData; // Collect phone/email
    const q13 = data.followUp; // Follow up after purchase
    const q15 = data.marketingAwareness; // Know about new products
    const q16 = data.entranceVisibility; // Visible entrance
    const q17 = data.timeInside; // Spend time inside
    const q2 = data.customerTraffic; // Daily customers

    // Problem Detection
    if (q4 === 'Hard' || q4 === 'Medium' || q5 === 'High') {
      problems.push("Customers struggle to find or understand products easily.");
      recommendations.push("Implement a Digital QR Product Catalog to help customers browse and find items instantly.");
      qrStrategy.push("Product/Shelf QR: Place QR codes directly on shelves or near product categories.");
    }

    if (q6 === 'Medium' || q6 === 'High') {
      problems.push("High service delay noticed during customer interactions.");
      recommendations.push("Use 'Vemtap Fast-Pass' QR codes at counters to allow customers to browse while waiting.");
      qrStrategy.push("Counter QR: Reduce perceived waiting time with digital engagement at the point of sale.");
    }

    if (q8 === 'Medium' || q8 === 'High') {
      problems.push("Losing potential sales due to inventory visibility or stock-out awareness.");
      recommendations.push("Use an always-up-to-date digital catalog to show alternative products when items are out of stock.");
    }

    if (q9 === 'Medium' || q9 === 'High') {
      problems.push("Customer drop-off during the buying process (Cart Abandonment).");
      recommendations.push("Streamline the selection process with pre-filled QR info to reduce friction before payment.");
    }

    if (q10 === 'Partially' || q10 === 'No' || q11 === 'No catalog') {
      problems.push("Low product range visibility - customers aren't seeing your full inventory.");
      recommendations.push("Deploy a full digital catalog QR to showcase your entire inventory, not just what's on the shelf.");
    }

    if (q12 === 'No' || q12 === 'Sometimes') {
      problems.push("No structured customer database for re-marketing.");
      recommendations.push("Deploy a 'QR Customer Capture' flow at the entrance or counter to build your private database.");
      qrStrategy.push("Counter/Entrance QR: Collect contact details in exchange for future offers.");
    }

    if (q13 === 'No' || q13 === 'Sometimes') {
      problems.push("Weak customer retention effort - no follow-up system in place.");
      recommendations.push("Automate post-purchase follow-ups using the captured customer data.");
    }

    if (q15 === 'Sometimes' || q15 === 'No') {
      problems.push("Poor marketing awareness - customers are missing out on your latest deals.");
      recommendations.push("Use QR codes to broadcast weekly deals or new arrivals directly to customer phones.");
    }

    // QR Strategy Additionals
    if (q16 === 'Yes' && (q2 === 'Medium' || q2 === 'High')) {
      qrStrategy.push("Window/Entrance QR: Capture the attention of walk-in traffic even when the shop is busy.");
    }

    // Scoring (Total Score for priority)
    // We'll use the user's priority mapping: 0-15 Low, 16-30 Medium, 31+ High
    // We have 20 questions in the spec, but let's just use the ones we have.
    // To make it simple, let's sum up the 'problem' levels.
    const scoreMap: Record<string, number> = { 'Low': 1, 'Medium': 2, 'High': 3, 'Hard': 3, 'Easy': 1, 'Yes': 1, 'Partially': 2, 'Sometimes': 2, 'No': 3 };
    
    Object.values(data).forEach(val => {
      if (typeof val === 'string' && scoreMap[val]) {
        totalScore += scoreMap[val];
      }
    });

    let priority = ProfilePriority.LOW;
    if (totalScore >= 31) priority = ProfilePriority.HIGH;
    else if (totalScore >= 16) priority = ProfilePriority.MEDIUM;

    const traffic = q2 || 'moderate';
    const suggestedPackage = q2 === 'High' || problems.length > 5 ? 'Platinum' : q2 === 'Medium' || problems.length > 3 ? 'Gold' : 'Silver';
    const packageReason = `${suggestedPackage} Plan recommended to address ${problems.length} detected operational gaps and ${traffic.toLowerCase()} traffic volume.`;
    
    const salesPitch = `I noticed ${data.businessName || 'your business'} handles ${traffic} traffic, but ${problems[0] || 'customers could be better engaged'}. With Vemtap, you can ${recommendations[0]?.toLowerCase() || 'automate your customer database'}, helping you close more sales and keep customers coming back.`;

    return {
      score: totalScore,
      priority,
      insights: {
        summary: `This is a ${data.retailType || 'Retail'} business with ${traffic} daily traffic. Main challenges include ${problems.slice(0, 2).join(' and ')}.`,
        problems,
        recommendations,
        suggestedPackage,
        packageReason,
        qrStrategy,
        salesPitch,
        aiAnalysis: "Retail Expert Analysis: Focus on inventory visibility and data capture. The high walk-in potential can be converted into a digital asset with strategically placed QR codes at the entrance and counter.",
        aiSource: 'expert-system'
      }
    };
  }

  static calculateFood(data: Record<string, any>): { score: number; priority: ProfilePriority; insights: BusinessInsights } {
    if (!data) data = {};
    const problems: string[] = [];
    const recommendations: string[] = [];
    const qrStrategy: string[] = [];
    
    const q2 = data.customerTraffic; // Daily customers
    const q5 = data.waitingTime; // Wait before orders
    const q6 = data.complaints; // Slow service complaints
    const q7 = data.menuVisibility; // Easy to see menu
    const q8 = data.menuQuestions; // Questions about menu
    const q10 = data.lostCustomers; // Long queues
    const q12 = data.collectsData; // Collect phone/email
    const q14 = data.entranceVisibility; // Visible entrance
    const q15 = data.timeInside; // Sit and spend time

    if (q5 === 'Medium' || q5 === 'High' || q6 === 'Medium' || q6 === 'High') {
      problems.push("Service delays and customer wait-time friction.");
      recommendations.push("Implement a Digital QR Ordering system to speed up the process and reduce staff load.");
    }

    if (q7 === 'No' || q7 === 'Partially' || q8 === 'High') {
      problems.push("Menu confusion and low offering visibility.");
      recommendations.push("Deploy a rich, interactive QR Menu that explains dishes and highlights specials.");
      qrStrategy.push("Table/Menu QR: Place on every table or in the waiting area for instant menu access.");
    }

    if (q10 === 'Medium' || q10 === 'High') {
      problems.push("Revenue loss due to long queues and service bottlenecks.");
      recommendations.push("Use Vemtap's fast-ordering flow to allow customers to order from the queue or their tables.");
    }

    if (q12 === 'No' || q12 === 'Sometimes') {
      problems.push("Missing out on customer data for repeat business (Loyalty).");
      recommendations.push("Integrate 'Scan to Order & Join' to capture customer details automatically with every order.");
    }

    if (q15 === 'High') {
      qrStrategy.push("Table QR: Perfect for businesses where customers stay long; enables easy re-ordering.");
    }

    if (q14 === 'Yes') {
      qrStrategy.push("Entrance QR: Capture walk-ins and show off your specials before they even step inside.");
    }

    const scoreMap: Record<string, number> = { 'Low': 1, 'Medium': 2, 'High': 3, 'Yes': 1, 'Partially': 2, 'No': 3 };
    let totalScore = 0;
    Object.values(data).forEach(val => {
      if (typeof val === 'string' && scoreMap[val]) {
        totalScore += scoreMap[val];
      }
    });

    const traffic = q2 || 'moderate';
    const priority = totalScore >= 28 ? ProfilePriority.HIGH : totalScore >= 18 ? ProfilePriority.MEDIUM : ProfilePriority.LOW;
    const suggestedPackage = q2 === 'High' ? 'Platinum' : q2 === 'Medium' ? 'Gold' : 'Silver';
    const packageReason = `Based on ${traffic.toLowerCase()} traffic and identified service bottlenecks.`;
    
    const salesPitch = `We noticed that during busy times, ${problems[0]?.toLowerCase() || 'service can get slow'}. With Vemtap's QR Menu and Ordering, your customers can order instantly, reducing queues and helping you capture their data for future visits.`;

    return {
      score: totalScore,
      priority,
      insights: {
        summary: `A ${data.foodType || 'Food & Hospitality'} business serving ${traffic} customers daily. Focus should be on ${problems[0] || 'operational efficiency'}.`,
        problems,
        recommendations,
        suggestedPackage,
        packageReason,
        qrStrategy,
        salesPitch,
        aiAnalysis: "Hospitality Analysis: Speed of service is the critical factor. Moving orders to a digital platform will increase table turnover and improve the data capture rate significantly.",
        aiSource: 'expert-system'
      }
    };
  }

  static calculateBeauty(data: Record<string, any>): { score: number; priority: ProfilePriority; insights: BusinessInsights } {
    if (!data) data = {};
    const problems: string[] = [];
    const recommendations: string[] = [];
    const qrStrategy: string[] = [];
    
    const q2 = data.customerTraffic;
    const q5 = data.waitingTime;
    const q7 = data.serviceKnowledge;
    const q8 = data.serviceQuestions;
    const q10 = data.lostToWait;
    const q11 = data.noShow;
    const q12 = data.collectsData;
    const q16 = data.waitingArea;
    const q17 = data.timeWaiting;

    if (q5 === 'Medium' || q5 === 'High') {
      problems.push("Customer waiting time friction.");
      recommendations.push("Implement a Digital Booking & Queue Management system to reduce perceived wait times.");
    }

    if (q7 === 'No' || q7 === 'Partially' || q8 === 'High') {
      problems.push("Low service/price visibility.");
      recommendations.push("Deploy a QR Service Catalog so customers can browse styles and prices while they wait.");
    }

    if (q10 === 'Medium' || q10 === 'High') {
      problems.push("Losing customers due to lack of structured appointment flow.");
      recommendations.push("Use Vemtap's Appointment System to capture bookings before they walk away.");
    }

    if (q11 === 'Medium' || q11 === 'High') {
      problems.push("High no-show rate for appointments.");
      recommendations.push("Enable automated SMS/WhatsApp reminders to ensure customers show up for their sessions.");
    }

    if (q12 === 'No' || q12 === 'Sometimes') {
      problems.push("No structured customer database for retention.");
      recommendations.push("Deploy 'Scan to Connect' to capture customer details for birthday offers and reminders.");
    }

    if (q16 === 'Yes') qrStrategy.push("Waiting Area QR: Engage customers with your service menu while they wait.");
    if (q17 === 'High') qrStrategy.push("Engagement QR (Mirrors/Stations): Show off latest trends and collect feedback during the service.");

    const scoreMap: Record<string, number> = { 'Low': 1, 'Medium': 2, 'High': 3, 'Yes': 1, 'Partially': 2, 'Sometimes': 2, 'No': 3 };
    let totalScore = 0;
    Object.values(data).forEach(val => { if (typeof val === 'string' && scoreMap[val]) totalScore += scoreMap[val]; });

    const traffic = q2 || 'moderate';
    const priority = totalScore >= 28 ? ProfilePriority.HIGH : totalScore >= 18 ? ProfilePriority.MEDIUM : ProfilePriority.LOW;
    const suggestedPackage = q2 === 'High' ? 'Platinum' : q2 === 'Medium' ? 'Gold' : 'Silver';
    
    return {
      score: totalScore,
      priority,
      insights: {
        summary: `A ${data.beautyType || 'Beauty'} business with ${traffic} traffic. Priorities are booking efficiency and customer data capture.`,
        problems,
        recommendations,
        suggestedPackage,
        packageReason: `Recommended ${suggestedPackage} plan to stabilize ${traffic.toLowerCase()} demand and reduce no-shows.`,
        qrStrategy,
        salesPitch: `I noticed your customers often wait ${q5 === 'High' ? 'quite a while' : 'a bit'} before being served. With Vemtap, they can book ahead or browse your full style catalog via QR, reducing stress for your staff and making the experience premium.`,
        aiAnalysis: "Beauty Sector Analysis: Retention is key. The current lack of data capture is a massive missed opportunity for automated reminders which drive repeat business.",
        aiSource: 'expert-system'
      }
    };
  }

  static calculateHealth(data: Record<string, any>): { score: number; priority: ProfilePriority; insights: BusinessInsights } {
    if (!data) data = {};
    const problems: string[] = [];
    const recommendations: string[] = [];
    const qrStrategy: string[] = [];
    
    const q2 = data.patientVolume;
    const q5 = data.waitingTime;
    const q7 = data.procedureClarity;
    const q8 = data.questionsBefore;
    const q11 = data.forgetFollowups;
    const q12 = data.collectsData;
    const q13 = data.followUpVisits;
    const q15 = data.waitingArea;

    if (q5 === 'Medium' || q5 === 'High') {
      problems.push("Patient flow bottlenecks and waiting room congestion.");
      recommendations.push("Implement a Digital Appointment & Check-in system to streamline the patient arrival flow.");
    }

    if (q7 === 'No' || q7 === 'Partially' || q8 === 'High') {
      problems.push("Patient information gap regarding procedures or services.");
      recommendations.push("Use QR codes in the waiting area to provide detailed digital info about medical procedures and health tips.");
    }

    if (q11 === 'Medium' || q11 === 'High') {
      problems.push("Patients frequently miss follow-up appointments.");
      recommendations.push("Deploy an automated medical reminder system to reduce missed consultations.");
    }

    if (q12 === 'No' || q12 === 'Sometimes') {
      problems.push("Manual patient data management.");
      recommendations.push("Use 'QR Patient Capture' to allow patients to register their details digitally upon arrival.");
    }

    if (q13 === 'No' || q13 === 'Sometimes') {
      problems.push("Weak post-visit patient care and follow-up.");
      recommendations.push("Automate post-appointment feedback and follow-up care instructions via WhatsApp.");
    }

    if (q15 === 'Yes') qrStrategy.push("Waiting Area QR: Provide educational health content and digital registration.");

    const scoreMap: Record<string, number> = { 'Low': 1, 'Medium': 2, 'High': 3, 'Yes': 1, 'Partially': 2, 'Sometimes': 2, 'No': 3 };
    let totalScore = 0;
    Object.values(data).forEach(val => { if (typeof val === 'string' && scoreMap[val]) totalScore += scoreMap[val]; });

    const traffic = q2 || 'moderate';
    const priority = totalScore >= 30 ? ProfilePriority.HIGH : totalScore >= 20 ? ProfilePriority.MEDIUM : ProfilePriority.LOW;
    
    return {
      score: totalScore,
      priority,
      insights: {
        summary: `A ${data.medicalType || 'Medical'} facility managing ${traffic} patient volume. Needs focus on communication and follow-up automation.`,
        problems,
        recommendations,
        suggestedPackage: q2 === 'High' ? 'Platinum' : 'Gold',
        packageReason: `High-reliability systems required for ${data.medicalType || 'Medical'} operations and patient data security.`,
        qrStrategy,
        salesPitch: `In a medical setting, clear communication is vital. Vemtap can help your patients understand procedures via QR while they wait, and ensure they never miss a follow-up with our automated reminder system.`,
        aiAnalysis: "Health Sector Analysis: Operational efficiency in the waiting room directly impacts patient satisfaction. Digital check-ins and follow-ups are the highest value add here.",
        aiSource: 'expert-system'
      }
    };
  }

  static calculateProfessional(data: Record<string, any>): { score: number; priority: ProfilePriority; insights: BusinessInsights } {
    if (!data) data = {};
    const problems: string[] = [];
    const recommendations: string[] = [];
    const qrStrategy: string[] = [];
    
    const q2 = data.weeklyClients;
    const q5 = data.responseTime;
    const q7 = data.serviceClarity;
    const q8 = data.serviceQuestions;
    const q10 = data.conversionLoss;
    const q11 = data.noShows;
    const q12 = data.collectsData;
    const q18 = data.digitalPresence;

    if (q5 === 'Medium' || q5 === 'High') {
      problems.push("Communication response delays and client inquiry friction.");
      recommendations.push("Implement a Structured Booking & Response system to ensure no lead goes ignored.");
    }

    if (q7 === 'No' || q7 === 'Partially' || q8 === 'High') {
      problems.push("Client confusion regarding complex services and pricing.");
      recommendations.push("Use a Digital QR Profile to provide clear service breakdowns and transparent pricing.");
      qrStrategy.push("Profile QR: Share your full expertise and pricing instantly via a single scan.");
    }

    if (q10 === 'Medium' || q10 === 'High') {
      problems.push("Low post-consultation conversion rate.");
      recommendations.push("Deploy an automated follow-up and client engagement system to nurture leads.");
    }

    if (q11 === 'Medium' || q11 === 'High') {
      problems.push("Missed consultations and scheduling instability.");
      recommendations.push("Enable automated meeting reminders to minimize no-shows.");
    }

    if (q12 === 'No' || q12 === 'Sometimes') {
      problems.push("Lack of structured client database (CRM).");
      recommendations.push("Implement a 'Digital Client Intake' flow to capture data from the very first interaction.");
    }

    if (q18 === 'No' || q18 === 'Limited') {
      problems.push("Weak digital readiness and professional positioning.");
      recommendations.push("Set up a high-converting Digital Business Profile to boost credibility.");
    }

    const scoreMap: Record<string, number> = { 'Low': 1, 'Medium': 2, 'High': 3, 'Yes': 1, 'Partially': 2, 'Sometimes': 2, 'No': 3, 'Limited': 2 };
    let totalScore = 0;
    Object.values(data).forEach(val => { if (typeof val === 'string' && scoreMap[val]) totalScore += scoreMap[val]; });

    const traffic = q2 || 'moderate';
    const priority = totalScore >= 25 ? ProfilePriority.HIGH : totalScore >= 15 ? ProfilePriority.MEDIUM : ProfilePriority.LOW;
    
    return {
      score: totalScore,
      priority,
      insights: {
        summary: `A ${data.profType || 'Professional Service'} firm handling ${traffic} clients weekly. Needs focus on intake efficiency and conversion.`,
        problems,
        recommendations,
        suggestedPackage: q2 === 'High' ? 'Platinum' : 'Gold',
        packageReason: `The ${traffic.toLowerCase()} client volume requires automated CRM and lead nurturing tools.`,
        qrStrategy,
        salesPitch: `Consultants often lose time on repetitive questions. With Vemtap, you can share a professional digital profile that answers common questions and allows clients to book directly, helping you focus on your expert work.`,
        aiAnalysis: "Professional Services Analysis: The biggest leak is usually in the post-consultation follow-up. Automating this will significantly boost the ROI per client lead.",
        aiSource: 'expert-system'
      }
    };
  }

  static calculateEducation(data: Record<string, any>): { score: number; priority: ProfilePriority; insights: BusinessInsights } {
    if (!data) data = {};
    const problems: string[] = [];
    const recommendations: string[] = [];
    const qrStrategy: string[] = [];
    
    const q2 = data.studentVolume;
    const q5 = data.registrationFriction;
    const q7 = data.courseClarity;
    const q9 = data.dropOffInterest;
    const q10 = data.lostToEnroll;
    const q11 = data.retentionIssue;
    const q12 = data.collectsData;
    const q13 = data.updatesLevel;

    if (q5 === 'Medium' || q5 === 'High') {
      problems.push("Friction in the student registration and enrollment flow.");
      recommendations.push("Deploy a Structured Online Enrollment system to simplify the signup process.");
      qrStrategy.push("Registration QR: Place at the entrance for instant on-the-spot student signups.");
    }

    if (q7 === 'No' || q7 === 'Partially') {
      problems.push("Information gap regarding course content and duration.");
      recommendations.push("Use a Digital Course Catalog to provide detailed breakdowns of all learning programs.");
      qrStrategy.push("Course QR: Link directly to detailed syllabuses and program benefits.");
    }

    if (q9 === 'Medium' || q9 === 'High' || q10 === 'Medium' || q10 === 'High') {
      problems.push("High student drop-off rate before enrollment.");
      recommendations.push("Implement a follow-up and engagement system to nurture interested leads.");
    }

    if (q11 === 'Medium' || q11 === 'High') {
      problems.push("Low student retention or program completion rates.");
      recommendations.push("Use an automated engagement system to keep students motivated and informed.");
    }

    if (q12 === 'No' || q12 === 'Sometimes') {
      problems.push("Missing a comprehensive student contact database.");
      recommendations.push("Use 'Scan to Inquire' to capture student data for future intakes and marketing.");
    }

    if (q13 === 'No' || q13 === 'Sometimes') {
      problems.push("Poor communication regarding class updates and schedules.");
      recommendations.push("Automate student communication via WhatsApp for schedules, results, and offers.");
    }

    const scoreMap: Record<string, number> = { 'Low': 1, 'Medium': 2, 'High': 3, 'Yes': 1, 'Partially': 2, 'Sometimes': 2, 'No': 3 };
    let totalScore = 0;
    Object.values(data).forEach(val => { if (typeof val === 'string' && scoreMap[val]) totalScore += scoreMap[val]; });

    const traffic = q2 || 'moderate';
    const priority = totalScore >= 28 ? ProfilePriority.HIGH : totalScore >= 18 ? ProfilePriority.MEDIUM : ProfilePriority.LOW;
    
    return {
      score: totalScore,
      priority,
      insights: {
        summary: `An Education provider with ${traffic} students. Priorities are enrollment streamlining and consistent communication.`,
        problems,
        recommendations,
        suggestedPackage: q2 === 'High' ? 'Platinum' : 'Gold',
        packageReason: `Automated enrollment and bulk communication are critical for managing ${traffic.toLowerCase()} student volumes.`,
        qrStrategy,
        salesPitch: `Parents and students want easy access to information. By putting your course details and registration forms on a QR code, you eliminate confusion and make it incredibly easy for new students to join your program.`,
        aiAnalysis: "Education Sector Analysis: Recruitment cycle management is the main challenge. A digital-first inquiry system will ensure no potential student is lost due to slow response.",
        aiSource: 'expert-system'
      }
    };
  }

  static calculateTech(data: Record<string, any>): { score: number; priority: ProfilePriority; insights: BusinessInsights } {
    if (!data) data = {};
    const problems: string[] = [];
    const recommendations: string[] = [];
    const qrStrategy: string[] = [];
    
    const q2 = data.projectVolume;
    const q5 = data.responseTime;
    const q7 = data.serviceClarity;
    const q11 = data.projectDropoff;
    const q12 = data.collectsData;
    const q16 = data.portfolioPresence;
    const q17 = data.onboardingProcess;

    if (q5 === 'Medium' || q5 === 'Slow') {
      problems.push("Inefficient response time to project inquiries.");
      recommendations.push("Implement a Structured Intake & Response system to qualify leads instantly.");
    }

    if (q7 === 'No' || q7 === 'Partially') {
      problems.push("Service/Package confusion - clients don't see the full value.");
      recommendations.push("Use a Digital QR Portfolio to showcase previous work and clear service tiers.");
      qrStrategy.push("Portfolio QR: Link directly to your live demo, GitHub, or case studies.");
    }

    if (q11 === 'Medium' || q11 === 'High') {
      problems.push("High project abandonment or client drop-off rate.");
      recommendations.push("Implement a better onboarding and continuous engagement flow.");
    }

    if (q12 === 'No' || q12 === 'Sometimes') {
      problems.push("Missing structured lead and client database.");
      recommendations.push("Capture lead data directly through digital inquiry forms.");
    }

    if (q16 === 'No' || q16 === 'Limited') {
      problems.push("Weak digital presence and portfolio visibility.");
      recommendations.push("Set up a professional Digital Profile and Portfolio system.");
    }

    if (q17 === 'No' || q17 === 'Partially') {
      problems.push("Lack of a structured client onboarding process.");
      recommendations.push("Deploy a step-by-step digital onboarding flow for new projects.");
    }

    const scoreMap: Record<string, number> = { 'Low': 1, 'Medium': 2, 'High': 3, 'Yes': 1, 'Partially': 2, 'Sometimes': 2, 'No': 3, 'Fast': 1, 'Slow': 3, 'Limited': 2 };
    let totalScore = 0;
    Object.values(data).forEach(val => { if (typeof val === 'string' && scoreMap[val]) totalScore += scoreMap[val]; });

    const traffic = q2 || 'moderate';
    const priority = totalScore >= 25 ? ProfilePriority.HIGH : totalScore >= 15 ? ProfilePriority.MEDIUM : ProfilePriority.LOW;
    
    return {
      score: totalScore,
      priority,
      insights: {
        summary: `A Tech/Digital service handling ${traffic} projects. Focus on intake qualification and onboarding structure.`,
        problems,
        recommendations,
        suggestedPackage: q2 === 'High' ? 'Platinum' : 'Gold',
        packageReason: `Advanced onboarding and portfolio management tools needed for ${traffic.toLowerCase()} project demand.`,
        qrStrategy,
        salesPitch: `In tech, your brand is your portfolio. We can help you capture leads more effectively and provide a world-class onboarding experience that makes your agency stand out from the competition.`,
        aiAnalysis: "Tech Sector Analysis: Onboarding sets the tone for the entire project. Automating the intake and documentation collection will save hours of manual coordination.",
        aiSource: 'expert-system'
      }
    };
  }

  static calculateRealEstate(data: Record<string, any>): { score: number; priority: ProfilePriority; insights: BusinessInsights } {
    if (!data) data = {};
    const problems: string[] = [];
    const recommendations: string[] = [];
    const qrStrategy: string[] = [];
    
    const q2 = data.monthlyLeads;
    const q5 = data.responseTime;
    const q7 = data.propertyVisibility;
    const q8 = data.propertyQuestions;
    const q10 = data.conversionLoss;
    const q11 = data.noShowInspections;
    const q12 = data.collectsData;
    const q18 = data.digitalPlatform;

    if (q5 === 'Medium' || q5 === 'Slow') {
      problems.push("Slow response time to property inquiries.");
      recommendations.push("Implement a Structured Lead Inquiry system to capture and route leads instantly.");
    }

    if (q7 === 'No' || q7 === 'Partially' || q8 === 'High') {
      problems.push("Property information gap and low listing visibility.");
      recommendations.push("Deploy a Digital Property Listing system via QR to provide instant access to high-quality photos and specs.");
      qrStrategy.push("Property QR: Place on 'For Sale/Lease' signs to allow passersby to view full details instantly.");
    }

    if (q10 === 'Medium' || q10 === 'High') {
      problems.push("Low lead-to-inspection conversion rate.");
      recommendations.push("Implement an automated follow-up and lead engagement system.");
    }

    if (q11 === 'Medium' || q11 === 'High') {
      problems.push("High no-show rate for property inspections.");
      recommendations.push("Enable automated inspection reminders via WhatsApp to confirm attendance.");
      qrStrategy.push("Inspection Booking QR: Allow leads to book viewing slots directly from your digital profile.");
    }

    if (q12 === 'No' || q12 === 'Sometimes') {
      problems.push("Missing structured lead database.");
      recommendations.push("Use Vemtap's Lead Capture flow to build a high-intent property buyer database.");
    }

    if (q18 === 'No' || q18 === 'Limited') {
      problems.push("Weak digital platform for property listings.");
      recommendations.push("Set up a high-converting Digital Property Portfolio to manage your listings effectively.");
    }

    const scoreMap: Record<string, number> = { 'Low': 1, 'Medium': 2, 'High': 3, 'Yes': 1, 'Partially': 2, 'Sometimes': 2, 'No': 3, 'Fast': 1, 'Slow': 3, 'Limited': 2 };
    let totalScore = 0;
    Object.values(data).forEach(val => { if (typeof val === 'string' && scoreMap[val]) totalScore += scoreMap[val]; });

    const traffic = q2 || 'moderate';
    const priority = totalScore >= 25 ? ProfilePriority.HIGH : totalScore >= 15 ? ProfilePriority.MEDIUM : ProfilePriority.LOW;
    
    return {
      score: totalScore,
      priority,
      insights: {
        summary: `A ${data.propertyType || 'Real Estate'} business managing ${traffic} leads monthly. Focus on response speed and listing accessibility.`,
        problems,
        recommendations,
        suggestedPackage: q2 === 'High' ? 'Platinum' : 'Gold',
        packageReason: `Scalable lead management and digital listings are essential for ${traffic.toLowerCase()} volume.`,
        qrStrategy,
        salesPitch: `Real estate is about speed and information. With Vemtap, potential buyers can scan your signage to see full property details and book an inspection instantly, making your agency more efficient and modern.`,
        aiAnalysis: "Real Estate Analysis: The barrier to inspection is usually lack of instant information. Solving this via QR on site signage will significantly increase high-intent leads.",
        aiSource: 'expert-system'
      }
    };
  }

  static calculateAutomotive(data: Record<string, any>): { score: number; priority: ProfilePriority; insights: BusinessInsights } {
    if (!data) data = {};
    const problems: string[] = [];
    const recommendations: string[] = [];
    const qrStrategy: string[] = [];
    
    const q2 = data.dailyCustomers;
    const q5 = data.waitingTime;
    const q7 = data.serviceClarity;
    const q8 = data.serviceQuestions;
    const q10 = data.lostToDelay;
    const q11 = data.retentionRate;
    const q12 = data.collectsData;
    const q16 = data.hasSignage;
    const q17 = data.waitingOnsite;

    if (q5 === 'Medium' || q5 === 'High') {
      problems.push("Service start delays and customer wait-time friction.");
      recommendations.push("Implement a Digital Booking & Queue system to manage service flow.");
    }

    if (q7 === 'No' || q7 === 'Partially' || q8 === 'High') {
      problems.push("Service/Price confusion and lack of process clarity.");
      recommendations.push("Deploy a QR Service Menu so customers can see exact pricing and service packages.");
      qrStrategy.push("Service QR: Place at the reception or entrance for instant service breakdown.");
    }

    if (q10 === 'Medium' || q10 === 'High') {
      problems.push("Lost revenue due to operational bottlenecks.");
      recommendations.push("Streamline the intake process with a digital-first approach to reduce drop-offs.");
    }

    if (q11 === 'Low' || q11 === 'Medium') {
      problems.push("Low customer return rate after the first service.");
      recommendations.push("Deploy an automated follow-up system for oil changes, inspections, and maintenance reminders.");
    }

    if (q12 === 'No' || q12 === 'Sometimes') {
      problems.push("Missing a structured customer database for repeat business.");
      recommendations.push("Capture customer contact details digitally to automate service lifecycle marketing.");
    }

    if (q17 === 'Medium' || q17 === 'High') {
      qrStrategy.push("Waiting Area QR: Engage customers with maintenance tips and exclusive offers while they wait.");
    }

    if (q16 === 'Yes') qrStrategy.push("Entrance QR: Allow customers to check in or view services before even speaking to staff.");

    const scoreMap: Record<string, number> = { 'Low': 1, 'Medium': 2, 'High': 3, 'Yes': 1, 'Partially': 2, 'No': 3 };
    let totalScore = 0;
    Object.values(data).forEach(val => { if (typeof val === 'string' && scoreMap[val]) totalScore += scoreMap[val]; });

    const traffic = q2 || 'moderate';
    const priority = totalScore >= 28 ? ProfilePriority.HIGH : totalScore >= 18 ? ProfilePriority.MEDIUM : ProfilePriority.LOW;
    
    return {
      score: totalScore,
      priority,
      insights: {
        summary: `An Automotive ${data.autoType || 'Service'} business handling ${traffic} customers. Needs focus on retention and service flow.`,
        problems,
        recommendations,
        suggestedPackage: q2 === 'High' ? 'Platinum' : 'Gold',
        packageReason: `Retention automation is the highest ROI for ${traffic.toLowerCase()} volume automotive businesses.`,
        qrStrategy,
        salesPitch: `Your customers value their cars and their time. Vemtap helps you give them both—by reducing wait times with digital check-ins and keeping them coming back with automated service reminders.`,
        aiAnalysis: "Automotive Analysis: Trust is built on transparency. A clear digital service menu reduces price haggling and improves the professional perception of the workshop.",
        aiSource: 'expert-system'
      }
    };
  }

  static calculateLogistics(data: Record<string, any>): { score: number; priority: ProfilePriority; insights: BusinessInsights } {
    if (!data) data = {};
    const problems: string[] = [];
    const recommendations: string[] = [];
    const qrStrategy: string[] = [];
    
    const q2 = data.dailyRequests;
    const q5 = data.responseTime;
    const q7 = data.trackingCapability;
    const q8 = data.updateRequests;
    const q9 = data.deliveryDelays;
    const q11 = data.cancellationRate;
    const q12 = data.collectsData;
    const q18 = data.digitalOperations;

    if (q5 === 'Medium' || q5 === 'Slow') {
      problems.push("Slow response/dispatch coordination problems.");
      recommendations.push("Implement a Structured Booking & Dispatch system to handle requests more efficiently.");
    }

    if (q7 === 'No' || q7 === 'Limited' || q8 === 'High') {
      problems.push("Lack of real-time tracking visibility for customers.");
      recommendations.push("Deploy a Tracking & Automated Update system to reduce support workload.");
      qrStrategy.push("Tracking QR: Include on physical receipts or waybills for instant self-service status checks.");
    }

    if (q9 === 'Medium' || q9 === 'High') {
      problems.push("Frequent delivery delays and operational coordination gaps.");
      recommendations.push("Improve coordination through better digital intake and automated scheduling.");
    }

    if (q11 === 'Medium' || q11 === 'High') {
      problems.push("High order cancellation or incomplete booking rate.");
      recommendations.push("Use automated booking confirmations and reminders to stabilize the order flow.");
    }

    if (q12 === 'No' || q12 === 'Sometimes') {
      problems.push("Missing structured customer database for repeat shipping.");
      recommendations.push("Capture customer data to enable easy re-booking and loyalty incentives.");
    }

    if (q18 === 'No' || q18 === 'Limited') {
      problems.push("Weak digital system for logistics operations.");
      recommendations.push("Set up a comprehensive Digital Operations platform to manage dispatch and tracking.");
    }

    const scoreMap: Record<string, number> = { 'Low': 1, 'Medium': 2, 'High': 3, 'Yes': 1, 'Limited': 2, 'No': 3, 'Fast': 1, 'Slow': 3 };
    let totalScore = 0;
    Object.values(data).forEach(val => { if (typeof val === 'string' && scoreMap[val]) totalScore += scoreMap[val]; });

    const traffic = q2 || 'moderate';
    const priority = totalScore >= 28 ? ProfilePriority.HIGH : totalScore >= 18 ? ProfilePriority.MEDIUM : ProfilePriority.LOW;
    
    return {
      score: totalScore,
      priority,
      insights: {
        summary: `A ${data.logisticsType || 'Logistics'} company handling ${traffic} requests daily. Focus on dispatch efficiency and tracking visibility.`,
        problems,
        recommendations,
        suggestedPackage: q2 === 'High' ? 'Platinum' : 'Gold',
        packageReason: `High-volume logistics require robust dispatch automation and real-time data flow.`,
        qrStrategy,
        salesPitch: `Logistics is all about trust and visibility. Vemtap can help you reduce the 'Where is my order?' calls by giving your customers a self-service tracking QR and a faster way to book their next delivery.`,
        aiAnalysis: "Logistics Analysis: Operational friction in the dispatch phase is the main cost driver. Automating the initial booking will free up your team to focus on moving goods faster.",
        aiSource: 'expert-system'
      }
    };
  }

  static calculateConstruction(data: Record<string, any>): { score: number; priority: ProfilePriority; insights: BusinessInsights } {
    if (!data) data = {};
    const problems: string[] = [];
    const recommendations: string[] = [];
    const qrStrategy: string[] = [];
    
    const q2 = data.monthlyJobs;
    const q5 = data.responseTime;
    const q7 = data.serviceClarity;
    const q9 = data.quoteDelay;
    const q10 = data.conversionLoss;
    const q11 = data.jobCancellations;
    const q12 = data.collectsData;
    const q18 = data.digitalPresence;

    if (q5 === 'Medium' || q5 === 'Slow') {
      problems.push("Slow response time to job inquiries.");
      recommendations.push("Implement a Structured Job Request system to capture leads and requirements instantly.");
    }

    if (q7 === 'No' || q7 === 'Partially') {
      problems.push("Service/Price confusion - clients don't see the full value.");
      recommendations.push("Use a Digital QR Profile to showcase your specialized services and previous projects.");
      qrStrategy.push("Service QR: Include on physical signage or business cards for instant service overviews.");
    }

    if (q9 === 'Medium' || q9 === 'High' || q10 === 'Medium' || q10 === 'High') {
      problems.push("Low quote-to-job conversion rate.");
      recommendations.push("Deploy an automated follow-up system to nurture leads after sending quotations.");
    }

    if (q11 === 'Medium' || q11 === 'High') {
      problems.push("High job cancellation or rescheduling rate.");
      recommendations.push("Enable automated booking confirmations and reminders to stabilize your schedule.");
    }

    if (q12 === 'No' || q12 === 'Sometimes') {
      problems.push("Missing a structured customer database for repeat maintenance jobs.");
      recommendations.push("Capture customer data digitally to build a database for seasonal maintenance offers.");
    }

    if (q18 === 'No' || q18 === 'Limited') {
      problems.push("Weak digital portfolio and professional positioning.");
      recommendations.push("Set up a high-converting Digital Portfolio system to build trust with new clients.");
    }

    const scoreMap: Record<string, number> = { 'Low': 1, 'Medium': 2, 'High': 3, 'Yes': 1, 'Partially': 2, 'Sometimes': 2, 'No': 3, 'Fast': 1, 'Slow': 3, 'Limited': 2 };
    let totalScore = 0;
    Object.values(data).forEach(val => { if (typeof val === 'string' && scoreMap[val]) totalScore += scoreMap[val]; });

    const traffic = q2 || 'moderate';
    const priority = totalScore >= 25 ? ProfilePriority.HIGH : totalScore >= 15 ? ProfilePriority.MEDIUM : ProfilePriority.LOW;
    
    return {
      score: totalScore,
      priority,
      insights: {
        summary: `A ${data.constructionType || 'Construction/Home Service'} business handling ${traffic} jobs monthly. Focus on intake speed and portfolio visibility.`,
        problems,
        recommendations,
        suggestedPackage: q2 === 'High' ? 'Platinum' : 'Gold',
        packageReason: `The ${traffic.toLowerCase()} job volume requires automated scheduling and lead nurturing tools.`,
        qrStrategy,
        salesPitch: `In home services, trust and response speed are everything. Vemtap helps you capture job requests instantly and provides a professional digital portfolio that proves your quality before you even arrive at the site.`,
        aiAnalysis: "Construction Analysis: The main leak is in the lag between inquiry and quote. A digital-first request system will qualify leads faster and increase your win rate.",
        aiSource: 'expert-system'
      }
    };
  }

  static calculateEvents(data: Record<string, any>): { score: number; priority: ProfilePriority; insights: BusinessInsights } {
    if (!data) data = {};
    const problems: string[] = [];
    const recommendations: string[] = [];
    const qrStrategy: string[] = [];
    
    const q2 = data.monthlyEvents;
    const q5 = data.responseTime;
    const q7 = data.portfolioVisibility;
    const q10 = data.conversionLoss;
    const q11 = data.bookingCancellations;
    const q12 = data.collectsData;
    const q18 = data.digitalPresence;

    if (q5 === 'Medium' || q5 === 'Slow') {
      problems.push("Communication delays in handling event inquiries.");
      recommendations.push("Implement a Structured Booking & Response system to handle peak inquiry periods.");
    }

    if (q7 === 'No' || q7 === 'Partially') {
      problems.push("Low portfolio visibility - clients don't see the full scope of your work.");
      recommendations.push("Deploy a rich Digital QR Portfolio showcasing high-res photos and videos of past events.");
      qrStrategy.push("Portfolio QR: Share your best work instantly via a scan at your venue or meetings.");
    }

    if (q10 === 'Medium' || q10 === 'High') {
      problems.push("Low booking conversion rate after initial inquiry.");
      recommendations.push("Implement automated follow-ups and client engagement tools to secure bookings.");
    }

    if (q11 === 'Medium' || q11 === 'High') {
      problems.push("High booking cancellation rate.");
      recommendations.push("Use automated booking confirmations and deposit reminders to reduce no-shows.");
    }

    if (q12 === 'No' || q12 === 'Sometimes') {
      problems.push("Missing structured client database for repeat events.");
      recommendations.push("Capture lead data directly via digital inquiry forms to build a future marketing list.");
    }

    if (q18 === 'No' || q18 === 'Limited') {
      problems.push("Weak digital readiness and professional positioning.");
      recommendations.push("Set up a professional Digital Profile and Booking system.");
    }

    const scoreMap: Record<string, number> = { 'Low': 1, 'Medium': 2, 'High': 3, 'Yes': 1, 'Partially': 2, 'Sometimes': 2, 'No': 3, 'Fast': 1, 'Slow': 3, 'Limited': 2 };
    let totalScore = 0;
    Object.values(data).forEach(val => { if (typeof val === 'string' && scoreMap[val]) totalScore += scoreMap[val]; });

    const traffic = q2 || 'moderate';
    const priority = totalScore >= 25 ? ProfilePriority.HIGH : totalScore >= 15 ? ProfilePriority.MEDIUM : ProfilePriority.LOW;
    
    return {
      score: totalScore,
      priority,
      insights: {
        summary: `An Event/Entertainment business handling ${traffic} events monthly. Needs focus on portfolio showcase and booking reliability.`,
        problems,
        recommendations,
        suggestedPackage: q2 === 'High' ? 'Platinum' : 'Gold',
        packageReason: `High-value event services require advanced lead nurturing and automated client coordination.`,
        qrStrategy,
        salesPitch: `Your business is about creating memories. Vemtap helps you show off those memories through a digital portfolio and makes it incredibly easy for clients to book you for their next big day.`,
        aiAnalysis: "Events Analysis: Visual proof drives bookings. Moving the portfolio to a digital-first QR scan during consultations will dramatically reduce the sales cycle.",
        aiSource: 'expert-system'
      }
    };
  }

  static calculateAgric(data: Record<string, any>): { score: number; priority: ProfilePriority; insights: BusinessInsights } {
    if (!data) data = {};
    const problems: string[] = [];
    const recommendations: string[] = [];
    const qrStrategy: string[] = [];
    
    const q2 = data.productionVolume;
    const q5 = data.orderingFriction;
    const q6 = data.communicationLevel;
    const q7 = data.productVisibility;
    const q10 = data.conversionLoss;
    const q11 = data.retentionIssue;
    const q12 = data.collectsData;
    const q18 = data.digitalPlatform;

    if (q5 === 'Medium' || q5 === 'High') {
      problems.push("Friction in the ordering process for buyers.");
      recommendations.push("Implement a Structured Order Management system to handle wholesale and retail requests.");
    }

    if (q7 === 'No' || q7 === 'Partially') {
      problems.push("Low visibility of available produce and current stock levels.");
      recommendations.push("Deploy a Digital QR Catalog to show real-time stock availability and pricing.");
      qrStrategy.push("Product QR: Place on packaging or at the farm gate for instant ordering.");
    }

    if (q10 === 'Medium' || q10 === 'High') {
      problems.push("High lead drop-off rate among interested buyers.");
      recommendations.push("Use an automated follow-up system to keep buyers informed about new harvest dates.");
    }

    if (q11 === 'Medium' || q11 === 'High') {
      problems.push("Low buyer retention rate for recurring orders.");
      recommendations.push("Implement a loyalty and reminder system for seasonal buyers.");
    }

    if (q12 === 'No' || q12 === 'Sometimes') {
      problems.push("Missing a structured buyer contact database.");
      recommendations.push("Capture buyer data digitally to bypass middlemen and sell directly to consumers.");
    }

    if (q6 === 'Medium' || q6 === 'High') {
      problems.push("Poor communication regarding harvest updates or availability.");
      recommendations.push("Automate buyer communication via WhatsApp for availability alerts.");
    }

    if (q18 === 'No' || q18 === 'Limited') {
      problems.push("Weak digital platform for market access.");
      recommendations.push("Set up a Digital Profile and Catalog to expand your market reach beyond the local area.");
    }

    const scoreMap: Record<string, number> = { 'Low': 1, 'Medium': 2, 'High': 3, 'Yes': 1, 'Partially': 2, 'Sometimes': 2, 'No': 3, 'Limited': 2 };
    let totalScore = 0;
    Object.values(data).forEach(val => { if (typeof val === 'string' && scoreMap[val]) totalScore += scoreMap[val]; });

    const traffic = q2 || 'moderate';
    const priority = totalScore >= 28 ? ProfilePriority.HIGH : totalScore >= 18 ? ProfilePriority.MEDIUM : ProfilePriority.LOW;
    
    return {
      score: totalScore,
      priority,
      insights: {
        summary: `An Agriculture business with ${traffic} volume. Priorities are market access and direct buyer communication.`,
        problems,
        recommendations,
        suggestedPackage: q2 === 'High' ? 'Platinum' : 'Gold',
        packageReason: `Production at this scale requires direct-to-buyer digital pipelines and automated ordering.`,
        qrStrategy,
        salesPitch: `Whether you are selling to middlemen or direct to consumers, Vemtap gives you a professional digital storefront that keeps your buyers updated on your latest harvest, helping you sell out faster.`,
        aiAnalysis: "Agric Analysis: Direct market access is the biggest growth lever. Using QR to capture buyer contacts will eventually allow the business to command better prices by selling direct.",
        aiSource: 'expert-system'
      }
    };
  }

  static calculateFinance(data: Record<string, any>): { score: number; priority: ProfilePriority; insights: BusinessInsights } {
    if (!data) data = {};
    const problems: string[] = [];
    const recommendations: string[] = [];
    const qrStrategy: string[] = [];
    
    const q2 = data.customerVolume;
    const q5 = data.waitingTime;
    const q7 = data.serviceClarity;
    const q8 = data.questionsLevel;
    const q9 = data.transactionHesitation;
    const q10 = data.transactionDropoff;
    const q11 = data.retentionProblem;
    const q12 = data.collectsData;
    const q18 = data.digitalPlatform;

    if (q5 === 'Medium' || q5 === 'High') {
      problems.push("High customer wait-time and service delivery friction.");
      recommendations.push("Implement a Digital Queue & Appointment system to manage branch traffic.");
    }

    if (q7 === 'No' || q7 === 'Partially' || q8 === 'High') {
      problems.push("Service/Product confusion and potential trust barrier.");
      recommendations.push("Deploy a clear Digital QR Service Guide to explain complex financial products simply.");
      qrStrategy.push("Service Guide QR: Place at counters or help desks for instant product education.");
    }

    if (q9 === 'Medium' || q9 === 'High' || q10 === 'Medium' || q10 === 'High') {
      problems.push("Transaction abandonment and low onboarding conversion.");
      recommendations.push("Implement a digital onboarding flow and automated follow-up for incomplete sign-ups.");
      qrStrategy.push("Onboarding QR: Allow customers to start registration or loan applications instantly via scan.");
    }

    if (q11 === 'Medium' || q11 === 'High') {
      problems.push("Low recurring transaction rate or customer churn.");
      recommendations.push("Use automated engagement and loyalty tools to drive repeat usage.");
    }

    if (q12 === 'No' || q12 === 'Sometimes') {
      problems.push("Inconsistent customer data collection for follow-up.");
      recommendations.push("Use a 'Digital Intake' flow to capture verified customer details for re-marketing.");
    }

    if (q18 === 'No' || q18 === 'Limited') {
      problems.push("Weak digital platform readiness.");
      recommendations.push("Set up a high-security Digital Onboarding portal to modernize customer access.");
    }

    const scoreMap: Record<string, number> = { 'Low': 1, 'Medium': 2, 'High': 3, 'Yes': 1, 'Partially': 2, 'Sometimes': 2, 'No': 3, 'Limited': 2 };
    let totalScore = 0;
    Object.values(data).forEach(val => { if (typeof val === 'string' && scoreMap[val]) totalScore += scoreMap[val]; });

    const traffic = q2 || 'moderate';
    const priority = totalScore >= 28 ? ProfilePriority.HIGH : totalScore >= 18 ? ProfilePriority.MEDIUM : ProfilePriority.LOW;
    
    return {
      score: totalScore,
      priority,
      insights: {
        summary: `A ${data.financeType || 'Financial Service'} provider handling ${traffic} customers. Needs focus on trust-building education and onboarding speed.`,
        problems,
        recommendations,
        suggestedPackage: q2 === 'High' ? 'Platinum' : 'Gold',
        packageReason: `Financial services require high-security onboarding and automated transaction follow-ups.`,
        qrStrategy,
        salesPitch: `Trust is the currency of finance. Vemtap helps you build that trust by giving your customers instant, clear information about your services and a friction-free way to start their onboarding journey.`,
        aiAnalysis: "Finance Sector Analysis: The complexity of financial products is often the biggest bottleneck. Simplifying discovery via QR guides will increase self-service and reduce branch load.",
        aiSource: 'expert-system'
      }
    };
  }

  static calculateGov(data: Record<string, any>): { score: number; priority: ProfilePriority; insights: BusinessInsights } {
    if (!data) data = {};
    const problems: string[] = [];
    const recommendations: string[] = [];
    const qrStrategy: string[] = [];
    
    const q2 = data.citizenVolume;
    const q5 = data.queueTime;
    const q6 = data.delayComplaints;
    const q7 = data.procedureClarity;
    const q9 = data.unpreparedCitizens;
    const q11 = data.multipleReturns;
    const q12 = data.collectsData;
    const q18 = data.digitalPlatform;

    if (q5 === 'Medium' || q5 === 'High' || q6 === 'Medium' || q6 === 'High') {
      problems.push("Severe wait times and citizen dissatisfaction with queue management.");
      recommendations.push("Implement a Digital Queue & Appointment system to stabilize citizen flow.");
      qrStrategy.push("Appointment QR: Allow citizens to book slots before arrival to avoid long lines.");
    }

    if (q7 === 'No' || q7 === 'Partially' || q9 === 'Medium' || q9 === 'High') {
      problems.push("Information gap - citizens arrive unprepared or with wrong documentation.");
      recommendations.push("Deploy a 'Citizen Service Guide' QR system to provide clear procedure checklists.");
      qrStrategy.push("Procedure QR: Place on entrance signage to list all required documents for specific services.");
    }

    if (q11 === 'Medium' || q11 === 'High') {
      problems.push("Low operational efficiency leading to multiple return visits for single tasks.");
      recommendations.push("Use process tracking and automated reminders to ensure task completion in fewer visits.");
    }

    if (q12 === 'No' || q12 === 'Sometimes') {
      problems.push("Lack of a structured database for citizen communication.");
      recommendations.push("Capture citizen details digitally to send automated status updates and notifications.");
    }

    if (q18 === 'No' || q18 === 'Limited') {
      problems.push("Weak digital access to public services.");
      recommendations.push("Set up a high-accessibility Digital Service Portal to move physical traffic to online channels.");
    }

    const scoreMap: Record<string, number> = { 'Low': 1, 'Medium': 2, 'High': 3, 'Yes': 1, 'Partially': 2, 'Sometimes': 2, 'No': 3, 'Limited': 2 };
    let totalScore = 0;
    Object.values(data).forEach(val => { if (typeof val === 'string' && scoreMap[val]) totalScore += scoreMap[val]; });

    const traffic = q2 || 'moderate';
    const priority = totalScore >= 30 ? ProfilePriority.HIGH : totalScore >= 20 ? ProfilePriority.MEDIUM : ProfilePriority.LOW;
    
    return {
      score: totalScore,
      priority,
      insights: {
        summary: `A ${data.govType || 'Public Service'} agency serving ${traffic} citizens. Main focus is queue reduction and information dissemination.`,
        problems,
        recommendations,
        suggestedPackage: 'Platinum', // Gov almost always needs high volume/reliability
        packageReason: `Scale of public operations and data security requirements necessitate the Platinum ecosystem.`,
        qrStrategy,
        salesPitch: `Public service is about efficiency. We can help you eliminate 'chaos' in the waiting room by giving citizens clear requirements via QR and a digital way to book their appointments, making your office run like clockwork.`,
        aiAnalysis: "Government Analysis: Information asymmetry is the root of the long queues. Providing document checklists via QR at the gate will cut processing time by at least 40%.",
        aiSource: 'expert-system'
      }
    };
  }

  static calculateReligion(data: Record<string, any>): { score: number; priority: ProfilePriority; insights: BusinessInsights } {
    if (!data) data = {};
    const problems: string[] = [];
    const recommendations: string[] = [];
    const qrStrategy: string[] = [];
    
    const q2 = data.memberVolume;
    const q5 = data.missedUpdates;
    const q7 = data.eventAwareness;
    const q9 = data.lowAttendance;
    const q10 = data.donationStruggle;
    const q11 = data.irregularGiving;
    const q12 = data.collectsData;
    const q18 = data.digitalPlatform;

    if (q5 === 'Medium' || q5 === 'High') {
      problems.push("Communication gap - members miss important updates and announcements.");
      recommendations.push("Implement a Digital Notification & News system to keep the community informed.");
    }

    if (q7 === 'No' || q7 === 'Partially' || q9 === 'Medium' || q9 === 'High') {
      problems.push("Low program awareness and member participation.");
      recommendations.push("Deploy a Digital Event Calendar and automated reminders to boost attendance.");
      qrStrategy.push("Event QR: Place on banners/bulletins for instant registration and reminders.");
    }

    if (q10 === 'Medium' || q10 === 'High' || q11 === 'Medium' || q11 === 'High') {
      problems.push("Struggle with consistent donation collection and support tracking.");
      recommendations.push("Deploy a Digital Giving & Follow-up system to simplify contributions.");
      qrStrategy.push("Donation QR: Include in service programs or on pews for seamless giving.");
    }

    if (q12 === 'No' || q12 === 'Sometimes') {
      problems.push("Missing a comprehensive member/donor database.");
      recommendations.push("Capture member details digitally to automate outreach and care follow-ups.");
      qrStrategy.push("Registration QR: Use during services or events to capture first-timer details instantly.");
    }

    if (q18 === 'No' || q18 === 'Limited') {
      problems.push("Weak digital platform for member engagement.");
      recommendations.push("Set up a professional Digital Member Profile to host sermons, news, and giving portals.");
    }

    const scoreMap: Record<string, number> = { 'Low': 1, 'Medium': 2, 'High': 3, 'Yes': 1, 'Partially': 2, 'Sometimes': 2, 'No': 3, 'Limited': 2 };
    let totalScore = 0;
    Object.values(data).forEach(val => { if (typeof val === 'string' && scoreMap[val]) totalScore += scoreMap[val]; });

    const traffic = q2 || 'moderate';
    const priority = totalScore >= 25 ? ProfilePriority.HIGH : totalScore >= 15 ? ProfilePriority.MEDIUM : ProfilePriority.LOW;
    
    return {
      score: totalScore,
      priority,
      insights: {
        summary: `A ${data.orgType || 'Religious/NGO'} organization with ${traffic} members. Needs focus on communication consistency and donation flow.`,
        problems,
        recommendations,
        suggestedPackage: q2 === 'High' ? 'Platinum' : 'Gold',
        packageReason: `Community engagement at this scale requires robust automated communication and giving pipelines.`,
        qrStrategy,
        salesPitch: `Your mission is community. Vemtap helps you keep that community connected by ensuring every member gets updates instantly and making it incredibly easy for them to support your cause digitally.`,
        aiAnalysis: "NGO/Religion Analysis: Engagement is the driver of support. Moving from 'announcements from the pulpit' to 'digital reminders in the pocket' will significantly increase participation.",
        aiSource: 'expert-system'
      }
    };
  }

  static calculateOther(data: Record<string, any>): { score: number; priority: ProfilePriority; insights: BusinessInsights } {
    if (!data) data = {};
    const problems: string[] = [];
    const recommendations: string[] = [];
    const qrStrategy: string[] = [];
    
    const q3 = data.customerVolume;
    const q5 = data.communicationDelays;
    const q7 = data.offeringClarity;
    const q10 = data.contactDropoff;
    const q11 = data.retentionLevel;
    const q12 = data.collectsData;
    const q18 = data.digitalPresence;

    if (q5 === 'Medium' || q5 === 'High') {
      problems.push("Customer communication delays and coordination friction.");
      recommendations.push("Implement a Structured Communication & Inquiry system.");
    }

    if (q7 === 'No' || q7 === 'Partially') {
      problems.push("Service/Product clarity gap - offerings are not well understood.");
      recommendations.push("Deploy a Digital QR Catalog/Profile to showcase your full value proposition.");
      qrStrategy.push("Service QR: Share your unique offerings instantly via a professional digital landing page.");
    }

    if (q10 === 'Medium' || q10 === 'High') {
      problems.push("High lead drop-off rate after initial contact.");
      recommendations.push("Use automated follow-up and engagement tools to nurture potential clients.");
    }

    if (q11 === 'Low') {
      problems.push("Weak customer retention and repeat business.");
      recommendations.push("Deploy a loyalty and retention system to keep customers coming back.");
    }

    if (q12 === 'No' || q12 === 'Sometimes') {
      problems.push("Missing a structured customer/lead database.");
      recommendations.push("Capture lead data digitally to build a verified database for growth.");
    }

    if (q18 === 'No' || q18 === 'Limited') {
      problems.push("Weak digital platform and readiness.");
      recommendations.push("Set up a professional Digital Profile to boost your brand's credibility.");
    }

    const scoreMap: Record<string, number> = { 'Low': 1, 'Medium': 2, 'High': 3, 'Yes': 1, 'Partially': 2, 'Sometimes': 2, 'No': 3, 'Limited': 2 };
    let totalScore = 0;
    Object.values(data).forEach(val => { if (typeof val === 'string' && scoreMap[val]) totalScore += scoreMap[val]; });

    const priority = totalScore >= 25 ? ProfilePriority.HIGH : totalScore >= 15 ? ProfilePriority.MEDIUM : ProfilePriority.LOW;
    const vol = q3 || 'moderate';
    
    return {
      score: totalScore,
      priority,
      insights: {
        summary: `A specialized business handling ${vol} customers. Priorities are lead conversion and digital professionalization.`,
        problems,
        recommendations,
        suggestedPackage: vol === 'High' ? 'Platinum' : 'Gold',
        packageReason: `Growth-oriented tools needed to stabilize ${vol.toLowerCase()} volume and capture lead data.`,
        qrStrategy,
        salesPitch: `Every unique business needs a unique approach. Vemtap helps you professionalize your customer interactions, capture data automatically, and ensure you never lose a lead to slow response times.`,
        aiAnalysis: "General Sector Analysis: The core operational gap is almost always lack of data. Building a digital pipeline will allow this business to scale regardless of its specific model.",
        aiSource: 'expert-system'
      }
    };
  }
}
