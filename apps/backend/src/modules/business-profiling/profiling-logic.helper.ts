import {
  BusinessInsights,
  ProfilePriority,
} from './entities/business-profile.entity';

export class ProfilingLogicHelper {
  static calculateRetail(data: Record<string, any>): {
    score: number;
    priority: ProfilePriority;
    insights: BusinessInsights;
  } {
    if (!data) data = {};
    const problems: string[] = [];
    const recommendations: string[] = [];
    const qrStrategy: string[] = [];

    // Scoring
    let totalScore = 0;

    // Low=1, Medium=2, High=3
    const getVal = (val: string) =>
      val === 'High' ? 3 : val === 'Medium' ? 2 : 1;
    const getYesNo = (val: string) =>
      val === 'Yes' ? 1 : val === 'Partially' || val === 'Sometimes' ? 2 : 3;

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
      problems.push(
        'Customers struggle to find or understand products easily.',
      );
      recommendations.push(
        'Implement a Digital QR Product Catalog to help customers browse and find items instantly.',
      );
      qrStrategy.push(
        'Product/Shelf QR: Place QR codes directly on shelves or near product categories.',
      );
    }

    if (q6 === 'Medium' || q6 === 'High') {
      problems.push('High service delay noticed during customer interactions.');
      recommendations.push(
        "Use 'Vemtap Fast-Pass' QR codes at counters to allow customers to browse while waiting.",
      );
      qrStrategy.push(
        'Counter QR: Reduce perceived waiting time with digital engagement at the point of sale.',
      );
    }

    if (q8 === 'Medium' || q8 === 'High') {
      problems.push(
        'Losing potential sales due to inventory visibility or stock-out awareness.',
      );
      recommendations.push(
        'Use an always-up-to-date digital catalog to show alternative products when items are out of stock.',
      );
    }

    if (q9 === 'Medium' || q9 === 'High') {
      problems.push(
        'Customer drop-off during the buying process (Cart Abandonment).',
      );
      recommendations.push(
        'Streamline the selection process with pre-filled QR info to reduce friction before payment.',
      );
    }

    if (q10 === 'Partially' || q10 === 'No' || q11 === 'No catalog') {
      problems.push(
        "Low product range visibility - customers aren't seeing your full inventory.",
      );
      recommendations.push(
        "Deploy a full digital catalog QR to showcase your entire inventory, not just what's on the shelf.",
      );
    }

    if (q12 === 'No' || q12 === 'Sometimes') {
      problems.push('No structured customer database for re-marketing.');
      recommendations.push(
        "Deploy a 'QR Customer Capture' flow at the entrance or counter to build your private database.",
      );
      qrStrategy.push(
        'Counter/Entrance QR: Collect contact details in exchange for future offers.',
      );
    }

    if (q13 === 'No' || q13 === 'Sometimes') {
      problems.push(
        'Weak customer retention effort - no follow-up system in place.',
      );
      recommendations.push(
        'Automate post-purchase follow-ups using the captured customer data.',
      );
    }

    if (q15 === 'Sometimes' || q15 === 'No') {
      problems.push(
        'Poor marketing awareness - customers are missing out on your latest deals.',
      );
      recommendations.push(
        'Use QR codes to broadcast weekly deals or new arrivals directly to customer phones.',
      );
    }

    // QR Strategy Additionals
    if (q16 === 'Yes' && (q2 === 'Medium' || q2 === 'High')) {
      qrStrategy.push(
        'Window/Entrance QR: Capture the attention of walk-in traffic even when the shop is busy.',
      );
    }

    // Scoring (Total Score for priority)
    // We'll use the user's priority mapping: 0-15 Low, 16-30 Medium, 31+ High
    // We have 20 questions in the spec, but let's just use the ones we have.
    // To make it simple, let's sum up the 'problem' levels.
    const scoreMap: Record<string, number> = {
      Low: 1,
      Medium: 2,
      High: 3,
      Hard: 3,
      Easy: 1,
      Yes: 1,
      Partially: 2,
      Sometimes: 2,
      No: 3,
    };

    Object.values(data).forEach((val) => {
      if (typeof val === 'string' && scoreMap[val]) {
        totalScore += scoreMap[val];
      }
    });

    let priority = ProfilePriority.LOW;
    if (totalScore >= 31) priority = ProfilePriority.HIGH;
    else if (totalScore >= 16) priority = ProfilePriority.MEDIUM;

    const traffic = q2 || 'moderate';
    const suggestedPackage =
      q2 === 'High' || problems.length > 5
        ? 'Platinum'
        : q2 === 'Medium' || problems.length > 3
          ? 'Gold'
          : 'Silver';
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
        aiAnalysis:
          'Retail Expert Analysis: Focus on inventory visibility and data capture. The high walk-in potential can be converted into a digital asset with strategically placed QR codes at the entrance and counter.',
        aiSource: 'expert-system',
      },
    };
  }

  static calculateFood(data: Record<string, any>): {
    score: number;
    priority: ProfilePriority;
    insights: BusinessInsights;
  } {
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
      problems.push('Service delays and customer wait-time friction.');
      recommendations.push(
        'Implement a Digital QR Ordering system to speed up the process and reduce staff load.',
      );
    }

    if (q7 === 'No' || q7 === 'Partially' || q8 === 'High') {
      problems.push('Menu confusion and low offering visibility.');
      recommendations.push(
        'Deploy a rich, interactive QR Menu that explains dishes and highlights specials.',
      );
      qrStrategy.push(
        'Table/Menu QR: Place on every table or in the waiting area for instant menu access.',
      );
    }

    if (q10 === 'Medium' || q10 === 'High') {
      problems.push('Revenue loss due to long queues and service bottlenecks.');
      recommendations.push(
        "Use Vemtap's fast-ordering flow to allow customers to order from the queue or their tables.",
      );
    }

    if (q12 === 'No' || q12 === 'Sometimes') {
      problems.push(
        'Missing out on customer data for repeat business (Loyalty).',
      );
      recommendations.push(
        "Integrate 'Scan to Order & Join' to capture customer details automatically with every order.",
      );
    }

    if (q15 === 'High') {
      qrStrategy.push(
        'Table QR: Perfect for businesses where customers stay long; enables easy re-ordering.',
      );
    }

    if (q14 === 'Yes') {
      qrStrategy.push(
        'Entrance QR: Capture walk-ins and show off your specials before they even step inside.',
      );
    }

    const scoreMap: Record<string, number> = {
      Low: 1,
      Medium: 2,
      High: 3,
      Yes: 1,
      Partially: 2,
      No: 3,
    };
    let totalScore = 0;
    Object.values(data).forEach((val) => {
      if (typeof val === 'string' && scoreMap[val]) {
        totalScore += scoreMap[val];
      }
    });

    const traffic = q2 || 'moderate';
    const priority =
      totalScore >= 28
        ? ProfilePriority.HIGH
        : totalScore >= 18
          ? ProfilePriority.MEDIUM
          : ProfilePriority.LOW;
    const suggestedPackage =
      q2 === 'High' ? 'Platinum' : q2 === 'Medium' ? 'Gold' : 'Silver';
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
        aiAnalysis:
          'Hospitality Analysis: Speed of service is the critical factor. Moving orders to a digital platform will increase table turnover and improve the data capture rate significantly.',
        aiSource: 'expert-system',
      },
    };
  }

  static calculateBeauty(data: Record<string, any>): {
    score: number;
    priority: ProfilePriority;
    insights: BusinessInsights;
  } {
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
      problems.push('Customer waiting time friction.');
      recommendations.push(
        'Implement a Digital Booking & Queue Management system to reduce perceived wait times.',
      );
    }

    if (q7 === 'No' || q7 === 'Partially' || q8 === 'High') {
      problems.push('Low service/price visibility.');
      recommendations.push(
        'Deploy a QR Service Catalog so customers can browse styles and prices while they wait.',
      );
    }

    if (q10 === 'Medium' || q10 === 'High') {
      problems.push(
        'Losing customers due to lack of structured appointment flow.',
      );
      recommendations.push(
        "Use Vemtap's Appointment System to capture bookings before they walk away.",
      );
    }

    if (q11 === 'Medium' || q11 === 'High') {
      problems.push('High no-show rate for appointments.');
      recommendations.push(
        'Enable automated SMS/WhatsApp reminders to ensure customers show up for their sessions.',
      );
    }

    if (q12 === 'No' || q12 === 'Sometimes') {
      problems.push('No structured customer database for retention.');
      recommendations.push(
        "Deploy 'Scan to Connect' to capture customer details for birthday offers and reminders.",
      );
    }

    if (q16 === 'Yes')
      qrStrategy.push(
        'Waiting Area QR: Engage customers with your service menu while they wait.',
      );
    if (q17 === 'High')
      qrStrategy.push(
        'Engagement QR (Mirrors/Stations): Show off latest trends and collect feedback during the service.',
      );

    const scoreMap: Record<string, number> = {
      Low: 1,
      Medium: 2,
      High: 3,
      Yes: 1,
      Partially: 2,
      Sometimes: 2,
      No: 3,
    };
    let totalScore = 0;
    Object.values(data).forEach((val) => {
      if (typeof val === 'string' && scoreMap[val]) totalScore += scoreMap[val];
    });

    const traffic = q2 || 'moderate';
    const priority =
      totalScore >= 28
        ? ProfilePriority.HIGH
        : totalScore >= 18
          ? ProfilePriority.MEDIUM
          : ProfilePriority.LOW;
    const suggestedPackage =
      q2 === 'High' ? 'Platinum' : q2 === 'Medium' ? 'Gold' : 'Silver';

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
        aiAnalysis:
          'Beauty Sector Analysis: Retention is key. The current lack of data capture is a massive missed opportunity for automated reminders which drive repeat business.',
        aiSource: 'expert-system',
      },
    };
  }

  static calculateHealth(data: Record<string, any>): {
    score: number;
    priority: ProfilePriority;
    insights: BusinessInsights;
  } {
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

    if (
      q5 === 'Medium' ||
      q5 === 'High' ||
      q10 === 'Medium' ||
      q10 === 'High'
    ) {
      problems.push('Patient flow bottlenecks and loss due to waiting times.');
      recommendations.push(
        'Implement a Digital Appointment & Check-in system to streamline arrival and reduce dropout at the door.',
      );
    }

    if (
      q7 === 'No' ||
      q7 === 'Partially' ||
      q8 === 'High' ||
      q14 === 'No' ||
      q14 === 'Sometimes'
    ) {
      problems.push(
        'High procedure discovery friction and low service awareness.',
      );
      recommendations.push(
        "Deploy 'Health Knowledge QR' in the waiting area to educate patients on your services and procedures.",
      );
    }

    if (q11 === 'Medium' || q11 === 'High') {
      problems.push('Revenue loss due to missed follow-up appointments.');
      recommendations.push(
        "Use Vemtap's Automated Medical Reminders to reduce no-shows and ensure treatment continuity.",
      );
    }

    if (q12 === 'No' || q12 === 'Sometimes') {
      problems.push(
        'Manual patient registration slowing down front-desk operations.',
      );
      recommendations.push(
        "Implement 'Quick Patient Capture' via QR to digitize registration before they reach the counter.",
      );
    }

    if (q13 === 'No' || q13 === 'Sometimes') {
      problems.push('Gaps in post-visit care and patient engagement.');
      recommendations.push(
        'Automate post-appointment care instructions and feedback collection via WhatsApp.',
      );
    }

    if (q15 === 'Yes')
      qrStrategy.push(
        'Waiting Area QR: Provide educational health content and digital registration.',
      );
    if (q16 === 'High')
      qrStrategy.push(
        'Engagement QR: Use high-dwell time in the waiting room to show educational videos or service updates.',
      );

    const scoreMap: Record<string, number> = {
      Low: 1,
      Medium: 2,
      High: 3,
      Yes: 1,
      Partially: 2,
      Sometimes: 2,
      No: 3,
    };
    let totalScore = 0;
    Object.values(data).forEach((val) => {
      if (typeof val === 'string' && scoreMap[val]) totalScore += scoreMap[val];
    });

    const traffic = q2 || 'moderate';
    const priority =
      totalScore >= 30
        ? ProfilePriority.HIGH
        : totalScore >= 20
          ? ProfilePriority.MEDIUM
          : ProfilePriority.LOW;

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
        aiAnalysis:
          'Health Sector Analysis: Operational efficiency in the waiting room directly impacts patient satisfaction. Digital check-ins and follow-ups are the highest value add here.',
        aiSource: 'expert-system',
      },
    };
  }

  static calculateProfessional(data: Record<string, any>): {
    score: number;
    priority: ProfilePriority;
    insights: BusinessInsights;
  } {
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
      problems.push('Slow response speed causing inquiry friction.');
      recommendations.push(
        'Implement a Structured Booking & Inquiry system to capture and respond to leads faster.',
      );
    }

    if (q7 === 'No' || q7 === 'Partially' || q8 === 'High') {
      problems.push('Client confusion regarding service expertise or pricing.');
      recommendations.push(
        'Use a Digital Business Profile to clearly articulate your value proposition and service packages.',
      );
      qrStrategy.push(
        'Profile QR: Present your full expertise and pricing transparently at the first point of contact.',
      );
    }

    if (
      q9 === 'Medium' ||
      q9 === 'High' ||
      q10 === 'Medium' ||
      q10 === 'High'
    ) {
      problems.push('High lead stalling and post-consultation drop-off.');
      recommendations.push(
        'Deploy an automated post-consultation follow-up system to nurture hesitant clients.',
      );
    }

    if (q11 === 'Medium' || q11 === 'High') {
      problems.push('Revenue loss due to missed meetings and no-shows.');
      recommendations.push(
        'Enable automated appointment reminders to stabilize your consultation calendar.',
      );
    }

    if (q12 === 'No' || q12 === 'Sometimes' || q13 === 'No') {
      problems.push(
        'Inconsistent client data collection and follow-up efforts.',
      );
      recommendations.push(
        "Use 'Digital Client Intake' to build a structured CRM and automate catch-up reminders.",
      );
    }

    if (
      q14 === 'No' ||
      q14 === 'Sometimes' ||
      q15 === 'No' ||
      q18 === 'No' ||
      q18 === 'Limited'
    ) {
      problems.push('Weak digital positioning and market visibility.');
      recommendations.push(
        "Set up a premium Digital Business Profile to boost your firm's authority and credibility.",
      );
    }

    if (q17 === 'High') {
      qrStrategy.push(
        'Consultation QR: Share case studies and digital business cards while clients wait in your lounge.',
      );
    }

    const scoreMap: Record<string, number> = {
      Low: 1,
      Medium: 2,
      High: 3,
      Yes: 1,
      Partially: 2,
      Sometimes: 2,
      No: 3,
      Limited: 2,
    };
    let totalScore = 0;
    Object.values(data).forEach((val) => {
      if (typeof val === 'string' && scoreMap[val]) totalScore += scoreMap[val];
    });

    const traffic = q2 || 'moderate';
    const priority =
      totalScore >= 25
        ? ProfilePriority.HIGH
        : totalScore >= 15
          ? ProfilePriority.MEDIUM
          : ProfilePriority.LOW;

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
        aiAnalysis:
          'Professional Services Analysis: The biggest leak is usually in the post-consultation follow-up. Automating this will significantly boost the ROI per client lead.',
        aiSource: 'expert-system',
      },
    };
  }

  static calculateEducation(data: Record<string, any>): {
    score: number;
    priority: ProfilePriority;
    insights: BusinessInsights;
  } {
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
      problems.push(
        'Friction in the student registration and enrollment flow.',
      );
      recommendations.push(
        'Deploy a Structured Online Enrollment system to simplify the signup process.',
      );
      qrStrategy.push(
        'Registration QR: Place at the entrance for instant on-the-spot student signups.',
      );
    }

    if (q7 === 'No' || q7 === 'Partially' || q8 === 'High') {
      problems.push(
        'Information gap regarding course content, pricing, or duration.',
      );
      recommendations.push(
        'Use a Digital Course Catalog to provide detailed breakdowns of all learning programs.',
      );
      qrStrategy.push(
        'Course QR: Link directly to detailed syllabuses and program benefits.',
      );
    }

    if (
      q9 === 'Medium' ||
      q9 === 'High' ||
      q10 === 'Medium' ||
      q10 === 'High'
    ) {
      problems.push('High student drop-off rate before enrollment.');
      recommendations.push(
        'Implement a follow-up and engagement system to nurture interested leads.',
      );
    }

    if (q11 === 'Medium' || q11 === 'High') {
      problems.push('Low student retention or program completion rates.');
      recommendations.push(
        'Use an automated engagement system to keep students motivated and informed.',
      );
    }

    if (q12 === 'No' || q12 === 'Sometimes') {
      problems.push('Missing a comprehensive student contact database.');
      recommendations.push(
        "Use 'Scan to Inquire' to capture student data for future intakes and marketing.",
      );
    }

    if (q13 === 'No' || q13 === 'Sometimes') {
      problems.push(
        'Poor communication regarding class updates and schedules.',
      );
      recommendations.push(
        'Automate student communication via WhatsApp for schedules, results, and offers.',
      );
    }

    if (
      q14 === 'No' ||
      q14 === 'Sometimes' ||
      q15 === 'No' ||
      q18 === 'No' ||
      q18 === 'Limited'
    ) {
      problems.push('Weak digital readiness and program value positioning.');
      recommendations.push(
        "Set up a premium Digital Learning Profile to boost your institution's authority and reach.",
      );
    }

    const scoreMap: Record<string, number> = {
      Low: 1,
      Medium: 2,
      High: 3,
      Yes: 1,
      Partially: 2,
      Sometimes: 2,
      No: 3,
    };
    let totalScore = 0;
    Object.values(data).forEach((val) => {
      if (typeof val === 'string' && scoreMap[val]) totalScore += scoreMap[val];
    });

    const traffic = q2 || 'moderate';
    const priority =
      totalScore >= 28
        ? ProfilePriority.HIGH
        : totalScore >= 18
          ? ProfilePriority.MEDIUM
          : ProfilePriority.LOW;

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
        aiAnalysis:
          'Education Sector Analysis: Recruitment cycle management is the main challenge. A digital-first inquiry system will ensure no potential student is lost due to slow response.',
        aiSource: 'expert-system',
      },
    };
  }

  static calculateTech(data: Record<string, any>): {
    score: number;
    priority: ProfilePriority;
    insights: BusinessInsights;
  } {
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
      problems.push(
        'Inefficient response time to project inquiries causing potential lead friction.',
      );
      recommendations.push(
        'Implement a Structured Response & Intake system to qualify and engage leads instantly.',
      );
    }

    if (q7 === 'No' || q7 === 'Partially' || q8 === 'High') {
      problems.push(
        "Service/Package confusion - clients aren't fully grasping your tech value proposition.",
      );
      recommendations.push(
        'Use a Digital QR Portfolio and Clear Service Breakdown to articulate value and pricing tiers.',
      );
      qrStrategy.push(
        'Portfolio QR: Link directly to live demos, case studies, or GitHub repositories.',
      );
    }

    if (
      q9 === 'Medium' ||
      q9 === 'High' ||
      q10 === 'Medium' ||
      q10 === 'High'
    ) {
      problems.push('Low conversion from discussion to project start.');
      recommendations.push(
        'Deploy an automated follow-up and engagement system to nurture hesitant tech clients.',
      );
    }

    if (q11 === 'Medium' || q11 === 'High') {
      problems.push(
        'High project abandonment or client drop-off after starting.',
      );
      recommendations.push(
        'Implement a more robust digital onboarding and continuous project engagement flow.',
      );
    }

    if (q12 === 'No' || q12 === 'Sometimes' || q13 === 'No') {
      problems.push(
        'Missing a structured system for lead capture and follow-up.',
      );
      recommendations.push(
        "Use a 'Digital Intake' system to build a structured CRM and automate follow-ups for inactive clients.",
      );
      qrStrategy.push(
        'Contact QR: Use digital business cards to instantly capture lead data into your CRM.',
      );
    }

    if (q14 === 'No' || q14 === 'Sometimes' || q15 === 'No') {
      problems.push('Weak marketing awareness and promotion of tech services.');
      recommendations.push(
        'Leverage digital marketing tools and automated promotions to boost service visibility.',
      );
    }

    if (q16 === 'No' || q16 === 'Limited') {
      problems.push(
        'Weak digital infrastructure (Website/Portfolio) affecting credibility.',
      );
      recommendations.push(
        'Deploy a premium Digital Profile and Portfolio system to showcase your technical authority.',
      );
    }

    if (q17 === 'No' || q17 === 'Partially') {
      problems.push(
        'Lack of a structured client onboarding process creates friction for new projects.',
      );
      recommendations.push(
        'Deploy a step-by-step digital onboarding flow to collect requirements and set expectations.',
      );
    }

    if (q18 === 'Low') {
      qrStrategy.push(
        'Digital Touchpoint QR: Implement dash-links or client tools to increase digital brand interaction.',
      );
    }

    const scoreMap: Record<string, number> = {
      Low: 1,
      Medium: 2,
      High: 3,
      Yes: 1,
      Partially: 2,
      Sometimes: 2,
      No: 3,
      Fast: 1,
      Slow: 3,
      Limited: 2,
    };
    let totalScore = 0;
    Object.values(data).forEach((val) => {
      if (typeof val === 'string' && scoreMap[val]) totalScore += scoreMap[val];
    });

    const traffic = q2 || 'moderate';
    const priority =
      totalScore >= 28
        ? ProfilePriority.HIGH
        : totalScore >= 18
          ? ProfilePriority.MEDIUM
          : ProfilePriority.LOW;

    return {
      score: totalScore,
      priority,
      insights: {
        summary: `A ${data.techType || data.techServiceType || 'Technology'} firm handling ${traffic} projects monthly. Focus on intake automation and onboarding maturity.`,
        problems,
        recommendations,
        suggestedPackage:
          q2 === 'High' ? 'Platinum' : q2 === 'Medium' ? 'Gold' : 'Silver',
        packageReason: `The ${traffic.toLowerCase()} project volume requires ${q2 === 'High' ? 'executive' : 'professional'} level automation and CRM tools.`,
        qrStrategy,
        salesPitch: `In the tech industry, your onboarding and project clarity set the tone. Vemtap helps you qualify leads faster, showcase your portfolio via QR, and provide a premium digital onboarding experience that makes your agency stand out.`,
        aiAnalysis:
          'Tech Sector Analysis: The biggest revenue leak is usually in the lag between inquiry and project start. Automating the intake and documentation phase will significantly improve your conversion rates and operational speed.',
        aiSource: 'expert-system',
      },
    };
  }

  static calculateRealEstate(data: Record<string, any>): {
    score: number;
    priority: ProfilePriority;
    insights: BusinessInsights;
  } {
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
      problems.push(
        'Slow response time to property inquiries creates a bottleneck in lead conversion.',
      );
      recommendations.push(
        'Implement a structured inquiry system to automate initial responses and lead routing.',
      );
    }

    // PROPERTY VISIBILITY PROBLEM
    if (q7 === 'No' || q7 === 'Partially' || q8 === 'High') {
      problems.push('Property information gap and low listing visibility.');
      recommendations.push(
        'Deploy a digital property listing system via QR codes on signage to provide instant access to high-quality photos and specs.',
      );
      qrStrategy.push(
        "Property QR: Place on 'For Sale/Lease' signs to allow passersby to view full details instantly.",
      );
    }

    // LOW CONVERSION
    if (
      q9 === 'Medium' ||
      q9 === 'High' ||
      q10 === 'Medium' ||
      q10 === 'High'
    ) {
      problems.push(
        'Low lead-to-inspection conversion rate indicates a lack of engagement or clarity.',
      );
      recommendations.push(
        'Implement an automated follow-up and engagement system to nurture leads after viewing.',
      );
    }

    // NO-SHOW PROBLEM
    if (q11 === 'Medium' || q11 === 'High') {
      problems.push('High no-show rate for property inspections or meetings.');
      recommendations.push(
        'Enable an automated inspection reminder system via WhatsApp to confirm attendance.',
      );
      qrStrategy.push(
        'Inspection Booking QR: Allow leads to book viewing slots directly from your digital profile.',
      );
    }

    // NO CLIENT DATA
    if (q12 === 'No' || q12 === 'Sometimes') {
      problems.push('Inconsistent or missing structured lead data collection.');
      recommendations.push(
        'Deploy a lead capture system to build a high-intent property buyer and renter database.',
      );
      qrStrategy.push(
        'Contact QR: Use as a fast-entry point for potential buyers to leave their details.',
      );
    }

    // WEAK MARKETING
    if (q14 === 'No' || q14 === 'Sometimes' || q15 === 'No') {
      problems.push('Low perceived property value or limited outreach.');
      recommendations.push(
        'Use property promotion tools to broadcast listings to your existing lead database.',
      );
    }

    // WEAK DIGITAL PLATFORM
    if (q18 === 'No' || q18 === 'Limited') {
      problems.push(
        'Struggling with digital readiness and structured listings.',
      );
      recommendations.push(
        'Set up a high-converting digital listing/profile system to showcase your portfolio.',
      );
    }

    const scoreMap: Record<string, number> = {
      Low: 1,
      Medium: 2,
      High: 3,
      Yes: 1,
      Partially: 2,
      Sometimes: 2,
      No: 3,
      Fast: 1,
      Slow: 3,
      Limited: 2,
      None: 3,
    };
    let totalScore = 0;
    Object.values(data).forEach((val) => {
      if (typeof val === 'string' && scoreMap[val]) totalScore += scoreMap[val];
    });

    const traffic = q2 || 'moderate';
    const priority =
      totalScore >= 28
        ? ProfilePriority.HIGH
        : totalScore >= 18
          ? ProfilePriority.MEDIUM
          : ProfilePriority.LOW;

    return {
      score: totalScore,
      priority,
      insights: {
        summary: `A ${q1 || 'Real Estate'} business managing ${traffic} leads monthly. Focus on response speed and listing accessibility.`,
        problems,
        recommendations,
        suggestedPackage:
          q2 === 'High' ? 'Platinum' : q2 === 'Medium' ? 'Gold' : 'Silver',
        packageReason: `The ${traffic.toLowerCase()} lead volume requires ${q2 === 'High' ? 'enterprise' : 'professional'} level automation and listing management.`,
        qrStrategy,
        salesPitch: `Real estate is about speed and trust. Vemtap helps you turn signage into instant lead capture, automate inspection bookings, and provide 24/7 property discovery via QR, making your agency the most tech-forward in the area.`,
        aiAnalysis:
          'Real Estate Sector Analysis: The gap between inquiry and physical inspection is where most leads are lost. By providing instant digital details via QR, you qualify leads faster and reduce the cost per site visit.',
        aiSource: 'expert-system',
      },
    };
  }

  static calculateAutomotive(data: Record<string, any>): {
    score: number;
    priority: ProfilePriority;
    insights: BusinessInsights;
  } {
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
      problems.push(
        'High customer wait times before service starts causing friction.',
      );
      recommendations.push(
        'Implement a Digital Booking & Queue system to manage service flow and reduce onsite congestion.',
      );
    }

    // SERVICE CONFUSION
    if (q7 === 'No' || q7 === 'Partially' || q8 === 'High') {
      problems.push(
        'Service/Price confusion indicates a need for clearer process articulation.',
      );
      recommendations.push(
        'Deploy a QR Service Menu so customers can see exact pricing and service packages instantly.',
      );
      qrStrategy.push(
        'Service QR: Place at the reception or entrance for instant service/package breakdown.',
      );
    }

    // LOW CONVERSION
    if (
      q9 === 'Medium' ||
      q9 === 'High' ||
      q10 === 'Medium' ||
      q10 === 'High'
    ) {
      problems.push(
        'High revenue leak due to service hesitation or operational delays.',
      );
      recommendations.push(
        'Streamline the intake process with faster digital check-ins and better engagement tools.',
      );
    }

    // LOW RETENTION
    if (q11 === 'Medium' || q11 === 'High' || q11 === 'Low') {
      problems.push(
        'Low customer return rate after the first service indicates a retention gap.',
      );
      recommendations.push(
        'Deploy an automated follow-up system for oil changes, maintenance, and seasonal reminders.',
      );
    }

    // NO CUSTOMER DATA
    if (q12 === 'No' || q12 === 'Sometimes') {
      problems.push(
        'Missing a structured customer database for re-marketing and retention.',
      );
      recommendations.push(
        'Capture customer contact details digitally to automate the full service lifecycle marketing.',
      );
      qrStrategy.push(
        'Contact QR: Use as a fast-entry point for customers to leave their contact and car details.',
      );
    }

    // WEAK MARKETING
    if (q14 === 'No' || q14 === 'Sometimes' || q15 === 'No') {
      problems.push(
        'Weak marketing effort or low customer awareness of full service range.',
      );
      recommendations.push(
        'Use digital promotion tools to broadcast specials and maintenance packages to your database.',
      );
    }

    // QR PLACEMENT
    if (q17 === 'Medium' || q17 === 'High') {
      qrStrategy.push(
        'Waiting Area QR: Engage customers with car care tips and exclusive offers while they wait.',
      );
    }

    if (q16 === 'Yes' || q16 === 'clear') {
      qrStrategy.push(
        'Entrance QR: Allow customers to check in or view services before even speaking to staff.',
      );
    }

    const scoreMap: Record<string, number> = {
      Low: 1,
      Medium: 2,
      High: 3,
      Yes: 1,
      Partially: 2,
      Sometimes: 2,
      No: 3,
      clear: 1,
      Limited: 2,
      None: 3,
    };
    let totalScore = 0;
    Object.values(data).forEach((val) => {
      if (typeof val === 'string' && scoreMap[val]) totalScore += scoreMap[val];
    });

    const traffic = q2 || 'moderate';
    const priority =
      totalScore >= 28
        ? ProfilePriority.HIGH
        : totalScore >= 18
          ? ProfilePriority.MEDIUM
          : ProfilePriority.LOW;

    return {
      score: totalScore,
      priority,
      insights: {
        summary: `An Automotive ${q1 || 'Service'} business handling ${traffic} customers. Focus on retention automation and service check-in efficiency.`,
        problems,
        recommendations,
        suggestedPackage:
          q2 === 'High' ? 'Platinum' : q2 === 'Medium' ? 'Gold' : 'Silver',
        packageReason: `The ${traffic.toLowerCase()} traffic volume requires ${q2 === 'High' ? 'executive' : 'professional'} level lifecycle automation.`,
        qrStrategy,
        salesPitch: `Your customers value their cars and their time. Vemtap helps you provide a premium experience by reducing wait times with digital check-ins and ensuring they come back with automated service reminders.`,
        aiAnalysis:
          'Automotive Sector Analysis: Trust is built through transparency and consistency. A digital-first approach to service menus and follow-ups improves professional perception and builds long-term loyalty.',
        aiSource: 'expert-system',
      },
    };
  }

  static calculateLogistics(data: Record<string, any>): {
    score: number;
    priority: ProfilePriority;
    insights: BusinessInsights;
  } {
    if (!data) data = {};
    const problems: string[] = [];
    const recommendations: string[] = [];
    const qrStrategy: string[] = [];

    // Mapping 20 Questions
    const q1 = data.logisticsType; // Type of logistics business
    const q2 = data.dailyRequests; // Number of orders daily
    const q3 = data.requestChannel; // How customers request service
    const q4 = data.bookingManagement; // How they manage bookings
    const q5 = data.responseTime; // Response speed
    const q6 = data.delayComplaints; // Customer complaints about delays
    const q7 = data.trackingCapability; // Can customers track delivery
    const q8 = data.updateRequests; // Frequency of update requests
    const q9 = data.deliveryDelays; // Frequency of delivery delays
    const q10 = data.lostToDelays; // Customer loss due to delays
    const q11 = data.cancellationRate; // Booking cancellation frequency
    const q12 = data.collectsData; // Customer data collection
    const q13 = data.followUpEffort; // Post-service follow-up
    const q14 = data.serviceAwareness; // Customer awareness of services/routes
    const q15 = data.activePromotion; // Promotion effort
    const q16 = data.brandingVisibility; // Visible branding on vehicles/offices
    const q17 = data.digitalEngagement; // Digital interaction level
    const q18 = data.digitalOperations; // Digital platform for operations
    const q20 = data.improvementNeed; // Overall urgency

    // Logic Engine (Deterministic Rules)

    // SLOW RESPONSE / DISPATCH PROBLEM
    if (q5 === 'Medium' || q5 === 'Slow' || q6 === 'High' || q6 === 'Medium') {
      problems.push('Slow response and dispatch coordination bottlenecks.');
      recommendations.push(
        'Implement a Structured Booking & Dispatch system to handle requests more efficiently.',
      );
      qrStrategy.push(
        'Booking QR: Place on vehicles and physical materials for instant booking access.',
      );
    }

    // TRACKING PROBLEM
    if (q7 === 'No' || q7 === 'Limited' || q8 === 'High' || q8 === 'Medium') {
      problems.push(
        'Lack of real-time tracking visibility for customers leading to high support overhead.',
      );
      recommendations.push(
        "Deploy a Tracking & Automated Update system to reduce 'where is my order?' inquiries.",
      );
      qrStrategy.push(
        'Tracking QR: Include on physical receipts or waybills for instant self-service status checks.',
      );
    }

    // DELIVERY DELAY PROBLEM
    if (
      q9 === 'Medium' ||
      q9 === 'High' ||
      q10 === 'Medium' ||
      q10 === 'High'
    ) {
      problems.push(
        'Frequent delivery/trip delays impacting customer trust and retention.',
      );
      recommendations.push(
        'Improve operational coordination through better digital intake and automated scheduling.',
      );
    }

    // CANCELLATION PROBLEM
    if (q11 === 'Medium' || q11 === 'High') {
      problems.push('High order cancellation or incomplete booking rate.');
      recommendations.push(
        'Use automated booking confirmations and reminders to stabilize the order flow.',
      );
    }

    // NO CUSTOMER DATA
    if (q12 === 'No' || q12 === 'Sometimes') {
      problems.push(
        'Missing a structured customer database for repeat business and loyalty.',
      );
      recommendations.push(
        'Capture customer data digitally to enable easy re-booking and automated follow-ups.',
      );
      qrStrategy.push(
        'Contact QR: Use at dispatch points to capture verified customer details instantly.',
      );
    }

    // LOW RETENTION
    if (q13 === 'No' || q13 === 'Sometimes') {
      problems.push(
        'Insufficient post-service engagement to drive repeat usage.',
      );
      recommendations.push(
        'Implement an automated follow-up system to request feedback and offer loyalty incentives.',
      );
    }

    // WEAK MARKETING
    if (q14 === 'No' || q14 === 'Sometimes' || q15 === 'No') {
      problems.push(
        'Low market awareness of your full range of services or routes.',
      );
      recommendations.push(
        'Use digital promotion tools and WhatsApp broadcasting to keep customers informed of your service area.',
      );
    }

    // WEAK DIGITAL SYSTEM
    if (q18 === 'No' || q18 === 'Limited') {
      problems.push('Weak digital infrastructure for logistics operations.');
      recommendations.push(
        'Set up a comprehensive Digital Operations platform to manage dispatch, tracking, and customer history.',
      );
    }

    // Scoring & Priority mapping: Max score approx 60
    const scoreMap: Record<string, number> = {
      Low: 1,
      Medium: 2,
      High: 3,
      Slow: 3,
      Fast: 1,
      Yes: 1,
      Limited: 2,
      No: 3,
      Sometimes: 2,
      None: 3,
    };

    let totalScore = 0;
    Object.values(data).forEach((val) => {
      if (typeof val === 'string' && scoreMap[val]) totalScore += scoreMap[val];
    });

    const traffic = q2 || 'moderate';
    const suggestedPackage =
      q2 === 'High (100+ per day)'
        ? 'Platinum'
        : q2 === 'Medium (31 – 100 per day)'
          ? 'Gold'
          : 'Silver';
    const priority =
      totalScore >= 40
        ? ProfilePriority.HIGH
        : totalScore >= 20
          ? ProfilePriority.MEDIUM
          : ProfilePriority.LOW;

    return {
      score: totalScore,
      priority,
      insights: {
        summary: `A ${q1 || 'Logistics'} company handling ${traffic} daily requests. Focus on dispatch efficiency and tracking visibility.`,
        problems,
        recommendations,
        suggestedPackage,
        packageReason: `High-volume logistics require robust dispatch automation and real-time data flow to maintain profitability.`,
        qrStrategy,
        salesPitch: `In logistics, visibility is trust. Vemtap helps you eliminate tracking phone calls by giving customers a self-service QR code, while professionalizing your booking process to ensure you never miss a shipment.`,
        aiAnalysis:
          'Expert Logistics Analysis: Operational friction in the booking-to-dispatch transition is the primary cost driver. Digitalizing the intake phase will free up fleet capacity and increase daily turnover.',
        aiSource: 'expert-system',
      },
    };
  }

  static calculateConstruction(data: Record<string, any>): {
    score: number;
    priority: ProfilePriority;
    insights: BusinessInsights;
  } {
    if (!data) data = {};
    const problems: string[] = [];
    const recommendations: string[] = [];
    const qrStrategy: string[] = [];

    // Mapping 20 Questions
    const q1 = data.constructionType;
    const q2 = data.monthlyJobs;
    const q3 = data.leadSource;
    const q4 = data.requestChannel;
    const q5 = data.responseTime;
    const q6 = data.slowResponseComplaints;
    const q7 = data.serviceClarity;
    const q8 = data.preJobInquiries;
    const q9 = data.quoteDelay;
    const q10 = data.conversionLoss;
    const q11 = data.jobCancellations;
    const q12 = data.collectsData;
    const q13 = data.followUpEffort;
    const q14 = data.valuePerception;
    const q15 = data.activePromotion;
    const q16 = data.brandingVisibility;
    const q17 = data.digitalInteraction;
    const q18 = data.digitalPresence; // Portfolio
    const q20 = data.improvementNeed;

    // Logic Engine (Deterministic Rules)

    // SLOW RESPONSE PROBLEM
    if (q5 === 'Medium' || q5 === 'Slow' || q6 === 'High' || q6 === 'Medium') {
      problems.push(
        'Slow response time to job inquiries and site visit requests.',
      );
      recommendations.push(
        'Implement a Structured Job Request system to capture leads and requirements instantly.',
      );
      qrStrategy.push(
        'Quote Request QR: Place on physical signage and business cards for instant lead capture.',
      );
    }

    // SERVICE CONFUSION
    if (q7 === 'No' || q7 === 'Partially' || q8 === 'High' || q8 === 'Medium') {
      problems.push(
        'Service/Price confusion - clients ask too many questions before agreeing to a job.',
      );
      recommendations.push(
        'Use a Digital QR Profile to showcase your specialized services and previous projects clearly.',
      );
      qrStrategy.push(
        'Portfolio QR: Share your best work instantly via a scan to build trust and clarity.',
      );
    }

    // LOW CONVERSION / DELAYED APPROVAL
    if (
      q9 === 'Medium' ||
      q9 === 'High' ||
      q10 === 'Medium' ||
      q10 === 'High'
    ) {
      problems.push(
        'Low quote-to-job conversion rate and delayed quote approvals.',
      );
      recommendations.push(
        'Deploy an automated follow-up and engagement system to nurture leads after sending quotations.',
      );
    }

    // CANCELLATION PROBLEM
    if (q11 === 'Medium' || q11 === 'High') {
      problems.push('High job cancellation or rescheduling rate.');
      recommendations.push(
        'Enable automated booking confirmations and reminders to stabilize your schedule.',
      );
    }

    // NO CUSTOMER DATA
    if (q12 === 'No' || q12 === 'Sometimes') {
      problems.push(
        'Missing a structured customer database for repeat maintenance jobs.',
      );
      recommendations.push(
        'Capture customer data digitally to build a database for seasonal maintenance offers and referrals.',
      );
      qrStrategy.push(
        'Contact QR: Use at site handover to capture verified customer details for future jobs.',
      );
    }

    // LOW RETENTION
    if (q13 === 'No' || q13 === 'Sometimes') {
      problems.push(
        'Insufficient post-service engagement to drive referrals and repeat jobs.',
      );
      recommendations.push(
        'Implement a structured follow-up system to request reviews and offer maintenance plans.',
      );
    }

    // WEAK MARKETING
    if (q14 === 'No' || q14 === 'Sometimes' || q15 === 'No') {
      problems.push('Low perceived value and inconsistent active promotion.');
      recommendations.push(
        'Use digital promotion tools and WhatsApp broadcasting to showcase recent projects to your database.',
      );
    }

    // WEAK DIGITAL PRESENCE
    if (q18 === 'No' || q18 === 'Limited') {
      problems.push('Weak digital portfolio and professional positioning.');
      recommendations.push(
        'Set up a high-converting Digital Portfolio system to bridge the trust gap with new clients.',
      );
    }

    // Scoring & Priority mapping: Max score approx 60
    const scoreMap: Record<string, number> = {
      Low: 1,
      Medium: 2,
      High: 3,
      Slow: 3,
      Fast: 1,
      Yes: 1,
      Partially: 2,
      Sometimes: 2,
      No: 3,
      Limited: 2,
      None: 3,
    };

    let totalScore = 0;
    Object.values(data).forEach((val) => {
      if (typeof val === 'string' && scoreMap[val]) totalScore += scoreMap[val];
    });

    const constructionTraffic = q2 || 'moderate';
    const suggestedPackage =
      q2 === 'High (30+ per month)'
        ? 'Platinum'
        : q2 === 'Medium (11 – 30 per month)'
          ? 'Gold'
          : 'Silver';
    const priority =
      totalScore >= 40
        ? ProfilePriority.HIGH
        : totalScore >= 20
          ? ProfilePriority.MEDIUM
          : ProfilePriority.LOW;

    return {
      score: totalScore,
      priority,
      insights: {
        summary: `A ${q1 || 'Construction'} company handling ${constructionTraffic} jobs monthly. Focus on quote conversion and project visibility.`,
        problems,
        recommendations,
        suggestedPackage,
        packageReason: `The ${constructionTraffic.toLowerCase()} volume requires automated lead nurturing and a robust digital portfolio to maintain a steady pipeline.`,
        qrStrategy,
        salesPitch: `In home services, your portfolio is your reputation. Vemtap helps you capture job requests instantly while providing a professional digital profile that converts leads into high-value contracts faster.`,
        aiAnalysis:
          'Construction Analysis: The main profit leak is in the lag between quoting and approval. A digital-first engagement strategy will build trust faster and reduce lead decay.',
        aiSource: 'expert-system',
      },
    };
  }

  static calculateEvents(data: Record<string, any>): {
    score: number;
    priority: ProfilePriority;
    insights: BusinessInsights;
  } {
    if (!data) data = {};
    const problems: string[] = [];
    const recommendations: string[] = [];
    const qrStrategy: string[] = [];

    // Mapping 20 Questions
    const q1 = data.eventType;
    const q2 = data.monthlyEvents;
    const q3 = data.discoveryChannel;
    const q4 = data.bookingChannel;
    const q5 = data.responseTime;
    const q6 = data.slowResponseComplaints;
    const q7 = data.portfolioVisibility;
    const q8 = data.serviceInquiries;
    const q9 = data.decisionDelay;
    const q10 = data.conversionLoss;
    const q11 = data.bookingCancellations;
    const q12 = data.collectsData;
    const q13 = data.followUpEffort;
    const q14 = data.valuePerception;
    const q15 = data.activePromotion;
    const q16 = data.physicalSetup;
    const q17 = data.digitalInteraction;
    const q18 = data.digitalPresence; // Portfolio
    const q20 = data.improvementNeed;

    // SLOW RESPONSE PROBLEM
    if (q5 === 'Medium' || q5 === 'Slow' || q6 === 'High' || q6 === 'Medium') {
      problems.push('Slow response time to inquiry and booking requests.');
      recommendations.push(
        'Implement a Structured Booking & Response system to handle peak inquiry periods efficiently.',
      );
      qrStrategy.push(
        'Booking QR: Include on business cards and social media for instant, structured booking intake.',
      );
    }

    // PORTFOLIO VISIBILITY PROBLEM
    if (q7 === 'No' || q7 === 'Partially' || q8 === 'High' || q8 === 'Medium') {
      problems.push(
        "Low portfolio visibility - clients ask too many questions or can't see the full scope of your work.",
      );
      recommendations.push(
        'Deploy a rich Digital QR Portfolio showcasing high-res photos and videos of past events.',
      );
      qrStrategy.push(
        'Portfolio QR: Share your best work instantly via a scan at your venue, office, or during meetings.',
      );
    }

    // LOW CONVERSION
    if (
      q9 === 'Medium' ||
      q9 === 'High' ||
      q10 === 'Medium' ||
      q10 === 'High'
    ) {
      problems.push(
        'Low booking conversion rate after initial inquiry or quotation.',
      );
      recommendations.push(
        'Implement automated follow-ups and client engagement tools to nurture leads and secure bookings.',
      );
    }

    // CANCELLATION PROBLEM
    if (q11 === 'Medium' || q11 === 'High') {
      problems.push('High booking cancellation rate after confirmation.');
      recommendations.push(
        'Use automated booking confirmations and deposit reminders to stabilize your event calendar.',
      );
    }

    // NO CLIENT DATA
    if (q12 === 'No' || q12 === 'Sometimes') {
      problems.push(
        'Missing a structured client database for repeat bookings and remarketing.',
      );
      recommendations.push(
        'Capture client data digitally to enable easy re-booking and automated anniversary/loyalty offers.',
      );
      qrStrategy.push(
        'Contact QR: Use at event sites or dispatch points to capture verified client details instantly.',
      );
    }

    // LOW RETENTION
    if (q13 === 'No' || q13 === 'Sometimes') {
      problems.push(
        'Insufficient post-event engagement to drive referrals and repeat usage.',
      );
      recommendations.push(
        'Implement an automated follow-up system to request reviews and offer planning incentives for future events.',
      );
    }

    // WEAK MARKETING
    if (q14 === 'No' || q14 === 'Sometimes' || q15 === 'No') {
      problems.push('Low perceived value and inconsistent active promotion.');
      recommendations.push(
        'Use digital promotion tools and WhatsApp broadcasting to keep past clients informed of your latest events.',
      );
    }

    // WEAK DIGITAL PRESENCE
    if (q18 === 'No' || q18 === 'Limited') {
      problems.push(
        'Weak digital readiness and professional portfolio presence.',
      );
      recommendations.push(
        'Set up a comprehensive Digital Portfolio system to showcase high-quality media and build trust with new clients.',
      );
    }

    // Scoring & Priority mapping: Max score approx 60
    const scoreMap: Record<string, number> = {
      Low: 1,
      Medium: 2,
      High: 3,
      Slow: 3,
      Fast: 1,
      Yes: 1,
      Partially: 2,
      Sometimes: 2,
      No: 3,
      Limited: 2,
      None: 3,
    };

    let totalScore = 0;
    Object.values(data).forEach((val) => {
      if (typeof val === 'string' && scoreMap[val]) totalScore += scoreMap[val];
    });

    const traffic = q2 || 'moderate';
    const suggestedPackage =
      q2 === 'High (25+ per month)'
        ? 'Platinum'
        : q2 === 'Medium (9 – 25 per month)'
          ? 'Gold'
          : 'Silver';
    const priority =
      totalScore >= 40
        ? ProfilePriority.HIGH
        : totalScore >= 20
          ? ProfilePriority.MEDIUM
          : ProfilePriority.LOW;

    return {
      score: totalScore,
      priority,
      insights: {
        summary: `An ${q1 || 'Events'} business handling ${traffic} monthly bookings. Focus on portfolio visibility and lead conversion.`,
        problems,
        recommendations,
        suggestedPackage,
        packageReason: `The ${traffic.toLowerCase()} volume requires automated scheduling and a multi-media portfolio to maintain profitability and reputation.`,
        qrStrategy,
        salesPitch: `In events, seeing is believing. Vemtap helps you showcase your best work instantly via a scan, while automating your booking process to ensure you never lose a client to a slow response.`,
        aiAnalysis:
          'Events Analysis: Visual trust is the primary conversion driver. Moving from manual inquiries to a digital-first showcase will reduce lead friction and significantly increase your deposit rates.',
        aiSource: 'expert-system',
      },
    };
  }

  static calculateFinance(data: Record<string, any>): {
    score: number;
    priority: ProfilePriority;
    insights: BusinessInsights;
  } {
    if (!data) data = {};
    const problems: string[] = [];
    const recommendations: string[] = [];
    const qrStrategy: string[] = [];

    // Mapping 20 Questions
    const q1 = data.financeType;
    const q2 = data.customerVolume;
    const q5 = data.waitTime;
    const q6 = data.delayComplaints;
    const q7 = data.serviceClarity;
    const q8 = data.preServiceQuestions;
    const q9 = data.transactionHesitation;
    const q10 = data.transactionDropoff;
    const q11 = data.retentionIssue;
    const q12 = data.collectsData;
    const q13 = data.engagementLevel;
    const q14 = data.valuePerception;
    const q15 = data.customerEducation;
    const q18 = data.digitalPlatform;
    const q20 = data.improvementNeed;

    // WAITING PROBLEM
    if (
      q5?.startsWith('Medium') ||
      q5?.startsWith('High') ||
      q6 === 'High' ||
      q6 === 'Medium'
    ) {
      problems.push(
        'Extended customer wait times and service delivery bottlenecks.',
      );
      recommendations.push(
        'Implement a Digital Queue and Structured Onboarding system to manage branch traffic.',
      );
      qrStrategy.push(
        'Onboarding QR: Place at the entrance or agent desks for instant, self-service onboarding.',
      );
    }

    // TRUST / CONFUSION PROBLEM
    if (
      q7 === 'No' ||
      q7 === 'Partially' ||
      q8?.startsWith('High') ||
      q8?.startsWith('Medium')
    ) {
      problems.push(
        'Low service clarity - customers are confused about products or requirements.',
      );
      recommendations.push(
        'Deploy a detailed Digital Product Catalog and FAQ system to build transparency.',
      );
      qrStrategy.push(
        'Service Explanation QR: Use on brochures and branch posters to explain complex services instantly.',
      );
    }

    // TRANSACTION DROP-OFF
    if (
      q9?.startsWith('Medium') ||
      q9?.startsWith('High') ||
      q10?.startsWith('Medium') ||
      q10?.startsWith('High')
    ) {
      problems.push(
        'High transaction hesitation and premature drop-off during onboarding.',
      );
      recommendations.push(
        'Implement automated client engagement and follow-up tools to guide users through the process.',
      );
    }

    // LOW RETENTION
    if (q11?.startsWith('Medium') || q11?.startsWith('High')) {
      problems.push(
        'Weak customer retention - many clients fail to return after the first transaction.',
      );
      recommendations.push(
        'Enable automated follow-up and loyalty incentives to stabilize your client base.',
      );
    }

    // NO CUSTOMER DATA
    if (q12 === 'No' || q12 === 'Sometimes') {
      problems.push(
        'Lack of a structured customer database for remarketing or updates.',
      );
      recommendations.push(
        'Capture customer data digitally to enable secure follow-ups and automated reminders.',
      );
      qrStrategy.push(
        'Contact QR: Use at transaction points to capture verified customer details securely.',
      );
    }

    // POOR COMMUNICATION
    if (q13 === 'No' || q13 === 'Sometimes') {
      problems.push(
        'Inconsistent customer communication regarding updates and offers.',
      );
      recommendations.push(
        'Deploy an automated communication suite to keep clients informed and engaged.',
      );
    }

    // LOW TRUST / AWARENESS
    if (
      q14 === 'No' ||
      q14 === 'Sometimes' ||
      q15 === 'No' ||
      q15 === 'Sometimes'
    ) {
      problems.push(
        'Low customer awareness and perceived value of specialized services.',
      );
      recommendations.push(
        'Use digital education tools and WhatsApp broadcasting to inform clients about new financial products.',
      );
    }

    // WEAK DIGITAL PLATFORM
    if (q18 === 'No' || q18 === 'Limited') {
      problems.push(
        'Weak digital onboarding and readiness for modern financial services.',
      );
      recommendations.push(
        'Set up a comprehensive Digital Profile and Intake system to modernize your service delivery.',
      );
    }

    const scoreMap: Record<string, number> = {
      Low: 1,
      Medium: 2,
      High: 3,
      Slow: 3,
      Fast: 1,
      Yes: 1,
      Partially: 2,
      Sometimes: 2,
      No: 3,
      Limited: 2,
      None: 3,
      'Yes (very clear)': 1,
      'Yes (always)': 1,
      'Yes (regularly)': 1,
    };

    let totalScore = 0;
    Object.values(data).forEach((val) => {
      if (typeof val === 'string') {
        const key = val.split(' (')[0];
        if (scoreMap[key]) totalScore += scoreMap[key];
        else if (scoreMap[val]) totalScore += scoreMap[val];
      }
    });

    const priority =
      totalScore >= 35
        ? ProfilePriority.HIGH
        : totalScore >= 20
          ? ProfilePriority.MEDIUM
          : ProfilePriority.LOW;
    const volume = q2 || 'moderate';
    const suggestedPackage = q2?.startsWith('High')
      ? 'Platinum'
      : q2?.startsWith('Medium')
        ? 'Gold'
        : 'Silver';

    return {
      score: totalScore,
      priority,
      insights: {
        summary: `A ${q1 || 'Financial Service'} business handling ${volume} volume. Focus on trust building and onboarding efficiency.`,
        problems,
        recommendations,
        suggestedPackage,
        packageReason: `Financial operations require high-security automated data intake and clear service documentation to maintain client trust.`,
        qrStrategy,
        salesPitch: `Trust is built through transparency. Vemtap allows your clients to access service requirements instantly via QR, reducing their wait times and your staff's manual workload.`,
        aiAnalysis:
          'Finance Analysis: The primary barrier is information friction and the trust gap. Modernizing the entry point with digital intake reduces overhead and significantly improves client conversion rates.',
        aiSource: 'expert-system',
      },
    };
  }

  static calculateAgric(data: Record<string, any>): {
    score: number;
    priority: ProfilePriority;
    insights: BusinessInsights;
  } {
    if (!data) data = {};
    const problems: string[] = [];
    const recommendations: string[] = [];
    const qrStrategy: string[] = [];

    const q1 = data.agricType;
    const q2 = data.salesVolume;
    const q4 = data.orderMethod;
    const q5 = data.orderFriction;
    const q6 = data.commComplaints;
    const q7 = data.productVisibility;
    const q8 = data.availabilityQuestions;
    const q9 = data.purchaseDelay;
    const q10 = data.inquiryLoss;
    const q11 = data.retentionProblem;
    const q12 = data.collectsData;
    const q14 = data.valuePerception;
    const q15 = data.marketingEffort;
    const q18 = data.digitalPlatform;

    if (
      q4 === 'WhatsApp' ||
      q4 === 'Phone call' ||
      q5?.startsWith('Medium') ||
      q5?.startsWith('High')
    ) {
      problems.push(
        'Friction in ordering process and manual coordination load.',
      );
      recommendations.push(
        'Implement a Digital Order Management system to automate buyer requests.',
      );
      qrStrategy.push(
        'Order QR: Place in catalogs or at the farm gate for instant order placement.',
      );
    }

    if (q7 === 'No' || q7 === 'Partially' || q8?.startsWith('High')) {
      problems.push(
        'Low produce visibility leading to excessive pricing/availability inquiries.',
      );
      recommendations.push(
        'Deploy a Digital Product Catalog to showcase live stock and seasonal produce.',
      );
      qrStrategy.push(
        'Product QR: Allow buyers to scan and see current available harvest/stock instantly.',
      );
    }

    if (
      q9?.startsWith('Medium') ||
      q9?.startsWith('High') ||
      q10?.startsWith('Medium') ||
      q10?.startsWith('High')
    ) {
      problems.push(
        'Significant buyer hesitation and drop-off after initial inquiry.',
      );
      recommendations.push(
        'Use automated lead nurturing and engagement tools to close sales faster.',
      );
    }

    if (q11?.startsWith('Medium') || q11?.startsWith('High')) {
      problems.push(
        'Low recurring buyer rate and potential market access instability.',
      );
      recommendations.push(
        'Implement a structured loyalty and re-order reminder system for bulk buyers.',
      );
    }

    if (q12 === 'No' || q12 === 'Sometimes') {
      problems.push(
        'Lack of a buyer database for seasonal updates and repeat sales.',
      );
      recommendations.push(
        'Capture buyer data digitally at every touchpoint for direct re-marketing.',
      );
      qrStrategy.push(
        'Contact QR: Use at point of sale or shipment to capture verified buyer details.',
      );
    }

    if (q6?.startsWith('Medium') || q6?.startsWith('High')) {
      problems.push(
        'High dissatisfaction with response times and information flow.',
      );
      recommendations.push(
        'Automate routine buyer communications and status updates.',
      );
    }

    if (
      q14 === 'No' ||
      q14 === 'Sometimes' ||
      q15 === 'No' ||
      q15 === 'Sometimes'
    ) {
      problems.push(
        'Limited brand visibility and weak market value perception.',
      );
      recommendations.push(
        'Use digital promotion tools and WhatsApp broadcasting to expand your buyer network.',
      );
    }

    if (q18 === 'No' || q18 === 'Limited') {
      problems.push(
        'Insufficient digital presence to compete in modern agribusiness markets.',
      );
      recommendations.push(
        'Establish a high-quality Digital Profile to build trust with large-scale off-takers.',
      );
    }

    const scoreMap: Record<string, number> = {
      Low: 1,
      Medium: 2,
      High: 3,
      Yes: 1,
      Partially: 2,
      Sometimes: 2,
      No: 3,
      Limited: 2,
    };
    let totalScore = 0;
    Object.values(data).forEach((val) => {
      if (typeof val === 'string' && scoreMap[val]) totalScore += scoreMap[val];
    });

    const volume = q2 || 'moderate';
    const suggestedPackage = q2?.startsWith('High')
      ? 'Platinum'
      : q2?.startsWith('Medium')
        ? 'Gold'
        : 'Silver';
    const priority =
      totalScore >= 28
        ? ProfilePriority.HIGH
        : totalScore >= 18
          ? ProfilePriority.MEDIUM
          : ProfilePriority.LOW;

    return {
      score: totalScore,
      priority,
      insights: {
        summary: `A ${q1 || 'Agricultural'} business operating at ${volume} volume. Needs focus on supply chain transparency and buyer retention.`,
        problems,
        recommendations,
        suggestedPackage,
        packageReason: `The ${volume.toLowerCase()} scale of this agribusiness requires automated ordering and professional digital catalogs to secure high-value off-takers.`,
        qrStrategy,
        salesPitch: `Farming is about timing. Vemtap ensures you never miss a buyer's window by putting your catalog and ordering system directly in their hands via QR, while capturing the data you need to turn one-time buyers into loyal off-takers.`,
        aiAnalysis:
          "Agribusiness Analysis: The biggest gap in agriculture is often the 'last mile' of communication between harvest and sale. Digital catalogs bridge this gap by providing real-time visibility to buyers.",
        aiSource: 'expert-system',
      },
    };
  }

  static calculateGov(data: Record<string, any>): {
    score: number;
    priority: ProfilePriority;
    insights: BusinessInsights;
  } {
    if (!data) data = {};
    const problems: string[] = [];
    const recommendations: string[] = [];
    const qrStrategy: string[] = [];

    const q1 = data.govType;
    const q2 = data.citizenVolume;
    const q5 = data.queueTime;
    const q6 = data.delayComplaints;
    const q7 = data.procedureClarity;
    const q8 = data.repetitiveQuestions;
    const q9 = data.unpreparedCitizens;
    const q10 = data.citizenDropoff;
    const q11 = data.multipleReturns;
    const q12 = data.collectsData;
    const q13 = data.followUpLevel;
    const q14 = data.impactAwareness;
    const q15 = data.promotionEffort;
    const q18 = data.digitalPlatform;

    if (
      q5?.startsWith('Medium') ||
      q5?.startsWith('High') ||
      q6?.startsWith('Medium') ||
      q6?.startsWith('High')
    ) {
      problems.push(
        'Severe wait times and citizen dissatisfaction with queue management.',
      );
      recommendations.push(
        'Implement a Digital Queue & Appointment system to stabilize citizen flow.',
      );
      qrStrategy.push(
        'Appointment QR: Allow citizens to book slots before arrival to avoid long lines.',
      );
    }

    if (
      q7 === 'No' ||
      q7 === 'Partially' ||
      q8?.startsWith('Medium') ||
      q8?.startsWith('High') ||
      q9?.startsWith('Medium') ||
      q9?.startsWith('High')
    ) {
      problems.push(
        'Information gap - citizens arrive unprepared or with wrong documentation due to lack of clarity.',
      );
      recommendations.push(
        "Deploy a 'Citizen Service Guide' QR system to provide clear procedure checklists.",
      );
      qrStrategy.push(
        'Procedure QR: Place on entrance signage to list all required documents for specific services.',
      );
    }

    if (
      q11?.startsWith('Medium') ||
      q11?.startsWith('High') ||
      q10?.startsWith('Medium') ||
      q10?.startsWith('High')
    ) {
      problems.push(
        'Operational bottleneck leading to multiple return visits and high citizen drop-off.',
      );
      recommendations.push(
        'Use process tracking and automated reminders to ensure task completion in fewer visits.',
      );
    }

    if (q12 === 'No' || q12 === 'Sometimes') {
      problems.push(
        'Lack of a structured database for citizen communication and service updates.',
      );
      recommendations.push(
        'Capture citizen details digitally to send automated status updates and public notifications.',
      );
      qrStrategy.push(
        'Contact QR: Use at inquiry desks to build a digital registry for public notices.',
      );
    }

    if (
      q18 === 'No' ||
      q18 === 'Limited' ||
      q15 === 'No' ||
      q15 === 'Sometimes'
    ) {
      problems.push(
        'Weak digital access and limited public awareness of government programs.',
      );
      recommendations.push(
        'Set up a high-accessibility Digital Service Portal and use WhatsApp broadcasting for public notices.',
      );
    }

    const scoreMap: Record<string, number> = {
      Low: 1,
      Medium: 2,
      High: 3,
      Yes: 1,
      Partially: 2,
      Sometimes: 2,
      No: 3,
      Limited: 2,
      Strong: 1,
      None: 3,
      'Yes (very clear)': 1,
      'Yes (always)': 1,
      'Yes (regularly)': 1,
    };
    let totalScore = 0;
    Object.values(data).forEach((val) => {
      if (typeof val === 'string') {
        const key = val.split(' (')[0]; // Handle cases like 'Low (0-100...)'
        if (scoreMap[key]) totalScore += scoreMap[key];
        else if (scoreMap[val]) totalScore += scoreMap[val];
      }
    });

    const traffic = q2 || 'moderate';
    const finalPriority =
      totalScore >= 35
        ? ProfilePriority.HIGH
        : totalScore >= 22
          ? ProfilePriority.MEDIUM
          : ProfilePriority.LOW;

    return {
      score: totalScore,
      priority: finalPriority,
      insights: {
        summary: `A ${q1 || 'Public Service'} agency serving ${traffic} citizens. Main focus is queue reduction, procedure transparency, and digital service migration.`,
        problems,
        recommendations,
        suggestedPackage: 'Platinum',
        packageReason: `Scale of public operations, high citizen volume, and data security requirements mandate the Platinum ecosystem.`,
        qrStrategy,
        salesPitch: `Public service is about efficiency and trust. We can help you eliminate 'chaos' in the waiting room by giving citizens clear requirements via QR and a digital way to book appointments, making your office run like clockwork.`,
        aiAnalysis:
          'Government Analysis: Information asymmetry is the root of long public queues. Providing document checklists via Procedure QR and slot booking via Appointment QR will cut physical processing time by at least 50%.',
        aiSource: 'expert-system',
      },
    };
  }

  static calculateReligion(data: Record<string, any>): {
    score: number;
    priority: ProfilePriority;
    insights: BusinessInsights;
  } {
    if (!data) data = {};
    const problems: string[] = [];
    const recommendations: string[] = [];
    const qrStrategy: string[] = [];

    const q1 = data.orgType;
    const q2 = data.memberCount;
    const q5 = data.missedUpdates;
    const q6 = data.infoComplaints;
    const q7 = data.programAwareness;
    const q8 = data.programInquiries;
    const q9 = data.attendanceDropoff;
    const q10 = data.donationStruggle;
    const q11 = data.donationRegularity;
    const q12 = data.memberData;
    const q13 = data.followUpLevel;
    const q14 = data.missionUnderstanding;
    const q15 = data.promotionEffort;
    const q18 = data.digitalPlatform;

    if (
      q5?.startsWith('Medium') ||
      q5?.startsWith('High') ||
      q6?.startsWith('Medium') ||
      q6?.startsWith('High')
    ) {
      problems.push(
        'Member communication gap - important updates are being missed.',
      );
      recommendations.push(
        'Implement a dedicated Communication System to ensure all members receive real-time updates.',
      );
    }

    if (q7 === 'No' || q7 === 'Partially' || q8?.startsWith('High')) {
      problems.push('Low program/event awareness among the community.');
      recommendations.push(
        'Deploy a Program/Event Information System using QR codes for instant updates.',
      );
      qrStrategy.push(
        'Event QR: Place on bulletins and at the entrance for instant program details and news.',
      );
    }

    if (q9?.startsWith('Medium') || q9?.startsWith('High')) {
      problems.push(
        'Attendance drop-off during scheduled programs and activities.',
      );
      recommendations.push(
        'Use an automated Engagement & Reminder System to keep members active and committed.',
      );
    }

    if (
      q10?.startsWith('Medium') ||
      q10?.startsWith('High') ||
      q11?.startsWith('Medium') ||
      q11?.startsWith('High')
    ) {
      problems.push(
        'Fragile donation pipeline and struggle with consistent financial support.',
      );
      recommendations.push(
        'Set up a Digital Donation & Follow-up System to simplify the giving process for donors.',
      );
      qrStrategy.push(
        'Donation QR: Include in service programs or display on screens for seamless giving.',
      );
    }

    if (q12 === 'No' || q12 === 'Sometimes') {
      problems.push('Lack of a structured member/donor database.');
      recommendations.push(
        'Implement a Digital Member Capture system to securely store and manage community data.',
      );
      qrStrategy.push(
        'Registration QR: Position at welcome desks for instant first-timer onboarding.',
      );
    }

    if (q13 === 'No' || q13 === 'Sometimes') {
      problems.push('Weak member care and follow-up processes.');
      recommendations.push(
        'Deploy a Care Follow-up System to automate member outreach and support.',
      );
    }

    if (q14 === 'No' || q14 === 'Sometimes' || q15 === 'No') {
      problems.push('Limited mission visibility and outreach effectiveness.');
      recommendations.push(
        "Use Outreach & Promotion tools to better broadcast the organization's impact.",
      );
    }

    if (q18 === 'No' || q18 === 'Limited') {
      problems.push('Underdeveloped digital presence for member engagement.');
      recommendations.push(
        'Establish a robust Digital Platform/Profile to host sermons, news, and resources.',
      );
    }

    const scoreMap: Record<string, number> = {
      Low: 1,
      Medium: 2,
      High: 3,
      Yes: 1,
      Partially: 2,
      Sometimes: 2,
      No: 3,
      Limited: 2,
      'Yes (always)': 1,
      'Yes (regularly)': 1,
      'Yes (very clear)': 1,
      'Yes (strong)': 1,
    };
    let totalScore = 0;
    Object.values(data).forEach((val) => {
      if (typeof val === 'string' && scoreMap[val]) totalScore += scoreMap[val];
    });

    const priority =
      totalScore >= 31
        ? ProfilePriority.HIGH
        : totalScore >= 16
          ? ProfilePriority.MEDIUM
          : ProfilePriority.LOW;
    const suggestedPackage = q2?.startsWith('High')
      ? 'Platinum'
      : q2?.startsWith('Medium')
        ? 'Gold'
        : 'Silver';

    return {
      score: totalScore,
      priority,
      insights: {
        summary: `A ${q1 || 'Religious/NGO'} organization with ${q2 || 'moderate'} member count. Focus needed on ${problems[0] || 'member engagement'}.`,
        problems,
        recommendations,
        suggestedPackage,
        packageReason: `The ${suggestedPackage} plan is optimal for managing a community of this scale with automated engagement and donation tracking.`,
        qrStrategy,
        salesPitch: `Your mission is your impact. Vemtap helps you scale that impact by ensuring every member is heard, every donation is easy to make, and every first-timer is captured into your digital family instantly.`,
        aiAnalysis:
          'Organization Impact Analysis: Digital transformation can significantly boost both member engagement and donation regularity by removing physical barriers to giving and communication.',
        aiSource: 'expert-system',
      },
    };
  }

  static calculateOther(data: Record<string, any>): {
    score: number;
    priority: ProfilePriority;
    insights: BusinessInsights;
  } {
    if (!data) data = {};
    const problems: string[] = [];
    const recommendations: string[] = [];
    const qrStrategy: string[] = [];

    // Mapping 20 Questions for "Others"
    const q1 = data.businessDescription; // Open text
    const q2 = data.closestCategory; // Retail, Service-based...
    const q3 = data.customerVolume; // Low, Medium, High
    const q4 = data.reachMethod; // Phone, WhatsApp...
    const q5 = data.responseTime;
    const q6 = data.responseLoss;
    const q7 = data.discoveryMethod; // Menu/Service visibility
    const q8 = data.routineQuestions;
    const q9 = data.buyingHesitation;
    const q10 = data.visibilityLoss;
    const q11 = data.bookingMethod; // Appointments
    const q12 = data.noShows;
    const q13 = data.collectsData;
    const q14 = data.followUpMethod;
    const q15 = data.retentionDrop;
    const q16 = data.promotionMethod;
    const q17 = data.hasPhysicalPresence;
    const q18 = data.digitalSystem;
    const q19 = data.biggestChallenge;
    const q20 = data.urgency;

    // Logic Engine
    if (
      q5?.startsWith('Medium') ||
      q5?.startsWith('High') ||
      q6?.startsWith('Medium') ||
      q6?.startsWith('High')
    ) {
      problems.push('Inquiry response bottlenecks causing customer drop-off.');
      recommendations.push(
        'Implement a structured digital response system to handle inquiries instantly.',
      );
      qrStrategy.push(
        'Contact/Inquiry QR: Capture lead details and requirements automatically via scan.',
      );
    }

    if (
      q7 === 'No' ||
      q7 === 'Partially' ||
      q8?.startsWith('High') ||
      q10?.startsWith('High')
    ) {
      problems.push(
        'Low service visibility leading to confusion and lost sales.',
      );
      recommendations.push(
        'Deploy a rich Digital QR Catalog/Menu to showcase your unique offerings clearly.',
      );
      qrStrategy.push(
        'Service QR: Place prominently to explain your business model and pricing instantly.',
      );
    }

    if (q9?.startsWith('Medium') || q9?.startsWith('High')) {
      problems.push('High customer hesitation before conversion.');
      recommendations.push(
        'Use automated engagement tools to build trust and close sales faster.',
      );
    }

    if (
      q11 === 'Manual' ||
      q12?.startsWith('Medium') ||
      q12?.startsWith('High')
    ) {
      problems.push(
        'Inefficient appointment management and high no-show risk.',
      );
      recommendations.push(
        'Implement a Digital Booking & Reminder system to stabilize your schedule.',
      );
      qrStrategy.push(
        'Booking QR: Allow customers to schedule appointments directly from their phones.',
      );
    }

    if (q13 === 'No' || q13 === 'Sometimes' || q15?.startsWith('High')) {
      problems.push('Weak customer data capture and retention efforts.');
      recommendations.push(
        'Implement a Digital Customer Capture and automated loyalty system.',
      );
      qrStrategy.push(
        'Customer Capture QR: Build your private database for seasonal re-marketing.',
      );
    }

    if (q16 === 'No' || q16 === 'Rarely' || q14 === 'No') {
      problems.push('Limited active promotion and post-service follow-up.');
      recommendations.push(
        'Use digital promotion tools and automated follow-ups to drive repeat business.',
      );
    }

    if (q18 === 'No' || q18 === 'Limited') {
      problems.push(
        'Underdeveloped digital infrastructure for specialized operations.',
      );
      recommendations.push(
        'Establish a centralized Digital Business Profile to manage communications and data.',
      );
    }

    const scoreMap: Record<string, number> = {
      Low: 1,
      Medium: 2,
      High: 3,
      Yes: 1,
      Partially: 2,
      Sometimes: 2,
      No: 3,
      Limited: 2,
      None: 3,
      Manual: 3,
      Digital: 1,
      'Yes (always)': 1,
      'Yes (regularly)': 1,
      'Yes (very clear)': 1,
    };

    let totalScore = 0;
    Object.values(data).forEach((val) => {
      if (typeof val === 'string') {
        const key = val.split(' (')[0];
        if (scoreMap[key]) totalScore += scoreMap[key];
        else if (scoreMap[val]) totalScore += scoreMap[val];
      }
    });

    const priority =
      totalScore >= 35
        ? ProfilePriority.HIGH
        : totalScore >= 20
          ? ProfilePriority.MEDIUM
          : ProfilePriority.LOW;
    const traffic = q3 || 'moderate';
    const suggestedPackage = q3?.startsWith('High')
      ? 'Platinum'
      : q3?.startsWith('Medium')
        ? 'Gold'
        : 'Silver';

    return {
      score: totalScore,
      priority,
      insights: {
        summary: `A unique ${q2 || 'custom'} business. Main focus: ${problems[0] || 'digitizing customer interactions'}.`,
        problems,
        recommendations,
        suggestedPackage,
        packageReason: `The ${suggestedPackage} plan is designed to bring structured automation to ${traffic.toLowerCase()} volume operations.`,
        qrStrategy,
        salesPitch: `Your business is unique, and your technology should be too. Vemtap helps you automate the "boring stuff" like answering routine questions and capturing data, so you can focus on your craft.`,
        aiAnalysis:
          'Unique Sector Analysis: Specialized businesses often leak revenue in the communication gaps. Closing these gaps with digital touchpoints will professionalize the brand and increase conversion.',
        aiSource: 'expert-system',
      },
    };
  }
}
