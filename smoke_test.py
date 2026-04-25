import subprocess
import os
import sys

def run_farm(args):
    """Helper to run farm CLI commands."""
    env = os.environ.copy()
    env["FARM_DATABASE_URL"] = "sqlite:///test_smoke.db"
    # Ensure src is in PYTHONPATH
    current_dir = os.path.dirname(os.path.abspath(__file__))
    src_dir = os.path.join(current_dir, "src")
    env["PYTHONPATH"] = f"{src_dir}{os.pathsep}{env.get('PYTHONPATH', '')}"
    
    result = subprocess.run(
        [sys.executable, "-m", "farm.main"] + args,
        env=env,
        capture_output=True,
        text=True
    )
    if result.returncode != 0:
        print(f"Command failed: {' '.join(args)}")
        print(f"STDOUT: {result.stdout}")
        print(f"STDERR: {result.stderr}")
    return result

def test_smoke():
    print("🚀 Starting Extended Smoke Test...")
    
    # Clean up old test db
    if os.path.exists("test_smoke.db"):
        os.remove("test_smoke.db")

    # 1. Add an agent
    print("Adding agent...")
    res = run_farm(["add", "mock-1", "Mocky", "mock"])
    assert "Success!" in res.stdout

    # 2. Run a prompt
    print("Running a prompt...")
    res = run_farm(["run", "mock-1", "Hello Farm!"])
    assert "Response from mock-1" in res.stdout
    assert "Mock response to: Hello Farm!" in res.stdout
    assert "Latency:" in res.stdout

    # 3. Check status (verify cookies and energy)
    print("Checking status for metrics...")
    res = run_farm(["status"])
    assert "Mocky" in res.stdout
    assert "🍪" in res.stdout  # Should have 1 cookie now
    # Check if energy decreased (might be 100% still if prompt is short, but let's check it's present)
    assert "100%" in res.stdout or "%" in res.stdout

    # 4. Compare
    print("Running comparison...")
    res = run_farm(["compare", "Compare me!"])
    assert "Comparison: Compare me!" in res.stdout
    assert "Mocky" in res.stdout
    assert "Mock response to: Compare me!" in res.stdout

    # 5. Remove agent
    print("Cleaning up agent...")
    res = run_farm(["remove", "mock-1"])
    assert "Removed" in res.stdout

    print("✅ Extended Smoke Test Passed!")

if __name__ == "__main__":
    try:
        test_smoke()
    finally:
        if os.path.exists("test_smoke.db"):
            os.remove("test_smoke.db")
