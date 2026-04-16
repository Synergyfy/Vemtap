import type { QRData } from '../types/qr';

export const DEMO_DATA: Record<string, Partial<QRData>> = {
  url: {
    type: 'url',
    url: 'https://www.example.com'
  },
  vcard: {
    type: 'vcard',
    vcard: {
      firstName: 'Kyle',
      lastName: 'Thorsen',
      mobile: '(001) 555-1000',
      email: 'kyle.thorsen@studio.com',
      website: 'www.webcrafters.com',
      jobTitle: 'Senior Web Developer',
      company: 'WebCrafters Studio',
      address: '123 Innovation Drive, Silicon Valley, CA',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop'
    }
  },
  business: {
    type: 'business',
    business: {
      companyName: 'WebCrafters Studio',
      headline: 'Modern Web Solutions for Everyone',
      about: 'As a senior web developer at WebCrafters Studio, I am proud to provide the best website development service in Europe!',
      logo: 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=400&h=400&fit=crop',
      banner: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200&h=600&fit=crop',
      contact: {
        phone: '(001) 555-1000',
        email: 'hello@webcrafters.com',
        website: 'https://webcrafters.studio',
        address: '123 Innovation Drive, Silicon Valley, CA'
      },
      openingHours: {
        monday: '09:00 - 18:00',
        tuesday: '09:00 - 18:00',
        wednesday: '09:00 - 18:00',
        thursday: '09:00 - 18:00',
        friday: '09:00 - 17:00',
        saturday: 'Closed',
        sunday: 'Closed'
      }
    }
  },
  socials: {
    type: 'socials',
    socials: {
      name: 'Sarah Ann Peters',
      bio: "Hi! I'm Sarah Ann Peters. Welcome to my social media hub! The links below will connect you with my channels on every popular platform.",
      images: [
        { id: 'd1', url: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80" },
        { id: 'd2', url: "https://images.unsplash.com/photo-1531746020798-e7953e3e83f8?auto=format&fit=crop&w=400&q=80" },
        { id: 'd3', url: "https://images.unsplash.com/photo-1554151228-14d9def656e4?auto=format&fit=crop&w=400&q=80" }
      ],
      instagram: 'https://instagram.com/webcrafters',
      facebook: 'https://facebook.com/webcrafters',
      twitter: 'https://twitter.com/webcrafters',
      linkedin: 'https://linkedin.com/company/webcrafters',
      youtube: 'https://youtube.com/webcrafters',
      tiktok: 'https://tiktok.com/@webcrafters'
    }
  },
  links: {
    type: 'links',
    linksInfo: {
      title: 'My Digital Presence',
      description: 'Check out all my professional links and projects in one place.',
      themeColor: '#2563eb',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop'
    },
    linksList: [
      { title: 'Portfolio Website', url: 'https://portfolio.me' },
      { title: 'Latest Blog Post', url: 'https://blog.me/post/1' },
      { title: 'Hire Me on Upwork', url: 'https://upwork.com/me' }
    ]
  },
  wifi: {
    type: 'wifi',
    wifi: {
      ssid: 'Guest_WiFi_HighSpeed',
      password: 'demo-password-123',
      encryption: 'WPA'
    }
  },
  text: {
    type: 'text',
    text: 'Hello! This is a demo message encoded in a QR code. QR Thrive makes it easy to share any text instantly!'
  },
  whatsapp: {
    type: 'whatsapp',
    whatsapp: {
      phoneNumber: '1234567890',
      message: 'Hi! I saw your business on QR Thrive and would like to learn more.'
    }
  },
  email: {
    type: 'email',
    email: {
      address: 'hello@example.com',
      subject: 'Inquiry from QR Code',
      body: 'Hi, I would like to get more information about your services.'
    }
  },
  phone: {
    type: 'phone',
    phone: {
      number: '+1234567890'
    }
  },
  sms: {
    type: 'sms',
    sms: {
      number: '+1234567890',
      message: 'Hi! I am interested in your services. Please contact me back.'
    }
  },
  pdf: {
    type: 'pdf',
    pdf: {
      id: 'demo-pdf',
      name: 'Business_Proposal.pdf',
      url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf'
    }
  },
  video: {
    type: 'video',
    video: {
      id: 'demo-video',
      url: 'https://www.w3schools.com/html/mov_bbb.mp4',
      name: 'Product_Demo.mp4',
      platform: 'other'
    }
  },
  image: {
    type: 'image',
    images: [
      { id: 'img1', url: 'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d', name: 'Workstation' },
      { id: 'img2', url: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085', name: 'Coding' },
      { id: 'img3', url: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c', name: 'Terminal' }
    ]
  },
  mp3: {
    type: 'mp3',
    mp3: {
      id: 'demo-mp3',
      name: 'The Future of QR Technology',
      url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
      companyName: 'TechTalk Weekly',
      title: 'Episode #42: Digital Engagement',
      description: 'Join us as we discuss how QR codes are revolutionizing the way we interact with the physical world and digital content.',
      themeColor: '#1e40af',
      textColor: '#ffffff',
      buttonColor: 'rgba(255,255,255,0.15)',
      buttonTextColor: '#ffffff'
    }
  },
  menu: {
    type: 'menu',
    menu: {
      restaurantName: 'Thrive Bistro',
      description: 'Delicious & Healthy Meals',
      currency: '$',
      categories: [
        {
          id: '1',
          name: 'Starters',
          items: [
            { id: '1-1', name: 'Fresh Spring Rolls', description: 'Vegetables wrapped in rice paper', price: 8 },
            { id: '1-2', name: 'Tomato Bruschetta', description: 'Grilled bread with garlic and tomatoes', price: 10 }
          ]
        },
        {
          id: '2',
          name: 'Main Courses',
          items: [
            { id: '2-1', name: 'Grilled Salmon', description: 'Served with roasted vegetables', price: 22 },
            { id: '2-2', name: 'Mushroom Risotto', description: 'Creamy Arborio rice with wild mushrooms', price: 18 }
          ]
        }
      ]
    }
  },
  coupon: {
    type: 'coupon',
    coupon: {
      title: 'Spring Sale 20% OFF',
      companyName: 'Thrive Fashion',
      discount: '20% OFF',
      description: 'Use this coupon on your next purchase at Thrive Fashion!',
      promoCode: 'SPRING20',
      validUntil: '2026-06-30'
    }
  },
  app: {
    type: 'app',
    app: {
      ios: 'https://apps.apple.com',
      android: 'https://play.google.com'
    }
  },
  booking: {
    type: 'booking',
    booking: {
      businessName: 'Luxe Wellness Spa',
      title: 'Full Body Massage & Aromatherapy',
      description: 'Experience deep relaxation with our signature 90-minute treatment. Our expert therapists use organic essential oils to rejuvenate your body and mind.',
      location: 'Downtown Wellness Center, NY',
      bookingUrl: 'https://calendly.com/demo-booking',
      imageUrl: 'https://images.unsplash.com/photo-1544161515-4ae6b918af99?w=800&h=600&fit=crop',
      profileImageUrl: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=400&h=400&fit=crop',
      price: '$120',
      duration: '90 Min',
      themeColor: '#4f46e5',
      buttonText: 'Schedule Session',
      destinationMode: 'calendar'
    }
  }
};
