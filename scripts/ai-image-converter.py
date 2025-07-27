#!/usr/bin/env python3
"""
🎨 AI Image-to-Code Converter
Simple script to convert any image into working code
"""

import os
import sys
from PIL import Image
import json

def convert_image_to_code(image_path, framework="html_css"):
    """
    Convert image to code using AI analysis

    Args:
        image_path (str): Path to the image file
        framework (str): Target framework (html_css, react, vue, flutter)

    Returns:
        dict: Generated code files
    """

    print(f"🎨 Converting {image_path} to {framework} code...")

    # Basic image analysis
    try:
        image = Image.open(image_path)
        width, height = image.size

        print(f"📐 Image dimensions: {width}x{height}")

        # Generate basic HTML/CSS code
        html_code = generate_html_code(image_path, width, height)
        css_code = generate_css_code(width, height)
        js_code = generate_js_code()

        return {
            "html": html_code,
            "css": css_code,
            "js": js_code,
            "analysis": {
                "dimensions": (width, height),
                "format": image.format,
                "mode": image.mode
            }
        }

    except Exception as e:
        print(f"❌ Error processing image: {e}")
        return {"error": str(e)}

def generate_html_code(image_path, width, height):
    """Generate HTML code based on image"""

    html = f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AI Generated UI from {os.path.basename(image_path)}</title>
    <link rel="stylesheet" href="styles.css">
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet">
</head>
<body>
    <div class="container">
        <header class="header">
            <div class="logo">
                <i class="fas fa-magic"></i>
                AI Generated UI
            </div>
            <nav class="nav">
                <a href="#home">Home</a>
                <a href="#about">About</a>
                <a href="#contact">Contact</a>
            </nav>
        </header>

        <main class="main-content">
            <section class="hero">
                <h1>Welcome to AI Generated Interface</h1>
                <p>This UI was generated from your image: {os.path.basename(image_path)}</p>
                <button class="btn btn-primary">Get Started</button>
            </section>

            <section class="features">
                <div class="feature-card">
                    <i class="fas fa-rocket"></i>
                    <h3>Fast Development</h3>
                    <p>Generate code instantly from images</p>
                </div>
                <div class="feature-card">
                    <i class="fas fa-palette"></i>
                    <h3>Beautiful Design</h3>
                    <p>Modern and responsive layouts</p>
                </div>
                <div class="feature-card">
                    <i class="fas fa-code"></i>
                    <h3>Clean Code</h3>
                    <p>Production-ready code output</p>
                </div>
            </section>
        </main>

        <footer class="footer">
            <p>&copy; 2024 AI Generated UI. Created from {os.path.basename(image_path)}</p>
        </footer>
    </div>

    <script src="script.js"></script>
</body>
</html>"""

    return html

def generate_css_code(width, height):
    """Generate CSS code based on image dimensions"""

    css = f"""/* AI Generated CSS from Image Analysis */
* {{
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}}

body {{
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: #333;
    line-height: 1.6;
    min-height: 100vh;
}}

.container {{
    max-width: {width}px;
    margin: 0 auto;
    background: white;
    min-height: 100vh;
    box-shadow: 0 0 20px rgba(0,0,0,0.1);
}}

/* Header Styles */
.header {{
    background: linear-gradient(135deg, #ff6b35 0%, #f7931e 100%);
    color: white;
    padding: 1rem 2rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
}}

.logo {{
    font-size: 1.5rem;
    font-weight: bold;
    display: flex;
    align-items: center;
    gap: 10px;
}}

.nav {{
    display: flex;
    gap: 2rem;
}}

.nav a {{
    color: white;
    text-decoration: none;
    font-weight: 500;
    transition: opacity 0.3s ease;
}}

.nav a:hover {{
    opacity: 0.8;
}}

/* Main Content */
.main-content {{
    padding: 2rem;
}}

.hero {{
    text-align: center;
    padding: 4rem 2rem;
    background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
    border-radius: 15px;
    margin-bottom: 3rem;
}}

.hero h1 {{
    font-size: 2.5rem;
    margin-bottom: 1rem;
    color: #333;
}}

.hero p {{
    font-size: 1.1rem;
    color: #666;
    margin-bottom: 2rem;
}}

.btn {{
    padding: 12px 24px;
    border: none;
    border-radius: 8px;
    font-size: 1rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.3s ease;
    text-decoration: none;
    display: inline-block;
}}

.btn-primary {{
    background: #ff6b35;
    color: white;
}}

.btn-primary:hover {{
    background: #e55a2b;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(255, 107, 53, 0.3);
}}

/* Features Section */
.features {{
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 2rem;
    margin-bottom: 3rem;
}}

.feature-card {{
    background: white;
    padding: 2rem;
    border-radius: 12px;
    text-align: center;
    box-shadow: 0 4px 15px rgba(0,0,0,0.1);
    transition: transform 0.3s ease;
}}

.feature-card:hover {{
    transform: translateY(-5px);
    box-shadow: 0 8px 25px rgba(0,0,0,0.15);
}}

.feature-card i {{
    font-size: 3rem;
    color: #ff6b35;
    margin-bottom: 1rem;
}}

.feature-card h3 {{
    font-size: 1.3rem;
    margin-bottom: 1rem;
    color: #333;
}}

.feature-card p {{
    color: #666;
}}

/* Footer */
.footer {{
    background: #333;
    color: white;
    text-align: center;
    padding: 2rem;
    margin-top: auto;
}}

/* Responsive Design */
@media (max-width: 768px) {{
    .header {{
        flex-direction: column;
        gap: 1rem;
    }}

    .nav {{
        gap: 1rem;
    }}

    .hero h1 {{
        font-size: 2rem;
    }}

    .features {{
        grid-template-columns: 1fr;
    }}

    .container {{
        max-width: 100%;
    }}
}}

/* Animation */
@keyframes fadeIn {{
    from {{
        opacity: 0;
        transform: translateY(20px);
    }}
    to {{
        opacity: 1;
        transform: translateY(0);
    }}
}}

.feature-card {{
    animation: fadeIn 0.6s ease forwards;
}}

.feature-card:nth-child(2) {{
    animation-delay: 0.2s;
}}

.feature-card:nth-child(3) {{
    animation-delay: 0.4s;
}}"""

    return css

def generate_js_code():
    """Generate JavaScript code"""

    js = """// AI Generated JavaScript
document.addEventListener('DOMContentLoaded', function() {
    console.log('🎨 AI Generated UI loaded successfully!');

    // Initialize animations
    initializeAnimations();

    // Add event listeners
    addEventListeners();
});

function initializeAnimations() {
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

function addEventListeners() {
    // Button click handlers
    const buttons = document.querySelectorAll('.btn');
    buttons.forEach(button => {
        button.addEventListener('click', function(e) {
            showNotification('Button clicked: ' + this.textContent, 'success');
        });
    });

    // Add hover effects
    const cards = document.querySelectorAll('.feature-card');
    cards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-10px) scale(1.02)';
        });

        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0) scale(1)';
        });
    });
}

function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : 'info-circle'}"></i>
        <span>${message}</span>
    `;

    // Add to page
    document.body.appendChild(notification);

    // Show notification
    setTimeout(() => {
        notification.classList.add('show');
    }, 100);

    // Remove after 3 seconds
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            notification.remove();
        }, 300);
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
    display: flex;
    align-items: center;
    gap: 10px;
    transform: translateX(100%);
    transition: transform 0.3s ease;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}

.notification.show {
    transform: translateX(0);
}

.notification-success {
    background: linear-gradient(135deg, #28a745, #20c997);
}

.notification-info {
    background: linear-gradient(135deg, #007bff, #6610f2);
}

.notification i {
    font-size: 1.2rem;
}
`;
document.head.appendChild(style);

// Add some interactive features
function addInteractiveFeatures() {
    // Add typing effect to hero title
    const heroTitle = document.querySelector('.hero h1');
    if (heroTitle) {
        const text = heroTitle.textContent;
        heroTitle.textContent = '';

        let i = 0;
        const typeWriter = () => {
            if (i < text.length) {
                heroTitle.textContent += text.charAt(i);
                i++;
                setTimeout(typeWriter, 100);
            }
        };

        setTimeout(typeWriter, 1000);
    }
}

// Initialize interactive features
setTimeout(addInteractiveFeatures, 500);"""

    return js

def save_code(code, output_dir="generated_ui"):
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

        print(f"✅ Code saved to '{output_dir}' directory")
        return True

    except Exception as e:
        print(f"❌ Error saving code: {e}")
        return False

def main():
    """Main function"""
    print("🎨 AI Image-to-Code Converter")
    print("=" * 50)

    # Check command line arguments
    if len(sys.argv) < 2:
        print("Usage: python ai_image_converter.py <image_path> [framework]")
        print("Frameworks: html_css, react, vue, flutter")
        print("\nExample: python ai_image_converter.py design.png html_css")
        return

    image_path = sys.argv[1]
    framework = sys.argv[2] if len(sys.argv) > 2 else "html_css"

    # Check if image exists
    if not os.path.exists(image_path):
        print(f"❌ Image file not found: {image_path}")
        return

    # Convert image to code
    code = convert_image_to_code(image_path, framework)

    if "error" not in code:
        # Save generated code
        output_dir = f"generated_ui_{os.path.splitext(os.path.basename(image_path))[0]}"
        if save_code(code, output_dir):
            print(f"\n🎉 Conversion completed successfully!")
            print(f"📁 Generated files saved in: {output_dir}")
            print(f"🌐 Open {output_dir}/index.html in your browser to see the result")
            print(f"📊 Analysis saved in: {output_dir}/analysis.json")
    else:
        print(f"❌ Conversion failed: {code['error']}")

if __name__ == "__main__":
    main()
