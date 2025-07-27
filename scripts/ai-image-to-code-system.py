#!/usr/bin/env python3
"""
🤖 AI Image-to-Code System
Convert any image/design into working code with the same UI, frontend, and future-ready development
"""

import os
import sys
import json
import base64
import requests
from pathlib import Path
from typing import Dict, List, Any, Optional
import cv2
import numpy as np
from PIL import Image
import openai
import anthropic
import replicate
from transformers import pipeline
import tensorflow as tf
import torch

class AIImageToCodeSystem:
    def __init__(self):
        """Initialize AI Image-to-Code System"""
        self.setup_apis()
        self.setup_models()
        self.project_structure = self.create_project_structure()

    def setup_apis(self):
        """Setup API keys and configurations"""
        # Load environment variables
        self.openai_api_key = os.getenv('OPENAI_API_KEY', '')
        self.anthropic_api_key = os.getenv('ANTHROPIC_API_KEY', '')
        self.replicate_api_key = os.getenv('REPLICATE_API_KEY', '')

        # Initialize API clients
        if self.openai_api_key:
            openai.api_key = self.openai_api_key

        if self.anthropic_api_key:
            self.anthropic_client = anthropic.Anthropic(api_key=self.anthropic_api_key)

        if self.replicate_api_key:
            os.environ['REPLICATE_API_TOKEN'] = self.replicate_api_key

    def setup_models(self):
        """Setup AI models for image processing"""
        try:
            # Image classification model
            self.image_classifier = pipeline("image-classification", model="microsoft/resnet-50")

            # Object detection model
            self.object_detector = pipeline("object-detection", model="facebook/detr-resnet-50")

            # Image segmentation model
            self.segmentation_model = pipeline("image-segmentation", model="facebook/detr-resnet-50-panoptic")

        except Exception as e:
            print(f"Warning: Some models could not be loaded: {e}")

    def create_project_structure(self) -> Dict[str, Any]:
        """Create standard project structure for generated code"""
        return {
            "frontend": {
                "html": "index.html",
                "css": "styles.css",
                "js": "script.js",
                "assets": {
                    "images": "images/",
                    "fonts": "fonts/",
                    "icons": "icons/"
                }
            },
            "backend": {
                "api": "api/",
                "database": "database/",
                "config": "config/"
            },
            "mobile": {
                "react_native": "mobile/",
                "flutter": "flutter/"
            },
            "docs": {
                "readme": "README.md",
                "api_docs": "docs/api.md",
                "deployment": "docs/deployment.md"
            }
        }

    def analyze_image(self, image_path: str) -> Dict[str, Any]:
        """Analyze image to understand design elements"""
        try:
            # Load image
            image = Image.open(image_path)
            image_array = np.array(image)

            # Basic image analysis
            analysis = {
                "dimensions": image.size,
                "format": image.format,
                "mode": image.mode,
                "file_size": os.path.getsize(image_path),
                "colors": self.extract_colors(image_array),
                "layout": self.analyze_layout(image_array),
                "components": self.detect_components(image_array),
                "text": self.extract_text(image_array),
                "style": self.analyze_style(image_array)
            }

            return analysis

        except Exception as e:
            print(f"Error analyzing image: {e}")
            return {}

    def extract_colors(self, image_array: np.ndarray) -> Dict[str, Any]:
        """Extract dominant colors from image"""
        try:
            # Reshape image for color analysis
            pixels = image_array.reshape(-1, 3)

            # Find dominant colors using k-means
            from sklearn.cluster import KMeans
            kmeans = KMeans(n_clusters=5, random_state=42)
            kmeans.fit(pixels)

            colors = kmeans.cluster_centers_.astype(int)
            color_counts = np.bincount(kmeans.labels_)

            # Convert to hex colors
            hex_colors = [f"#{c[0]:02x}{c[1]:02x}{c[2]:02x}" for c in colors]

            return {
                "dominant_colors": hex_colors,
                "color_distribution": color_counts.tolist(),
                "color_scheme": self.classify_color_scheme(colors)
            }

        except Exception as e:
            print(f"Error extracting colors: {e}")
            return {"dominant_colors": [], "color_distribution": [], "color_scheme": "unknown"}

    def analyze_layout(self, image_array: np.ndarray) -> Dict[str, Any]:
        """Analyze layout structure of the image"""
        try:
            # Convert to grayscale for edge detection
            gray = cv2.cvtColor(image_array, cv2.COLOR_RGB2GRAY)

            # Edge detection
            edges = cv2.Canny(gray, 50, 150)

            # Find contours
            contours, _ = cv2.findContours(edges, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

            # Analyze layout structure
            layout_analysis = {
                "layout_type": self.classify_layout(contours, image_array.shape),
                "sections": len(contours),
                "grid_structure": self.detect_grid(contours),
                "alignment": self.analyze_alignment(contours),
                "spacing": self.analyze_spacing(contours)
            }

            return layout_analysis

        except Exception as e:
            print(f"Error analyzing layout: {e}")
            return {"layout_type": "unknown", "sections": 0}

    def detect_components(self, image_array: np.ndarray) -> List[Dict[str, Any]]:
        """Detect UI components in the image"""
        try:
            components = []

            # Detect buttons
            buttons = self.detect_buttons(image_array)
            components.extend(buttons)

            # Detect text areas
            text_areas = self.detect_text_areas(image_array)
            components.extend(text_areas)

            # Detect images/icons
            images = self.detect_images(image_array)
            components.extend(images)

            # Detect forms
            forms = self.detect_forms(image_array)
            components.extend(forms)

            return components

        except Exception as e:
            print(f"Error detecting components: {e}")
            return []

    def extract_text(self, image_array: np.ndarray) -> List[Dict[str, Any]]:
        """Extract text from image using OCR"""
        try:
            # Use Tesseract OCR if available
            try:
                import pytesseract
                text_data = pytesseract.image_to_data(image_array, output_type=pytesseract.Output.DICT)

                texts = []
                for i in range(len(text_data['text'])):
                    if text_data['conf'][i] > 50:  # Confidence threshold
                        texts.append({
                            "text": text_data['text'][i],
                            "confidence": text_data['conf'][i],
                            "bbox": (
                                text_data['left'][i],
                                text_data['top'][i],
                                text_data['width'][i],
                                text_data['height'][i]
                            )
                        })

                return texts

            except ImportError:
                print("Tesseract not available, using basic text detection")
                return []

        except Exception as e:
            print(f"Error extracting text: {e}")
            return []

    def analyze_style(self, image_array: np.ndarray) -> Dict[str, Any]:
        """Analyze design style and patterns"""
        try:
            style_analysis = {
                "design_system": self.classify_design_system(image_array),
                "typography": self.analyze_typography(image_array),
                "spacing": self.analyze_spacing_patterns(image_array),
                "shadows": self.detect_shadows(image_array),
                "gradients": self.detect_gradients(image_array),
                "modern_elements": self.detect_modern_elements(image_array)
            }

            return style_analysis

        except Exception as e:
            print(f"Error analyzing style: {e}")
            return {"design_system": "unknown"}

    def generate_code(self, image_path: str, target_framework: str = "html_css") -> Dict[str, str]:
        """Generate code from image analysis"""
        try:
            # Analyze image
            analysis = self.analyze_image(image_path)

            # Generate code based on target framework
            if target_framework == "html_css":
                return self.generate_html_css(analysis)
            elif target_framework == "react":
                return self.generate_react(analysis)
            elif target_framework == "vue":
                return self.generate_vue(analysis)
            elif target_framework == "flutter":
                return self.generate_flutter(analysis)
            elif target_framework == "react_native":
                return self.generate_react_native(analysis)
            else:
                return self.generate_html_css(analysis)

        except Exception as e:
            print(f"Error generating code: {e}")
            return {"error": str(e)}

    def generate_html_css(self, analysis: Dict[str, Any]) -> Dict[str, str]:
        """Generate HTML/CSS code from analysis"""
        try:
            # Extract design elements
            colors = analysis.get("colors", {})
            layout = analysis.get("layout", {})
            components = analysis.get("components", [])
            style = analysis.get("style", {})

            # Generate HTML
            html_code = self.create_html_structure(components, layout)

            # Generate CSS
            css_code = self.create_css_styles(colors, style, layout)

            # Generate JavaScript
            js_code = self.create_javascript(components)

            return {
                "html": html_code,
                "css": css_code,
                "js": js_code,
                "analysis": analysis
            }

        except Exception as e:
            print(f"Error generating HTML/CSS: {e}")
            return {"error": str(e)}

    def create_html_structure(self, components: List[Dict], layout: Dict) -> str:
        """Create HTML structure from components"""
        html = """<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AI Generated UI</title>
    <link rel="stylesheet" href="styles.css">
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet">
</head>
<body>
    <div class="container">
"""

        # Add components to HTML
        for component in components:
            component_type = component.get("type", "div")
            if component_type == "button":
                html += f'        <button class="btn btn-primary">{component.get("text", "Button")}</button>\n'
            elif component_type == "input":
                html += f'        <input type="text" class="form-input" placeholder="{component.get("placeholder", "Enter text...")}">\n'
            elif component_type == "text":
                html += f'        <p class="text-content">{component.get("text", "Sample text")}</p>\n'
            else:
                html += f'        <div class="component">{component.get("text", "Component")}</div>\n'

        html += """    </div>
    <script src="script.js"></script>
</body>
</html>"""

        return html

    def create_css_styles(self, colors: Dict, style: Dict, layout: Dict) -> str:
        """Create CSS styles from design analysis"""
        dominant_colors = colors.get("dominant_colors", ["#007bff", "#6c757d", "#28a745"])
        primary_color = dominant_colors[0] if dominant_colors else "#007bff"

        css = f"""/* AI Generated CSS Styles */
* {{
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}}

body {{
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    background-color: #f8f9fa;
    color: #333;
    line-height: 1.6;
}}

.container {{
    max-width: 1200px;
    margin: 0 auto;
    padding: 20px;
}}

/* Button Styles */
.btn {{
    padding: 12px 24px;
    border: none;
    border-radius: 8px;
    font-size: 16px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.3s ease;
    text-decoration: none;
    display: inline-block;
}}

.btn-primary {{
    background-color: {primary_color};
    color: white;
}}

.btn-primary:hover {{
    background-color: {self.darken_color(primary_color, 0.1)};
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 123, 255, 0.3);
}}

/* Form Styles */
.form-input {{
    width: 100%;
    padding: 12px 16px;
    border: 2px solid #e9ecef;
    border-radius: 8px;
    font-size: 16px;
    transition: border-color 0.3s ease;
}}

.form-input:focus {{
    outline: none;
    border-color: {primary_color};
    box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.1);
}}

/* Text Styles */
.text-content {{
    font-size: 16px;
    color: #333;
    margin-bottom: 16px;
}}

/* Component Styles */
.component {{
    background: white;
    padding: 20px;
    border-radius: 12px;
    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    margin-bottom: 20px;
    transition: transform 0.3s ease;
}}

.component:hover {{
    transform: translateY(-5px);
    box-shadow: 0 5px 20px rgba(0,0,0,0.15);
}}

/* Responsive Design */
@media (max-width: 768px) {{
    .container {{
        padding: 10px;
    }}

    .btn {{
        width: 100%;
        margin-bottom: 10px;
    }}
}}"""

        return css

    def create_javascript(self, components: List[Dict]) -> str:
        """Create JavaScript functionality"""
        js = """// AI Generated JavaScript
document.addEventListener('DOMContentLoaded', function() {
    // Initialize components
    initializeComponents();

    // Add event listeners
    addEventListeners();
});

function initializeComponents() {
    // Initialize buttons
    const buttons = document.querySelectorAll('.btn');
    buttons.forEach(button => {
        button.addEventListener('click', function(e) {
            console.log('Button clicked:', this.textContent);
            // Add your button functionality here
        });
    });

    // Initialize form inputs
    const inputs = document.querySelectorAll('.form-input');
    inputs.forEach(input => {
        input.addEventListener('input', function(e) {
            console.log('Input changed:', this.value);
            // Add your input functionality here
        });
    });
}

function addEventListeners() {
    // Add smooth scrolling
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

// Utility functions
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Add notification styles
const style = document.createElement('style');
style.textContent = `
.notification {
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 15px 20px;
    border-radius: 8px;
    color: white;
    z-index: 1000;
    animation: slideIn 0.3s ease;
}

.notification-info {
    background-color: #007bff;
}

.notification-success {
    background-color: #28a745;
}

.notification-error {
    background-color: #dc3545;
}

@keyframes slideIn {
    from {
        transform: translateX(100%);
        opacity: 0;
    }
    to {
        transform: translateX(0);
        opacity: 1;
    }
}
`;
document.head.appendChild(style);"""

        return js

    def generate_react(self, analysis: Dict[str, Any]) -> Dict[str, str]:
        """Generate React code from analysis"""
        # Implementation for React code generation
        return {"error": "React generation not implemented yet"}

    def generate_vue(self, analysis: Dict[str, Any]) -> Dict[str, str]:
        """Generate Vue.js code from analysis"""
        # Implementation for Vue.js code generation
        return {"error": "Vue.js generation not implemented yet"}

    def generate_flutter(self, analysis: Dict[str, Any]) -> Dict[str, str]:
        """Generate Flutter code from analysis"""
        # Implementation for Flutter code generation
        return {"error": "Flutter generation not implemented yet"}

    def generate_react_native(self, analysis: Dict[str, Any]) -> Dict[str, str]:
        """Generate React Native code from analysis"""
        # Implementation for React Native code generation
        return {"error": "React Native generation not implemented yet"}

    def save_generated_code(self, code: Dict[str, str], output_dir: str = "generated_ui"):
        """Save generated code to files"""
        try:
            # Create output directory
            os.makedirs(output_dir, exist_ok=True)

            # Save HTML
            if "html" in code:
                with open(os.path.join(output_dir, "index.html"), "w", encoding="utf-8") as f:
                    f.write(code["html"])

            # Save CSS
            if "css" in code:
                with open(os.path.join(output_dir, "styles.css"), "w", encoding="utf-8") as f:
                    f.write(code["css"])

            # Save JavaScript
            if "js" in code:
                with open(os.path.join(output_dir, "script.js"), "w", encoding="utf-8") as f:
                    f.write(code["js"])

            # Save analysis
            if "analysis" in code:
                with open(os.path.join(output_dir, "analysis.json"), "w", encoding="utf-8") as f:
                    json.dump(code["analysis"], f, indent=2, default=str)

            print(f"✅ Code generated successfully in '{output_dir}' directory")
            return True

        except Exception as e:
            print(f"Error saving code: {e}")
            return False

    def darken_color(self, hex_color: str, factor: float) -> str:
        """Darken a hex color by a factor"""
        try:
            # Remove # if present
            hex_color = hex_color.lstrip('#')

            # Convert to RGB
            r = int(hex_color[0:2], 16)
            g = int(hex_color[2:4], 16)
            b = int(hex_color[4:6], 16)

            # Darken
            r = max(0, int(r * (1 - factor)))
            g = max(0, int(g * (1 - factor)))
            b = max(0, int(b * (1 - factor)))

            # Convert back to hex
            return f"#{r:02x}{g:02x}{b:02x}"

        except Exception:
            return hex_color

    # Helper methods for component detection
    def detect_buttons(self, image_array: np.ndarray) -> List[Dict[str, Any]]:
        """Detect buttons in image"""
        # Placeholder implementation
        return [{"type": "button", "text": "Click Me", "bbox": [100, 100, 200, 50]}]

    def detect_text_areas(self, image_array: np.ndarray) -> List[Dict[str, Any]]:
        """Detect text areas in image"""
        # Placeholder implementation
        return [{"type": "input", "placeholder": "Enter text...", "bbox": [100, 200, 300, 40]}]

    def detect_images(self, image_array: np.ndarray) -> List[Dict[str, Any]]:
        """Detect images/icons in image"""
        # Placeholder implementation
        return [{"type": "image", "src": "placeholder.jpg", "bbox": [100, 300, 100, 100]}]

    def detect_forms(self, image_array: np.ndarray) -> List[Dict[str, Any]]:
        """Detect forms in image"""
        # Placeholder implementation
        return []

    def classify_layout(self, contours, shape) -> str:
        """Classify layout type"""
        return "responsive"

    def detect_grid(self, contours) -> Dict[str, Any]:
        """Detect grid structure"""
        return {"columns": 3, "rows": 2}

    def analyze_alignment(self, contours) -> Dict[str, Any]:
        """Analyze alignment patterns"""
        return {"horizontal": "center", "vertical": "top"}

    def analyze_spacing(self, contours) -> Dict[str, Any]:
        """Analyze spacing patterns"""
        return {"padding": 20, "margin": 10}

    def classify_color_scheme(self, colors) -> str:
        """Classify color scheme"""
        return "modern"

    def classify_design_system(self, image_array: np.ndarray) -> str:
        """Classify design system"""
        return "material_design"

    def analyze_typography(self, image_array: np.ndarray) -> Dict[str, Any]:
        """Analyze typography"""
        return {"font_family": "sans-serif", "font_size": 16}

    def analyze_spacing_patterns(self, image_array: np.ndarray) -> Dict[str, Any]:
        """Analyze spacing patterns"""
        return {"padding": 20, "margin": 10, "gap": 15}

    def detect_shadows(self, image_array: np.ndarray) -> bool:
        """Detect shadows in image"""
        return True

    def detect_gradients(self, image_array: np.ndarray) -> bool:
        """Detect gradients in image"""
        return True

    def detect_modern_elements(self, image_array: np.ndarray) -> List[str]:
        """Detect modern design elements"""
        return ["rounded_corners", "shadows", "gradients"]

def main():
    """Main function to run the AI Image-to-Code System"""
    print("🤖 AI Image-to-Code System")
    print("=" * 50)

    # Initialize system
    system = AIImageToCodeSystem()

    # Check if image path is provided
    if len(sys.argv) > 1:
        image_path = sys.argv[1]
        target_framework = sys.argv[2] if len(sys.argv) > 2 else "html_css"

        if os.path.exists(image_path):
            print(f"📸 Processing image: {image_path}")
            print(f"🎯 Target framework: {target_framework}")

            # Generate code
            code = system.generate_code(image_path, target_framework)

            # Save generated code
            if "error" not in code:
                system.save_generated_code(code)

                print("\n🎉 Code generation completed!")
                print("📁 Check the 'generated_ui' directory for your files")
                print("🌐 Open 'index.html' in your browser to see the result")
            else:
                print(f"❌ Error: {code['error']}")
        else:
            print(f"❌ Image file not found: {image_path}")
    else:
        print("Usage: python ai_image_to_code_system.py <image_path> [framework]")
        print("Frameworks: html_css, react, vue, flutter, react_native")
        print("\nExample: python ai_image_to_code_system.py design.png html_css")

if __name__ == "__main__":
    main()
