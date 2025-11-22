# Contributing to MentorHub

Thank you for your interest in contributing to MentorHub! This document provides guidelines and instructions for contributing.

## 📋 Code of Conduct

- Be respectful and inclusive
- Provide constructive feedback
- Focus on what is best for the community
- Show empathy towards other contributors

## 🚀 Getting Started

### 1. Fork the Repository

Click the "Fork" button at the top right of the repository page.

### 2. Clone Your Fork

```bash
git clone https://github.com/YOUR_USERNAME/mentor-hub.git
cd mentor-hub
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Create a Branch

```bash
git checkout -b feature/your-feature-name
```

## 💻 Development Workflow

### Running the Project

```bash
# Start all services
npm run dev

# Or start specific apps
cd apps/api && npm run dev
cd apps/web && npm run dev
```

### Code Style

We use Prettier and ESLint for code formatting and linting.

```bash
# Format code
npm run format

# Lint code
npm run lint
```

### Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:cov
```

## 📝 Commit Guidelines

We follow [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

### Examples

```bash
feat(booking): add calendar view for available slots
fix(auth): resolve token refresh issue
docs(readme): update installation instructions
```

## 🔧 Pull Request Process

1. **Update Documentation**: Update README.md or other docs if needed
2. **Add Tests**: Add tests for new features
3. **Follow Code Style**: Ensure code passes linting
4. **Update CHANGELOG**: Add entry to CHANGELOG.md (if applicable)
5. **Create PR**:
   - Use a clear, descriptive title
   - Reference related issues
   - Describe your changes
   - Add screenshots (for UI changes)

### PR Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Tests added/updated
- [ ] All tests passing
- [ ] Manual testing completed

## Screenshots (if applicable)
Add screenshots here

## Related Issues
Closes #123
```

## 🏗️ Project Structure

```
mentor-hub/
├── apps/
│   ├── api/          # NestJS backend
│   ├── web/          # Next.js frontend
│   └── telegram-bot/ # Telegram bot
├── packages/
│   ├── types/        # Shared types
│   ├── ui/           # Shared UI components
│   └── utils/        # Shared utilities
└── docs/             # Documentation
```

## 🐛 Reporting Bugs

When reporting bugs, please include:

1. **Description**: Clear description of the bug
2. **Steps to Reproduce**: Detailed steps
3. **Expected Behavior**: What should happen
4. **Actual Behavior**: What actually happens
5. **Environment**: OS, Node version, etc.
6. **Screenshots**: If applicable
7. **Logs**: Relevant error messages

## 💡 Feature Requests

When requesting features:

1. **Use Case**: Describe the problem you're trying to solve
2. **Proposed Solution**: Your suggested approach
3. **Alternatives**: Other solutions you've considered
4. **Additional Context**: Any other relevant information

## 🎯 Areas for Contribution

Good first issues:
- Documentation improvements
- UI/UX enhancements
- Adding tests
- Bug fixes
- Accessibility improvements

More advanced:
- New features
- Performance optimizations
- Security improvements
- iOS/Android apps

## 📚 Resources

- [NestJS Documentation](https://docs.nestjs.com/)
- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [React Query Documentation](https://tanstack.com/query/latest)

## ❓ Questions?

- Open a GitHub Discussion
- Join our Discord (if available)
- Email: dev@mentorhub.com

## 📜 License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing! 🎉
