#!/usr/bin/env python3
"""
EHB-5 Natural Language Processing Module
Handles text processing and language understanding
"""

import re
import string
from typing import List, Dict, Optional
from collections import Counter


class NaturalLanguageProcessor:
    """Natural language processing for EHB-5"""

    def __init__(self):
        self.stop_words = {
            'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
            'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
            'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
            'should', 'may', 'might', 'can', 'this', 'that', 'these', 'those'
        }

    def tokenize_text(self, text: str) -> List[str]:
        """Tokenize text into words"""
        # Remove punctuation and convert to lowercase
        text = re.sub(r'[^\w\s]', '', text.lower())
        # Split into words
        tokens = text.split()
        # Remove stop words
        tokens = [token for token in tokens if token not in self.stop_words]
        return tokens

    def extract_keywords(self, text: str, top_n: int = 10) -> List[str]:
        """Extract keywords from text"""
        tokens = self.tokenize_text(text)
        # Count word frequencies
        word_counts = Counter(tokens)
        # Return top N keywords
        return [word for word, count in word_counts.most_common(top_n)]

    def sentiment_analysis(self, text: str) -> Dict[str, float]:
        """Basic sentiment analysis"""
        positive_words = {
            'good', 'great', 'excellent', 'amazing', 'wonderful', 'fantastic',
            'perfect', 'awesome', 'brilliant', 'outstanding', 'superb'
        }
        negative_words = {
            'bad', 'terrible', 'awful', 'horrible', 'disgusting', 'terrible',
            'worst', 'disappointing', 'frustrating', 'annoying', 'useless'
        }

        tokens = self.tokenize_text(text)
        positive_count = sum(1 for token in tokens if token in positive_words)
        negative_count = sum(1 for token in tokens if token in negative_words)
        total_words = len(tokens)

        if total_words == 0:
            return {'positive': 0.0, 'negative': 0.0, 'neutral': 1.0}

        positive_score = positive_count / total_words
        negative_score = negative_count / total_words
        neutral_score = 1.0 - positive_score - negative_score

        return {
            'positive': positive_score,
            'negative': negative_score,
            'neutral': neutral_score
        }

    def extract_entities(self, text: str) -> Dict[str, List[str]]:
        """Extract named entities from text"""
        entities = {
            'emails': [],
            'urls': [],
            'dates': [],
            'numbers': []
        }

        # Extract emails
        email_pattern = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
        entities['emails'] = re.findall(email_pattern, text)

        # Extract URLs
        url_pattern = r'http[s]?://(?:[a-zA-Z]|[0-9]|[$-_@.&+]|[!*\\(\\),]|(?:%[0-9a-fA-F][0-9a-fA-F]))+'
        entities['urls'] = re.findall(url_pattern, text)

        # Extract dates
        date_pattern = r'\b\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\b'
        entities['dates'] = re.findall(date_pattern, text)

        # Extract numbers
        number_pattern = r'\b\d+(\.\d+)?\b'
        entities['numbers'] = re.findall(number_pattern, text)

        return entities

    def summarize_text(self, text: str, max_length: int = 100) -> str:
        """Create a simple text summary"""
        sentences = re.split(r'[.!?]+', text)
        sentences = [s.strip() for s in sentences if s.strip()]

        if not sentences:
            return ""

        # Simple summarization: take first sentence
        summary = sentences[0]

        if len(summary) > max_length:
            summary = summary[:max_length] + "..."

        return summary

    def detect_language(self, text: str) -> str:
        """Detect language of text (basic implementation)"""
        # Simple language detection based on common words
        english_words = {'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for'}
        spanish_words = {'el', 'la', 'de', 'que', 'y', 'en', 'un', 'es', 'se', 'no'}

        tokens = self.tokenize_text(text)
        english_count = sum(1 for token in tokens if token in english_words)
        spanish_count = sum(1 for token in tokens if token in spanish_words)

        if spanish_count > english_count:
            return 'Spanish'
        else:
            return 'English'

    def process_query(self, query: str) -> Dict[str, any]:
        """Process natural language query"""
        result = {
            'keywords': self.extract_keywords(query),
            'sentiment': self.sentiment_analysis(query),
            'entities': self.extract_entities(query),
            'language': self.detect_language(query),
            'summary': self.summarize_text(query)
        }

        return result


# Global NLP instance
nlp_processor = NaturalLanguageProcessor()


def analyze_text(text: str) -> Dict[str, any]:
    """Analyze text using NLP"""
    return nlp_processor.process_query(text)


def extract_keywords(text: str) -> List[str]:
    """Extract keywords from text"""
    return nlp_processor.extract_keywords(text)


def get_sentiment(text: str) -> Dict[str, float]:
    """Get sentiment analysis of text"""
    return nlp_processor.sentiment_analysis(text)
