# Contribution Guidelines

Welcome to the project! Please read these ground rules before submitting any code.

## 1. Branching Strategy
* **`main` Branch:** Represents production-ready, working code. **Never push directly to `main`.**
* **Feature Branches:** Always create a new branch from `main` for any task:
  * Format: `feature/<feature-name>` (e.g., `feature/login-page`, `feature/database-setup`)
  * Bug fixes: `fix/<bug-name>`

## 2. Development Workflow
1. Pull the latest `main` code before starting:
   ```bash
   git checkout main
   git pull origin main

---

## Step 3: Protect the `main` Branch (Recommended)

To enforce the rule that no one can accidentally push broken code directly to `main`:

1. Go to **Settings** $\rightarrow$ **Branches** (under *Code and automation*).
2. Click **Add branch ruleset** (or **Add branch protection rule**).
3. Set **Branch name pattern** to `main`.
4. Check **Require a pull request before merging**.
5. Save changes.

<ElicitationsGroup message="Would you like assistance with any of these next steps?">

{/* Reason: Offers relevant follow-up options for setting up git workflow or automating GitHub tasks. */}

  <Elicitation label="Learn Git command-line basics for team workflow" query="Show me the step-by-step Git terminal commands for creating a branch, making changes, and opening a Pull Request."/>
  <Elicitation label="Generate a complete README.md template" query="Generate a professional README.md template for our web development project."/>
  <Elicitation label="Set up GitHub Issues and Projects board" query="How do we set up GitHub Issues and a Project Board to track our team's task list?"/>
</ElicitationsGroup>
