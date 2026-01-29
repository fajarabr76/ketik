
export enum ConsumerDifficulty {
  Easy = "Mudah",
  Medium = "Sedang",
  Hard = "Sulit",
  Random = "Random"
}

export interface ConsumerType {
  id: string;
  name: string;
  description: string;
  difficulty: ConsumerDifficulty;
  isCustom?: boolean;
}

export interface Scenario {
  id: string;
  category: string;
  title: string;
  description: string;
  script?: string; // Optional script reference
  isActive: boolean; // For checkbox selection
  consumerTypeId?: string; // Specific consumer type for this scenario, or 'random'
  images?: string[]; // Array of Base64 strings for images
  fixedIdentity?: Identity; // For scenario-specific hardcoded identity (optional)
}

export interface Identity {
  name: string;
  phone: string;
  city: string;
  signatureName?: string; // Added for the new setting (nickname in chat)
}

export interface ConsumerIdentitySettings {
  displayName: string;
  signatureName: string;
  phoneNumber: string;
  city: string;
}

export type MessageStatus = 'sent' | 'delivered' | 'read';

export interface ChatMessage {
  id: string;
  sender: 'agent' | 'consumer' | 'system';
  text: string;
  timestamp: Date;
  status?: MessageStatus; // Only relevant for agent messages
}

export interface AppSettings {
  scenarios: Scenario[];
  consumerTypes: ConsumerType[];
  identitySettings?: ConsumerIdentitySettings;
}

export interface SessionConfig {
  scenarios: Scenario[]; // Changed to array to support multiple scenarios
  consumerType: ConsumerType;
  identity: Identity;
}