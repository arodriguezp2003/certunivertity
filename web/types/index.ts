// University type
export interface University {
  id: number;
  name: string;
  email: string;
  wallet_address: string;
  credits: number;
  has_free_tokens_claimed: boolean;
  created_at: Date;
  updated_at: Date;
}

// Certificate type (database)
export interface Certificate {
  id: number;
  cert_id: string;
  university_id: number;
  student_name: string;
  student_email: string;
  certificate_name: string;
  person_name_hash: string;
  email_hash: string;
  issue_date: number; // timestamp in seconds
  expiration_date: number; // timestamp in seconds, 0 = never expires
  metadata_uri: string;
  tx_hash?: string;
  valid: boolean;
  created_at: Date;
  updated_at: Date;
}

// Certificate form data
export interface CertificateFormData {
  studentName: string;
  studentEmail: string;
  certificateName: string;
  expirationDate?: string; // ISO date string, optional
  metadataURI?: string;
}

// Certificate issuance request
export interface IssueCertificateRequest {
  studentName: string;
  studentEmail: string;
  certificateName: string;
  expirationDate?: string;
  metadataURI?: string;
  signature?: {
    v: number;
    r: string;
    s: string;
  };
}

// Certificate verification response
export interface CertificateVerificationResponse {
  exists: boolean;
  valid: boolean;
  certificate?: {
    certId: string;
    university: string;
    universityName?: string;
    certificateName: string;
    issueDate: number;
    expirationDate: number;
    metadataURI: string;
    studentName?: string; // Only from database, not on-chain
  };
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
