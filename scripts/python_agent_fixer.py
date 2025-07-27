#!/usr/bin/env python3
"""
Python Agent Error Fixer
Detects and fixes common Python execution issues
"""

import os
import sys
import subprocess
import json
import time
import logging
from pathlib import Path
from datetime import datetime

class PythonAgentFixer:
    def __init__(self):
        self.setup_logging()
        self.errors_found = []
        self.fixes_applied = []
        self.results = {
            "python_issues": [],
            "module_issues": [],
            "execution_issues": [],
            "fixes_applied": []
        }
        
    def setup_logging(self):
        """Setup logging"""
        logging.basicConfig(
            level=logging.INFO,
            format='%(asctime)s - %(levelname)s - %(message)s',
            handlers=[
                logging.FileHandler('python_agent_fixer.log', encoding='utf-8'),
                logging.StreamHandler()
            ]
        )
        self.logger = logging.getLogger(__name__)
    
    def check_python_basic_execution(self):
        """Check basic Python execution"""
        self.logger.info("🔍 Checking basic Python execution...")
        
        tests = [
            ("Basic print", 'print("Hello World")'),
            ("Import sys", 'import sys; print("Python version:", sys.version)'),
            ("Import os", 'import os; print("Current directory:", os.getcwd())'),
            ("Import json", 'import json; print("JSON module working")'),
            ("Import subprocess", 'import subprocess; print("Subprocess module working")'),
            ("Import pathlib", 'from pathlib import Path; print("Pathlib module working")'),
            ("Import logging", 'import logging; print("Logging module working")'),
            ("Import datetime", 'from datetime import datetime; print("Datetime module working")'),
        ]
        
        for test_name, test_code in tests:
            try:
                result = subprocess.run([
                    sys.executable, "-c", test_code
                ], capture_output=True, text=True, timeout=10)
                
                if result.returncode == 0:
                    self.logger.info(f"✅ {test_name}: PASS")
                else:
                    self.logger.error(f"❌ {test_name}: FAIL - {result.stderr}")
                    self.errors_found.append(f"{test_name}: {result.stderr}")
                    
            except subprocess.TimeoutExpired:
                self.logger.error(f"❌ {test_name}: TIMEOUT")
                self.errors_found.append(f"{test_name}: Timeout")
            except Exception as e:
                self.logger.error(f"❌ {test_name}: ERROR - {e}")
                self.errors_found.append(f"{test_name}: {e}")
    
    def check_common_modules(self):
        """Check common modules that might cause issues"""
        self.logger.info("🔍 Checking common modules...")
        
        modules_to_check = [
            "flask", "pytest", "requests", "numpy", "pandas", 
            "openai", "pymongo", "boto3", "docker", "kubernetes",
            "sqlalchemy", "redis", "celery", "fastapi", "uvicorn"
        ]
        
        for module in modules_to_check:
            try:
                result = subprocess.run([
                    sys.executable, "-c", f"import {module}; print('{module} imported successfully')"
                ], capture_output=True, text=True, timeout=10)
                
                if result.returncode == 0:
                    self.logger.info(f"✅ {module}: Available")
                else:
                    self.logger.warning(f"⚠️ {module}: Not available - {result.stderr}")
                    self.results["module_issues"].append(f"{module}: {result.stderr}")
                    
            except subprocess.TimeoutExpired:
                self.logger.error(f"❌ {module}: TIMEOUT")
                self.results["module_issues"].append(f"{module}: Timeout")
            except Exception as e:
                self.logger.error(f"❌ {module}: ERROR - {e}")
                self.results["module_issues"].append(f"{module}: {e}")
    
    def check_execution_environment(self):
        """Check execution environment issues"""
        self.logger.info("🔍 Checking execution environment...")
        
        # Check Python path
        python_path = sys.executable
        self.logger.info(f"Python path: {python_path}")
        
        # Check working directory
        working_dir = os.getcwd()
        self.logger.info(f"Working directory: {working_dir}")
        
        # Check environment variables
        env_vars = ["PATH", "PYTHONPATH", "PYTHONHOME", "PYTHONUNBUFFERED"]
        for var in env_vars:
            value = os.getenv(var)
            if value:
                self.logger.info(f"{var}: {value}")
            else:
                self.logger.info(f"{var}: Not set")
        
        # Check file permissions
        try:
            test_file = Path("test_permissions.py")
            test_file.write_text("print('Permission test')")
            result = subprocess.run([sys.executable, str(test_file)], 
                                  capture_output=True, text=True, timeout=10)
            test_file.unlink()  # Clean up
            
            if result.returncode == 0:
                self.logger.info("✅ File execution permissions: OK")
            else:
                self.logger.error(f"❌ File execution permissions: FAIL - {result.stderr}")
                self.results["execution_issues"].append(f"File permissions: {result.stderr}")
                
        except Exception as e:
            self.logger.error(f"❌ File execution test failed: {e}")
            self.results["execution_issues"].append(f"File execution: {e}")
    
    def fix_common_issues(self):
        """Fix common Python execution issues"""
        self.logger.info("🔧 Fixing common issues...")
        
        # Fix 1: Set PYTHONUNBUFFERED
        os.environ["PYTHONUNBUFFERED"] = "1"
        self.fixes_applied.append("Set PYTHONUNBUFFERED=1")
        
        # Fix 2: Set PYTHONPATH if not set
        if not os.getenv("PYTHONPATH"):
            current_dir = os.getcwd()
            os.environ["PYTHONPATH"] = current_dir
            self.fixes_applied.append(f"Set PYTHONPATH={current_dir}")
        
        # Fix 3: Install missing packages
        missing_modules = [issue.split(":")[0] for issue in self.results["module_issues"]]
        if missing_modules:
            self.install_missing_packages(missing_modules)
    
    def install_missing_packages(self, packages):
        """Install missing packages"""
        self.logger.info(f"📦 Installing missing packages: {packages}")
        
        for package in packages:
            try:
                result = subprocess.run([
                    sys.executable, "-m", "pip", "install", package
                ], capture_output=True, text=True, timeout=60)
                
                if result.returncode == 0:
                    self.logger.info(f"✅ Installed {package}")
                    self.fixes_applied.append(f"Installed {package}")
                else:
                    self.logger.error(f"❌ Failed to install {package}: {result.stderr}")
                    
            except subprocess.TimeoutExpired:
                self.logger.error(f"❌ Timeout installing {package}")
            except Exception as e:
                self.logger.error(f"❌ Error installing {package}: {e}")
    
    def create_robust_python_script(self):
        """Create a robust Python script template"""
        self.logger.info("📝 Creating robust Python script template...")
        
        robust_script = '''#!/usr/bin/env python3
"""
Robust Python Script Template
Handles common execution issues
"""

import os
import sys
import subprocess
import json
import time
import logging
from pathlib import Path
from datetime import datetime

# Set environment variables for better execution
os.environ["PYTHONUNBUFFERED"] = "1"
os.environ["PYTHONIOENCODING"] = "utf-8"

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('script.log', encoding='utf-8'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

def safe_execute(func, *args, **kwargs):
    """Safely execute a function with error handling"""
    try:
        return func(*args, **kwargs)
    except Exception as e:
        logger.error(f"Error in {func.__name__}: {e}")
        return None

def safe_subprocess_run(command, timeout=30):
    """Safely run subprocess with timeout"""
    try:
        result = subprocess.run(
            command,
            capture_output=True,
            text=True,
            timeout=timeout,
            encoding='utf-8',
            errors='ignore'
        )
        return result
    except subprocess.TimeoutExpired:
        logger.error(f"Command timed out: {command}")
        return None
    except Exception as e:
        logger.error(f"Subprocess error: {e}")
        return None

def main():
    """Main function with error handling"""
    try:
        logger.info("Starting robust Python script...")
        
        # Your code here
        logger.info("Script completed successfully!")
        
    except KeyboardInterrupt:
        logger.info("Script interrupted by user")
    except Exception as e:
        logger.error(f"Unexpected error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
'''
        
        with open("robust_python_template.py", "w", encoding="utf-8") as f:
            f.write(robust_script)
        
        self.fixes_applied.append("Created robust Python script template")
        self.logger.info("✅ Created robust Python script template")
    
    def create_error_handler(self):
        """Create error handling utilities"""
        self.logger.info("🔧 Creating error handling utilities...")
        
        error_handler = '''#!/usr/bin/env python3
"""
Python Error Handler
Handles common Python execution errors
"""

import sys
import traceback
import logging
from functools import wraps

def handle_errors(func):
    """Decorator to handle errors gracefully"""
    @wraps(func)
    def wrapper(*args, **kwargs):
        try:
            return func(*args, **kwargs)
        except Exception as e:
            logging.error(f"Error in {func.__name__}: {e}")
            logging.error(traceback.format_exc())
            return None
    return wrapper

def safe_import(module_name):
    """Safely import a module"""
    try:
        return __import__(module_name)
    except ImportError as e:
        logging.warning(f"Could not import {module_name}: {e}")
        return None

def safe_execute_command(command, timeout=30):
    """Safely execute a command"""
    import subprocess
    try:
        result = subprocess.run(
            command,
            capture_output=True,
            text=True,
            timeout=timeout,
            encoding='utf-8',
            errors='ignore'
        )
        return result
    except Exception as e:
        logging.error(f"Command execution failed: {e}")
        return None

class PythonAgentErrorHandler:
    def __init__(self):
        self.errors = []
        self.fixes = []
    
    def log_error(self, error, context=""):
        """Log an error with context"""
        error_info = {
            "error": str(error),
            "context": context,
            "timestamp": datetime.now().isoformat()
        }
        self.errors.append(error_info)
        logging.error(f"Error in {context}: {error}")
    
    def apply_fix(self, fix_description):
        """Apply a fix"""
        self.fixes.append(fix_description)
        logging.info(f"Applied fix: {fix_description}")
    
    def get_summary(self):
        """Get error summary"""
        return {
            "total_errors": len(self.errors),
            "total_fixes": len(self.fixes),
            "errors": self.errors,
            "fixes": self.fixes
        }
'''
        
        with open("python_error_handler.py", "w", encoding="utf-8") as f:
            f.write(error_handler)
        
        self.fixes_applied.append("Created Python error handler")
        self.logger.info("✅ Created Python error handler")
    
    def test_robust_execution(self):
        """Test robust execution"""
        self.logger.info("🧪 Testing robust execution...")
        
        test_script = '''
import os
import sys
import subprocess
import time

# Set environment variables
os.environ["PYTHONUNBUFFERED"] = "1"
os.environ["PYTHONIOENCODING"] = "utf-8"

print("Testing robust Python execution...")

# Test basic operations
print("1. Basic operations...")
result = 2 + 2
print(f"2 + 2 = {result}")

# Test subprocess
print("2. Subprocess test...")
try:
    result = subprocess.run([sys.executable, "-c", "print('Subprocess working')"], 
                          capture_output=True, text=True, timeout=10)
    if result.returncode == 0:
        print("SUCCESS: Subprocess working")
    else:
        print("FAILED: Subprocess failed")
except Exception as e:
    print(f"ERROR: Subprocess error: {e}")

# Test file operations
print("3. File operations test...")
try:
    with open("test_file.txt", "w", encoding="utf-8") as f:
        f.write("Test content")
    with open("test_file.txt", "r", encoding="utf-8") as f:
        content = f.read()
    os.remove("test_file.txt")
    print("SUCCESS: File operations working")
except Exception as e:
    print(f"ERROR: File operations error: {e}")

print("Robust execution test completed!")
'''
        
        with open("test_robust.py", "w", encoding="utf-8") as f:
            f.write(test_script)
        
        try:
            result = subprocess.run([sys.executable, "test_robust.py"], 
                                  capture_output=True, text=True, timeout=30)
            
            if result.returncode == 0:
                self.logger.info("✅ Robust execution test passed")
                print(result.stdout)
            else:
                self.logger.error(f"❌ Robust execution test failed: {result.stderr}")
                
        except Exception as e:
            self.logger.error(f"❌ Robust execution test error: {e}")
        
        # Clean up
        if Path("test_robust.py").exists():
            Path("test_robust.py").unlink()
    
    def generate_report(self):
        """Generate comprehensive report"""
        report = {
            "timestamp": datetime.now().isoformat(),
            "errors_found": self.errors_found,
            "fixes_applied": self.fixes_applied,
            "results": self.results,
            "summary": self.generate_summary()
        }
        
        # Save report
        with open('python_agent_fixer_report.json', 'w', encoding='utf-8') as f:
            json.dump(report, f, indent=2, ensure_ascii=False)
        
        return report
    
    def generate_summary(self):
        """Generate summary"""
        total_errors = len(self.errors_found) + len(self.results["module_issues"]) + len(self.results["execution_issues"])
        total_fixes = len(self.fixes_applied)
        
        return {
            "total_errors": total_errors,
            "total_fixes": total_fixes,
            "status": "fixed" if total_fixes > 0 else "needs_attention"
        }
    
    def run_complete_fix(self):
        """Run complete Python agent fix"""
        self.logger.info("🔧 Starting Python Agent Fixer...")
        self.logger.info("=" * 60)
        
        # Step 1: Check basic execution
        self.logger.info("🔍 Step 1: Checking basic Python execution...")
        self.check_python_basic_execution()
        
        # Step 2: Check common modules
        self.logger.info("🔍 Step 2: Checking common modules...")
        self.check_common_modules()
        
        # Step 3: Check execution environment
        self.logger.info("🔍 Step 3: Checking execution environment...")
        self.check_execution_environment()
        
        # Step 4: Fix common issues
        self.logger.info("🔧 Step 4: Fixing common issues...")
        self.fix_common_issues()
        
        # Step 5: Create robust scripts
        self.logger.info("📝 Step 5: Creating robust scripts...")
        self.create_robust_python_script()
        self.create_error_handler()
        
        # Step 6: Test robust execution
        self.logger.info("🧪 Step 6: Testing robust execution...")
        self.test_robust_execution()
        
        # Step 7: Generate report
        self.logger.info("📊 Step 7: Generating report...")
        report = self.generate_report()
        
        return report

def main():
    """Main entry point"""
    print("=" * 60)
    print("🔧 Python Agent Fixer")
    print("=" * 60)
    
    fixer = PythonAgentFixer()
    report = fixer.run_complete_fix()
    
    print("\n📊 PYTHON AGENT FIXER REPORT:")
    print("=" * 60)
    
    summary = report["summary"]
    print(f"✅ Total Errors Found: {summary['total_errors']}")
    print(f"✅ Total Fixes Applied: {summary['total_fixes']}")
    print(f"✅ Status: {summary['status']}")
    
    if report["fixes_applied"]:
        print("\n🔧 Fixes Applied:")
        for fix in report["fixes_applied"]:
            print(f"  - {fix}")
    
    print("\n📄 Report saved: python_agent_fixer_report.json")
    print("📝 Templates created: robust_python_template.py, python_error_handler.py")

if __name__ == "__main__":
    main() 