import json
import sys
from pathlib import Path
from datetime import datetime

#!/usr/bin/env python3
"""
Complete EHB Agent CLI

Comprehensive command-line interface for the Complete EHB Company Agent
"""


# Add the agents directory to the path
sys.path.append(str(Path(__file__).parent))



def main():
    """Main CLI function"""
    parser = argparse.ArgumentParser(
        description="Complete EHB Company Agent CLI",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python complete_cli.py status                           # Get agent status
  python complete_cli.py info profile                     # Get company profile
  python complete_cli.py project create --name "EHR System" --type ehr-system
  python complete_cli.py project validate PROJECT_ID      # Validate project
  python complete_cli.py project report PROJECT_ID        # Generate project report
  python complete_cli.py metrics add --project PROJECT_ID --coverage 85
  python complete_cli.py backup create                    # Create backup
  python complete_cli.py export --format json             # Export all data
  python complete_cli.py company report                   # Generate company report
        """,
    )

    subparsers = parser.add_subparsers(dest="command", help="Available commands")

    # Status command
    status_parser = subparsers.add_parser("status", help="Get agent status")

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

    # Project commands
    project_parser = subparsers.add_parser("project", help="Project management")
    project_subparsers = project_parser.add_subparsers(dest="project_command")

    # Create project
    create_parser = project_subparsers.add_parser("create", help="Create new project")
    create_parser.add_argument("--name", required=True, help="Project name")
    create_parser.add_argument(
        "--type",
        required=True,
        choices=[
            "patient-management",
            "ehr-system",
            "telemedicine",
            "healthcare-analytics",
        ],
        help="Project type",
    )
    create_parser.add_argument("--description", help="Project description")
    create_parser.add_argument("--team", nargs="+", help="Team members")
    create_parser.add_argument("--start-date", help="Start date (YYYY-MM-DD)")
    create_parser.add_argument("--budget", type=float, help="Project budget")
    create_parser.add_argument(
        "--priority", choices=["low", "medium", "high"], default="medium"
    )

    # List projects
    list_parser = project_subparsers.add_parser("list", help="List all projects")

    # Validate project
    validate_parser = project_subparsers.add_parser("validate", help="Validate project")
    validate_parser.add_argument("project_id", help="Project ID to validate")

    # Generate project report
    report_parser = project_subparsers.add_parser(
        "report", help="Generate project report"
    )
    report_parser.add_argument("project_id", help="Project ID for report")

    # Metrics commands
    metrics_parser = subparsers.add_parser("metrics", help="Development metrics")
    metrics_subparsers = metrics_parser.add_subparsers(dest="metrics_command")

    # Add metrics
    add_metrics_parser = metrics_subparsers.add_parser(
        "add", help="Add development metrics"
    )
    add_metrics_parser.add_argument("--project", required=True, help="Project ID")
    add_metrics_parser.add_argument(
        "--coverage", type=float, help="Code coverage percentage"
    )
    add_metrics_parser.add_argument(
        "--performance", type=float, help="Performance score"
    )
    add_metrics_parser.add_argument("--security", type=float, help="Security score")
    add_metrics_parser.add_argument(
        "--accessibility", type=float, help="Accessibility score"
    )
    add_metrics_parser.add_argument("--compliance", type=float, help="Compliance score")
    add_metrics_parser.add_argument("--total-issues", type=int, help="Total issues")
    add_metrics_parser.add_argument(
        "--resolved-issues", type=int, help="Resolved issues"
    )
    add_metrics_parser.add_argument("--velocity", type=float, help="Team velocity")

    # List metrics
    list_metrics_parser = metrics_subparsers.add_parser("list", help="List metrics")
    list_metrics_parser.add_argument("--project", help="Filter by project ID")

    # Backup commands
    backup_parser = subparsers.add_parser("backup", help="Backup operations")
    backup_subparsers = backup_parser.add_subparsers(dest="backup_command")

    # Create backup
    create_backup_parser = backup_subparsers.add_parser("create", help="Create backup")

    # List backups
    list_backup_parser = backup_subparsers.add_parser("list", help="List backups")

    # Export command
    export_parser = subparsers.add_parser("export", help="Export data")
    export_parser.add_argument(
        "--format", choices=["json", "yaml"], default="json", help="Export format"
    )

    # Company report command
    company_parser = subparsers.add_parser("company", help="Company operations")
    company_subparsers = company_parser.add_subparsers(dest="company_command")

    # Generate company report
    company_report_parser = company_subparsers.add_parser(
        "report", help="Generate company report"
    )

    # Update company info
    update_parser = subparsers.add_parser("update", help="Update company information")
    update_parser.add_argument("file_path", help="File path to update")
    update_parser.add_argument("--content", help="New content (or use --file)")
    update_parser.add_argument("--file", help="File containing new content")
    update_parser.add_argument("--no-backup", action="store_true", help="Skip backup")

    args = parser.parse_args()

    if not args.command:
        parser.print_help()
        return

    agent = CompleteEHBAgent()

    if args.command == "status":
        handle_status_command(agent)
    elif args.command == "info":
        handle_info_command(agent, args.category)
    elif args.command == "project":
        handle_project_command(agent, args)
    elif args.command == "metrics":
        handle_metrics_command(agent, args)
    elif args.command == "backup":
        handle_backup_command(agent, args)
    elif args.command == "export":
        handle_export_command(agent, args.format)
    elif args.command == "company":
        handle_company_command(agent, args)
    elif args.command == "update":
        handle_update_command(agent, args)


def handle_status_command(agent):
    """Handle status command"""
    print("=== EHB Complete Agent Status ===\n")

    status = agent.get_agent_status()

    print(f"Agent Version: {status['agent_version']}")
    print(f"Status: {status['status']}")
    print(f"Total Projects: {status['total_projects']}")
    print(f"Total Metrics: {status['total_metrics']}")
    print(f"Last Backup: {status['last_backup'] or 'Never'}")

    print("\nIntegrations Available:")
    for integration, available in status["integrations_available"].items():
        status_icon = "SUCCESS" if available else "ERROR"
        print(f"  {integration.title()}: {status_icon}")

    if "disk_usage" in status and "error" not in status["disk_usage"]:
        usage = status["disk_usage"]
        print(f"\nDisk Usage:")
        print(f"  Total: {usage['total_gb']:.1f} GB")
        print(f"  Used: {usage['used_gb']:.1f} GB")
        print(f"  Free: {usage['free_gb']:.1f} GB")
        print(f"  Usage: {usage['usage_percent']:.1f}%")


def handle_info_command(agent, category):
    """Handle info command"""
    print(f"=== EHB Company Information: {category.upper()} ===\n")

    content = agent.get_company_info(category)
    print(content)


def handle_project_command(agent, args):
    """Handle project commands"""
    if args.project_command == "create":
        handle_create_project(agent, args)
    elif args.project_command == "list":
        handle_list_projects(agent)
    elif args.project_command == "validate":
        handle_validate_project(agent, args.project_id)
    elif args.project_command == "report":
        handle_project_report(agent, args.project_id)


def handle_create_project(agent, args):
    """Handle project creation"""
    print(f"=== Creating Project: {args.name} ===\n")

    # Create project info
    project_info = ProjectInfo(
        name=args.name,
        type=args.type,
        description=args.description or f"{args.name} project",
        technology_stack=[],
        team_members=args.team or [],
        start_date=args.start_date or datetime.now().strftime("%Y-%m-%d"),
        priority=args.priority,
        budget=args.budget,
    )

    try:
        project_id = agent.create_project(project_info)
        print(f"SUCCESS Project created successfully!")
        print(f"Project ID: {project_id}")
        print(f"Project Name: {args.name}")
        print(f"Project Type: {args.type}")
        print(f"Status: {project_info.status}")
        print(f"Priority: {project_info.priority}")

        # Show recommendations
        recommendations = agent.get_project_recommendations(args.type)
        print(f"\n📋 Recommendations for {args.type}:")
        print(f"  Technology: {recommendations['technology']}")
        print(f"  Timeline: {recommendations['timeline']}")
        print(f"  Budget Range: {recommendations['budget_range']}")

    except Exception as e:
        print(f"ERROR Error creating project: {e}")


def handle_list_projects(agent):
    """Handle list projects command"""
    print("=== EHB Projects ===\n")

    if not agent.projects:
        print("No projects found.")
        return

    for project_id, project_info in agent.projects.items():
        print(f"Project ID: {project_id}")
        print(f"  Name: {project_info.name}")
        print(f"  Type: {project_info.type}")
        print(f"  Status: {project_info.status}")
        print(f"  Priority: {project_info.priority}")
        print(f"  Start Date: {project_info.start_date}")
        if project_info.budget:
            print(f"  Budget: ${project_info.budget:,.2f}")
        print()


def handle_validate_project(agent, project_id):
    """Handle project validation"""
    print(f"=== Validating Project: {project_id} ===\n")

    try:
        validation = agent.run_automated_validation(project_id)

        print("Validation Results:")
        print(
            f"  Compliance Check: {'SUCCESS' if validation['compliance_check']['is_valid'] else 'ERROR'}"
        )
        print(
            f"  Performance Check: {'SUCCESS' if validation['performance_check'] else 'ERROR'}"
        )
        print(
            f"  Security Check: {'SUCCESS' if validation['security_check']['is_compliant'] else 'ERROR'}"
        )

        if validation["compliance_check"]["issues"]:
            print("\nIssues Found:")
            for issue in validation["compliance_check"]["issues"]:
                print(f"  ERROR {issue}")

        if validation["compliance_check"]["recommendations"]:
            print("\nRecommendations:")
            for rec in validation["compliance_check"]["recommendations"]:
                print(f"  💡 {rec}")

    except Exception as e:
        print(f"ERROR Error validating project: {e}")


def handle_project_report(agent, project_id):
    """Handle project report generation"""
    print(f"=== Generating Report for Project: {project_id} ===\n")

    try:
        report = agent.generate_project_report(project_id)

        print("Report Generated Successfully!")
        print(f"Project: {report['project_info']['name']}")
        print(f"Type: {report['project_info']['type']}")
        print(f"Status: {report['project_info']['status']}")

        metrics = report["metrics_summary"]
        print(f"\nMetrics Summary:")
        print(f"  Total Metrics Entries: {metrics['total_metrics_entries']}")
        print(f"  Average Code Coverage: {metrics['average_code_coverage']:.1f}%")
        print(
            f"  Average Performance Score: {metrics['average_performance_score']:.1f}"
        )
        print(f"  Average Security Score: {metrics['average_security_score']:.1f}")
        print(
            f"  Average Accessibility Score: {metrics['average_accessibility_score']:.1f}"
        )
        print(f"  Average Compliance Score: {metrics['average_compliance_score']:.1f}")

    except Exception as e:
        print(f"ERROR Error generating report: {e}")


def handle_metrics_command(agent, args):
    """Handle metrics commands"""
    if args.metrics_command == "add":
        handle_add_metrics(agent, args)
    elif args.metrics_command == "list":
        handle_list_metrics(agent, args.project if hasattr(args, "project") else None)


def handle_add_metrics(agent, args):
    """Handle adding metrics"""
    print(f"=== Adding Metrics for Project: {args.project} ===\n")

    # Create metrics object
    metrics = DevelopmentMetrics(
        project_name=args.project,
        date=datetime.now().strftime("%Y-%m-%d"),
        code_coverage=args.coverage or 0.0,
        performance_score=args.performance or 0.0,
        security_score=args.security or 0.0,
        accessibility_score=args.accessibility or 0.0,
        compliance_score=args.compliance or 0.0,
        total_issues=args.total_issues or 0,
        resolved_issues=args.resolved_issues or 0,
        team_velocity=args.velocity or 0.0,
    )

    try:
        agent.add_development_metrics(metrics)
        print("SUCCESS Metrics added successfully!")
        print(f"  Code Coverage: {metrics.code_coverage}%")
        print(f"  Performance Score: {metrics.performance_score}")
        print(f"  Security Score: {metrics.security_score}")
        print(f"  Accessibility Score: {metrics.accessibility_score}")
        print(f"  Compliance Score: {metrics.compliance_score}")
        print(f"  Total Issues: {metrics.total_issues}")
        print(f"  Resolved Issues: {metrics.resolved_issues}")
        print(f"  Team Velocity: {metrics.team_velocity}")

    except Exception as e:
        print(f"ERROR Error adding metrics: {e}")


def handle_list_metrics(agent, project_filter):
    """Handle listing metrics"""
    print("=== Development Metrics ===\n")

    metrics_to_show = agent.metrics
    if project_filter:
        metrics_to_show = (m for m in agent.metrics if m.project_name == project_filter)

    if not metrics_to_show:
        print("No metrics found.")
        return

    for metric in metrics_to_show:
        print(f"Project: {metric.project_name}")
        print(f"  Date: {metric.date}")
        print(f"  Code Coverage: {metric.code_coverage}%")
        print(f"  Performance Score: {metric.performance_score}")
        print(f"  Security Score: {metric.security_score}")
        print(f"  Accessibility Score: {metric.accessibility_score}")
        print(f"  Compliance Score: {metric.compliance_score}")
        print(f"  Issues: {metric.resolved_issues}/{metric.total_issues}")
        print(f"  Team Velocity: {metric.team_velocity}")
        print()


def handle_backup_command(agent, args):
    """Handle backup commands"""
    if args.backup_command == "create":
        handle_create_backup(agent)
    elif args.backup_command == "list":
        handle_list_backups(agent)


def handle_create_backup(agent):
    """Handle creating backup"""
    print("=== Creating Complete Backup ===\n")

    try:
        backup_path = agent.backup_all_data()
        print(f"SUCCESS Backup created successfully!")
        print(f"Backup Location: {backup_path}")

    except Exception as e:
        print(f"ERROR Error creating backup: {e}")


def handle_list_backups(agent):
    """Handle listing backups"""
    print("=== Available Backups ===\n")

    backup_files = list(agent.backup_dir.glob("complete_backup_*"))

    if not backup_files:
        print("No backups found.")
        return

    for backup_file in sorted(
        backup_files, key=lambda x: x.stat().st_mtime, reverse=True
    ):
        backup_time = datetime.fromtimestamp(backup_file.stat().st_mtime)
        print(f"Backup: {backup_file.name}")
        print(f"  Created: {backup_time.strftime('%Y-%m-%d %H:%M:%S')}")
        print(f"  Size: {backup_file.stat().st_size / 1024:.1f} KB")
        print()


def handle_export_command(agent, format_type):
    """Handle export command"""
    print(f"=== Exporting All Data ({format_type.upper()}) ===\n")

    try:
        export_path = agent.export_all_data(format_type)
        print(f"SUCCESS Export completed successfully!")
        print(f"Export Location: {export_path}")

    except Exception as e:
        print(f"ERROR Error exporting data: {e}")


def handle_company_command(agent, args):
    """Handle company commands"""
    if args.company_command == "report":
        handle_company_report(agent)


def handle_company_report(agent):
    """Handle company report generation"""
    print("=== Generating Company Report ===\n")

    try:
        report = agent.generate_company_report()

        print("Company Report Generated Successfully!")
        print(f"Company: {report['company_name']}")
        print(f"Report Date: {report['report_date']}")

        summary = report["project_summary"]
        print(f"\nProject Summary:")
        print(f"  Total Projects: {summary['total_projects']}")
        print(f"  Active Projects: {summary['active_projects']}")
        print(f"  Completed Projects: {summary['completed_projects']}")
        print(f"  Project Types: {', '.join(summary['project_types'])}")

        metrics = report["overall_metrics"]
        print(f"\nOverall Metrics:")
        print(f"  Average Code Coverage: {metrics['average_code_coverage']:.1f}%")
        print(
            f"  Average Performance Score: {metrics['average_performance_score']:.1f}"
        )
        print(f"  Average Security Score: {metrics['average_security_score']:.1f}")

        compliance = report["compliance_status"]
        print(f"\nCompliance Status:")
        print(f"  HIPAA Compliant Projects: {compliance['hipaa_compliant_projects']}")
        print(f"  Total Metrics Entries: {compliance['total_metrics_entries']}")

        if report["recommendations"]["focus_areas"]:
            print(f"\nFocus Areas:")
            for area in report["recommendations"]["focus_areas"]:
                print(f"  • {area}")

    except Exception as e:
        print(f"ERROR Error generating company report: {e}")


def handle_update_command(agent, args):
    """Handle update command"""
    print(f"=== Updating Company Information: {args.file_path} ===\n")

    try:
        if args.content:
            content = args.content
        elif args.file:
            with open(args.file, "r", encoding="utf-8") as f:
                content = f.read()
        else:
            print("ERROR Error: Please provide --content or --file")
            return

        success = agent.update_company_info(args.file_path, content, not args.no_backup)

        if success:
            print("SUCCESS Company information updated successfully!")
            if not args.no_backup:
                print("Backup created automatically.")
        else:
            print("ERROR Error updating company information.")

    except Exception as e:
        print(f"ERROR Error: {e}")


if __name__ == "__main__":
    main()
