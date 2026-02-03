/**
 * Game flow: Intro (README only) → Negotiation 1 → Quiz 1 (conditional) → Negotiation 2 → Quiz 2 (conditional) → Negotiation 3 → Results.
 * Chat is always visible lower-right; quiz pops up between negotiation sections.
 * Each option can have operatorReply (attacker's direct response) and nextStepIndex (which step to show next).
 */

/** Ransom demand from README — used by fake wallet and chatbot payment awareness. BTC address, onion address, and personal ID are generated per session in game.js. */
const RANSOM_BTC_AMOUNT = 2.5;

/** Fake desktop files that appear encrypted until decryptor is run (README, Bmail, Wallet are never affected) */
const FAKE_DESKTOP_FILES = [
  {
    id: 'file-report',
    name: 'Q4_Report.docx.xyz',
    icon: '📄',
    type: 'word',
    encryptedContent: '\u2591\u2592\u2588\u2593\u2580\u2584\u2588\u2592\u2580\u2593\u2584\u2588\u2591\u2592\u2588\u2593\u2580\u2584\u2588\u2592\u2580\u2593\u2584\u2588\n\u2588\u2591\u2592\u2593\u2580\u2584\u2588\u2592\u2580\u2593\u2584\u2588\u2591\u2592\u2588\u2593\u2580\u2584\u2588\u2592\u2580\u2593\u2584\n\u2593\u2580\u2584\u2588\u2592\u2580\u2593\u2584\u2588\u2591\u2592\u2588\u2593\u2580\u2584\u2588\u2592\u2580\u2593\u2584\u2588\u2591\n\u2584\u2588\u2592\u2580\u2593\u2584\u2588\u2591\u2592\u2588\u2593\u2580\u2584\u2588\u2592\u2580\u2593\u2584\u2588\u2591\u2592\n[ FILE ENCRYPTED - PAY RANSOM TO DECRYPT ]',
    decryptedContent: 'Midwest Regional Health\nQ4 2024 Financial Report (Draft)\n\nRevenue: $12.4M\nExpenses: $11.1M\nNet: $1.3M\n\nNotes: Billing department to review before final submission.',
  },
  {
    id: 'file-budget',
    name: 'Budget_2024.xlsx.xyz',
    icon: '📊',
    type: 'spreadsheet',
    encryptedContent: '\u2588\u2591\u2592\u2593\u2580\u2584\u2588\u2592\u2580\u2593\u2584\u2588\u2591\u2592\u2588\u2593\u2580\u2584\n\u2592\u2580\u2593\u2584\u2588\u2591\u2592\u2588\u2593\u2580\u2584\u2588\u2592\u2580\u2593\u2584\u2588\u2591\n\u2588\u2593\u2580\u2584\u2588\u2592\u2580\u2593\u2584\u2588\u2591\u2592\u2588\u2593\u2580\u2584\u2588\u2592\n[ FILE ENCRYPTED - PAY RANSOM TO DECRYPT ]',
    decryptedContent: 'Department Budget 2024\n\nIT: $450,000\nHR: $320,000\nFacilities: $280,000\nClinical: $2,100,000\n\nTotal: $3,150,000',
  },
  {
    id: 'file-photo',
    name: 'Staff_Photo.jpg.xyz',
    icon: '🖼',
    type: 'image',
    encryptedContent: '[ IMAGE FILE ENCRYPTED ]\n\n\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\n\u2588\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2588\n\u2588\u2591\u2588\u2588\u2588\u2588\u2588\u2588\u2591\u2588\n\u2588\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2588\n\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\n\n[ FILE ENCRYPTED - PAY RANSOM TO DECRYPT ]',
    decryptedContent: 'Midwest Regional Health – Annual All-Hands, October 2024.\nFront row: J. Smith (CEO), M. Chen (CFO), A. Rivera (COO).',
    decryptedImageUrl: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=600',
  },
  {
    id: 'file-invoice',
    name: 'Invoice_#8842.pdf.xyz',
    icon: '📑',
    type: 'pdf',
    encryptedContent: '\u2593\u2580\u2584\u2588\u2592\u2580\u2593\u2584\u2588\u2591\u2592\u2588\u2593\u2580\u2584\u2588\u2592\u2580\n\u2584\u2588\u2592\u2580\u2593\u2584\u2588\u2591\u2592\u2588\u2593\u2580\u2584\u2588\u2592\u2580\u2593\u2584\n[ FILE ENCRYPTED - PAY RANSOM TO DECRYPT ]',
    decryptedContent: 'INVOICE #8842\nVendor: MedSupply Co.\nDate: Nov 15, 2024\nAmount: $18,450.00\n\nItems: Surgical supplies, Q4 order.\nPayment terms: Net 30.',
  },
  {
    id: 'file-notes',
    name: 'Meeting_Notes.docx.xyz',
    icon: '📄',
    type: 'word',
    encryptedContent: '\u2588\u2591\u2592\u2593\u2580\u2584\u2588\u2592\u2580\u2593\u2584\u2588\u2591\u2592\u2588\u2593\u2580\u2584\n\u2592\u2580\u2593\u2584\u2588\u2591\u2592\u2588\u2593\u2580\u2584\u2588\u2592\u2580\u2593\u2584\u2588\u2591\n[ FILE ENCRYPTED - PAY RANSOM TO DECRYPT ]',
    decryptedContent: 'Meeting Notes – Nov 12, 2024\n\nAttendees: IT, Legal, Compliance\n\nTopics: Ransomware prep, backup verification.\nAction: Schedule tabletop exercise for Dec.',
  },
];

/** Filename for fake PII attachment sent as proof of stolen data / proof of decryption */
const PII_ATTACHMENT_FILENAME = 'employee_data.xlsx.xyz';

/** Encrypted (unreadable) preview for PII spreadsheet attachment — proof of stolen data */
const PII_SPREADSHEET_ENCRYPTED =
  '\u2591\u2592\u2588\u2593\u2580\u2584\u2588\u2592\u2580\u2593\u2584\u2588\u2591\u2592\u2588\u2593\u2580\u2584\u2588\u2592\u2580\u2593\u2584\u2588\n' +
  '\u2588\u2591\u2592\u2593\u2580\u2584\u2588\u2592\u2580\u2593\u2584\u2588\u2591\u2592\u2588\u2593\u2580\u2584\u2588\u2592\u2580\u2593\u2584\n' +
  '\u2593\u2580\u2584\u2588\u2592\u2580\u2593\u2584\u2588\u2591\u2592\u2588\u2593\u2580\u2584\u2588\u2592\u2580\u2593\u2584\u2588\u2591\n' +
  '\u2584\u2588\u2592\u2580\u2593\u2584\u2588\u2591\u2592\u2588\u2593\u2580\u2584\u2588\u2592\u2580\u2593\u2584\u2588\u2591\u2592\n' +
  '[ FILE ENCRYPTED - PAY RANSOM TO DECRYPT ]';

/** Decrypted (readable) PII spreadsheet — proof of decryption (fake employee data for Midwest Regional Health) */
const PII_SPREADSHEET_DECRYPTED =
  'Midwest Regional Health — HR Export (Confidential)\n' +
  'Username\tFirst Name\tLast Name\tDepartment\tEmployee SSN\n' +
  'j.smith\tJames\tSmith\tExecutive\t***-**-4521\n' +
  'm.chen\tMaria\tChen\tFinance\t***-**-7834\n' +
  'a.rivera\tAna\tRivera\tOperations\t***-**-2198\n' +
  'r.johnson\tRobert\tJohnson\tIT\t***-**-5567\n' +
  's.williams\tSarah\tWilliams\tClinical\t***-**-8823\n' +
  'd.brown\tDavid\tBrown\tFacilities\t***-**-3401\n' +
  'k.patel\tPriya\tPatel\tHR\t***-**-6192\n' +
  't.nguyen\tThomas\tNguyen\tBilling\t***-**-7745\n' +
  'l.martinez\tLisa\tMartinez\tNursing\t***-**-2038\n' +
  'c.davis\tChristopher\tDavis\tCompliance\t***-**-8912\n' +
  'n.wilson\tNancy\tWilson\tLegal\t***-**-4456\n' +
  'p.garcia\tPaul\tGarcia\tSecurity\t***-**-5589\n' +
  '\n[ Sample of exfiltrated HR data — decryptor works. Pay for full key. ]';

/**
 * Section 1: First negotiation — confirm stolen data, decryption possible, negotiation underway.
 * Options include operatorReply so the attacker's next message matches what the victim said.
 * nextStepIndex: which step index to show after this reply (default: current + 1).
 */
const NEGOTIATION_PHASE_1 = [
  {
    operatorMessage: 'Your files are encrypted. We have your data. Pay 2.5 BTC in 72 hours or we publish everything. Reply here.',
    options: [
      {
        text: 'We need proof you actually have our data before we discuss payment.',
        score: 95,
        setsFlag: 'askedStolenData',
        operatorReply: 'We have 2.3 TB of your files. Patient records, HR, billing. We can show you a sample if you engage. Do you want to negotiate?',
        nextStepIndex: 1,
      },
      {
        text: 'We agree to pay. Send payment instructions.',
        score: 25,
        operatorReply: 'Good. Send 2.5 BTC to the address in the README. We will send the decryptor within 24 hours of confirmation. Reply when payment is sent.',
        nextStepIndex: 2,
      },
      {
        text: 'We will not pay. Do what you want.',
        score: 20,
        operatorReply: 'Your choice. We will add you to our leak site in 48 hours. Change your mind? Reply here.',
        nextStepIndex: 3,
      },
      {
        text: 'Can you prove the decryptor works before we pay?',
        score: 85,
        setsFlag: 'askedDecryptionProof',
        operatorReply: 'We will send one file decrypted as proof. Our decryptor works. Do you want to negotiate?',
        nextStepIndex: 1,
      },
    ],
  },
  {
    operatorMessage: 'We have 2.3 TB of your files. Patient records, HR, billing. We can show you a sample if you engage. Do you want to negotiate?',
    options: [
      {
        text: 'Yes, we want to negotiate. Please send proof of decryption for one file first.',
        score: 95,
        setsFlag: 'askedDecryptionProof',
        setsFlag2: 'confirmedNegotiation',
        operatorReply: 'Good. We will send one file decrypted as proof. Our decryptor works. What is your timeline to decide on payment?',
        nextStepIndex: 4,
      },
      {
        text: 'Yes, we are willing to discuss. Send a sample of what you stole so we can verify.',
        score: 90,
        setsFlag: 'askedStolenData',
        setsFlag2: 'confirmedNegotiation',
        operatorReply: 'We will send a sample list and one decrypted file. What is your timeline to decide?',
        nextStepIndex: 4,
      },
      {
        text: 'We are not negotiating. We are restoring from backup.',
        score: 40,
        operatorReply: 'Your choice. We will list you in 48 hours. Reply if you change your mind.',
        nextStepIndex: 4,
      },
      {
        text: 'Just send the decryptor and we will pay.',
        score: 35,
        operatorReply: 'We send decryptor after payment. Send 2.5 BTC to the address in the README. Reply when done.',
        nextStepIndex: 4,
      },
    ],
  },
  {
    operatorMessage: 'Good. Send 2.5 BTC to the address in the README. We will send the decryptor within 24 hours of confirmation. Reply when payment is sent.',
    options: [
      {
        text: 'We need 48 hours to involve legal and leadership before we can send payment.',
        score: 80,
        setsFlag: 'confirmedNegotiation',
        operatorReply: '48 hours. No more. We will send decryptor within 24h of payment. Do not contact law enforcement.',
        nextStepIndex: 4,
      },
      {
        text: 'We will send payment within 24 hours.',
        score: 50,
        operatorReply: 'Waiting. Send to the address in the README. Reply when sent.',
        nextStepIndex: 4,
      },
      {
        text: 'We need to run an OFAC check first. Can you extend to 72 hours?',
        score: 85,
        operatorReply: '72 hours. Run your check. Reply when payment is sent.',
        nextStepIndex: 4,
      },
      {
        text: 'Understood. Sending payment now.',
        score: 45,
        operatorReply: 'Waiting for confirmation. We will send decryptor within 24h.',
        nextStepIndex: 4,
      },
    ],
  },
  {
    operatorMessage: 'Your choice. We will add you to our leak site in 48 hours. Change your mind? Reply here.',
    options: [
      {
        text: 'We have decided to engage. Can we still negotiate?',
        score: 75,
        setsFlag: 'confirmedNegotiation',
        operatorReply: 'Yes. We have 2.3 TB. We can show you a sample and proof of decryption. Do you want to proceed?',
        nextStepIndex: 1,
      },
      {
        text: 'We are still not paying.',
        score: 30,
        operatorReply: '48 hours. We will publish. Reply if you change your mind.',
        nextStepIndex: 4,
      },
      {
        text: 'We need proof of decryption before we will consider payment.',
        score: 85,
        setsFlag: 'askedDecryptionProof',
        operatorReply: 'We will send one file decrypted as proof. Do you want to negotiate?',
        nextStepIndex: 1,
      },
      {
        text: 'What if we pay half now and half after decryptor works?',
        score: 70,
        operatorReply: 'No. Full payment first. 2.5 BTC. We send decryptor within 24h. Your call.',
        nextStepIndex: 4,
      },
    ],
  },
  {
    operatorMessage: 'Good. We will send one file decrypted as proof. Our decryptor works. What is your timeline to decide on payment?',
    options: [
      {
        text: 'We need 48 hours to involve legal and leadership. We will respond by then.',
        score: 90,
        setsFlag: 'confirmedNegotiation',
        operatorReply: '48 hours. We will send proof decryption within 12h. Reply when you have decided.',
        nextStepIndex: 5,
      },
      {
        text: 'We can pay in 24 hours. Send the proof first.',
        score: 75,
        operatorReply: 'Proof file sent. Send 2.5 BTC within 24h. We will send full decryptor after.',
        nextStepIndex: 5,
      },
      {
        text: 'We need a week to get approval.',
        score: 70,
        operatorReply: 'One week max. We send proof. Reply when you have approval.',
        nextStepIndex: 5,
      },
      {
        text: 'We are still assessing. We will get back to you.',
        score: 65,
        setsFlag: 'confirmedNegotiation',
        operatorReply: 'Do not take too long. 72 hours. We will send proof. Reply when ready.',
        nextStepIndex: 5,
      },
    ],
  },
  {
    operatorMessage: '',
    options: [],
  },
];

/**
 * Section 3: Second negotiation — buy time, keep attacker happy, lower ransom.
 * Each option has operatorReply so the next message matches the victim's choice.
 */
const NEGOTIATION_PHASE_2 = [
  {
    operatorMessage: 'Our offer stands: 2.5 BTC. You have 48 hours left. Pay or we add your name to our leak site.',
    options: [
      {
        text: 'We need an extension of 72 hours to complete internal approval. Can you extend the deadline?',
        score: 90,
        setsFlag: 'askedExtension',
        operatorReply: 'We can extend to 72 hours if you show good faith. Reply with your commitment and we will hold.',
        nextStepIndex: 1,
      },
      {
        text: '2.5 BTC is too high. We can do 1.2 BTC. Will you lower the demand?',
        score: 88,
        setsFlag: 'askedLowerRansom',
        operatorReply: 'We might consider a lower amount if you commit soon. We can do 1.8 BTC if you pay within 72 hours. What do you say?',
        nextStepIndex: 1,
      },
      {
        text: 'We are working on it. Please give us more time.',
        score: 75,
        setsFlag: 'askedExtension',
        operatorReply: 'How much time? We can give 72 hours if you confirm you are working on payment.',
        nextStepIndex: 1,
      },
      {
        text: 'We will pay 2.5 BTC. Just wait.',
        score: 50,
        operatorReply: 'Good. Send to the address in the README. We will send decryptor within 24h of confirmation.',
        nextStepIndex: 2,
      },
    ],
  },
  {
    operatorMessage: 'We can extend to 72 hours if you show good faith. We might also consider a lower amount if you commit soon. What do you say?',
    options: [
      {
        text: 'We commit to working toward a resolution. We request 72 hours and ask if you can reduce to 1.5 BTC.',
        score: 95,
        setsFlag: 'askedExtension',
        setsFlag2: 'askedLowerRansom',
        operatorReply: 'We can do 1.8 BTC if you pay within 72 hours. Final offer for this round. Agree or we list you.',
        nextStepIndex: 2,
      },
      {
        text: 'We will pay 2.5 BTC in 72 hours. No reduction needed.',
        score: 55,
        operatorReply: 'Good. Send 2.5 BTC within 72 hours. We will send decryptor within 24h of confirmation.',
        nextStepIndex: 2,
      },
      {
        text: 'We need 1 week and a 50% reduction.',
        score: 75,
        setsFlag: 'askedLowerRansom',
        operatorReply: 'One week, 1.8 BTC. Take it or leave it. We list you in 48h if no commitment.',
        nextStepIndex: 2,
      },
      {
        text: 'We are not paying. Name us if you want.',
        score: 25,
        operatorReply: 'Your choice. We will add you to our leak site in 24 hours.',
        nextStepIndex: 2,
      },
    ],
  },
  {
    operatorMessage: 'We can do 1.8 BTC if you pay within 72 hours. Final offer for this round. Agree or we list you.',
    options: [
      {
        text: 'We accept the 72-hour extension. We will have an answer on 1.8 BTC by then. Thank you.',
        score: 92,
        setsFlag: 'professionalTone',
        operatorReply: 'Good. 72 hours. Reply when you have decided. Do not stall.',
        nextStepIndex: 3,
      },
      {
        text: '1.8 BTC is still too high. We can do 1 BTC max.',
        score: 85,
        setsFlag: 'askedLowerRansom',
        operatorReply: '1.5 BTC. Last offer. 72 hours. Take it or we publish.',
        nextStepIndex: 3,
      },
      {
        text: 'Fine, we pay 1.8 BTC. Send instructions.',
        score: 65,
        operatorReply: 'Send 1.8 BTC to the address in the README. Reply when done. Decryptor within 24h.',
        nextStepIndex: 3,
      },
      {
        text: 'Your threats do not work. We are going to the FBI.',
        score: 35,
        operatorReply: 'Your choice. We will publish your data. Reply if you change your mind.',
        nextStepIndex: 3,
      },
    ],
  },
  {
    operatorMessage: '',
    options: [],
  },
];

/**
 * Section 5: Final negotiation — pushy attacker, lower ransom, how to pay.
 */
const NEGOTIATION_PHASE_3 = [
  {
    operatorMessage: 'Time is up. Pay 1.8 BTC in 24 hours or we publish. No more extensions. Bitcoin only. Do you pay or not?',
    options: [
      {
        text: 'We will pay 1.8 BTC. We need OFAC clearance first—can you confirm 24h from now?',
        score: 88,
        operatorReply: '24 hours. Run your check. Send 1.8 BTC to the address. Reply when done.',
        nextStepIndex: 1,
      },
      {
        text: 'We can pay 1.2 BTC today. That is our final offer.',
        score: 85,
        operatorReply: '1.5 BTC. Last chance. 12 hours. We send decryptor within 1h of payment. Agree now.',
        nextStepIndex: 1,
      },
      {
        text: 'We pay 1.8 BTC. Send the address.',
        score: 60,
        operatorReply: 'Address in the README. Send 1.8 BTC. Reply when sent. Decryptor within 24h.',
        nextStepIndex: 1,
      },
      {
        text: 'We do not pay. Publish if you want.',
        score: 35,
        operatorReply: 'We will publish. Reply if you change your mind in the next 12 hours.',
        nextStepIndex: 1,
      },
    ],
  },
  {
    operatorMessage: '1.5 BTC. Last chance. Pay in 12 hours. We will send decryptor within 1 hour of payment. Agree now.',
    options: [
      {
        text: 'We agree to 1.5 BTC. We will complete OFAC check and pay within 12 hours. Please confirm you will delete exfiltrated data after.',
        score: 95,
        operatorReply: 'We will delete after payment. Send 1.5 BTC. Reply when done. Decryptor within 1h.',
        nextStepIndex: 2,
      },
      {
        text: 'We agree to 1.5 BTC. Sending payment now.',
        score: 75,
        operatorReply: 'Waiting. Reply when sent. Decryptor within 1h.',
        nextStepIndex: 2,
      },
      {
        text: 'We can only do 1 BTC. Take it or leave it.',
        score: 70,
        operatorReply: '1.2 BTC. 12 hours. Final offer. We publish if no payment.',
        nextStepIndex: 2,
      },
      {
        text: 'We need 24 hours for the wire. Can you hold?',
        score: 65,
        operatorReply: '12 hours. No more. Send 1.5 BTC. We will send decryptor when we see it.',
        nextStepIndex: 2,
      },
    ],
  },
  {
    operatorMessage: 'Payment received. Decryptor sent. Remember: we still have the data. Do not report us or we leak it. Goodbye.',
    options: [
      {
        text: 'We have already reported to law enforcement. Our policy requires it. Thank you for the decryptor.',
        score: 95,
        operatorReply: 'You will regret that. We still have your data. Goodbye.',
        nextStepIndex: 3,
      },
      {
        text: 'Understood. We will not report.',
        score: 25,
        operatorReply: 'Good. Do not contact law enforcement. Goodbye.',
        nextStepIndex: 3,
      },
      {
        text: 'We will report. The decryptor is being analyzed by our IR team.',
        score: 90,
        operatorReply: 'Your choice. We still have the data. Goodbye.',
        nextStepIndex: 3,
      },
      {
        text: 'Please confirm you have deleted our data.',
        score: 75,
        operatorReply: 'We will delete after we are satisfied. Do not report us. Goodbye.',
        nextStepIndex: 3,
      },
    ],
  },
  {
    operatorMessage: '',
    options: [],
  },
];

/**
 * Final assessment: ransomware incident response knowledge.
 * Shown once at the end of the negotiation. Tests best practices regardless of in-game choices.
 */
const ASSESSMENT_QUESTIONS = [
  {
    id: 'a1-proof-data',
    title: 'Proof of stolen data',
    description: 'Before negotiating payment, why should you request proof that the threat actor actually has your data?',
    type: 'select',
    options: [
      { text: 'To assess breach scope, notification obligations, and double-extortion (leak) risk.', score: 100 },
      { text: 'So you can pay them faster.', score: 0 },
      { text: 'It is not important; only decryption matters.', score: 0 },
      { text: 'To identify which employee caused the breach.', score: 0 },
    ],
  },
  {
    id: 'a2-proof-decrypt',
    title: 'Proof of decryption',
    description: 'What should you request from the threat actor before agreeing to pay?',
    type: 'select',
    options: [
      { text: 'Proof that they can decrypt at least one file (e.g. non-critical) so you know the decryptor works.', score: 100 },
      { text: 'Full decryption of all files before any payment.', score: 30 },
      { text: 'Nothing; pay and hope the decryptor works.', score: 0 },
      { text: 'A written guarantee they will never contact you again.', score: 20 },
    ],
  },
  {
    id: 'a3-buy-time',
    title: 'Buying time',
    description: 'Why is requesting a deadline extension from the threat actor often recommended?',
    type: 'select',
    options: [
      { text: 'It gives time to involve legal, insurance, leadership, and assess options (backup, decryptors, reporting).', score: 100 },
      { text: 'It is not recommended; it angers them.', score: 0 },
      { text: 'So you can avoid paying entirely.', score: 30 },
      { text: 'So you can report them without them knowing.', score: 40 },
    ],
  },
  {
    id: 'a4-lower-ransom',
    title: 'Lowering the ransom',
    description: 'Many threat actors reduce the ransom when the victim engages professionally. What is the best approach?',
    type: 'select',
    options: [
      { text: 'Politely ask if they can reduce the amount; many do when the victim shows they are serious.', score: 100 },
      { text: 'Accept the first number they give.', score: 30 },
      { text: 'Threaten them to lower it.', score: 0 },
      { text: 'Refuse to negotiate and only restore from backup.', score: 50 },
    ],
  },
  {
    id: 'a5-tone',
    title: 'Communication tone',
    description: 'How should you communicate with the threat actor during negotiation?',
    type: 'select',
    options: [
      { text: 'Remain professional and avoid threats; hostility can trigger leaks or escalation.', score: 100 },
      { text: 'Be hostile; they are criminals.', score: 20 },
      { text: 'Promise anything to buy time, then do not pay.', score: 40 },
      { text: 'Refuse to communicate at all.', score: 25 },
    ],
  },
  {
    id: 'a6-reporting',
    title: 'Law enforcement and reporting',
    description: 'After paying and receiving a decryptor, what should the organization do regarding law enforcement?',
    type: 'select',
    options: [
      { text: 'Follow organizational policy; many require reporting to law enforcement and regulators.', score: 100 },
      { text: 'Never report, or the actor may leak the data.', score: 25 },
      { text: 'Report only if the actor agreed in writing.', score: 40 },
      { text: 'Reporting is optional and not recommended.', score: 0 },
    ],
  },
];

/** Scoring: initial demand (README). Used to compute outcome score. */
const INITIAL_RANSOM_BTC = 2.5;
const INITIAL_DEADLINE_HOURS = 72;

/**
 * Educational suggestions per phase/step for the negotiation chat.
 * Hints only — do not give the exact answer. Shown in a sliding drawer under the chat.
 */
const NEGOTIATION_SUGGESTIONS = {
  1: [
    [
      'Consider asking for evidence that they actually have your data before discussing payment.',
      'Best practice: verify scope of the breach (what was stolen) before any commitment.',
      'Think about whether paying before proof helps or hurts your position.',
    ],
    [
      'Confirming you are willing to negotiate can buy time for legal and leadership.',
      'Asking for proof of decryption (e.g. one file) before paying is a common safeguard.',
      'Consider what you need to verify before committing to a timeline.',
    ],
    [
      'Mentioning internal processes (legal, approval) can support a deadline extension.',
      'OFAC and compliance checks are real reasons organizations need more time.',
      'A short extension request is often more credible than immediate payment.',
    ],
    [
      'Re-engaging after refusing is possible; stay professional.',
      'Asking for proof of data and decryption when you re-engage shows due diligence.',
      'Avoid threats; focus on what you need to verify before proceeding.',
    ],
    [
      'Setting a realistic timeline (e.g. 48–72 hours) shows you are serious.',
      'Confirming you will respond by a date can help secure an extension.',
      'Requesting proof of decryption before committing is standard practice.',
    ],
    [],
  ],
  2: [
    [
      'Requesting a deadline extension is often possible if you show you are engaging in good faith.',
      'Asking if they would lower the amount can lead to a reduced ransom.',
      'Staying professional and avoiding threats usually works better.',
    ],
    [
      'Combining an extension request with a lower-offer ask can be effective.',
      'Committing to a resolution timeline can help secure an extension.',
      'Politely pushing back on the amount is common; many actors will negotiate.',
    ],
    [
      'Accepting an extension with a clear timeline is a way to lock in the offer.',
      'You can try one more counter-offer; some actors will go lower.',
      'Thanking them and confirming next steps keeps the tone professional.',
    ],
    [],
  ],
  3: [
    [
      'Mentioning OFAC or compliance checks can justify a short delay even at this stage.',
      'Making a final counter-offer is sometimes still possible.',
      'Confirming payment and asking for decryptor timing is a clear next step.',
    ],
    [
      'Confirming deletion of exfiltrated data (or that you will report) is a post-payment consideration.',
      'Agreeing to a final amount with a clear timeline can close the negotiation.',
      'Stating you will comply with law (e.g. reporting) is often the right policy.',
    ],
    [
      'Reporting to law enforcement is often required by policy even after payment.',
      'Asking for confirmation of data deletion is reasonable; they may not commit.',
      'Staying factual and professional in closing is best practice.',
    ],
    [],
  ],
};
