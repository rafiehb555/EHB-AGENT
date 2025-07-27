#!/usr/bin/env python3
"""
Check Agents Status - Working vs Not Running
"""

import json
import os
import subprocess
import sys
from datetime import datetime


def check_agent_status(agent_path):
    """Check if an agent is working and running"""
    try:
        # Check if agent directory exists
        if not os.path.exists(agent_path):
            return {"status": "not_found", "working": False, "running": False}

        # Check for key files
        key_files = ["index.js", "main.js", "agent.js", "config.json", "package.json"]
        has_key_files = any(os.path.exists(os.path.join(agent_path, file)) for file in key_files)

        # Check for Python files
        python_files = ["agent.py", "main.py", "__init__.py"]
        has_python_files = any(os.path.exists(os.path.join(agent_path, file)) for file in python_files)

        # Check if agent is working (has proper structure)
        working = has_key_files or has_python_files

        # Check if agent is running (has active processes)
        running = check_running_processes(agent_path)

        return {
            "status": "active" if working else "inactive",
            "working": working,
            "running": running,
            "has_js_files": has_key_files,
            "has_python_files": has_python_files
        }

    except Exception as e:
        return {"status": "error", "working": False, "running": False, "error": str(e)}

def check_running_processes(agent_path):
    """Check if agent has running processes"""
    try:
        # Check for Node.js processes
        result = subprocess.run(["tasklist", "/FI", "IMAGENAME eq node.exe"],
                              capture_output=True, text=True, timeout=10)
        if result.returncode == 0 and "node.exe" in result.stdout:
            return True

        # Check for Python processes
        result = subprocess.run(["tasklist", "/FI", "IMAGENAME eq python.exe"],
                              capture_output=True, text=True, timeout=10)
        if result.returncode == 0 and "python.exe" in result.stdout:
            return True

        return False

    except Exception:
        return False

def test_agent_functionality(agent_path, agent_name):
    """Test agent functionality"""
    try:
        # Check for package.json
        package_json = os.path.join(agent_path, "package.json")
        if os.path.exists(package_json):
            with open(package_json, 'r') as f:
                package_data = json.load(f)
                return {
                    "has_package": True,
                    "name": package_data.get("name", agent_name),
                    "version": package_data.get("version", "unknown"),
                    "scripts": list(package_data.get("scripts", {}).keys())
                }

        # Check for Python files
        python_files = [f for f in os.listdir(agent_path) if f.endswith('.py')]
        if python_files:
            return {
                "has_package": False,
                "has_python": True,
                "python_files": python_files
            }

        return {"has_package": False, "has_python": False}

    except Exception as e:
        return {"error": str(e)}

def scan_all_agents():
    """Scan all agents and check their status"""
    print("🔍 Checking All Agents Status...")
    print("=" * 60)

    agents_status = []

    # Scan agents directory
    agents_dir = "agents"
    if os.path.exists(agents_dir):
        print(f"📁 Checking agents in: {agents_dir}")
        for item in os.listdir(agents_dir):
            item_path = os.path.join(agents_dir, item)
            if os.path.isdir(item_path):
                status = check_agent_status(item_path)
                functionality = test_agent_functionality(item_path, item)

                agents_status.append({
                    "name": item,
                    "type": "Agent Directory",
                    "path": item_path,
                    "status": status,
                    "functionality": functionality
                })

    # Scan ehb-agents directory
    ehb_agents_dir = "ehb-agents"
    if os.path.exists(ehb_agents_dir):
        print(f"📁 Checking agents in: {ehb_agents_dir}")
        for item in os.listdir(ehb_agents_dir):
            item_path = os.path.join(ehb_agents_dir, item)
            if os.path.isdir(item_path):
                status = check_agent_status(item_path)
                functionality = test_agent_functionality(item_path, item)

                agents_status.append({
                    "name": item,
                    "type": "EHB Agent Directory",
                    "path": item_path,
                    "status": status,
                    "functionality": functionality
                })

    # Scan ai_agents directory
    ai_agents_dir = "ai_agents"
    if os.path.exists(ai_agents_dir):
        print(f"📁 Checking agents in: {ai_agents_dir}")
        for item in os.listdir(ai_agents_dir):
            item_path = os.path.join(ai_agents_dir, item)
            if os.path.isdir(item_path):
                status = check_agent_status(item_path)
                functionality = test_agent_functionality(item_path, item)

                agents_status.append({
                    "name": item,
                    "type": "AI Agent Directory",
                    "path": item_path,
                    "status": status,
                    "functionality": functionality
                })

    return agents_status

def categorize_agents_by_status(agents):
    """Categorize agents by working and running status"""
    categories = {
        "working_and_running": [],
        "working_not_running": [],
        "not_working": [],
        "error": []
    }

    for agent in agents:
        status = agent["status"]

        if status["status"] == "error":
            categories["error"].append(agent)
        elif status["working"] and status["running"]:
            categories["working_and_running"].append(agent)
        elif status["working"] and not status["running"]:
            categories["working_not_running"].append(agent)
        else:
            categories["not_working"].append(agent)

    return categories

def generate_status_report(agents, categories):
    """Generate comprehensive status report"""
    print("\n" + "=" * 80)
    print("🤖 EHB AI DEVELOPMENT PROJECT - AGENTS STATUS REPORT")
    print("=" * 80)

    print(f"📅 Date: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"🎯 Total Agents: {len(agents)}")

    working_agents = len(categories["working_and_running"]) + len(categories["working_not_running"])
    running_agents = len(categories["working_and_running"])
    error_agents = len(categories["error"])

    print(f"✅ Working Agents: {working_agents}")
    print(f"🔄 Running Agents: {running_agents}")
    print(f"❌ Not Working: {len(categories['not_working'])}")
    print(f"⚠️  Errors: {error_agents}")

    print("\n📋 AGENTS BY STATUS:")

    # Working and Running
    if categories["working_and_running"]:
        print(f"\n🟢 WORKING AND RUNNING ({len(categories['working_and_running'])} agents):")
        for agent in categories["working_and_running"]:
            print(f"  ✅ {agent['name']} ({agent['type']})")
            if agent['functionality'].get('name'):
                print(f"    📦 Package: {agent['functionality']['name']} v{agent['functionality']['version']}")
            if agent['functionality'].get('scripts'):
                print(f"    🚀 Scripts: {', '.join(agent['functionality']['scripts'])}")

    # Working but Not Running
    if categories["working_not_running"]:
        print(f"\n🟡 WORKING BUT NOT RUNNING ({len(categories['working_not_running'])} agents):")
        for agent in categories["working_not_running"]:
            print(f"  ⚠️  {agent['name']} ({agent['type']})")
            if agent['functionality'].get('name'):
                print(f"    📦 Package: {agent['functionality']['name']} v{agent['functionality']['version']}")
            if agent['functionality'].get('scripts'):
                print(f"    🚀 Scripts: {', '.join(agent['functionality']['scripts'])}")

    # Not Working
    if categories["not_working"]:
        print(f"\n🔴 NOT WORKING ({len(categories['not_working'])} agents):")
        for agent in categories["not_working"]:
            print(f"  ❌ {agent['name']} ({agent['type']})")
            if agent['status'].get('error'):
                print(f"    🚨 Error: {agent['status']['error']}")

    # Errors
    if categories["error"]:
        print(f"\n🚨 ERRORS ({len(categories['error'])} agents):")
        for agent in categories["error"]:
            print(f"  💥 {agent['name']} ({agent['type']})")
            if agent['status'].get('error'):
                print(f"    🚨 Error: {agent['status']['error']}")

    print("\n📊 DETAILED STATUS BREAKDOWN:")
    for agent in agents:
        status = agent["status"]
        print(f"  {agent['name']}:")
        print(f"    Status: {status['status']}")
        print(f"    Working: {'✅' if status['working'] else '❌'}")
        print(f"    Running: {'✅' if status['running'] else '❌'}")
        if status.get('has_js_files'):
            print(f"    Has JS Files: ✅")
        if status.get('has_python_files'):
            print(f"    Has Python Files: ✅")

    print("\n" + "=" * 80)
    print("🎯 STATUS SUMMARY:")
    print(f"✅ Working Agents: {working_agents}/{len(agents)} ({round((working_agents/len(agents))*100, 1)}%)")
    print(f"🔄 Running Agents: {running_agents}/{len(agents)} ({round((running_agents/len(agents))*100, 1)}%)")
    print(f"❌ Not Working: {len(categories['not_working'])}/{len(agents)} ({round((len(categories['not_working'])/len(agents))*100, 1)}%)")
    print(f"⚠️  Errors: {error_agents}/{len(agents)} ({round((error_agents/len(agents))*100, 1)}%)")

    if working_agents > len(agents) * 0.8:
        print("🎉 EXCELLENT! Most agents are working!")
    elif working_agents > len(agents) * 0.5:
        print("👍 GOOD! Most agents are working!")
    else:
        print("⚠️  NEEDS ATTENTION! Many agents are not working!")

    print("=" * 80)

    # Save detailed report
    report = {
        "timestamp": datetime.now().isoformat(),
        "project_name": "EHB AI Development System",
        "total_agents": len(agents),
        "working_agents": working_agents,
        "running_agents": running_agents,
        "not_working_agents": len(categories["not_working"]),
        "error_agents": error_agents,
        "categories": categories,
        "agents": agents
    }

    with open("agents_status_report.json", "w") as f:
        json.dump(report, f, indent=2)

    print(f"\n📄 Detailed report saved to: agents_status_report.json")

def main():
    """Main function to check agents status"""
    print("🤖 EHB AI Development Project - Agents Status Check")
    print("=" * 60)

    # Scan all agents
    agents = scan_all_agents()

    if not agents:
        print("❌ No agents found in the project!")
        return

    # Categorize by status
    categories = categorize_agents_by_status(agents)

    # Generate report
    generate_status_report(agents, categories)

    print("\n🎉 Agents Status Check Complete!")
    print("🚀 EHB AI Development System agents status verified!")

if __name__ == "__main__":
    main()
