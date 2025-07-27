// EHB Robot Command Parser
// Phase 3: Real Backend Integration

export interface CommandAction {
  type: string;
  params: Record<string, any>;
  confidence: number;
}

export interface ParsedCommand {
  original: string;
  action: CommandAction;
  entities: Record<string, any>;
}

// Command patterns and their corresponding actions
const COMMAND_PATTERNS = [
  // Order commands
  {
    pattern: /(?:order|buy|get|purchase)\s+(\d+)?\s*([^for\s]+(?:\s+[^for\s]+)*?)(?:\s+for\s+(.+))?/i,
    action: 'place_order',
    extractParams: (matches: RegExpMatchArray) => ({
      quantity: matches[1] ? parseInt(matches[1]) : 1,
      item: matches[2]?.trim(),
      deliveryTime: matches[3]?.trim()
    })
  },

  // Navigation commands
  {
    pattern: /(?:open|go\s+to|navigate\s+to|show)\s+(gosellr|wallet|dashboard|franchise|services)/i,
    action: 'navigate',
    extractParams: (matches: RegExpMatchArray) => ({
      page: matches[1]?.toLowerCase()
    })
  },

  // Wallet commands
  {
    pattern: /(?:check|show|get)\s+(?:my\s+)?(?:wallet\s+)?balance/i,
    action: 'check_balance',
    extractParams: () => ({})
  },

  // Service booking
  {
    pattern: /(?:book|schedule|appointment)\s+([^for\s]+(?:\s+[^for\s]+)*?)(?:\s+for\s+(.+))?/i,
    action: 'book_service',
    extractParams: (matches: RegExpMatchArray) => ({
      service: matches[1]?.trim(),
      time: matches[2]?.trim()
    })
  },

  // Reminder commands
  {
    pattern: /(?:remind|set\s+reminder)\s+(?:me\s+)?(?:to\s+)?(.+?)(?:\s+(?:at|for)\s+(.+))?/i,
    action: 'set_reminder',
    extractParams: (matches: RegExpMatchArray) => ({
      task: matches[1]?.trim(),
      time: matches[2]?.trim()
    })
  },

  // Search commands
  {
    pattern: /(?:search|find|look\s+for)\s+(.+)/i,
    action: 'search',
    extractParams: (matches: RegExpMatchArray) => ({
      query: matches[1]?.trim()
    })
  },

  // Help commands
  {
    pattern: /(?:help|what\s+can\s+you\s+do|how\s+can\s+you\s+help)/i,
    action: 'show_help',
    extractParams: () => ({})
  }
];

// Time parsing utilities
const TIME_PATTERNS = [
  { pattern: /tomorrow/i, value: 'tomorrow' },
  { pattern: /next\s+week/i, value: 'next_week' },
  { pattern: /(\d{1,2}):(\d{2})\s*(am|pm)/i, value: 'specific_time' },
  { pattern: /(\d{1,2})\s*(am|pm)/i, value: 'hour_only' },
  { pattern: /in\s+(\d+)\s+(hour|day|week)s?/i, value: 'relative_time' }
];

export function parseCommand(input: string): ParsedCommand | null {
  const normalizedInput = input.toLowerCase().trim();

  // Try to match against each pattern
  for (const pattern of COMMAND_PATTERNS) {
    const matches = normalizedInput.match(pattern.pattern);
    if (matches) {
      const params = pattern.extractParams(matches);
      const confidence = calculateConfidence(normalizedInput, pattern.pattern);

      return {
        original: input,
        action: {
          type: pattern.action,
          params,
          confidence
        },
        entities: extractEntities(input)
      };
    }
  }

  return null;
}

function calculateConfidence(input: string, pattern: RegExp): number {
  // Simple confidence calculation based on pattern match quality
  const match = input.match(pattern);
  if (!match) return 0;

  // Base confidence
  let confidence = 0.7;

  // Boost confidence for exact matches
  if (match[0] === input) {
    confidence += 0.2;
  }

  // Boost for longer matches
  if (match[0].length > input.length * 0.8) {
    confidence += 0.1;
  }

  return Math.min(confidence, 1.0);
}

function extractEntities(input: string): Record<string, any> {
  const entities: Record<string, any> = {};

  // Extract time entities
  for (const timePattern of TIME_PATTERNS) {
    const match = input.match(timePattern.pattern);
    if (match) {
      entities.time = {
        type: timePattern.value,
        value: match[0],
        ...match.groups
      };
    }
  }

  // Extract numbers
  const numbers = input.match(/\d+/g);
  if (numbers) {
    entities.numbers = numbers.map(n => parseInt(n));
  }

  // Extract common items
  const commonItems = ['cold drink', 'milk', 'bread', 'water', 'cola', 'chips'];
  for (const item of commonItems) {
    if (input.toLowerCase().includes(item)) {
      entities.item = item;
      break;
    }
  }

  return entities;
}

// Backend API integration
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export async function executeCommandWithBackend(command: ParsedCommand, userId?: string): Promise<any> {
  try {
    const response = await fetch(`${API_BASE_URL}/robot/process-command`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        command: command.original,
        userId: userId || 'demo-user',
        mode: 'robot'
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return result;

  } catch (error) {
    console.error('Backend API error:', error);

    // Fallback to local execution if backend is unavailable
    return await executeCommandLocally(command);
  }
}

// Local fallback execution (Phase 2 style)
export async function executeCommandLocally(command: ParsedCommand): Promise<any> {
  const handler = ACTION_HANDLERS[command.action.type as keyof typeof ACTION_HANDLERS];

  if (!handler) {
    return {
      success: false,
      message: `Sorry, I don't understand how to ${command.action.type}`
    };
  }

  try {
    return await handler(command.action.params);
  } catch (error) {
    console.error('Local command execution error:', error);
    return {
      success: false,
      message: 'Sorry, there was an error executing your command'
    };
  }
}

// Action handlers (fallback for when backend is unavailable)
export const ACTION_HANDLERS = {
  place_order: async (params: any) => {
    console.log('🛒 Placing order (local):', params);
    return {
      success: true,
      message: `Order placed for ${params.quantity}x ${params.item}${params.deliveryTime ? ` for ${params.deliveryTime}` : ''}`,
      orderId: `ORD-${Date.now()}`,
      note: 'Backend unavailable - using local processing'
    };
  },

  navigate: async (params: any) => {
    console.log('🧭 Navigating (local):', params.page);
    return {
      success: true,
      message: `Navigating to ${params.page}`,
      page: params.page,
      note: 'Backend unavailable - using local processing'
    };
  },

  check_balance: async (params: any) => {
    console.log('💰 Checking balance (local)');
    return {
      success: true,
      message: 'Your wallet balance is 1,250 EHBGC',
      balance: 1250,
      note: 'Backend unavailable - using local processing'
    };
  },

  book_service: async (params: any) => {
    console.log('🔧 Booking service (local):', params);
    return {
      success: true,
      message: `Service booked: ${params.service}${params.time ? ` for ${params.time}` : ''}`,
      bookingId: `BK-${Date.now()}`,
      note: 'Backend unavailable - using local processing'
    };
  },

  set_reminder: async (params: any) => {
    console.log('⏰ Setting reminder (local):', params);
    return {
      success: true,
      message: `Reminder set: ${params.task}${params.time ? ` for ${params.time}` : ''}`,
      reminderId: `REM-${Date.now()}`,
      note: 'Backend unavailable - using local processing'
    };
  },

  search: async (params: any) => {
    console.log('🔍 Searching (local):', params.query);
    return {
      success: true,
      message: `Searching for: ${params.query}`,
      results: [],
      note: 'Backend unavailable - using local processing'
    };
  },

  show_help: async (params: any) => {
    return {
      success: true,
      message: `I can help you with:
• Order items: "Order 2 cold drinks"
• Navigate: "Open GoSellr"
• Check balance: "Show my wallet"
• Book services: "Book AC repair"
• Set reminders: "Remind me to order milk"
• Search: "Find shoes"`,
      help: true
    };
  }
};

// Main execution function - tries backend first, falls back to local
export async function executeCommand(command: ParsedCommand): Promise<any> {
  try {
    // Try backend first
    const result = await executeCommandWithBackend(command);
    return result;
  } catch (error) {
    console.error('Backend execution failed, using local fallback:', error);
    // Fallback to local execution
    return await executeCommandLocally(command);
  }
}

// Get robot statistics
export async function getRobotStats(): Promise<any> {
  try {
    const response = await fetch(`${API_BASE_URL}/robot/stats`);
    if (!response.ok) throw new Error('Failed to fetch stats');
    return await response.json();
  } catch (error) {
    console.error('Failed to get robot stats:', error);
    return {
      success: false,
      error: 'Failed to get statistics'
    };
  }
}

// Get robot activity log
export async function getRobotActivity(userId?: string, limit?: number): Promise<any> {
  try {
    const params = new URLSearchParams();
    if (userId) params.append('userId', userId);
    if (limit) params.append('limit', limit.toString());

    const response = await fetch(`${API_BASE_URL}/robot/activity?${params}`);
    if (!response.ok) throw new Error('Failed to fetch activity');
    return await response.json();
  } catch (error) {
    console.error('Failed to get robot activity:', error);
    return {
      success: false,
      error: 'Failed to get activity log'
    };
  }
}
