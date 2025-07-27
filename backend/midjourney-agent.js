const axios = require('axios');
const winston = require('winston');

class MidjourneyAgent {
    constructor() {
        this.apiKey = process.env.MIDJOURNEY_API_KEY;
        this.baseURL = 'https://api.midjourney.com/v1';
        this.status = 'initializing';
        this.setupLogging();
    }

    setupLogging() {
        this.logger = winston.createLogger({
            level: 'info',
            format: winston.format.combine(
                winston.format.timestamp(),
                winston.format.json()
            ),
            transports: [
                new winston.transports.File({ filename: 'logs/midjourney-agent.log' }),
                new winston.transports.Console({
                    format: winston.format.simple()
                })
            ]
        });
    }

    async initialize() {
        try {
            if (!this.apiKey) {
                this.logger.warn('⚠️ Midjourney API key not configured - using mock mode');
                this.status = 'mock-mode';
                return;
            }

            // Test API connection
            await this.testConnection();
            this.status = 'ready';
            this.logger.info('✅ Midjourney Agent initialized successfully');
            
        } catch (error) {
            this.status = 'error';
            this.logger.error('❌ Midjourney Agent initialization failed:', error);
            throw error;
        }
    }

    async testConnection() {
        // Simple test to check if API key is valid
        const response = await this.makeRequest({
            action: 'test',
            prompt: 'test connection'
        });
        return response;
    }

    async makeRequest(payload) {
        try {
            const response = await axios.post(
                `${this.baseURL}/imagine`,
                payload,
                {
                    headers: {
                        'Authorization': `Bearer ${this.apiKey}`,
                        'Content-Type': 'application/json'
                    }
                }
            );
            return response.data;
        } catch (error) {
            this.logger.error('Midjourney API request failed:', error.response?.data || error.message);
            throw error;
        }
    }

    async generateDesign(params) {
        const { prompt, style, dimensions, quality, aspectRatio } = params;
        
        this.logger.info(`🎨 Generating design with prompt: ${prompt.substring(0, 50)}...`);
        
        if (this.status === 'mock-mode') {
            return this.mockDesignGeneration(prompt, style, dimensions);
        }

        try {
            const enhancedPrompt = this.enhancePrompt(prompt, style);
            
            const response = await this.makeRequest({
                prompt: enhancedPrompt,
                width: dimensions?.width || 1024,
                height: dimensions?.height || 1024,
                quality: quality || 'standard',
                aspect_ratio: aspectRatio || '1:1',
                style: style || 'default'
            });

            return {
                designUrl: response.image_url,
                prompt: enhancedPrompt,
                variations: response.variations || [],
                metadata: {
                    style: style,
                    dimensions: dimensions,
                    quality: quality,
                    aspectRatio: aspectRatio,
                    timestamp: new Date().toISOString()
                }
            };

        } catch (error) {
            this.logger.error('Design generation failed:', error);
            throw error;
        }
    }

    async generateUIIcon(params) {
        const { iconType, style, color, size } = params;
        
        const prompt = this.createIconPrompt(iconType, style, color);
        
        return await this.generateDesign({
            prompt: prompt,
            style: style || 'minimal',
            dimensions: { width: size || 512, height: size || 512 },
            quality: 'high'
        });
    }

    async generateDashboardLayout(params) {
        const { theme, components, layout } = params;
        
        const prompt = this.createDashboardPrompt(theme, components, layout);
        
        return await this.generateDesign({
            prompt: prompt,
            style: 'professional',
            dimensions: { width: 1920, height: 1080 },
            quality: 'high',
            aspectRatio: '16:9'
        });
    }

    async generateLogo(params) {
        const { companyName, industry, style, colors } = params;
        
        const prompt = this.createLogoPrompt(companyName, industry, style, colors);
        
        return await this.generateDesign({
            prompt: prompt,
            style: style || 'modern',
            dimensions: { width: 1024, height: 1024 },
            quality: 'high',
            aspectRatio: '1:1'
        });
    }

    async generateHealthcareUI(params) {
        const { component, patientType, accessibility, style } = params;
        
        const prompt = this.createHealthcarePrompt(component, patientType, accessibility, style);
        
        return await this.generateDesign({
            prompt: prompt,
            style: style || 'medical',
            dimensions: { width: 1440, height: 900 },
            quality: 'high',
            aspectRatio: '16:10'
        });
    }

    enhancePrompt(prompt, style) {
        let enhancedPrompt = prompt;
        
        // Add style-specific enhancements
        const styleEnhancements = {
            'modern': 'modern, clean, minimalist design',
            'professional': 'professional, corporate, business design',
            'medical': 'medical, healthcare, clinical design',
            'minimal': 'minimalist, clean, simple design',
            'colorful': 'vibrant, colorful, energetic design',
            'dark': 'dark theme, modern, sleek design'
        };

        if (style && styleEnhancements[style]) {
            enhancedPrompt += `, ${styleEnhancements[style]}`;
        }

        // Add quality enhancements
        enhancedPrompt += ', high quality, detailed, professional';

        return enhancedPrompt;
    }

    createIconPrompt(iconType, style, color) {
        return `Create a ${style || 'minimal'} ${iconType} icon in ${color || 'blue'} color. Clean, simple, recognizable design suitable for a user interface. High contrast, scalable vector style.`;
    }

    createDashboardPrompt(theme, components, layout) {
        const componentList = components ? components.join(', ') : 'charts, tables, navigation, widgets';
        const layoutType = layout || 'grid';
        
        return `Create a ${theme || 'modern'} dashboard layout with ${componentList}. ${layoutType} layout, clean interface, professional design. Suitable for business analytics and data visualization.`;
    }

    createLogoPrompt(companyName, industry, style, colors) {
        const colorList = colors ? colors.join(' and ') : 'blue and white';
        
        return `Create a ${style || 'modern'} logo for ${companyName}, a ${industry || 'technology'} company. Use ${colorList} colors. Professional, memorable, scalable design.`;
    }

    createHealthcarePrompt(component, patientType, accessibility, style) {
        const accessibilityFeatures = accessibility ? `, ${accessibility} accessible` : '';
        const patientContext = patientType ? ` for ${patientType} patients` : '';
        
        return `Create a ${style || 'medical'} ${component} interface${patientContext}${accessibilityFeatures}. Clean, professional healthcare design with clear typography and intuitive navigation. HIPAA compliant visual design.`;
    }

    // Mock methods for when API key is not available
    mockDesignGeneration(prompt, style, dimensions) {
        const mockUrls = [
            'https://mock-midjourney.com/design1.jpg',
            'https://mock-midjourney.com/design2.jpg',
            'https://mock-midjourney.com/design3.jpg',
            'https://mock-midjourney.com/design4.jpg'
        ];

        const randomUrl = mockUrls[Math.floor(Math.random() * mockUrls.length)];
        
        return {
            designUrl: randomUrl,
            prompt: prompt,
            variations: [
                randomUrl.replace('.jpg', '_v1.jpg'),
                randomUrl.replace('.jpg', '_v2.jpg'),
                randomUrl.replace('.jpg', '_v3.jpg')
            ],
            metadata: {
                style: style,
                dimensions: dimensions,
                quality: 'high',
                aspectRatio: '1:1',
                timestamp: new Date().toISOString()
            }
        };
    }

    async generateVariations(params) {
        const { originalImageId, style, count } = params;
        
        this.logger.info(`🎨 Generating ${count || 4} variations for image: ${originalImageId}`);
        
        if (this.status === 'mock-mode') {
            return this.mockVariations(originalImageId, count);
        }

        try {
            const response = await this.makeRequest({
                action: 'variation',
                image_id: originalImageId,
                style: style,
                count: count || 4
            });

            return {
                originalImageId: originalImageId,
                variations: response.variations,
                style: style,
                count: count || 4
            };

        } catch (error) {
            this.logger.error('Variation generation failed:', error);
            throw error;
        }
    }

    mockVariations(originalImageId, count) {
        const variations = [];
        for (let i = 1; i <= (count || 4); i++) {
            variations.push({
                id: `var_${originalImageId}_${i}`,
                url: `https://mock-midjourney.com/variation_${i}.jpg`,
                style: 'variation'
            });
        }

        return {
            originalImageId: originalImageId,
            variations: variations,
            count: count || 4
        };
    }

    async upscaleImage(params) {
        const { imageId, quality } = params;
        
        this.logger.info(`🔍 Upscaling image: ${imageId}`);
        
        if (this.status === 'mock-mode') {
            return this.mockUpscale(imageId, quality);
        }

        try {
            const response = await this.makeRequest({
                action: 'upscale',
                image_id: imageId,
                quality: quality || 'high'
            });

            return {
                originalImageId: imageId,
                upscaledUrl: response.upscaled_url,
                quality: quality || 'high',
                dimensions: response.dimensions
            };

        } catch (error) {
            this.logger.error('Image upscaling failed:', error);
            throw error;
        }
    }

    mockUpscale(imageId, quality) {
        return {
            originalImageId: imageId,
            upscaledUrl: `https://mock-midjourney.com/upscaled_${imageId}.jpg`,
            quality: quality || 'high',
            dimensions: { width: 2048, height: 2048 }
        };
    }

    async generateStyleGuide(params) {
        const { brandName, colors, typography, style } = params;
        
        this.logger.info(`📋 Generating style guide for: ${brandName}`);
        
        const styleGuide = {
            brandName: brandName,
            colors: colors || ['#007bff', '#28a745', '#dc3545', '#ffc107'],
            typography: typography || {
                primary: 'Inter',
                secondary: 'Roboto',
                heading: 'Poppins'
            },
            style: style || 'modern',
            components: await this.generateComponentExamples(params),
            timestamp: new Date().toISOString()
        };

        return styleGuide;
    }

    async generateComponentExamples(params) {
        const { style, colors } = params;
        
        const components = [
            'button',
            'input field',
            'card',
            'navigation',
            'modal',
            'table'
        ];

        const examples = {};
        
        for (const component of components) {
            const prompt = `Create a ${style || 'modern'} ${component} design using ${colors?.join(' and ') || 'blue and white'} colors. Clean, professional interface element.`;
            
            const design = await this.generateDesign({
                prompt: prompt,
                style: style || 'modern',
                dimensions: { width: 400, height: 200 },
                quality: 'standard'
            });

            examples[component] = {
                designUrl: design.designUrl,
                prompt: prompt
            };
        }

        return examples;
    }

    getStatus() {
        return this.status;
    }

    async healthCheck() {
        try {
            if (this.status === 'mock-mode') {
                return {
                    status: 'healthy',
                    agent: 'Midjourney',
                    mode: 'mock',
                    timestamp: new Date().toISOString()
                };
            }
            
            await this.testConnection();
            return {
                status: 'healthy',
                agent: 'Midjourney',
                mode: 'api',
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            return {
                status: 'unhealthy',
                agent: 'Midjourney',
                error: error.message,
                timestamp: new Date().toISOString()
            };
        }
    }
}

module.exports = MidjourneyAgent; 