/**
 * School data now lives in Supabase schema edusmart.
 * The SQL in supabase/fresh was already applied. This script no longer
 * rebuilds those files from src/data.
 */
console.error('School data lives in Supabase schema edusmart. supabase/fresh is the applied schema.');
process.exit(1);
