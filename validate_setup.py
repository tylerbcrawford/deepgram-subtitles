#!/usr/bin/env python3
"""
Validation script for Deepgram Subtitle Generator Web UI setup.
Checks that all required files are present and basic imports work.
"""

import sys
from pathlib import Path

def check_file(path: str, description: str) -> bool:
    """Check if a file exists."""
    if Path(path).exists():
        print(f"✅ {description}: {path}")
        return True
    else:
        print(f"❌ {description} MISSING: {path}")
        return False

def check_import(module_path: str, description: str) -> bool:
    """Check if a Python module can be imported."""
    try:
        # Add paths to sys.path for testing
        sys.path.insert(0, str(Path.cwd()))
        sys.path.insert(0, str(Path.cwd() / "web"))
        
        if "/" in module_path:
            # It's a file path, try to compile it
            with open(module_path, 'r') as f:
                compile(f.read(), module_path, 'exec')
            print(f"✅ {description} syntax valid: {module_path}")
            return True
        else:
            # It's a module import
            __import__(module_path)
            print(f"✅ {description} import successful")
            return True
    except Exception as e:
        print(f"❌ {description} ERROR: {e}")
        return False

def main():
    print("=" * 70)
    print("Deepgram Subtitle Generator - Setup Validation")
    print("=" * 70)
    print()
    
    checks = []
    
    # Check core files
    print("📁 Core Files:")
    checks.append(check_file("core/transcribe.py", "Core transcription module"))
    print()
    
    # Check web files
    print("🌐 Web UI Files:")
    checks.append(check_file("web/app.py", "Flask application"))
    checks.append(check_file("web/tasks.py", "Celery tasks"))
    checks.append(check_file("web/requirements.txt", "Web requirements"))
    checks.append(check_file("web/templates/index.html", "Web UI template"))
    checks.append(check_file("web/static/app.js", "Web UI JavaScript"))
    print()
    
    # Check configuration files
    print("⚙️  Configuration Files:")
    checks.append(check_file("docker-compose.yml", "Docker Compose config"))
    checks.append(check_file(".env.example", "Environment example"))
    checks.append(check_file("Makefile", "Make commands"))
    print()
    
    # Check CLI files (should not be modified)
    print("💻 CLI Files (should be unchanged):")
    checks.append(check_file("deepgram-subtitles/generate_subtitles.py", "CLI generator"))
    checks.append(check_file("deepgram-subtitles/config.py", "CLI config"))
    checks.append(check_file("deepgram-subtitles/Dockerfile", "CLI Dockerfile"))
    print()
    
    # Check Python syntax
    print("🐍 Python Syntax Validation:")
    checks.append(check_import("core/transcribe.py", "Core module"))
    checks.append(check_import("web/app.py", "Flask app"))
    checks.append(check_import("web/tasks.py", "Celery tasks"))
    print()
    
    # Summary
    print("=" * 70)
    passed = sum(checks)
    total = len(checks)
    
    if passed == total:
        print(f"✅ All checks passed! ({passed}/{total})")
        print()
        print("Next steps:")
        print("1. Copy .env.example to .env and configure")
        print("2. Update media paths in docker-compose.yml")
        print("3. Test CLI: make build && make cli")
        print("4. Test Web UI: make web-up")
        return 0
    else:
        print(f"❌ Some checks failed ({passed}/{total} passed)")
        return 1

if __name__ == "__main__":
    sys.exit(main())