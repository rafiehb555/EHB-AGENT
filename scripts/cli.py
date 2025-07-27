import argparse
import json
import sys
from pathlib import Path

#!/usr/bin/env python3
"""
EHB Company Agent CLI

Command-line interface for the EHB Company Information Agent
"""


# Add the agents directory to the path
sys.path.append(str(Path(__file__).parent))

# Import the EHB Company Agent
from ehb_company_agent import EHBCompanyAgent


def main():
    """Main CLI function"""
    parser = argparse.ArgumentParser(
        description="EHB Company Information Agent CLI",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python cli.py info profile                    # Get company profile
  python cli.py info brand                     # Get brand guidelines
  python cli.py validate --type patient-management  # Validate project type
  python cli.py recommend --type ehr-system    # Get recommendations
  python cli.py export --format json           # Export configuration
        """,
    )

    subparsers = parser.add_subparsers(dest="command", help="Available commands")

    # Info command
    info_parser = subparsers.add_parser("info", help="Get company information")
    info_parser.add_argument(
        "category",
        choices=[
            "profile",
            "brand",
            "team",
            "contact",
            "standards",
            "requirements",
            "index",
        ],
        help="Category of information to retrieve",
    )

    # Validate command
    validate_parser = subparsers.add_parser(
        "validate", help="Validate development against standards"
    )
    validate_parser.add_argument(
        "--type",
        choices=[
            "patient-management",
            "ehr-system",
            "telemedicine",
            "healthcare-analytics",
        ],
        help="Type of healthcare project",
    )
    validate_parser.add_argument("--file", help="JSON file with development info")

    # Recommend command
    recommend_parser = subparsers.add_parser(
        "recommend", help="Get development recommendations"
    )
    recommend_parser.add_argument(
        "--type",
        choices=[
            "patient-management",
            "ehr-system",
            "telemedicine",
            "healthcare-analytics",
        ],
        required=True,
        help="Type of healthcare project",
    )

    # Export command
    export_parser = subparsers.add_parser("export", help="Export agent configuration")
    export_parser.add_argument(
        "--format", choices=["json", "yaml"], default="json", help="Export format"
    )

    # List command
    list_parser = subparsers.add_parser("list", help="List available information")
    list_parser.add_argument(
        "--category",
        choices=["all", "files", "standards", "contacts"],
        default="all",
        help="Category to list",
    )

    args = parser.parse_args()

    if not args.command:
        parser.print_help()
        return

    agent = EHBCompanyAgent()

    if args.command == "info":
        handle_info_command(agent, args.category)
    elif args.command == "validate":
        handle_validate_command(agent, args)
    elif args.command == "recommend":
        handle_recommend_command(agent, args.type)
    elif args.command == "export":
        handle_export_command(agent, args.format)
    elif args.command == "list":
        handle_list_command(agent, args.category)


def handle_info_command(agent, category):
    """Handle info command"""
    print(f"=== EHB Company Information: {category.upper()} ===\n")

    if category == "brand":
        brand_info = agent.get_brand_info()
        print("Brand Colors:")
        for name, color in brand_info["colors"].items():
            print(f"  {name.replace('_', ' ').title()}: {color}")

        print("\nTypography:")
        typography = brand_info["typography"]
        print(f"  Font Family: {typography['font_family']}")
        print(f"  Heading Weight: {typography['heading_weight']}")
        print(f"  Body Weight: {typography['body_weight']}")

        print("\nFont Sizes:")
        for size, value in typography["sizes"].items():
            print(f"  {size.upper()}: {value}")

        print("\nDesign Principles:")
        for principle, description in brand_info["design_principles"].items():
            print(f"  {principle.replace('_', ' ').title()}: {description}")

    elif category == "standards":
        standards = agent.get_development_standards()
        print("Code Quality Standards:")
        for standard, description in standards["code_quality"].items():
            print(f"  {standard.title()}: {description}")

        print("\nPerformance Standards:")
        for area, metrics in standards["performance_standards"].items():
            print(f"  {area.title()}:")
            for metric, value in metrics.items():
                print(f"    {metric.replace('_', ' ').title()}: {value}")

    elif category == "requirements":
        requirements = agent.get_healthcare_requirements()
        print("Healthcare Compliance Requirements:")
        for req, description in requirements["compliance"].items():
            print(f"  {req.replace('_', ' ').title()}: {description}")

        print("\nMedical Data Standards:")
        for standard, value in requirements["medical_data_standards"].items():
            print(f"  {standard.replace('_', ' ').title()}: {value}")

        print("\nUser Experience Requirements:")
        for req, description in requirements["user_experience"].items():
            print(f"  {req.replace('_', ' ').title()}: {description}")

    else:
        content = agent.get_company_info(category)
        print(content)


def handle_validate_command(agent, args):
    """Handle validate command"""
    if args.file:
        try:
            with open(args.file, "r") as f:
                development_info = json.load(f)
        except Exception as e:
            print(f"Error reading file: {e}")
            return
    else:
        # Default development info for the project type
        development_info = get_default_development_info(args.type)

    print(f"=== Validating Development: {args.type or 'Custom'} ===\n")

    validation = agent.validate_development(development_info)

    print(f"Overall Valid: {'SUCCESS' if validation['is_valid'] else 'ERROR'}")
    print()

    print("Compliance Status:")
    for area, status in validation["compliance"].items():
        status_icon = "SUCCESS" if status else "ERROR"
        print(f"  {area.title()}: {status_icon}")

    if validation["issues"]:
        print("\nIssues Found:")
        for issue in validation["issues"]:
            print(f"  ERROR {issue}")

    if validation["recommendations"]:
        print("\nRecommendations:")
        for rec in validation["recommendations"]:
            print(f"  💡 {rec}")


def handle_recommend_command(agent, project_type):
    """Handle recommend command"""
    print(
        f"=== Development Recommendations: {project_type.replace('-', ' ').title()} ===\n"
    )

    recommendations = agent.get_development_recommendations(project_type)

    print(f"Recommended Technology Stack:")
    print(f"  {recommendations['technology']}")

    print(f"\nRequired Features:")
    for feature in recommendations["features"]:
        print(f"  • {feature}")

    print(f"\nCompliance Requirements:")
    for req in recommendations["compliance"]:
        print(f"  • {req}")

    print(f"\nTesting Requirements:")
    for test in recommendations["testing"]:
        print(f"  • {test}")


def handle_export_command(agent, format_type):
    """Handle export command"""
    print(f"=== Exporting Configuration ({format_type.upper()}) ===\n")

    config = agent.export_config(format_type)
    print(config)


def handle_list_command(agent, category):
    """Handle list command"""
    if category == "all" or category == "files":
        print("=== Available Files ===\n")
        file_structure = agent.file_structure
        for folder, files in file_structure.items():
            print(f"{folder}/")
            for file, description in files.items():
                print(f"  {file} - {description}")
            print()

    if category == "all" or category == "standards":
        print("=== Performance Standards ===\n")
        standards = agent.performance_standards
        for area, metrics in standards.items():
            print(f"{area.title()}:")
            for metric, value in metrics.items():
                print(f"  {metric.replace('_', ' ').title()}: {value}")
            print()

    if category == "all" or category == "contacts":
        print("=== Emergency Contacts ===\n")
        contacts = agent.get_emergency_contacts()
        for contact, email in contacts.items():
            print(f"{contact.replace('_', ' ').title()}: {email}")

        print("\n=== Response Time Standards ===\n")
        response_times = agent.get_response_time_standards()
        for priority, time in response_times.items():
            print(f"{priority.replace('_', ' ').title()}: {time}")


def get_default_development_info(project_type):
    """Get default development info for project type"""
    defaults = {
        "patient-management": {
            "involves_patient_data": True,
            "has_ui": True,
            "features": [
                "encryption",
                "access_controls",
                "audit_logging",
                "data_retention",
            ],
            "accessibility": [
                "high_contrast",
                "keyboard_navigation",
                "screen_reader_support",
            ],
            "frontend_load_time": 2500,
            "api_response_time": 150,
            "bundle_size": 400000,
            "security": [
                "authentication",
                "authorization",
                "encryption",
                "data_masking",
            ],
        },
        "ehr-system": {
            "involves_patient_data": True,
            "has_ui": True,
            "features": [
                "encryption",
                "access_controls",
                "audit_logging",
                "data_retention",
                "breach_notification",
            ],
            "accessibility": [
                "high_contrast",
                "keyboard_navigation",
                "screen_reader_support",
                "focus_indicators",
            ],
            "frontend_load_time": 2800,
            "api_response_time": 180,
            "bundle_size": 450000,
            "security": [
                "authentication",
                "authorization",
                "encryption",
                "data_masking",
                "secure_communication",
            ],
        },
        "telemedicine": {
            "involves_patient_data": True,
            "has_ui": True,
            "features": ["encryption", "access_controls", "audit_logging"],
            "accessibility": ["high_contrast", "keyboard_navigation"],
            "frontend_load_time": 3000,
            "api_response_time": 200,
            "bundle_size": 500000,
            "security": ["authentication", "authorization", "encryption"],
        },
        "healthcare-analytics": {
            "involves_patient_data": True,
            "has_ui": True,
            "features": ["encryption", "access_controls", "audit_logging"],
            "accessibility": [
                "high_contrast",
                "keyboard_navigation",
                "screen_reader_support",
            ],
            "frontend_load_time": 3200,
            "api_response_time": 220,
            "bundle_size": 520000,
            "security": ["authentication", "authorization", "encryption"],
        },
    }

    return defaults.get(project_type, defaults["patient-management"])


if __name__ == "__main__":
    main()
