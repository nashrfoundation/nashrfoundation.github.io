// Vercel serverless function for sending emails via Resend API
// This bypasses CORS issues by running on the server

export default async function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }
    
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }
    
    try {
        const { to, subject, html, type = 'newsletter' } = req.body;
        
        if (!to || !subject || !html) {
            return res.status(400).json({ error: 'Missing required fields: to, subject, html' });
        }
        
        // Your Resend API key
        const RESEND_API_KEY = 're_LPnRzAL8_CG6cby57HsRVguQGRYLgFCxE';
        const FROM_EMAIL = 'Nashr Foundation <no-reply@nashrfoundation.org>';
        
        // Send email via Resend API
        const response = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${RESEND_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                from: FROM_EMAIL,
                to: Array.isArray(to) ? to : [to],
                subject: subject,
                html: html
            })
        });
        
        if (!response.ok) {
            const errorText = await response.text().catch(() => '');
            throw new Error(`Resend API error: ${response.status} ${errorText}`);
        }
        
        const result = await response.json();
        
        return res.status(200).json({
            success: true,
            message: 'Email sent successfully',
            data: result
        });
        
    } catch (error) {
        console.error('Email sending error:', error);
        return res.status(500).json({
            success: false,
            error: error.message
        });
    }
}
