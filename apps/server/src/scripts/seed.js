'use strict';

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { MONGODB_URI } = require('../config/env');

const Question = require('../models/Question');
const Ticket = require('../models/Ticket');
const Rating = require('../models/Rating');
const SearchLog = require('../models/SearchLog');
const Admin = require('../models/Admin');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function fakeSessionIds(count) {
  return Array.from({ length: count }, (_, i) => `seed-session-${Date.now()}-${i}`);
}

// ---------------------------------------------------------------------------
// Seed Data
// ---------------------------------------------------------------------------

const ADMIN = {
  username: 'admin',
  passwordHash: null, // set below after bcrypt
};

const OFFICIAL_FAQS = [
  {
    title: 'How do I reset my test password if I forgot it?',
    description:
      'Go to the test platform login page and click "Forgot Password". Enter your registered email address and you will receive a reset link within 5 minutes. If you do not receive the email, check your spam folder or contact support@yourplatform.com.',
    category: 'Test & Coding Assessment',
    submitterEmail: 'support@yourplatform.com',
    status: 'official_faq',
    isOfficialFAQ: true,
    upvotes: 0,
    upvotedBy: [],
    starRating: 4.5,
    ratingCount: 12,
    tags: ['password', 'reset', 'test-login'],
  },
  {
    title: 'When will I receive my offer letter after completing the interview?',
    description:
      'Once you clear all interview rounds, the offer letter is generated within 3–5 working days. You will receive it on your registered email address. If more than 7 working days have passed, raise a ticket under "Stipend & Offer Letters" category.',
    category: 'Stipend & Offer Letters',
    submitterEmail: 'support@yourplatform.com',
    status: 'official_faq',
    isOfficialFAQ: true,
    upvotes: 0,
    upvotedBy: [],
    starRating: 4.8,
    ratingCount: 28,
    tags: ['offer-letter', 'timeline', 'interview'],
  },
  {
    title: 'What should I do if my test link has expired?',
    description:
      'If your test link has expired before you could attempt it, immediately raise a support ticket with your registered email, the test name, and the expired link. Our technical team will verify the reason and issue a new link within 2 working hours during business hours.',
    category: 'Test & Coding Assessment',
    submitterEmail: 'support@yourplatform.com',
    status: 'official_faq',
    isOfficialFAQ: true,
    upvotes: 0,
    upvotedBy: [],
    starRating: 4.3,
    ratingCount: 19,
    tags: ['test-link', 'expired', 'technical'],
  },
  {
    title: 'How do I upload my documents for the onboarding process?',
    description:
      'After your offer is confirmed, you will receive a welcome email with a document upload link. Upload a scanned copy of your government-issued ID, academic certificates, and a recent photograph. All documents must be in PDF or JPG format, under 5MB each.',
    category: 'Application Setup',
    submitterEmail: 'support@yourplatform.com',
    status: 'official_faq',
    isOfficialFAQ: true,
    upvotes: 0,
    upvotedBy: [],
    starRating: 4.6,
    ratingCount: 34,
    tags: ['documents', 'onboarding', 'upload'],
  },
  {
    title: 'How do I join the GitHub organization for my project?',
    description:
      'You will receive a GitHub organization invite link via email once your onboarding is complete. Click the link and accept the invitation. If you have not received it within 24 hours of completing onboarding, raise a ticket under "Internship Tasks" with your GitHub username.',
    category: 'Internship Tasks',
    submitterEmail: 'support@yourplatform.com',
    status: 'official_faq',
    isOfficialFAQ: true,
    upvotes: 0,
    upvotedBy: [],
    starRating: 4.4,
    ratingCount: 21,
    tags: ['github', 'onboarding', 'project'],
  },
  {
    title: 'When will I receive my first stipend payment?',
    description:
      'Stipend payments are processed at the end of each month for work completed in that month. The first payment is released in the month following your successful completion of the probation period (usually 30 days). Payment details will be sent to your registered bank account via NEFT.',
    category: 'Stipend & Offer Letters',
    submitterEmail: 'support@yourplatform.com',
    status: 'official_faq',
    isOfficialFAQ: true,
    upvotes: 0,
    upvotedBy: [],
    starRating: 4.7,
    ratingCount: 41,
    tags: ['stipend', 'payment', 'salary'],
  },
  {
    title: 'How can I track the status of my certificate?',
    description:
      'Visit the FAQ portal and go to "Track Ticket" section. Enter your ticket tracking ID to see live status updates. Certificates are issued within 5 working days after all project submissions are verified and approved by your mentor.',
    category: 'Internship Tasks',
    submitterEmail: 'support@yourplatform.com',
    status: 'official_faq',
    isOfficialFAQ: true,
    upvotes: 0,
    upvotedBy: [],
    starRating: 4.2,
    ratingCount: 15,
    tags: ['certificate', 'tracking', 'completion'],
  },
  {
    title: 'What is the deadline for submitting my project?',
    description:
      'Project submission deadlines are communicated by your assigned mentor via email and the project board on GitHub. Generally, the final submission window opens 7 days before the end date. Check your email and the GitHub repository README for specific dates.',
    category: 'Internship Tasks',
    submitterEmail: 'support@yourplatform.com',
    status: 'official_faq',
    isOfficialFAQ: true,
    upvotes: 0,
    upvotedBy: [],
    starRating: 4.1,
    ratingCount: 9,
    tags: ['deadline', 'project', 'submission'],
  },
];

// Community questions — 2 with upvotes=16, 2 with upvotes=8, 2 with upvotes=3
const COMMUNITY_QUESTIONS = [
  {
    title: 'Test portal shows "Session Already Active" even after logging out',
    description:
      'Every time I try to log into the test portal after logging out, it says my session is already active. I have cleared cookies and tried incognito mode but the issue persists. This is blocking my assessment.',
    category: 'Test & Coding Assessment',
    submitterEmail: 'support@yourplatform.com',
    status: 'public_community',
    isOfficialFAQ: false,
    upvotes: 16,
    upvotedBy: fakeSessionIds(16),
    starRating: 0,
    ratingCount: 0,
    tags: ['session', 'test-portal', 'bug'],
  },
  {
    title: 'Resume upload fails with "File type not supported" for PDF',
    description:
      'I am trying to upload my resume in PDF format but the portal rejects it saying file type not supported. The file is definitely a PDF — I checked. Is there a known issue with the document upload feature?',
    category: 'Application Setup',
    submitterEmail: 'support@yourplatform.com',
    status: 'public_community',
    isOfficialFAQ: false,
    upvotes: 16,
    upvotedBy: fakeSessionIds(16),
    starRating: 0,
    ratingCount: 0,
    tags: ['resume', 'upload', 'pdf', 'application'],
  },
  {
    title: 'GitHub Classroom invite link gives 404 error',
    description:
      'I received the GitHub Classroom invite link but clicking it shows a 404 page. I have verified the link is correct. Could this be because my GitHub account was created recently?',
    category: 'Internship Tasks',
    submitterEmail: 'support@yourplatform.com',
    status: 'public_community',
    isOfficialFAQ: false,
    upvotes: 8,
    upvotedBy: fakeSessionIds(8),
    starRating: 0,
    ratingCount: 0,
    tags: ['github', 'classroom', 'invite', '404'],
  },
  {
    title: 'Did not receive welcome email after completing document verification',
    description:
      'I submitted all my documents 3 days ago and received confirmation. But I have not received the welcome email that should contain my internship credentials and next steps. Is there a delay?',
    category: 'Stipend & Offer Letters',
    submitterEmail: 'support@yourplatform.com',
    status: 'public_community',
    isOfficialFAQ: false,
    upvotes: 8,
    upvotedBy: fakeSessionIds(8),
    starRating: 0,
    ratingCount: 0,
    tags: ['welcome-email', 'documents', 'onboarding'],
  },
  {
    title: 'Can I change my internship start date after accepting the offer?',
    description:
      'I accepted the offer letter but need to push my start date by a week due to academic commitments. Who should I contact and is this generally allowed?',
    category: 'Application Setup',
    submitterEmail: 'support@yourplatform.com',
    status: 'public_community',
    isOfficialFAQ: false,
    upvotes: 3,
    upvotedBy: fakeSessionIds(3),
    starRating: 0,
    ratingCount: 0,
    tags: ['start-date', 'offer', 'deferral'],
  },
  {
    title: 'Stipend amount on offer letter does not match what was communicated',
    description:
      'The offer letter says Rs 8,000/month but during the interview call I was told Rs 10,000/month. There is a significant difference. How do I clarify this discrepancy?',
    category: 'Stipend & Offer Letters',
    submitterEmail: 'support@yourplatform.com',
    status: 'public_community',
    isOfficialFAQ: false,
    upvotes: 3,
    upvotedBy: fakeSessionIds(3),
    starRating: 0,
    ratingCount: 0,
    tags: ['stipend', 'offer-letter', 'discrepancy', 'salary'],
  },
];

// ---------------------------------------------------------------------------
// Main seeder
// ---------------------------------------------------------------------------

async function seed() {
  console.log('\n🌱 SEED SCRIPT — FAQ Platform\n');
  console.log(`Connecting to MongoDB: ${MONGODB_URI}`);

  await mongoose.connect(MONGODB_URI);
  console.log('✅ Connected\n');

  // 1. Clear collections
  console.log('1. Clearing collections...');
  await Question.deleteMany({});
  await Ticket.deleteMany({});
  await Rating.deleteMany({});
  await SearchLog.deleteMany({});
  await Admin.deleteMany({});
  console.log('   Question, Ticket, Rating, SearchLog, Admin → cleared\n');

  // 2. Create admin
  console.log('2. Creating admin user...');
  const hash = await bcrypt.hash('admin123', 12);
  const admin = await Admin.create({ username: 'admin', passwordHash: hash });
  console.log(`   Created: username=admin, _id=${admin._id}\n`);

  // 3. Seed official FAQs
  console.log('3. Seeding 8 official FAQs...');
  const officialDocs = await Question.insertMany(OFFICIAL_FAQS);
  officialDocs.forEach((doc) => {
    console.log(`   [${doc.category}] ${doc.title.slice(0, 50)}...`);
  });
  console.log(`   → ${officialDocs.length} official FAQs inserted\n`);

  // 4. Seed community questions
  console.log('4. Seeding 6 community questions...');
  const communityDocs = await Question.insertMany(COMMUNITY_QUESTIONS);
  communityDocs.forEach((doc) => {
    console.log(`   upvotes=${doc.upvotes} | ${doc.title.slice(0, 50)}...`);
  });
  console.log(`   → ${communityDocs.length} community questions inserted\n`);

  // 5. Final counts
  console.log('5. Final document counts:');
  const counts = {
    Question: await Question.countDocuments(),
    Ticket: await Ticket.countDocuments(),
    Rating: await Rating.countDocuments(),
    SearchLog: await SearchLog.countDocuments(),
    Admin: await Admin.countDocuments(),
  };
  Object.entries(counts).forEach(([coll, count]) => {
    console.log(`   ${coll}: ${count}`);
  });

  console.log('\n✅ Seed complete\n');

  await mongoose.disconnect();
  console.log('Disconnected. Done.');
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err.message);
  process.exit(1);
});