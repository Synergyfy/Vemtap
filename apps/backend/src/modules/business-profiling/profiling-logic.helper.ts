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
    
    const q2 = data.customerTraffic || data.patientVolume;
    const q5 = data.waitingTime;
    const q7 = data.procedureClarity;
    const q8 = data.questionsBefore;
    const q10 = data.lostToWait;
    const q11 = data.forgetFollowups;
    const q12 = data.collectsData;
    const q13 = data.followUpVisits;
    const q14 = data.awarenessLevel;
    const q15 = data.waitingArea;
    const q16 = data.dwellTime;

    if (q5 === 'Medium' || q5 === 'High' || q10 === 'Medium' || q10 === 'High') {
      problems.push("Patient flow bottlenecks and loss due to waiting times.");
      recommendations.push("Implement a Digital Appointment & Check-in system to streamline arrival and reduce dropout at the door.");
    }

    if (q7 === 'No' || q7 === 'Partially' || q8 === 'High' || q14 === 'No' || q14 === 'Sometimes') {
      problems.push("High procedure discovery friction and low service awareness.");
      recommendations.push("Deploy 'Health Knowledge QR' in the waiting area to educate patients on your services and procedures.");
    }

    if (q11 === 'Medium' || q11 === 'High') {
      problems.push("Revenue loss due to missed follow-up appointments.");
      recommendations.push("Use Vemtap's Automated Medical Reminders to reduce no-shows and ensure treatment continuity.");
    }

    if (q12 === 'No' || q12 === 'Sometimes') {
      problems.push("Manual patient registration slowing down front-desk operations.");
      recommendations.push("Implement 'Quick Patient Capture' via QR to digitize registration before they reach the counter.");
    }

    if (q13 === 'No' || q13 === 'Sometimes') {
      problems.push("Gaps in post-visit care and patient engagement.");
      recommendations.push("Automate post-appointment care instructions and feedback collection via WhatsApp.");
    }

    if (q15 === 'Yes') qrStrategy.push("Waiting Area QR: Provide educational health content and digital registration.");
    if (q16 === 'High') qrStrategy.push("Engagement QR: Use high-dwell time in the waiting room to show educational videos or service updates.");

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
    const q8 = data.preEngageQuestions || data.serviceQuestions;
    const q9 = data.decisionDelay;
    const q10 = data.conversionLoss;
    const q11 = data.noShows;
    const q12 = data.collectsData;
    const q13 = data.followUpPotential;
    const q14 = data.valueUnderstanding;
    const q15 = data.activePromotion;
    const q17 = data.dwellEngagement;
    const q18 = data.digitalPresence;

    if (q5 === 'Medium' || q5 === 'High') {
      problems.push("Slow response speed causing inquiry friction.");
      recommendations.push("Implement a Structured Booking & Inquiry system to capture and respond to leads faster.");
    }

    if (q7 === 'No' || q7 === 'Partially' || q8 === 'High') {
      problems.push("Client confusion regarding service expertise or pricing.");
      recommendations.push("Use a Digital Business Profile to clearly articulate your value proposition and service packages.");
      qrStrategy.push("Profile QR: Present your full expertise and pricing transparently at the first point of contact.");
    }

    if (q9 === 'Medium' || q9 === 'High' || q10 === 'Medium' || q10 === 'High') {
      problems.push("High lead stalling and post-consultation drop-off.");
      recommendations.push("Deploy an automated post-consultation follow-up system to nurture hesitant clients.");
    }

    if (q11 === 'Medium' || q11 === 'High') {
      problems.push("Revenue loss due to missed meetings and no-shows.");
      recommendations.push("Enable automated appointment reminders to stabilize your consultation calendar.");
    }

    if (q12 === 'No' || q12 === 'Sometimes' || q13 === 'No') {
      problems.push("Inconsistent client data collection and follow-up efforts.");
      recommendations.push("Use 'Digital Client Intake' to build a structured CRM and automate catch-up reminders.");
    }

    if (q14 === 'No' || q14 === 'Sometimes' || q15 === 'No' || q18 === 'No' || q18 === 'Limited') {
      problems.push("Weak digital positioning and market visibility.");
      recommendations.push("Set up a premium Digital Business Profile to boost your firm's authority and credibility.");
    }

    if (q17 === 'High') {
      qrStrategy.push("Consultation QR: Share case studies and digital business cards while clients wait in your lounge.");
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
    const q8 = data.pricingInquiry;
    const q9 = data.dropOffInterest;
    const q10 = data.lostToEnroll;
    const q11 = data.retentionIssue;
    const q12 = data.collectsData;
    const q13 = data.updatesLevel;
    const q14 = data.valueUnderstanding;
    const q15 = data.activePromotion;
    const q18 = data.digitalReadiness;

    if (q5 === 'Medium' || q5 === 'High') {
      problems.push("Friction in the student registration and enrollment flow.");
      recommendations.push("Deploy a Structured Online Enrollment system to simplify the signup process.");
      qrStrategy.push("Registration QR: Place at the entrance for instant on-the-spot student signups.");
    }

    if (q7 === 'No' || q7 === 'Partially' || q8 === 'High') {
      problems.push("Information gap regarding course content, pricing, or duration.");
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

    if (q14 === 'No' || q14 === 'Sometimes' || q15 === 'No' || q18 === 'No' || q18 === 'Limited') {
      problems.push("Weak digital readiness and program value positioning.");
      recommendations.push("Set up a premium Digital Learning Profile to boost your institution's authority and reach.");
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
    const q8 = data.preProjectQuestions;
    const q9 = data.startDelay;
    const q10 = data.discussionLoss;
    const q11 = data.projectAbandonment;
    const q12 = data.collectsData;
    const q13 = data.followUpLeads;
    const q14 = data.valueUnderstanding;
    const q15 = data.activePromotion;
    const q16 = data.onlinePresence;
    const q17 = data.onboardingProcess;
    const q18 = data.digitalInteraction;

    if (q5 === 'Medium' || q5 === 'Slow') {
      problems.push("Inefficient response time to project inquiries causing potential lead friction.");
      recommendations.push("Implement a Structured Response & Intake system to qualify and engage leads instantly.");
    }

    if (q7 === 'No' || q7 === 'Partially' || q8 === 'High') {
      problems.push("Service/Package confusion - clients aren't fully grasping your tech value proposition.");
      recommendations.push("Use a Digital QR Portfolio and Clear Service Breakdown to articulate value and pricing tiers.");
      qrStrategy.push("Portfolio QR: Link directly to live demos, case studies, or GitHub repositories.");
    }

    if (q9 === 'Medium' || q9 === 'High' || q10 === 'Medium' || q10 === 'High') {
      problems.push("Low conversion from discussion to project start.");
      recommendations.push("Deploy an automated follow-up and engagement system to nurture hesitant tech clients.");
    }

    if (q11 === 'Medium' || q11 === 'High') {
      problems.push("High project abandonment or client drop-off after starting.");
      recommendations.push("Implement a more robust digital onboarding and continuous project engagement flow.");
    }

    if (q12 === 'No' || q12 === 'Sometimes' || q13 === 'No') {
      problems.push("Missing a structured system for lead capture and follow-up.");
      recommendations.push("Use a 'Digital Intake' system to build a structured CRM and automate follow-ups for inactive clients.");
      qrStrategy.push("Contact QR: Use digital business cards to instantly capture lead data into your CRM.");
    }

    if (q14 === 'No' || q14 === 'Sometimes' || q15 === 'No') {
      problems.push("Weak marketing awareness and promotion of tech services.");
      recommendations.push("Leverage digital marketing tools and automated promotions to boost service visibility.");
    }

    if (q16 === 'No' || q16 === 'Limited') {
      problems.push("Weak digital infrastructure (Website/Portfolio) affecting credibility.");
      recommendations.push("Deploy a premium Digital Profile and Portfolio system to showcase your technical authority.");
    }

    if (q17 === 'No' || q17 === 'Partially') {
      problems.push("Lack of a structured client onboarding process creates friction for new projects.");
      recommendations.push("Deploy a step-by-step digital onboarding flow to collect requirements and set expectations.");
    }

    if (q18 === 'Low') {
      qrStrategy.push("Digital Touchpoint QR: Implement dash-links or client tools to increase digital brand interaction.");
    }

    const scoreMap: Record<string, number> = { 'Low': 1, 'Medium': 2, 'High': 3, 'Yes': 1, 'Partially': 2, 'Sometimes': 2, 'No': 3, 'Fast': 1, 'Slow': 3, 'Limited': 2 };
    let totalScore = 0;
    Object.values(data).forEach(val => { if (typeof val === 'string' && scoreMap[val]) totalScore += scoreMap[val]; });

    const traffic = q2 || 'moderate';
    const priority = totalScore >= 28 ? ProfilePriority.HIGH : totalScore >= 18 ? ProfilePriority.MEDIUM : ProfilePriority.LOW;
    
    return {
      score: totalScore,
      priority,
      insights: {
        summary: `A ${data.techType || data.techServiceType || 'Technology'} firm handling ${traffic} projects monthly. Focus on intake automation and onboarding maturity.`,
        problems,
        recommendations,
        suggestedPackage: q2 === 'High' ? 'Platinum' : q2 === 'Medium' ? 'Gold' : 'Silver',
        packageReason: `The ${traffic.toLowerCase()} project volume requires ${q2 === 'High' ? 'executive' : 'professional'} level automation and CRM tools.`,
        qrStrategy,
        salesPitch: `In the tech industry, your onboarding and project clarity set the tone. Vemtap helps you qualify leads faster, showcase your portfolio via QR, and provide a premium digital onboarding experience that makes your agency stand out.`,
        aiAnalysis: "Tech Sector Analysis: The biggest revenue leak is usually in the lag between inquiry and project start. Automating the intake and documentation phase will significantly improve your conversion rates and operational speed.",
        aiSource: 'expert-system'
      }
    };
  }

  static calculateRealEstate(data: Record<string, any>): { score: number; priority: ProfilePriority; insights: BusinessInsights } {
    if (!data) data = {};
    const problems: string[] = [];
    const recommendations: string[] = [];
    const qrStrategy: string[] = [];
    
    // Mapping 20 Questions
    const q1 = data.propertyType;
    const q2 = data.monthlyLeads;
    const q3 = data.clientSource;
    const q4 = data.inquiryMethod;
    const q5 = data.responseTime;
    const q6 = data.delayedResponseComplaints;
    const q7 = data.propertyVisibility;
    const q8 = data.propertyQuestions;
    const q9 = data.viewingDecisionDelay;
    const q10 = data.conversionLoss;
    const q11 = data.noShowInspections;
    const q12 = data.collectsData;
    const q13 = data.followUpEffort;
    const q14 = data.valueUnderstanding;
    const q15 = data.activePromotion;
    const q16 = data.physicalBranding;
    const q17 = data.digitalEngagement;
    const q18 = data.digitalPlatform;
    const q19 = data.biggestChallenges;
    const q20 = data.improvementNeed;

    // SLOW RESPONSE PROBLEM
    if (q5 === 'Medium' || q5 === 'Slow') {
      problems.push("Slow response time to property inquiries creates a bottleneck in lead conversion.");
      recommendations.push("Implement a structured inquiry system to automate initial responses and lead routing.");
    }

    // PROPERTY VISIBILITY PROBLEM
    if (q7 === 'No' || q7 === 'Partially' || q8 === 'High') {
      problems.push("Poor property visibility or information gap leads to repetitive inquiries.");
      recommendations.push("Deploy a digital property listing system via QR codes on signage to provide instant access to high-quality photos and specs.");
      qrStrategy.push("Property QR: Place on 'For Sale/Lease' signs to allow passersby to view full details instantly.");
    }

    // LOW CONVERSION
    if (q9 === 'Medium' || q9 === 'High' || q10 === 'Medium' || q10 === 'High') {
      problems.push("Low lead-to-inspection conversion rate indicates a lack of engagement or clarity.");
      recommendations.push("Implement an automated follow-up and engagement system to nurture leads after viewing.");
    }

    // NO-SHOW PROBLEM
    if (q11 === 'Medium' || q11 === 'High') {
      problems.push("High no-show rate for property inspections or meetings.");
      recommendations.push("Enable an automated inspection reminder system via WhatsApp to confirm attendance.");
      qrStrategy.push("Inspection Booking QR: Allow leads to book viewing slots directly from your digital profile.");
    }

    // NO CLIENT DATA
    if (q12 === 'No' || q12 === 'Sometimes') {
      problems.push("Inconsistent or missing structured lead data collection.");
      recommendations.push("Deploy a lead capture system to build a high-intent property buyer and renter database.");
      qrStrategy.push("Contact QR: Use as a fast-entry point for potential buyers to leave their details.");
    }

    // WEAK MARKETING
    if (q14 === 'No' || q14 === 'Sometimes' || q15 === 'No') {
      problems.push("Low perceived property value or limited outreach.");
      recommendations.push("Use property promotion tools to broadcast listings to your existing lead database.");
    }

    // WEAK DIGITAL PLATFORM
    if (q18 === 'No' || q18 === 'Limited') {
      problems.push("Struggling with digital readiness and structured listings.");
      recommendations.push("Set up a high-converting digital listing/profile system to showcase your portfolio.");
    }

    const scoreMap: Record<string, number> = { 'Low': 1, 'Medium': 2, 'High': 3, 'Yes': 1, 'Partially': 2, 'Sometimes': 2, 'No': 3, 'Fast': 1, 'Slow': 3, 'Limited': 2, 'None': 3 };
    let totalScore = 0;
    Object.values(data).forEach(val => { if (typeof val === 'string' && scoreMap[val]) totalScore += scoreMap[val]; });

    const traffic = q2 || 'moderate';
    const priority = totalScore >= 28 ? ProfilePriority.HIGH : totalScore >= 18 ? ProfilePriority.MEDIUM : ProfilePriority.LOW;
    
    return {
      score: totalScore,
      priority,
      insights: {
        summary: `A ${q1 || 'Real Estate'} business managing ${traffic} leads monthly. Focus on response speed and listing accessibility.`,
        problems,
        recommendations,
        suggestedPackage: q2 === 'High' ? 'Platinum' : q2 === 'Medium' ? 'Gold' : 'Silver',
        packageReason: `The ${traffic.toLowerCase()} lead volume requires ${q2 === 'High' ? 'enterprise' : 'professional'} level automation and listing management.`,
        qrStrategy,
        salesPitch: `Real estate is about speed and trust. Vemtap helps you turn signage into instant lead capture, automate inspection bookings, and provide 24/7 property discovery via QR, making your agency the most tech-forward in the area.`,
        aiAnalysis: "Real Estate Sector Analysis: The gap between inquiry and physical inspection is where most leads are lost. By providing instant digital details via QR, you qualify leads faster and reduce the cost per site visit.",
        aiSource: 'expert-system'
      }
    };
  }

  static calculateAutomotive(data: Record<string, any>): { score: number; priority: ProfilePriority; insights: BusinessInsights } {
    if (!data) data = {};
    const problems: string[] = [];
    const recommendations: string[] = [];
    const qrStrategy: string[] = [];
    
    // Mapping 20 Questions
    const q1 = data.autoType;
    const q2 = data.dailyCustomers;
    const q3 = data.customerSource;
    const q4 = data.inquiryMethod;
    const q5 = data.waitingTime;
    const q6 = data.waitingComplaints;
    const q7 = data.serviceClarity;
    const q8 = data.preserviceQuestions || data.serviceQuestions;
    const q9 = data.serviceHesitation;
    const q10 = data.lostToDelay;
    const q11 = data.retentionRate;
    const q12 = data.collectsData;
    const q13 = data.followUpEffort;
    const q14 = data.serviceAwareness;
    const q15 = data.activePromotion;
    const q16 = data.hasSignage;
    const q17 = data.waitingOnsite;
    const q18 = data.qrFeasibility;
    const q19 = data.biggestChallenges;
    const q20 = data.improvementNeed;

    // WAITING PROBLEM
    if (q5 === 'Medium' || q5 === 'High' || q5 === '30+ minutes') {
      problems.push("High customer wait times before service starts causing friction.");
      recommendations.push("Implement a Digital Booking & Queue system to manage service flow and reduce onsite congestion.");
    }

    // SERVICE CONFUSION
    if (q7 === 'No' || q7 === 'Partially' || q8 === 'High') {
      problems.push("Service/Price confusion indicates a need for clearer process articulation.");
      recommendations.push("Deploy a QR Service Menu so customers can see exact pricing and service packages instantly.");
      qrStrategy.push("Service QR: Place at the reception or entrance for instant service/package breakdown.");
    }

    // LOW CONVERSION
    if (q9 === 'Medium' || q9 === 'High' || q10 === 'Medium' || q10 === 'High') {
      problems.push("High revenue leak due to service hesitation or operational delays.");
      recommendations.push("Streamline the intake process with faster digital check-ins and better engagement tools.");
    }

    // LOW RETENTION
    if (q11 === 'Medium' || q11 === 'High' || q11 === 'Low') {
      problems.push("Low customer return rate after the first service indicates a retention gap.");
      recommendations.push("Deploy an automated follow-up system for oil changes, maintenance, and seasonal reminders.");
    }

    // NO CUSTOMER DATA
    if (q12 === 'No' || q12 === 'Sometimes') {
      problems.push("Missing a structured customer database for re-marketing and retention.");
      recommendations.push("Capture customer contact details digitally to automate the full service lifecycle marketing.");
      qrStrategy.push("Contact QR: Use as a fast-entry point for customers to leave their contact and car details.");
    }

    // WEAK MARKETING
    if (q14 === 'No' || q14 === 'Sometimes' || q15 === 'No') {
      problems.push("Weak marketing effort or low customer awareness of full service range.");
      recommendations.push("Use digital promotion tools to broadcast specials and maintenance packages to your database.");
    }

    // QR PLACEMENT
    if (q17 === 'Medium' || q17 === 'High') {
      qrStrategy.push("Waiting Area QR: Engage customers with car care tips and exclusive offers while they wait.");
    }

    if (q16 === 'Yes' || q16 === 'clear') {
      qrStrategy.push("Entrance QR: Allow customers to check in or view services before even speaking to staff.");
    }

    const scoreMap: Record<string, number> = { 'Low': 1, 'Medium': 2, 'High': 3, 'Yes': 1, 'Partially': 2, 'Sometimes': 2, 'No': 3, 'clear': 1, 'Limited': 2, 'None': 3 };
    let totalScore = 0;
    Object.values(data).forEach(val => { if (typeof val === 'string' && scoreMap[val]) totalScore += scoreMap[val]; });

    const traffic = q2 || 'moderate';
    const priority = totalScore >= 28 ? ProfilePriority.HIGH : totalScore >= 18 ? ProfilePriority.MEDIUM : ProfilePriority.LOW;
    
    return {
      score: totalScore,
      priority,
      insights: {
        summary: `An Automotive ${q1 || 'Service'} business handling ${traffic} customers. Focus on retention automation and service check-in efficiency.`,
        problems,
        recommendations,
        suggestedPackage: q2 === 'High' ? 'Platinum' : q2 === 'Medium' ? 'Gold' : 'Silver',
        packageReason: `The ${traffic.toLowerCase()} traffic volume requires ${q2 === 'High' ? 'executive' : 'professional'} level lifecycle automation.`,
        qrStrategy,
        salesPitch: `Your customers value their cars and their time. Vemtap helps you provide a premium experience by reducing wait times with digital check-ins and ensuring they come back with automated service reminders.`,
        aiAnalysis: "Automotive Sector Analysis: Trust is built through transparency and consistency. A digital-first approach to service menus and follow-ups improves professional perception and builds long-term loyalty.",
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

  static calculateTechnology(data: Record<string, any>): { score: number; priority: ProfilePriority; insights: BusinessInsights } {
    if (!data) data = {};
    const problems: string[] = [];
    const recommendations: string[] = [];
    const qrStrategy: string[] = [];
    
    // Mapping 20 Questions
    const q1 = data.techType; // Type of tech business
    const q2 = data.monthlyProjects; // Number of projects monthly
    const q3 = data.acquisitionChannel; // How clients find you
    const q4 = data.contactMethod; // How clients contact you
    const q5 = data.responseSpeed; // Response speed
    const q6 = data.responseComplaints; // Do clients complain about speed
    const q7 = data.serviceClarity; // Clarity of offerings
    const q8 = data.preprojectQuestions; // Questions before project
    const q9 = data.projectDelay; // Delay starting projects
    const q10 = data.lostToDiscussion; // Lose clients after initial talk
    const q11 = data.projectAbandonment; // Abandon projects after starting
    const q12 = data.collectsData; // Proper data collection
    const q13 = data.followUpEffort; // Leads/Inactive follow-up
    const q14 = data.perceivedValue; // Value understanding
    const q15 = data.activePromotion; // Promotion effort
    const q16 = data.onlinePresence; // Website/Portfolio strength
    const q17 = data.onboardingProcess; // Structured onboarding
    const q18 = data.digitalEngagement; // Digital brand interaction
    const q19 = data.biggestChallenges; // Key pain points
    const q20 = data.improvementNeed; // Improvement urgency

    // Logic Engine (Deterministic Rules)
    
    // SLOW RESPONSE PROBLEM
    if (q5 === 'Medium' || q5 === 'Slow' || q6 === 'High' || q6 === 'Medium') {
      problems.push("Slow response times are causing client dissatisfaction and potential lead loss.");
      recommendations.push("Implement a 'Digital Client Intake' system via WhatsApp/QR to capture and respond to inquiries instantly.");
      qrStrategy.push("Contact/Intake QR: Place on your website and social media to capture leads with zero delay.");
    }

    // SERVICE CONFUSION
    if (q7 === 'No' || q7 === 'Partially' || q8 === 'High' || q8 === 'Medium') {
      problems.push("Clients struggle to understand your tech services or project packages.");
      recommendations.push("Deploy a 'Tech Service Catalog' with clear breakdowns and case studies accessible via QR/Link.");
      qrStrategy.push("Service/Portfolio QR: Share your specific tech solutions and pricing instantly with a professional digital profile.");
    }

    // LOW CONVERSION
    if (q9 === 'Medium' || q9 === 'High' || q10 === 'Medium' || q10 === 'High') {
      problems.push("High lead drop-off after initial discussions due to hesitation or lack of structured engagement.");
      recommendations.push("Use an automated follow-up sequence and digital project-proposal flow to keep leads warm.");
    }

    // PROJECT DROP-OFF
    if (q11 === 'Medium' || q11 === 'High') {
      problems.push("Significant project abandonment rates after initial commitment.");
      recommendations.push("Implement a structured digital onboarding and milestone engagement system to keep projects moving.");
    }

    // NO CLIENT DATA
    if (q12 === 'No' || q12 === 'Sometimes') {
      problems.push("Lack of a secure, centralized client/lead database (CRM).");
      recommendations.push("Deploy a 'Lead Capture' flow for all inbound tech inquiries to build your firm's database.");
    }

    // WEAK MARKETING
    if (q14 === 'No' || q14 === 'Sometimes' || q15 === 'No') {
      problems.push("Poor market awareness or perceived value of your technical digital solutions.");
      recommendations.push("Implement digital promotion tools to broadcast your latest successful projects and tech expertise.");
    }

    // WEAK DIGITAL PRESENCE
    if (q16 === 'No' || q16 === 'Limited' || q18 === 'Low') {
      problems.push("Insufficient digital infrastructure and brand visibility for a tech/digital firm.");
      recommendations.push("Upgrade to a 'Professional Digital Dashboard' that showcases your portfolio and tech tools.");
      qrStrategy.push("Portfolio QR: A dedicated digital space to showcase your tech projects and client testimonials.");
    }

    // NO ONBOARDING PROCESS
    if (q17 === 'No' || q17 === 'Partially') {
      problems.push("Lacking a professional and structured onboarding experience for new tech clients.");
      recommendations.push("Setup a 'Structured Digital Onboarding' flow to automate the initial client setup and requirements gathering.");
    }

    // Scoring & Priority mapping: 0-20 Low, 21-40 Medium, 41+ High
    const scoreMap: Record<string, number> = { 
      'Low': 1, 'Medium': 2, 'High': 3, 
      'Slow': 3, 'Fast': 1,
      'Yes': 1, 'Partially': 2, 'Sometimes': 2, 'No': 3, 'Limited': 2 
    };
    
    let totalScore = 0;
    Object.values(data).forEach(val => {
      if (typeof val === 'string' && scoreMap[val]) {
        totalScore += scoreMap[val];
      }
    });

    const priority = totalScore >= 41 ? ProfilePriority.HIGH : totalScore >= 21 ? ProfilePriority.MEDIUM : ProfilePriority.LOW;

    // Package Logic
    const traffic = q2 || 'moderate';
    const suggestedPackage = q2 === 'High (40+ per month)' ? 'Platinum' : q2 === 'Medium (11 – 40 per month)' ? 'Gold' : 'Silver';
    const packageReason = `${suggestedPackage} Plan recommended to automate client ingestion and management for ${traffic.toLowerCase()} volumes.`;

    return {
      score: totalScore,
      priority,
      insights: {
        summary: `A ${q1 || 'Tech/Digital Service'} firm handling ${traffic} projects. Focus needs to be on response speed, clarity of packages, and automated client onboarding.`,
        problems,
        recommendations,
        suggestedPackage,
        packageReason,
        qrStrategy,
        salesPitch: `As a tech leader, your client experience should be modern, fast, and automated. Vemtap helps your digital agency professionalize every touchpoint—from lead capture and onboarding to follow-up automation—ensuring your tech delivery is as sharp as your tech expertise.`,
        aiAnalysis: "Expert Tech Analysis: Technology clients expect speed. Moving from 'manual emails' to 'automated digital intake' will significantly reduce your project start time and improve your conversion rate.",
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
