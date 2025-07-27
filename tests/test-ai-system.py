#!/usr/bin/env python3
"""
🧪 Test AI Image-to-Code System
Simple test to demonstrate the system functionality
"""

import os
import sys
from PIL import Image, ImageDraw, ImageFont
import numpy as np

def create_test_image():
    """Create a test image to demonstrate the system"""
    # Create a simple UI mockup
    width, height = 800, 600
    image = Image.new('RGB', (width, height), color='#f8f9fa')
    draw = ImageDraw.Draw(image)

    # Draw header
    draw.rectangle([0, 0, width, 80], fill='#007bff')
    draw.text((20, 30), "Sample UI Design", fill='white', font=None)

    # Draw navigation
    nav_items = ["Home", "Products", "About", "Contact"]
    for i, item in enumerate(nav_items):
        x = 200 + i * 100
        draw.rectangle([x, 20, x + 80, 60], fill='#0056b3', outline='white')
        draw.text((x + 10, 30), item, fill='white', font=None)

    # Draw main content area
    draw.rectangle([20, 100, width - 20, height - 100], fill='white', outline='#dee2e6')

    # Draw some buttons
    draw.rectangle([50, 150, 150, 190], fill='#28a745', outline='#1e7e34')
    draw.text((70, 160), "Button 1", fill='white', font=None)

    draw.rectangle([200, 150, 300, 190], fill='#dc3545', outline='#c82333')
    draw.text((220, 160), "Button 2", fill='white', font=None)

    # Draw input field
    draw.rectangle([50, 220, 350, 260], fill='white', outline='#ced4da')
    draw.text((60, 230), "Enter text here...", fill='#6c757d', font=None)

    # Draw some text
    draw.text((50, 300), "Welcome to our application!", fill='#333', font=None)
    draw.text((50, 330), "This is a sample UI design for testing.", fill='#666', font=None)

    # Draw footer
    draw.rectangle([0, height - 60, width, height], fill='#343a40')
    draw.text((20, height - 40), "© 2024 Sample App", fill='white', font=None)

    return image

def test_ai_system():
    """Test the AI image-to-code system"""
    print("🧪 Testing AI Image-to-Code System")
    print("=" * 50)

    # Create test image
    print("📸 Creating test image...")
    test_image = create_test_image()
    test_image_path = "test_ui_design.png"
    test_image.save(test_image_path)
    print(f"✅ Test image saved as: {test_image_path}")

    # Import and test the AI system
    try:
        from ai_image_to_code_system import AIImageToCodeSystem

        print("\n🤖 Initializing AI system...")
        system = AIImageToCodeSystem()

        print("🔍 Analyzing test image...")
        analysis = system.analyze_image(test_image_path)

        print("📊 Analysis results:")
        print(f"  - Image dimensions: {analysis.get('dimensions', 'Unknown')}")
        print(f"  - Layout type: {analysis.get('layout', {}).get('layout_type', 'Unknown')}")
        print(f"  - Components detected: {len(analysis.get('components', []))}")
        print(f"  - Colors found: {len(analysis.get('colors', {}).get('dominant_colors', []))}")

        print("\n💻 Generating code...")
        code = system.generate_code(test_image_path, "html_css")

        if "error" not in code:
            print("✅ Code generation successful!")

            # Save generated code
            output_dir = "test_generated_ui"
            system.save_generated_code(code, output_dir)

            print(f"\n🎉 Test completed successfully!")
            print(f"📁 Generated files saved in: {output_dir}")
            print(f"🌐 Open {output_dir}/index.html in your browser to see the result")

            return True
        else:
            print(f"❌ Code generation failed: {code['error']}")
            return False

    except ImportError as e:
        print(f"❌ Could not import AI system: {e}")
        print("Make sure all required packages are installed")
        return False
    except Exception as e:
        print(f"❌ Test failed: {e}")
        return False

def main():
    """Main test function"""
    print("🚀 AI Image-to-Code System Test")
    print("=" * 50)

    success = test_ai_system()

    if success:
        print("\n✅ All tests passed!")
        print("🎯 The AI system is ready to convert your images to code!")
    else:
        print("\n❌ Tests failed!")
        print("🔧 Please check the installation and try again")

if __name__ == "__main__":
    main()
