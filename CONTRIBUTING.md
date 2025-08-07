# Contributing to the Foundry VTT Cosmere RPG system

Thank you for your interest in contributing to the Foundry VTT Cosmere RPG system! We welcome contributions from everyone, whether you're new to open source or a seasoned contributor. We are active on the [Metalworks Discord](https://discord.gg/bwXe6phJTp) server, a dedicated server for development of the Cosmere RPG Foundry VTT system, where you can connect with other developers, ask questions, and stay up-to-date with the project's progress.

If you encounter any bugs or have ideas for new features, please create an [Issue](https://github.com/the-metalworks/cosmere-rpg/issues) to let us know. We encourage you to participate in discussions and contribute your ideas.

## How can I help?

To start contributing, [fork the repository](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/working-with-forks/fork-a-repo) to create a copy of the project under your GitHub account. This will allow you to make changes without affecting the original project. After forking, clone your fork to your local machine to begin working on it.

### I have forked the project, now what?

The Foundry VTT Cosmere RPG system is built using TypeScript and bundled with Rollup. Here's how you can set up the project locally:

1. **Install Node.js and npm:** You'll need to install Node.js (v20) and npm to manage dependencies and run build scripts. If you haven't installed them yet, follow the instructions [here](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm).
2. **Install dependencies:** navigate to the project folder in your terminal and install the necessary dependencies by running `npm install`.
3. **Build the project:** To build the project, you can run `npm run build` for a single build, or `npm run build:watch` to watch for changes and rebuild automatically.
4. **Testing your changes:** To test your build on your local Foundry instance, you'll need to copy the build folder to your Foundry data/system folder. However, a more efficient method is to set up a symbolic link by using: `npm run link` and following the instructions.

##### Oh no! The execution of scripts is disabled on my system (`npm install` error on windows)

1. Open Windows PowerShell with Run as Administrator
2. Run: `Set-ExecutionPolicy RemoteSigned`

##### What is a symbolic link?

A symbolic link is a pointer that allows you to reference a folder or file from another location on your system. In this context, it links your project's build output to the appropriate Foundry system folder, so you don’t need to manually copy files every time you make changes.

### What do I work on?

Explore the [Issues](https://github.com/stanavdb/cosmere-rpg/issues) page to find something to work on. If you have a new idea or bug that isn’t listed, feel free to create a new issue.

When you find an issue you'd like to work on, leave a comment to let others know you're working on it. The issue will then be assigned to you.

#### Work on the correct branch

If the issue is part of a milestone, work on the specific branch for that milestone. Otherwise, you can work from the main branch.

##### Help! I'm getting errors when I try to commit my changes

This project uses ESLint to enforce consistent code style. When you commit your changes, all staged files are automatically linted. If you encounter linting errors, you can manually run:

-   `npm run lint` To check for linting issues
-   `npm run lint:fix` To automatically fix fixable issues

### Submitting your work

Once your changes are ready, [create a pull request](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/proposing-changes-to-your-work-with-pull-requests/creating-a-pull-request-from-a-for) (PR) from your fork. Make sure to [link it to the relevant issue](https://docs.github.com/en/issues/tracking-your-work-with-issues/linking-a-pull-request-to-an-issue) so that everyone knows what the PR is addressing.

When you submit a PR, automated checks will run to ensure your code adheres to the project's style guidelines. These checks should pass as long as you haven’t done anything _weird_ to the project.

Request a review from a maintainer once your PR is ready. If everything looks good, your changes will be merged into the project.

##### A note on PR sizes

Large pull requests are difficult to review and can slow down the development process. Whenever possible, break your work into smaller, more manageable PRs, even if that means submitting multiple PRs to close a single issue.

## Issues

### Creating new Issues

Before creating a new issue, please ensure that it hasn’t already been reported. Issues assigned to milestones, especially release milestones, will be prioritized.

### Reporting bugs

-   **Reproduce the Bug:** Before reporting a bug, make sure you can reproduce it without any other modules active in Foundry.
-   **Provide Detailed Information:** When reporting a bug, include step-by-step instructions to reproduce it, along with details on what you expected to happen and what actually occurred.  
    &nbsp;

---

&nbsp;  
By following these guidelines, you’ll help maintain the quality of the Foundry VTT Cosmere RPG system and ensure that the project continues to grow in a sustainable way. Thank you for contributing!
