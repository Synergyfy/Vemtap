import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { TrainingService } from './modules/training/training.service';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const trainingService = app.get(TrainingService);

  console.log('--- Cleaning old training data ---');
  const existing = await trainingService.findAllCourses();
  for (const course of existing) {
    await trainingService.deleteCourse(course.id);
  }

  console.log('--- Seeding Fresh Training Content ---');

  const orientationCourse = await trainingService.createCourse({
    title: 'Vemtap Affiliate Orientation',
    description:
      'Master the art of offline-to-online conversion and start earning commissions.',
    level: 'Beginner',
    duration: '45 mins',
    order: 1,
    scenarios: [
      {
        scenario:
          "You walk into a busy restaurant. The manager is occupied. What's your first move?",
        options: [
          {
            text: 'Interrupt and show your NFC tag immediately.',
            correct: false,
            feedback: 'Too aggressive. Wait for a natural opening.',
          },
          {
            text: "Observe their current 'menu' situation and wait for a calm moment.",
            correct: true,
            feedback: 'Perfect. Observation helps you tailor your pitch.',
          },
          {
            text: 'Leave a flyer on the counter and walk out.',
            correct: false,
            feedback: 'Low conversion. Personal connection is key.',
          },
        ],
      },
      {
        scenario:
          "The client asks: 'Why is this better than a simple QR code?'",
        options: [
          {
            text: "It's not, it's just fancier.",
            correct: false,
            feedback:
              'Incorrect. NFC offers higher engagement and data capture.',
          },
          {
            text: 'NFC is faster, more secure, and works even without scanning an app.',
            correct: true,
            feedback: "Exactly. The friction-less 'Tap' experience is the win.",
          },
        ],
      },
    ],
    quiz: [
      {
        question:
          'What is the standard direct commission for a Vemtap referral?',
        options: ['10%', '15%', '20%', '25%'],
        correct: 2,
      },
      {
        question: 'How long does a typical payout take to process?',
        options: ['Instant', '24-48 Business Hours', '7 Days', '30 Days'],
        correct: 1,
      },
    ],
  });

  await trainingService.createLesson(orientationCourse.id, {
    title: 'The Vemtap Value Proposition',
    content: `
# Why Vemtap?
Traditional paper menus and business cards are dead. Vemtap bridges the gap by:
1. **Capturing Data**: Every tap is a lead.
2. **Automating Loyalty**: No more stamp cards.
3. **Real-time Updates**: Change your menu in 2 seconds.

## Your Role
As an affiliate, you are not just selling a tool; you are selling **growth**.
    `,
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    duration: '5 mins',
    order: 1,
    summary: [
      'Understand data capture value',
      'Focus on merchant growth',
      'Setup your NFC demo tag',
    ],
  });

  await trainingService.createLesson(orientationCourse.id, {
    title: 'Your First 48 Hours',
    content: `
# Getting Started
1. **Order Tags**: Use the 'Tools' section to get your demo kit.
2. **Initial Outreach**: Start with 10 businesses you already visit.
3. **Dashboard Tracking**: Track your pending commissions in the Wallet.

## Pro Tip
Always lead with a 'Free Trial' offer. Most merchants can't say no to a 7-day test run.
    `,
    duration: '10 mins',
    order: 2,
    summary: [
      'Get your demo kit',
      'Start with friends/family businesses',
      'Use the 7-day trial hook',
    ],
  });

  console.log('Seeding complete! Academy is now LIVE with data.');
  await app.close();
}

bootstrap();
