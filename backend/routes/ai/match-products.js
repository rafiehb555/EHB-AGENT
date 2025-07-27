const express = require('express');
const router = express.Router();
const Product = require('../../models/Product');
const Seller = require('../../models/Seller');
const LocationAgent = require('../../agents/LocationAgent');
const SearchAgent = require('../../agents/SearchAgent');
const SQLRankAgent = require('../../agents/SQLRankAgent');

// POST: AI-based product matching
router.post('/match-products', async (req, res) => {
  try {
    const {
      buyerLocation,
      searchQuery,
      category,
      sqlLevel,
      maxPrice,
      language = 'en',
      currency = 'PKR'
    } = req.body;

    if (!buyerLocation) {
      return res.status(400).json({
        success: false,
        message: 'Buyer location is required'
      });
    }

    // Initialize AI agents
    const locationAgent = new LocationAgent();
    const searchAgent = new SearchAgent();
    const sqlRankAgent = new SQLRankAgent();

    // Step 1: Find nearby sellers
    const nearbySellers = await locationAgent.findNearbySellers(buyerLocation, 50); // 50km radius

    // Step 2: Search for products
    let products = await searchAgent.searchProducts({
      query: searchQuery,
      category,
      sqlLevel,
      maxPrice,
      sellerIds: nearbySellers.map(s => s.id)
    });

    // Step 3: Rank products using AI
    const rankedProducts = await sqlRankAgent.rankProducts(products, {
      buyerLocation,
      preferredSQLLevel: sqlLevel,
      maxPrice,
      language,
      currency
    });

    // Step 4: Apply smart filters
    const filteredProducts = rankedProducts.filter(product => {
      // Filter by stock availability
      if (!product.inStock) return false;

      // Filter by price
      if (maxPrice && product.price > maxPrice) return false;

      // Filter by SQL level if specified
      if (sqlLevel && product.sqlLevel !== sqlLevel) return false;

      return true;
    });

    // Step 5: Add AI recommendations
    const recommendations = await generateRecommendations(filteredProducts, buyerLocation);

    res.json({
      success: true,
      data: {
        products: filteredProducts.slice(0, 20), // Limit to top 20
        recommendations,
        totalFound: filteredProducts.length,
        searchMetrics: {
          nearbySellers: nearbySellers.length,
          searchRadius: '50km',
          rankingFactors: ['proximity', 'sql_level', 'rating', 'price', 'availability']
        }
      }
    });

  } catch (error) {
    console.error('AI product matching error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// POST: Get personalized recommendations
router.post('/recommendations', async (req, res) => {
  try {
    const {
      userId,
      buyerLocation,
      recentSearches = [],
      purchaseHistory = [],
      preferences = {}
    } = req.body;

    // Analyze user behavior
    const userProfile = await analyzeUserBehavior(userId, recentSearches, purchaseHistory);

    // Generate personalized recommendations
    const recommendations = await generatePersonalizedRecommendations(
      userProfile,
      buyerLocation,
      preferences
    );

    res.json({
      success: true,
      data: {
        recommendations,
        userProfile,
        reasoning: 'Based on your search history and preferences'
      }
    });

  } catch (error) {
    console.error('Recommendations error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// POST: Smart search with AI suggestions
router.post('/smart-search', async (req, res) => {
  try {
    const { query, location, category, filters = {} } = req.body;

    // Use AI to understand search intent
    const searchIntent = await analyzeSearchIntent(query);

    // Generate search suggestions
    const suggestions = await generateSearchSuggestions(query, searchIntent);

    // Perform intelligent search
    const searchResults = await performIntelligentSearch(query, {
      location,
      category,
      intent: searchIntent,
      filters
    });

    res.json({
      success: true,
      data: {
        results: searchResults,
        suggestions,
        searchIntent,
        relatedSearches: await generateRelatedSearches(query)
      }
    });

  } catch (error) {
    console.error('Smart search error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Helper function to generate recommendations
async function generateRecommendations(products, buyerLocation) {
  const recommendations = {
    topRated: products.filter(p => p.seller.rating >= 4.5).slice(0, 5),
    bestValue: products.sort((a, b) => (a.price / a.quality) - (b.price / b.quality)).slice(0, 5),
    nearby: products.sort((a, b) => calculateDistance(a.location, buyerLocation) - calculateDistance(b.location, buyerLocation)).slice(0, 5),
    trending: products.filter(p => p.views > 100).slice(0, 5)
  };

  return recommendations;
}

// Helper function to analyze user behavior
async function analyzeUserBehavior(userId, recentSearches, purchaseHistory) {
  const profile = {
    preferredCategories: [],
    preferredPriceRange: { min: 0, max: 0 },
    preferredSQLLevel: 'normal',
    preferredLocations: [],
    searchPatterns: []
  };

  // Analyze recent searches
  if (recentSearches.length > 0) {
    const categories = recentSearches.map(s => s.category).filter(Boolean);
    profile.preferredCategories = [...new Set(categories)];

    const prices = recentSearches.map(s => s.maxPrice).filter(Boolean);
    if (prices.length > 0) {
      profile.preferredPriceRange = {
        min: Math.min(...prices),
        max: Math.max(...prices)
      };
    }
  }

  // Analyze purchase history
  if (purchaseHistory.length > 0) {
    const purchasedCategories = purchaseHistory.map(p => p.category);
    profile.preferredCategories = [...new Set([...profile.preferredCategories, ...purchasedCategories])];

    const purchasedPrices = purchaseHistory.map(p => p.price);
    if (purchasedPrices.length > 0) {
      profile.preferredPriceRange = {
        min: Math.min(...purchasedPrices),
        max: Math.max(...purchasedPrices)
      };
    }
  }

  return profile;
}

// Helper function to generate personalized recommendations
async function generatePersonalizedRecommendations(userProfile, buyerLocation, preferences) {
  const recommendations = {
    basedOnHistory: [],
    basedOnLocation: [],
    basedOnPreferences: [],
    trending: []
  };

  // Get products based on user history
  if (userProfile.preferredCategories.length > 0) {
    recommendations.basedOnHistory = await Product.find({
      category: { $in: userProfile.preferredCategories },
      price: {
        $gte: userProfile.preferredPriceRange.min,
        $lte: userProfile.preferredPriceRange.max
      },
      inStock: true
    }).limit(5);
  }

  // Get nearby products
  recommendations.basedOnLocation = await Product.find({
    location: { $near: buyerLocation },
    inStock: true
  }).limit(5);

  // Get products based on preferences
  if (preferences.sqlLevel) {
    recommendations.basedOnPreferences = await Product.find({
      sqlLevel: preferences.sqlLevel,
      inStock: true
    }).limit(5);
  }

  return recommendations;
}

// Helper function to analyze search intent
async function analyzeSearchIntent(query) {
  const intent = {
    type: 'general',
    category: null,
    urgency: 'normal',
    budget: 'any'
  };

  // Analyze query for category
  const categoryKeywords = {
    electronics: ['phone', 'laptop', 'computer', 'electronic'],
    fashion: ['shirt', 'dress', 'shoes', 'clothing'],
    home: ['furniture', 'kitchen', 'garden', 'home'],
    sports: ['sports', 'fitness', 'gym', 'exercise']
  };

  for (const [category, keywords] of Object.entries(categoryKeywords)) {
    if (keywords.some(keyword => query.toLowerCase().includes(keyword))) {
      intent.category = category;
      break;
    }
  }

  // Analyze urgency
  if (query.toLowerCase().includes('urgent') || query.toLowerCase().includes('asap')) {
    intent.urgency = 'high';
  }

  // Analyze budget
  if (query.toLowerCase().includes('cheap') || query.toLowerCase().includes('budget')) {
    intent.budget = 'low';
  } else if (query.toLowerCase().includes('premium') || query.toLowerCase().includes('expensive')) {
    intent.budget = 'high';
  }

  return intent;
}

// Helper function to generate search suggestions
async function generateSearchSuggestions(query, searchIntent) {
  const suggestions = [];

  // Add category-based suggestions
  if (searchIntent.category) {
    suggestions.push(`${searchIntent.category} near me`);
    suggestions.push(`best ${searchIntent.category}`);
    suggestions.push(`cheap ${searchIntent.category}`);
  }

  // Add general suggestions
  suggestions.push(`${query} delivery`);
  suggestions.push(`${query} verified seller`);
  suggestions.push(`${query} in stock`);

  return suggestions.slice(0, 5);
}

// Helper function to perform intelligent search
async function performIntelligentSearch(query, options) {
  const { location, category, intent, filters } = options;

  let searchQuery = {
    $or: [
      { name: { $regex: query, $options: 'i' } },
      { description: { $regex: query, $options: 'i' } },
      { tags: { $in: [new RegExp(query, 'i')] } }
    ],
    inStock: true
  };

  // Add category filter
  if (category) {
    searchQuery.category = category;
  }

  // Add location filter
  if (location) {
    searchQuery.location = { $near: location };
  }

  // Add price filter based on intent
  if (intent.budget === 'low') {
    searchQuery.price = { $lte: 1000 };
  } else if (intent.budget === 'high') {
    searchQuery.price = { $gte: 5000 };
  }

  const products = await Product.find(searchQuery)
    .populate('seller')
    .sort({ rating: -1, price: 1 })
    .limit(20);

  return products;
}

// Helper function to generate related searches
async function generateRelatedSearches(query) {
  const related = [
    `${query} online`,
    `${query} near me`,
    `best ${query}`,
    `cheap ${query}`,
    `${query} delivery`
  ];

  return related;
}

// Helper function to calculate distance
function calculateDistance(location1, location2) {
  // Simple distance calculation (in production, use proper geolocation)
  return Math.random() * 100;
}

module.exports = router;
