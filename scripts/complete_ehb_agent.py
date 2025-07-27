import json
import logging
import os
import shutil
import subprocess
import sys
from dataclasses import asdict, dataclass
from datetime import datetime, timedelta
from pathlib import Path
from typing import Any, Dict, List, Optional

#!/usr/bin/env python3
"""
Complete EHB Company Agent

This is a comprehensive agent that provides everything for EHB company management:
- File management and updates
- Development validation and recommendations
- Automation and integration
- Reporting and analytics
- Team collaboration tools
- Project management integration
"""


# Optional imports
try:
    import yaml
    YAML_AVAILABLE = True
except ImportError:
    YAML_AVAILABLE = False

try:
    import requests
    REQUESTS_AVAILABLE = True
except ImportError:
    REQUESTS_AVAILABLE = False

try:
    import git
    GIT_AVAILABLE = True
except ImportError:
    GIT_AVAILABLE = False


@dataclass
class ProjectInfo:
    """Project information structure"""

    name: str
    type: str
    description: str
    technology_stack: List[str]
    team_members: List[str]
    start_date: str
    end_date: Optional[str] = None
    status: str = "planning"
    priority: str = "medium"
    budget: Optional[float] = None
    compliance_requirements: List[str] = None
    security_requirements: List[str] = None
    performance_targets: Dict[str, Any] = None

    def __post_init__(self):
        if self.compliance_requirements is None:
            self.compliance_requirements = ["HIPAA"]
        if self.security_requirements is None:
            self.security_requirements = [
                "encryption",
                "authentication",
                "authorization",
            ]
        if self.performance_targets is None:
            self.performance_targets = {
                "frontend_load_time": 3000,
                "api_response_time": 200,
                "bundle_size": 500000,
            }


@dataclass
class DevelopmentMetrics:
    """Development metrics tracking"""

    project_name: str
    date: str
    code_coverage: float
    performance_score: float
    security_score: float
    accessibility_score: float
    compliance_score: float
    total_issues: int
    resolved_issues: int
    team_velocity: float


class CompleteEHBAgent:
    """
    Complete EHB Company Agent

    This agent provides comprehensive functionality for:
    - Company information management
    - Development validation and recommendations
    - Project management and tracking
    - Team collaboration
    - Automation and integration
    - Reporting and analytics
    """

    def __init__(self, base_path: str = ".", config_file: Optional[str] = None):
        self.base_path = Path(base_path)
        self.config_file = config_file or "ehb_agent_config.json"
        self.log_file = self.base_path / "logs" / "ehb_agent.log"

        # Create necessary directories
        self._create_directories()

        # Setup logging
        self._setup_logging()

        # Load configuration
        self.config = self._load_config()

        # Initialize components
        self.projects: Dict[str, ProjectInfo] = {}
        self.metrics: List[DevelopmentMetrics] = []
        self.backup_dir = self.base_path / "backups"
        self.reports_dir = self.base_path / "reports"

        # Load existing data
        self._load_projects()
        self._load_metrics()

        # Initialize file watchers
        self.file_watchers = {}
        self._setup_file_watchers()

    def _create_directories(self):
        """Create necessary directories"""
        directories = ["logs", "backups", "reports", "templates", "exports", "temp"]

        for directory in directories:
            (self.base_path / directory).mkdir(exist_ok=True)

    def _setup_logging(self):
        """Setup logging configuration"""
        logging.basicConfig(
            level=logging.INFO,
            format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
            handlers=[
                logging.FileHandler(self.log_file),
                logging.StreamHandler(sys.stdout),
            ],
        )
        self.logger = logging.getLogger("EHBCompleteAgent")

    def _load_config(self) -> Dict[str, Any]:
        """Load configuration file"""
        config_path = self.base_path / self.config_file

        if config_path.exists():
            try:
                with open(config_path, "r") as f:
                    return json.load(f)
            except Exception as e:
                self.logger.error(f"Error loading config: {e}")

        # Default configuration
        return {
            "company_name": "EHB",
            "backup_frequency": "daily",
            "auto_validation": True,
            "performance_thresholds": {
                "frontend_load_time": 3000,
                "api_response_time": 200,
                "bundle_size": 500000,
            },
            "compliance_requirements": ["HIPAA", "GDPR", "WCAG_2.1_AA"],
            "notification_emails": [],
            "integrations": {
                "git": True,
                "slack": False,
                "jira": False,
                "email": False,
            },
        }

    def _load_projects(self):
        """Load existing projects"""
        projects_file = self.base_path / "data" / "projects.json"
        if projects_file.exists():
            try:
                with open(projects_file, "r") as f:
                    projects_data = json.load(f)
                    for project_id, project_data in projects_data.items():
                        self.projects[project_id] = ProjectInfo(**project_data)
            except Exception as e:
                self.logger.error(f"Error loading projects: {e}")

    def _load_metrics(self):
        """Load existing metrics"""
        metrics_file = self.base_path / "data" / "metrics.json"
        if metrics_file.exists():
            try:
                with open(metrics_file, "r") as f:
                    metrics_data = json.load(f)
                    for metric_data in metrics_data:
                        self.metrics.append(DevelopmentMetrics(**metric_data))
            except Exception as e:
                self.logger.error(f"Error loading metrics: {e}")

    def _setup_file_watchers(self):
        """Setup file watchers for automatic updates"""
        # This would integrate with file system watchers
        # For now, we'll implement manual checking
        pass

    # ==================== COMPANY INFORMATION MANAGEMENT ====================

    def get_company_info(self, category: str) -> str:
        """Get company information by category"""
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
        return self._read_file(file_path)

    def update_company_info(
        self, file_path: str, content: str, backup: bool = True
    ) -> bool:
        """Update company information with backup"""
        try:
            full_path = self.base_path / file_path

            # Create backup if requested
            if backup:
                self._create_backup(file_path)

            # Ensure directory exists
            full_path.parent.mkdir(parents=True, exist_ok=True)

            # Write new content
            full_path.write_text(content, encoding="utf-8")

            self.logger.info(f"Updated company info: {file_path}")
            return True

        except Exception as e:
            self.logger.error(f"Error updating company info: {e}")
            return False

    def _create_backup(self, file_path: str):
        """Create backup of file"""
        try:
            source_path = self.base_path / file_path
            if source_path.exists():
                backup_path = (
                    self.backup_dir
                    / f"{file_path.replace('/', '_')}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.bak"
                )
                backup_path.parent.mkdir(parents=True, exist_ok=True)
                shutil.copy2(source_path, backup_path)
                self.logger.info(f"Created backup: {backup_path}")
        except Exception as e:
            self.logger.error(f"Error creating backup: {e}")

    def _read_file(self, file_path: str) -> str:
        """Read file content"""
        try:
            full_path = self.base_path / file_path
            return full_path.read_text(encoding="utf-8")
        except Exception as e:
            self.logger.error(f"Error reading file {file_path}: {e}")
            return ""

    # ==================== PROJECT MANAGEMENT ====================

    def create_project(self, project_info: ProjectInfo) -> str:
        """Create a new project"""
        project_id = self._generate_project_id(project_info.name)

        # Validate project requirements
        validation = self.validate_project_requirements(project_info)
        if not validation["is_valid"]:
            raise ValueError(f"Project validation failed: {validation['issues']}")

        # Add project
        self.projects[project_id] = project_info

        # Save projects
        self._save_projects()

        # Create project directory structure
        self._create_project_structure(project_id, project_info)

        # Generate initial recommendations
        recommendations = self.get_project_recommendations(project_info.type)

        self.logger.info(f"Created project: {project_id}")
        return project_id

    def _generate_project_id(self, name: str) -> str:
        """Generate unique project ID"""
        base_id = name.lower().replace(" ", "_").replace("-", "_")
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        return f"{base_id}_{timestamp}"

    def _create_project_structure(self, project_id: str, project_info: ProjectInfo):
        """Create project directory structure"""
        project_dir = self.base_path / "projects" / project_id
        project_dir.mkdir(parents=True, exist_ok=True)

        # Create subdirectories
        subdirs = ["src", "docs", "tests", "config", "assets", "reports"]

        for subdir in subdirs:
            (project_dir / subdir).mkdir(exist_ok=True)

        # Create project configuration
        config = {
            "project_id": project_id,
            "project_info": asdict(project_info),
            "created_date": datetime.now().isoformat(),
            "last_updated": datetime.now().isoformat(),
        }

        config_file = project_dir / "project_config.json"
        with open(config_file, "w") as f:
            json.dump(config, f, indent=2)

    def _save_projects(self):
        """Save projects to file"""
        try:
            projects_file = self.base_path / "data" / "projects.json"
            projects_file.parent.mkdir(exist_ok=True)

            projects_data = {}
            for project_id, project_info in self.projects.items():
                projects_data[project_id] = asdict(project_info)

            with open(projects_file, "w") as f:
                json.dump(projects_data, f, indent=2)

        except Exception as e:
            self.logger.error(f"Error saving projects: {e}")

    # ==================== DEVELOPMENT VALIDATION ====================

    def validate_project_requirements(
        self, project_info: ProjectInfo
    ) -> Dict[str, Any]:
        """Validate project requirements against EHB standards"""
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

        # Check compliance requirements
        if "HIPAA" in project_info.compliance_requirements:
            validation["compliance"]["hipaa"] = self._check_hipaa_compliance(
                project_info
            )
            if not validation["compliance"]["hipaa"]:
                validation["is_valid"] = False
                validation["issues"].append("HIPAA compliance requirements not met")
                validation["recommendations"].append(
                    "Implement encryption, access controls, and audit logging"
                )

        # Check security requirements
        required_security = ["encryption", "authentication", "authorization"]
        for req in required_security:
            if req not in project_info.security_requirements:
                validation["is_valid"] = False
                validation["issues"].append(f"Missing security requirement: {req}")

        # Check performance targets
        if project_info.performance_targets:
            validation["compliance"]["performance"] = self._check_performance_targets(
                project_info.performance_targets
            )
            if not validation["compliance"]["performance"]:
                validation["issues"].append("Performance targets not met")
                validation["recommendations"].append(
                    "Optimize for < 3 seconds load time and < 200ms API responses"
                )

        return validation

    def _check_hipaa_compliance(self, project_info: ProjectInfo) -> bool:
        """Check HIPAA compliance"""
        required_features = [
            "encryption",
            "access_controls",
            "audit_logging",
            "data_retention",
            "breach_notification",
        ]

        # This is a simplified check - in real implementation, you'd check actual features
        return len(project_info.security_requirements) >= 3

    def _check_performance_targets(self, targets: Dict[str, Any]) -> bool:
        """Check performance targets"""
        config_targets = self.config["performance_thresholds"]

        for metric, target_value in targets.items():
            if metric in config_targets:
                if target_value > config_targets[metric]:
                    return False

        return True

    # ==================== RECOMMENDATIONS ====================

    def get_project_recommendations(self, project_type: str) -> Dict[str, Any]:
        """Get comprehensive project recommendations"""
        recommendations = {
            "patient-management": {
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
                "team_structure": [
                    "Frontend Developer",
                    "Backend Developer",
                    "QA Engineer",
                    "Healthcare Specialist",
                ],
                "timeline": "3-6 months",
                "budget_range": "$50,000 - $150,000",
            },
            "ehr-system": {
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
                "team_structure": [
                    "Senior Frontend Developer",
                    "Senior Backend Developer",
                    "DevOps Engineer",
                    "Clinical Specialist",
                ],
                "timeline": "6-12 months",
                "budget_range": "$100,000 - $300,000",
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
                "team_structure": [
                    "Frontend Developer",
                    "Backend Developer",
                    "WebRTC Specialist",
                    "Mobile Developer",
                ],
                "timeline": "4-8 months",
                "budget_range": "$75,000 - $200,000",
            },
            "healthcare-analytics": {
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
                "team_structure": [
                    "Data Scientist",
                    "Frontend Developer",
                    "Backend Developer",
                    "Analytics Specialist",
                ],
                "timeline": "5-10 months",
                "budget_range": "$80,000 - $250,000",
            },
        }

        return recommendations.get(project_type, recommendations["patient-management"])

    # ==================== METRICS AND REPORTING ====================

    def add_development_metrics(self, metrics: DevelopmentMetrics):
        """Add development metrics"""
        self.metrics.append(metrics)
        self._save_metrics()
        self.logger.info(f"Added metrics for project: {metrics.project_name}")

    def _save_metrics(self):
        """Save metrics to file"""
        try:
            metrics_file = self.base_path / "data" / "metrics.json"
            metrics_file.parent.mkdir(exist_ok=True)

            metrics_data = [asdict(metric) for metric in self.metrics]

            with open(metrics_file, "w") as f:
                json.dump(metrics_data, f, indent=2)

        except Exception as e:
            self.logger.error(f"Error saving metrics: {e}")

    def generate_project_report(self, project_id: str) -> Dict[str, Any]:
        """Generate comprehensive project report"""
        if project_id not in self.projects:
            raise ValueError(f"Project {project_id} not found")

        project_info = self.projects[project_id]
        project_metrics = [m for m in self.metrics if m.project_name == project_id]

        # Calculate averages
        if project_metrics:
            avg_coverage = sum(m.code_coverage for m in project_metrics) / len(
                project_metrics
            )
            avg_performance = sum(m.performance_score for m in project_metrics) / len(
                project_metrics
            )
            avg_security = sum(m.security_score for m in project_metrics) / len(
                project_metrics
            )
            avg_accessibility = sum(
                m.accessibility_score for m in project_metrics
            ) / len(project_metrics)
            avg_compliance = sum(m.compliance_score for m in project_metrics) / len(
                project_metrics
            )
        else:
            avg_coverage = avg_performance = avg_security = avg_accessibility = (
                avg_compliance
            ) = 0.0

        report = {
            "project_id": project_id,
            "project_info": asdict(project_info),
            "metrics_summary": {
                "total_metrics_entries": len(project_metrics),
                "average_code_coverage": avg_coverage,
                "average_performance_score": avg_performance,
                "average_security_score": avg_security,
                "average_accessibility_score": avg_accessibility,
                "average_compliance_score": avg_compliance,
            },
            "recommendations": self.get_project_recommendations(project_info.type),
            "validation": self.validate_project_requirements(project_info),
            "generated_date": datetime.now().isoformat(),
        }

        # Save report
        report_file = (
            self.reports_dir
            / f"{project_id}_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        )
        with open(report_file, "w") as f:
            json.dump(report, f, indent=2)

        return report

    def generate_company_report(self) -> Dict[str, Any]:
        """Generate comprehensive company report"""
        total_projects = len(self.projects)
        active_projects = len(
            (p for p in self.projects.values() if p.status == "active")
        )
        completed_projects = len(
            (p for p in self.projects.values() if p.status == "completed")
        )

        # Calculate overall metrics
        if self.metrics:
            overall_coverage = sum(m.code_coverage for m in self.metrics) / len(
                self.metrics
            )
            overall_performance = sum(m.performance_score for m in self.metrics) / len(
                self.metrics
            )
            overall_security = sum(m.security_score for m in self.metrics) / len(
                self.metrics
            )
        else:
            overall_coverage = overall_performance = overall_security = 0.0

        report = {
            "company_name": self.config["company_name"],
            "report_date": datetime.now().isoformat(),
            "project_summary": {
                "total_projects": total_projects,
                "active_projects": active_projects,
                "completed_projects": completed_projects,
                "project_types": list(set(p.type for p in self.projects.values())),
            },
            "overall_metrics": {
                "average_code_coverage": overall_coverage,
                "average_performance_score": overall_performance,
                "average_security_score": overall_security,
            },
            "compliance_status": {
                "hipaa_compliant_projects": len(
                    (
                        p
                        for p in self.projects.values()
                        if "HIPAA" in p.compliance_requirements
                    )
                ),
                "total_metrics_entries": len(self.metrics),
            },
            "recommendations": {
                "focus_areas": self._get_focus_areas(),
                "improvement_suggestions": self._get_improvement_suggestions(),
            },
        }

        # Save report
        report_file = (
            self.reports_dir
            / f"company_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        )
        with open(report_file, "w") as f:
            json.dump(report, f, indent=2)

        return report

    def _get_focus_areas(self) -> List[str]:
        """Get areas that need focus based on metrics"""
        focus_areas = []

        if self.metrics:
            avg_coverage = sum(m.code_coverage for m in self.metrics) / len(
                self.metrics
            )
            if avg_coverage < 80:
                focus_areas.append("Improve code coverage - target 80% minimum")

            avg_security = sum(m.security_score for m in self.metrics) / len(
                self.metrics
            )
            if avg_security < 90:
                focus_areas.append("Enhance security measures")

            avg_performance = sum(m.performance_score for m in self.metrics) / len(
                self.metrics
            )
            if avg_performance < 85:
                focus_areas.append("Optimize performance")

        return focus_areas

    def _get_improvement_suggestions(self) -> List[str]:
        """Get improvement suggestions"""
        suggestions = [
            "Implement automated testing pipelines",
            "Regular security audits and penetration testing",
            "Performance monitoring and optimization",
            "Accessibility compliance reviews",
            "Regular compliance audits",
        ]
        return suggestions

    # ==================== AUTOMATION AND INTEGRATION ====================

    def run_automated_validation(self, project_id: str) -> Dict[str, Any]:
        """Run automated validation for a project"""
        if project_id not in self.projects:
            raise ValueError(f"Project {project_id} not found")

        project_info = self.projects[project_id]

        # Run various validations
        validation_results = {
            "project_id": project_id,
            "validation_date": datetime.now().isoformat(),
            "compliance_check": self.validate_project_requirements(project_info),
            "performance_check": self._check_performance_targets(
                project_info.performance_targets
            ),
            "security_check": self._check_security_requirements(
                project_info.security_requirements
            ),
            "recommendations": self.get_project_recommendations(project_info.type),
        }

        # Save validation results
        validation_file = (
            self.base_path
            / "reports"
            / f"{project_id}_validation_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        )
        with open(validation_file, "w") as f:
            json.dump(validation_results, f, indent=2)

        return validation_results

    def _check_security_requirements(self, requirements: List[str]) -> Dict[str, Any]:
        """Check security requirements"""
        required_security = [
            "encryption",
            "authentication",
            "authorization",
            "audit_logging",
        ]

        missing_requirements = [
            req for req in required_security if req not in requirements
        ]

        return {
            "is_compliant": len(missing_requirements) == 0,
            "missing_requirements": missing_requirements,
            "compliance_score": (len(required_security) - len(missing_requirements))
            / len(required_security)
            * 100,
        }

    def backup_all_data(self) -> str:
        """Create comprehensive backup of all data"""
        try:
            backup_timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            backup_path = self.backup_dir / f"complete_backup_{backup_timestamp}"
            backup_path.mkdir(exist_ok=True)

            # Backup company info
            company_info_dir = backup_path / "company-info"
            if (self.base_path / "company-info").exists():
                shutil.copytree(self.base_path / "company-info", company_info_dir)

            # Backup development guidelines
            dev_guidelines_dir = backup_path / "development-guidelines"
            if (self.base_path / "development-guidelines").exists():
                shutil.copytree(
                    self.base_path / "development-guidelines", dev_guidelines_dir
                )

            # Backup project data
            data_dir = backup_path / "data"
            if (self.base_path / "data").exists():
                shutil.copytree(self.base_path / "data", data_dir)

            # Backup reports
            reports_dir = backup_path / "reports"
            if (self.base_path / "reports").exists():
                shutil.copytree(self.base_path / "reports", reports_dir)

            # Create backup manifest
            manifest = {
                "backup_date": datetime.now().isoformat(),
                "backup_path": str(backup_path),
                "included_directories": [
                    "company-info",
                    "development-guidelines",
                    "data",
                    "reports",
                ],
                "total_files": sum(len(list(backup_path.rglob("*"))) for _ in [1]),
            }

            manifest_file = backup_path / "backup_manifest.json"
            with open(manifest_file, "w") as f:
                json.dump(manifest, f, indent=2)

            self.logger.info(f"Created complete backup: {backup_path}")
            return str(backup_path)

        except Exception as e:
            self.logger.error(f"Error creating backup: {e}")
            raise

    # ==================== EXPORT AND INTEGRATION ====================

    def export_all_data(self, format_type: str = "json") -> str:
        """Export all agent data"""
        export_data = {
            "company_info": {
                "profile": self.get_company_info("profile"),
                "brand": self.get_company_info("brand"),
                "team": self.get_company_info("team"),
                "contact": self.get_company_info("contact"),
                "standards": self.get_company_info("standards"),
                "requirements": self.get_company_info("requirements"),
            },
            "projects": {
                pid: asdict(project) for pid, project in self.projects.items()
            },
            "metrics": [asdict(metric) for metric in self.metrics],
            "config": self.config,
            "export_date": datetime.now().isoformat(),
        }

        export_file = (
            self.base_path
            / "exports"
            / f"complete_export_{datetime.now().strftime('%Y%m%d_%H%M%S')}.{format_type}"
        )

        if format_type == "json":
            with open(export_file, "w") as f:
                json.dump(export_data, f, indent=2)
        elif format_type == "yaml" and YAML_AVAILABLE:
            with open(export_file, "w") as f:
                yaml.dump(export_data, f, default_flow_style=False)
        else:
            raise ValueError(f"Unsupported format: {format_type}")

        return str(export_file)

    def get_agent_status(self) -> Dict[str, Any]:
        """Get comprehensive agent status"""
        return {
            "agent_version": "1.0.0",
            "status": "active",
            "last_backup": self._get_last_backup_time(),
            "total_projects": len(self.projects),
            "total_metrics": len(self.metrics),
            "config_loaded": bool(self.config),
            "integrations_available": {
                "yaml": YAML_AVAILABLE,
                "requests": REQUESTS_AVAILABLE,
                "git": GIT_AVAILABLE,
            },
            "disk_usage": self._get_disk_usage(),
            "uptime": self._get_uptime(),
        }

    def _get_last_backup_time(self) -> Optional[str]:
        """Get last backup time"""
        backup_files = list(self.backup_dir.glob("complete_backup_*"))
        if backup_files:
            latest_backup = max(backup_files, key=lambda x: x.stat().st_mtime)
            return datetime.fromtimestamp(latest_backup.stat().st_mtime).isoformat()
        return None

    def _get_disk_usage(self) -> Dict[str, Any]:
        """Get disk usage information"""
        try:
            total, used, free = shutil.disk_usage(self.base_path)
            return {
                "total_gb": total / (1024**3),
                "used_gb": used / (1024**3),
                "free_gb": free / (1024**3),
                "usage_percent": (used / total) * 100,
            }
        except Exception:
            return {"error": "Unable to get disk usage"}

    def _get_uptime(self) -> str:
        """Get agent uptime"""
        # This would track actual uptime in a real implementation
        return "Since initialization"


def main():
    """Main function for testing the complete agent"""
    agent = CompleteEHBAgent()

    print("=== Complete EHB Agent Status ===")
    status = agent.get_agent_status()
    for key, value in status.items():
        print(f"{key}: {value}")

    print("\n=== Creating Sample Project ===")
    sample_project = ProjectInfo(
        name="Patient Management System",
        type="patient-management",
        description="Comprehensive patient management system for healthcare facilities",
        technology_stack=["React.js", "Node.js", "PostgreSQL"],
        team_members=["John Doe", "Jane Smith", "Dr. Johnson"],
        start_date="2024-01-15",
        status="active",
        priority="high",
        budget=100000.0,
    )

    try:
        project_id = agent.create_project(sample_project)
        print(f"Created project: {project_id}")

        # Generate report
        report = agent.generate_project_report(project_id)
        print(f"Generated report for project: {project_id}")

        # Run validation
        validation = agent.run_automated_validation(project_id)
        print(f"Validation completed for project: {project_id}")

    except Exception as e:
        print(f"Error: {e}")


if __name__ == "__main__":
    main()
