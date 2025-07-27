#!/usr/bin/env python3
"""
List All Agents in EHB AI Development Project
"""

import json
import os
from datetime import datetime


def scan_agents_directory():
    """Scan agents directory and list all agents"""
    print("🔍 Scanning EHB AI Development Project for Agents...")
    print("=" * 60)

    agents_found = []

    # Scan agents directory
    agents_dir = "agents"
    if os.path.exists(agents_dir):
        print(f"📁 Scanning directory: {agents_dir}")
        for item in os.listdir(agents_dir):
            item_path = os.path.join(agents_dir, item)
            if os.path.isdir(item_path):
                agents_found.append({
                    "name": item,
                    "type": "Agent Directory",
                    "path": item_path,
                    "files": os.listdir(item_path) if os.path.exists(item_path) else []
                })

    # Scan ehb-agents directory
    ehb_agents_dir = "ehb-agents"
    if os.path.exists(ehb_agents_dir):
        print(f"📁 Scanning directory: {ehb_agents_dir}")
        for item in os.listdir(ehb_agents_dir):
            item_path = os.path.join(ehb_agents_dir, item)
            if os.path.isdir(item_path):
                agents_found.append({
                    "name": item,
                    "type": "EHB Agent Directory",
                    "path": item_path,
                    "files": os.listdir(item_path) if os.path.exists(item_path) else []
                })

    # Scan ai_agents directory
    ai_agents_dir = "ai_agents"
    if os.path.exists(ai_agents_dir):
        print(f"📁 Scanning directory: {ai_agents_dir}")
        for item in os.listdir(ai_agents_dir):
            item_path = os.path.join(ai_agents_dir, item)
            if os.path.isdir(item_path):
                agents_found.append({
                    "name": item,
                    "type": "AI Agent Directory",
                    "path": item_path,
                    "files": os.listdir(item_path) if os.path.exists(item_path) else []
                })

    return agents_found

def categorize_agents(agents):
    """Categorize agents by type and functionality"""
    categories = {
        "core_agents": [],
        "healthcare_agents": [],
        "development_agents": [],
        "ai_agents": [],
        "deployment_agents": [],
        "security_agents": [],
        "testing_agents": [],
        "monitoring_agents": [],
        "utility_agents": []
    }

    for agent in agents:
        name = agent["name"].lower()

        # Core agents
        if any(keyword in name for keyword in ["base", "core", "main", "primary"]):
            categories["core_agents"].append(agent)

        # Healthcare agents
        elif any(keyword in name for keyword in ["health", "medical", "fhir", "hl7", "hipaa", "patient", "clinical"]):
            categories["healthcare_agents"].append(agent)

        # Development agents
        elif any(keyword in name for keyword in ["dev", "development", "frontend", "backend", "fullstack", "code"]):
            categories["development_agents"].append(agent)

        # AI agents
        elif any(keyword in name for keyword in ["ai", "ml", "model", "neural", "intelligence", "learning"]):
            categories["ai_agents"].append(agent)

        # Deployment agents
        elif any(keyword in name for keyword in ["deploy", "docker", "kubernetes", "aws", "azure", "cloud"]):
            categories["deployment_agents"].append(agent)

        # Security agents
        elif any(keyword in name for keyword in ["security", "auth", "encrypt", "compliance", "audit"]):
            categories["security_agents"].append(agent)

        # Testing agents
        elif any(keyword in name for keyword in ["test", "testing", "qa", "quality"]):
            categories["testing_agents"].append(agent)

        # Monitoring agents
        elif any(keyword in name for keyword in ["monitor", "watchdog", "alert", "log", "track"]):
            categories["monitoring_agents"].append(agent)

        # Utility agents
        else:
            categories["utility_agents"].append(agent)

    return categories

def generate_agents_report(agents, categories):
    """Generate comprehensive agents report"""
    print("\n" + "=" * 80)
    print("🤖 EHB AI DEVELOPMENT PROJECT - AGENTS INVENTORY")
    print("=" * 80)

    print(f"📅 Date: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"🎯 Total Agents Found: {len(agents)}")

    total_agents = len(agents)
    categorized_agents = sum(len(cat) for cat in categories.values())

    print(f"📊 Categorized Agents: {categorized_agents}")
    print(f"📈 Categorization Rate: {round((categorized_agents / total_agents) * 100, 1)}%")

    print("\n📋 AGENTS BY CATEGORY:")

    for category_name, category_agents in categories.items():
        if category_agents:
            print(f"\n🔹 {category_name.replace('_', ' ').title()} ({len(category_agents)} agents):")
            for agent in category_agents:
                print(f"  ✅ {agent['name']} ({agent['type']})")
                if agent['files']:
                    print(f"    📁 Files: {', '.join(agent['files'][:5])}{'...' if len(agent['files']) > 5 else ''}")

    print("\n📋 ALL AGENTS LIST:")
    for i, agent in enumerate(agents, 1):
        print(f"  {i:2d}. {agent['name']} ({agent['type']})")
        if agent['files']:
            print(f"      📁 Files: {', '.join(agent['files'][:3])}{'...' if len(agent['files']) > 3 else ''}")

    print("\n" + "=" * 80)
    print("🎯 AGENTS SUMMARY:")
    print(f"✅ Total Agents: {total_agents}")
    print(f"📊 Categorized: {categorized_agents}")
    print(f"📈 Categorization Rate: {round((categorized_agents / total_agents) * 100, 1)}%")

    if total_agents > 0:
        print("🎉 SUCCESS! Multiple agents found in EHB AI Development System!")
    else:
        print("⚠️  No agents found. System may need agent setup.")

    print("=" * 80)

    # Save detailed report
    report = {
        "timestamp": datetime.now().isoformat(),
        "project_name": "EHB AI Development System",
        "total_agents": total_agents,
        "categorized_agents": categorized_agents,
        "categorization_rate": round((categorized_agents / total_agents) * 100, 1) if total_agents > 0 else 0,
        "agents": agents,
        "categories": categories
    }

    with open("agents_inventory_report.json", "w") as f:
        json.dump(report, f, indent=2)

    print(f"\n📄 Detailed report saved to: agents_inventory_report.json")

    return report

def main():
    """Main function to scan and report agents"""
    print("🤖 EHB AI Development Project - Agents Inventory")
    print("=" * 60)

    # Scan for agents
    agents = scan_agents_directory()

    if not agents:
        print("❌ No agents found in the project!")
        return

    # Categorize agents
    categories = categorize_agents(agents)

    # Generate report
    report = generate_agents_report(agents, categories)

    print("\n🎉 Agents Inventory Complete!")
    print("🚀 EHB AI Development System agents are ready!")

if __name__ == "__main__":
    main()
