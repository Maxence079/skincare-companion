/**
 * Legal Compliance for Photo Storage
 * GDPR, HIPAA, CCPA, and medical data regulations
 */

export interface PhotoConsentData {
  // Core consent
  storageConsent: boolean;
  mlTrainingConsent: boolean;
  researchConsent: boolean;

  // Legal metadata
  consentVersion: string;
  consentDate: Date;
  consentIpAddress?: string;
  userAgent?: string;

  // Privacy controls
  dataRetentionPeriod: number; // days
  allowThirdPartySharing: boolean;
  allowAnonymizedResearch: boolean;

  // User rights
  rightToDelete: boolean;
  rightToExport: boolean;
  rightToWithdrawConsent: boolean;
}

export interface PhotoMetadata {
  // Photo identification
  photoId: string;
  userId: string;
  sessionId: string;

  // Technical data
  captureDate: Date;
  photoType: 'baseline' | 'progress' | 'after';
  fileFormat: string;
  fileSize: number;
  dimensions: { width: number; height: number };

  // Validation data
  qualityScore: number;
  faceDetectionConfidence: number;
  validationPassed: boolean;
  validationIssues: string[];

  // Legal compliance
  consent: PhotoConsentData;

  // Anonymization
  isAnonymized: boolean;
  anonymizationDate?: Date;
  originalUserId?: string; // Store separately in secure system

  // Data lifecycle
  expiresAt: Date;
  deletionScheduledAt?: Date;
  actualDeletionAt?: Date;

  // Audit trail
  createdAt: Date;
  updatedAt: Date;
  accessLog: Array<{
    timestamp: Date;
    action: string;
    userId?: string;
    ipAddress?: string;
  }>;
}

/**
 * Get current consent version and legal text
 */
export function getCurrentConsentVersion() {
  return {
    version: '1.0.0',
    effectiveDate: new Date('2025-01-01'),

    texts: {
      storage: {
        title: 'Photo Storage Consent',
        content: `I consent to SkinCare Companion storing my facial photos securely for the purpose of tracking my skin health progress over time.

I understand that:
• Photos will be encrypted and stored on secure servers
• Only I and authorized healthcare providers can access my photos
• I can delete my photos at any time
• Photos will be automatically deleted after the retention period I select`,
      },

      mlTraining: {
        title: 'AI Training Consent (Optional)',
        content: `I consent to my photos being used to train and improve AI skin analysis models.

I understand that:
• Photos will be fully anonymized (all identifying information removed)
• Anonymized photos cannot be traced back to me
• This helps improve skincare recommendations for all users
• I can opt out at any time without affecting my service`,
      },

      research: {
        title: 'Research Consent (Optional)',
        content: `I consent to my anonymized data being used for dermatological research.

I understand that:
• Only anonymized, aggregated data will be used
• Research may be published in scientific journals
• No individual data will be shared
• This helps advance skincare science
• I can opt out at any time`,
      },
    },

    legalBasis: {
      gdpr: 'Explicit consent (Art. 6(1)(a) and Art. 9(2)(a) for health data)',
      hipaa: 'Patient authorization for use/disclosure of PHI',
      ccpa: 'Opt-in consent for sale/sharing of personal information',
    },
  };
}

/**
 * Calculate expiration date based on retention period
 */
export function calculateExpirationDate(retentionDays: number): Date {
  const date = new Date();
  date.setDate(date.getDate() + retentionDays);
  return date;
}

/**
 * Get default retention periods (user can choose)
 */
export function getRetentionPeriodOptions() {
  return [
    { days: 90, label: '3 months', description: 'Short-term tracking' },
    { days: 180, label: '6 months', description: 'Standard tracking' },
    { days: 365, label: '1 year', description: 'Long-term tracking' },
    { days: 730, label: '2 years', description: 'Extended tracking' },
    { days: 1825, label: '5 years', description: 'Maximum period' },
  ];
}

/**
 * Validate consent data completeness
 */
export function validateConsent(consent: Partial<PhotoConsentData>): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (consent.storageConsent === undefined) {
    errors.push('Storage consent is required');
  }

  if (!consent.storageConsent) {
    errors.push('Storage consent must be granted to proceed');
  }

  if (!consent.consentVersion) {
    errors.push('Consent version is required');
  }

  if (!consent.consentDate) {
    errors.push('Consent date is required');
  }

  if (!consent.dataRetentionPeriod || consent.dataRetentionPeriod < 1) {
    errors.push('Data retention period is required');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Generate audit log entry
 */
export function createAuditLogEntry(
  action: string,
  userId?: string,
  ipAddress?: string
) {
  return {
    timestamp: new Date(),
    action,
    userId,
    ipAddress,
  };
}

/**
 * Check if photo should be deleted based on retention policy
 */
export function shouldDeletePhoto(metadata: PhotoMetadata): boolean {
  const now = new Date();

  // Check expiration date
  if (metadata.expiresAt && metadata.expiresAt < now) {
    return true;
  }

  // Check if deletion is scheduled
  if (metadata.deletionScheduledAt && metadata.deletionScheduledAt < now) {
    return true;
  }

  // Check if user withdrew consent
  if (!metadata.consent.storageConsent) {
    return true;
  }

  return false;
}

/**
 * Anonymize photo metadata for ML training
 */
export function anonymizeMetadata(metadata: PhotoMetadata): PhotoMetadata {
  return {
    ...metadata,
    userId: 'ANONYMIZED',
    sessionId: 'ANONYMIZED',
    originalUserId: metadata.userId, // Store separately in secure system
    isAnonymized: true,
    anonymizationDate: new Date(),
    consent: {
      ...metadata.consent,
      consentIpAddress: undefined,
      userAgent: undefined,
    },
    accessLog: [], // Clear access log for anonymized data
  };
}

/**
 * Get user-friendly privacy policy summary
 */
export function getPrivacyPolicySummary() {
  return {
    title: 'Your Photo Privacy Rights',
    points: [
      {
        icon: '🔒',
        title: 'Secure Storage',
        description: 'Photos are encrypted end-to-end and stored on HIPAA-compliant servers',
      },
      {
        icon: '👤',
        title: 'You Control Your Data',
        description: 'Delete, export, or modify your photos anytime from your settings',
      },
      {
        icon: '⏰',
        title: 'Automatic Deletion',
        description: 'Photos automatically delete after your chosen retention period',
      },
      {
        icon: '🔬',
        title: 'Optional AI Training',
        description: 'Choose to help improve our AI by allowing anonymized photo use',
      },
      {
        icon: '🌍',
        title: 'GDPR Compliant',
        description: 'Full compliance with GDPR, HIPAA, CCPA, and other privacy laws',
      },
      {
        icon: '🚫',
        title: 'Never Sold',
        description: 'We never sell your photos or data to third parties',
      },
    ],
  };
}

/**
 * Required data subject rights implementation
 */
export const DataSubjectRights = {
  // GDPR Article 15 - Right of access
  rightToAccess: {
    description: 'User can view all their stored photos and metadata',
    implementation: 'GET /api/user/photos endpoint with full metadata',
  },

  // GDPR Article 16 - Right to rectification
  rightToRectification: {
    description: 'User can update photo metadata or consent preferences',
    implementation: 'PATCH /api/user/photos/:id endpoint',
  },

  // GDPR Article 17 - Right to erasure ("right to be forgotten")
  rightToErasure: {
    description: 'User can permanently delete all photos',
    implementation: 'DELETE /api/user/photos endpoint with hard delete',
  },

  // GDPR Article 18 - Right to restriction of processing
  rightToRestriction: {
    description: 'User can freeze photo processing/analysis',
    implementation: 'PATCH /api/user/photos/restrict endpoint',
  },

  // GDPR Article 20 - Right to data portability
  rightToPortability: {
    description: 'User can export all photos in standard format',
    implementation: 'GET /api/user/photos/export endpoint (ZIP with JSON metadata)',
  },

  // GDPR Article 21 - Right to object
  rightToObject: {
    description: 'User can object to ML training use',
    implementation: 'PATCH /api/user/consent/withdraw endpoint',
  },
};
