import json
import os
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional

#!/usr/bin/env python3
"""
EHB Company Information Agent

This agent handles all EHB company information files and provides
comprehensive management capabilities for the cursor agent.
"""


# Optional yaml import
try:

    YAML_AVAILABLE = True
except ImportError:
    YAML_AVAILABLE = False


@dataclass
class BrandColors:
    """EHB brand colors"""

    primary_blue: str = "#2563EB"
    healthcare_green: str = "#10B981"
    professional_gray: str = "#6B7280"
    success_green: str = "#22C55E"
    error_red: str = "#EF4444"
    light_blue: str = "#DBEAFE"
    warning_orange: str = "#F59E0B"
    white: str = "#FFFFFF"
    light_gray: str = "#F9FAFB"
    dark_gray: str = "#1F2937"


@dataclass
class TechnologyStack:
    """EHB technology stack"""

    frontend: Optional[List[str]] = None
    backend: Optional[List[str]] = None
    database: Optional[List[str]] = None
    cloud: Optional[List[str]] = None
    mobile: Optional[List[str]] = None
    ai: Optional[List[str]] = None

    def __post_init__(self):
        if self.frontend is None:
            self.frontend = ["React.js", "Angular", "Vue.js"]
        if self.backend is None:
            self.backend = ["Node.js", "Python", "Java"]
        if self.database is None:
            self.database = ["PostgreSQL", "MongoDB", "MySQL"]
        if self.cloud is None:
            self.cloud = ["AWS", "Azure", "Google Cloud"]
        if self.mobile is None:
            self.mobile = ["React Native", "Flutter"]
        if self.ai is None:
            self.ai = ["TensorFlow", "PyTorch", "Scikit-learn"]


@dataclass
class HealthcareStandards:
    """Healthcare industry standards"""

    data_interoperability: str = "HL7 FHIR"
    disease_classification: str = "ICD-10"
    procedure_codes: str = "CPT codes"
    lab_observations: str = "LOINC"
    clinical_terminology: str = "SNOMED CT"


class EHBCompanyAgent:
    """
    EHB Company Information Agent

    This agent manages all EHB company information and provides
    comprehensive functionality for development guidance.
    """

    def __init__(self, base_path: str = "."):
        self.base_path = Path(base_path)
        self.company_info_path = self.base_path / "company-info"
        self.dev_guidelines_path = self.base_path / "development-guidelines"
        self.project_docs_path = self.base_path / "project-docs"
        self.assets_path = self.base_path / "assets"

        # Initialize brand colors
        self.brand_colors = BrandColors()

        # Initialize technology stack
        self.tech_stack = TechnologyStack()

        # Initialize healthcare standards
        self.healthcare_standards = HealthcareStandards()

        # File structure mapping
        self.file_structure = {
            "company-info": {
                "index.md": "Complete company information index",
                "company-profile.md": "Company mission, vision, and values",
                "brand-guidelines.md": "Design standards and brand colors",
                "team-structure.md": "Organizational structure and roles",
                "contact-info.md": "Contact details and communication guidelines",
            },
            "development-guidelines": {
                "standards.md": "Coding standards and best practices"
            },
            "project-docs": {"requirements.md": "Healthcare project requirements"},
        }

        # Performance standards
        self.performance_standards = {
            "frontend": {
                "load_time": 3000,  # milliseconds
                "bundle_size": 500000,  # bytes
                "image_optimization": "WebP format, lazy loading",
            },
            "backend": {
                "response_time": 200,  # milliseconds
                "database_queries": "Optimized with proper indexing",
                "caching": "Redis for frequently accessed data",
            },
        }

        # Security requirements
        self.security_requirements = [
            "encryption",
            "access_controls",
            "audit_logging",
            "data_retention",
            "breach_notification",
        ]

        # Accessibility requirements
        self.accessibility_requirements = [
            "high_contrast",
            "keyboard_navigation",
            "screen_reader_support",
            "focus_indicators",
            "alt_text",
        ]

    def get_company_info(self, category: str) -> str:
        """
        Get company information by category

        Args:
            category: Category of information to retrieve

        Returns:
            Company information for the specified category
        """
        categories = {
            "profile": "company-info/company-profile.md",
            "brand": "company-info/brand-guidelines.md",
            "team": "company-info/team-structure.md",
            "contact": "company-info/contact-info.md",
            "standards": "development-guidelines/standards.md",
            "requirements": "project-docs/requirements.md",
            "index": "company-info/index.md",
        }

        file_path = categories.get(category, categories["index"])
        return self.read_file(file_path)

    def get_brand_info(self) -> Dict[str, Any]:
        """
        Get brand colors and design standards

        Returns:
            Brand colors and design information
        """
        return {
            "colors": {
                "primary_blue": self.brand_colors.primary_blue,
                "healthcare_green": self.brand_colors.healthcare_green,
                "professional_gray": self.brand_colors.professional_gray,
                "success_green": self.brand_colors.success_green,
                "error_red": self.brand_colors.error_red,
                "light_blue": self.brand_colors.light_blue,
                "warning_orange": self.brand_colors.warning_orange,
                "white": self.brand_colors.white,
                "light_gray": self.brand_colors.light_gray,
                "dark_gray": self.brand_colors.dark_gray,
            },
            "typography": {
                "font_family": 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                "heading_weight": "600-700",
                "body_weight": "400-500",
                "sizes": {
                    "h1": "2.25rem (36px)",
                    "h2": "1.875rem (30px)",
                    "h3": "1.5rem (24px)",
                    "h4": "1.25rem (20px)",
                    "body": "1rem (16px)",
                    "small": "0.875rem (14px)",
                },
            },
            "design_principles": {
                "healthcare_focused": "Clean, professional appearance",
                "accessibility": "High contrast for accessibility",
                "information_hierarchy": "Clear information hierarchy",
                "trustworthy": "Trustworthy and reliable feel",
            },
        }

    def get_development_standards(self) -> Dict[str, Any]:
        """
        Get development standards and guidelines

        Returns:
            Development standards and best practices
        """
        return {
            "code_quality": {
                "readability": "Code should be self-documenting",
                "maintainability": "Easy to modify and extend",
                "performance": "Optimized for healthcare applications",
                "security": "HIPAA-compliant security measures",
                "testing": "Comprehensive test coverage",
            },
            "file_structure": {
                "src": {
                    "components": "Reusable UI components",
                    "pages": "Page components",
                    "services": "Business logic and API calls",
                    "utils": "Helper functions",
                    "types": "TypeScript type definitions",
                    "hooks": "Custom React hooks",
                    "constants": "Application constants",
                    "assets": "Images, icons, etc.",
                }
            },
            "performance_standards": self.performance_standards,
        }

    def get_healthcare_requirements(self) -> Dict[str, Any]:
        """
        Get healthcare-specific requirements

        Returns:
            Healthcare requirements and standards
        """
        return {
            "compliance": {
                "hipaa": "Full HIPAA compliance required",
                "data_privacy": "GDPR compliance for international users",
                "audit_trails": "Complete audit logging",
                "data_retention": "Proper data retention policies",
                "breach_notification": "Incident response procedures",
            },
            "medical_data_standards": {
                "data_interoperability": self.healthcare_standards.data_interoperability,
                "disease_classification": self.healthcare_standards.disease_classification,
                "procedure_codes": self.healthcare_standards.procedure_codes,
                "lab_observations": self.healthcare_standards.lab_observations,
                "clinical_terminology": self.healthcare_standards.clinical_terminology,
            },
            "user_experience": {
                "accessibility": "WCAG 2.1 AA compliance",
                "mobile_responsive": "Works on all devices",
                "intuitive_design": "Easy to use for healthcare professionals",
                "error_prevention": "Clear validation and error messages",
                "loading_states": "Clear loading indicators",
            },
            "security": {
                "encryption": "AES-256 encryption for data at rest",
                "https": "SSL/TLS for all communications",
                "authentication": "Multi-factor authentication",
                "authorization": "Role-based access control",
                "audit_logging": "Comprehensive audit trails",
                "data_masking": "PII protection in logs",
            },
        }

    def get_technology_stack(self) -> Dict[str, Any]:
        """
        Get technology stack information

        Returns:
            Technology stack details
        """
        return {
            "frontend": self.tech_stack.frontend,
            "backend": self.tech_stack.backend,
            "database": self.tech_stack.database,
            "cloud": self.tech_stack.cloud,
            "mobile": self.tech_stack.mobile,
            "ai": self.tech_stack.ai,
            "healthcare_standards": {
                "data_interoperability": self.healthcare_standards.data_interoperability,
                "disease_classification": self.healthcare_standards.disease_classification,
                "procedure_codes": self.healthcare_standards.procedure_codes,
                "lab_observations": self.healthcare_standards.lab_observations,
                "clinical_terminology": self.healthcare_standards.clinical_terminology,
            },
        }

    def validate_development(self, development_info: Dict[str, Any]) -> Dict[str, Any]:
        """
        Validate development against EHB standards

        Args:
            development_info: Information about the development

        Returns:
            Validation results and recommendations
        """
        validation = {
            "is_valid": True,
            "issues": [],
            "recommendations": [],
            "compliance": {
                "hipaa": False,
                "accessibility": False,
                "performance": False,
                "security": False,
            },
        }

        # Check HIPAA compliance
        if development_info.get("involves_patient_data", False):
            validation["compliance"]["hipaa"] = self._check_hipaa_compliance(
                development_info
            )
            if not validation["compliance"]["hipaa"]:
                validation["is_valid"] = False
                validation["issues"].append("HIPAA compliance requirements not met")
                validation["recommendations"].append(
                    "Implement encryption, access controls, and audit logging"
                )

        # Check accessibility
        if development_info.get("has_ui", False):
            validation["compliance"]["accessibility"] = self._check_accessibility(
                development_info
            )
            if not validation["compliance"]["accessibility"]:
                validation["issues"].append("Accessibility standards not met")
                validation["recommendations"].append(
                    "Ensure WCAG 2.1 AA compliance with high contrast and keyboard navigation"
                )

        # Check performance
        validation["compliance"]["performance"] = self._check_performance(
            development_info
        )
        if not validation["compliance"]["performance"]:
            validation["issues"].append("Performance standards not met")
            validation["recommendations"].append(
                "Optimize for < 3 seconds load time and < 200ms API responses"
            )

        # Check security
        validation["compliance"]["security"] = self._check_security(development_info)
        if not validation["compliance"]["security"]:
            validation["is_valid"] = False
            validation["issues"].append("Security requirements not met")
            validation["recommendations"].append(
                "Implement proper authentication, authorization, and data encryption"
            )

        return validation

    def get_development_recommendations(self, project_type: str) -> Dict[str, Any]:
        """
        Generate development recommendations

        Args:
            project_type: Type of healthcare project

        Returns:
            Specific recommendations for the project
        """
        recommendations = {
            "patient_management": {
                "technology": "React.js + Node.js + PostgreSQL",
                "features": [
                    "Patient registration",
                    "Medical history tracking",
                    "Appointment scheduling",
                ],
                "compliance": ["HIPAA compliance", "Data encryption", "Audit logging"],
                "testing": [
                    "Medical data validation",
                    "Security testing",
                    "Accessibility testing",
                ],
            },
            "ehr_system": {
                "technology": "React.js + Python/FastAPI + PostgreSQL",
                "features": [
                    "Data entry interfaces",
                    "HL7 FHIR integration",
                    "Audit trails",
                ],
                "compliance": [
                    "Full HIPAA compliance",
                    "Data interoperability",
                    "Backup systems",
                ],
                "testing": [
                    "Interoperability testing",
                    "Compliance verification",
                    "Performance testing",
                ],
            },
            "telemedicine": {
                "technology": "React.js + Node.js + WebRTC",
                "features": [
                    "Video conferencing",
                    "Screen sharing",
                    "Prescription management",
                ],
                "compliance": [
                    "Secure video calls",
                    "Data privacy",
                    "Payment processing",
                ],
                "testing": [
                    "Video quality testing",
                    "Security testing",
                    "Mobile testing",
                ],
            },
            "healthcare_analytics": {
                "technology": "React.js + Python + PostgreSQL + Redis",
                "features": [
                    "Real-time dashboards",
                    "Predictive analytics",
                    "Data visualization",
                ],
                "compliance": [
                    "Data anonymization",
                    "Access controls",
                    "Audit logging",
                ],
                "testing": [
                    "Data accuracy testing",
                    "Performance testing",
                    "Visualization testing",
                ],
            },
        }

        return recommendations.get(project_type, recommendations["patient_management"])

    def update_company_info(self, file_path: str, content: str) -> bool:
        """
        Update company information

        Args:
            file_path: Path to the file to update
            content: New content for the file

        Returns:
            Success status
        """
        try:
            full_path = self.base_path / file_path
            full_path.parent.mkdir(parents=True, exist_ok=True)
            full_path.write_text(content, encoding="utf-8")
            return True
        except Exception as e:
            print(f"Error updating company info: {e}")
            return False

    def read_file(self, file_path: str) -> str:
        """
        Read file content

        Args:
            file_path: Path to the file

        Returns:
            File content
        """
        try:
            full_path = self.base_path / file_path
            return full_path.read_text(encoding="utf-8")
        except Exception as e:
            print(f"Error reading file {file_path}: {e}")
            return ""

    def _check_hipaa_compliance(self, development_info: Dict[str, Any]) -> bool:
        """
        Check HIPAA compliance

        Args:
            development_info: Development information

        Returns:
            HIPAA compliance status
        """
        features = development_info.get("features", [])
        return all(feature in features for feature in self.security_requirements)

    def _check_accessibility(self, development_info: Dict[str, Any]) -> bool:
        """
        Check accessibility compliance

        Args:
            development_info: Development information

        Returns:
            Accessibility compliance status
        """
        accessibility_features = development_info.get("accessibility", [])
        return all(
            feature in accessibility_features
            for feature in self.accessibility_requirements
        )

    def _check_performance(self, development_info: Dict[str, Any]) -> bool:
        """
        Check performance standards

        Args:
            development_info: Development information

        Returns:
            Performance compliance status
        """
        performance_standards = {
            "frontend_load_time": development_info.get("frontend_load_time", 0)
            <= self.performance_standards["frontend"]["load_time"],
            "api_response_time": development_info.get("api_response_time", 0)
            <= self.performance_standards["backend"]["response_time"],
            "bundle_size": development_info.get("bundle_size", 0)
            <= self.performance_standards["frontend"]["bundle_size"],
        }
        return all(performance_standards.values())

    def _check_security(self, development_info: Dict[str, Any]) -> bool:
        """
        Check security requirements

        Args:
            development_info: Development information

        Returns:
            Security compliance status
        """
        security_features = development_info.get("security", [])
        required_features = [
            "authentication",
            "authorization",
            "encryption",
            "data_masking",
            "secure_communication",
        ]
        return all(feature in security_features for feature in required_features)

    def get_emergency_contacts(self) -> Dict[str, str]:
        """
        Get emergency contacts

        Returns:
            Emergency contact information
        """
        return {
            "security": "security@ehb.com",
            "privacy": "privacy@ehb.com",
            "emergency_tech": "emergency-tech@ehb.com",
            "safety": "safety@ehb.com",
            "clinical_support": "clinical-support@ehb.com",
            "compliance": "compliance@ehb.com",
        }

    def get_response_time_standards(self) -> Dict[str, str]:
        """
        Get response time standards

        Returns:
            Response time standards
        """
        return {
            "urgent": "< 1 hour",
            "high_priority": "< 4 hours",
            "normal_priority": "< 24 hours",
            "low_priority": "< 48 hours",
        }

    def export_config(self, format_type: str = "json") -> str:
        """
        Export agent configuration

        Args:
            format_type: Export format (json, yaml)

        Returns:
            Configuration in specified format
        """
        config = {
            "brand_colors": self.get_brand_info()["colors"],
            "technology_stack": self.get_technology_stack(),
            "healthcare_standards": self.get_healthcare_requirements(),
            "performance_standards": self.performance_standards,
            "emergency_contacts": self.get_emergency_contacts(),
            "response_time_standards": self.get_response_time_standards(),
        }

        if format_type.lower() == "yaml":
            if not YAML_AVAILABLE:
                return "YAML export not available. Install PyYAML: pip install PyYAML"
            return yaml.dump(config, default_flow_style=False)
        else:
            return json.dumps(config, indent=2)


def main():
    """Main function for testing the agent"""
    agent = EHBCompanyAgent()

    print("EHB Company Agent initialized")
    print(f"Brand Colors: {agent.get_brand_info()['colors']}")
    print(f"Technology Stack: {agent.get_technology_stack()}")
    print(f"Emergency Contacts: {agent.get_emergency_contacts()}")

    # Example validation
    development_info = {
        "involves_patient_data": True,
        "has_ui": True,
        "features": ["encryption", "access_controls", "audit_logging"],
        "accessibility": ["high_contrast", "keyboard_navigation"],
        "frontend_load_time": 2500,
        "api_response_time": 150,
        "bundle_size": 400000,
        "security": ["authentication", "authorization", "encryption"],
    }

    validation = agent.validate_development(development_info)
    print(f"Validation Results: {validation}")


if __name__ == "__main__":
    main()
