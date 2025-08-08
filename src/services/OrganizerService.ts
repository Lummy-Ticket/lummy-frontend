import { DEVELOPMENT_CONFIG } from "../constants";

// Types for organizer management
export interface OrganizerRequest {
  id: string;
  walletAddress: string;
  organizerName: string;
  email: string;
  notes: string;
  status: "pending" | "under_review" | "approved" | "rejected";
  adminNotes?: string;
  adminWallet?: string;
  createdAt: Date;
  reviewedAt?: Date;
  approvedAt?: Date;
  blockchainApprovedAt?: Date;
}

export interface DocumentInfo {
  id: string;
  requestId: string;
  documentType: "npwp" | "ktp" | "business_license" | "tax_certificate" | "other";
  fileName: string;
  fileSize: number;
  uploadedAt: Date;
  verifiedAt?: Date;
  verifiedBy?: string;
}

export interface ConsentInfo {
  requestId: string;
  documentProcessingConsent: boolean;
  identityVerificationConsent: boolean;
  dataRetentionAcknowledged: boolean;
  communicationConsent: boolean;
  consentedAt: Date;
  consentIpAddress?: string;
}

export interface SubmitApplicationRequest {
  walletAddress: string;
  organizerName: string;
  email: string;
  notes: string;
  consent: {
    documentProcessingConsent: boolean;
    identityVerificationConsent: boolean;
    dataRetentionAcknowledged: boolean;
    communicationConsent: boolean;
  };
}

export interface UploadDocumentRequest {
  requestId: string;
  file: File;
  documentType: string;
}

export interface ApplicationStatus {
  status: "pending" | "under_review" | "approved" | "rejected";
  submittedAt: Date;
  reviewedAt?: Date;
  adminNotes?: string;
  blockchainApproved?: boolean;
}

class OrganizerService {
  // Mock data for development
  private mockRequests: OrganizerRequest[] = [
    {
      id: "req-001",
      walletAddress: "0x1234567890abcdef1234567890abcdef12345678",
      organizerName: "Tech Events Indonesia",
      email: "techevents@example.com",
      notes: "We organize technology conferences and workshops in Jakarta.",
      status: "approved",
      adminNotes: "Verified business registration and tax documents. Approved for tech events.",
      adminWallet: "0xadmin1234567890abcdef1234567890abcdef1234",
      createdAt: new Date("2024-12-01T10:30:00Z"),
      reviewedAt: new Date("2024-12-03T14:20:00Z"),
      approvedAt: new Date("2024-12-03T14:30:00Z"),
      blockchainApprovedAt: new Date("2024-12-03T14:35:00Z"),
    },
    {
      id: "req-002", 
      walletAddress: "0xabcd567890abcdef1234567890abcdef12345678",
      organizerName: "Jakarta Music Collective",
      email: "music@jakartacollective.com",
      notes: "Music festival organizer with 5 years experience.",
      status: "under_review",
      adminNotes: "Documents received. Reviewing business license authenticity.",
      adminWallet: "0xadmin1234567890abcdef1234567890abcdef1234",
      createdAt: new Date("2024-12-05T09:15:00Z"),
      reviewedAt: new Date("2024-12-06T11:00:00Z"),
    },
    {
      id: "req-003",
      walletAddress: "0x9876543210abcdef1234567890abcdef12345678", 
      organizerName: "Bali Wellness Events",
      email: "wellness@bali.com",
      notes: "Organizing yoga retreats and wellness workshops.",
      status: "pending",
      createdAt: new Date("2024-12-07T16:45:00Z"),
    },
    {
      id: "req-004",
      walletAddress: "0x5555567890abcdef1234567890abcdef12345678",
      organizerName: "Startup Fake Corp", 
      email: "fake@example.com",
      notes: "Fake business application for testing.",
      status: "rejected",
      adminNotes: "Invalid business registration. NPWP number does not exist in tax database.",
      adminWallet: "0xadmin1234567890abcdef1234567890abcdef1234",
      createdAt: new Date("2024-11-28T08:20:00Z"),
      reviewedAt: new Date("2024-11-30T13:45:00Z"),
    },
  ];

  private mockDocuments: Record<string, DocumentInfo[]> = {
    "req-001": [
      {
        id: "doc-001-npwp",
        requestId: "req-001", 
        documentType: "npwp",
        fileName: "npwp-tech-events-indonesia.docx",
        fileSize: 156789,
        uploadedAt: new Date("2024-12-01T10:35:00Z"),
        verifiedAt: new Date("2024-12-03T14:15:00Z"),
        verifiedBy: "0xadmin1234567890abcdef1234567890abcdef1234",
      },
      {
        id: "doc-001-ktp", 
        requestId: "req-001",
        documentType: "ktp",
        fileName: "ktp-director.docx",
        fileSize: 234567,
        uploadedAt: new Date("2024-12-01T10:40:00Z"),
        verifiedAt: new Date("2024-12-03T14:15:00Z"),
        verifiedBy: "0xadmin1234567890abcdef1234567890abcdef1234",
      },
      {
        id: "doc-001-business",
        requestId: "req-001",
        documentType: "business_license",
        fileName: "business-registration.docx", 
        fileSize: 445566,
        uploadedAt: new Date("2024-12-01T10:45:00Z"),
        verifiedAt: new Date("2024-12-03T14:15:00Z"),
        verifiedBy: "0xadmin1234567890abcdef1234567890abcdef1234",
      },
    ],
    "req-002": [
      {
        id: "doc-002-npwp",
        requestId: "req-002",
        documentType: "npwp", 
        fileName: "npwp-jakarta-music.docx",
        fileSize: 187654,
        uploadedAt: new Date("2024-12-05T09:20:00Z"),
      },
      {
        id: "doc-002-ktp",
        requestId: "req-002", 
        documentType: "ktp",
        fileName: "ktp-organizer.docx",
        fileSize: 198765,
        uploadedAt: new Date("2024-12-05T09:25:00Z"),
      },
    ],
  };

  // Submit new organizer application
  async submitApplication(data: SubmitApplicationRequest): Promise<{ requestId: string; status: string }> {
    if (DEVELOPMENT_CONFIG.ENABLE_ORGANIZER_BACKEND) {
      // Real API call
      const response = await fetch('/api/organizer-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`Application submission failed: ${response.statusText}`);
      }

      return await response.json();
    } else {
      // Mock implementation
      await this.simulateDelay(DEVELOPMENT_CONFIG.MOCK_TRANSACTION_DELAY);

      const newRequestId = `req-${String(Date.now()).slice(-6)}`;
      const newRequest: OrganizerRequest = {
        id: newRequestId,
        walletAddress: data.walletAddress,
        organizerName: data.organizerName,
        email: data.email,
        notes: data.notes,
        status: "pending",
        createdAt: new Date(),
      };

      this.mockRequests.unshift(newRequest);

      if (DEVELOPMENT_CONFIG.LOG_API_CALLS) {
        console.log("📝 Mock organizer application submitted:", newRequest);
      }

      return {
        requestId: newRequestId,
        status: "pending",
      };
    }
  }

  // Upload document for application
  async uploadDocument(
    requestId: string,
    file: File,
    documentType: string,
    onProgress?: (progress: number) => void
  ): Promise<{ documentId: string; fileName: string }> {
    if (DEVELOPMENT_CONFIG.ENABLE_DOCUMENT_UPLOAD) {
      // Real file upload
      const formData = new FormData();
      formData.append('document', file);
      formData.append('documentType', documentType);

      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();

        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable && onProgress) {
            const progress = (e.loaded / e.total) * 100;
            onProgress(progress);
          }
        };

        xhr.onload = () => {
          if (xhr.status === 200) {
            resolve(JSON.parse(xhr.responseText));
          } else {
            reject(new Error(`Upload failed: ${xhr.statusText}`));
          }
        };

        xhr.onerror = () => {
          reject(new Error('Upload failed'));
        };

        xhr.open('POST', `/api/organizer-requests/${requestId}/documents`);
        xhr.send(formData);
      });
    } else {
      // Mock file upload with progress simulation
      return new Promise((resolve) => {
        let progress = 0;
        const interval = setInterval(() => {
          progress += Math.random() * 20;
          if (progress >= 100) {
            progress = 100;
            clearInterval(interval);
            
            // Add to mock documents
            const documentId = `doc-${requestId}-${documentType}-${Date.now()}`;
            const newDocument: DocumentInfo = {
              id: documentId,
              requestId,
              documentType: documentType as any,
              fileName: file.name,
              fileSize: file.size,
              uploadedAt: new Date(),
            };

            if (!this.mockDocuments[requestId]) {
              this.mockDocuments[requestId] = [];
            }
            this.mockDocuments[requestId].push(newDocument);

            if (DEVELOPMENT_CONFIG.LOG_API_CALLS) {
              console.log(`📄 Mock document uploaded: ${file.name} for ${requestId}`);
            }

            resolve({
              documentId,
              fileName: file.name,
            });
          } else if (onProgress) {
            onProgress(progress);
          }
        }, 100);
      });
    }
  }

  // Check application status
  async getApplicationStatus(walletAddress: string): Promise<ApplicationStatus | null> {
    if (DEVELOPMENT_CONFIG.ENABLE_ORGANIZER_BACKEND) {
      // Real API call
      const response = await fetch(`/api/organizer-requests/status/${walletAddress}`);
      
      if (response.status === 404) {
        return null;
      }

      if (!response.ok) {
        throw new Error(`Failed to fetch application status: ${response.statusText}`);
      }

      return await response.json();
    } else {
      // Mock implementation
      await this.simulateDelay(500);

      const request = this.mockRequests.find(r => r.walletAddress.toLowerCase() === walletAddress.toLowerCase());
      
      if (!request) {
        return null;
      }

      return {
        status: request.status,
        submittedAt: request.createdAt,
        reviewedAt: request.reviewedAt,
        adminNotes: request.adminNotes,
        blockchainApproved: !!request.blockchainApprovedAt,
      };
    }
  }

  // Admin: Get all organizer requests
  async getOrganizerRequests(filters: {
    status?: string;
    page?: number;
    limit?: number;
    search?: string;
  } = {}): Promise<{
    requests: OrganizerRequest[];
    total: number;
    page: number;
  }> {
    if (DEVELOPMENT_CONFIG.ENABLE_ORGANIZER_BACKEND) {
      // Real API call
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(key, String(value));
        }
      });

      const response = await fetch(`/api/admin/organizer-requests?${params}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch organizer requests: ${response.statusText}`);
      }

      return await response.json();
    } else {
      // Mock implementation
      await this.simulateDelay(800);

      let filteredRequests = [...this.mockRequests];

      // Apply filters
      if (filters.status && filters.status !== 'all') {
        filteredRequests = filteredRequests.filter(r => r.status === filters.status);
      }

      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        filteredRequests = filteredRequests.filter(r => 
          r.organizerName.toLowerCase().includes(searchLower) ||
          r.email.toLowerCase().includes(searchLower) ||
          r.walletAddress.toLowerCase().includes(searchLower)
        );
      }

      // Pagination
      const page = filters.page || 1;
      const limit = filters.limit || 10;
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedRequests = filteredRequests.slice(startIndex, endIndex);

      if (DEVELOPMENT_CONFIG.LOG_API_CALLS) {
        console.log(`📋 Mock organizer requests fetched: ${paginatedRequests.length} of ${filteredRequests.length} total`);
      }

      return {
        requests: paginatedRequests,
        total: filteredRequests.length,
        page,
      };
    }
  }

  // Admin: Get single request with documents
  async getOrganizerRequestDetails(requestId: string): Promise<{
    request: OrganizerRequest;
    documents: DocumentInfo[];
    consent: ConsentInfo;
  }> {
    if (DEVELOPMENT_CONFIG.ENABLE_ORGANIZER_BACKEND) {
      // Real API call
      const response = await fetch(`/api/admin/organizer-requests/${requestId}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch request details: ${response.statusText}`);
      }

      return await response.json();
    } else {
      // Mock implementation
      await this.simulateDelay(600);

      const request = this.mockRequests.find(r => r.id === requestId);
      if (!request) {
        throw new Error("Request not found");
      }

      const documents = this.mockDocuments[requestId] || [];
      
      // Mock consent info
      const consent: ConsentInfo = {
        requestId,
        documentProcessingConsent: true,
        identityVerificationConsent: true,
        dataRetentionAcknowledged: true,
        communicationConsent: Math.random() > 0.5,
        consentedAt: request.createdAt,
        consentIpAddress: "192.168.1.100",
      };

      return { request, documents, consent };
    }
  }

  // Admin: Update request status
  async updateRequestStatus(
    requestId: string,
    status: "under_review" | "approved" | "rejected",
    adminNotes: string,
    adminWallet: string
  ): Promise<{ updated: boolean }> {
    if (DEVELOPMENT_CONFIG.ENABLE_ORGANIZER_BACKEND) {
      // Real API call
      const response = await fetch(`/api/admin/organizer-requests/${requestId}/review`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status,
          adminNotes,
          adminWallet,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to update request status: ${response.statusText}`);
      }

      return await response.json();
    } else {
      // Mock implementation
      await this.simulateDelay(DEVELOPMENT_CONFIG.MOCK_ADMIN_PROCESSING_TIME);

      const requestIndex = this.mockRequests.findIndex(r => r.id === requestId);
      if (requestIndex === -1) {
        throw new Error("Request not found");
      }

      this.mockRequests[requestIndex] = {
        ...this.mockRequests[requestIndex],
        status,
        adminNotes,
        adminWallet,
        reviewedAt: new Date(),
        ...(status === 'approved' ? { approvedAt: new Date() } : {}),
      };

      if (DEVELOPMENT_CONFIG.LOG_API_CALLS) {
        console.log(`✅ Mock request status updated: ${requestId} -> ${status}`);
      }

      return { updated: true };
    }
  }

  // Admin: Download document
  async downloadDocument(documentId: string): Promise<Blob> {
    if (DEVELOPMENT_CONFIG.ENABLE_DOCUMENT_UPLOAD) {
      // Real API call
      const response = await fetch(`/api/admin/organizer-documents/${documentId}`);
      
      if (!response.ok) {
        throw new Error(`Failed to download document: ${response.statusText}`);
      }

      return await response.blob();
    } else {
      // Mock implementation - return a fake blob
      await this.simulateDelay(1000);

      const mockDocContent = "Mock DOCX content - this would be the actual document in production";
      return new Blob([mockDocContent], { 
        type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" 
      });
    }
  }

  // Helper: Simulate network delay
  private async simulateDelay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export default new OrganizerService();