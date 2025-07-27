// EHB Robot Time Parser
class TimeParser {
    constructor() {
        this.now = new Date();
        this.init();
    }

    init() {
        // Common time patterns
        this.patterns = {
            // Specific times: "6pm", "2:30am", "15:30"
            specificTime: /(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i,

            // Relative times: "in 2 hours", "in 30 minutes"
            relativeTime: /in\s+(\d+)\s+(hours?|minutes?|days?)/i,

            // Day references: "tomorrow", "today", "next week"
            dayReference: /(tomorrow|today|next\s+(day|week|month))/i,

            // Time of day: "morning", "afternoon", "evening", "night"
            timeOfDay: /(morning|afternoon|evening|night|noon|midnight)/i,

            // Combined patterns: "tomorrow 6pm", "next week morning"
            combined: /(tomorrow|today|next\s+(day|week|month))\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i
        };
    }

    // Main parsing function
    parseTimeExpression(expression) {
        if (!expression) return null;

        const timeString = expression.toLowerCase().trim();

        try {
            // Try combined patterns first
            let result = this.parseCombinedPattern(timeString);
            if (result) return result;

            // Try specific time
            result = this.parseSpecificTime(timeString);
            if (result) return result;

            // Try relative time
            result = this.parseRelativeTime(timeString);
            if (result) return result;

            // Try day reference
            result = this.parseDayReference(timeString);
            if (result) return result;

            // Try time of day
            result = this.parseTimeOfDay(timeString);
            if (result) return result;

            return null;

        } catch (error) {
            console.error('Time parsing error:', error);
            return null;
        }
    }

    // Parse combined patterns like "tomorrow 6pm"
    parseCombinedPattern(timeString) {
        const match = timeString.match(this.patterns.combined);
        if (!match) return null;

        const dayRef = match[1];
        const hour = parseInt(match[3]);
        const minute = match[4] ? parseInt(match[4]) : 0;
        const period = match[5] ? match[5].toLowerCase() : null;

        let targetDate = new Date(this.now);

        // Adjust for day reference
        if (dayRef.includes('tomorrow')) {
            targetDate.setDate(targetDate.getDate() + 1);
        } else if (dayRef.includes('next day')) {
            targetDate.setDate(targetDate.getDate() + 1);
        } else if (dayRef.includes('next week')) {
            targetDate.setDate(targetDate.getDate() + 7);
        } else if (dayRef.includes('next month')) {
            targetDate.setMonth(targetDate.getMonth() + 1);
        }

        // Set time
        let adjustedHour = hour;
        if (period === 'pm' && hour !== 12) {
            adjustedHour = hour + 12;
        } else if (period === 'am' && hour === 12) {
            adjustedHour = 0;
        }

        targetDate.setHours(adjustedHour, minute, 0, 0);

        return {
            isoString: targetDate.toISOString(),
            display: this.formatDisplayTime(targetDate),
            type: 'combined'
        };
    }

    // Parse specific times like "6pm", "2:30am"
    parseSpecificTime(timeString) {
        const match = timeString.match(this.patterns.specificTime);
        if (!match) return null;

        const hour = parseInt(match[1]);
        const minute = match[2] ? parseInt(match[2]) : 0;
        const period = match[3] ? match[3].toLowerCase() : null;

        let targetDate = new Date(this.now);
        let adjustedHour = hour;

        // Handle AM/PM
        if (period === 'pm' && hour !== 12) {
            adjustedHour = hour + 12;
        } else if (period === 'am' && hour === 12) {
            adjustedHour = 0;
        }

        targetDate.setHours(adjustedHour, minute, 0, 0);

        // If time has passed today, schedule for tomorrow
        if (targetDate <= this.now) {
            targetDate.setDate(targetDate.getDate() + 1);
        }

        return {
            isoString: targetDate.toISOString(),
            display: this.formatDisplayTime(targetDate),
            type: 'specific'
        };
    }

    // Parse relative times like "in 2 hours"
    parseRelativeTime(timeString) {
        const match = timeString.match(this.patterns.relativeTime);
        if (!match) return null;

        const amount = parseInt(match[1]);
        const unit = match[2].toLowerCase();

        let targetDate = new Date(this.now);

        switch (unit) {
            case 'hour':
            case 'hours':
                targetDate.setHours(targetDate.getHours() + amount);
                break;
            case 'minute':
            case 'minutes':
                targetDate.setMinutes(targetDate.getMinutes() + amount);
                break;
            case 'day':
            case 'days':
                targetDate.setDate(targetDate.getDate() + amount);
                break;
        }

        return {
            isoString: targetDate.toISOString(),
            display: this.formatDisplayTime(targetDate),
            type: 'relative'
        };
    }

    // Parse day references like "tomorrow", "today"
    parseDayReference(timeString) {
        const match = timeString.match(this.patterns.dayReference);
        if (!match) return null;

        const dayRef = match[1].toLowerCase();
        let targetDate = new Date(this.now);

        switch (dayRef) {
            case 'tomorrow':
                targetDate.setDate(targetDate.getDate() + 1);
                break;
            case 'next day':
                targetDate.setDate(targetDate.getDate() + 1);
                break;
            case 'next week':
                targetDate.setDate(targetDate.getDate() + 7);
                break;
            case 'next month':
                targetDate.setMonth(targetDate.getMonth() + 1);
                break;
            case 'today':
                // Keep current date
                break;
        }

        // Set to 9 AM by default for day references
        targetDate.setHours(9, 0, 0, 0);

        return {
            isoString: targetDate.toISOString(),
            display: this.formatDisplayTime(targetDate),
            type: 'day_reference'
        };
    }

    // Parse time of day like "morning", "afternoon"
    parseTimeOfDay(timeString) {
        const match = timeString.match(this.patterns.timeOfDay);
        if (!match) return null;

        const timeOfDay = match[1].toLowerCase();
        let targetDate = new Date(this.now);

        switch (timeOfDay) {
            case 'morning':
                targetDate.setHours(9, 0, 0, 0);
                break;
            case 'afternoon':
                targetDate.setHours(14, 0, 0, 0);
                break;
            case 'evening':
                targetDate.setHours(18, 0, 0, 0);
                break;
            case 'night':
                targetDate.setHours(20, 0, 0, 0);
                break;
            case 'noon':
                targetDate.setHours(12, 0, 0, 0);
                break;
            case 'midnight':
                targetDate.setHours(0, 0, 0, 0);
                targetDate.setDate(targetDate.getDate() + 1);
                break;
        }

        // If time has passed today, schedule for tomorrow
        if (targetDate <= this.now) {
            targetDate.setDate(targetDate.getDate() + 1);
        }

        return {
            isoString: targetDate.toISOString(),
            display: this.formatDisplayTime(targetDate),
            type: 'time_of_day'
        };
    }

    // Format time for display
    formatDisplayTime(date) {
        const now = new Date();
        const diffMs = date.getTime() - now.getTime();
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffHours / 24);

        if (diffDays > 0) {
            return `${diffDays} day(s) from now at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
        } else if (diffHours > 0) {
            return `${diffHours} hour(s) from now at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
        } else {
            return `in ${Math.floor(diffMs / (1000 * 60))} minutes`;
        }
    }

    // Validate if a time expression is valid
    isValidTimeExpression(expression) {
        if (!expression) return false;

        const result = this.parseTimeExpression(expression);
        return result !== null;
    }

    // Get human-readable time difference
    getTimeDifference(targetDate) {
        const now = new Date();
        const target = new Date(targetDate);
        const diffMs = target.getTime() - now.getTime();

        if (diffMs < 0) {
            return 'Time has passed';
        }

        const diffMinutes = Math.floor(diffMs / (1000 * 60));
        const diffHours = Math.floor(diffMinutes / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffDays > 0) {
            return `${diffDays} day(s)`;
        } else if (diffHours > 0) {
            return `${diffHours} hour(s)`;
        } else {
            return `${diffMinutes} minute(s)`;
        }
    }

    // Update current time reference
    updateNow() {
        this.now = new Date();
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TimeParser;
}

// Make globally available
window.TimeParser = TimeParser;
