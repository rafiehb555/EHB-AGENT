/**
 * EHB Company Information Agent
 * 
 * This agent handles all EHB company information files and provides
 * comprehensive management capabilities for the cursor agent.
 */

const fs = require('fs');
const path = require('path');

class EHBCompanyAgent {
    constructor() {
        this.companyInfoPath = 'company-info/';
        this.devGuidelinesPath = 'development-guidelines/';
        this.projectDocsPath = 'project-docs/';
        this.assetsPath = 'assets/';
        
        // File structure mapping
        this.fileStructure = {
            'company-info': {
                'index.md': 'Complete company information index',
                'company-profile.md': 'Company mission, vision, and values',
                'brand-guidelines.md': 'Design standards and brand colors',
                'team-structure.md': 'Organizational structure and roles',
                'contact-info.md': 'Contact details and communication guidelines'
            },
            'development-guidelines': {
                'standards.md': 'Coding standards and best practices'
            },
            'project-docs': {
                'requirements.md': 'Healthcare project requirements'
            }
        };
        
        // Brand colors and standards
        this.brandColors = {
            primaryBlue: '#2563EB',
            healthcareGreen: '#10B981',
            professionalGray: '#6B7280',
            successGreen: '#22C55E',
            errorRed: '#EF4444',
            lightBlue: '#DBEAFE',
            warningOrange: '#F59E0B',
            white: '#FFFFFF',
            lightGray: '#F9FAFB',
            darkGray: '#1F2937'
        };
        
        // Technology stack
        this.techStack = {
            frontend: ['React.js', 'Angular', 'Vue.js'],
            backend: ['Node.js', 'Python', 'Java'],
            database: ['PostgreSQL', 'MongoDB', 'MySQL'],
            cloud: ['AWS', 'Azure', 'Google Cloud'],
            mobile: ['React Native', 'Flutter'],
            ai: ['TensorFlow', 'PyTorch', 'Scikit-learn']
        };
        
        // Healthcare standards
        this.healthcareStandards = {
            dataInteroperability: 'HL7 FHIR',
            diseaseClassification: 'ICD-10',
            procedureCodes: 'CPT codes',
            labObservations: 'LOINC',
            clinicalTerminology: 'SNOMED CT'
        };
    }

    /**
     * Get company information by category
     * @param {string} category - Category of information to retrieve
     * @returns {Object} Company information for the specified category
     */
    getCompanyInfo(category) {
        const categories = {
            'profile': this.readFile('company-info/company-profile.md'),
            'brand': this.readFile('company-info/brand-guidelines.md'),
            'team': this.readFile('company-info/team-structure.md'),
            'contact': this.readFile('company-info/contact-info.md'),
            'standards': this.readFile('development-guidelines/standards.md'),
            'requirements': this.readFile('project-docs/requirements.md'),
            'index': this.readFile('company-info/index.md')
        };
        
        return categories[category] || categories['index'];
    }

    /**
     * Get brand colors and design standards
     * @returns {Object} Brand colors and design information
     */
    getBrandInfo() {
        return {
            colors: this.brandColors,
            typography: {
                fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                headingWeight: '600-700',
                bodyWeight: '400-500',
                sizes: {
                    h1: '2.25rem (36px)',
                    h2: '1.875rem (30px)',
                    h3: '1.5rem (24px)',
                    h4: '1.25rem (20px)',
                    body: '1rem (16px)',
                    small: '0.875rem (14px)'
                }
            },
            designPrinciples: {
                healthcareFocused: 'Clean, professional appearance',
                accessibility: 'High contrast for accessibility',
                informationHierarchy: 'Clear information hierarchy',
                trustworthy: 'Trustworthy and reliable feel'
            }
        };
    }

    /**
     * Get development standards and guidelines
     * @returns {Object} Development standards and best practices
     */
    getDevelopmentStandards() {
        return {
            codeQuality: {
                readability: 'Code should be self-documenting',
                maintainability: 'Easy to modify and extend',
                performance: 'Optimized for healthcare applications',
                security: 'HIPAA-compliant security measures',
                testing: 'Comprehensive test coverage'
            },
            fileStructure: {
                src: {
                    components: 'Reusable UI components',
                    pages: 'Page components',
                    services: 'Business logic and API calls',
                    utils: 'Helper functions',
                    types: 'TypeScript type definitions',
                    hooks: 'Custom React hooks',
                    constants: 'Application constants',
                    assets: 'Images, icons, etc.'
                }
            },
            performanceStandards: {
                frontend: {
                    loadTime: '< 3 seconds for initial page load',
                    bundleSize: '< 500KB for main bundle',
                    imageOptimization: 'WebP format, lazy loading'
                },
                backend: {
                    responseTime: '< 200ms for API responses',
                    databaseQueries: 'Optimized with proper indexing',
                    caching: 'Redis for frequently accessed data'
                }
            }
        };
    }

    /**
     * Get healthcare-specific requirements
     * @returns {Object} Healthcare requirements and standards
     */
    getHealthcareRequirements() {
        return {
            compliance: {
                hipaa: 'Full HIPAA compliance required',
                dataPrivacy: 'GDPR compliance for international users',
                auditTrails: 'Complete audit logging',
                dataRetention: 'Proper data retention policies',
                breachNotification: 'Incident response procedures'
            },
            medicalDataStandards: this.healthcareStandards,
            userExperience: {
                accessibility: 'WCAG 2.1 AA compliance',
                mobileResponsive: 'Works on all devices',
                intuitiveDesign: 'Easy to use for healthcare professionals',
                errorPrevention: 'Clear validation and error messages',
                loadingStates: 'Clear loading indicators'
            },
            security: {
                encryption: 'AES-256 encryption for data at rest',
                https: 'SSL/TLS for all communications',
                authentication: 'Multi-factor authentication',
                authorization: 'Role-based access control',
                auditLogging: 'Comprehensive audit trails',
                dataMasking: 'PII protection in logs'
            }
        };
    }

    /**
     * Get technology stack information
     * @returns {Object} Technology stack details
     */
    getTechnologyStack() {
        return {
            frontend: this.techStack.frontend,
            backend: this.techStack.backend,
            database: this.techStack.database,
            cloud: this.techStack.cloud,
            mobile: this.techStack.mobile,
            ai: this.techStack.ai,
            healthcareStandards: this.healthcareStandards
        };
    }

    /**
     * Validate development against EHB standards
     * @param {Object} developmentInfo - Information about the development
     * @returns {Object} Validation results and recommendations
     */
    validateDevelopment(developmentInfo) {
        const validation = {
            isValid: true,
            issues: [],
            recommendations: [],
            compliance: {
                hipaa: false,
                accessibility: false,
                performance: false,
                security: false
            }
        };

        // Check HIPAA compliance
        if (developmentInfo.involvesPatientData) {
            validation.compliance.hipaa = this.checkHIPAACompliance(developmentInfo);
            if (!validation.compliance.hipaa) {
                validation.isValid = false;
                validation.issues.push('HIPAA compliance requirements not met');
                validation.recommendations.push('Implement encryption, access controls, and audit logging');
            }
        }

        // Check accessibility
        if (developmentInfo.hasUI) {
            validation.compliance.accessibility = this.checkAccessibility(developmentInfo);
            if (!validation.compliance.accessibility) {
                validation.issues.push('Accessibility standards not met');
                validation.recommendations.push('Ensure WCAG 2.1 AA compliance with high contrast and keyboard navigation');
            }
        }

        // Check performance
        validation.compliance.performance = this.checkPerformance(developmentInfo);
        if (!validation.compliance.performance) {
            validation.issues.push('Performance standards not met');
            validation.recommendations.push('Optimize for < 3 seconds load time and < 200ms API responses');
        }

        // Check security
        validation.compliance.security = this.checkSecurity(developmentInfo);
        if (!validation.compliance.security) {
            validation.isValid = false;
            validation.issues.push('Security requirements not met');
            validation.recommendations.push('Implement proper authentication, authorization, and data encryption');
        }

        return validation;
    }

    /**
     * Generate development recommendations
     * @param {string} projectType - Type of healthcare project
     * @returns {Object} Specific recommendations for the project
     */
    getDevelopmentRecommendations(projectType) {
        const recommendations = {
            'patient-management': {
                technology: 'React.js + Node.js + PostgreSQL',
                features: ['Patient registration', 'Medical history tracking', 'Appointment scheduling'],
                compliance: ['HIPAA compliance', 'Data encryption', 'Audit logging'],
                testing: ['Medical data validation', 'Security testing', 'Accessibility testing']
            },
            'ehr-system': {
                technology: 'React.js + Python/FastAPI + PostgreSQL',
                features: ['Data entry interfaces', 'HL7 FHIR integration', 'Audit trails'],
                compliance: ['Full HIPAA compliance', 'Data interoperability', 'Backup systems'],
                testing: ['Interoperability testing', 'Compliance verification', 'Performance testing']
            },
            'telemedicine': {
                technology: 'React.js + Node.js + WebRTC',
                features: ['Video conferencing', 'Screen sharing', 'Prescription management'],
                compliance: ['Secure video calls', 'Data privacy', 'Payment processing'],
                testing: ['Video quality testing', 'Security testing', 'Mobile testing']
            },
            'healthcare-analytics': {
                technology: 'React.js + Python + PostgreSQL + Redis',
                features: ['Real-time dashboards', 'Predictive analytics', 'Data visualization'],
                compliance: ['Data anonymization', 'Access controls', 'Audit logging'],
                testing: ['Data accuracy testing', 'Performance testing', 'Visualization testing']
            }
        };

        return recommendations[projectType] || recommendations['patient-management'];
    }

    /**
     * Update company information
     * @param {string} filePath - Path to the file to update
     * @param {string} content - New content for the file
     * @returns {boolean} Success status
     */
    updateCompanyInfo(filePath, content) {
        try {
            const fullPath = path.join(process.cwd(), filePath);
            fs.writeFileSync(fullPath, content, 'utf8');
            return true;
        } catch (error) {
            console.error('Error updating company info:', error);
            return false;
        }
    }

    /**
     * Read file content
     * @param {string} filePath - Path to the file
     * @returns {string} File content
     */
    readFile(filePath) {
        try {
            const fullPath = path.join(process.cwd(), filePath);
            return fs.readFileSync(fullPath, 'utf8');
        } catch (error) {
            console.error(`Error reading file ${filePath}:`, error);
            return '';
        }
    }

    /**
     * Check HIPAA compliance
     * @param {Object} developmentInfo - Development information
     * @returns {boolean} HIPAA compliance status
     */
    checkHIPAACompliance(developmentInfo) {
        const requiredFeatures = [
            'encryption',
            'accessControls',
            'auditLogging',
            'dataRetention',
            'breachNotification'
        ];

        return requiredFeatures.every(feature => 
            developmentInfo.features && developmentInfo.features.includes(feature)
        );
    }

    /**
     * Check accessibility compliance
     * @param {Object} developmentInfo - Development information
     * @returns {boolean} Accessibility compliance status
     */
    checkAccessibility(developmentInfo) {
        const requiredFeatures = [
            'highContrast',
            'keyboardNavigation',
            'screenReaderSupport',
            'focusIndicators',
            'altText'
        ];

        return requiredFeatures.every(feature => 
            developmentInfo.accessibility && developmentInfo.accessibility.includes(feature)
        );
    }

    /**
     * Check performance standards
     * @param {Object} developmentInfo - Development information
     * @returns {boolean} Performance compliance status
     */
    checkPerformance(developmentInfo) {
        const performanceStandards = {
            frontendLoadTime: developmentInfo.frontendLoadTime <= 3000,
            apiResponseTime: developmentInfo.apiResponseTime <= 200,
            bundleSize: developmentInfo.bundleSize <= 500000
        };

        return Object.values(performanceStandards).every(standard => standard);
    }

    /**
     * Check security requirements
     * @param {Object} developmentInfo - Development information
     * @returns {boolean} Security compliance status
     */
    checkSecurity(developmentInfo) {
        const securityFeatures = [
            'authentication',
            'authorization',
            'encryption',
            'dataMasking',
            'secureCommunication'
        ];

        return securityFeatures.every(feature => 
            developmentInfo.security && developmentInfo.security.includes(feature)
        );
    }

    /**
     * Get emergency contacts
     * @returns {Object} Emergency contact information
     */
    getEmergencyContacts() {
        return {
            security: 'security@ehb.com',
            privacy: 'privacy@ehb.com',
            emergencyTech: 'emergency-tech@ehb.com',
            safety: 'safety@ehb.com',
            clinicalSupport: 'clinical-support@ehb.com',
            compliance: 'compliance@ehb.com'
        };
    }

    /**
     * Get response time standards
     * @returns {Object} Response time standards
     */
    getResponseTimeStandards() {
        return {
            urgent: '< 1 hour',
            highPriority: '< 4 hours',
            normalPriority: '< 24 hours',
            lowPriority: '< 48 hours'
        };
    }
}

// Export the agent
module.exports = EHBCompanyAgent;

// Example usage
if (require.main === module) {
    const agent = new EHBCompanyAgent();
    
    console.log('EHB Company Agent initialized');
    console.log('Brand Colors:', agent.getBrandInfo().colors);
    console.log('Technology Stack:', agent.getTechnologyStack());
    console.log('Emergency Contacts:', agent.getEmergencyContacts());
} 