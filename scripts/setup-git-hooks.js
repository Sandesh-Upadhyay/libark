#!/usr/bin/env node

/**
 * 🔧 Git Hooks Setup Script
 * 
 * Pre-push hookを設定して、mainブランチへのプッシュ前に自動検証を実行
 */

import { writeFileSync, chmodSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

const GIT_HOOKS_DIR = '.git/hooks';
const PRE_PUSH_HOOK_PATH = join(GIT_HOOKS_DIR, 'pre-push');

const PRE_PUSH_HOOK_CONTENT = `#!/bin/sh

# Pre-push hook for LibArk
# Runs validation before pushing to main branch

echo "🔍 Running pre-push validation..."

# Execute Docker-based pre-push validation script
bash scripts/pre-push-ci.sh "$@"

# Exit with the same code as the validation script
exit $?
`;

function setupPrePushHook() {
  try {
    // Ensure .git/hooks directory exists
    if (!existsSync(GIT_HOOKS_DIR)) {
      mkdirSync(GIT_HOOKS_DIR, { recursive: true });
    }

    // Write the pre-push hook
    writeFileSync(PRE_PUSH_HOOK_PATH, PRE_PUSH_HOOK_CONTENT);
    
    // Make the hook executable
    chmodSync(PRE_PUSH_HOOK_PATH, 0o755);
    
    console.log('✅ Pre-push hook installed successfully');
    console.log(`📍 Hook location: ${PRE_PUSH_HOOK_PATH}`);
    console.log('🚀 Now all pushes to main branch will be validated automatically');
    
    return true;
  } catch (error) {
    console.error('❌ Failed to setup pre-push hook:', error.message);
    return false;
  }
}

function main() {
  console.log('🔧 Setting up Git hooks...');
  
  if (!existsSync('.git')) {
    console.error('❌ Not a Git repository. Please run this script from the project root.');
    process.exit(1);
  }
  
  if (setupPrePushHook()) {
    console.log('\n🎉 Git hooks setup completed!');
    console.log('\nNext steps:');
    console.log('1. Test the hook: git push origin main');
    console.log('2. The validation will run automatically before push');
    console.log('3. Push will be blocked if validation fails');
  } else {
    console.error('\n💥 Git hooks setup failed!');
    process.exit(1);
  }
}

main();
