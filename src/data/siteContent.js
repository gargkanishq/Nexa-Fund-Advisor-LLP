export const COMPANY = {
  name: 'Nexa Fund Advisor LLP',
  shortName: 'Nexa Fund Advisor',
  tagline: 'Smart Finance, Right Guidance',
  category: 'Loan Facilitation, Financial Advisory and Banking Assistance',
  phoneDisplay: '+91 98914 43855',
  phoneHref: 'tel:+919891443855',
  whatsappNumber: '919891443855',
  whatsappDefaultMessage: 'Hello Nexa Fund Advisor, I would like assistance with a loan enquiry.',
  get whatsappHref() {
    return `https://wa.me/${this.whatsappNumber}?text=${encodeURIComponent(this.whatsappDefaultMessage)}`;
  },
  email: 'support@nexafundadvisor.com',
  emailHref: 'mailto:support@nexafundadvisor.com',
  instagramHandle: '@nexafundadvisors',
  instagramHref: 'https://www.instagram.com/nexafundadvisors/',
  websiteUrl: 'https://nexafundadvisor.com',
  addressLine1: 'D-12/25-26, IIIrd Floor,',
  addressLine2: 'Rohini, Delhi – 110085, India',
  fullAddress: 'D-12/25-26, IIIrd Floor, Rohini, Delhi – 110085, India',
  landmark: 'Beside Rohini East Metro Station, Gate No. 2',
  googleMapsUrl:
    'https://www.google.com/maps/search/?api=1&query=D-12%2F25-26%2C+Rohini+East+Metro+Station+Gate+No.+2%2C+Rohini%2C+Delhi+110085',
  googleMapsEmbedUrl:
    'https://maps.google.com/maps?q=Rohini%20East%20Metro%20Station%20Gate+No.%202%2C%20Rohini%2C%20Delhi%20110085&t=&z=16&ie=UTF8&iwloc=&output=embed',
  presence: 'Delhi',
  logoPrimary: '/images/Company Design Assets/NFA LOGO.png',
  logoMonogram: '/images/Company Design Assets/NFA LOGO-TYPE 2.png',
};

export const FOUNDER = {
  name: 'Mr. Gopal Arora',
  role: 'Founder, Nexa Fund Advisor LLP',
  previousDesignation: 'Former Chief Manager, UCO Bank',
  experienceHeadline: '38 Years of Banking Experience',
  photo: '/images/Gopal-Arora_Founder_Photo.PNG',
  shortBio:
    'With 38 years of experience in public sector banking, our founder, Mr. Gopal Arora, brings practical banking knowledge and a customer-first approach to loan facilitation.',
  pillars: [
    '38 years in Public Sector Banking',
    'Former Chief Manager, UCO Bank',
    'Deep retail lending & documentation insight',
    'Established relationships across the banking ecosystem',
  ],
};

export const BANKING_PARTNERS = [
  {
    id: 'sbi',
    name: 'State Bank of India',
    logo: '/images/Bank Logo/SBI_logo.jpg',
    bgTint: '#FFFFFF',
  },
  {
    id: 'pnb-hf',
    name: 'PNB Housing Finance',
    logo: '/images/Bank Logo/PNB-HF_logo.jpg',
    bgTint: '#FFFFFF',
  },
  {
    id: 'bob',
    name: 'Bank of Baroda',
    logo: '/images/Bank Logo/BOB_logo.png',
    bgTint: '#FFFFFF',
  },
  {
    id: 'canara-bank',
    name: 'Canara Bank',
    logo: '/images/Bank Logo/CanaraBank_logo.jpg',
    bgTint: '#FFFFFF',
  },
  {
    id: 'iob',
    name: 'Indian Overseas Bank',
    logo: '/images/Bank Logo/IOB_logo.png',
    bgTint: '#FFFFFF',
  },
  {
    id: 'indian-bank',
    name: 'Indian Bank',
    logo: '/images/Bank Logo/IndianBank_logo.jpg',
    bgTint: '#FFFFFF',
  },
  {
    id: 'uco',
    name: 'UCO Bank',
    logo: '/images/Bank Logo/UCO_logo.jpg',
    bgTint: '#FFFFFF',
  },
  {
    id: 'boi',
    name: 'Bank of India',
    logo: '/images/Bank Logo/BOI_logo.jpg',
    bgTint: '#FFFFFF',
  },
  {
    id: 'bank-of-maharashtra',
    name: 'Bank of Maharashtra',
    logo: '/images/Bank Logo/Bank-of-Maharashtra_Logo.jpg',
    bgTint: '#FFFFFF',
  },
  {
    id: 'ubi',
    name: 'Union Bank of India',
    logo: '/images/Bank Logo/UBI_logo.png',
    bgTint: '#FFFFFF',
  },
  {
    id: 'lic-hf',
    name: 'LIC Housing Finance',
    logo: '/images/Bank Logo/LIC_logo.jpg',
    bgTint: '#FFFFFF',
  },
  {
    id: 'additional-banks',
    name: 'Additional Lending Institutions',
    logo: '/images/Bank Logo/ManyMoreBanks_logo.jpg',
    bgTint: '#FFFFFF',
  },
];

export const BUSINESS_ACHIEVEMENTS = [
  {
    id: 'loan-volume',
    targetValue: 8,
    prefix: '₹',
    suffix: ' Crore+',
    label: 'Loan Amount Facilitated',
    description: 'Structured home financing & institutional borrowing solutions',
  },
  {
    id: 'families-served',
    targetValue: 30,
    prefix: '',
    suffix: '+',
    label: 'Families Served',
    description: 'Guided with personalized support through loan sanction & disbursement',
  },
];

export const CUSTOMER_TESTIMONIALS = [
  {
    id: 'testimonial-1',
    clientName: 'Rajesh Sharma',
    clientProfession: 'Senior IT Professional',
    clientLocation: 'Rohini, Delhi',
    loanType: 'Home Loan Facilitation',
    bankType: 'Public Sector Bank',
    quote:
      'The entire paperwork and banking process was handled with exceptional clarity. Having former public sector bank management experience on our side helped avoid repetitive bank visits and cleared our file with zero friction.',
  },
  {
    id: 'testimonial-2',
    clientName: 'Amit Verma',
    clientProfession: 'Finance Professional',
    clientLocation: 'Delhi NCR',
    loanType: 'Home Loan Balance Transfer',
    bankType: 'Public Sector Bank',
    quote:
      'We wanted to review whether transferring our ongoing home loan made financial sense. Nexa gave us an objective net-savings calculation after all transfer charges before submitting a single document. Truly transparent.',
  },
  {
    id: 'testimonial-3',
    clientName: 'Vikram Malhotra',
    clientProfession: 'Business Owner',
    clientLocation: 'Delhi',
    loanType: 'Housing & Property Finance',
    bankType: 'Public Sector Bank',
    quote:
      'Documentation scrutiny before submitting to the bank was thorough. Mr. Gopal Arora’s procedural guidance ensured our income and property documents moved smoothly through bank appraisal to disbursement.',
  },
];

export const SERVICES = [
  {
    id: 'home-loans',
    slug: 'home-loans',
    title: 'Home Loans',
    categoryTag: 'Our Specialization',
    shortDescription:
      'Guidance on suitable home financing options, documentation, and bank coordination.',
    details:
      'Officially empanelled with multiple public sector banks for home loan services. We assist from initial eligibility check through application and disbursement.',
    highlights: [
      'Empanelled across multiple PSU banks',
      'EMI & option comparisons',
      'End-to-end documentation & follow-up',
    ],
    route: '/services#home-loans',
    ctaLabel: 'Learn More',
  },
  {
    id: 'home-loan-balance-transfer',
    slug: 'home-loan-balance-transfer',
    title: 'Home Loan Balance Transfer',
    categoryTag: 'Refinancing',
    shortDescription:
      'Compare your existing home loan with lower-rate options to evaluate potential savings.',
    details:
      'Evaluate whether transferring your outstanding principal to another bank could reduce your interest cost after accounting for remaining tenure and transfer fees.',
    highlights: [
      'Current vs proposed EMI comparison',
      'Gross vs net savings after transfer costs',
      'Complete transfer paperwork coordination',
    ],
    route: '/home-loan-balance-transfer',
    ctaLabel: 'Calculate Savings',
  },
  {
    id: 'personal-loans',
    slug: 'personal-loans',
    title: 'Personal Loans',
    categoryTag: 'Loan Facilitation',
    shortDescription:
      'Assistance identifying suitable personal loan options matched to your repayment profile.',
    details:
      'Structured facilitation to help salaried and self-employed individuals compare personal loan terms, total repayment outgo, and documentation requirements.',
    highlights: [
      'Clear EMI & repayment comparison',
      'Income & eligibility review',
      'Application coordination to disbursement',
    ],
    route: '/services#personal-loans',
    ctaLabel: 'Learn More',
  },
  {
    id: 'education-loans',
    slug: 'education-loans',
    title: 'Education Loans',
    categoryTag: 'Loan Facilitation',
    shortDescription:
      'Support for students and families navigating domestic and overseas study financing.',
    details:
      'Clear assistance preparing admission records, co-applicant income proofs, and collateral requirements for higher education loans.',
    highlights: [
      'Domestic & overseas study financing',
      'Co-applicant document checklist',
      'Coordinated bank follow-up',
    ],
    route: '/services#education-loans',
    ctaLabel: 'Learn More',
  },
  {
    id: 'car-loans',
    slug: 'car-loans',
    title: 'Car Loans',
    categoryTag: 'Loan Facilitation',
    shortDescription:
      'Guidance exploring vehicle financing with clear EMI and tenure comparisons.',
    details:
      'Compare direct bank and vehicle financing options transparently, with full clarity on processing fees and documentation before applying.',
    highlights: [
      'Tenure & EMI comparisons',
      'Transparent fee breakdown',
      'Smooth paperwork coordination',
    ],
    route: '/services#car-loans',
    ctaLabel: 'Learn More',
  },
  {
    id: 'business-loans',
    slug: 'business-loans',
    title: 'Business Loans',
    categoryTag: 'Loan Facilitation',
    shortDescription:
      'Assistance for enterprises and professionals seeking working capital or growth finance.',
    details:
      'Guidance organising ITRs, financial statements, GST records, and banking summaries to match institutional lending standards.',
    highlights: [
      'MSME, proprietor & professional support',
      'Financial file readiness check',
      'End-to-end institutional coordination',
    ],
    route: '/services#business-loans',
    ctaLabel: 'Learn More',
  },
  {
    id: 'loan-against-property',
    slug: 'loan-against-property',
    title: 'Loan Against Property',
    categoryTag: 'Loan Facilitation',
    shortDescription:
      'Guidance for property owners exploring secured financing against eligible property.',
    details:
      'Unlock capital against residential or commercial property with structured assistance across title verification, income review, and bank coordination.',
    highlights: [
      'Title chain & property pre-check',
      'Repayment capacity estimation',
      'Legal & technical coordination support',
    ],
    route: '/services#loan-against-property',
    ctaLabel: 'Learn More',
  },
];

export const HOW_IT_WORKS_STEPS = [
  {
    step: '01',
    title: 'Share Your Requirements',
    description: 'Tell us your loan goal and basic profile.',
  },
  {
    step: '02',
    title: 'Explore Loan Options',
    description: 'Identify suitable lending institutions for your need.',
  },
  {
    step: '03',
    title: 'Compare and Evaluate',
    description: 'Review EMIs, savings, and bank charges clearly.',
  },
  {
    step: '04',
    title: 'Complete Documentation',
    description: 'Organise KYC, income, and property files accurately.',
  },
  {
    step: '05',
    title: 'Application Coordination',
    description: 'We submit and follow up directly with the lender.',
  },
  {
    step: '06',
    title: 'Loan Disbursement',
    description: 'Continued assistance until sanction and disbursement.',
  },
];

export const WHY_NEXA_ADVANTAGES = [
  {
    title: '38 Years of Banking Experience',
    description: 'Led by Mr. Gopal Arora, Former Chief Manager, UCO Bank.',
  },
  {
    title: 'Multiple Banking Relationships',
    description: 'Home loan empanelment across leading public sector banks.',
  },
  {
    title: 'Personalised Loan Assistance',
    description: 'Tailored guidance aligned to your income and timeline.',
  },
  {
    title: 'Clear Loan Comparisons',
    description: 'Compare EMIs, tenures, and bank terms side by side.',
  },
  {
    title: 'Free Initial Estimates',
    description: 'Preliminary consultations and estimates at zero upfront cost.',
  },
  {
    title: 'Documentation Assistance',
    description: 'Thorough file checking before submission reduces delays.',
  },
  {
    title: 'End-to-End Coordination',
    description: 'Dedicated follow-up from first call through disbursement.',
  },
];
