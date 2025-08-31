// Supabase Configuration
// Nashr Foundation - Supabase Integration
const SUPABASE_CONFIG = {
    // Your Supabase project URL
    url: 'https://jtuhnndwhotxjjolwcuz.supabase.io',
    
    // Your Supabase anon/public key
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp0dWhubmR3aG90eGpqb2x3Y3V6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY0NjU3MDEsImV4cCI6MjA3MjA0MTcwMX0.HJhOCxGDgDERcBfdgBQJsiGoaev5RAtX819eWuMGkhc',
    
    // Leaderboard settings
    leaderboard: {
        // Minimum amount to appear on leaderboard (in PKR)
        minAmount: 500,
        
        // Leaderboard table name in Supabase
        tableName: 'leaderboard',
        
        // Donations table name in Supabase
        donationsTableName: 'donations'
    }
};

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SUPABASE_CONFIG;
} else {
    window.SUPABASE_CONFIG = SUPABASE_CONFIG;
}
