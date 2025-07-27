#!/usr/bin/env python3
"""
EHB-5 AI Agents Interactive Test System
Test all AI agents and their functionality
"""

import time
from ai_agents import (
    DataProcessorAgent,
    ConfigManagerAgent,
    SecurityAgent,
    MonitoringAgent
)


class AIAgentsTester:
    def __init__(self):
        self.agents = {}
        self.test_results = []
        self.initialize_agents()

    def initialize_agents(self):
        """Initialize all AI agents"""
        print("🤖 Initializing AI Agents...")

        # Initialize core agents
        self.agents['data_processor'] = DataProcessorAgent()
        self.agents['config_manager'] = ConfigManagerAgent()
        self.agents['security'] = SecurityAgent()
        self.agents['monitoring'] = MonitoringAgent()

        print(f"✅ {len(self.agents)} agents initialized successfully")

    def test_all_agents(self):
        """Test all agents functionality"""
        print("\n" + "="*50)
        print("🧪 TESTING ALL AI AGENTS")
        print("="*50)

        for agent_name, agent in self.agents.items():
            print(f"\n🔍 Testing {agent.name}...")
            self.test_agent(agent_name, agent)

    def test_agent(self, agent_name, agent):
        """Test individual agent"""
        try:
            # Test agent status
            print(f"   📊 Status: {agent.status}")
            print(f"   📝 Description: {agent.description}")
            print(f"   ⏰ Last Activity: {agent.last_activity}")

            # Test specific agent functionality
            if agent_name == 'data_processor':
                self.test_data_processor(agent)
            elif agent_name == 'config_manager':
                self.test_config_manager(agent)
            elif agent_name == 'security':
                self.test_security_agent(agent)
            elif agent_name == 'monitoring':
                self.test_monitoring_agent(agent)

            print(f"   ✅ {agent.name} test completed successfully")

        except Exception as e:
            print(f"   ❌ {agent.name} test failed: {str(e)}")

    def test_data_processor(self, agent):
        """Test data processor agent"""
        print("   📊 Testing data processing...")

        # Test data analysis
        test_data = "This is test data for analysis"
        result = agent.analyze_data(test_data)
        print(f"   📈 Analysis result: {result.get('status', 'completed')}")

        # Test file processing
        test_file = "test_data.txt"
        with open(test_file, 'w') as f:
            f.write("Test file content for processing")

        result = agent.process_file(test_file)
        print(f"   📁 File processing: {result.get('file_size', 0)} bytes")

        # Cleanup
        import os
        if os.path.exists(test_file):
            os.remove(test_file)

    def test_config_manager(self, agent):
        """Test config manager agent"""
        print("   ⚙️ Testing configuration management...")

        # Test config validation
        test_config = {
            "project": "EHB-5",
            "version": "2.0.0",
            "settings": {
                "database": "enabled",
                "api": "active"
            }
        }

        result = agent.validate_config(test_config)
        is_valid = result.get('is_valid')
        print(f"   ✅ Config validation: {'Valid' if is_valid else 'Invalid'}")

        # Test settings sync
        result = agent.sync_settings(test_config)
        print(f"   🔄 Settings sync: {result.get('status', 'completed')}")

    def test_security_agent(self, agent):
        """Test security agent"""
        print("   🛡️ Testing security monitoring...")

        # Test threat detection
        system_data = {
            "failed_logins": 0,
            "api_errors": 2,
            "unauthorized_access": False
        }

        result = agent.detect_threats(system_data)
        threats = result.get('threats_detected', 0)
        print(f"   🚨 Threats detected: {threats}")

        # Test access audit with required parameters
        result = agent.audit_access("test_user", "login_attempt")
        print(f"   📋 Access audit: {result.get('status', 'completed')}")

    def test_monitoring_agent(self, agent):
        """Test monitoring agent"""
        print("   📊 Testing system monitoring...")

        # Test health check
        result = agent.check_system_health()
        health_score = result.get('performance_score', 0)
        print(f"   💚 Health score: {health_score}%")

        # Test performance monitoring
        result = agent.monitor_performance()
        print(f"   ⚡ Performance monitoring: {result.get('status', 'active')}")

    def interactive_test_menu(self):
        """Interactive test menu"""
        while True:
            print("\n" + "="*50)
            print("🎮 AI AGENTS INTERACTIVE TEST MENU")
            print("="*50)
            print("1. Test All Agents")
            print("2. Test Data Processor Agent")
            print("3. Test Config Manager Agent")
            print("4. Test Security Agent")
            print("5. Test Monitoring Agent")
            print("6. View Agent Status")
            print("7. Run Real-time Monitoring")
            print("8. Exit")

            choice = input("\nEnter your choice (1-8): ").strip()

            if choice == '1':
                self.test_all_agents()
            elif choice == '2':
                self.test_agent('data_processor',
                               self.agents['data_processor'])
            elif choice == '3':
                self.test_agent('config_manager',
                               self.agents['config_manager'])
            elif choice == '4':
                self.test_agent('security', self.agents['security'])
            elif choice == '5':
                self.test_agent('monitoring', self.agents['monitoring'])
            elif choice == '6':
                self.view_agent_status()
            elif choice == '7':
                self.run_realtime_monitoring()
            elif choice == '8':
                print("👋 Exiting AI Agents Test System...")
                break
            else:
                print("❌ Invalid choice. Please try again.")

    def view_agent_status(self):
        """View all agents status"""
        print("\n" + "="*50)
        print("📊 AGENT STATUS OVERVIEW")
        print("="*50)

        for agent_name, agent in self.agents.items():
            print(f"\n🤖 {agent.name}")
            print(f"   Status: {agent.status}")
            print(f"   Last Activity: {agent.last_activity}")
            print(f"   Tasks: {', '.join(agent.tasks)}")

    def run_realtime_monitoring(self):
        """Run real-time monitoring"""
        print("\n🔄 Starting real-time monitoring...")
        print("Press Ctrl+C to stop")

        try:
            for i in range(10):  # Monitor for 10 cycles
                print(f"\n📊 Monitoring Cycle {i+1}/10")

                # Check all agents
                for agent_name, agent in self.agents.items():
                    print(f"   {agent.name}: {agent.status}")

                # Simulate agent activity
                for agent_name, agent in self.agents.items():
                    agent.log_activity(f"Monitoring cycle {i+1}")

                time.sleep(2)  # Wait 2 seconds between cycles

        except KeyboardInterrupt:
            print("\n⏹️ Monitoring stopped by user")


def main():
    """Main function"""
    print("🚀 EHB-5 AI Agents Test System")
    print("="*50)

    tester = AIAgentsTester()

    # Run interactive menu
    tester.interactive_test_menu()


if __name__ == "__main__":
    main()
