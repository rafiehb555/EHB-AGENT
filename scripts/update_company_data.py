import json
import sys
from pathlib import Path
from datetime import datetime

#!/usr/bin/env python3
"""
Update Company Data Script

This script helps update the EHB company information with data from ChatGPT
and other sources. It provides a structured way to integrate real company data.
"""



class CompanyDataUpdater:
    """Class to update company data with real information"""

    def __init__(self, info_file: str = "ehb_agent_info.json"):
        self.info_file = Path(info_file)
        self.data = self._load_data()

    def _load_data(self) -> Dict[str, Any]:
        """Load existing company data"""
        if self.info_file.exists():
            with open(self.info_file, "r", encoding="utf-8") as f:
                return json.load(f)
        else:
            print(f"Error: {self.info_file} not found!")
            return {}

    def _save_data(self):
        """Save updated company data"""
        with open(self.info_file, "w", encoding="utf-8") as f:
            json.dump(self.data, f, indent=2, ensure_ascii=False)
        print(f"SUCCESS Data saved to {self.info_file}")

    def update_basic_company_info(self, updates: Dict[str, str]):
        """Update basic company information"""
        print("=== Updating Basic Company Information ===")

        company_info = self.data.get("company_information", {})

        for field, value in updates.items():
            if field in company_info:
                old_value = company_info[field]
                company_info[field] = value
                print(f"  {field}: '{old_value}' → '{value}'")
            else:
                print(f"  WARNING  Field '{field}' not found in company_information")

        self.data["company_information"] = company_info
        self._save_data()

    def update_executive_team(self, updates: Dict[str, Dict[str, str]]):
        """Update executive team information"""
        print("=== Updating Executive Team ===")

        executive_team = self.data.get("company_structure", {}).get(
            "executive_team", {}
        )

        for position, info in updates.items():
            if position in executive_team:
                old_info = executive_team[position]
                for field, value in info.items():
                    if field in old_info:
                        old_value = old_info[field]
                        old_info[field] = value
                        print(f"  {position}.{field}: '{old_value}' → '{value}'")
                executive_team[position] = old_info
            else:
                print(f"  WARNING  Position '{position}' not found in executive_team")

        self.data["company_structure"]["executive_team"] = executive_team
        self._save_data()

    def update_department_info(
        self, department: str, team: str, updates: Dict[str, str]
    ):
        """Update department team information"""
        print(f"=== Updating {department} - {team} ===")

        departments = self.data.get("company_structure", {}).get("departments", {})
        dept = departments.get(department, {})
        team_info = dept.get(team, {})

        for field, value in updates.items():
            if field in team_info:
                old_value = team_info[field]
                team_info[field] = value
                print(f"  {field}: '{old_value}' → '{value}'")
            else:
                print(f"  WARNING  Field '{field}' not found in {department}.{team}")

        dept[team] = team_info
        departments[department] = dept
        self.data["company_structure"]["departments"] = departments
        self._save_data()

    def update_from_chatgpt_data(self, chatgpt_data: Dict[str, Any]):
        """Update data from ChatGPT response"""
        print("=== Updating from ChatGPT Data ===")

        # Update basic company info
        if "company_info" in chatgpt_data:
            self.update_basic_company_info(chatgpt_data["company_info"])

        # Update executive team
        if "executive_team" in chatgpt_data:
            self.update_executive_team(chatgpt_data["executive_team"])

        # Update departments
        if "departments" in chatgpt_data:
            for dept_name, dept_data in chatgpt_data["departments"].items():
                for team_name, team_data in dept_data.items():
                    self.update_department_info(dept_name, team_name, team_data)

        print("SUCCESS ChatGPT data integration completed!")

    def add_new_employee(
        self, department: str, team: str, position: str, employee_info: Dict[str, str]
    ):
        """Add new employee to department"""
        print(f"=== Adding New Employee: {position} ===")

        departments = self.data.get("company_structure", {}).get("departments", {})
        dept = departments.get(department, {})
        team_info = dept.get(team, {})

        team_info[position] = employee_info
        dept[team] = team_info
        departments[department] = dept
        self.data["company_structure"]["departments"] = departments

        print(f"  SUCCESS Added {position} to {department}.{team}")
        self._save_data()

    def update_contact_information(
        self, contact_type: str, contact_info: Dict[str, str]
    ):
        """Update contact information"""
        print(f"=== Updating {contact_type} Contact Information ===")

        if "contact_information" not in self.data:
            self.data["contact_information"] = {}

        self.data["contact_information"][contact_type] = contact_info
        print(f"  SUCCESS Updated {contact_type} contact information")
        self._save_data()

    def add_business_area(self, area_name: str, area_info: Dict[str, Any]):
        """Add new business area"""
        print(f"=== Adding Business Area: {area_name} ===")

        business_areas = self.data.get("business_areas", {})
        business_areas[area_name] = area_info
        self.data["business_areas"] = business_areas

        print(f"  SUCCESS Added business area: {area_name}")
        self._save_data()

    def update_technology_stack(self, category: str, technologies: list):
        """Update technology stack"""
        print(f"=== Updating Technology Stack: {category} ===")

        tech_stack = self.data.get("technology_stack", {})
        tech_stack[category] = technologies
        self.data["technology_stack"] = tech_stack

        print(f"  SUCCESS Updated {category} technologies: {technologies}")
        self._save_data()

    def generate_update_template(self):
        """Generate a template for ChatGPT data updates"""
        template = {
            "company_info": {
                "company_registration": "Your company registration number",
                "company_tax_id": "Your tax ID",
                "company_phone": "Your phone number",
                "company_founded": "YYYY-MM-DD",
                "company_headquarters": "City, State, Country",
                "company_address": "Full address",
                "company_city": "City name",
                "company_state": "State/Province",
                "company_country": "Country name",
                "company_postal_code": "Postal code",
                "company_timezone": "Timezone (e.g., UTC-5)",
            },
            "executive_team": {
                "ceo": {"name": "CEO Name", "phone": "CEO Phone"},
                "cto": {"name": "CTO Name", "phone": "CTO Phone"},
                "cfo": {"name": "CFO Name", "phone": "CFO Phone"},
                "coo": {"name": "COO Name", "phone": "COO Phone"},
                "cmo": {"name": "CMO Name", "phone": "CMO Phone"},
            },
            "departments": {
                "development_team": {
                    "frontend_team": {
                        "lead": "Frontend Lead Name",
                        "senior_developers": "Developer 1, Developer 2",
                        "developers": "Developer 3, Developer 4",
                        "ui_ux_designers": "Designer 1, Designer 2",
                    },
                    "backend_team": {
                        "lead": "Backend Lead Name",
                        "senior_developers": "Developer 1, Developer 2",
                        "developers": "Developer 3, Developer 4",
                        "devops_engineers": "DevOps 1, DevOps 2",
                    },
                }
            },
        }

        template_file = Path("chatgpt_update_template.json")
        with open(template_file, "w", encoding="utf-8") as f:
            json.dump(template, f, indent=2, ensure_ascii=False)

        print(f"SUCCESS Template saved to {template_file}")
        print("📝 Use this template to structure your ChatGPT data")

    def show_current_data(self, section: Optional[str] = None):
        """Show current company data"""
        if section:
            if section in self.data:
                print(f"=== Current {section} ===")
                print(json.dumps(self.data[section], indent=2, ensure_ascii=False))
            else:
                print(f"ERROR Section '{section}' not found")
        else:
            print("=== Current Company Data Structure ===")
            for key in self.data.keys():
                print(f"  📁 {key}")

    def validate_data(self):
        """Validate company data completeness"""
        print("=== Validating Company Data ===")

        company_info = self.data.get("company_information", {})
        missing_fields = []

        required_fields = [
            "company_registration",
            "company_tax_id",
            "company_phone",
            "company_founded",
            "company_headquarters",
            "company_address",
            "company_city",
            "company_state",
            "company_country",
            "company_postal_code",
            "company_timezone",
        ]

        for field in required_fields:
            if (
                field not in company_info
                or company_info[field] == "To be filled from ChatGPT data"
            ):
                missing_fields.append(field)

        if missing_fields:
            print("ERROR Missing or incomplete fields:")
            for field in missing_fields:
                print(f"  - {field}")
        else:
            print("SUCCESS All required fields are complete!")

        return len(missing_fields) == 0


def main():
    """Main function for the update script"""
    updater = CompanyDataUpdater()

    if len(sys.argv) < 2:
        print("Usage:")
        print("  python update_company_data.py template")
        print("  python update_company_data.py validate")
        print("  python update_company_data.py show [section]")
        print("  python update_company_data.py update-basic")
        print("  python update_company_data.py update-executives")
        print("  python update_company_data.py update-department")
        return

    command = sys.argv[1]

    if command == "template":
        updater.generate_update_template()

    elif command == "validate":
        updater.validate_data()

    elif command == "show":
        section = sys.argv[2] if len(sys.argv) > 2 else None
        updater.show_current_data(section)

    elif command == "update-basic":
        print("Enter company information (press Enter to skip):")
        updates = {}

        fields = [
            "company_registration",
            "company_tax_id",
            "company_phone",
            "company_founded",
            "company_headquarters",
            "company_address",
            "company_city",
            "company_state",
            "company_country",
            "company_postal_code",
            "company_timezone",
        ]

        for field in fields:
            value = input(f"{field}: ").strip()
            if value:
                updates[field] = value

        if updates:
            updater.update_basic_company_info(updates)
        else:
            print("No updates provided")

    elif command == "update-executives":
        print("Enter executive information (press Enter to skip):")
        updates = {}

        positions = ["ceo", "cto", "cfo", "coo", "cmo"]
        for position in positions:
            name = input(f"{position.upper()} name: ").strip()
            phone = input(f"{position.upper()} phone: ").strip()

            if name or phone:
                updates[position] = {}
                if name:
                    updates[position]["name"] = name
                if phone:
                    updates[position]["phone"] = phone

        if updates:
            updater.update_executive_team(updates)
        else:
            print("No updates provided")

    elif command == "update-department":
        if len(sys.argv) < 5:
            print(
                "Usage: python update_company_data.py update-department <department> <team> <position>"
            )
            return

        department = sys.argv[2]
        team = sys.argv[3]
        position = sys.argv[4]

        print(f"Enter information for {position} in {department}.{team}:")
        name = input("Name: ").strip()
        email = input("Email: ").strip()
        phone = input("Phone: ").strip()

        if name:
            employee_info = {"name": name}
            if email:
                employee_info["email"] = email
            if phone:
                employee_info["phone"] = phone

            updater.add_new_employee(department, team, position, employee_info)
        else:
            print("Name is required")


if __name__ == "__main__":
    main()
