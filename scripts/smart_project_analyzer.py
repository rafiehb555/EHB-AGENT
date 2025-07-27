import os
import json
import subprocess
from pathlib import Path
import logging
            from datetime import datetime
            from datetime import datetime

#!/usr/bin/env python3
"""
EHB Smart Project Analyzer
Automatically finds and integrates existing world solutions for faster development
"""


# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@dataclass
class ProjectSolution:
    name: str
    description: str
    github_url: str
    stars: int
    last_updated: str
    language: str
    features: List[str]
    integration_score: float
    code_quality: float
    documentation: float
    community_support: float


@dataclass
class TaskAnalysis:
    task_name: str
    task_description: str
    required_features: List[str]
    best_solutions: List[ProjectSolution]
    recommended_integration: ProjectSolution
    estimated_time_saved: int  # hours
    implementation_steps: List[str]


class SmartProjectAnalyzer:
    def __init__(self):
        self.solutions_database = {}
        self.task_cache = {}
        self.github_api_token = os.getenv("GITHUB_TOKEN", "")
        self.headers = {
            "Authorization": (
                f"token {self.github_api_token}" if self.github_api_token else ""
            ),
            "Accept": "application/vnd.github.v3+json",
        }

    def analyze_task(
        self, task_description: str, project_type: str = "healthcare"
    ) -> TaskAnalysis:
        """
        Analyze a task and find the best existing solutions
        """
        logger.info(f"Analyzing task: {task_description}")

        # Extract key features from task description
        features = self._extract_features(task_description)

        # Search for existing solutions
        solutions = self._search_solutions(features, project_type)

        # Rank solutions by quality and relevance
        ranked_solutions = self._rank_solutions(solutions, features)

        # Select best solution
        best_solution = ranked_solutions[0] if ranked_solutions else None

        # Generate implementation plan
        implementation_steps = self._generate_implementation_plan(
            best_solution, task_description
        )

        return TaskAnalysis(
            task_name=self._generate_task_name(task_description),
            task_description=task_description,
            required_features=features,
            best_solutions=ranked_solutions[:5],
            recommended_integration=best_solution,
            estimated_time_saved=self._estimate_time_saved(best_solution),
            implementation_steps=implementation_steps,
        )

    def _extract_features(self, task_description: str) -> List[str]:
        """
        Extract key features from task description using NLP
        """
        features = []

        # Healthcare-specific features
        healthcare_keywords = {
            "patient": ["patient management", "patient records", "patient data"],
            "appointment": ["appointment scheduling", "calendar", "booking"],
            "medical": ["medical records", "healthcare", "clinical"],
            "lab": ["lab results", "laboratory", "test results"],
            "prescription": ["medication", "prescription", "drug management"],
            "dashboard": ["analytics", "dashboard", "reports"],
            "security": ["hipaa", "security", "encryption", "compliance"],
            "telemedicine": ["video call", "telemedicine", "remote consultation"],
        }

        task_lower = task_description.lower()

        for category, keywords in healthcare_keywords.items():
            for keyword in keywords:
                if keyword in task_lower:
                    features.append(category)
                    break

        # Add general features
        if "api" in task_lower or "backend" in task_lower:
            features.append("api")
        if "ui" in task_lower or "frontend" in task_lower or "interface" in task_lower:
            features.append("ui")
        if "database" in task_lower or "storage" in task_lower:
            features.append("database")
        if "authentication" in task_lower or "login" in task_lower:
            features.append("auth")

        return list(set(features))

    def _search_solutions(
        self, features: List[str], project_type: str
    ) -> List[ProjectSolution]:
        """
        Search for existing solutions on GitHub and other platforms
        """
        solutions = []

        # Search GitHub for healthcare solutions
        for feature in features:
            github_solutions = self._search_github(feature, project_type)
            solutions.extend(github_solutions)

        # Search curated solution database
        curated_solutions = self._search_curated_database(features)
        solutions.extend(curated_solutions)

        return solutions

    def _search_github(self, feature: str, project_type: str) -> List[ProjectSolution]:
        """
        Search GitHub for relevant solutions
        """
        solutions = []

        search_queries = [
            f"{feature} {project_type} react",
            f"{feature} {project_type} next.js",
            f"{feature} {project_type} typescript",
            f"{feature} healthcare open source",
            f"{feature} medical software",
        ]

        for query in search_queries:
            try:
                url = f"https://api.github.com/search/repositories"
                params = {"q": query, "sort": "stars", "order": "desc", "per_page": 10}

                response = requests.get(url, headers=self.headers, params=params)
                if response.status_code == 200:
                    data = response.json()

                    for repo in data.get("items", []):
                        solution = ProjectSolution(
                            name=repo["name"],
                            description=repo["description"] or "",
                            github_url=repo["html_url"],
                            stars=repo["stargazers_count"],
                            last_updated=repo["updated_at"],
                            language=repo["language"] or "Unknown",
                            features=self._extract_repo_features(repo),
                            integration_score=self._calculate_integration_score(
                                repo, feature
                            ),
                            code_quality=self._assess_code_quality(repo),
                            documentation=self._assess_documentation(repo),
                            community_support=self._assess_community_support(repo),
                        )
                        solutions.append(solution)

                time.sleep(1)  # Rate limiting

            except Exception as e:
                logger.error(f"Error searching GitHub: {e}")

        return solutions

    def _search_curated_database(self, features: List[str]) -> List[ProjectSolution]:
        """
        Search curated database of known good solutions
        """
        curated_solutions = {
            "patient": [
                ProjectSolution(
                    name="Patient Management System",
                    description="Comprehensive patient management with HIPAA compliance",
                    github_url="https://github.com/example/patient-management",
                    stars=1500,
                    last_updated="2024-01-15",
                    language="TypeScript",
                    features=["patient", "medical", "security"],
                    integration_score=9.5,
                    code_quality=9.0,
                    documentation=8.5,
                    community_support=8.0,
                )
            ],
            "appointment": [
                ProjectSolution(
                    name="Healthcare Appointment Scheduler",
                    description="Advanced appointment scheduling with calendar integration",
                    github_url="https://github.com/example/appointment-scheduler",
                    stars=800,
                    last_updated="2024-01-10",
                    language="JavaScript",
                    features=["appointment", "calendar", "scheduling"],
                    integration_score=9.0,
                    code_quality=8.5,
                    documentation=9.0,
                    community_support=7.5,
                )
            ],
            "dashboard": [
                ProjectSolution(
                    name="Healthcare Analytics Dashboard",
                    description="Real-time healthcare analytics and reporting",
                    github_url="https://github.com/example/healthcare-dashboard",
                    stars=1200,
                    last_updated="2024-01-12",
                    language="React",
                    features=["dashboard", "analytics", "reports"],
                    integration_score=9.2,
                    code_quality=9.0,
                    documentation=8.8,
                    community_support=8.5,
                )
            ],
        }

        solutions = []
        for feature in features:
            if feature in curated_solutions:
                solutions.extend(curated_solutions[feature])

        return solutions

    def _rank_solutions(
        self, solutions: List[ProjectSolution], required_features: List[str]
    ) -> List[ProjectSolution]:
        """
        Rank solutions by quality, relevance, and integration potential
        """

        def calculate_score(solution: ProjectSolution) -> float:
            # Feature match score
            feature_match = len(set(solution.features) & set(required_features)) / len(
                required_features
            )

            # Quality score
            quality_score = (
                solution.code_quality
                + solution.documentation
                + solution.community_support
            ) / 3

            # Integration score
            integration_score = solution.integration_score

            # Popularity score (normalized stars)
            popularity_score = min(solution.stars / 1000, 1.0)

            # Final weighted score
            final_score = (
                feature_match * 0.3
                + quality_score * 0.25
                + integration_score * 0.25
                + popularity_score * 0.2
            )

            return final_score

        # Sort by score
        ranked_solutions = sorted(solutions, key=calculate_score, reverse=True)
        return ranked_solutions

    def _generate_implementation_plan(
        self, solution: ProjectSolution, task_description: str
    ) -> List[str]:
        """
        Generate step-by-step implementation plan
        """
        if not solution:
            return ["No suitable solution found. Manual implementation required."]

        steps = [
            f"1. Clone repository: {solution.github_url}",
            "2. Analyze code structure and dependencies",
            "3. Extract relevant components and functions",
            "4. Adapt code to match current project architecture",
            "5. Integrate with existing healthcare API",
            "6. Add HIPAA compliance features",
            "7. Test integration with current system",
            "8. Optimize performance and security",
            "9. Update documentation",
            "10. Deploy and monitor",
        ]

        return steps

    def _estimate_time_saved(self, solution: ProjectSolution) -> int:
        """
        Estimate time saved by using existing solution
        """
        if not solution:
            return 0

        # Base time for manual implementation (hours)
        base_time = 40

        # Time reduction based on solution quality
        quality_factor = (solution.code_quality + solution.documentation) / 20

        # Integration complexity factor
        integration_factor = solution.integration_score / 10

        # Estimated time saved
        time_saved = int(base_time * quality_factor * integration_factor)

        return max(time_saved, 8)  # Minimum 8 hours saved

    def _extract_repo_features(self, repo: Dict) -> List[str]:
        """
        Extract features from repository data
        """
        features = []

        # Extract from description
        description = repo.get("description", "").lower()
        if "patient" in description:
            features.append("patient")
        if "appointment" in description:
            features.append("appointment")
        if "medical" in description:
            features.append("medical")
        if "healthcare" in description:
            features.append("healthcare")
        if "dashboard" in description:
            features.append("dashboard")

        return features

    def _calculate_integration_score(self, repo: Dict, feature: str) -> float:
        """
        Calculate how easy it would be to integrate this solution
        """
        score = 7.0  # Base score

        # Language compatibility
        language = repo.get("language", "").lower()
        if language in ["typescript", "javascript", "react"]:
            score += 1.0

        # Documentation quality
        if repo.get("has_wiki", False):
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

        return min(score, 10.0)

    def _assess_code_quality(self, repo: Dict) -> float:
        """
        Assess code quality based on repository metrics
        """
        score = 7.0  # Base score

        # Stars indicate popularity and quality
        stars = repo.get("stargazers_count", 0)
        if stars > 100:
            score += 1.0
        if stars > 500:
            score += 1.0

        # Forks indicate community interest
        forks = repo.get("forks_count", 0)
        if forks > 50:
            score += 0.5

        # Issues indicate maintenance
        open_issues = repo.get("open_issues_count", 0)
        if open_issues < 20:
            score += 0.5

        return min(score, 10.0)

    def _assess_documentation(self, repo: Dict) -> float:
        """
        Assess documentation quality
        """
        score = 7.0  # Base score

        if repo.get("has_wiki", False):
            score += 1.0

        if repo.get("has_pages", False):
            score += 1.0

        description = repo.get("description", "")
        if len(description) > 50:
            score += 0.5

        return min(score, 10.0)

    def _assess_community_support(self, repo: Dict) -> float:
        """
        Assess community support level
        """
        score = 7.0  # Base score

        # Stars indicate community interest
        stars = repo.get("stargazers_count", 0)
        if stars > 200:
            score += 1.0

        # Forks indicate community engagement
        forks = repo.get("forks_count", 0)
        if forks > 100:
            score += 1.0

        # Recent activity
        updated_at = repo.get("updated_at", "")
        if updated_at:

            last_update = datetime.fromisoformat(updated_at.replace("Z", "+00:00"))
            days_since_update = (
                datetime.now().replace(tzinfo=last_update.tzinfo) - last_update
            ).days
            if days_since_update < 180:
                score += 1.0

        return min(score, 10.0)

    def _generate_task_name(self, task_description: str) -> str:
        """
        Generate a task name from description
        """
        words = task_description.split()[:5]
        return " ".join(words).title()

    def generate_report(self, analysis: TaskAnalysis) -> str:
        """
        Generate a comprehensive report
        """
        report = f"""
# Smart Project Analysis Report

## Task: {analysis.task_name}
**Description:** {analysis.task_description}

## Required Features
{chr(10).join((f"- {feature}" for feature in analysis.required_features))}

## Recommended Solution
**Name:** {analysis.recommended_integration.name}
**Description:** {analysis.recommended_integration.description}
**GitHub:** {analysis.recommended_integration.github_url}
**Stars:** {analysis.recommended_integration.stars}
**Language:** {analysis.recommended_integration.language}

## Quality Metrics
- **Code Quality:** {analysis.recommended_integration.code_quality}/10
- **Documentation:** {analysis.recommended_integration.documentation}/10
- **Community Support:** {analysis.recommended_integration.community_support}/10
- **Integration Score:** {analysis.recommended_integration.integration_score}/10

## Time Savings
**Estimated time saved:** {analysis.estimated_time_saved} hours

## Implementation Steps
{chr(10).join((f"{step}" for step in analysis.implementation_steps))}

## Alternative Solutions
"""

        for i, solution in enumerate(analysis.best_solutions[1:4], 1):
            report += f"""
{i}. **{solution.name}**
   - Stars: {solution.stars}
   - Language: {solution.language}
   - Integration Score: {solution.integration_score}/10
"""

        return report


def main():
    """
    Main function to demonstrate the analyzer
    """
    analyzer = SmartProjectAnalyzer()

    # Example tasks
    tasks = [
        "Create a patient management system with appointment scheduling",
        "Build a healthcare dashboard with analytics",
        "Implement HIPAA-compliant medical records system",
        "Create a telemedicine video consultation feature",
    ]

    for task in tasks:
        print(f"\n{'='*60}")
        print(f"Analyzing: {task}")
        print("=" * 60)

        analysis = analyzer.analyze_task(task)
        report = analyzer.generate_report(analysis)
        print(report)


if __name__ == "__main__":
    main()
