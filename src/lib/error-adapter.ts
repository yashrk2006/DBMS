/**
 * SkillSync Professional Error Adapter
 * Maps technical system/database errors to polished institutional terminology.
 */

export interface ErrorResponse {
  success: false;
  error: string;
  details?: string;
  diagnostic?: string;
}

export function getFriendlyErrorMessage(error: any): string {
  if (!error) return "An unexpected synchronization failure occurred.";

  const message = (typeof error === 'string' ? error : error.message || "").toLowerCase();
  const code = error.code || "";

  // 1. Auth & Identity Errors
  if (message.includes("invalid login credentials") || message.includes("invalid password")) {
    return "Authentication failed. Please verify your institutional credentials.";
  }
  if (message.includes("user already exists") || message.includes("email already in use")) {
    return "An identity profile is already registered with this email.";
  }
  if (message.includes("otp") && (message.includes("expired") || message.includes("invalid"))) {
    return "Invalid or expired verification code. Please request a new sync code.";
  }

  // 2. Database & Connection Errors
  if (code === 'PGRST116' || message.includes("not found")) {
    return "Record not found in the verified institutional directory.";
  }
  if (code.startsWith('57') || message.includes("connection") || message.includes("dns") || message.includes("econnrefused") || message.includes("too many clients")) {
    return "Institutional service reached a connectivity limit or database is unavailable. Please try again in 30 seconds.";
  }
  if (message.includes("self-signed certificate") || message.includes("ssl") || message.includes("certificate")) {
    return "Secure connection handshake failed (SSL). Please verify your institutional proxy settings.";
  }
  if (message.includes("database") || message.includes("rls") || message.includes("permission") || message.includes("auth.users")) {
    return "Access to institutional identity records is restricted. Contact Administrator.";
  }

  // 3. Application & Business Logic
  if (message.includes("already exists for this role")) {
    return "An application entry is already active for this recruitment cycle.";
  }
  if (message.includes("missing required fields")) {
    return "Required institutional data fields are missing. Please complete your profile.";
  }

  // Fallback with more context if it's a critical synchronization err
  if (message.includes("sync") || message.includes("pg")) {
    return "Institutional synchronization error: " + (error.message || "Data inconsistency detected.");
  }

  return "Institutional synchronization encountered an inconsistency. Please contact the Placement Cell.";
}
