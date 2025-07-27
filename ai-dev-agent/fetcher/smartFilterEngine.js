/**
 * EHB AI Dev Agent - Smart Filter Engine
 * Filters and ranks code based on quality criteria
 */

class SmartFilterEngine {
    constructor() {
        this.criteria = {
            codeCompatibility: { weight: 30, description: 'Framework compatibility' },
            repoPopularity: { weight: 20, description: 'GitHub stars, NPM downloads' },
            updateRecency: { weight: 15, description: 'Recent updates' },
            licenseSafety: { weight: 10, description: 'MIT/Apache vs GPL' },
            modularity: { weight: 10, description: 'Clean, reusable code' },
            logicQuality: { weight: 10, description: 'AI-assessed code quality' },
            testCoverage: { weight: 5, description: 'Test files presence' }
        };
    }

    /**
     * Main filter method
     */
    filterResults(results, projectContext) {
        console.log(`🔍 Smart Filter: Processing ${results.length} results`);
        
        // Apply filters
        const filtered = this.applyFilters(results, projectContext);
        
        // Calculate scores
        const scored = this.calculateScores(filtered, projectContext);
        
        // Rank results
        const ranked = this.rankResults(scored);
        
        // Select top candidates
        const topCandidates = this.selectTopCandidates(ranked);
        
        console.log(`✅ Smart Filter: Selected ${topCandidates.length} top candidates`);
        
        return topCandidates;
    }

    /**
     * Apply quality filters
     */
    applyFilters(results, projectContext) {
        return results.filter(result => {
            // License filter
            if (!this.checkLicenseSafety(result)) {
                return false;
            }
            
            // Framework compatibility
            if (!this.checkFrameworkCompatibility(result, projectContext.framework)) {
                return false;
            }
            
            // Basic quality checks
            if (!this.checkBasicQuality(result)) {
                return false;
            }
            
            return true;
        });
    }

    /**
     * Check license safety
     */
    checkLicenseSafety(result) {
        const safeLicenses = ['MIT', 'Apache-2.0', 'ISC', 'BSD-3-Clause'];
        const unsafeLicenses = ['GPL', 'AGPL', 'LGPL'];
        
        const license = result.license || '';
        
        // Check for unsafe licenses
        for (const unsafe of unsafeLicenses) {
            if (license.includes(unsafe)) {
                return false;
            }
        }
        
        // Prefer safe licenses
        for (const safe of safeLicenses) {
            if (license.includes(safe)) {
                return true;
            }
        }
        
        // If no license specified, assume safe
        return true;
    }

    /**
     * Check framework compatibility
     */
    checkFrameworkCompatibility(result, targetFramework) {
        const name = (result.name || '').toLowerCase();
        const description = (result.description || '').toLowerCase();
        
        if (targetFramework === 'react') {
            return name.includes('react') || 
                   description.includes('react') ||
                   name.includes('next') ||
                   description.includes('next');
        }
        
        if (targetFramework === 'vue') {
            return name.includes('vue') || description.includes('vue');
        }
        
        if (targetFramework === 'angular') {
            return name.includes('angular') || description.includes('angular');
        }
        
        return true;
    }

    /**
     * Check basic quality
     */
    checkBasicQuality(result) {
        // Check for minimum popularity
        if (result.source === 'github') {
            if (result.stars < 10) return false;
        }
        
        if (result.source === 'npm') {
            if (result.downloads < 100) return false;
        }
        
        // Check for recent updates
        const updated = new Date(result.updated);
        const daysSinceUpdate = (Date.now() - updated.getTime()) / (1000 * 60 * 60 * 24);
        
        if (daysSinceUpdate > 365) return false;
        
        return true;
    }

    /**
     * Calculate quality scores
     */
    calculateScores(filtered, projectContext) {
        return filtered.map(result => {
            let totalScore = 0;
            
            // Code Compatibility (30%)
            const compatibilityScore = this.calculateCompatibilityScore(result, projectContext);
            totalScore += compatibilityScore * this.criteria.codeCompatibility.weight / 100;
            
            // Repo Popularity (20%)
            const popularityScore = this.calculatePopularityScore(result);
            totalScore += popularityScore * this.criteria.repoPopularity.weight / 100;
            
            // Update Recency (15%)
            const recencyScore = this.calculateRecencyScore(result);
            totalScore += recencyScore * this.criteria.updateRecency.weight / 100;
            
            // License Safety (10%)
            const licenseScore = this.calculateLicenseScore(result);
            totalScore += licenseScore * this.criteria.licenseSafety.weight / 100;
            
            // Modularity (10%)
            const modularityScore = this.calculateModularityScore(result);
            totalScore += modularityScore * this.criteria.modularity.weight / 100;
            
            // Logic Quality (10%)
            const logicScore = this.calculateLogicQualityScore(result);
            totalScore += logicScore * this.criteria.logicQuality.weight / 100;
            
            // Test Coverage (5%)
            const testScore = this.calculateTestCoverageScore(result);
            totalScore += testScore * this.criteria.testCoverage.weight / 100;
            
            return {
                ...result,
                score: Math.round(totalScore),
                scoreBreakdown: {
                    compatibility: compatibilityScore,
                    popularity: popularityScore,
                    recency: recencyScore,
                    license: licenseScore,
                    modularity: modularityScore,
                    logic: logicScore,
                    test: testScore
                }
            };
        });
    }

    /**
     * Calculate compatibility score
     */
    calculateCompatibilityScore(result, projectContext) {
        let score = 50; // Base score
        
        const name = (result.name || '').toLowerCase();
        const description = (result.description || '').toLowerCase();
        
        if (projectContext.framework === 'react') {
            if (name.includes('react') || description.includes('react')) score += 30;
            if (name.includes('next') || description.includes('next')) score += 20;
            if (name.includes('typescript') || description.includes('typescript')) score += 10;
        }
        
        return Math.min(score, 100);
    }

    /**
     * Calculate popularity score
     */
    calculatePopularityScore(result) {
        if (result.source === 'github') {
            const stars = result.stars || 0;
            return Math.min(stars / 100, 100);
        }
        
        if (result.source === 'npm') {
            const downloads = result.downloads || 0;
            return Math.min(downloads / 1000, 100);
        }
        
        return 50; // Default score
    }

    /**
     * Calculate recency score
     */
    calculateRecencyScore(result) {
        const updated = new Date(result.updated);
        const daysSinceUpdate = (Date.now() - updated.getTime()) / (1000 * 60 * 60 * 24);
        
        if (daysSinceUpdate < 30) return 100;
        if (daysSinceUpdate < 90) return 80;
        if (daysSinceUpdate < 180) return 60;
        if (daysSinceUpdate < 365) return 40;
        
        return 20;
    }

    /**
     * Calculate license score
     */
    calculateLicenseScore(result) {
        const license = (result.license || '').toLowerCase();
        
        if (license.includes('mit')) return 100;
        if (license.includes('apache')) return 90;
        if (license.includes('isc')) return 85;
        if (license.includes('bsd')) return 80;
        
        return 50; // Unknown license
    }

    /**
     * Calculate modularity score
     */
    calculateModularityScore(result) {
        let score = 50; // Base score
        
        const description = (result.description || '').toLowerCase();
        
        // Check for modular keywords
        const modularKeywords = ['component', 'module', 'reusable', 'modular', 'plugin'];
        for (const keyword of modularKeywords) {
            if (description.includes(keyword)) {
                score += 10;
            }
        }
        
        return Math.min(score, 100);
    }

    /**
     * Calculate logic quality score (AI assessment simulation)
     */
    calculateLogicQualityScore(result) {
        let score = 70; // Base score
        
        const description = (result.description || '').toLowerCase();
        
        // Positive indicators
        if (description.includes('clean')) score += 10;
        if (description.includes('simple')) score += 5;
        if (description.includes('efficient')) score += 10;
        if (description.includes('optimized')) score += 10;
        
        // Negative indicators
        if (description.includes('complex')) score -= 5;
        if (description.includes('hack')) score -= 10;
        
        return Math.max(0, Math.min(score, 100));
    }

    /**
     * Calculate test coverage score
     */
    calculateTestCoverageScore(result) {
        let score = 30; // Base score (assuming no tests)
        
        const description = (result.description || '').toLowerCase();
        const name = (result.name || '').toLowerCase();
        
        // Check for test indicators
        if (description.includes('test') || description.includes('spec')) score += 30;
        if (description.includes('coverage')) score += 20;
        if (name.includes('test') || name.includes('spec')) score += 20;
        
        return Math.min(score, 100);
    }

    /**
     * Rank results by score
     */
    rankResults(scored) {
        return scored.sort((a, b) => b.score - a.score);
    }

    /**
     * Select top candidates
     */
    selectTopCandidates(ranked, limit = 3) {
        return ranked.slice(0, limit);
    }

    /**
     * Get filter statistics
     */
    getFilterStats(originalCount, filteredCount) {
        return {
            original: originalCount,
            filtered: filteredCount,
            removed: originalCount - filteredCount,
            retentionRate: Math.round((filteredCount / originalCount) * 100)
        };
    }

    /**
     * Update filter criteria weights
     */
    updateCriteriaWeights(newWeights) {
        for (const [criterion, weight] of Object.entries(newWeights)) {
            if (this.criteria[criterion]) {
                this.criteria[criterion].weight = weight;
            }
        }
    }

    /**
     * Get current filter criteria
     */
    getCriteria() {
        return this.criteria;
    }
}

module.exports = SmartFilterEngine; 