// Supabase Integration for Donations and Leaderboard
class SupabaseIntegration {
    constructor() {
        this.supabase = null;
        this.initializeSupabase();
    }

    initializeSupabase() {
        try {
            this.supabase = supabase.createClient(
                SUPABASE_CONFIG.url,
                SUPABASE_CONFIG.anonKey
            );
            console.log('✅ Supabase initialized successfully');
        } catch (error) {
            console.error('❌ Failed to initialize Supabase:', error);
        }
    }

    // Store donation in Supabase
    async storeDonation(donationData) {
        if (!this.supabase) {
            throw new Error('Supabase not initialized');
        }

        try {
            const { data, error } = await this.supabase
                .from(SUPABASE_CONFIG.leaderboard.donationsTableName)
                .insert([{
                    name: donationData.name,
                    email: donationData.email,
                    phone: donationData.phone,
                    amount: donationData.amount,
                    donation_type: donationData.donationType,
                    payment_method: donationData.paymentMethod,
                    payment_status: 'completed',
                    transaction_id: donationData.transactionId || `TXN_${Date.now()}`,
                    created_at: new Date().toISOString(),
                    anonymous: donationData.name === 'Anonymous',
                    leaderboard_eligible: this.isLeaderboardEligible(donationData)
                }])
                .select();

            if (error) {
                console.error('❌ Error storing donation in Supabase:', error);
                throw new Error('Failed to store donation');
            }

            console.log('✅ Donation stored in Supabase:', data[0]);
            return data[0];

        } catch (error) {
            console.error('❌ Supabase donation storage error:', error);
            throw error;
        }
    }

    // Check if donation is eligible for leaderboard
    isLeaderboardEligible(donationData) {
        // Must meet minimum amount and not be anonymous
        return donationData.amount >= SUPABASE_CONFIG.leaderboard.minAmount && 
               donationData.name !== 'Anonymous' &&
               donationData.leaderboardConsent;
    }

    // Update leaderboard with new donation
    async updateLeaderboard(donationData, supabaseDonationId) {
        if (!this.isLeaderboardEligible(donationData)) {
            console.log('ℹ️ Donation not eligible for leaderboard');
            return null;
        }

        try {
            // Check if donor already exists in leaderboard
            const { data: existingDonor } = await this.supabase
                .from(SUPABASE_CONFIG.leaderboard.tableName)
                .select('*')
                .eq('name', donationData.name)
                .single();

            if (existingDonor) {
                // Update existing donor's total
                const newTotal = existingDonor.total_amount + donationData.amount;
                const newCount = existingDonor.donation_count + 1;
                
                const { data: updatedDonor, error: updateError } = await this.supabase
                    .from(SUPABASE_CONFIG.leaderboard.tableName)
                    .update({
                        total_amount: newTotal,
                        donation_count: newCount,
                        last_donation_date: new Date().toISOString(),
                        last_donation_amount: donationData.amount,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', existingDonor.id)
                    .select()
                    .single();

                if (updateError) {
                    console.error('❌ Error updating existing donor:', updateError);
                    throw new Error('Failed to update leaderboard');
                }

                console.log('✅ Updated existing donor in leaderboard:', updatedDonor);
                return updatedDonor;

            } else {
                // Add new donor to leaderboard
                const { data: newDonor, error: insertError } = await this.supabase
                    .from(SUPABASE_CONFIG.leaderboard.tableName)
                    .insert([{
                        name: donationData.name,
                        total_amount: donationData.amount,
                        donation_count: 1,
                        first_donation_date: new Date().toISOString(),
                        last_donation_date: new Date().toISOString(),
                        last_donation_amount: donationData.amount,
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString()
                    }])
                    .select()
                    .single();

                if (insertError) {
                    console.error('❌ Error adding new donor to leaderboard:', insertError);
                    throw new Error('Failed to add to leaderboard');
                }

                console.log('✅ Added new donor to leaderboard:', newDonor);
                return newDonor;
            }

        } catch (error) {
            console.error('❌ Leaderboard update error:', error);
            throw error;
        }
    }

    // Get leaderboard data
    async getLeaderboard(limit = 50) {
        if (!this.supabase) {
            throw new Error('Supabase not initialized');
        }

        try {
            const { data, error } = await this.supabase
                .from(SUPABASE_CONFIG.leaderboard.tableName)
                .select('*')
                .order('total_amount', { ascending: false })
                .limit(limit);

            if (error) {
                console.error('❌ Error fetching leaderboard:', error);
                throw new Error('Failed to fetch leaderboard');
            }

            return data;

        } catch (error) {
            console.error('❌ Leaderboard fetch error:', error);
            throw error;
        }
    }

    // Get donation statistics
    async getDonationStats() {
        if (!this.supabase) {
            throw new Error('Supabase not initialized');
        }

        try {
            const { data, error } = await this.supabase
                .from(SUPABASE_CONFIG.leaderboard.donationsTableName)
                .select('amount, payment_status');

            if (error) {
                console.error('❌ Error fetching donation stats:', error);
                throw new Error('Failed to fetch donation stats');
            }

            const totalRaised = data
                .filter(d => d.payment_status === 'completed')
                .reduce((sum, d) => sum + d.amount, 0);

            const totalDonations = data.filter(d => d.payment_status === 'completed').length;

            return {
                totalRaised,
                totalDonations
            };

        } catch (error) {
            console.error('❌ Donation stats error:', error);
            throw error;
        }
    }

    // Process complete donation (donation + leaderboard)
    async processCompleteDonation(donationData) {
        try {
            console.log('Processing complete donation in Supabase...');
            
            // 1. Store donation
            const storedDonation = await this.storeDonation(donationData);
            
            // 2. Update leaderboard if eligible
            const leaderboardUpdate = await this.updateLeaderboard(donationData, storedDonation.id);
            
            // 3. Return complete result
            return {
                success: true,
                donation: storedDonation,
                leaderboard: leaderboardUpdate,
                message: leaderboardUpdate 
                    ? 'Donation processed and added to leaderboard!' 
                    : 'Donation processed successfully!'
            };

        } catch (error) {
            console.error('❌ Complete donation processing failed:', error);
            throw error;
        }
    }
}

// Initialize Supabase integration when page loads
document.addEventListener('DOMContentLoaded', () => {
    window.supabaseIntegration = new SupabaseIntegration();
});
