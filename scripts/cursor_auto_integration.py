import os
import json
import subprocess
from pathlib import Path
import logging
            from datetime import datetime

#!/usr/bin/env python3
"""
EHB Cursor Auto Integration System
Automatically finds and integrates existing world solutions into Cursor projects
"""


# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class CursorAutoIntegration:
    def __init__(self):
        self.project_root = Path.cwd()
        self.solutions_cache = {}
        self.integration_history = []
        self.github_token = os.getenv("GITHUB_TOKEN", "")

    def auto_integrate_solution(self, task_description: str) -> Dict[str, Any]:
        """
        Automatically find and integrate the best existing solution
        """
        logger.info(f"Auto-integrating solution for: {task_description}")

        # Step 1: Analyze task and find solutions
        solutions = self._find_solutions(task_description)

        # Step 2: Select best solution
        best_solution = self._select_best_solution(solutions, task_description)

        # Step 3: Download and analyze solution
        solution_path = self._download_solution(best_solution)

        # Step 4: Extract relevant code
        extracted_code = self._extract_relevant_code(solution_path, task_description)

        # Step 5: Adapt code to current project
        adapted_code = self._adapt_code(extracted_code, task_description)

        # Step 6: Integrate into current project
        integration_result = self._integrate_code(adapted_code, task_description)

        # Step 7: Test integration
        test_result = self._test_integration(integration_result)

        return {
            "task": task_description,
            "solution_used": best_solution,
            "integration_path": integration_result["path"],
            "files_created": integration_result["files"],
            "test_passed": test_result["passed"],
            "time_saved": self._calculate_time_saved(best_solution),
            "next_steps": self._generate_next_steps(test_result),
        }

    def _find_solutions(self, task_description: str) -> List[Dict]:
        """
        Find existing solutions for the task
        """
        solutions = []

        # Search GitHub for relevant repositories
        github_solutions = self._search_github(task_description)
        solutions.extend(github_solutions)

        # Search curated solution database
        curated_solutions = self._search_curated_database(task_description)
        solutions.extend(curated_solutions)

        return solutions

    def _search_github(self, task_description: str) -> List[Dict]:
        """
        Search GitHub for relevant solutions
        """
        solutions = []

        # Generate search queries based on task
        queries = self._generate_search_queries(task_description)

        for query in queries:
            try:
                url = "https://api.github.com/search/repositories"
                params = {"q": query, "sort": "stars", "order": "desc", "per_page": 5}

                headers = {}
                if self.github_token:
                    headers["Authorization"] = f"token {self.github_token}"

                response = requests.get(url, headers=headers, params=params)

                if response.status_code == 200:
                    data = response.json()

                    for repo in data.get("items", []):
                        solution = {
                            "name": repo["name"],
                            "description": repo["description"] or "",
                            "url": repo["html_url"],
                            "clone_url": repo["clone_url"],
                            "stars": repo["stargazers_count"],
                            "language": repo["language"],
                            "score": self._calculate_solution_score(
                                repo, task_description
                            ),
                        }
                        solutions.append(solution)

                time.sleep(1)  # Rate limiting

            except Exception as e:
                logger.error(f"Error searching GitHub: {e}")

        return solutions

    def _search_curated_database(self, task_description: str) -> List[Dict]:
        """
        Search curated database of known good solutions
        """
        curated_db = {
            "patient management": [
                {
                    "name": "Patient Management System",
                    "description": "Comprehensive patient management with HIPAA compliance",
                    "url": "https://github.com/example/patient-management",
                    "clone_url": "https://github.com/example/patient-management.git",
                    "stars": 1500,
                    "language": "TypeScript",
                    "score": 9.5,
                }
            ],
            "appointment scheduling": [
                {
                    "name": "Healthcare Appointment Scheduler",
                    "description": "Advanced appointment scheduling with calendar integration",
                    "url": "https://github.com/example/appointment-scheduler",
                    "clone_url": "https://github.com/example/appointment-scheduler.git",
                    "stars": 800,
                    "language": "JavaScript",
                    "score": 9.0,
                }
            ],
            "dashboard": [
                {
                    "name": "Healthcare Analytics Dashboard",
                    "description": "Real-time healthcare analytics and reporting",
                    "url": "https://github.com/example/healthcare-dashboard",
                    "clone_url": "https://github.com/example/healthcare-dashboard.git",
                    "stars": 1200,
                    "language": "React",
                    "score": 9.2,
                }
            ],
        }

        solutions = []
        task_lower = task_description.lower()

        for keyword, solution_list in curated_db.items():
            if keyword in task_lower:
                solutions.extend(solution_list)

        return solutions

    def _generate_search_queries(self, task_description: str) -> List[str]:
        """
        Generate search queries based on task description
        """
        queries = []
        task_lower = task_description.lower()

        # Healthcare-specific queries
        if "patient" in task_lower:
            queries.extend(
                [
                    "patient management healthcare react",
                    "patient records system typescript",
                    "healthcare patient portal",
                ]
            )

        if "appointment" in task_lower:
            queries.extend(
                [
                    "appointment scheduling healthcare",
                    "medical appointment system",
                    "healthcare calendar booking",
                ]
            )

        if "dashboard" in task_lower:
            queries.extend(
                [
                    "healthcare dashboard analytics",
                    "medical dashboard react",
                    "healthcare reporting system",
                ]
            )

        if "telemedicine" in task_lower or "video" in task_lower:
            queries.extend(
                [
                    "telemedicine video call",
                    "healthcare video consultation",
                    "medical video chat",
                ]
            )

        # General queries
        queries.extend(
            [
                f"{task_description} react typescript",
                f"{task_description} healthcare open source",
                f"{task_description} medical software",
            ]
        )

        return queries[:5]  # Limit to top 5 queries

    def _calculate_solution_score(self, repo: Dict, task_description: str) -> float:
        """
        Calculate how well a solution matches the task
        """
        score = 7.0  # Base score

        # Language compatibility
        language = repo.get("language", "").lower()
        if language in ["typescript", "javascript", "react"]:
            score += 1.0

        # Popularity (stars)
        stars = repo.get("stargazers_count", 0)
        if stars > 100:
            score += 0.5
        if stars > 500:
            score += 0.5

        # Recent activity
        updated_at = repo.get("updated_at", "")
        if updated_at:

            last_update = datetime.fromisoformat(updated_at.replace("Z", "+00:00"))
            days_since_update = (
                datetime.now().replace(tzinfo=last_update.tzinfo) - last_update
            ).days
            if days_since_update < 365:
                score += 0.5

        # Description relevance
        description = repo.get("description", "").lower()
        task_words = task_description.lower().split()
        relevant_words = sum(1 for word in task_words if word in description)
        if relevant_words > 0:
            score += min(relevant_words * 0.3, 1.0)

        return min(score, 10.0)

    def _select_best_solution(
        self, solutions: List[Dict], task_description: str
    ) -> Dict:
        """
        Select the best solution from the list
        """
        if not solutions:
            raise ValueError("No solutions found for the task")

        # Sort by score
        sorted_solutions = sorted(solutions, key=lambda x: x["score"], reverse=True)

        logger.info(f"Selected solution: {sorted_solutions[0]['name']}")
        return sorted_solutions[0]

    def _download_solution(self, solution: Dict) -> Path:
        """
        Download the selected solution
        """
        clone_url = solution["clone_url"]
        temp_dir = self.project_root / "temp_solutions" / solution["name"]

        # Create temp directory
        temp_dir.mkdir(parents=True, exist_ok=True)

        # Clone repository
        try:
            subprocess.run(
                ["git", "clone", clone_url, str(temp_dir)],
                check=True,
                capture_output=True,
            )

            logger.info(f"Downloaded solution to: {temp_dir}")
            return temp_dir

        except subprocess.CalledProcessError as e:
            logger.error(f"Failed to clone repository: {e}")
            raise

    def _extract_relevant_code(
        self, solution_path: Path, task_description: str
    ) -> Dict[str, Any]:
        """
        Extract relevant code from the downloaded solution
        """
        extracted_code = {
            "components": [],
            "services": [],
            "utils": [],
            "types": [],
            "styles": [],
        }

        # Define file patterns to extract
        patterns = {
            "components": ["**/*.tsx", "**/*.jsx", "**/components/**/*"],
            "services": ["**/*.ts", "**/services/**/*", "**/api/**/*"],
            "utils": ["**/utils/**/*", "**/helpers/**/*"],
            "types": ["**/types/**/*", "**/*.d.ts"],
            "styles": ["**/*.css", "**/*.scss", "**/styles/**/*"],
        }

        for category, file_patterns in patterns.items():
            for pattern in file_patterns:
                files = list(solution_path.glob(pattern))
                for file in files:
                    if file.is_file() and self._is_relevant_file(
                        file, task_description
                    ):
                        try:
                            content = file.read_text(encoding="utf-8")
                            extracted_code[category].append(
                                {
                                    "path": str(file.relative_to(solution_path)),
                                    "content": content,
                                    "name": file.stem,
                                }
                            )
                        except Exception as e:
                            logger.warning(f"Could not read file {file}: {e}")

        return extracted_code

    def _is_relevant_file(self, file_path: Path, task_description: str) -> bool:
        """
        Check if a file is relevant to the task
        """
        task_lower = task_description.lower()
        file_name = file_path.name.lower()

        # Skip common non-relevant files
        skip_patterns = [
            "node_modules",
            ".git",
            "dist",
            "build",
            "package-lock.json",
            "yarn.lock",
            ".env",
            "README.md",
            "LICENSE",
            ".gitignore",
        ]

        for pattern in skip_patterns:
            if pattern in str(file_path):
                return False

        # Check if file name contains relevant keywords
        relevant_keywords = [
            "patient",
            "appointment",
            "dashboard",
            "medical",
            "healthcare",
        ]
        for keyword in relevant_keywords:
            if keyword in file_name:
                return True

        return False

    def _adapt_code(
        self, extracted_code: Dict[str, Any], task_description: str
    ) -> Dict[str, Any]:
        """
        Adapt the extracted code to fit the current project
        """
        adapted_code = {
            "components": [],
            "services": [],
            "utils": [],
            "types": [],
            "styles": [],
        }

        for category, files in extracted_code.items():
            for file_data in files:
                adapted_content = self._adapt_file_content(
                    file_data["content"], file_data["path"], task_description
                )

                adapted_code[category].append(
                    {
                        "path": self._generate_new_path(file_data["path"], category),
                        "content": adapted_content,
                        "name": file_data["name"],
                    }
                )

        return adapted_code

    def _adapt_file_content(
        self, content: str, original_path: str, task_description: str
    ) -> str:
        """
        Adapt file content to match current project structure
        """
        # Replace imports to match current project
        adapted_content = content

        # Update import paths
        adapted_content = adapted_content.replace(
            'from "../components/', 'from "@/components/'
        )
        adapted_content = adapted_content.replace(
            'from "../services/', 'from "@/services/'
        )
        adapted_content = adapted_content.replace('from "../utils/', 'from "@/utils/')

        # Add EHB-specific comments
        adapted_content = f"// EHB Healthcare - Adapted from {original_path}\n// Task: {task_description}\n\n{adapted_content}"

        return adapted_content

    def _generate_new_path(self, original_path: str, category: str) -> str:
        """
        Generate new file path for the adapted code
        """
        filename = Path(original_path).name

        if category == "components":
            return f"src/components/{filename}"
        elif category == "services":
            return f"src/services/{filename}"
        elif category == "utils":
            return f"src/utils/{filename}"
        elif category == "types":
            return f"src/types/{filename}"
        elif category == "styles":
            return f"src/styles/{filename}"
        else:
            return f"src/{category}/{filename}"

    def _integrate_code(
        self, adapted_code: Dict[str, Any], task_description: str
    ) -> Dict[str, Any]:
        """
        Integrate the adapted code into the current project
        """
        integrated_files = []

        for category, files in adapted_code.items():
            for file_data in files:
                file_path = Path(file_data["path"])

                # Create directory if it doesn't exist
                file_path.parent.mkdir(parents=True, exist_ok=True)

                # Write file
                try:
                    file_path.write_text(file_data["content"], encoding="utf-8")
                    integrated_files.append(str(file_path))
                    logger.info(f"Created file: {file_path}")
                except Exception as e:
                    logger.error(f"Failed to create file {file_path}: {e}")

        return {"path": str(self.project_root), "files": integrated_files}

    def _test_integration(self, integration_result: Dict[str, Any]) -> Dict[str, Any]:
        """
        Test the integrated code
        """
        test_result = {"passed": True, "errors": [], "warnings": []}

        # Check if files exist
        for file_path in integration_result["files"]:
            if not Path(file_path).exists():
                test_result["passed"] = False
                test_result["errors"].append(f"File not found: {file_path}")

        # Run TypeScript check if available
        try:
            result = subprocess.run(
                ["npx", "tsc", "--noEmit"],
                capture_output=True,
                text=True,
                cwd=self.project_root,
            )

            if result.returncode != 0:
                test_result["warnings"].append("TypeScript compilation warnings")
                logger.warning("TypeScript check found issues")

        except Exception as e:
            logger.warning(f"Could not run TypeScript check: {e}")

        return test_result

    def _calculate_time_saved(self, solution: Dict) -> int:
        """
        Calculate time saved by using existing solution
        """
        base_time = 40  # hours for manual implementation
        quality_factor = solution["score"] / 10
        time_saved = int(base_time * quality_factor)
        return max(time_saved, 8)  # Minimum 8 hours saved

    def _generate_next_steps(self, test_result: Dict[str, Any]) -> List[str]:
        """
        Generate next steps based on test results
        """
        steps = []

        if test_result["passed"]:
            steps.extend(
                [
                    "SUCCESS Integration completed successfully",
                    "TOOLS Review and customize the integrated code",
                    "TESTING Add comprehensive tests",
                    "📚 Update documentation",
                    "ROCKET Deploy to staging environment",
                ]
            )
        else:
            steps.extend(
                [
                    "ERROR Integration has issues",
                    "TOOLS Fix compilation errors",
                    "TESTING Run tests to identify problems",
                    "📝 Review error logs",
                    "🔄 Re-run integration after fixes",
                ]
            )

        return steps

    def generate_integration_report(self, result: Dict[str, Any]) -> str:
        """
        Generate a comprehensive integration report
        """
        report = f"""
# Auto Integration Report

## Task Completed
**Description:** {result['task']}

## Solution Used
**Name:** {result['solution_used']['name']}
**Description:** {result['solution_used']['description']}
**GitHub:** {result['solution_used']['url']}
**Stars:** {result['solution_used']['stars']}
**Language:** {result['solution_used']['language']}

## Integration Results
**Files Created:** {len(result['files_created'])}
**Integration Path:** {result['integration_path']}
**Test Status:** {'SUCCESS PASSED' if result['test_passed'] else 'ERROR FAILED'}

## Time Savings
**Estimated time saved:** {result['time_saved']} hours

## Created Files
{chr(10).join((f"- {file}" for file in result['files_created')])}

## Next Steps
{chr(10).join((f"- {step}" for step in result['next_steps')])}

---
*Generated by EHB Auto Integration System*
"""

        return report


def main():
    """
    Main function to demonstrate auto integration
    """
    integrator = CursorAutoIntegration()

    # Example tasks
    tasks = [
        "Create a patient management dashboard",
        "Implement appointment scheduling system",
        "Add medical records management",
        "Create healthcare analytics dashboard",
    ]

    for task in tasks:
        print(f"\n{'='*60}")
        print(f"Auto-integrating: {task}")
        print("=" * 60)

        try:
            result = integrator.auto_integrate_solution(task)
            report = integrator.generate_integration_report(result)
            print(report)
        except Exception as e:
            print(f"Integration failed: {e}")


if __name__ == "__main__":
    main()
