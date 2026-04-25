import subprocess
import os

def run_farm(args):
    """Helper to run farm CLI commands."""
    env = os.environ.copy()
    env["FARM_DATABASE_URL"] = "sqlite:///test_smoke.db"
    result = subprocess.run(
        ["python3", "-m", "farm.main"] + args,
        env=env,
        capture_output=True,
        text=True
    )
    return result

def test_smoke():
    print("🚀 Starting Smoke Test...")
    
    # Clean up old test db
    if os.path.exists("test_smoke.db"):
        os.remove("test_smoke.db")

    # 1. Add an agent
    print("Adding agent...")
    res = run_farm(["add", "test-1", "Test Agent", "ollama"])
    assert "Success!" in res.stdout
    assert "Test Agent" in res.stdout

    # 2. List agents
    print("Listing agents...")
    res = run_farm(["list"])
    assert "test-1" in res.stdout
    assert "Test Agent" in res.stdout

    # 3. Check status
    print("Checking status...")
    res = run_farm(["status"])
    assert "Test Agent" in res.stdout
    assert "100%" in res.stdout  # Energy

    # 4. Remove agent
    print("Removing agent...")
    res = run_farm(["remove", "test-1"])
    assert "Removed" in res.stdout

    # 5. Verify empty
    res = run_farm(["list"])
    assert "The farm is empty" in res.stdout

    print("✅ Smoke Test Passed!")

if __name__ == "__main__":
    try:
        test_smoke()
    finally:
        if os.path.exists("test_smoke.db"):
            os.remove("test_smoke.db")
