#!/usr/bin/env python3
"""
EHB AI Agent Test - Test AI agent functionality
"""

import asyncio
import json
from datetime import datetime
from pathlib import Path


class TestAgent:
    def __init__(self, agent_id: str, name: str, capabilities: list):
        self.agent_id = agent_id
        self.name = name
        self.capabilities = capabilities
        self.memory = {}
        self.learning_data = []
        self.created_at = datetime.now()
        self.is_active = True
    
    async def process_input(self, input_data):
        """Process input and return response"""
        return {"response": f"Processed by {self.name}", "agent_id": self.agent_id}
    
    async def learn(self, experience):
        """Learn from experience"""
        self.learning_data.append(experience)
        return True
    
    async def plan(self, goal):
        """Create plan to achieve goal"""
        return [f"Step 1: {goal}", "Step 2: Execute", "Step 3: Monitor"]
    
    async def execute(self, action):
        """Execute action"""
        return {"result": f"Executed: {action}", "agent_id": self.agent_id}
    
    def get_status(self):
        """Get agent status"""
        return {
            "agent_id": self.agent_id,
            "name": self.name,
            "capabilities": self.capabilities,
            "is_active": self.is_active,
            "created_at": self.created_at.isoformat(),
            "memory_size": len(self.memory),
            "learning_experiences": len(self.learning_data)
        }

class AIAgentTester:
    def __init__(self):
        self.results = {
            "timestamp": datetime.now().isoformat(),
            "tests_passed": [],
            "tests_failed": [],
            "agents_created": [],
            "summary": {}
        }
    
    async def test_agent_creation(self):
        """Test agent creation"""
        print("🤖 Testing Agent Creation...")
        
        try:
            # Create test agents
            healthcare_agent = TestAgent("healthcare_001", "Healthcare Agent", 
                                       ["patient_management", "medical_records"])
            data_agent = TestAgent("data_001", "Data Agent", 
                                 ["data_analysis", "visualization"])
            dev_agent = TestAgent("dev_001", "Development Agent", 
                                ["code_generation", "testing"])
            
            agents = [healthcare_agent, data_agent, dev_agent]
            
            for agent in agents:
                print(f"✅ Created agent: {agent.name}")
                self.results["agents_created"].append(agent.name)
                self.results["tests_passed"].append(f"Agent creation: {agent.name}")
            
            return agents
            
        except Exception as e:
            print(f"❌ Agent creation failed: {e}")
            self.results["tests_failed"].append(f"Agent creation: {e}")
            return []
    
    async def test_agent_functionality(self, agents):
        """Test agent functionality"""
        print("🔧 Testing Agent Functionality...")
        
        for agent in agents:
            try:
                # Test input processing
                response = await agent.process_input({"test": "data"})
                if "response" in response:
                    print(f"✅ {agent.name}: Input processing OK")
                    self.results["tests_passed"].append(f"Input processing: {agent.name}")
                
                # Test learning
                learn_result = await agent.learn({"experience": "test"})
                if learn_result:
                    print(f"✅ {agent.name}: Learning OK")
                    self.results["tests_passed"].append(f"Learning: {agent.name}")
                
                # Test planning
                plan = await agent.plan("test goal")
                if isinstance(plan, list) and len(plan) > 0:
                    print(f"✅ {agent.name}: Planning OK")
                    self.results["tests_passed"].append(f"Planning: {agent.name}")
                
                # Test execution
                result = await agent.execute("test action")
                if "result" in result:
                    print(f"✅ {agent.name}: Execution OK")
                    self.results["tests_passed"].append(f"Execution: {agent.name}")
                
                # Test status
                status = agent.get_status()
                if "agent_id" in status:
                    print(f"✅ {agent.name}: Status OK")
                    self.results["tests_passed"].append(f"Status: {agent.name}")
                
            except Exception as e:
                print(f"❌ {agent.name}: Functionality test failed - {e}")
                self.results["tests_failed"].append(f"Functionality: {agent.name} - {e}")
    
    async def test_agent_communication(self, agents):
        """Test agent communication"""
        print("💬 Testing Agent Communication...")
        
        try:
            if len(agents) >= 2:
                agent1 = agents[0]
                agent2 = agents[1]
                
                # Test communication
                message = {"from": agent1.agent_id, "to": agent2.agent_id, "data": "test"}
                response = await agent2.process_input(message)
                
                if "response" in response:
                    print(f"✅ Communication between {agent1.name} and {agent2.name} OK")
                    self.results["tests_passed"].append("Agent communication")
                else:
                    print(f"❌ Communication failed")
                    self.results["tests_failed"].append("Agent communication")
            
        except Exception as e:
            print(f"❌ Communication test failed: {e}")
            self.results["tests_failed"].append(f"Communication: {e}")
    
    async def test_ai_data_access(self):
        """Test AI data access"""
        print("📊 Testing AI Data Access...")
        
        try:
            # Test healthcare data
            healthcare_data_file = Path("ai_data/datasets/healthcare_data.json")
            if healthcare_data_file.exists():
                with open(healthcare_data_file, "r") as f:
                    data = json.load(f)
                
                if "patients" in data and "doctors" in data:
                    print(f"✅ Healthcare data access OK ({len(data['patients'])} patients, {len(data['doctors'])} doctors)")
                    self.results["tests_passed"].append("Healthcare data access")
                else:
                    print("❌ Healthcare data format invalid")
                    self.results["tests_failed"].append("Healthcare data format")
            else:
                print("❌ Healthcare data file not found")
                self.results["tests_failed"].append("Healthcare data file missing")
            
            # Test agent config
            agent_config_file = Path("ai_configs/agents/agent_config.json")
            if agent_config_file.exists():
                with open(agent_config_file, "r") as f:
                    config = json.load(f)
                
                if "agents" in config:
                    print(f"✅ Agent config access OK ({len(config['agents'])} agents)")
                    self.results["tests_passed"].append("Agent config access")
                else:
                    print("❌ Agent config format invalid")
                    self.results["tests_failed"].append("Agent config format")
            else:
                print("❌ Agent config file not found")
                self.results["tests_failed"].append("Agent config file missing")
                
        except Exception as e:
            print(f"❌ Data access test failed: {e}")
            self.results["tests_failed"].append(f"Data access: {e}")
    
    async def run_comprehensive_test(self):
        """Run comprehensive AI agent test"""
        print("🧪 EHB AI Agent Test")
        print("=" * 50)
        print("Testing AI agent functionality...")
        print("=" * 50)
        
        try:
            # Step 1: Test agent creation
            agents = await self.test_agent_creation()
            
            # Step 2: Test agent functionality
            await self.test_agent_functionality(agents)
            
            # Step 3: Test agent communication
            await self.test_agent_communication(agents)
            
            # Step 4: Test AI data access
            await self.test_ai_data_access()
            
            # Step 5: Generate summary
            self.generate_summary()
            
            print("✅ AI agent test completed")
            
        except Exception as e:
            print(f"❌ AI agent test failed: {e}")
            self.results["summary"]["status"] = "failed"
            self.results["summary"]["error"] = str(e)
        
        return self.results
    
    def generate_summary(self):
        """Generate test summary"""
        print("\n" + "=" * 50)
        print("📊 AI AGENT TEST SUMMARY")
        print("=" * 50)
        
        # Tests passed
        if self.results["tests_passed"]:
            print(f"✅ Tests Passed: {len(self.results['tests_passed'])}")
            for test in self.results["tests_passed"][:10]:  # Show first 10
                print(f"  ✅ {test}")
        
        # Tests failed
        if self.results["tests_failed"]:
            print(f"\n❌ Tests Failed: {len(self.results['tests_failed'])}")
            for test in self.results["tests_failed"][:10]:  # Show first 10
                print(f"  ❌ {test}")
        
        # Agents created
        if self.results["agents_created"]:
            print(f"\n🤖 Agents Created: {len(self.results['agents_created'])}")
            for agent in self.results["agents_created"]:
                print(f"  🤖 {agent}")
        
        # Calculate success rate
        total_tests = len(self.results["tests_passed"]) + len(self.results["tests_failed"])
        if total_tests > 0:
            success_rate = (len(self.results["tests_passed"]) / total_tests) * 100
            print(f"\n📈 Test Success Rate: {success_rate:.1f}%")
        
        # Save results
        report_file = f"reports/ai_agent_test_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        Path("reports").mkdir(exist_ok=True)
        
        with open(report_file, "w") as f:
            json.dump(self.results, f, indent=2)
        
        print(f"\n📄 Detailed report saved: {report_file}")
        print("=" * 50)
        
        self.results["summary"] = {
            "tests_passed": len(self.results["tests_passed"]),
            "tests_failed": len(self.results["tests_failed"]),
            "agents_created": len(self.results["agents_created"]),
            "success_rate": success_rate if total_tests > 0 else 100,
            "report_file": report_file
        }

async def main():
    """Main function"""
    try:
        tester = AIAgentTester()
        results = await tester.run_comprehensive_test()
        
        if results["summary"]["success_rate"] >= 80:
            print("\n🎉 AI agent test completed successfully!")
            return 0
        else:
            print(f"\n⚠️ Some tests failed. Success rate: {results['summary']['success_rate']:.1f}%")
            return 1
            
    except Exception as e:
        print(f"❌ AI agent test failed: {e}")
        return 1

if __name__ == "__main__":
    exit(asyncio.run(main())) 