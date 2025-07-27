#!/usr/bin/env python3
"""
Test EHB AI Agent Integration
Test script for EHB AI Agent integration with all EHB services
"""

import asyncio
import json
import sys
from datetime import datetime
from typing import Any, Dict

# Import the integration module
try:
    from ehb_ai_service_integration import EHBServiceIntegration
except ImportError:
    print("❌ Error: Could not import EHBServiceIntegration")
    sys.exit(1)

class EHB_AI_Integration_Test:
    """Test class for EHB AI integration"""
    
    def __init__(self):
        self.integration = EHBServiceIntegration()
        self.test_results = {}
        self.passed_tests = 0
        self.total_tests = 0
    
    def log_test(self, test_name: str, result: bool, details: str = ""):
        """Log test result"""
        self.total_tests += 1
        if result:
            self.passed_tests += 1
            print(f"✅ {test_name}: PASSED")
        else:
            print(f"❌ {test_name}: FAILED")
            if details:
                print(f"   Details: {details}")
        
        self.test_results[test_name] = {
            "passed": result,
            "details": details,
            "timestamp": datetime.now().isoformat()
        }
    
    async def test_service_connectivity(self) -> bool:
        """Test connectivity to EHB services"""
        print("🔗 Testing EHB service connectivity...")
        
        try:
            await self.integration.initialize_session()
            
            # Test each service endpoint
            services = ["patients", "appointments", "telemedicine", "analytics"]
            all_connected = True
            
            for service in services:
                try:
                    url = self.integration.services[service]
                    async with self.integration.session.get(url) as response:
                        if response.status == 200:
                            print(f"   ✅ {service}: Connected")
                        else:
                            print(f"   ❌ {service}: Status {response.status}")
                            all_connected = False
                except Exception as e:
                    print(f"   ❌ {service}: Connection failed - {e}")
                    all_connected = False
            
            await self.integration.close_session()
            return all_connected
            
        except Exception as e:
            print(f"❌ Service connectivity test failed: {e}")
            return False
    
    async def test_patient_analysis(self) -> bool:
        """Test patient data analysis"""
        print("🔍 Testing patient data analysis...")
        
        try:
            # Test with sample patient data
            result = await self.integration.analyze_patient_data("test_patient_001")
            
            if "error" not in result:
                required_fields = ["risk_factors", "treatment_recommendations", "compliance_status"]
                all_fields_present = all(field in result for field in required_fields)
                
                if all_fields_present:
                    print(f"   ✅ Analysis completed with {len(result.get('risk_factors', []))} risk factors")
                    return True
                else:
                    print(f"   ❌ Missing required fields: {[f for f in required_fields if f not in result]}")
                    return False
            else:
                print(f"   ❌ Analysis failed: {result['error']}")
                return False
                
        except Exception as e:
            print(f"❌ Patient analysis test failed: {e}")
            return False
    
    async def test_appointment_optimization(self) -> bool:
        """Test appointment optimization"""
        print("📅 Testing appointment optimization...")
        
        try:
            result = await self.integration.optimize_appointments()
            
            if "error" not in result:
                required_fields = ["schedule_optimization", "resource_allocation", "patient_satisfaction"]
                all_fields_present = all(field in result for field in required_fields)
                
                if all_fields_present:
                    print(f"   ✅ Optimization completed successfully")
                    return True
                else:
                    print(f"   ❌ Missing required fields: {[f for f in required_fields if f not in result]}")
                    return False
            else:
                print(f"   ❌ Optimization failed: {result['error']}")
                return False
                
        except Exception as e:
            print(f"❌ Appointment optimization test failed: {e}")
            return False
    
    async def test_telemedicine_enhancement(self) -> bool:
        """Test telemedicine enhancement"""
        print("🏥 Testing telemedicine enhancement...")
        
        try:
            result = await self.integration.enhance_telemedicine()
            
            if "error" not in result:
                required_fields = ["ai_diagnosis_support", "video_quality_optimization", "patient_triage"]
                all_fields_present = all(field in result for field in required_fields)
                
                if all_fields_present:
                    print(f"   ✅ Telemedicine enhancement completed")
                    return True
                else:
                    print(f"   ❌ Missing required fields: {[f for f in required_fields if f not in result]}")
                    return False
            else:
                print(f"   ❌ Telemedicine enhancement failed: {result['error']}")
                return False
                
        except Exception as e:
            print(f"❌ Telemedicine enhancement test failed: {e}")
            return False
    
    async def test_analytics_generation(self) -> bool:
        """Test analytics generation"""
        print("📊 Testing analytics generation...")
        
        try:
            result = await self.integration.generate_ai_analytics()
            
            if "error" not in result:
                required_fields = ["performance_metrics", "predictive_analytics", "compliance_reports"]
                all_fields_present = all(field in result for field in required_fields)
                
                if all_fields_present:
                    print(f"   ✅ Analytics generation completed")
                    return True
                else:
                    print(f"   ❌ Missing required fields: {[f for f in required_fields if f not in result]}")
                    return False
            else:
                print(f"   ❌ Analytics generation failed: {result['error']}")
                return False
                
        except Exception as e:
            print(f"❌ Analytics generation test failed: {e}")
            return False
    
    async def test_full_integration(self) -> bool:
        """Test complete integration"""
        print("🚀 Testing complete EHB AI integration...")
        
        try:
            result = await self.integration.integrate_all_services()
            
            if "error" not in result:
                required_fields = ["patient_analysis", "appointment_optimization", "telemedicine_enhancement", "ai_analytics"]
                all_fields_present = all(field in result for field in required_fields)
                
                if all_fields_present:
                    print(f"   ✅ Complete integration successful")
                    return True
                else:
                    print(f"   ❌ Missing required fields: {[f for f in required_fields if f not in result]}")
                    return False
            else:
                print(f"   ❌ Complete integration failed: {result['error']}")
                return False
                
        except Exception as e:
            print(f"❌ Complete integration test failed: {e}")
            return False
    
    def save_test_report(self):
        """Save test report"""
        report = {
            "test_summary": {
                "total_tests": self.total_tests,
                "passed_tests": self.passed_tests,
                "failed_tests": self.total_tests - self.passed_tests,
                "success_rate": f"{(self.passed_tests / self.total_tests * 100):.1f}%" if self.total_tests > 0 else "0%"
            },
            "test_results": self.test_results,
            "timestamp": datetime.now().isoformat()
        }
        
        report_file = f"agents/reports/ai_integration_test_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        
        try:
            with open(report_file, 'w') as f:
                json.dump(report, f, indent=2)
            print(f"💾 Test report saved to {report_file}")
        except Exception as e:
            print(f"❌ Error saving test report: {e}")
    
    async def run_all_tests(self):
        """Run all integration tests"""
        print("🧪 EHB AI Integration Test Suite")
        print("=" * 40)
        
        # Run all tests
        tests = [
            ("Service Connectivity", self.test_service_connectivity),
            ("Patient Analysis", self.test_patient_analysis),
            ("Appointment Optimization", self.test_appointment_optimization),
            ("Telemedicine Enhancement", self.test_telemedicine_enhancement),
            ("Analytics Generation", self.test_analytics_generation),
            ("Complete Integration", self.test_full_integration)
        ]
        
        for test_name, test_func in tests:
            print(f"\n📋 Running: {test_name}")
            result = await test_func()
            self.log_test(test_name, result)
        
        # Print summary
        print("\n" + "=" * 40)
        print("📊 Test Summary:")
        print(f"   Total Tests: {self.total_tests}")
        print(f"   Passed: {self.passed_tests}")
        print(f"   Failed: {self.total_tests - self.passed_tests}")
        print(f"   Success Rate: {(self.passed_tests / self.total_tests * 100):.1f}%" if self.total_tests > 0 else "0%")
        
        if self.passed_tests == self.total_tests:
            print("🎉 All tests passed! EHB AI integration is working correctly.")
        else:
            print("⚠️ Some tests failed. Please check the integration setup.")
        
        # Save test report
        self.save_test_report()

async def main():
    """Main test function"""
    tester = EHB_AI_Integration_Test()
    await tester.run_all_tests()

if __name__ == "__main__":
    asyncio.run(main()) 