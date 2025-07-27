// AI Router for processing commands and returning responses
// This is a simplified version - in production you'd integrate with OpenAI, Claude, etc.

const getAIResponse = async (command) => {
  try {
    console.log(`🤖 Processing AI command: "${command}"`);

    // Simulate AI processing delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Parse the command to determine appropriate response
    const response = await processCommand(command);

    return response;
  } catch (error) {
    console.error("AI processing error:", error);
    return "I'm sorry, I couldn't process that command. Please try again.";
  }
};

// Process different types of commands
const processCommand = async (command) => {
  const lowerCommand = command.toLowerCase();

  // Order-related commands
  if (lowerCommand.includes('order') || lowerCommand.includes('buy') || lowerCommand.includes('purchase')) {
    return processOrderCommand(command);
  }

  // Reminder commands
  if (lowerCommand.includes('remind') || lowerCommand.includes('reminder')) {
    return processReminderCommand(command);
  }

  // Service booking commands
  if (lowerCommand.includes('book') || lowerCommand.includes('schedule') || lowerCommand.includes('appointment')) {
    return processServiceCommand(command);
  }

  // General commands
  return processGeneralCommand(command);
};

// Process order commands
const processOrderCommand = async (command) => {
  const lowerCommand = command.toLowerCase();

  // Extract product from command
  let product = "item";
  if (lowerCommand.includes('cold drink') || lowerCommand.includes('cold drink')) {
    product = "cold drink";
  } else if (lowerCommand.includes('milk')) {
    product = "milk";
  } else if (lowerCommand.includes('bread')) {
    product = "bread";
  } else if (lowerCommand.includes('water')) {
    product = "water bottles";
  }

  // Simulate order processing
  const orderId = Math.random().toString(36).substr(2, 9);

  return `✅ Order placed successfully! I've ordered ${product} for you. Order ID: ${orderId}. You'll receive a confirmation shortly.`;
};

// Process reminder commands
const processReminderCommand = async (command) => {
  const lowerCommand = command.toLowerCase();

  if (lowerCommand.includes('medicine') || lowerCommand.includes('pill')) {
    return "✅ Reminder set! I'll remind you to take your medicine at the scheduled time.";
  }

  if (lowerCommand.includes('meeting') || lowerCommand.includes('appointment')) {
    return "✅ Meeting reminder set! I'll notify you before your scheduled meeting.";
  }

  return "✅ Reminder set successfully! I'll notify you at the scheduled time.";
};

// Process service booking commands
const processServiceCommand = async (command) => {
  const lowerCommand = command.toLowerCase();

  if (lowerCommand.includes('electrician')) {
    return "✅ Electrician service booked! I've scheduled an electrician for you. You'll receive a confirmation call.";
  }

  if (lowerCommand.includes('ac') || lowerCommand.includes('air conditioning')) {
    return "✅ AC service booked! I've scheduled AC maintenance for you. The technician will contact you soon.";
  }

  if (lowerCommand.includes('plumber')) {
    return "✅ Plumber service booked! I've scheduled a plumber for you. You'll receive a confirmation.";
  }

  return "✅ Service booked successfully! You'll receive a confirmation shortly.";
};

// Process general commands
const processGeneralCommand = async (command) => {
  const lowerCommand = command.toLowerCase();

  // Check for positive/negative sentiment
  const positiveWords = ['good', 'great', 'excellent', 'perfect', 'thanks', 'thank you'];
  const negativeWords = ['bad', 'terrible', 'awful', 'hate', 'angry'];

  if (positiveWords.some(word => lowerCommand.includes(word))) {
    return "I'm glad I could help! Is there anything else you need assistance with?";
  }

  if (negativeWords.some(word => lowerCommand.includes(word))) {
    return "I understand your concern. Let me help you resolve this issue. What can I do to make it better?";
  }

  // Default response
  return "I've processed your request. Is there anything else you need help with?";
};

// Export the function
module.exports = getAIResponse;
