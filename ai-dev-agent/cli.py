import os
import sys
import json
import subprocess
from pathlib import Path

#!/usr/bin/env python3
"""
EHB AI Dev Agent - Simple CLI Interface
"""



class EHBAgentCLI:
    def __init__(self):
        self.agent_dir = Path(__file__).parent
        self.main_agent = self.agent_dir / "main.py"

    def run_command(self, command: str, args: List[str] = []):
        """Run agent command"""
        cmd = [sys.executable, str(self.main_agent), command]
        if args:
            cmd.extend(args)

        try:
            result = subprocess.run(cmd, capture_output=True, text=True)
            if result.returncode == 0:
                return result.stdout
            else:
                return f"Error: {result.stderr}"
        except Exception as e:
            return f"Error running command: {e}"

    def interactive_mode(self):
        """Interactive CLI mode"""
        print("EHB AI EHB AI Dev Agent - Interactive Mode")
        print("=" * 50)

        while True:
            print("\nAvailable commands:")
            print("1. analyze    - Analyze current project")
            print("2. assign     - Create sub-agents")
            print("3. status     - Check project status")
            print("4. fix        - Fix common issues")
            print("5. suggest    - Get next phase suggestions")
            print("6. help       - Show help")
            print("7. exit       - Exit")

            choice = input("\nEnter command (or number): ").strip().lower()

            if choice in ["1", "analyze"]:
                print("\nSEARCH Analyzing project...")
                result = self.run_command("analyze")
                print(result)

            elif choice in ["2", "assign"]:
                print("\nEHB AI Creating sub-agents...")
                result = self.run_command("assign-tasks")
                print(result)

            elif choice in ["3", "status"]:
                print("\nREPORT Checking project status...")
                result = self.run_command("status")
                print(result)

            elif choice in ["4", "fix"]:
                print("\nTOOLS Fixing issues...")
                target = input(
                    "Enter target (all/frontend/backend/security/testing): "
                ).strip()
                if not target:
                    target = "all"
                result = self.run_command("fix", [target])
                print(result)

            elif choice in ["5", "suggest"]:
                print("\n💡 Getting suggestions...")
                result = self.run_command("suggest")
                print(result)

            elif choice in ["6", "help"]:
                self.show_help()

            elif choice in ["7", "exit"]:
                print("\n👋 Goodbye! EHB AI Dev Agent signing off...")
                break

            else:
                print("ERROR Invalid command. Type 'help' for available commands.")

    def show_help(self):
        """Show help information"""
        help_text = """
EHB AI EHB AI Dev Agent - Help

COMMANDS:
  analyze    - Analyze current project structure and technologies
  assign     - Create specialized sub-agents based on detected technologies
  status     - Run all sub-agents and show project health status
  fix        - Automatically fix common issues (all/frontend/backend/security/testing)
  suggest    - Get suggestions for next development phase

EXAMPLES:
  python cli.py analyze
  python cli.py assign-tasks
  python cli.py status
  python cli.py fix all
  python cli.py suggest

FEATURES:
  SUCCESS Healthcare Compliance (HIPAA, GDPR, WCAG)
  SUCCESS Technology Detection (React, Node.js, Python, etc.)
  SUCCESS Automatic Issue Fixing
  SUCCESS Project Health Monitoring
  SUCCESS Development Phase Suggestions

For more information, see README.md
        """
        print(help_text)

    def quick_analysis(self):
        """Quick analysis mode"""
        print("ROCKET EHB Quick Analysis Mode")
        print("=" * 40)

        # Run analysis
        print("SEARCH Analyzing project...")
        analysis = self.run_command("analyze")
        print(analysis)

        # Create sub-agents
        print("\nEHB AI Creating sub-agents...")
        agents = self.run_command("assign-tasks")
        print(agents)

        # Check status
        print("\nREPORT Checking project status...")
        status = self.run_command("status")
        print(status)

        # Get suggestions
        print("\n💡 Getting suggestions...")
        suggestions = self.run_command("suggest")
        print(suggestions)


def main():
    """Main CLI entry point"""
    cli = EHBAgentCLI()

    if len(sys.argv) > 1:
        # Command line mode
        command = sys.argv[1]
        args = sys.argv[2:] if len(sys.argv) > 2 else []

        if command == "interactive":
            cli.interactive_mode()
        elif command == "quick":
            cli.quick_analysis()
        elif command == "help":
            cli.show_help()
        else:
            result = cli.run_command(command, args)
            print(result)
    else:
        # Interactive mode by default
        cli.interactive_mode()


if __name__ == "__main__":
    main()
